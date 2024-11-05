// src/components/DependencyManager.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTask } from '../context/TaskContext';

const DependencyManager = ({ taskId }) => {
  const { tasks, addDependency, removeDependency, getTaskDependencies } = useTask();
  const [modalVisible, setModalVisible] = useState(false);
  
  const currentTask = tasks.find(t => t.id === taskId);
  const dependencies = getTaskDependencies(taskId);

  const availableTasks = tasks.filter(t => 
    t.id !== taskId && 
    !currentTask.dependencies.includes(t.id)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dependencies</Text>
      
      <ScrollView style={styles.dependencyList}>
        {dependencies.map(dep => (
          <View key={dep.id} style={styles.dependencyItem}>
            <Text style={styles.dependencyTitle}>{dep.title}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeDependency(taskId, dep.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
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
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => {
                    addDependency(taskId, task.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskStatus}>{task.status}</Text>
                </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dependencyList: {
    maxHeight: 200,
  },
  dependencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dependencyTitle: {
    flex: 1,
  },
  removeButton: {
    padding: 5,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  availableTasksList: {
    maxHeight: 400,
  },
  taskItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskTitle: {
    fontSize: 16,
  },
  taskStatus: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#666',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
  },
});

export default DependencyManager;