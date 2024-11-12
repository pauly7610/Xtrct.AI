// src/screens/Summary/views/TasksView.js
import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import styles, { colors, typography, shadows } from '../styles/styles';

export default function TasksView({ tasks, onNewTask, onRefresh, refreshing }) {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionHeader}>Today</Text>
      <Text style={styles.sectionSubheader}>Tasks</Text>
      
      <ScrollView
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, { backgroundColor: task.backgroundColor }]}
            onPress={() => onTaskPress(task)}
          >
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDescription}>{task.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.newTaskButton}
        onPress={onNewTask}
      >
        <Image 
          style={styles.newTaskIcon}
          source={require('../assets/icons/plus-circle.png')}
        />
        <Text style={styles.newTaskText}>New Task</Text>
      </TouchableOpacity>
    </View>
  );
}
