// src/services/ConflictResolutionService.js
import { DateTime } from 'luxon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { smartMeetingScheduler } from 'src/services/smartMeetingScheduler';
import { calendarAnalyticsService } from 'src/services/calendarServices/CalendarAnalyticsService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const CONFLICT_CACHE = {
  RESOLUTIONS: '@conflict_resolutions_',
  PATTERNS: '@conflict_patterns_',
  PREFERENCES: '@conflict_preferences_'
};

class ConflictResolutionService {
  constructor() {
    this.conflictTypes = {
      OVERLAP: 'overlap',
      BUFFER_VIOLATION: 'buffer_violation',
      WORKLIFE_BALANCE: 'worklife_balance',
      TIME_ZONE: 'time_zone',
      RECURRING_CONFLICT: 'recurring_conflict',
      PRIORITY_CONFLICT: 'priority_conflict',
      QUORUM_CONFLICT: 'quorum_conflict'
    };

    this.resolutionStrategies = new Map([
      [this.conflictTypes.OVERLAP, this.resolveOverlap.bind(this)],
      [this.conflictTypes.BUFFER_VIOLATION, this.resolveBufferViolation.bind(this)],
      [this.conflictTypes.WORKLIFE_BALANCE, this.resolveWorkLifeBalance.bind(this)],
      [this.conflictTypes.TIME_ZONE, this.resolveTimeZoneConflict.bind(this)],
      [this.conflictTypes.RECURRING_CONFLICT, this.resolveRecurringConflict.bind(this)],
      [this.conflictTypes.PRIORITY_CONFLICT, this.resolvePriorityConflict.bind(this)],
      [this.conflictTypes.QUORUM_CONFLICT, this.resolveQuorumConflict.bind(this)]
    ]);
  }

  async detectConflicts(events, preferences = {}) {
    try {
      const conflicts = [];
      
      // Run all conflict detection strategies in parallel
      const [
        overlapConflicts,
        bufferConflicts,
        worklifeConflicts,
        tzConflicts,
        recurringConflicts,
        priorityConflicts,
        quorumConflicts
      ] = await Promise.all([
        this.findOverlappingEvents(events),
        this.findBufferViolations(events, preferences),
        this.findWorkLifeBalanceIssues(events, preferences),
        this.findTimeZoneConflicts(events),
        this.findRecurringConflicts(events),
        this.findPriorityConflicts(events),
        this.findQuorumConflicts(events)
      ]);

      conflicts.push(
        ...overlapConflicts,
        ...bufferConflicts,
        ...worklifeConflicts,
        ...tzConflicts,
        ...recurringConflicts,
        ...priorityConflicts,
        ...quorumConflicts
      );

      // Store conflict patterns for future prevention
      await this.storeConflictPatterns(conflicts);

      return this.prioritizeConflicts(conflicts);
    } catch (error) {
      appMonitor.logError(error, { context: 'detect_conflicts' });
      throw new Error('Failed to detect conflicts');
    }
  }

  async resolveConflicts(conflicts, preferences = {}) {
    try {
      const resolutions = [];
      const conflictGroups = this.groupRelatedConflicts(conflicts);

      for (const group of conflictGroups) {
        const primaryConflict = this.identifyPrimaryConflict(group);
        const strategy = this.resolutionStrategies.get(primaryConflict.type);

        if (strategy) {
          const resolution = await strategy(primaryConflict, preferences);
          resolutions.push({
            conflicts: group,
            resolution,
            timestamp: DateTime.now().toISO()
          });
        }
      }

      // Store successful resolutions for learning
      await this.storeResolutionHistory(resolutions);

      return resolutions;
    } catch (error) {
      appMonitor.logError(error, { context: 'resolve_conflicts' });
      throw new Error('Failed to resolve conflicts');
    }
  }

  async resolveOverlap(conflict, preferences) {
    const { events } = conflict;
    const prioritizedEvents = await this.prioritizeEvents(events);
    
    const alternativeSlots = await Promise.all(
      prioritizedEvents.map(async (event, index) => {
        if (index === 0) return null; // Keep highest priority event

        return await smartMeetingScheduler.findOptimalMeetingTime({
          participants: event.attendees,
          duration: event.end.diff(event.start, 'minutes').minutes,
          preferences,
          timeRange: {
            start: DateTime.now().toISO(),
            end: DateTime.now().plus({ days: 14 }).toISO()
          }
        });
      })
    );

    return {
      type: 'reschedule',
      keepEvent: prioritizedEvents[0],
      alternatives: alternativeSlots.filter(Boolean).flat(),
      reason: 'Resolved based on event priority and optimal alternative times'
    };
  }

  async resolveBufferViolation(conflict, preferences) {
    const { events, buffer } = conflict;
    const bufferNeeded = preferences.minimumBuffer - buffer;
    const analytics = await calendarAnalyticsService.getAnalytics(
      events[0].organizer.email,
      { start: events[0].start, end: events[1].end }
    );

    const solutions = [
      {
        type: 'adjust_duration',
        event: events[0],
        adjustment: -Math.min(bufferNeeded / 2, 15),
        impact: this.calculateImpactScore(events[0], -bufferNeeded / 2, analytics)
      },
      {
        type: 'adjust_time',
        event: events[1],
        adjustment: bufferNeeded,
        impact: this.calculateImpactScore(events[1], bufferNeeded, analytics)
      }
    ];

    return {
      type: 'buffer_adjustment',
      solutions: solutions.sort((a, b) => a.impact - b.impact),
      reason: 'Adjusted timing to maintain minimum buffer between meetings'
    };
  }

