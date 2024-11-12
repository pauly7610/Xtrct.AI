// src/styles/styles.js

import { StyleSheet, Dimensions, Platform } from 'react-native';



const { width, height } = Dimensions.get('window');



export const colors = {

  background: '#000000',

  card: '#313442',

  primary: '#70B7FA',

  secondary: '#407BFF',

  white: '#FFFFFF',

  text: {

    primary: '#FFFFFF',

    secondary: 'rgba(255, 255, 255, 0.60)',

    tertiary: 'rgba(255, 255, 255, 0.40)'

  },

  task: {

    personal: '#EFEEFE',

    work: '#E0FAEF',

    study: '#FAF2E3',

    default: '#EFEEFE'

  },

  priority: {

    high: '#FF4444',

    medium: '#FFBB33',

    low: '#00C851'

  },

  status: {

    pending: '#70B7FA',

    inProgress: '#FFBB33',

    completed: '#00C851',

    blocked: '#FF4444'

  },

  border: 'rgba(217, 217, 217, 0.40)',

  overlay: 'rgba(0, 0, 0, 0.5)'

};



export const typography = {

  poppins: {

    regular: Platform.select({

      ios: 'Poppins',

      android: 'Poppins-Regular'

    }),

    medium: 'Poppins-Medium',

    semiBold: 'Poppins-SemiBold',

    bold: 'Poppins-Bold'

  }

};



export const shadows = {

  small: Platform.select({

    ios: {

      shadowColor: '#000',

      shadowOffset: { width: 0, height: 2 },

      shadowOpacity: 0.1,

      shadowRadius: 4

    },

    android: {

      elevation: 2

    }

  }),

  medium: Platform.select({

    ios: {

      shadowColor: '#000',

      shadowOffset: { width: 0, height: 4 },

      shadowOpacity: 0.15,

      shadowRadius: 8

    },

    android: {

      elevation: 4

    }

  })

};



