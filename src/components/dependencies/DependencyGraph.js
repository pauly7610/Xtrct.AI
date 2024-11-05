// src/components/DependencyGraph.js
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTask } from '../../context/TaskContext';

const DependencyGraph = () => {
  const { tasks, getTaskDependencies } = useTask();
  const WIDTH = Dimensions.get('window').width - 40;
  const HEIGHT = 400;

  // Calculate node positions in a hierarchical layout
  const calculateNodePositions = () => {
    const positions = new Map();
    const levels = new Map();
    
    // Calculate levels
    const getLevel = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies.length) return 0;
      
      const maxLevel = Math.max(...task.dependencies.map(depId => 
        getLevel(depId, visited)
      ));
      return maxLevel + 1;
    };

    tasks.forEach(task => {
      const level = getLevel(task.id);
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level).push(task);
    });

    // Assign positions
    levels.forEach((levelTasks, level) => {
      const spacing = WIDTH / (levelTasks.length + 1);
      levelTasks.forEach((task, index) => {
        positions.set(task.id, {
          x: spacing * (index + 1),
          y: 50 + (level * 100)
        });
      });
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT}>
        {/* Draw dependency lines */}
        {tasks.map(task => 
          task.dependencies.map(depId => {
            const start = nodePositions.get(depId);
            const end = nodePositions.get(task.id);
            return start && end ? (
              <Line
                key={`${task.id}-${depId}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#666"
                strokeWidth="2"
              />
            ) : null;
          })
        )}
        
        {/* Draw task nodes */}
        {tasks.map(task => {
          const pos = nodePositions.get(task.id);
          return pos ? (
            <React.Fragment key={task.id}>
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={task.status === 'completed' ? '#4CAF50' : '#2196F3'}
              />
              <SvgText
                x={pos.x}
                y={pos.y + 35}
                fontSize="12"
                fill="#000"
                textAnchor="middle"
              >
                {task.title.substring(0, 10)}
              </SvgText>
            </React.Fragment>
          ) : null;
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default DependencyGraph;