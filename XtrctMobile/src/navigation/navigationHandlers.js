import { Platform } from 'react-native';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

export const navigationHandlers = {
  // Home Screen Handlers
  homeScreenHandlers: {
    handleStart: (navigation) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'HomeScreen',
          to: 'Main'
        });
        navigation.replace('Main');
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'HomeScreen'
        });
      }
    }
  },

  // Auth Screen Handlers
  authScreenHandlers: {
    handleAuthSuccess: (navigation, userData = null) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'AuthScreen',
          to: 'SummaryOfDay',
          userId: userData?.uid
        });
        navigation.replace('SummaryOfDay');
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'AuthScreen'
        });
      }
    },
    handleAuthCancel: (navigation) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'AuthScreen',
          action: 'cancel'
        });
        navigation.goBack();
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'AuthScreen'
        });
      }
    }
  },

  // Summary of Day Handlers
  summaryOfDayHandlers: {
    handleNewTask: (navigation, options = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'SummaryOfDay',
          to: 'NewTask'
        });
        navigation.navigate('NewTask', {
          onTaskCreated: options.onTaskCreated,
          initialData: options.initialData
        });
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'SummaryOfDay'
        });
      }
    },
    handleViewAnalytics: (navigation, taskData = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'SummaryOfDay',
          to: 'TaskAnalytics',
          taskId: taskData.taskId
        });
        navigation.navigate('TaskAnalytics', { taskId: taskData.taskId });
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'SummaryOfDay'
        });
      }
    },
    handleShare: (navigation, shareData = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'SummaryOfDay',
          to: 'Sharing'
        });
        navigation.navigate('Sharing', {
          type: 'summary',
          data: shareData
        });
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'SummaryOfDay'
        });
      }
    },
    handleSignOut: (navigation) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'SummaryOfDay',
          to: 'Main',
          action: 'sign_out'
        });
        navigation.replace('Main');
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'SummaryOfDay'
        });
      }
    }
  },

  // New Task Handlers
  newTaskHandlers: {
    handleClose: (navigation, shouldRefresh = false) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'NewTask',
          action: 'close'
        });
        navigation.goBack();
        
        if (Platform.OS === 'ios' && shouldRefresh) {
          navigation.setParams({ refreshTrigger: Date.now() });
        }
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'NewTask'
        });
      }
    },
    handleTaskCreated: (navigation, taskData = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'NewTask',
          action: 'task_created',
          taskId: taskData.id
        });

        const onTaskCreated = navigation.getState().routes.find(
          route => route.name === 'NewTask'
        )?.params?.onTaskCreated;

        navigation.goBack();

        if (onTaskCreated) {
          onTaskCreated(taskData);
        }

        navigation.setParams({
          refreshTrigger: Date.now(),
          newTaskData: taskData
        });
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'NewTask'
        });
      }
    }
  },

  // Task Analytics Handlers
  taskAnalyticsHandlers: {
    handleClose: (navigation) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'TaskAnalytics',
          action: 'close'
        });
        navigation.goBack();
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'TaskAnalytics'
        });
      }
    },
    handleShare: (navigation, analyticsData = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'TaskAnalytics',
          to: 'Sharing'
        });
        navigation.navigate('Sharing', {
          type: 'analytics',
          data: analyticsData
        });
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'TaskAnalytics'
        });
      }
    }
  },

  // Sharing Screen Handlers
  sharingHandlers: {
    handleClose: (navigation) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'Sharing',
          action: 'close'
        });
        navigation.goBack();
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'Sharing'
        });
      }
    },
    handleShareComplete: (navigation, shareResult = {}) => {
      try {
        appMonitor.trackUserActivity('navigation', {
          from: 'Sharing',
          action: 'share_complete',
          success: shareResult.success
        });
        navigation.goBack();
      } catch (error) {
        appMonitor.logError(error, { 
          context: 'navigation',
          screen: 'Sharing'
        });
      }
    }
  }
};

// Example usage:
/*
import { navigationHandlers } from './navigationHandlers';

const SummaryOfDay = () => {
  const navigation = useNavigation();
  const { handleNewTask } = navigationHandlers.summaryOfDayHandlers;

  const onNewTask = () => {
    handleNewTask(navigation, {
      onTaskCreated: (taskData) => {
        // Handle new task created
      }
    });
  };

  return (
    <TouchableOpacity onPress={onNewTask}>
      <Text>New Task</Text>
    </TouchableOpacity>
  );
};
*/