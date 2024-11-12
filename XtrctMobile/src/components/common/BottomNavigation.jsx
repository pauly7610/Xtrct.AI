// src/components/common/BottomNavigation.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar, PieChart, Share2, Search } from 'lucide-react';
// Or if you prefer React Native Vector Icons:
// import Icon from 'react-native-vector-icons/Feather';

const BottomNavigation = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const isActiveRoute = (routeName) => {
    return route.name === routeName;
  };

  const getIconColor = (routeName) => {
    return isActiveRoute(routeName) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
  };

  const getTextColor = (routeName) => {
    return isActiveRoute(routeName) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
  };

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)'
    }}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Share')}
        style={{ alignItems: 'center' }}
      >
        <Share2 
          size={20} 
          color={getIconColor('Share')}
        />
        <Text style={{
          color: getTextColor('Share'),
          fontSize: 10,
          fontFamily: 'Poppins',
          marginTop: 4
        }}>
          Sharing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Summary')}
        style={{ alignItems: 'center' }}
      >
        <PieChart 
          size={20} 
          color={getIconColor('Summary')}
        />
        <Text style={{
          color: getTextColor('Summary'),
          fontSize: 10,
          fontFamily: 'Poppins',
          marginTop: 4
        }}>
          Summary
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Analytics')}
        style={{ alignItems: 'center' }}
      >
        <Calendar 
          size={20} 
          color={getIconColor('Analytics')}
        />
        <Text style={{
          color: getTextColor('Analytics'),
          fontSize: 10,
          fontFamily: 'Poppins',
          marginTop: 4
        }}>
          Analytics
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Search')}
        style={{ alignItems: 'center' }}
      >
        <Search 
          size={20} 
          color={getIconColor('Search')}
        />
        <Text style={{
          color: getTextColor('Search'),
          fontSize: 10,
          fontFamily: 'Poppins',
          marginTop: 4
        }}>
          Search
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNavigation;
