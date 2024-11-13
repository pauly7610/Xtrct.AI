# Xtract Mobile - Task Management App

## Tech Stack

### Frontend:
- **React Native**
- **Expo**
- **React Navigation**
- **react-native-ui-lib**
- **react-native-reanimated**

### Backend:
- **Node.js**
- **Express**
- **Anthropic API (Claude)**

### Database:
- **Firebase Firestore**
- **AsyncStorage**

### Authentication:
- **Firebase Auth**
- **OAuth 2.0 (Google, Apple)**

### Cloud Storage:
- **Firebase Storage**

### State Management:
- **React Context API**
- **AsyncStorage**

### API Integration:
- **Axios**
- **RESTful endpoints**
- **WebSocket connections**

### Third-Party Services:
- **Calendar APIs** (Google, Apple, Outlook)
- **Cloud Functions** (Firebase)
- **Push Notifications**

### Development Tools:
- **ESLint**
- **Prettier**
- **TypeScript** (if using)
- **Git**

### Testing:
- **Jest**
- **React Native Testing Library**

### CI/CD:
- **GitHub Actions**
- **Firebase App Distribution**
- **App Store Connect**
- **Google Play Console**

---

## Components

### TaskContext
- Manages core task-related state and functionality
- Handles task creation, updates, and deletion
- Manages focus sessions and synchronization
- Provides task analytics and productivity recommendations

### TaskService
- Interacts with Firebase Firestore to manage tasks
- Handles offline task creation and synchronization
- Integrates with the Anthropic service for task analysis and recommendations
- Manages team-level tasks and collaboration features

### AnthropicService
- Integrates with the Anthropic Claude API
- Processes task content and files for analysis and recommendations
- Generates productivity recommendations based on task data and user profiles

### CalendarIntegrationService
- Synchronizes tasks with connected calendar services
- Adds, updates, and removes task events in users' calendars
- Provides a unified interface for interacting with different calendar providers

### NotificationService
- Manages notification cache and scheduling
- Sends push notifications based on task updates and recommendations
- Provides methods to add, remove, and retrieve notifications

### NotificationCenter
- Displays user notifications in a centralized interface
- Allows users to view and dismiss notifications

### TeamScreen
- Enables team management: creating, updating, and deleting teams
- Allows users to switch between teams and view team-level tasks

### CoachingScreen
- Presents productivity recommendations from the Anthropic service
- Integrates with NotificationService for relevant notifications
- Allows sharing coaching insights and recommendations

### TaskForm
- Allows task creation with various options (priority, due date, attachments)
- Integrates with NotificationService to generate notifications for new tasks
- Leverages Anthropic service to enhance task data based on file attachments

### TaskAnalytics
- Displays detailed analytics and insights for tasks
- Includes progress overview, focus session history, AI-powered insights, and productivity recommendations
- Allows sharing of task analytics with others

### MainNavigator
- Manages overall navigation structure of the application
- Handles transitions between screens, including modals and nested navigation
- Integrates screens like TeamScreen, CoachingScreen, and NotificationCenter

### ServiceHandlers
- Provides centralized interface for interacting with various services
- Handles error logging and monitoring via AnalyticsHandlers
- Ensures service interactions are error-handled and monitored

### UtilityHandlers
- Provides error-handling and user display functions
- Offers utilities for formatting dates/times and generating unique identifiers

### CalendarAnalyticsHandlers
- Retrieves calendar-related analytics for tasks
- Tracks updates and deletions of task-related calendar events
- Integrates with CalendarIntegrationService

### ConflictResolutionHandlers
- Detects conflicts in calendar events and tasks
- Resolves conflicts using appropriate strategies
- Stores conflict resolution details for future reference

### SmartSchedulingHandlers
- Finds optimal meeting times based on participants and preferences
- Calculates priority scores for calendar events
- Checks participant availability for specific time slots

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pauly7610/Xtract.AT.git
2.**Navigate to the project directory:**

bash
Copy code
cd xtract-mobile

3. **Install dependencies**

bash
Copy code
npm install

4. **Set up required environment variables**
Set up required environment variables (Firebase, Anthropic, etc.).

3. **Start up the development server**

bash
Copy code
expo start


Usage
Sign in using preferred authentication (email/password, Google, Apple).
Explore features like creating tasks, managing teams, viewing analytics, and AI insights.
Customize settings to personalize app experience.
Collaborate with team members by assigning tasks, sharing updates, and monitoring team progress.
Manage tasks efficiently with offline capabilities and automatic synchronization.

