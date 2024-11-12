// src/services/SmartMeetingScheduler.js
// src/services/SmartMeetingScheduler.js
import { DateTime } from 'luxon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import { calendarAnalyticsService } from 'src/services/calendarServices/CalendarAnalyticsService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const SCHEDULER_CACHE = {
  PREFERENCES: '@scheduler_preferences_',
  HISTORY: '@scheduling_history_',
  OPTIMAL_TIMES: '@optimal_times_'
};

class SmartMeetingScheduler {
  constructor() {
    this.defaultSettings = {
      minimumBuffer: 15,
      preferredDuration: 30,
      maxSuggestionsPerRequest: 5,
      lookAheadDays: 14,
      scoringWeights: {
        timePreference: 0.3,
        historicalSuccess: 0.2,
        attendeeAvailability: 0.3,
        timeZoneCompatibility: 0.2
      }
    };
  }

  async findOptimalMeetingTime(request) {
    try {
      const {
        participants,
        duration = this.defaultSettings.preferredDuration,
        timeRange,
        preferences = {},
        mustHaveParticipants = [],
        meetingType = 'standard'
      } = request;

      appMonitor.logInfo('Finding optimal meeting time', { participants, duration });

      // Get cached optimal times if available
      const cachedTimes = await this.getCachedOptimalTimes(participants, timeRange);
      if (cachedTimes) return cachedTimes;

      // Parallel fetching of required data
      const [
        availabilities,
        analytics,
        historicalData
      ] = await Promise.all([
        this.getParticipantAvailability(participants, timeRange),
        calendarAnalyticsService.getAnalytics(participants[0], timeRange),
        this.getHistoricalMeetingData(participants)
      ]);

      // Find potential slots
      const commonSlots = await this.findCommonAvailability({
        availabilities,
        duration,
        mustHaveParticipants,
        preferences
      });

      // Rank and optimize slots
      const rankedSlots = await this.rankTimeSlots({
        slots: commonSlots,
        analytics,
        historicalData,
        preferences,
        participants,
        meetingType
      });

      // Cache results
      await this.cacheOptimalTimes(participants, timeRange, rankedSlots);

      return rankedSlots.slice(0, this.defaultSettings.maxSuggestionsPerRequest);
    } catch (error) {
      appMonitor.logError(error, { context: 'find_optimal_time' });
      throw new Error('Failed to find optimal meeting time');
    }
  }

  async getParticipantAvailability(participants, timeRange) {
    const availabilityPromises = participants.map(async participant => {
      try {
        const events = await calendarIntegrationService.getAllEvents({
          timeRange,
          userEmail: participant.email
        });

        const workHours = await this.getParticipantWorkHours(participant);
        const timeZone = await this.getParticipantTimeZone(participant);

        return {
          participant,
          events,
          workHours,
          timeZone,
          success: true
        };
      } catch (error) {
        appMonitor.logError(error, { context: 'participant_availability', participant });
        return {
          participant,
          events: [],
          error: true,
          success: false
        };
      }
    });

    return Promise.all(availabilityPromises);
  }

  async findCommonAvailability({ availabilities, duration, mustHaveParticipants, preferences }) {
    const slots = [];
    const timeBlocks = this.generateTimeBlocks(availabilities, preferences);

    for (const block of timeBlocks) {
      if (this.isValidTimeBlock(block, {
        duration,
        mustHaveParticipants,
        availabilities,
        preferences
      })) {
        slots.push(this.createTimeSlot(block, duration));
      }
    }

    return this.optimizeSlots(slots, preferences);
  }

  async rankTimeSlots({ slots, analytics, historicalData, preferences, participants, meetingType }) {
    const rankedSlots = await Promise.all(slots.map(async slot => {
      const scores = await Promise.all([
        this.calculateTimePreferenceScore(slot, preferences),
        this.calculateHistoricalScore(slot, historicalData),
        this.calculateAttendeeScore(slot, participants),
        this.calculateTimeZoneScore(slot, participants)
      ]);

      const weightedScore = this.calculateWeightedScore(scores);
      
      return {
        ...slot,
        score: weightedScore,
        metrics: {
          timePreference: scores[0],
          historical: scores[1],
          attendee: scores[2],
          timeZone: scores[3]
        }
      };
    }));

    return rankedSlots.sort((a, b) => b.score - a.score);
  }

