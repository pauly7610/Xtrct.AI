//src/screens/NewTask.jsx

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import { navigationHandlers } from 'src/navigation/navigationHandlers';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { firebaseService } from 'src/services/firebaseConfig.js';

const NewTask = () => {
  const navigation = useNavigation();
  const { handleClose, handleTaskCreated } = navigationHandlers.newTaskHandlers;

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setIsProcessing(true);
    try {
      const currentUser = firebaseService.getCurrentUser();
      if (!currentUser) {
        appMonitor.trackEvent('auth_error', { context: 'new_task_creation' });
        navigation.replace('Main');
        return;
      }

      const taskData = {
        title: title.trim(),
        details: details.trim(),
        dueDate: dueDate.toISOString(),
        created: new Date().toISOString(),
        userId: currentUser.uid,
        status: 'pending',
        files: files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          uri: file.uri
        }))
      };

      appMonitor.trackEvent('task_creation_started', {
        hasFiles: files.length > 0,
        hasDetails: details.length > 0
      });

      const savedTask = await firebaseService.createTask(taskData);

      appMonitor.trackEvent('task_creation_success', {
        taskId: savedTask.id,
        filesCount: files.length
      });

      handleTaskCreated(navigation, savedTask);
      
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'task_creation',
        title: title,
        hasFiles: files.length > 0 
      });
      Alert.alert(
        'Error',
        'Failed to create task. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [title, details, dueDate, files, navigation, handleTaskCreated]);

  const handleAttachment = useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      appMonitor.trackEvent('files_attached', {
        count: results.length,
        types: results.map(file => file.type)
      });

      setFiles(prev => {
        const newFiles = [...prev, ...results];
        // Limit total files if needed
        if (newFiles.length > 10) {
          Alert.alert('Warning', 'Maximum 10 files allowed');
          return newFiles.slice(0, 10);
        }
        return newFiles;
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appMonitor.logError(err, { context: 'file_attachment' });
        Alert.alert('Error', 'Failed to attach file');
      }
    }
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    appMonitor.trackEvent('file_removed', { fileIndex: index });
  }, []);

  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
      appMonitor.trackEvent('due_date_selected', {
        date: selectedDate.toISOString()
      });
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => handleClose(navigation)}
          disabled={isProcessing}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity 
          style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Task Title"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
          autoFocus
          editable={!isProcessing}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Task Details"
          placeholderTextColor="#666"
          multiline
          value={details}
          onChangeText={setDetails}
          editable={!isProcessing}
        />

        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={isProcessing}
        >
          <Calendar size={20} color="#666" />
          <Text style={styles.dateButtonText}>
            {dueDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={handleAttachment}
          disabled={isProcessing || files.length >= 10}
        >
          <Text style={styles.attachmentButtonText}>
            Attach Files ({files.length}/10)
          </Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <View style={styles.filesContainer}>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveFile(index)}
                  disabled={isProcessing}
                >
                  <Text style={styles.removeFileText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#313442',
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: '#313442',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#313442',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    color: 'white',
    marginLeft: 8,
    fontFamily: 'Poppins',
  },
  attachmentButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  attachmentButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  submitButton: {
    backgroundColor: '#407BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  filesContainer: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#313442',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    color: 'white',
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  removeFileText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
});

export default NewTask;