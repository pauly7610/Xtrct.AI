
// src/components/dependencies/ChainCompletion.js
import React, { useEffect } from 'react';
import { Link2, CheckCircle2, CircleDot, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTask } from '../../context/TaskContext';

const ChainCompletion = ({ taskId }) => {
  const { tasks, updateTask } = useTask();

  const getTaskChain = (id, visited = new Set()) => {
    if (visited.has(id)) return [];
    visited.add(id);
    
    const task = tasks.find(t => t.id === id);
    if (!task) return [];
    
    const dependencyChains = task.dependencies.flatMap(depId => 
      getTaskChain(depId, visited)
    );
    
    return [...dependencyChains, task];
  };

  const taskChain = getTaskChain(taskId);
  
  const canComplete = (task) => {
    const index = taskChain.findIndex(t => t.id === task.id);
    const previousTasks = taskChain.slice(0, index);
    return previousTasks.every(t => t.status === 'completed');
  };

  useEffect(() => {
    const checkChainCompletion = () => {
      taskChain.forEach(task => {
        if (task.status !== 'completed' && canComplete(task)) {
          updateTask(task.id, { 
            status: 'ready',
            lastUpdated: new Date().toISOString()
          });
        }
      });
    };

    checkChainCompletion();
  }, [taskChain, updateTask]);

  if (!taskChain.length) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Dependency Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            {taskChain.map((task, index) => (
              <div key={task.id}>
                <div className="flex items-center gap-3">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : task.status === 'ready' ? (
                    <CircleDot className="w-5 h-5 text-blue-500" />
                  ) : (
                    <CircleDot className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={`flex-1 ${
                    task.status === 'completed' ? 'line-through text-gray-500' : ''
                  }`}>
                    {task.title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {task.status}
                  </span>
                </div>
                {index < taskChain.length - 1 && (
                  <div className="ml-2 my-1 border-l-2 border-dashed border-gray-200 h-4" />
                )}
              </div>
            ))}
          </div>

          {taskChain.some(task => task.status === 'ready') && (
            <Alert>
              <CircleDot className="w-4 h-4 text-blue-500" />
              <AlertDescription>
                One or more tasks in the chain are ready to start
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
            <span>{taskChain.filter(t => t.status === 'completed').length} completed</span>
            <span>{taskChain.filter(t => t.status === 'ready').length} ready</span>
            <span>{taskChain.filter(t => !['completed', 'ready'].includes(t.status)).length} pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChainCompletion;