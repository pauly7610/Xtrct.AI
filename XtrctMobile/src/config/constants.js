// src/constants/taskConstants.js

// Task Statuses with additional metadata
export const TaskStatus = {
  PENDING: {
    id: 'pending',
    label: 'Pending',
    color: '#70B7FA',
    icon: 'clock',
    order: 0,
    allowedTransitions: ['in_progress', 'cancelled', 'blocked']
  },
  IN_PROGRESS: {
    id: 'in_progress',
    label: 'In Progress',
    color: '#4CAF50',
    icon: 'play-circle',
    order: 1,
    allowedTransitions: ['completed', 'blocked', 'cancelled']
  },
  COMPLETED: {
    id: 'completed',
    label: 'Completed',
    color: '#00C851',
    icon: 'check-circle',
    order: 2,
    allowedTransitions: ['in_progress']
  },
  BLOCKED: {
    id: 'blocked',
    label: 'Blocked',
    color: '#FF4444',
    icon: 'alert-triangle',
    order: 3,
    allowedTransitions: ['pending', 'in_progress', 'cancelled']
  },
  CANCELLED: {
    id: 'cancelled',
    label: 'Cancelled',
    color: '#9E9E9E',
    icon: 'x-circle',
    order: 4,
    allowedTransitions: ['pending']
  }
};

// Priority Levels with metadata
export const PriorityLevels = {
  LOW: {
    id: 'low',
    value: 0,
    label: 'Low',
    color: '#00C851',
    icon: 'arrow-down',
    order: 0,
    aiScore: {
      min: 0,
      max: 30
    }
  },
  MEDIUM: {
    id: 'medium',
    value: 50,
    label: 'Medium',
    color: '#70B7FA',
    icon: 'minus',
    order: 1,
    aiScore: {
      min: 31,
      max: 60
    }
  },
  HIGH: {
    id: 'high',
    value: 80,
    label: 'High',
    color: '#FF9800',
    icon: 'arrow-up',
    order: 2,
    aiScore: {
      min: 61,
      max: 90
    }
  },
  CRITICAL: {
    id: 'critical',
    value: 100,
    label: 'Critical',
    color: '#FF4444',
    icon: 'alert-octagon',
    order: 3,
    aiScore: {
      min: 91,
      max: 100
    }
  }
};

// Task Categories
export const TaskCategories = {
  WORK: {
    id: 'work',
    label: 'Work',
    color: '#70B7FA',
    icon: 'briefcase'
  },
  PERSONAL: {
    id: 'personal',
    label: 'Personal',
    color: '#4CAF50',
    icon: 'user'
  },
  STUDY: {
    id: 'study',
    label: 'Study',
    color: '#FF9800',
    icon: 'book'
  },
  PROJECT: {
    id: 'project',
    label: 'Project',
    color: '#9C27B0',
    icon: 'folder'
  }
};

// Task Configuration
export const TaskConfig = {
  // Focus and Break Durations
  time: {
    DEFAULT_FOCUS_DURATION: 25, // minutes
    DEFAULT_BREAK_DURATION: 5,  // minutes
    MIN_FOCUS_SESSION: 5,       // minutes
    MAX_FOCUS_SESSION: 120,     // minutes
    BREAK_INTERVALS: [5, 10, 15, 20], // available break durations
    POMODORO_LONG_BREAK: 15,    // minutes
    POMODOROS_UNTIL_LONG_BREAK: 4
  },

  // Task Limits
  limits: {
    MAX_DEPENDENCIES: 10,
    MAX_SUBTASKS: 20,
    MAX_ATTACHMENTS: 5,
    MAX_TAGS: 10,
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 1000
  },

  // Update Intervals
  intervals: {
    PRIORITY_UPDATE: 60, // minutes
    STATUS_CHECK: 15,    // minutes
    SYNC_INTERVAL: 5,    // minutes
    AUTO_SAVE: 1        // minutes
  },

  // AI Configuration
  ai: {
    MIN_CONTENT_LENGTH: 10,
    ANALYSIS_THRESHOLD: 0.7,
    SUGGESTION_CONFIDENCE: 0.8,
    UPDATE_BATCH_SIZE: 10
  }
};

// Helper functions
export const TaskHelpers = {
  // Get status details
  getStatusDetails: (statusId) => {
    return TaskStatus[statusId.toUpperCase()] || TaskStatus.PENDING;
  },

  // Get priority details
  getPriorityDetails: (priorityValue) => {
    return Object.values(PriorityLevels).find(
      priority => (
        priorityValue >= priority.aiScore.min && 
        priorityValue <= priority.aiScore.max
      )
    ) || PriorityLevels.MEDIUM;
  },

  // Check if status transition is allowed
  isStatusTransitionAllowed: (currentStatus, newStatus) => {
    const status = TaskStatus[currentStatus.toUpperCase()];
    return status.allowedTransitions.includes(newStatus.toLowerCase());
  },

  // Calculate priority from AI score
  calculatePriorityFromScore: (score) => {
    return TaskHelpers.getPriorityDetails(score).id;
  },

  // Format duration
  formatDuration: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 
      ? `${hours}h ${mins}m`
      : `${mins}m`;
  },

  // Validate task data
  validateTaskData: (data) => {
    const errors = [];

    if (!data.title || data.title.length > TaskConfig.limits.MAX_TITLE_LENGTH) {
      errors.push('Invalid title length');
    }

    if (data.description?.length > TaskConfig.limits.MAX_DESCRIPTION_LENGTH) {
      errors.push('Description too long');
    }

    if (data.dependencies?.length > TaskConfig.limits.MAX_DEPENDENCIES) {
      errors.push('Too many dependencies');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Example usage:
/*
// Get status details
const status = TaskHelpers.getStatusDetails('in_progress');
console.log(status.label); // "In Progress"
console.log(status.color); // "#4CAF50"

// Check priority
const priority = TaskHelpers.getPriorityDetails(75);
console.log(priority.label); // "High"

// Validate status transition
const canTransition = TaskHelpers.isStatusTransitionAllowed('PENDING', 'in_progress');
console.log(canTransition); // true

// Format duration
console.log(TaskHelpers.formatDuration(65)); // "1h 5m"

// Validate task data
const validation = TaskHelpers.validateTaskData({
  title: 'New Task',
  description: 'Task description'
});
console.log(validation.isValid); // true
*/

export default {
  TaskStatus,
  PriorityLevels,
  TaskCategories,
  TaskConfig,
  TaskHelpers
};