export default StyleSheet.create({

  // Layout

  container: {

    flex: 1,

    backgroundColor: colors.background

  },

  safeArea: {

    flex: 1,

    backgroundColor: colors.background

  },

  contentContainer: {

    flex: 1,

    paddingHorizontal: 20

  },



  // Status Bar

  statusBar: {

    width: width,

    height: 60,

    justifyContent: 'center',

    alignItems: 'center'

  },

  statusBarText: {

    color: colors.text.primary,

    fontSize: 17,

    fontFamily: typography.poppins.semiBold

  },



  // Profile Button

  profileButton: {

    width: 40,

    height: 40,

    position: 'absolute',

    right: 20,

    top: 69,

    borderRadius: 36,

    borderWidth: 1,

    borderColor: colors.border

  },

  profileImage: {

    width: 36,

    height: 36,

    margin: 2,

    borderRadius: 30

  },



  // Search Bar

  searchBar: {

    width: width - 40,

    marginHorizontal: 20,

    marginTop: 129,

    padding: 8,

    backgroundColor: colors.card,

    borderRadius: 8,

    flexDirection: 'row',

    alignItems: 'center'

  },

  searchIcon: {

    width: 18,

    height: 18,

    marginRight: 6

  },

  searchInput: {

    flex: 1,

    color: colors.text.secondary,

    fontSize: 18,

    fontFamily: typography.poppins.medium

  },



  // Task List

  taskList: {

    marginTop: 10,

    paddingBottom: 100

  },

  taskCard: {

    width: '100%',

    height: 93,

    borderRadius: 12,

    marginBottom: 10,

    padding: 24

  },

  taskTitle: {

    color: '#000000',

    fontSize: 16,

    fontFamily: typography.poppins.semiBold

  },

  taskDescription: {

    marginTop: 10,

    color: 'rgba(0, 0, 0, 0.60)',

    fontSize: 12,

    fontFamily: typography.poppins.regular

  },



  // Empty State

  emptyStateContainer: {

    width: width - 40,

    height: 248,

    marginHorizontal: 20,

    marginTop: 216,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: 'rgba(217, 217, 217, 0.30)',

    alignItems: 'center',

    justifyContent: 'center'

  },

  celebrationIcon: {

    width: 85,

    height: 68,

    marginBottom: 25

  },

  emptyStateTitle: {

    color: colors.text.primary,

    fontSize: 18,

    fontFamily: typography.poppins.semiBold,

    marginBottom: 15

  },

  emptyStateDescription: {

    width: 257,

    textAlign: 'center',

    color: colors.text.secondary,

    fontSize: 14,

    fontFamily: typography.poppins.regular

  },



  // New Task Button

  newTaskButton: {

    position: 'absolute',

    left: 164,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5

  },

  newTaskIcon: {

    width: 20,

    height: 20

  },

  newTaskText: {

    color: 'rgba(255, 255, 255, 0.80)',

    fontSize: 16,

    fontFamily: typography.poppins.medium

  },



  // Bottom Navigation

  bottomNav: {

    height: 85,

    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0

  },

  bottomNavDivider: {

    height: 1,

    backgroundColor: 'rgba(255, 255, 255, 0.20)'

  },

  bottomNavContent: {

    height: 84,

    backgroundColor: colors.background,

    flexDirection: 'row',

    justifyContent: 'space-around',

    paddingTop: 10

  },

  navButton: {

    alignItems: 'center'

  },

  navIcon: {

    width: 30,

    height: 30

  },

  navLabel: {

    fontSize: 10,

    fontFamily: typography.poppins.medium

  },

  navLabelActive: {

    color: colors.text.primary

  },

  navLabelInactive: {

    color: colors.text.secondary

  },

  bottomIndicator: {

    width: 154,

    height: 5,

    backgroundColor: colors.white,

    borderRadius: 10,

    position: 'absolute',

    left: 138,

    bottom: 8

  },



  // Share Extension Styles

  shareContainer: {

    flex: 1,

    backgroundColor: colors.background,

    padding: 16

  },

  sharePreview: {

    backgroundColor: colors.card,

    borderRadius: 12,

    padding: 16,

    marginBottom: 16,

    ...shadows.small

  },

  shareButton: {

    backgroundColor: colors.primary,

    borderRadius: 8,

    padding: 16,

    alignItems: 'center',

    flexDirection: 'row',

    justifyContent: 'center'

  },

  shareButtonText: {

    color: colors.white,

    fontSize: 16,

    fontFamily: typography.poppins.medium,

    marginLeft: 8

  },



  // Task Form Styles

  formContainer: {

    flex: 1,

    backgroundColor: colors.background,

    padding: 16

  },

  input: {

    backgroundColor: colors.card,

    borderRadius: 8,

    padding: 16,

    color: colors.text.primary,

    fontFamily: typography.poppins.regular,

    fontSize: 16,

    marginBottom: 16

  },

  textArea: {

    height: 120,

    textAlignVertical: 'top'

  },

  datePickerButton: {

    backgroundColor: colors.card,

    borderRadius: 8,

    padding: 16,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 16

  },

  datePickerText: {

    color: colors.text.primary,

    fontFamily: typography.poppins.regular,

    fontSize: 16,

    marginLeft: 8

  },



  // Priority Selection

  priorityContainer: {

    flexDirection: 'row',

    marginBottom: 16,

    gap: 8

  },

  priorityButton: {

    flex: 1,

    padding: 12,

    borderRadius: 8,

    alignItems: 'center'

  },

  priorityText: {

    fontFamily: typography.poppins.medium,

    fontSize: 14

  },



  // Modal Styles

  modalContainer: {

    flex: 1,

    backgroundColor: colors.overlay,

    justifyContent: 'flex-end'

  },

  modalContent: {

    backgroundColor: colors.background,

    borderTopLeftRadius: 20,

    borderTopRightRadius: 20,

    padding: 16,

    maxHeight: height * 0.9

  },

  modalHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 16

  },

  modalTitle: {

    color: colors.text.primary,

    fontSize: 18,

    fontFamily: typography.poppins.semiBold

  },



  // Loading States

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center'

  },

  loadingText: {

    color: colors.text.secondary,

    marginTop: 8,

    fontFamily: typography.poppins.regular

  },



  // Error States

  errorContainer: {

    padding: 16,

    backgroundColor: colors.status.blocked,

    borderRadius: 8,

    marginBottom: 16

  },

  errorText: {

    color: colors.white,

    fontFamily: typography.poppins.medium

  }

});