  async calculateTimePreferenceScore(slot, preferences) {
    const { workingHours, preferredTimes } = preferences;
    let score = 1;

    if (workingHours) {
      score *= this.isWithinWorkingHours(slot, workingHours) ? 1 : 0.5;
    }

    if (preferredTimes?.length) {
      score *= this.matchesPreferredTimes(slot, preferredTimes) ? 1.2 : 0.8;
    }

    return score;
  }

  async calculateHistoricalScore(slot, historicalData) {
    const timeOfDay = slot.start.hour;
    const dayOfWeek = slot.start.weekday;

    const relevantMeetings = historicalData.filter(meeting => 
      meeting.start.hour === timeOfDay && 
      meeting.start.weekday === dayOfWeek
    );

    if (relevantMeetings.length === 0) return 0.7; // Neutral score for no history

    const successRate = relevantMeetings.filter(m => m.successful).length / relevantMeetings.length;
    return 0.4 + (successRate * 0.6); // Scale from 0.4 to 1.0
  }

  async calculateAttendeeScore(slot, participants) {
    const responsePromises = participants.map(async participant => {
      const availability = await this.checkDetailedAvailability(participant, slot);
      return availability.score;
    });

    const scores = await Promise.all(responsePromises);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  calculateTimeZoneScore(slot, participants) {
    const timeZones = participants
      .map(p => p.timeZone)
      .filter(Boolean);

    if (timeZones.length <= 1) return 1;

    const localTimes = timeZones.map(tz => slot.start.setZone(tz));
    const scores = localTimes.map(time => {
      const hour = time.hour;
      if (hour < 6 || hour > 22) return 0;
      if (hour < 8 || hour > 20) return 0.5;
      if (hour < 9 || hour > 17) return 0.8;
      return 1;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  calculateWeightedScore(scores) {
    return Object.entries(this.defaultSettings.scoringWeights)
      .reduce((total, [key, weight], index) => {
        return total + (scores[index] * weight);
      }, 0);
  }

  // Cache management
  async getCachedOptimalTimes(participants, timeRange) {
    try {
      const key = this.generateCacheKey(participants, timeRange);
      const cached = await AsyncStorage.getItem(`${SCHEDULER_CACHE.OPTIMAL_TIMES}${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes cache
          return data;
        }
      }
      return null;
    } catch (error) {
      appMonitor.logError(error, { context: 'get_cached_times' });
      return null;
    }
  }

  async cacheOptimalTimes(participants, timeRange, slots) {
    try {
      const key = this.generateCacheKey(participants, timeRange);
      await AsyncStorage.setItem(
        `${SCHEDULER_CACHE.OPTIMAL_TIMES}${key}`,
        JSON.stringify({
          data: slots,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'cache_optimal_times' });
    }
  }

  generateCacheKey(participants, timeRange) {
    const participantKey = participants
      .map(p => p.email)
      .sort()
      .join('_');
    return `${participantKey}_${timeRange.start}_${timeRange.end}`;
  }

  // Utility methods
  isWithinWorkingHours(slot, workingHours) {
    const start = DateTime.fromFormat(workingHours.start, 'HH:mm');
    const end = DateTime.fromFormat(workingHours.end, 'HH:mm');
    return slot.start.hour >= start.hour && slot.end.hour <= end.hour;
  }

  matchesPreferredTimes(slot, preferredTimes) {
    return preferredTimes.some(time => {
      const prefStart = DateTime.fromFormat(time.start, 'HH:mm');
      const prefEnd = DateTime.fromFormat(time.end, 'HH:mm');
      return slot.start.hour >= prefStart.hour && slot.end.hour <= prefEnd.hour;
    });
  }

  createTimeSlot(block, duration) {
    return {
      start: block.start,
      end: block.start.plus({ minutes: duration }),
      duration
    };
  }
}

export const smartMeetingScheduler = new SmartMeetingScheduler();
