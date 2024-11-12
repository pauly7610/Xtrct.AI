// src/components/common/SearchBar.js
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react';
// Alternative using React Native Vector Icons:
// import Icon from 'react-native-vector-icons/Feather';

const SearchBar = ({ 
  value = '', 
  onChangeText, 
  onClear, 
  placeholder = 'Search...',
  containerStyle,
  inputStyle 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Search 
        size={20} 
        color="rgba(255, 255, 255, 0.6)"
        style={styles.searchIcon}
      />
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        style={[styles.input, inputStyle]}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <X 
            size={20} 
            color="rgba(255, 255, 255, 0.6)"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#313442',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins',
    padding: 0, // Remove default padding
    height: 40,
  },
  clearButton: {
    padding: 4,
  }
});

export default SearchBar;
