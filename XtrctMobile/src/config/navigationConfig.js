// src/config/navigationConfig.js
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import appConfig from './appConfig';

export const Stack = createStackNavigator();

// Screen names as constants to avoid typos
export const SCREENS = {
  // Auth Screens
  AUTH: {
    SIGN_UP: 'SignUpLogIn',
    SIGN_IN: 'SignIn',
    ADD_EMAIL: 'addEmail',
    ADD_NAME: 'addName',
    FORGOT_PASSWORD: 'forgotPassword',
    FORGOT_PASSWORD_RESET: 'forgotPasswordReset',
    CHOOSE_NEW_PASSWORD: 'chooseNewPassword'
  },
  
  // Main App Screens
  MAIN: {
    HOME: 'HomeScreen',
    SUMMARY: 'summaryOfDay',
    SUMMARY_NO_TASKS: 'summaryTodayNoTasks',
    NEW_TASK: 'newTask',
    TASK_DETAILS: 'TaskDetails',
    SHARING: 'sharing'
  }
};

// Default header options
export const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: appConfig.theme.colors.background,
    shadowColor: 'transparent', // iOS
    elevation: 0, // Android
    height: Platform.OS === 'ios' ? 90 : 60
  },
  headerTintColor: appConfig.theme.colors.text,
  headerTitleStyle: {
    fontFamily: appConfig.theme.fonts.medium,
    fontSize: 18
  },
  cardStyle: {
    backgroundColor: appConfig.theme.colors.background
  }
};

// Auth stack specific options
export const authScreenOptions = {
  ...defaultScreenOptions,
  headerShown: false,
  gestureEnabled: false,
  animationEnabled: true
};

// Main app stack specific options
export const mainScreenOptions = {
  ...defaultScreenOptions,
  gestureEnabled: true,
  animationEnabled: true
};

// Screen-specific options
export const screenOptions = {
  [SCREENS.MAIN.NEW_TASK]: {
    title: 'New Task',
    presentation: 'modal',
    headerLeft: null, // Disable back button
    gestureEnabled: false
  },
  
  [SCREENS.MAIN.TASK_DETAILS]: {
    title: 'Task Details',
    animation: 'slide_from_right'
  },
  
  [SCREENS.MAIN.SUMMARY]: {
    title: 'Today',
    headerRight: () => null // Custom header right component if needed
  }
};

// Navigation themes
export const navigationTheme = {
  dark: true,
  colors: {
    primary: appConfig.theme.colors.primary,
    background: appConfig.theme.colors.background,
    card: appConfig.theme.colors.background,
    text: appConfig.theme.colors.text,
    border: 'transparent',
    notification: appConfig.theme.colors.error
  }
};

// Navigation configurations for different stacks
export const navigationConfig = {
  auth: {
    initialRouteName: SCREENS.AUTH.SIGN_UP,
    screenOptions: authScreenOptions,
    screens: {
      [SCREENS.AUTH.SIGN_UP]: {
        name: SCREENS.AUTH.SIGN_UP,
        options: {
          headerShown: false
        }
      },
      [SCREENS.AUTH.SIGN_IN]: {
        name: SCREENS.AUTH.SIGN_IN,
        options: {
          headerShown: false
        }
      },
      // Add other auth screens...
    }
  },
  
  main: {
    initialRouteName: SCREENS.MAIN.SUMMARY,
    screenOptions: mainScreenOptions,
    screens: {
      [SCREENS.MAIN.SUMMARY]: {
        name: SCREENS.MAIN.SUMMARY,
        options: screenOptions[SCREENS.MAIN.SUMMARY]
      },
      [SCREENS.MAIN.NEW_TASK]: {
        name: SCREENS.MAIN.NEW_TASK,
        options: screenOptions[SCREENS.MAIN.NEW_TASK]
      },
      // Add other main screens...
    }
  }
};

// Navigation helper functions
export const navigationHelpers = {
  // Reset navigation to a specific screen
  resetTo: (navigation, screenName, params = {}) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName, params }]
    });
  },

  // Navigate and remove all previous screens
  replaceWith: (navigation, screenName, params = {}) => {
    navigation.replace(screenName, params);
  },

  // Navigate to a screen with custom animation
  navigateWithAnimation: (navigation, screenName, params = {}) => {
    navigation.navigate(screenName, {
      ...params,
      animation: 'slide_from_right'
    });
  }
};

// Usage example:
/*
// In your navigation container
import { NavigationContainer } from '@react-navigation/native';
import { navigationConfig, navigationTheme, Stack } from './navigationConfig';

const AppNavigator = () => {
  const isAuthenticated = useAuth(); // Your auth hook

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        {...(isAuthenticated ? navigationConfig.main : navigationConfig.auth)}
      >
        {isAuthenticated ? (
          // Main app screens
          <>
            <Stack.Screen 
              name={SCREENS.MAIN.SUMMARY} 
              component={SummaryScreen}
              options={screenOptions[SCREENS.MAIN.SUMMARY]} 
            />
            <Stack.Screen 
              name={SCREENS.MAIN.NEW_TASK} 
              component={NewTaskScreen}
              options={screenOptions[SCREENS.MAIN.NEW_TASK]} 
            />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen 
              name={SCREENS.AUTH.SIGN_UP} 
              component={SignUpScreen} 
            />
            <Stack.Screen 
              name={SCREENS.AUTH.SIGN_IN} 
              component={SignInScreen} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// In your screens
const SomeScreen = ({ navigation }) => {
  const handleNavigation = () => {
    // Regular navigation
    navigation.navigate(SCREENS.MAIN.NEW_TASK);
    
    // Reset navigation
    navigationHelpers.resetTo(navigation, SCREENS.MAIN.SUMMARY);
    
    // Replace current screen
    navigationHelpers.replaceWith(navigation, SCREENS.MAIN.TASK_DETAILS);
  };
};
*/

export default {
  Stack,
  SCREENS,
  defaultScreenOptions,
  authScreenOptions,
  mainScreenOptions,
  screenOptions,
  navigationTheme,
  navigationConfig,
  navigationHelpers
};
