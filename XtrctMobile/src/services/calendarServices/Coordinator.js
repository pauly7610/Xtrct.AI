// src/services/CalendarServicesCoordinator.js
import { DateTime } from 'luxon';
import { calendarAnalyticsService } from 'src/services/calendarServices/CalendarAnalyticsService';
import { smartMeetingScheduler } from 'src/services/smartMeetingScheduler';
import { conflictResolutionService } from 'src/services/calendarServices/ConflictResolutionService';
import { calendarSyncService } from 'src/services/calendarServices/CalendarSyncService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

class CalendarServicesCoordinator {
  constructor() {
    this.analytics = calendarAnalyticsService;
    this.scheduler = smartMeetingScheduler;
    this.conflicts = conflictResolutionService;
    this.sync = calendarSyncService;
  }

  /**
   * Main coordination methods for calendar operations
   */

  async createMeeting(meetingRequest) {
    try {
      // 1. Get relevant analytics
      const analytics = await this.analytics.getAnalytics(
        meetingRequest.organizerId,
        meetingRequest.timeRange
      );

      // 2. Find optimal times using analytics data
      const suggestedSlots = await this.scheduler.findOptimalMeetingTime({
        ...meetingRequest,
        preferences: {
          ...meetingRequest.preferences,
          historicalData: analytics
        }
      });

      // 3. Check for conflicts in suggested times
      const conflicts = await this.conflicts.detectConflicts(
        suggestedSlots.map(slot => ({
          ...meetingRequest,
          start: slot.start,
          end: slot.end
        }))
      );

      // 4. If conflicts exist, resolve them
      let finalSlot;
      if (conflicts.length > 0) {
        const resolutions = await this.conflicts.resolveConflicts(conflicts);
        finalSlot = this.getBestResolution(resolutions, suggestedSlots);
      } else {
        finalSlot = suggestedSlots[0];
      }

      // 5. Create the meeting and sync
      const createdMeeting = await this.sync.createEvent({
        ...meetingRequest,
        start: finalSlot.start,
        end: finalSlot.end
      });

      return {
        meeting: createdMeeting,
        analytics: analytics,
        conflicts: conflicts,
        alternativeSlots: suggestedSlots
      };
    } catch (error) {
      appMonitor.logError(error, { context: 'create_meeting' });
      throw error;
    }
  }

  async updateMeeting(meetingId, updates) {
    try {
      // 1. Get current meeting data
      const currentMeeting = await this.sync.getEvent(meetingId);

      // 2. Check for conflicts with proposed updates
      const conflicts = await this.conflicts.detectConflicts([
        { ...currentMeeting, ...updates }
      ]);

      // 3. If conflicts exist, resolve them
      if (conflicts.length > 0) {
        const resolutions = await this.conflicts.resolveConflicts(conflicts);
        updates = this.applyResolutions(updates, resolutions);
      }

      // 4. Update the meeting and sync
      const updatedMeeting = await this.sync.updateEvent(meetingId, updates);

      // 5. Update analytics
      await this.analytics.recordMeetingUpdate(currentMeeting, updatedMeeting);

      return {
        meeting: updatedMeeting,
        conflicts: conflicts,
        appliedResolutions: conflicts.length > 0
      };
    } catch (error) {
      appMonitor.logError(error, { context: 'update_meeting' });
      throw error;
    }
  }

  async deleteMeeting(meetingId) {
    try {
      const meeting = await this.sync.getEvent(meetingId);
      
      // Update analytics before deletion
      await this.analytics.recordMeetingDeletion(meeting);
      
      // Delete and sync
      await this.sync.deleteEvent(meetingId);
      
      return { success: true };
    } catch (error) {
      appMonitor.logError(error, { context: 'delete_meeting' });
      throw error;
    }
  }

  /**
   * Utility methods
   */

  getBestResolution(resolutions, suggestedSlots) {
    // Compare resolutions with suggested slots to find best match
    const scoredResolutions = resolutions.map(resolution => ({
      resolution,
      score: this.calculateResolutionScore(resolution, suggestedSlots)
    }));

    return scoredResolutions.sort((a, b) => b.score - a.score)[0].resolution;
  }

  calculateResolutionScore(resolution, suggestedSlots) {
    // Score based on proximity to suggested slots and resolution type
    let score = 0;
    suggestedSlots.forEach(slot => {
      const timeDiff = Math.abs(slot.start.diff(resolution.start).as('minutes'));
      score += 1 / (1 + timeDiff);
    });
    return score;
  }

  applyResolutions(updates, resolutions) {
    // Apply resolution changes to updates
    resolutions.forEach(resolution => {
      if (resolution.type === 'reschedule') {
        updates.start = resolution.newStart;
        updates.end = resolution.newEnd;
      }
      // Add other resolution types as needed
    });
    return updates;
  }
}

// Export singleton instance
export const calendarServicesCoordinator = new CalendarServicesCoordinator();

// Example usage:

// 1. Create a meeting
const meetingRequest = {
  title: 'Team Planning',
  description: 'Monthly team planning session',
  organizerId: 'user123',
  participants: [
    { email: 'user1@example.com', required: true },
    { email: 'user2@example.com', required: true }
  ],
  duration: 60,
  timeRange: {
    start: DateTime.now().toISO(),
    end: DateTime.now().plus({ days: 7 }).toISO()
  },
  preferences: {
    workingHours: { start: '09:00', end: '17:00' },
    preferredDays: ['Monday', 'Wednesday', 'Thursday']
  }
};

const result = await calendarServicesCoordinator.createMeeting(meetingRequest);
console.log('Meeting created:', result.meeting);
console.log('Alternative slots:', result.alternativeSlots);
if (result.conflicts.length > 0) {
  console.log('Resolved conflicts:', result.conflicts);
}

// 2. Update a meeting
const updateResult = await calendarServicesCoordinator.updateMeeting('meeting123', {
  title: 'Updated Team Planning',
  duration: 90
});

// 3. Delete a meeting
const deleteResult = await calendarServicesCoordinator.deleteMeeting('meeting123');
