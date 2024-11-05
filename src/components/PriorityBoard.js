// src/components/PriorityBoard.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { PriorityEngine } from '../utils/PriorityEngine';

const PriorityBoard = ({ tasks }) => {
  const priorityLevels = ['high', 'medium', 'low'];
  
  const groupedTasks = priorityLevels.reduce((acc, priority) => ({
    ...acc,
    [priority]: tasks.filter(task => 
      PriorityEngine.getPriorityLevel(task.priorityScore) === priority
    )
  }), {});

  return (
    <ScrollView horizontal style={styles.container}>
      {priorityLevels.map(priority => (
        <View 
          key={priority}
          style={[
            styles.column,
            { borderColor: PriorityEngine.getColorForPriority(priority) }
          ]}
        >
          <Text style={styles.columnHeader}>
            {priority.toUpperCase()} ({groupedTasks[priority].length})
          </Text>
          <ScrollView style={styles.taskList}>
            {groupedTasks[priority].map(task => (
              <Animated.View
                key={task.id}
                entering={FadeIn}
                layout={Layout.springify()}
                style={[
                  styles.taskCard,
                  { backgroundColor: PriorityEngine.getColorForPriority(priority) }
                ]}
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskScore}>
                  Score: {Math.round(task.priorityScore)}
                </Text>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  column: {
    width: Dimensions.get('window').width * 0.8,
    margin: 10,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  columnHeader: {
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskList: {
    padding: 10,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  taskCard: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskScore: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  }
});

export default PriorityBoard;