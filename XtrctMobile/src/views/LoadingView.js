// src/screens/Summary/views/LoadingView.js

import React from 'react';

import { 

  View, 

  ActivityIndicator, 

  StyleSheet 

} from 'react-native';



export default function LoadingView() {

  return (

    <View style={styles.container}>

      <ActivityIndicator size="large" color="#FFFFFF" />

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: 'black',

    justifyContent: 'center',

    alignItems: 'center',

  },

});
