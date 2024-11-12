// src/components/dependencies/ChainCompletion.js

import React, { useEffect, useState } from 'react';

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  Alert,

  ActivityIndicator,

  Dimensions

} from 'react-native';

import Animated, {

  FadeIn,

  FadeOut,

  SlideInRight,

  Layout

} from 'react-native-reanimated';

import { taskService } from 'src/services/taskService';

import { anthropicService } from 'src/services/AnthropicService';

import { 

  Link2, 

  CheckCircle, 

  Circle,

  AlertTriangle,

  ChevronRight,

  Clock

} from 'lucide-react-native';



const { width: WIDTH } = Dimensions.get('window');



const ChainCompletion = ({ taskId, onUpdate }) => {

  const [taskChain, setTaskChain] = useState([]);

  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);



  useEffect(() => {

    fetchTaskChain();

  }, [taskId]);



  const fetchTaskChain = async () => {

    try {

      setLoading(true);

      const chain = await taskService.getTaskChain(taskId);

      setTaskChain(chain);

      checkChainCompletion(chain);

    } catch (error) {

      Alert.alert('Error', 'Failed to fetch task chain');

    } finally {

      setLoading(false);

    }

  };



  const checkChainCompletion = async (chain) => {

    try {

      const tasksToUpdate = chain.filter(task => 

        task.status !== 'completed' && canComplete(task, chain)

      );



      if (tasksToUpdate.length > 0) {

        await Promise.all(

          tasksToUpdate.map(task =>

            taskService.updateTaskStatus(task.id, 'ready', {

              lastUpdated: new Date().toISOString()

            })

          )

        );

        

        onUpdate?.();

        fetchTaskChain();

      }

    } catch (error) {

      console.error('Error updating task statuses:', error);

    }

  };



  const canComplete = (task, chain) => {

    const index = chain.findIndex(t => t.id === task.id);

    const previousTasks = chain.slice(0, index);

    return previousTasks.every(t => t.status === 'completed');

  };



  const analyzeChain = async () => {

    try {

      setAnalyzing(true);

      

      const analysis = await anthropicService.analyzeTaskChain(taskChain);

      

      if (analysis.suggestions) {

        Alert.alert(

          'Chain Analysis',

          analysis.suggestions,

          [

            { text: 'OK' },

            analysis.hasOptimizations && {

              text: 'Optimize',

              onPress: () => applyOptimizations(analysis.optimizations)

            }

          ].filter(Boolean)

        );

      }

    } catch (error) {

      Alert.alert('Error', 'Failed to analyze task chain');

    } finally {

      setAnalyzing(false);

    }

  };



  const applyOptimizations = async (optimizations) => {

    try {

      await taskService.applyChainOptimizations(taskId, optimizations);

      fetchTaskChain();

    } catch (error) {

      Alert.alert('Error', 'Failed to apply optimizations');

    }

  };



  const TaskNode = ({ task, isLast }) => (

    <Animated.View

      entering={FadeIn}

      layout={Layout}

    >

      <TouchableOpacity

        style={styles.taskNode}

        onPress={() => {/* Navigate to task details */}}

      >

        <View style={styles.nodeContent}>

          {task.status === 'completed' ? (

            <CheckCircle color="#4CAF50" size={20} />

          ) : task.status === 'ready' ? (

            <Circle color="#2196F3" size={20} />

          ) : (

            <Circle color="#9E9E9E" size={20} />

          )}

          

          <Text style={[

            styles.taskTitle,

            task.status === 'completed' && styles.completedTask

          ]}>

            {task.title}

          </Text>



          {task.estimatedDuration && (

            <View style={styles.duration}>

              <Clock size={12} color="#666" />

              <Text style={styles.durationText}>

                {task.estimatedDuration}m

              </Text>

            </View>

          )}

          

          <Text style={[

            styles.status,

            { color: getStatusColor(task.status) }

          ]}>

            {task.status}

          </Text>

        </View>

      </TouchableOpacity>



      {!isLast && (

        <View style={styles.connector}>

          <ChevronRight color="#9E9E9E" size={16} />

        </View>

      )}

    </Animated.View>

  );



  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#007AFF" />

      </View>

    );

  }



  if (!taskChain.length) return null;



  const completedCount = taskChain.filter(t => t.status === 'completed').length;

  const readyCount = taskChain.filter(t => t.status === 'ready').length;

  const pendingCount = taskChain.length - completedCount - readyCount;



  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <View style={styles.titleContainer}>

          <Link2 color="#007AFF" size={20} />

          <Text style={styles.title}>Dependency Chain</Text>

        </View>



        <TouchableOpacity

          style={[styles.analyzeButton, analyzing && styles.disabledButton]}

          onPress={analyzeChain}

          disabled={analyzing}

        >

          {analyzing ? (

            <ActivityIndicator color="white" size="small" />

          ) : (

            <Text style={styles.analyzeButtonText}>Analyze</Text>

          )}

        </TouchableOpacity>

      </View>



      <ScrollView 

        horizontal 

        style={styles.chainContainer}

        showsHorizontalScrollIndicator={false}

      >

        {taskChain.map((task, index) => (

          <TaskNode

            key={task.id}

            task={task}

            isLast={index === taskChain.length - 1}

          />

        ))}

      </ScrollView>



      {readyCount > 0 && (

        <View style={styles.alert}>

          <AlertTriangle color="#2196F3" size={16} />

          <Text style={styles.alertText}>

            {readyCount} task{readyCount > 1 ? 's are' : ' is'} ready to start

          </Text>

        </View>

      )}



      <View style={styles.stats}>

        <Text style={styles.statText}>

          {completedCount} completed

        </Text>

        <Text style={styles.statText}>

          {readyCount} ready

        </Text>

        <Text style={styles.statText}>

          {pendingCount} pending

        </Text>

      </View>

    </View>

  );

};



const getStatusColor = (status) => {

  const colors = {

    completed: '#4CAF50',

    ready: '#2196F3',

    blocked: '#F44336',

    pending: '#9E9E9E'

  };

  return colors[status] || '#9E9E9E';

};



const styles = StyleSheet.create({

  container: {

    backgroundColor: 'white',

    borderRadius: 12,

    padding: 16,

    margin: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 16

  },

  titleContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8

  },

  title: {

    fontSize: 18,

    fontWeight: '600'

  },

  analyzeButton: {

    backgroundColor: '#007AFF',

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 16

  },

  analyzeButtonText: {

    color: 'white',

    fontSize: 14,

    fontWeight: '500'

  },

  chainContainer: {

    flexGrow: 0

  },

  taskNode: {

    backgroundColor: '#f5f5f5',

    borderRadius: 8,

    padding: 12,

    marginRight: 24

  },

  nodeContent: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8

  },

  taskTitle: {

    flex: 1,

    fontSize: 14,

    fontWeight: '500'

  },

  completedTask: {

    textDecorationLine: 'line-through',

    color: '#9E9E9E'

  },

  status: {

    fontSize: 12,

    fontWeight: '500'

  },

  duration: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4

  },

  durationText: {

    fontSize: 12,

    color: '#666'

  },

  connector: {

    position: 'absolute',

    right: -20,

    top: '50%',

    marginTop: -8

  },

  alert: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#E3F2FD',

    padding: 12,

    borderRadius: 8,

    marginTop: 16,

    gap: 8

  },

  alertText: {

    color: '#2196F3',

    fontSize: 14

  },

  stats: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginTop: 16,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor: '#f0f0f0'

  },

  statText: {

    color: '#666',

    fontSize: 12

  }

});



export default ChainCompletion;
