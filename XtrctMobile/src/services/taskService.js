// src/services/TaskService.js

import { 

  collection, query, where, orderBy, getDocs, addDoc, doc, 

  getDoc, updateDoc, writeBatch, serverTimestamp, limit 

} from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { firebaseService } from 'src/config/firebaseConfig';

import { fileParsingService } from 'src/services/fileParsingService';


import { anthropicService } from 'src/services/AnthropicService';

import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

import { DateTime } from 'luxon';



class TaskService {

  constructor() {

    this.db = firebaseService.db;

    this.tasksRef = collection(this.db, 'tasks');

    this.TaskAnalyticsRef = collection(this.db, 'TaskAnalytics');

    this.BATCH_SIZE = 500;

    this.OFFLINE_PREFIX = '@task_offline_';

  }



  async fetchUserTasks(userId, filters = {}) {

    try {

      // Try to get cached tasks first

      const cachedTasks = await this.getCachedTasks(userId);

      if (!navigator.onLine && cachedTasks) {

        return this.applyFilters(cachedTasks, filters);

      }



      let queryConstraints = [

        where('userId', '==', userId),

        orderBy('createdAt', 'desc')

      ];



      // Apply sophisticated filtering

      if (filters.status) {

        queryConstraints.push(where('status', '==', filters.status));

      }

      if (filters.priority) {

        queryConstraints.push(where('priority', '==', filters.priority));

      }

      if (filters.category) {

        queryConstraints.push(where('category', '==', filters.category));

      }

      if (filters.dueBefore) {

        queryConstraints.push(where('dueDate', '<=', filters.dueBefore));

      }

      if (filters.dueAfter) {

        queryConstraints.push(where('dueDate', '>=', filters.dueAfter));

      }

      if (filters.tags && filters.tags.length) {

        queryConstraints.push(where('tags', 'array-contains-any', filters.tags));

      }

      if (filters.limit) {

        queryConstraints.push(limit(filters.limit));

      }



      const queryRef = query(this.tasksRef, ...queryConstraints);

      const querySnapshot = await getDocs(queryRef);

      

      const tasks = querySnapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data(),

        dueDate: doc.data().dueDate?.toDate(),

        createdAt: doc.data().createdAt?.toDate(),

        updatedAt: doc.data().updatedAt?.toDate()

      }));



      // Cache tasks

      await this.cacheTasks(userId, tasks);



      // Enrich tasks with analytics if requested

      if (filters.includeAnalytics) {

        return await this.enrichTasksWithAnalytics(tasks);

      }



      return tasks;

    } catch (error) {

      appMonitor.logError(error, { context: 'fetch_tasks', userId });

      

      // Return cached tasks if available

      const cachedTasks = await this.getCachedTasks(userId);

      if (cachedTasks) {

        return this.applyFilters(cachedTasks, filters);

      }

      

      throw error;

    }

  }



  async createTask(taskData, files = []) {

    try {

      // Process files with Claude

      const fileAnalyses = await Promise.all(

        files.map(async file => {

          const parsedFile = await fileParsingService.parseFile(file);

          const analysis = await anthropicService.processFile(parsedFile.content);

          return { file, analysis };

        })

      );



      // Enhance task data

      const enhancedTaskData = await this.enhanceTaskData(taskData, fileAnalyses);



      // Create task document

      const newTask = {

        ...enhancedTaskData,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        status: taskData.status || 'pending',

        files: fileAnalyses.map(fa => ({

          filename: fa.file.name,

          fileType: fa.file.type,

          size: fa.file.size,

          analysis: fa.analysis

        }))

      };



      // Handle offline creation

      if (!navigator.onLine) {

        const offlineTask = {

          ...newTask,

          id: `offline_${Date.now()}`,

          pendingSync: true

        };

        await this.saveOfflineTask(offlineTask);

        return offlineTask;

      }



      // Create task and analytics in batch

      const batch = writeBatch(this.db);

      const taskRef = doc(this.tasksRef);

      batch.set(taskRef, newTask);



      // Add analytics

      const analyticsRef = doc(this.TaskAnalyticsRef, taskRef.id);

      batch.set(analyticsRef, {

        taskId: taskRef.id,

        userId: taskData.userId,

        createdAt: serverTimestamp(),

        estimatedDuration: enhancedTaskData.estimatedDuration,

        priority: enhancedTaskData.priority,

        complexity: this._calculateComplexity(enhancedTaskData),

        dependencies: enhancedTaskData.dependencies || [],

        risks: enhancedTaskData.risks || [],

        tags: enhancedTaskData.tags || [],

        sentiment: enhancedTaskData.sentiment

      });



      await batch.commit();



      return {

        id: taskRef.id,

        ...newTask,

        analytics: {

          complexity: this._calculateComplexity(enhancedTaskData),

          risks: enhancedTaskData.risks || []

        }

      };

    } catch (error) {

      appMonitor.logError(error, { 

        context: 'create_task',

        userId: taskData.userId 

      });

      throw error;

    }

  }



  async updateTaskStatus(taskId, status, additionalData = {}) {

    try {

      const taskRef = doc(this.tasksRef, taskId);

      const taskDoc = await getDoc(taskRef);



      if (!taskDoc.exists()) {

        throw new Error('Task not found');

      }



      const taskData = taskDoc.data();

      const updates = {

        status,

        updatedAt: serverTimestamp(),

        ...additionalData

      };



      // Analyze completion data

      if (status === 'completed') {

        const completionAnalysis = await this._analyzeCompletion(taskData);

        updates.completionAnalysis = completionAnalysis;



        // Update task analytics

        const analyticsRef = doc(this.TaskAnalyticsRef, taskId);

        await updateDoc(analyticsRef, {

          completedAt: serverTimestamp(),

          actualDuration: completionAnalysis.actualDuration,

          durationVariance: completionAnalysis.variance,

          efficiencyScore: completionAnalysis.efficiencyScore

        });

      }



      await updateDoc(taskRef, updates);



      return {

        id: taskId,

        ...taskData,

        ...updates

      };

    } catch (error) {

      console.error('Error updating task status:', error);

      throw new Error(`Failed to update task status: ${error.message}`);

    }

  }



  async getTaskStatistics(userId) {

    try {

      const tasks = await this.fetchUserTasks(userId, { includeAnalytics: true });

      const now = DateTime.now();



      const statistics = {

        total: tasks.length,

        byStatus: this._groupBy(tasks, 'status'),

        byPriority: this._groupBy(tasks, 'priority'),

        byCategory: this._groupBy(tasks, 'category'),

        completion: {

          rate: tasks.length ? 

            (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,

          onTime: tasks.filter(t => 

            t.status === 'completed' && 

            t.completionAnalysis?.completedAt <= t.dueDate

          ).length,

          overdue: tasks.filter(t => 

            t.status === 'completed' && 

            t.completionAnalysis?.completedAt > t.dueDate

          ).length

        },

        timing: {

          averageCompletionTime: this._calculateAverageCompletionTime(tasks),

          averageTimeToStart: this._calculateAverageTimeToStart(tasks),

          estimationAccuracy: this._calculateEstimationAccuracy(tasks)

        },

        workload: {

          current: tasks.filter(t => t.status !== 'completed').length,

          due: {

            today: tasks.filter(t => 

              t.status !== 'completed' && 

              DateTime.fromJSDate(t.dueDate).hasSame(now, 'day')

            ).length,

            thisWeek: tasks.filter(t => 

              t.status !== 'completed' && 

              DateTime.fromJSDate(t.dueDate).hasSame(now, 'week')

            ).length

          }

        },

        trends: await this._calculateTrends(userId, tasks)

      };



      return statistics;

    } catch (error) {

      console.error('Error getting task statistics:', error);

      throw new Error(`Failed to get task statistics: ${error.message}`);

    }

  }



  // Private helper methods



  async _enhanceTaskData(taskData, fileAnalyses) {

    if (fileAnalyses.length === 0) return taskData;



    // Combine all analyses

    const combinedAnalysis = fileAnalyses.reduce((acc, curr) => ({

      tasks: [...(acc.tasks || []), ...(curr.analysis.tasks || [])],

      priority: this._getHighestPriority(acc.priority, curr.analysis.priority?.level),

      timeframe: this._getMostUrgentTimeframe(acc.timeframe, curr.analysis.timeframe?.timeframe),

      entities: this._mergeEntities(acc.entities || {}, curr.analysis.entities || {}),

      sentiment: (acc.sentiment || 0) + (curr.analysis.sentiment || 0),

      dates: [...(acc.dates || []), ...(curr.analysis.dates || [])],

      suggestions: [...(acc.suggestions || []), ...(curr.analysis.suggestions || [])],

      risks: [...(acc.risks || []), ...(curr.analysis.risks || [])]

    }), {});



    // Normalize sentiment

    combinedAnalysis.sentiment /= fileAnalyses.length;



    return {

      ...taskData,

      priority: taskData.priority || combinedAnalysis.priority,

      dueDate: taskData.dueDate || this._calculateDueDate(combinedAnalysis),

      estimatedDuration: taskData.estimatedDuration || this._estimateDuration(combinedAnalysis),

      tags: [...new Set([...(taskData.tags || []), ...this._extractTags(combinedAnalysis)])],

      dependencies: this._identifyDependencies(combinedAnalysis),

      risks: combinedAnalysis.risks,

      sentiment: combinedAnalysis.sentiment,

      entities: combinedAnalysis.entities,

      suggestedStartDate: this._calculateStartDate(combinedAnalysis)

    };

  }



  _calculateComplexity(taskData) {

    const factors = {

      subtasks: (taskData.subtasks?.length || 0) * 0.2,

      dependencies: (taskData.dependencies?.length || 0) * 0.3,

      files: (taskData.files?.length || 0) * 0.1,

      estimatedDuration: taskData.estimatedDuration ? Math.min(taskData.estimatedDuration / 480, 1) * 0.2.

      risks: (taskData.risks?.length || 0) * 0.2

    };



    return Math.min(

      Object.values(factors).reduce((sum, value) => sum + value, 0),

      1

    );

  }



  async _analyzeCompletion(taskData) {

    const startTime = taskData.createdAt.toDate();

    const completionTime = new Date();

    const actualDuration = (completionTime - startTime) / (1000 * 60);



    const analysis = {

      completedAt: completionTime,

      actualDuration,

      estimatedDuration: taskData.estimatedDuration,

      variance: taskData.estimatedDuration ? actualDuration - taskData.estimatedDuration : null,

      efficiencyScore: this._calculateEfficiencyScore(

        actualDuration,

        taskData.estimatedDuration,

        taskData.complexity || 0.5

      )

    };



    return analysis;

  }



  // Helper methods for calculations

  _calculateEfficiencyScore(actual, estimated, complexity) {

    if (!estimated) return null;

    const variance = Math.abs(actual - estimated) / estimated;

    return Math.max(0, 1 - (variance * (1 + complexity)));

  }



  _groupBy(array, key) {

    return array.reduce((acc, item) => {

      const value = item[key] || 'undefined';

      acc[value] = (acc[value] || 0) + 1;

      return acc;

    }, {});

  }



  _getHighestPriority(p1, p2) {

    const priorities = { high: 3, medium: 2, low: 1 };

    if (!p1) return p2;

    if (!p2) return p1;

    return priorities[p1] >= priorities[p2] ? p1 : p2;

  }



  _getMostUrgentTimeframe(t1, t2) {

    const urgency = { immediate: 3, soon: 2, scheduled: 1 };

    if (!t1) return t2;

    if (!t2) return t1;

    return urgency[t1] >= urgency[t2] ? t1 : t2;

  }



  _mergeEntities(e1, e2) {

    const merged = {};

    for (const key of new Set([...Object.keys(e1), ...Object.keys(e2)])) {

      merged[key] = [...new Set([...(e1[key] || []), ...(e2[key] || [])])];

    }

    return merged;

  }



  // Cache management

  async cacheTasks(userId, tasks) {

    try {

      await AsyncStorage.setItem(

        `@tasks_${userId}`,

        JSON.stringify({

          tasks,

          timestamp: Date.now()

        })

      );

    } catch (error) {

      appMonitor.logError(error, { context: 'cache_tasks' });

    }

  }



  async getCachedTasks(userId) {

    try {

      const cached = await AsyncStorage.getItem(`@tasks_${userId}`);

      if (cached) {

        const { tasks, timestamp } = JSON.parse(cached);

        // Cache valid for 5 minutes

        if (Date.now() - timestamp < 5 * 60 * 1000) {

          return tasks;

        }

      }

      return null;

    } catch (error) {

      appMonitor.logError(error, { context: 'get_cached_tasks' });

      return null;

    }

  }



  // Offline support

  async saveOfflineTask(task) {

    try {

      const offlineTasks = await this.getOfflineTasks();

      offlineTasks.push(task);

      await AsyncStorage.setItem(

        this.OFFLINE_PREFIX + task.userId,

        JSON.stringify(offlineTasks)

      );

    } catch (error) {

      appMonitor.logError(error, { context: 'save_offline_task' });

    }

  }



  async syncOfflineTasks() {

    if (!navigator.onLine) return;



    try {

      const offlineTasks = await this.getOfflineTasks();

      if (!offlineTasks.length) return;



      const batch = writeBatch(this.db);

      

      for (const task of offlineTasks) {

        const taskRef = doc(this.tasksRef);

        const { id, pendingSync, ...taskData } = task;

        batch.set(taskRef, taskData);

      }



      await batch.commit();

      await AsyncStorage.removeItem(this.OFFLINE_PREFIX + offlineTasks[0].userId);

    } catch (error) {

      appMonitor.logError(error, { context: 'sync_offline_tasks' });

    }

  }



  // Export for testing

  static getInstance() {

    return taskService;

  }

}



// Export singleton instance

export const taskService = new TaskService();
