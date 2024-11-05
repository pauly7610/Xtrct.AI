// src/components/TaskForm.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTask } from '../app/context/TaskContext';

const TaskForm = ({ onClose }) => {
  const { addTask } = useTask();
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dependencies: [],
    status: 'pending'
  });

  const handleSubmit = () => {
    if (!taskData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    addTask({
      ...taskData,
      createdAt: new Date(),
    });
    
    onClose();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Task Title"
        value={taskData.title}
        onChangeText={(text) => setTaskData(prev => ({ ...prev, title: text }))}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        multiline
        value={taskData.description}
        onChangeText={(text) => setTaskData(prev => ({ ...prev, description: text }))}
      />

      <View style={styles.priorityContainer}>
        {['low', 'medium', 'high'].map((priority) => (
          <TouchableOpacity
            key={priority}
            style={[
              styles.priorityButton,
              taskData.priority === priority && styles.selectedPriority
            ]}
            onPress={() => setTaskData(prev => ({ ...prev, priority }))}
          >
            <Text style={[
              styles.priorityText,
              taskData.priority === priority && styles.selectedPriorityText
            ]}>
              {priority.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedPriority: {
    backgroundColor: '#007AFF',
  },
  priorityText: {
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TaskForm;