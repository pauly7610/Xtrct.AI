// app/App.js
import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext'; // Import TaskProvider
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { Button } from 'react-native';
import { useAuth } from './context/AuthContext'; // Import your Auth context for user management
import { createTaskWithGPT } from './services/OpenAIService'; // Import GPT service for task creation
import firestore from '@react-native-firebase/firestore'; // Import Firestore

const App = () => {
  const { setCurrentUser } = useAuth(); // Assume this function sets the current user in your context

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Google Client ID
      offlineAccess: true,
    });

    // Initialize Firestore
    const initializeFirestore = () => {
      console.log('Firestore initialized');
    };

    initializeFirestore();
  }, []);

  // Function to handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setCurrentUser(userInfo); // Save user information to context
      console.log('Google User Info:', userInfo);
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
    }
  };

  // Function to handle Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken } = appleAuthRequestResponse;

      if (identityToken) {
        setCurrentUser(appleAuthRequestResponse); // Save user information to context
        console.log('Apple User Info:', appleAuthRequestResponse);
      } else {
        console.error('Apple Sign-In failed - no identity token received');
      }
    } catch (error) {
      console.error('Error during Apple Sign-In:', error);
    }
  };

  // Function to create a task using GPT
  const handleCreateTask = async (voiceInput) => {
    try {
      const taskDescription = await createTaskWithGPT(voiceInput);
      console.log('New Task Description:', taskDescription);
      // You can integrate the task creation process here to save it to your task context
    } catch (error) {
      console.error('Error creating task with GPT:', error);
    }
  };

  return (
    <AuthProvider>
      <TaskProvider>
        <NavigationContainer>
          <AppNavigator />
          <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
          <AppleButton
            buttonStyle={AppleButton.Style.BLACK}
            buttonType={AppleButton.Type.SIGN_IN}
            style={{ width: 160, height: 45 }} // Adjust the size as needed
            onPress={handleAppleSignIn}
          />
          {/* Example button to create a task using voice input (for demonstration) */}
          <Button title="Create Task with GPT" onPress={() => handleCreateTask('Complete the project report')} />
        </NavigationContainer>
      </TaskProvider>
    </AuthProvider>
  );
};

export default App;
