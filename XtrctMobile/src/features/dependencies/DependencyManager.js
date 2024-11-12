// src/components/DependencyManager.js

import React, { useState, useEffect } from 'react';

import {

  View,

  Text,

  TouchableOpacity,

  StyleSheet,

  Modal,

  ScrollView,

  Alert,

  ActivityIndicator

} from 'react-native';

import { taskService } from 'src/services/taskService';

import { anthropicService } from 'src/services/AnthropicService';

import { ArrowRight, AlertTriangle, Clock, Calendar } from 'lucide-react-native';

import Animated, { FadeIn, Layout } from 'react-native-reanimated';



const DependencyManager = ({ taskId, onUpdate }) => {

  const [dependencies, setDependencies] = useState([]);

  const [availableTasks, setAvailableTasks] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);

  

  useEffect(() => {

    fetchDependencies();

  }, [taskId]);



  const fetchDependencies = async () => {

    try {

      setLoading(true);

      const currentTask = await taskService.fetchUserTasks(null, { id: taskId });

      const allTasks = await taskService.fetchUserTasks(currentTask.userId);

      

      const dependencyTasks = allTasks.filter(t => 

        currentTask.dependencies?.includes(t.id)

      );

      

      const available = allTasks.filter(t => 

        t.id !== taskId && 

        !currentTask.dependencies?.includes(t.id) &&

        new Date(t.dueDate) <= new Date(currentTask.dueDate)

      );



      setDependencies(dependencyTasks);

      setAvailableTasks(available);

    } catch (error) {

      Alert.alert('Error', 'Failed to fetch dependencies');

    } finally {

      setLoading(false);

    }

  };



  const analyzeDependencies = async () => {

    try {

      setAnalyzing(true);

      const analysis = await anthropicService.analyzeTaskDependencies(

        taskId,

        [...dependencies, ...availableTasks]

      );



      if (analysis.suggestedDependencies?.length > 0) {

        Alert.alert(

          'Suggested Dependencies',

          'AI has identified potential dependencies. Would you like to add them?',

          [

            { text: 'Cancel', style: 'cancel' },

            { 

              text: 'View Suggestions',

              onPress: () => showSuggestions(analysis.suggestedDependencies)

            }

          ]

        );

      }

    } catch (error) {

      Alert.alert('Error', 'Failed to analyze dependencies');

    } finally {

      setAnalyzing(false);

    }

  };



  const showSuggestions = (suggestions) => {

    setModalVisible(false);

    Alert.alert(

      'Suggested Dependencies',

      suggestions.map(s => 

        `${s.taskTitle}\nReason: ${s.reason}`

      ).join('\n\n'),

      [

        { text: 'Cancel', style: 'cancel' },

        { 

          text: 'Add All',

          onPress: () => addMultipleDependencies(suggestions.map(s => s.taskId))

        }

      ]

    );

  };



  const addDependency = async (dependencyId) => {

    try {

      await taskService.updateTaskStatus(taskId, null, {

        dependencies: [...dependencies.map(d => d.id), dependencyId]

      });

      await fetchDependencies();

      onUpdate?.();

    } catch (error) {

      Alert.alert('Error', 'Failed to add dependency');

    }

  };



  const addMultipleDependencies = async (dependencyIds) => {

    try {

      await taskService.updateTaskStatus(taskId, null, {

        dependencies: [...dependencies.map(d => d.id), ...dependencyIds]

      });

      await fetchDependencies();

      onUpdate?.();

    } catch (error) {

      Alert.alert('Error', 'Failed to add dependencies');

    }

  };



  const removeDependency = async (dependencyId) => {

    try {

      await taskService.updateTaskStatus(taskId, null, {

        dependencies: dependencies.map(d => d.id).filter(id => id !== dependencyId)

      });

      await fetchDependencies();

      onUpdate?.();

    } catch (error) {

      Alert.alert('Error', 'Failed to remove dependency');

    }

  };



  const TaskItem = ({ task, onPress, showRemove }) => (

    <Animated.View

      entering={FadeIn}

      layout={Layout}

    >

      <TouchableOpacity

        style={styles.taskItem}

        onPress={onPress}

      >

        <View style={styles.taskContent}>

          <Text style={styles.taskTitle}>{task.title}</Text>

          

          <View style={styles.taskMetadata}>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>

              <Text style={styles.statusText}>{task.status}</Text>

            </View>

            

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

          </View>

        </View>



        {showRemove && (

          <TouchableOpacity

            style={styles.removeButton}

            onPress={() => removeDependency(task.id)}

          >

            <Text style={styles.removeButtonText}>Remove</Text>

          </TouchableOpacity>

        )}

      </TouchableOpacity>

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

        <Text style={styles.title}>Dependencies</Text>

        <TouchableOpacity

          style={[styles.analyzeButton, analyzing && styles.disabledButton]}

          onPress={analyzeDependencies}

          disabled={analyzing}

        >

          {analyzing ? (

            <ActivityIndicator color="white" size="small" />

          ) : (

            <Text style={styles.analyzeButtonText}>Analyze</Text>

          )}

        </TouchableOpacity>

      </View>



      <ScrollView style={styles.dependencyList}>

        {dependencies.map(dep => (

          <TaskItem 

            key={dep.id} 

            task={dep} 

            showRemove={true}

          />

        ))}

      </ScrollView>



      <TouchableOpacity

        style={styles.addButton}

        onPress={() => setModalVisible(true)}

      >

        <Text style={styles.addButtonText}>Add Dependency</Text>

      </TouchableOpacity>



      <Modal

        visible={modalVisible}

        animationType="slide"

        transparent={true}

        onRequestClose={() => setModalVisible(false)}

      >

        <View style={styles.modalContainer}>

          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>Select Dependencies</Text>

            

            <ScrollView style={styles.availableTasksList}>

              {availableTasks.map(task => (

                <TaskItem 

                  key={task.id} 

                  task={task}

                  onPress={() => {

                    addDependency(task.id);

                    setModalVisible(false);

                  }}

                />

              ))}

            </ScrollView>



            <TouchableOpacity

              style={styles.closeButton}

              onPress={() => setModalVisible(false)}

            >

              <Text style={styles.closeButtonText}>Close</Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>

  );

};



