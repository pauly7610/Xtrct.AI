import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTask } from '../context/TaskContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8;

const PriorityBoard = () => {
  const { tasks, userPreferences, prioritizeTasks } = useTask();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState(null);

  useEffect(() => {
    // No need to fetch tasks here, as they should already be loaded in the TaskContext
  }, []);

  const prioritizedTasks = prioritizeTasks(tasks);

  const handleTaskPress = (task) => {
    // Handle task press, e.g., open task details or start focus session
  };

  const handleTaskFormClose = (task, shouldViewBreakdown) => {
    setShowTaskForm(false);
    setNewTask(task);

    if (shouldViewBreakdown) {
      // Handle task breakdown display
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        style={styles.boardContainer}
        showsHorizontalScrollIndicator={false}
        snapToInterval={COLUMN_WIDTH + 20}
        decelerationRate="fast"
      >
        {userPreferences.taskCategories.map((category) => (
          <View key={category} style={styles.column}>
            <View style={[styles.columnHeader, { backgroundColor: priorityColors[category] }]}>
              <Text style={styles.columnHeaderText}>{category.toUpperCase()}</Text>
            </View>
            <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
              {prioritizedTasks
                .filter((task) => userPreferences.taskCategories.includes(task.category))
                .map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} onPress={handleTaskPress} />
                ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {showTaskForm && (
        <TaskForm onClose={handleTaskFormClose} />
      )}

      <TouchableOpacity
        style={styles.newTaskButton}
        onPress={() => setShowTaskForm(true)}
      >
        <Text style={styles.newTaskButtonText}>+ New Task</Text>
      </TouchableOpacity>
    </View>
  );
};

const priorityColors = {
  high: '#FF4444',
  medium: '#FFBB33',
  low: '#00C851'
};

const styles = StyleSheet.create({
  // ... previous styles
  newTaskButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  newTaskButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default PriorityBoard;