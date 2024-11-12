// src/components/dependencies/DependencyGraph.js

import React, { useState, useEffect } from 'react';

import { 

  View, 

  StyleSheet, 

  Dimensions, 

  TouchableOpacity, 

  ActivityIndicator,

  Alert,

  Text

} from 'react-native';

import Svg, { 

  Line, 

  Circle, 

  Text as SvgText, 

  Path,

  G,

  Defs,

  Marker

} from 'react-native-svg';

import { taskService } from 'src/services/taskService';

import { anthropicService } from 'src/services/AnthropicService';

import { 

  PanGestureHandler, 

  PinchGestureHandler, 

  State 

} from 'react-native-gesture-handler';

import Animated, {

  useAnimatedGestureHandler,

  useAnimatedStyle,

  useSharedValue,

  withSpring

} from 'react-native-reanimated';



const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

const NODE_RADIUS = 20;



const DependencyGraph = ({ userId, onTaskSelect }) => {

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [criticalPath, setCriticalPath] = useState([]);



  const scale = useSharedValue(1);

  const translateX = useSharedValue(0);

  const translateY = useSharedValue(0);



  useEffect(() => {

    fetchTasks();

  }, [userId]);



  const panGestureHandler = useAnimatedGestureHandler({

    onStart: (_, ctx) => {

      ctx.startX = translateX.value;

      ctx.startY = translateY.value;

    },

    onActive: (event, ctx) => {

      translateX.value = ctx.startX + event.translationX;

      translateY.value = ctx.startY + event.translationY;

    },

    onEnd: () => {

      translateX.value = withSpring(translateX.value);

      translateY.value = withSpring(translateY.value);

    },

  });



  const pinchGestureHandler = useAnimatedGestureHandler({

    onActive: (event) => {

      scale.value = event.scale;

    },

  });



  const animatedStyle = useAnimatedStyle(() => ({

    transform: [

      { translateX: translateX.value },

      { translateY: translateY.value },

      { scale: scale.value }

    ],

  }));



  const fetchTasks = async () => {

    try {

      setLoading(true);

      const userTasks = await taskService.fetchUserTasks(userId);

      setTasks(userTasks);

      analyzeDependencies(userTasks);

    } catch (error) {

      Alert.alert('Error', 'Failed to fetch tasks');

    } finally {

      setLoading(false);

    }

  };



  const analyzeDependencies = async (taskList) => {

    try {

      const analysis = await anthropicService.analyzeTaskNetwork(taskList);

      setCriticalPath(analysis.criticalPath || []);

    } catch (error) {

      console.error('Error analyzing dependencies:', error);

    }

  };



  const calculateNodePositions = () => {

    const positions = new Map();

    const levels = new Map();

    

    const getLevel = (taskId, visited = new Set()) => {

      if (visited.has(taskId)) return 0;

      visited.add(taskId);

      

      const task = tasks.find(t => t.id === taskId);

      if (!task?.dependencies?.length) return 0;

      

      return Math.max(...task.dependencies.map(depId => 

        getLevel(depId, visited)

      )) + 1;

    };



    // Calculate levels

    tasks.forEach(task => {

      const level = getLevel(task.id);

      if (!levels.has(level)) {

        levels.set(level, []);

      }

      levels.get(level).push(task);

    });



    // Assign positions with adjustments for better spacing

    const maxLevel = Math.max(...Array.from(levels.keys()));

    const levelHeight = HEIGHT / (maxLevel + 2);



    levels.forEach((levelTasks, level) => {

      const spacing = WIDTH / (levelTasks.length + 1);

      levelTasks.forEach((task, index) => {

        positions.set(task.id, {

          x: spacing * (index + 1),

          y: levelHeight * (level + 1),

          level

        });

      });

    });



    return positions;

  };



  const handleNodePress = (task) => {

    setSelectedTask(task);

    onTaskSelect?.(task);

  };



  const getNodeColor = (task) => {

    if (criticalPath.includes(task.id)) {

      return '#FF4444'; // Critical path

    }

    switch (task.status) {

      case 'completed':

        return '#4CAF50';

      case 'inProgress':

        return '#2196F3';

      case 'blocked':

        return '#FF9800';

      default:

        return '#9E9E9E';

    }

  };



  const nodePositions = calculateNodePositions();



  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#007AFF" />

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <PinchGestureHandler onGestureEvent={pinchGestureHandler}>

        <PanGestureHandler onGestureEvent={panGestureHandler}>

          <Animated.View style={[styles.graphContainer, animatedStyle]}>

            <Svg width={WIDTH} height={HEIGHT * 0.8}>

              <Defs>

                <Marker

                  id="arrow"

                  viewBox="0 0 10 10"

                  refX="8"

                  refY="5"

                  markerWidth="6"

                  markerHeight="6"

                  orient="auto"

                >

                  <Path d="M 0 0 L 10 5 L 0 10 z" fill="#666" />

                </Marker>

              </Defs>



              {/* Dependency Lines */}

              {tasks.map(task => 

                task.dependencies?.map(depId => {

                  const start = nodePositions.get(depId);

                  const end = nodePositions.get(task.id);

                  if (!start || !end) return null;



                  const isCritical = criticalPath.includes(task.id) && 

                                   criticalPath.includes(depId);



                  return (

                    <Line

                      key={`${task.id}-${depId}`}

                      x1={start.x}

                      y1={start.y}

                      x2={end.x}

                      y2={end.y}

                      stroke={isCritical ? '#FF4444' : '#666'}

                      strokeWidth={isCritical ? "3" : "2"}

                      markerEnd="url(#arrow)"

                      strokeDasharray={task.status === 'blocked' ? "5,5" : "none"}

                    />

                  );

                })

              )}



              {/* Task Nodes */}

              {tasks.map(task => {

                const pos = nodePositions.get(task.id);

                if (!pos) return null;



                return (

                  <G key={task.id}>

                    <Circle

                      cx={pos.x}

                      cy={pos.y}

                      r={NODE_RADIUS}

                      fill={getNodeColor(task)}

                      onPress={() => handleNodePress(task)}

                    />

                    <SvgText

                      x={pos.x}

                      y={pos.y}

                      fontSize="12"

                      fill="white"

                      textAnchor="middle"

                      alignmentBaseline="middle"

                    >

                      {task.title.substring(0, 2)}

                    </SvgText>

                    <SvgText

                      x={pos.x}

                      y={pos.y + NODE_RADIUS + 15}

                      fontSize="10"

                      fill="#333"

                      textAnchor="middle"

                    >

                      {task.title.substring(0, 15)}

                      {task.title.length > 15 ? '...' : ''}

                    </SvgText>

                  </G>

                );

              })}

            </Svg>

          </Animated.View>

        </PanGestureHandler>

      </PinchGestureHandler>



      {selectedTask && (

        <View style={styles.taskDetails}>

          <Text style={styles.taskTitle}>{selectedTask.title}</Text>

          <Text style={styles.taskStatus}>

            Status: {selectedTask.status}

          </Text>

          {selectedTask.dueDate && (

            <Text style={styles.taskDueDate}>

              Due: {new Date(selectedTask.dueDate).toLocaleDateString()}

            </Text>

          )}

        </View>

      )}

    </View>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#fff',

  },

  graphContainer: {

    flex: 1,

  },

  loadingContainer: {

    height: HEIGHT,

    justifyContent: 'center',

    alignItems: 'center',

  },

  taskDetails: {

    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    padding: 16,

    backgroundColor: 'white',

    borderTopLeftRadius: 16,

    borderTopRightRadius: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: -2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 5,

  },

  taskTitle: {

    fontSize: 16,

    fontWeight: 'bold',

    marginBottom: 5,

  },

  taskStatus: {

    fontSize: 14,

    color: '#666',

  },

  taskDueDate: {

    fontSize: 14,

    color: '#666',

    marginTop: 5,

  }

});



export default DependencyGraph;
