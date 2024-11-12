// src/models/task.js

import { 

  collection, 

  addDoc, 

  getDoc, 

  getDocs, 

  updateDoc, 

  deleteDoc, 

  doc, 

  query, 

  where, 

  orderBy 

} from 'firebase/firestore';

import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { firebaseService } from 'src/config/firebaseConfig';

import { anthropicService } from 'src/services/AnthropicService';

import { TaskStatus, PriorityLevels, TaskConfig } from 'src/config/constants';



class TaskModel {

  constructor() {

    this.db = firebaseService.db;

    this.tasksRef = collection(this.db, 'tasks');

    this.offlineCache = new Map();

  }



  /**

   * Create a new task with offline support

   */

  async createTask(taskData) {

    try {

      // Validate task data

      this.validateTaskData(taskData);



      // Generate temporary ID for offline support

      const tempId = `temp_${Date.now()}`;

      const timestamp = new Date().toISOString();



      // Process with Claude for smart defaults

      const enhancedData = await anthropicService.processTask({

        ...taskData,

        id: tempId,

        status: TaskStatus.PENDING.id,

        createdAt: timestamp,

        updatedAt: timestamp,

        platform: Platform.OS,

        offlineCreated: true

      });



      // Store in offline cache

      await AsyncStorage.setItem(

        `task_${tempId}`,

        JSON.stringify(enhancedData)

      );



      // Try to sync with Firestore if online

      try {

        const docRef = await addDoc(this.tasksRef, enhancedData);

        const taskDoc = await getDoc(docRef);

        

        // Remove from offline cache

        await AsyncStorage.removeItem(`task_${tempId}`);

        

        return {

          id: taskDoc.id,

          ...taskDoc.data()

        };

      } catch (error) {

        // Keep in offline cache if sync fails

        console.log('Task will sync when online:', error);

        return enhancedData;

      }

    } catch (error) {

      console.error('Error creating task:', error);

      throw error;

    }

  }



  /**

   * Fetch tasks with offline support

   */

  async fetchTasks(userId, filters = {}) {

    try {

      // Get offline tasks first

      const offlineTasks = await this.getOfflineTasks();



      // Try to fetch online tasks

      try {

        let queryRef = query(

          this.tasksRef,

          where('userId', '==', userId)

        );



        // Apply filters

        if (filters.status) {

          queryRef = query(queryRef, where('status', '==', filters.status));

        }

        if (filters.priority) {

          queryRef = query(queryRef, where('priority', '==', filters.priority));

        }

        if (filters.category) {

          queryRef = query(queryRef, where('category', '==', filters.category));

        }



        // Apply sorting

        if (filters.sortBy) {

          queryRef = query(queryRef, orderBy(filters.sortBy, filters.sortDirection || 'desc'));

        } else {

          queryRef = query(queryRef, orderBy('createdAt', 'desc'));

        }



        const snapshot = await getDocs(queryRef);

        const onlineTasks = snapshot.docs.map(doc => ({

          id: doc.id,

          ...doc.data()

        }));



        // Merge online and offline tasks

        return [...onlineTasks, ...offlineTasks];

      } catch (error) {

        // Return offline tasks if online fetch fails

        console.log('Returning offline tasks:', error);

        return offlineTasks;

      }

    } catch (error) {

      console.error('Error fetching tasks:', error);

      throw error;

    }

  }



  /**

   * Get offline cached tasks

   */

  async getOfflineTasks() {

    try {

      const keys = await AsyncStorage.getAllKeys();

      const taskKeys = keys.filter(key => key.startsWith('task_'));

      const tasks = await Promise.all(

        taskKeys.map(async key => {

          const task = await AsyncStorage.getItem(key);

          return JSON.parse(task);

        })

      );

      return tasks;

    } catch (error) {

      console.error('Error getting offline tasks:', error);

      return [];

    }

  }



  /**

   * Update task

   */

