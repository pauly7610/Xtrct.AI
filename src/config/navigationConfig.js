// app/config/navigationConfig.js
import { createStackNavigator } from '@react-navigation/stack';

export const Stack = createStackNavigator();

export const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: '#3498db',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};
