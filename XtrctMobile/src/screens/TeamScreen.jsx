import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { Text } from 'react-native-ui-lib';
import { useTask } from '../context/TaskContext';

const TeamScreen = () => {
  const { teams, currentTeam, createTeam, updateTeam, deleteTeam, fetchTeamTasks } = useTask();
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    try {
      await createTeam({ name: newTeamName });
      setNewTeamName('');
      fetchTeamTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const handleTeamPress = (team) => {
    setCurrentTeam(team);
    fetchTeamTasks();
  };

  const handleTeamUpdate = async (team) => {
    const newName = await promptForTeamName(team.name);
    if (newName) {
      await updateTeam(team.id, { name: newName });
    }
  };

  const handleTeamDelete = async (team) => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteTeam(team.id) }
      ]
    );
  };

  const promptForTeamName = async (initialName) => {
    return new Promise((resolve) => {
      Alert.prompt(
        'Update Team Name',
        'Enter the new team name',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (name) => resolve(name) }
        ],
        'plain-text',
        initialName
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h2>Teams</Text>
        <View style={styles.newTeamContainer}>
          <TextInput
            style={styles.newTeamInput}
            placeholder="New Team Name"
            value={newTeamName}
            onChangeText={setNewTeamName}
          />
          <Pressable style={styles.newTeamButton} onPress={handleCreateTeam}>
            <Text style={styles.newTeamButtonText}>Create</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.teamItem,
              item.id === currentTeam?.id && styles.currentTeam
            ]}
            onPress={() => handleTeamPress(item)}
            onLongPress={() => handleTeamUpdate(item)}
          >
            <Text style={styles.teamName}>{item.name}</Text>
            <Pressable onPress={() => handleTeamDelete(item)}>
              <Text style={styles.deleteTeam}>✕</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  newTeamContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  newTeamInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    flex: 1
  },
  newTeamButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  newTeamButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  currentTeam: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF'
  },
  teamName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600'
  },
  deleteTeam: {
    color: '#FF4444',
    fontSize: 20
  }
});

export default TeamScreen;