const getStatusColor = (status) => {

  const colors = {

    pending: '#FFC107',

    inProgress: '#2196F3',

    completed: '#4CAF50',

    blocked: '#F44336'

  };

  return colors[status] || '#666';

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: 'white',

  },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 16,

    borderBottomWidth: 1,

    borderBottomColor: '#f0f0f0',

  },

  title: {

    fontSize: 20,

    fontWeight: 'bold',

  },

  analyzeButton: {

    backgroundColor: '#007AFF',

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 20,

  },

  analyzeButtonText: {

    color: 'white',

    fontWeight: '500',

  },

  disabledButton: {

    opacity: 0.7,

  },

  dependencyList: {

    flex: 1,

    padding: 16,

  },

  taskItem: {

    flexDirection: 'row',

    backgroundColor: '#f5f5f5',

    borderRadius: 8,

    marginBottom: 8,

    padding: 12,

  },

  taskContent: {

    flex: 1,

  },

  taskTitle: {

    fontSize: 16,

    fontWeight: '500',

    marginBottom: 4,

  },

  taskMetadata: {

    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',

    gap: 8,

  },

  statusBadge: {

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 4,

  },

  statusText: {

    color: 'white',

    fontSize: 12,

    fontWeight: '500',

  },

  metadataItem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

  },

  metadataText: {

    fontSize: 12,

    color: '#666',

  },

  removeButton: {

    paddingHorizontal: 12,

    justifyContent: 'center',

  },

  removeButtonText: {

    color: '#FF4444',

    fontSize: 14,

    fontWeight: '500',

  },

  addButton: {

    margin: 16,

    backgroundColor: '#4CAF50',

    padding: 16,

    borderRadius: 8,

    alignItems: 'center',

  },

  addButtonText: {

    color: 'white',

    fontWeight: '600',

  },

  modalContainer: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.5)',

    justifyContent: 'flex-end',

  },

  modalContent: {

    backgroundColor: 'white',

    borderTopLeftRadius: 20,

    borderTopRightRadius: 20,

    padding: 16,

    maxHeight: '80%',

  },

  modalTitle: {

    fontSize: 20,

    fontWeight: 'bold',

    marginBottom: 16,

  },

  availableTasksList: {

    maxHeight: '70%',

  },

  closeButton: {

    marginTop: 16,

    padding: 16,

    backgroundColor: '#f0f0f0',

    borderRadius: 8,

    alignItems: 'center',

  },

  closeButtonText: {

    color: '#666',

    fontWeight: '600',

  },

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

});



export default DependencyManager;
