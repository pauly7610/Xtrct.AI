// src/screens/Summary/views/EmptyStateView.js

import React from 'react';

import { 

  View, 

  Text, 

  Image, 

  TouchableOpacity, 

  StyleSheet 

} from 'react-native';



export default function EmptyStateView({ onNewTask }) {

  return (

    <View style={styles.container}>

      <View style={styles.emptyStateContainer}>

        <Image 

          style={styles.celebrationIcon}

          source={require('src/assets/icons/celebration.png')}

        />

        <Text style={styles.title}>

          You are all caught up!

        </Text>

        <Text style={styles.description}>

          No tasks pending—take a moment to celebrate your progress!

        </Text>

      </View>



      <TouchableOpacity

        style={styles.newTaskButton}

        onPress={onNewTask}

      >

        <Image 

          style={styles.plusIcon}

          source={require('src/assets/icons/plus-circle.png')}

        />

        <Text style={styles.buttonText}>New Task</Text>

      </TouchableOpacity>

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: 'black',

    padding: 16,

    justifyContent: 'center',

    alignItems: 'center',

  },

  emptyStateContainer: {

    alignItems: 'center',

    marginBottom: 32,

  },

  celebrationIcon: {

    width: 64,

    height: 64,

    marginBottom: 16,

  },

  title: {

    fontSize: 24,

    fontWeight: '600',

    color: 'white',

    marginBottom: 8,

    textAlign: 'center',

  },

  description: {

    fontSize: 16,

    color: 'rgba(255,255,255,0.6)',

    textAlign: 'center',

  },

  newTaskButton: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#407BFF',

    paddingHorizontal: 24,

    paddingVertical: 12,

    borderRadius: 8,

  },

  plusIcon: {

    width: 24,

    height: 24,

    marginRight: 8,

  },

  buttonText: {

    color: 'white',

    fontSize: 16,

    fontWeight: '600',

  },

});