  async updateTask(taskId, updates) {

    try {

      const taskRef = doc(this.tasksRef, taskId);

      const taskDoc = await getDoc(taskRef);



      if (!taskDoc.exists()) {

        throw new Error('Task not found');

      }



      // Validate status transition

      if (updates.status) {

        this.validateStatusTransition(taskDoc.data().status, updates.status);

      }



      const updatedData = {

        ...updates,

        updatedAt: new Date().toISOString()

      };



      await updateDoc(taskRef, updatedData);



      // Get updated task

      const updatedDoc = await getDoc(taskRef);

      return {

        id: updatedDoc.id,

        ...updatedDoc.data()

      };

    } catch (error) {

      console.error('Error updating task:', error);

      throw error;

    }

  }



  /**

   * Delete task

   */

  async deleteTask(taskId) {

    try {

      const taskRef = doc(this.tasksRef, taskId);

      

      // Check if task exists

      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {

        throw new Error('Task not found');

      }



      // Delete task

      await deleteDoc(taskRef);



      return true;

    } catch (error) {

      console.error('Error deleting task:', error);

      throw error;

    }

  }



  /**

   * Process file content with Claude

   */

  async processFile(file, content) {

    try {

      // Process file content

      const analysis = await anthropicService.processFile(file, content);



      // Extract task-relevant information

      return {

        summary: analysis.summary,

        suggestedTitle: analysis.title,

        suggestedPriority: analysis.priority,

        keyPoints: analysis.keyPoints,

        suggestedDueDate: analysis.dueDate,

        estimatedDuration: analysis.duration

      };

    } catch (error) {

      console.error('Error processing file:', error);

      throw error;

    }

  }



  /**

   * Validate task data

   */

  validateTaskData(taskData) {

    const errors = [];



    if (!taskData.title) {

      errors.push('Title is required');

    }



    if (taskData.title?.length > TaskConfig.limits.MAX_TITLE_LENGTH) {

      errors.push(`Title cannot exceed ${TaskConfig.limits.MAX_TITLE_LENGTH} characters`);

    }



    if (taskData.description?.length > TaskConfig.limits.MAX_DESCRIPTION_LENGTH) {

      errors.push(`Description cannot exceed ${TaskConfig.limits.MAX_DESCRIPTION_LENGTH} characters`);

    }



    if (taskData.dependencies?.length > TaskConfig.limits.MAX_DEPENDENCIES) {

      errors.push(`Cannot have more than ${TaskConfig.limits.MAX_DEPENDENCIES} dependencies`);

    }



    if (errors.length > 0) {

      throw new Error(`Validation failed: ${errors.join(', ')}`);

    }

  }



  /**

   * Validate status transition

   */

  validateStatusTransition(currentStatus, newStatus) {

    const allowedTransitions = TaskStatus[currentStatus.toUpperCase()].allowedTransitions;

    

    if (!allowedTransitions.includes(newStatus.toLowerCase())) {

      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);

    }

  }



  /**

   * Sync offline tasks when online

   */

  async syncOfflineTasks() {

    try {

      const offlineTasks = await this.getOfflineTasks();

      

      await Promise.all(

        offlineTasks.map(async task => {

          try {

            const docRef = await addDoc(this.tasksRef, task);

            await AsyncStorage.removeItem(`task_${task.id}`);

            return docRef;

          } catch (error) {

            console.error('Error syncing task:', error);

          }

        })

      );

    } catch (error) {

      console.error('Error syncing offline tasks:', error);

    }

  }

}



// Export singleton instance

export const taskModel = new TaskModel();



// Usage example:

/*

// Create task

const newTask = await taskModel.createTask({

  title: 'New Task',

  description: 'Task description',

  priority: PriorityLevels.MEDIUM.id,

  userId: 'user123'

});



// Fetch tasks with filters

const tasks = await taskModel.fetchTasks('user123', {

  status: TaskStatus.PENDING.id,

  priority: PriorityLevels.HIGH.id,

  sortBy: 'dueDate'

});



// Update task

const updatedTask = await taskModel.updateTask('task123', {

  status: TaskStatus.IN_PROGRESS.id,

  priority: PriorityLevels.HIGH.id

});



// Delete task

await taskModel.deleteTask('task123');



// Process file

const fileAnalysis = await taskModel.processFile(file, content);

*/



export default taskModel;
