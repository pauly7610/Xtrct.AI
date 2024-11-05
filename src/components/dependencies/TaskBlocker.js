import React from 'react';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTask } from '../../context/TaskContext';

const TaskBlocker = ({ taskId }) => {
  const { tasks } = useTask();
  
  const task = tasks.find(t => t.id === taskId);
  const dependencies = task?.dependencies || [];
  
  if (!task || !dependencies.length) return null;

  const dependencyTasks = dependencies.map(depId => 
    tasks.find(t => t.id === depId)
  ).filter(Boolean);

  const completedDependencies = dependencyTasks.filter(t => t.status === 'completed');
  const progress = (completedDependencies.length / dependencyTasks.length) * 100;
  const isBlocked = completedDependencies.length < dependencyTasks.length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-x-2">
        {isBlocked ? (
          <Lock className="w-5 h-5 text-yellow-500" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
        <CardTitle className="text-lg">
          {isBlocked ? 'Task Blocked' : 'Ready to Start'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              Dependencies Progress
            </span>
            <span className="text-sm font-medium">
              {completedDependencies.length}/{dependencyTasks.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
          
          <div className="space-y-2">
            {dependencyTasks.map(dep => (
              <div 
                key={dep.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  dep.status === 'completed' 
                    ? 'bg-green-50' 
                    : 'bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {dep.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={dep.status === 'completed' ? 'line-through text-gray-500' : ''}>
                    {dep.title}
                  </span>
                </div>
                <span className="text-sm">
                  {dep.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>

          {isBlocked && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-yellow-800">
                  This task is blocked until all dependencies are completed
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskBlocker;
