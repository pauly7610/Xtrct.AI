// src/config/theme.js

const theme = {
  // Color palette
  colors: {
    // Primary colors
    primary: '#70B7FA',
    primaryDark: '#5096D9',
    primaryLight: '#9DCFFC',

    // Base colors
    background: '#000000',
    card: '#1D2226',
    surface: '#313442',
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.60)',
      disabled: 'rgba(255, 255, 255, 0.38)',
      inverse: '#000000'
    },

    // Status colors
    status: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#FF4444',
      info: '#2196F3'
    },

    // Priority colors
    priority: {
      low: '#00C851',
      medium: '#70B7FA',
      high: '#FF9800',
      critical: '#FF4444'
    },

    // Task status colors
    taskStatus: {
      pending: '#70B7FA',
      inProgress: '#4CAF50',
      completed: '#00C851',
      blocked: '#FF4444',
      cancelled: '#9E9E9E'
    },

    // Category colors
    category: {
      work: '#70B7FA',
      personal: '#4CAF50',
      study: '#FF9800',
      project: '#9C27B0'
    },

    // UI elements
    border: 'rgba(255, 255, 255, 0.12)',
    divider: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    ripple: 'rgba(255, 255, 255, 0.12)'
  },

  // Typography
  typography: {
    // Font families
    fonts: {
      regular: 'Poppins',
      medium: 'Poppins-Medium',
      bold: 'Poppins-Bold'
    },

    // Font sizes
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      h1: 32,
      h2: 24,
      h3: 20,
      h4: 18
    },

    // Line heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing
  spacing: {
    // Base spacing units
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,

    // Specific spacing
    gutter: 16,
    section: 32,
    screenPadding: 20
  },

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },

  // Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 6
    }
  },

  // Animation durations
  animation: {
    fast: 200,
    normal: 300,
    slow: 500
  },

  // Layout
  layout: {
    // Screen dimensions
    maxWidth: 430,
    headerHeight: 60,
    bottomNavHeight: 85,
    cardWidth: 390,

    // Component dimensions
    buttonHeight: 46,
    inputHeight: 51,
    iconSize: {
      small: 16,
      medium: 24,
      large: 32
    }
  },

  // Helper functions
  helpers: {
    // Get color with opacity
    getColorWithOpacity: (color, opacity) => {
      return color.replace(/^#/, 'rgba(').replace(/([0-9a-f]{2})/gi, (match) => 
        `${parseInt(match, 16)},`
      ).slice(0, -1) + `, ${opacity})`;
    },

    // Get contrasting text color
    getContrastText: (bgColor) => {
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return brightness > 128 ? theme.colors.text.inverse : theme.colors.text.primary;
    },

    // Get priority color
    getPriorityColor: (priority) => {
      return theme.colors.priority[priority] || theme.colors.priority.medium;
    },

    // Get status color
    getStatusColor: (status) => {
      return theme.colors.taskStatus[status] || theme.colors.taskStatus.pending;
    }
  },

  // Common styles
  common: {
    // Card styles
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      ...theme.shadows.md
    },

    // Button styles
    button: {
      height: theme.layout.buttonHeight,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.xl
    },

    // Input styles
    input: {
      height: theme.layout.inputHeight,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md
    }
  }
};

// Usage examples:
/*
// In a styled component
const StyledCard = styled.View`
  background-color: ${theme.colors.card};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px;
`;

// In a component
const TaskCard = ({ task }) => (
  <View style={[
    theme.common.card,
    { borderLeftColor: theme.helpers.getPriorityColor(task.priority) }
  ]}>
    <Text style={{
      fontFamily: theme.typography.fonts.medium,
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.text.primary
    }}>
      {task.title}
    </Text>
  </View>
);

// Using helper functions
const backgroundColor = theme.helpers.getColorWithOpacity(
  theme.colors.primary, 
  0.1
);

const textColor = theme.helpers.getContrastText(backgroundColor);
*/

export default theme;
