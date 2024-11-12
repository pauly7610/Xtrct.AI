// src/utils/loadFonts.js
import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'Poppins': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
  });
};
