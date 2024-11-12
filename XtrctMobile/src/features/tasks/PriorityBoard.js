// src/components/PriorityBoard.js

import React, { useState, useEffect } from 'react';

import { 

  View, 

  Text, 

  ScrollView, 

  StyleSheet, 

  Dimensions,

  TouchableOpacity,

  ActivityIndicator,

  Alert

} from 'react-native';

import Animated, { 

  FadeIn,

  Layout,

  withSpring,

  useAnimatedStyle,

  withTiming

} from 'react-native-reanimated';

import { PanGestureHandler } from 'react-native-gesture-handler';

import { taskService } from 'src/services/taskService';

import { anthropicService } from 'src/services/AnthropicService';

import { Calendar, Clock, AlertTriangle } from 'lucide-react-native';



const { width } = Dimensions.get('window');

const COLUMN_WIDTH = width * 0.8;



const PriorityBoard = ({ userId, onTaskPress }) => {

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [optimizing, setOptimizing] = useState(false);

  const [selectedPriority, setSelectedPriority] = useState(null);



  const priorityLevels = ['high', 'medium', 'low'];

  

  const priorityColors = {

    high: '#FF4444',

    medium: '#FFBB33',

    low: '#00C851'

  };



  useEffect(() => {

    fetchTasks();

  }, [userId]);



  const fetchTasks = async () => {

    try {

      setLoading(true);

      const userTasks = await taskService.fetchUserTasks(userId);

      setTasks(userTasks);

    } catch (error) {

      Alert.alert('Error', 'Failed to fetch tasks');

    } finally {

      setLoading(false);

    }

  };



  const optimizePriorities = async () => {

    try {

      setOptimizing(true);

      const optimizedTasks = await anthropicService.prioritizeTasks(userId);

      

      // Animate the changes

      const updates = optimizedTasks.map((task, index) => {

        return new Promise(resolve => {

          setTimeout(() => {

            setTasks(prev => {

              const newTasks = [...prev];

              const taskIndex = newTasks.findIndex(t => t.id === task.id);

              if (taskIndex !== -1) {

                newTasks[taskIndex] = task;

              }

              return newTasks;

            });

            resolve();

          }, index * 100); // Stagger the updates

        });

      });



      await Promise.all(updates);

      Alert.alert('Success', 'Task priorities have been optimized');

    } catch (error) {

      Alert.alert('Error', 'Failed to optimize priorities');

    } finally {

      setOptimizing(false);

    }

  };



  const TaskCard = ({ task, index }) => {

    const animatedStyle = useAnimatedStyle(() => ({

      transform: [{ scale: withSpring(1) }],

      opacity: withTiming(1, { duration: 500 })

    }));



    return (

      <PanGestureHandler>

        <Animated.View

          entering={FadeIn.delay(index * 100)}

          layout={Layout.springify()}

          style={[styles.taskCard, { borderLeftColor: priorityColors[task.priority] }, animatedStyle]}

        >

          <TouchableOpacity 

            onPress={() => onTaskPress?.(task)}

            style={styles.taskContent}

          >

            <Text style={styles.taskTitle} numberOfLines={1}>

              {task.title}

            </Text>

            

            <View style={styles.taskMetadata}>

              {task.dueDate && (

                <View style={styles.metadataItem}>

                  <Calendar size={12} color="#666" />

                  <Text style={styles.metadataText}>

                    {new Date(task.dueDate).toLocaleDateString()}

                  </Text>

                </View>

              )}

              

              {task.estimatedDuration && (

                <View style={styles.metadataItem}>

                  <Clock size={12} color="#666" />

                  <Text style={styles.metadataText}>

                    {`${task.estimatedDuration}m`}

                  </Text>

                </View>

              )}



              {task.dependencies?.length > 0 && (

                <View style={styles.metadataItem}>

                  <AlertTriangle size={12} color="#666" />

                  <Text style={styles.metadataText}>

                    {task.dependencies.length}

                  </Text>

                </View>

              )}

            </View>

          </TouchableOpacity>

        </Animated.View>

      </PanGestureHandler>

    );

  };



  const PriorityColumn = ({ priority, tasks }) => (

    <Animated.View 

      entering={FadeIn}

      style={[styles.column, selectedPriority === priority && styles.selectedColumn]}

    >

      <TouchableOpacity 

        style={[styles.columnHeader, { backgroundColor: priorityColors[priority] }]}

        onPress={() => setSelectedPriority(selectedPriority === priority ? null : priority)}

      >

        <Text style={styles.columnHeaderText}>

          {priority.toUpperCase()} ({tasks.length})

        </Text>

      </TouchableOpacity>



      <ScrollView 

        style={styles.taskList}

        showsVerticalScrollIndicator={false}

      >

        {tasks.map((task, index) => (

          <TaskCard 

            key={task.id} 

            task={task} 

            index={index}

          />

        ))}

      </ScrollView>

    </Animated.View>

  );



  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#007AFF" />

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <Text style={styles.title}>Task Priorities</Text>

        <TouchableOpacity 

          style={[styles.optimizeButton, optimizing && styles.disabledButton]}

          onPress={optimizePriorities}

          disabled={optimizing}

        >

          {optimizing ? (

            <ActivityIndicator color="white" size="small" />

          ) : (

            <Text style={styles.optimizeButtonText}>Optimize</Text>

          )}

        </TouchableOpacity>

      </View>



      <ScrollView 

        horizontal 

        style={styles.boardContainer}

        showsHorizontalScrollIndicator={false}

        snapToInterval={COLUMN_WIDTH + 20}

        decelerationRate="fast"

      >

        {priorityLevels.map(priority => (

          <PriorityColumn

            key={priority}

            priority={priority}

            tasks={tasks.filter(task => task.priority === priority)}

          />

        ))}

      </ScrollView>

    </View>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#f5f5f5',

  },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 16,

  },

  title: {

    fontSize: 24,

    fontWeight: 'bold',

    color: '#333',

  },

  optimizeButton: {

    backgroundColor: '#007AFF',

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 20,

  },

  optimizeButtonText: {

    color: 'white',

    fontWeight: '500',

  },

  disabledButton: {

    opacity: 0.7,

  },

  boardContainer: {

    flex: 1,

  },

  column: {

    width: COLUMN_WIDTH,

    margin: 10,

    borderRadius: 12,

    backgroundColor: 'white',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  },

  selectedColumn: {

    transform: [{ scale: 1.02 }],

  },

  columnHeader: {

    padding: 16,

    borderTopLeftRadius: 12,

    borderTopRightRadius: 12,

  },

  columnHeaderText: {

    color: 'white',

    fontSize: 16,

    fontWeight: 'bold',

    textAlign: 'center',

  },

  taskList: {

    padding: 12,

    maxHeight: '85%',

  },

  taskCard: {

    marginVertical: 6,

    borderRadius: 8,

    backgroundColor: 'white',

    borderLeftWidth: 4,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.1,

    shadowRadius: 2,

    elevation: 2,

  },

  taskContent: {

    padding: 12,

  },

  taskTitle: {

    fontSize: 16,

    fontWeight: '600',

    color: '#333',

    marginBottom: 8,

  },

  taskMetadata: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

  },

  metadataItem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: '#f5f5f5',

    borderRadius: 4,

  },

  metadataText: {

    fontSize: 12,

    color: '#666',

  },

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

});



export default PriorityBoard;
