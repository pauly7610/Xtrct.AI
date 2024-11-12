import React, { useState, useEffect } from 'react';

import {

  View,

  StyleSheet,

  Dimensions,

  ActivityIndicator,

  Alert

} from 'react-native';

import { taskService } from 'src/services/taskService';

import { DragDropContext, Droppable } from 'react-native-drag-drop';

import TaskList from 'src/features/dependencies/TaskList';

import TaskForm from 'src/features/tasks/TaskForm';

import Animated, {

  FadeIn,

  Layout

} from 'react-native-reanimated';



const { width } = Dimensions.get('window');



const TaskBoard = ({ userId, onTaskSelect }) => {

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);



  useEffect(() => {

    fetchTasks();

  }, [userId]);



  const fetchTasks = async () => {

    try {

      setLoading(true);

      const userTasks = await taskService.fetchUserTasks(userId);

      setTasks(userTasks);

    } catch (error) {

      Alert.alert('Error', 'Failed to fetch tasks');

    } finally {

      setLoading(false);

    }

  };



  const handleDragEnd = async (result) => {

    if (!result.destination) return;



    try {

      const { source, destination, draggableId } = result;

      

      // Update task status based on destination

      await taskService.updateTaskStatus(

        draggableId,

        destination.droppableId,

        {

          lastUpdated: new Date().toISOString()

        }

      );



      fetchTasks();

    } catch (error) {

      Alert.alert('Error', 'Failed to update task');

    }

  };



  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#007AFF" />

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <DragDropContext onDragEnd={handleDragEnd}>

        <View style={styles.boardContainer}>

          <Droppable droppableId="todo">

            {(provided) => (

              <Animated.View 

                entering={FadeIn}

                layout={Layout}

                style={styles.column}

                {...provided.droppableProps}

                ref={provided.innerRef}

              >

                <TaskList 

                  tasks={tasks.filter(t => t.status === 'todo')}

                  onTaskPress={onTaskSelect}

                />

                {provided.placeholder}

              </Animated.View>

            )}

          </Droppable>



          <Droppable droppableId="inProgress">

            {(provided) => (

              <Animated.View 

                entering={FadeIn}

                layout={Layout}

                style={styles.column}

                {...provided.droppableProps}

                ref={provided.innerRef}

              >

                <TaskList 

                  tasks={tasks.filter(t => t.status === 'inProgress')}

                  onTaskPress={onTaskSelect}

                />

                {provided.placeholder}

              </Animated.View>

            )}

          </Droppable>



          <Droppable droppableId="completed">

            {(provided) => (

              <Animated.View 

                entering={FadeIn}

                layout={Layout}

                style={styles.column}

                {...provided.droppableProps}

                ref={provided.innerRef}

              >

                <TaskList 

                  tasks={tasks.filter(t => t.status === 'completed')}

                  onTaskPress={onTaskSelect}

                />

                {provided.placeholder}

              </Animated.View>

            )}

          </Droppable>

        </View>

      </DragDropContext>



      {showForm && (

        <TaskForm

          onClose={(newTask) => {

            setShowForm(false);

            if (newTask) {

              fetchTasks();

            }

          }}

        />

      )}

    </View>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#f5f5f5',

  },

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  boardContainer: {

    flexDirection: 'row',

    padding: 8,

  },

  column: {

    width: width * 0.8,

    marginHorizontal: 8,

    backgroundColor: 'white',

    borderRadius: 12,

    padding: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  }

});



export default TaskBoard;
