import React, { useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { Text, Textarea, Picker } from 'react-native-ui-lib';
import { useTask } from '../context/TaskContext';

const ProfileScreen = () => {
  const { userPreferences, updateUserPreferences } = useTask();
  const [preferences, setPreferences] = useState(userPreferences);

  const handleSavePreferences = () => {
    updateUserPreferences(preferences);
  };

  return (
    <View style={styles.container}>
      <Text h2>Productivity Preferences</Text>

      <Text h4>Prioritization Algorithm</Text>
      <Picker
        value={preferences.prioritizationAlgorithm}
        onChange={(value) => setPreferences({ ...preferences, prioritizationAlgorithm: value })}
        items={[
          { label: 'Default', value: 'default' },
          { label: 'Custom', value: 'custom' }
        ]}
      />

      <Text h4>Task Categories</Text>
      <FlatList
        data={preferences.taskCategories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <Text>{item}</Text>
            <Pressable
              onPress={() => {
                setPreferences({
                  ...preferences,
                  taskCategories: preferences.taskCategories.filter(c => c !== item)
                });
              }}
            >
              <Text>Remove</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <Pressable
            onPress={() => {
              setPreferences({
                ...preferences,
                taskCategories: [...preferences.taskCategories, 'New Category']
              });
            }}
          >
            <Text>Add Category</Text>
          </Pressable>
        }
      />

      <Text h4>Working Hours</Text>
      <View style={styles.workingHours}>
        <Textarea
          value={preferences.workingHours.start}
          onChangeText={(start) => setPreferences({ ...preferences, workingHours: { ...preferences.workingHours, start } })}
          placeholder="Start Time"
        />
        <Textarea
          value={preferences.workingHours.end}
          onChangeText={(end) => setPreferences({ ...preferences, workingHours: { ...preferences.workingHours, end } })}
          placeholder="End Time"
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSavePreferences}>
        <Text>Save Preferences</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... previous styles
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  workingHours: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  }
});

export default ProfileScreen;