// src/components/TaskList.js
import React from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView, Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTask } from '../../app/context/TaskContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TaskList = () => {
  const { tasks, deleteTask, updateTask } = useTask();

  const renderRightActions = (progress, dragX, task) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <RectButton
            style={[styles.rightAction, styles.deleteAction]}
            onPress={() => deleteTask(task.id)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress, dragX, task) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [-20, 0, 0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.leftActions, { transform: [{ translateX: trans }] }]}>
        <RectButton
          style={[styles.leftAction, styles.completeAction]}
          onPress={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
        >
          <Text style={styles.actionText}>
            {task.status === 'completed' ? 'Undo' : 'Complete'}
          </Text>
        </RectButton>
      </Animated.View>
    );
  };

  const renderTask = ({ item }) => (
    <Swipeable
      friction={2}
      leftThreshold={80}
      rightThreshold={40}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, item)}
    >
      <Animated.View style={[
        styles.taskContainer,
        { backgroundColor: getPriorityColor(item.priority) },
        item.status === 'completed' && styles.completedTask
      ]}>
        <View style={styles.taskContent}>
          <Text style={[
            styles.taskTitle,
            item.status === 'completed' && styles.completedText
          ]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[
              styles.taskDescription,
              item.status === 'completed' && styles.completedText
            ]}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.taskFooter}>
            <Text style={styles.priorityBadge}>
              {item.priority.toUpperCase()}
            </Text>
            {item.dependencies?.length > 0 && (
              <Text style={styles.dependenciesBadge}>
                {item.dependencies.length} dependencies
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Swipeable>
  );

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#FFE5E5';
      case 'medium': return '#FFF9E5';
      case 'low': return '#E5FFE5';
      default: return '#FFF';
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
  },
  taskContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dependenciesBadge: {
    fontSize: 12,
    color: '#666',
  },
  rightActions: {
    width: 80,
    flexDirection: 'row',
    marginVertical: 5,
  },
  leftActions: {
    width: 80,
    flexDirection: 'row',
    marginVertical: 5,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
  },
  completeAction: {
    backgroundColor: '#34c759',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default TaskList;