  async resolveWorkLifeBalance(conflict, preferences) {
    const { event, workingHours } = conflict;
    const analytics = await calendarAnalyticsService.getAnalytics(
      event.organizer.email,
      { start: event.start, end: event.end }
    );

    const alternativeSlots = await smartMeetingScheduler.findOptimalMeetingTime({
      participants: event.attendees,
      duration: event.end.diff(event.start, 'minutes').minutes,
      preferences: {
        ...preferences,
        workingHours,
        strictWorkHours: true
      }
    });

    return {
      type: 'work_life_balance',
      solutions: [
        {
          type: 'reschedule',
          alternatives: alternativeSlots,
          impact: this.calculateWorkLifeImpact(event, alternativeSlots[0])
        },
        {
          type: 'virtual_option',
          description: 'Convert to virtual meeting to reduce impact',
          impact: 0.5
        }
      ],
      reason: 'Rescheduled to maintain work-life balance'
    };
  }

  async resolveTimeZoneConflict(conflict, preferences) {
    const { event, timeZones } = conflict;
    const duration = event.end.diff(event.start, 'minutes').minutes;

    const solutions = [
      // Find time that works for all time zones
      {
        type: 'reschedule',
        alternatives: await this.findTimeZoneFriendlySlots(event, timeZones, duration)
      },
      // Split into multiple sessions
      {
        type: 'split_meeting',
        sessions: await this.generateTimeZoneSessions(event, timeZones)
      },
      // Convert to asynchronous format
      {
        type: 'async_format',
        suggestion: this.generateAsyncAlternative(event)
      }
    ];

    return {
      type: 'time_zone_resolution',
      solutions: solutions.filter(s => s.alternatives?.length > 0 || s.sessions?.length > 0),
      reason: 'Adjusted for time zone compatibility'
    };
  }

  // Helper methods
  async prioritizeEvents(events) {
    const scoredEvents = await Promise.all(events.map(async event => {
      const score = await this.calculateEventPriority(event);
      return { ...event, priorityScore: score };
    }));

    return scoredEvents.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  async calculateEventPriority(event) {
    let score = 0;
    
    // Attendee seniority/role factor
    score += await this.calculateAttendeePriorityScore(event.attendees);
    
    // Recurring meeting factor
    if (event.recurrence) score += 2;
    
    // Meeting type/purpose factor
    score += this.calculatePurposePriority(event);
    
    // Historical attendance factor
    score += await this.calculateHistoricalAttendance(event);

    return score;
  }

  calculatePurposePriority(event) {
    const priorityKeywords = new Map([
      ['review', 3],
      ['planning', 2],
      ['standup', 1],
      ['interview', 3],
      ['client', 3],
      ['deadline', 3]
    ]);

    let score = 0;
    priorityKeywords.forEach((value, keyword) => {
      if (event.title.toLowerCase().includes(keyword)) {
        score += value;
      }
    });

    return score;
  }

  async storeConflictPatterns(conflicts) {
    try {
      const patterns = conflicts.map(conflict => ({
        type: conflict.type,
        timestamp: DateTime.now().toISO(),
        signature: this.generateConflictSignature(conflict)
      }));

      await AsyncStorage.setItem(
        CONFLICT_CACHE.PATTERNS,
        JSON.stringify(patterns)
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'store_conflict_patterns' });
    }
  }

  generateConflictSignature(conflict) {
    // Create a unique signature for the conflict type and parameters
    const baseSignature = {
      type: conflict.type,
      timeRange: conflict.events?.[0]?.start 
        ? `${conflict.events[0].start.hour}-${conflict.events[0].end.hour}`
        : null,
      participants: conflict.events?.[0]?.attendees?.map(a => a.email).sort().join(',')
    };

    return JSON.stringify(baseSignature);
  }

  async groupRelatedConflicts(conflicts) {
    // Group conflicts that should be resolved together
    const groups = new Map();
    
    conflicts.forEach(conflict => {
      const key = this.getConflictGroupKey(conflict);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(conflict);
    });

    return Array.from(groups.values());
  }

  getConflictGroupKey(conflict) {
    if (!conflict.events?.length) return conflict.type;
    
    const eventIds = conflict.events.map(e => e.id).sort().join('_');
    return `${conflict.type}_${eventIds}`;
  }

  identifyPrimaryConflict(conflictGroup) {
    return conflictGroup.reduce((primary, current) => {
      const primaryScore = this.calculateConflictSeverity(primary);
      const currentScore = this.calculateConflictSeverity(current);
      return currentScore > primaryScore ? current : primary;
    });
  }

  calculateConflictSeverity(conflict) {
    const baseScore = {
      [this.conflictTypes.OVERLAP]: 5,
      [this.conflictTypes.BUFFER_VIOLATION]: 3,
      [this.conflictTypes.WORKLIFE_BALANCE]: 4,
      [this.conflictTypes.TIME_ZONE]: 4,
      [this.conflictTypes.RECURRING_CONFLICT]: 5,
      [this.conflictTypes.PRIORITY_CONFLICT]: 5,
      [this.conflictTypes.QUORUM_CONFLICT]: 4
    }[conflict.type] || 1;

    // Adjust based on participants and timing
    let severityMultiplier = 1;
    if (conflict.events?.[0]) {
      severityMultiplier += (conflict.events[0].attendees?.length || 0) * 0.1;
      if (DateTime.now().diff(conflict.events[0].start, 'days').days < 1) {
        severityMultiplier += 0.5;
      }
    }

    return baseScore * severityMultiplier;
  }
}

export const conflictResolutionService = new ConflictResolutionService();
