// src/models/task.js
import firestore from '@react-native-firebase/firestore';
import axios from 'axios';

const OPENAI_API_KEY = 'your_openai_api_key'; // Your OpenAI API key

export const createTask = async (taskData) => {
  try {
    const newTask = await firestore().collection('tasks').add(taskData);
    return newTask.id; // Return the task ID for further reference
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const fetchTasks = async () => {
  try {
    const snapshot = await firestore().collection('tasks').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updatedData) => {
  try {
    await firestore().collection('tasks').doc(taskId).update(updatedData);
    console.log('Task updated successfully');
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    await firestore().collection('tasks').doc(taskId).delete();
    console.log('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Function to process uploaded files with OpenAI
export const processFileWithOpenAI = async (fileContent) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'user', content: `Please summarize the following content: ${fileContent}` }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content; // Extract the summary or relevant information
  } catch (error) {
    console.error('Error processing file with OpenAI:', error);
    throw new Error('Failed to process file with OpenAI');
  }
};
