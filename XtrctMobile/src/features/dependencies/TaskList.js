// src/components/TaskList.js
// src/components/TaskList.js
import React, { useState, useEffect } from 'react';
import { 
  Animated, 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  Alert
} from 'react-native';
import { 
  GestureHandlerRootView, 
  Swipeable, 
  RectButton 
} from 'react-native-gesture-handler';
import { taskService } from 'src/services/taskService';
import { anthropicService } from 'src/services/AnthropicService';
import theme from 'src/config/theme';
import { TaskStatus, PriorityLevels } from 'src/config/constants';
import { Trash2, Check, Clock, AlertTriangle } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TaskList = ({ onTaskPress, onTaskUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskService.fetchUserTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(taskId);
              setTasks(tasks.filter(t => t.id !== taskId));
              onTaskUpdate?.('delete');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (task, newStatus) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(
        task.id,
        newStatus
      );
      setTasks(tasks.map(t => 
        t.id === task.id ? updatedTask : t
      ));
      onTaskUpdate?.('update', updatedTask);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

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
            onPress={() => handleDeleteTask(task.id)}
          >
            <Trash2 
              size={20} 
              color="white" 
            />
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

    const isCompleted = task.status === TaskStatus.COMPLETED.id;

    return (
      <Animated.View style={[
        styles.leftActions, 
        { transform: [{ translateX: trans }] }
      ]}>
        <RectButton
          style={[
            styles.leftAction,
            isCompleted ? styles.undoAction : styles.completeAction
          ]}
          onPress={() => handleUpdateStatus(
            task,
            isCompleted ? TaskStatus.PENDING.id : TaskStatus.COMPLETED.id
          )}
        >
          {isCompleted ? (
            <Clock size={20} color="white" />
          ) : (
            <Check size={20} color="white" />
          )}
          <Text style={styles.actionText}>
            {isCompleted ? 'Undo' : 'Complete'}
          </Text>
        </RectButton>
      </Animated.View>
    );
  };

  const TaskStatusIndicator = ({ status }) => {
    const statusConfig = TaskStatus[status.toUpperCase()];
    return (
      <View style={[
        styles.statusIndicator,
        { backgroundColor: statusConfig.color + '20' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: statusConfig.color }
        ]}>
          {statusConfig.label}
        </Text>
      </View>
    );
  };

  const renderTask = ({ item: task }) => (
    <Swipeable
      friction={2}
      leftThreshold={80}
      rightThreshold={40}
      renderRightActions={(progress, dragX) => 
        renderRightActions(progress, dragX, task)
      }
      renderLeftActions={(progress, dragX) => 
        renderLeftActions(progress, dragX, task)
      }
    >
      <TouchableOpacity
        onPress={() => onTaskPress?.(task)}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.taskContainer,
          task.status === TaskStatus.COMPLETED.id && styles.completedTask
        ]}>
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Text style={[
                styles.taskTitle,
                task.status === TaskStatus.COMPLETED.id && styles.completedText
              ]}>
                {task.title}
              </Text>
              <TaskStatusIndicator status={task.status} />
            </View>

            {task.description ? (
              <Text style={[
                styles.taskDescription,
                task.status === TaskStatus.COMPLETED.id && styles.completedText
              ]}>
                {task.description}
              </Text>
            ) : null}

            <View style={styles.taskFooter}>
              <View style={styles.badges}>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: PriorityLevels[task.priority.toUpperCase()].color + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: PriorityLevels[task.priority.toUpperCase()].color }
                  ]}>
                    {PriorityLevels[task.priority.toUpperCase()].label}
                  </Text>
                </View>

                {task.dependencies?.length > 0 && (
                  <View style={styles.dependenciesBadge}>
                    <AlertTriangle size={12} color={theme.colors.status.warning} />
                    <Text style={styles.dependenciesText}>
                      {task.dependencies.length}
                    </Text>
                  </View>
                )}
              </View>

              {task.dueDate && (
                <Text style={styles.dueDate}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Swipeable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={fetchTasks}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  taskContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md
  },
  completedTask: {
    opacity: 0.7,
  },
  taskContent: {
    padding: theme.spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  taskTitle: {
    flex: 1,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  taskDescription: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm,
  },
  dependenciesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.status.warning + '20',
    borderRadius: theme.borderRadius.sm,
  },
  dependenciesText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.status.warning
  },
  dueDate: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary
  },
  // ... rest of styles updated with theme values
});

export default TaskList;
