// src/services/CalendarIntegrationService.js
import axios from 'axios';
import { google } from 'googleapis';
import ical from 'node-ical';
import { Client } from '@microsoft/microsoft-graph-client';
import { parseFile } from './FileParsingService';

// Calendar API configs
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar'];
const MICROSOFT_SCOPES = ['Calendars.ReadWrite'];
const APPLE_TEAM_ID = 'your_apple_team_id';
const APPLE_KEY_ID = 'your_apple_key_id';

class CalendarIntegrationService {
  constructor() {
    this.googleAuth = null;
    this.outlookAuth = null;
    this.appleAuth = null;
  }

  // Authentication methods
  async authenticateGoogle(credentials) {
    const { client_id, client_secret, redirect_uri } = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    this.googleAuth = oAuth2Client;
    return oAuth2Client;
  }

  async authenticateOutlook(credentials) {
    this.outlookAuth = Client.init({
      authProvider: (done) => {
        done(null, credentials.accessToken);
      }
    });
    return this.outlookAuth;
  }

  async authenticateApple(credentials) {
    // Implement Apple Calendar authentication
    this.appleAuth = credentials;
    return this.appleAuth;
  }

  // Calendar operations
  async getCalendarEvents(calendarType, timeRange) {
    switch (calendarType) {
      case 'google':
        return this.getGoogleEvents(timeRange);
      case 'outlook':
        return this.getOutlookEvents(timeRange);
      case 'apple':
        return this.getAppleEvents(timeRange);
      default:
        throw new Error('Unsupported calendar type');
    }
  }

  async createCalendarEvent(calendarType, event) {
    switch (calendarType) {
      case 'google':
        return this.createGoogleEvent(event);
      case 'outlook':
        return this.createOutlookEvent(event);
      case 'apple':
        return this.createAppleEvent(event);
      default:
        throw new Error('Unsupported calendar type');
    }
  }

  async updateCalendarEvent(calendarType, eventId, updates) {
    switch (calendarType) {
      case 'google':
        return this.updateGoogleEvent(eventId, updates);
      case 'outlook':
        return this.updateOutlookEvent(eventId, updates);
      case 'apple':
        return this.updateAppleEvent(eventId, updates);
      default:
        throw new Error('Unsupported calendar type');
    }
  }
}

// Extended AnthropicService for calendar-aware task processing
class TaskProcessingService {
  constructor(calendarService) {
    this.calendarService = calendarService;
    this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    this.API_URL = 'https://api.anthropic.com/v1/messages';
  }

  async processWithClaude(content, systemPrompt = '', calendarContext = null) {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: this.buildPromptWithContext(content, calendarContext)
            }
          ],
          system: systemPrompt
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Error processing with Claude:', error);
      throw new Error('Failed to process content with Claude');
    }
  }

  buildPromptWithContext(content, calendarContext) {
    return `
      Context:
      ${JSON.stringify(calendarContext)}
      
      Content to process:
      ${content}
    `;
  }

  async processFileForTasks(file) {
    const fileContent = await parseFile(file);
    const calendarContext = await this.getCalendarContext();
    
    return this.processWithClaude(
      fileContent,
      `
      Analyze this file content and:
      1. Extract all tasks and commitments
      2. Identify deadlines and time requirements
      3. Determine task priorities based on context
      4. Suggest optimal calendar scheduling
      Return structured JSON with tasks and scheduling recommendations.
      `,
      calendarContext
    );
  }

  async scheduleTask(task, calendarType) {
    const calendarContext = await this.getCalendarContext();
    
    const schedulingResult = await this.processWithClaude(
      JSON.stringify(task),
      `
      Analyze this task and available calendar slots to:
      1. Determine optimal time slot based on priority
      2. Consider existing commitments and deadlines
      3. Account for task dependencies
      4. Suggest buffer time if needed
      Return specific scheduling recommendations.
      `,
      calendarContext
    );

    const event = this.convertTaskToCalendarEvent(task, schedulingResult);
    return this.calendarService.createCalendarEvent(calendarType, event);
  }

  async reprioritizeCalendar(newTasks) {
    const calendarContext = await this.getCalendarContext();
    
    const reprioritizationResult = await this.processWithClaude(
      JSON.stringify(newTasks),
      `
      Analyze all tasks and calendar events to:
      1. Reprioritize based on new tasks
      2. Suggest schedule adjustments
      3. Identify conflicts and propose resolutions
      4. Maintain buffer for urgent tasks
      Return comprehensive rescheduling plan.
      `,
      calendarContext
    );

    return this.applyCalendarUpdates(reprioritizationResult);
  }

  // Helper methods
  async getCalendarContext() {
    const googleEvents = await this.calendarService.getCalendarEvents('google');
    const outlookEvents = await this.calendarService.getCalendarEvents('outlook');
    const appleEvents = await this.calendarService.getCalendarEvents('apple');

    return {
      events: [...googleEvents, ...outlookEvents, ...appleEvents],
      availability: this.calculateAvailability([...googleEvents, ...outlookEvents, ...appleEvents])
    };
  }

  convertTaskToCalendarEvent(task, schedulingResult) {
    // Convert task and scheduling recommendation to calendar event format
    return {
      summary: task.title,
      description: task.description,
      start: schedulingResult.recommendedStart,
      end: schedulingResult.recommendedEnd,
      priority: task.priority,
      metadata: {
        taskId: task.id,
        priority: task.priority,
        dependencies: task.dependencies
      }
    };
  }

  async applyCalendarUpdates(reprioritizationPlan) {
    const updates = [];
    
    for (const update of reprioritizationPlan.updates) {
      updates.push(
        this.calendarService.updateCalendarEvent(
          update.calendarType,
          update.eventId,
          update.changes
        )
      );
    }

    return Promise.all(updates);
  }

  calculateAvailability(events) {
    // Calculate available time slots considering all calendar events
    // Return formatted availability windows
  }
}

export { CalendarIntegrationService, TaskProcessingService };