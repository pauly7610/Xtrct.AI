//src/components/dependencies/TaskBlocker.js

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { taskService } from 'src/services/taskService';
import theme from 'src/config/theme';

const TaskBlocker = ({ taskId, onDependencyPress }) => {
  const [task, setTask] = React.useState(null);
  const [dependencies, setDependencies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const taskDetails = await taskService.fetchUserTasks(null, { id: taskId });
      const dependencyTasks = await Promise.all(
        taskDetails.dependencies?.map(depId => 
          taskService.fetchUserTasks(null, { id: depId })
        ) || []
      );

      setTask(taskDetails);
      setDependencies(dependencyTasks.filter(Boolean));
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !task || !dependencies.length) return null;

  const completedDependencies = dependencies.filter(t => t.status === 'completed');
  const progress = (completedDependencies.length / dependencies.length) * 100;
  const isBlocked = completedDependencies.length < dependencies.length;

  const ProgressBar = ({ value }) => (
    <View style={styles.progressContainer}>
      <View 
        style={[
          styles.progressBar, 
          { width: `${value}%` }
        ]} 
      />
    </View>
  );

  const DependencyItem = ({ dependency }) => {
    const isCompleted = dependency.status === 'completed';
    
    return (
      <TouchableOpacity
        style={[
          styles.dependencyItem,
          { backgroundColor: isCompleted ? theme.colors.status.success + '15' : theme.colors.status.warning + '15' }
        ]}
        onPress={() => onDependencyPress?.(dependency)}
      >
        <View style={styles.dependencyContent}>
          {isCompleted ? (
            <CheckCircle 
              size={16} 
              color={theme.colors.status.success} 
            />
          ) : (
            <AlertTriangle 
              size={16} 
              color={theme.colors.status.warning} 
            />
          )}
          <Text style={[
            styles.dependencyTitle,
            isCompleted && styles.completedText
          ]}>
            {dependency.title}
          </Text>
        </View>
        <Text style={[
          styles.dependencyStatus,
          { color: isCompleted ? theme.colors.status.success : theme.colors.status.warning }
        ]}>
          {isCompleted ? 'Completed' : 'Pending'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isBlocked ? (
          <Lock 
            size={20} 
            color={theme.colors.status.warning} 
          />
        ) : (
          <CheckCircle 
            size={20} 
            color={theme.colors.status.success} 
          />
        )}
        <Text style={styles.title}>
          {isBlocked ? 'Task Blocked' : 'Ready to Start'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              Dependencies Progress
            </Text>
            <Text style={styles.progressCount}>
              {completedDependencies.length}/{dependencies.length}
            </Text>
          </View>
          <ProgressBar value={progress} />
        </View>

        {/* Dependencies List */}
        <View style={styles.dependenciesList}>
          {dependencies.map(dep => (
            <DependencyItem 
              key={dep.id} 
              dependency={dep} 
            />
          ))}
        </View>

        {/* Blocked Warning */}
        {isBlocked && (
          <View style={styles.warningContainer}>
            <AlertTriangle 
              size={20} 
              color={theme.colors.status.warning} 
            />
            <Text style={styles.warningText}>
              This task is blocked until all dependencies are completed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  title: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.primary
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg
  },
  progressSection: {
    gap: theme.spacing.sm
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressTitle: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary
  },
  progressCount: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary
  },
  dependenciesList: {
    gap: theme.spacing.sm
  },
  dependencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm
  },
  dependencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  dependencyTitle: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary
  },
  dependencyStatus: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.status.warning + '15',
    borderRadius: theme.borderRadius.sm
  },
  warningText: {
    flex: 1,
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.status.warning
  }
});

export default TaskBlocker;

// Usage:
/*
import TaskBlocker from '../components/TaskBlocker';

const TaskScreen = () => {
  const handleDependencyPress = (dependency) => {
    // Navigate to dependency details
    navigation.navigate('TaskDetails', { taskId: dependency.id });
  };

  return (
    <TaskBlocker 
      taskId="task-123"
      onDependencyPress={handleDependencyPress}
    />
  );
};
*/
