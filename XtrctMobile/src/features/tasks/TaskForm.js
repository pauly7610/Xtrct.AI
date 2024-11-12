import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp 
} from 'react-native-reanimated';
import { taskService } from 'src/services/taskService';
import { anthropicService } from 'src/services/AnthropicService';

const TaskForm = ({ onClose, initialData = null }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: new Date(),
    dependencies: [],
    status: 'pending',
    attachments: [],
    ...initialData
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!taskData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      setLoading(true);

      if (taskData.attachments.length > 0) {
        setProcessing(true);
        const fileAnalyses = await Promise.all(
          taskData.attachments.map(file => 
            anthropicService.processFile(file)
          )
        );

        const enhancedData = fileAnalyses.reduce((acc, analysis) => ({
          ...acc,
          keyPoints: [...(acc.keyPoints || []), ...analysis.keyPoints],
          suggestedPriority: analysis.priority || acc.priority,
          suggestedDueDate: analysis.suggestedDueDate || acc.dueDate,
          relatedContext: analysis.context
        }), taskData);

        setTaskData(enhancedData);
      }

      const newTask = await taskService.createTask(taskData);
      
      if (taskData.description.length > 100 || taskData.priority === 'high') {
        const breakdown = await anthropicService.suggestTaskBreakdown(
          newTask.id,
          taskData.userId
        );
        
        if (breakdown.subtasks.length > 0) {
          Alert.alert(
            'Task Breakdown Available',
            'Would you like to view the suggested breakdown of this task?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'View', 
                onPress: () => onClose(newTask, true) 
              }
            ]
          );
          return;
        }
      }

      onClose(newTask);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const handleAttachmentUpload = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.plainText
        ],
        allowMultiSelection: true
      });

      setTaskData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...results]
      }));
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to attach file');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View 
        entering={SlideInUp}
        style={styles.formContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.input}
            placeholder="Task Title"
            value={taskData.title}
            onChangeText={(title) => setTaskData(prev => ({ ...prev, title }))}
            placeholderTextColor="#666"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
            value={taskData.description}
            onChangeText={(description) => setTaskData(prev => ({ ...prev, description }))}
            placeholderTextColor="#666"
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

          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              Due Date: {taskData.dueDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={taskData.dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setTaskData(prev => ({ ...prev, dueDate: selectedDate }));
                }
              }}
            />
          )}

          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttachmentUpload}
          >
            <Text style={styles.attachButtonText}>Add Attachments</Text>
          </TouchableOpacity>

          {taskData.attachments.map((file, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text numberOfLines={1} style={styles.attachmentName}>
                {file.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTaskData(prev => ({
                    ...prev,
                    attachments: prev.attachments.filter((_, i) => i !== index)
                  }));
                }}
                style={styles.removeAttachment}
              >
                <Text style={styles.removeAttachmentText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Create Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {processing && (
          <Animated.View 
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.processingOverlay}
          >
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>
              Analyzing attachments...
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPriority: {
    backgroundColor: '#007AFF',
  },
  priorityText: {
    color: '#666',
    fontWeight: '600',
  },
  selectedPriorityText: {
    color: 'white',
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  dateButtonText: {
    textAlign: 'center',
    color: '#666',
  },
  attachButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginBottom: 16,
  },
  attachButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    marginRight: 8,
    color: '#333',
  },
  removeAttachment: {
    padding: 4,
  },
  removeAttachmentText: {
    color: '#FF4444',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
});

export default TaskForm; 
