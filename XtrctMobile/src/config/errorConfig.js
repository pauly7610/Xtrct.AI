// src/config/errorConfig.js
export const errorConfig = {
    // Visual themes matching our app's design
    themes: {
      default: {
        backgroundColor: '#313442',
        textColor: 'white',
        accentColor: '#70B7FA'
      },
      success: {
        backgroundColor: '#E0FAEF',
        textColor: '#1D2226',
        accentColor: '#4CAF50'
      },
      warning: {
        backgroundColor: '#FAF2E3',
        textColor: '#1D2226',
        accentColor: '#FF9800'
      },
      error: {
        backgroundColor: '#EFEEFE',
        textColor: '#1D2226',
        accentColor: '#FF4444'
      }
    },
  
    // User-friendly error messages
    messages: {
      default: {
        title: "Something's not right",
        message: "We hit a snag. Let's try that again.",
        action: "Retry"
      },
      network: {
        title: "Connection Lost",
        message: "Check your internet and try again.",
        action: "Retry"
      },
      auth: {
        title: "Session Expired",
        message: "Please sign in again to continue.",
        action: "Sign In"
      },
      tasks: {
        creation: {
          title: "Couldn't Create Task",
          message: "The task didn't save properly.",
          action: "Try Again"
        },
        update: {
          title: "Update Failed",
          message: "Changes couldn't be saved.",
          action: "Try Again"
        },
        deletion: {
          title: "Deletion Failed",
          message: "Task couldn't be removed.",
          action: "Try Again"
        },
        fetch: {
          title: "Couldn't Load Tasks",
          message: "Your tasks are temporarily unavailable.",
          action: "Refresh"
        }
      },
      files: {
        upload: {
          title: "Upload Failed",
          message: "The file couldn't be uploaded.",
          action: "Try Again"
        },
        download: {
          title: "Download Failed",
          message: "The file couldn't be downloaded.",
          action: "Try Again"
        }
      },
      analysis: {
        title: "Analysis Failed",
        message: "We couldn't process your request.",
        action: "Try Again"
      }
    }
  };
  
  // src/components/ErrorView.js
  import React from 'react';
  import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet,
    Dimensions
  } from 'react-native';
  import { errorConfig } from '../config/errorConfig';
  
  export const ErrorView = ({
    error,
    type = 'default',
    onAction,
    style,
    fullScreen = false
  }) => {
    const theme = errorConfig.themes[type] || errorConfig.themes.default;
    
    return (
      <View style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: theme.backgroundColor },
        style
      ]}>
        <Text style={[
          styles.title,
          { color: theme.textColor }
        ]}>
          {error.title}
        </Text>
        
        <Text style={[
          styles.message,
          { color: theme.textColor }
        ]}>
          {error.message}
        </Text>
  
        {onAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.accentColor }
            ]}
            onPress={onAction}
          >
            <Text style={styles.actionText}>
              {error.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      margin: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    fullScreen: {
      height: Dimensions.get('window').height,
      margin: 0,
      justifyContent: 'center'
    },
    title: {
      fontFamily: 'Poppins',
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center'
    },
    message: {
      fontFamily: 'Poppins',
      fontSize: 14,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 20
    },
    actionButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 30
    },
    actionText: {
      fontFamily: 'Poppins',
      color: 'white',
      fontSize: 16,
      fontWeight: '500'
    }
  });
  
  // src/services/errorService.js
  class ErrorService {
    constructor() {
      this.errorConfig = errorConfig;
    }
  
    getErrorMessage(context, error) {
      // Get specific error message based on context and error
      const contextParts = context.split('.');
      let messages = this.errorConfig.messages;
      
      for (const part of contextParts) {
        messages = messages[part] || messages.default;
      }
  
      return {
        ...messages,
        originalError: error
      };
    }
  
    handleError(context, error, callback) {
      const errorMessage = this.getErrorMessage(context, error);
      
      if (callback) {
        callback(errorMessage);
      }
      
      return errorMessage;
    }
  }
  
  export const errorService = new ErrorService();
  
  // Usage examples:
  
  // 1. In a task component
  const TaskList = () => {
    const [error, setError] = useState(null);
  
    const fetchTasks = async () => {
      try {
        const tasks = await taskService.fetchUserTasks(userId);
        setError(null);
      } catch (error) {
        setError(errorService.getErrorMessage('tasks.fetch', error));
      }
    };
  
    if (error) {
      return (
        <ErrorView
          error={error}
          type="error"
          onAction={fetchTasks}
        />
      );
    }
  
    // Rest of component...
  };
  
  // 2. In a file upload component
  const FileUpload = () => {
    const handleUpload = async (file) => {
      try {
        await fileService.uploadFile(file);
      } catch (error) {
        const errorMessage = errorService.getErrorMessage('files.upload', error);
        Alert.alert(
          errorMessage.title,
          errorMessage.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: errorMessage.action, onPress: () => handleUpload(file) }
          ]
        );
      }
    };
  };
  
  // 3. In API calls
  const createTask = async (taskData) => {
    try {
      await taskService.createTask(taskData);
    } catch (error) {
      throw errorService.handleError('tasks.creation', error);
    }
  };
  
  // 4. Full screen error
  const AnalyticsScreen = () => {
    const [error, setError] = useState(null);
  
    if (error) {
      return (
        <ErrorView
          error={error}
          type="default"
          onAction={() => setError(null)}
          fullScreen
        />
      );
    }
  };
