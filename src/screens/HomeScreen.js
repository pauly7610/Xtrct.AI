// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { useAuth } from '../context/AuthContext'; // Import your Auth context for user management
import { useTask } from '../context/TaskContext'; // Import Task context for task management
import { fetchTasks } from '../models/task'; // Function to fetch tasks from the API

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const { setCurrentUser } = useAuth(); // Function to set the current user in context
  const { addTask, updatePredictions } = useTask(); // Functions from Task context

  // Fetch tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const fetchedTasks = await fetchTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    loadTasks();
  }, []);

  // Function to handle Google Sign-In
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setUserInfo(userInfo);
      setCurrentUser(userInfo); // Save user info to context
      console.log('Google User Info:', userInfo);
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
    }
  };

  // Function to handle Apple Sign-In
  const signInWithApple = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken } = appleAuthRequestResponse;

      if (identityToken) {
        setUserInfo(appleAuthRequestResponse);
        setCurrentUser(appleAuthRequestResponse); // Save user info to context
        console.log('Apple User Info:', appleAuthRequestResponse);
      } else {
        console.error('Apple Sign-In failed - no identity token received');
      }
    } catch (error) {
      console.error('Error during Apple Sign-In:', error);
    }
  };

  // Function to sign out from Google
  const signOutFromGoogle = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      setCurrentUser(null); // Clear user info from context
      console.log('User signed out from Google successfully');
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  };

  // Function to sign out from Apple
  const signOutFromApple = () => {
    setUserInfo(null);
    setCurrentUser(null); // Clear user info from context
    console.log('User signed out from Apple successfully');
  };

  // Function to add a new task (example)
  const handleAddTask = () => {
    const newTask = {
      title: 'New Task',
      details: 'Task details here...',
      estimatedDuration: 30,
    };
    addTask(newTask);
    updatePredictions(); // Update predictions after adding a task
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Xtrct.AI</Text>
      {userInfo ? (
        <View>
          <Text style={styles.greeting}>
            Hello, {userInfo.user?.name || userInfo.fullName?.givenName}
          </Text>
          <Button title="Sign Out from Google" onPress={signOutFromGoogle} />
          <Button title="Sign Out from Apple" onPress={signOutFromApple} />
          <Button title="Add Task" onPress={handleAddTask} />
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.taskItem}>
                <Text>{item.title}</Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View>
          <Button title="Sign in with Google" onPress={signInWithGoogle} />
          <Button title="Sign in with Apple" onPress={signInWithApple} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 18,
    marginVertical: 10,
  },
  taskItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default HomeScreen;
