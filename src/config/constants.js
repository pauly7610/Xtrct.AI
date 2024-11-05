export const TaskStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    BLOCKED: 'blocked',
    CANCELLED: 'cancelled'
  };
  
  export const PriorityLevels = {
    LOW: 0,
    MEDIUM: 50,
    HIGH: 80,
    CRITICAL: 100
  };
  
  export const CONFIG = {
    DEFAULT_FOCUS_DURATION: 25, // minutes
    DEFAULT_BREAK_DURATION: 5,  // minutes
    MAX_DEPENDENCIES: 10,
    MIN_FOCUS_SESSION: 5,       // minutes
    MAX_FOCUS_SESSION: 120,     // minutes
    PRIORITY_UPDATE_INTERVAL: 60 // minutes
  };
  