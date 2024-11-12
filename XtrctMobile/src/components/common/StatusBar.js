// src/components/common/StatusBar.js
import React from 'react';
import { View, Text } from 'react-native';
import styles from 'src/styles/styles';

export default function StatusBar() {
  return (
    <View style={styles.statusBar}>
      <View style={{ paddingHorizontal: 42, paddingVertical: 12 }}>
        <Text style={styles.statusBarText}>9:41</Text>
      </View>
    </View>
  );
}
