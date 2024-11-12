// src/screens/Summary/components/ProfileButton.js
import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import styles from 'src/styles/styles';

export default function ProfileButton() {
  return (
    <TouchableOpacity style={styles.profileButton}>
      <Image
        style={styles.profileImage}
        source={{ uri: 'placeholder' }}
      />
    </TouchableOpacity>
  );
}
