import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import AuthSignIn from 'src/screens/auth/AuthSignIn';
import HomeScreen from 'src/screens/HomeScreen';
import NewTask from 'src/screens/NewTask';
import Sharing from 'src/screens/Sharing';
import TaskAnalytics from 'src/screens/TaskAnalytics';
import SummaryOfDay from 'src/screens/SummaryOfDay';

const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: 'black' },
  presentation: Platform.select({
    ios: 'modal',
    android: 'transparentModal',
  }),
  animationEnabled: true,
  gestureEnabled: Platform.OS === 'ios',
};

const MainNavigator = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#007AFF',
          background: 'black',
          card: 'black',
          text: 'white',
          border: 'rgba(255,255,255,0.1)',
          notification: '#FF3B30',
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={screenOptions}
      >
        {/* Splash Screen */}
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen}
          options={{
            gestureEnabled: true,
            animationEnabled: false,
          }}
        />

        {/* Main Flow */}
        <Stack.Screen 
          name="Main" 
          component={AuthSignIn}
          options={{ 
            gestureEnabled: false,
            animationEnabled: false,
          }}
        />

        <Stack.Screen 
          name="SummaryOfDay" 
          component={SummaryOfDay}
          options={{
            gestureEnabled: false,
            animationEnabled: false
          }}
        />

        {/* Modals */}
        <Stack.Screen 
          name="NewTask" 
          component={NewTask}
          options={{
            ...Platform.select({
              ios: {
                presentation: 'modal',
                gestureEnabled: true,  
              },
              android: {
                presentation: 'transparentModal',
                gestureEnabled: true,  
              },
            }),
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
          }}
        />

        
        <Stack.Screen 
          name="TaskAnalytics" 
          component={TaskAnalytics}
          options={{
            ...Platform.select({
              ios: {
                presentation: 'modal',
                gestureEnabled: true,
              },
              android: {
                presentation: 'transparentModal',
              },
            }),
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
          }}
        />

        <Stack.Screen 
          name="Sharing" 
          component={Sharing}
          options={{
            ...Platform.select({
              ios: {
                presentation: 'modal',
                gestureEnabled: true,
              },
              android: {
                presentation: 'transparentModal',
              },
            }),
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
