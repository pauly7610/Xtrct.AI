// src/services/CalendarSyncService.js
import { DateTime } from 'luxon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const SYNC_STORAGE_KEYS = {
  SYNC_STATUS: '@calendar_sync_status',
  LAST_SYNC: '@calendar_last_sync',
  SYNC_CONFLICTS: '@calendar_sync_conflicts'
};

class CalendarSyncService {
  constructor() {
    this.syncStatus = new Map();
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.maxRetries = 3;
    this.syncInProgress = false;
    this.conflictResolutionStrategy = 'latest'; // 'latest' | 'source' | 'manual'
  }

  async initialize() {
    try {
      // Load previous sync status
      const savedStatus = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.SYNC_STATUS);
      if (savedStatus) {
        this.syncStatus = new Map(Object.entries(JSON.parse(savedStatus)));
      }
    } catch (error) {
      appMonitor.logError(error, { context: 'calendar_sync_init' });
    }
  }

  async startSync(force = false) {
    if (this.syncInProgress && !force) {
      return {
        status: 'in_progress',
        lastSync: this.syncStatus
      };
    }

    try {
      this.syncInProgress = true;
      appMonitor.logInfo('Starting calendar sync', { force });

      const calendars = Array.from(calendarIntegrationService.activeCalendars);
      
      // Validate all calendar connections before starting sync
      const connectionChecks = await this.validateCalendarConnections(calendars);
      const invalidCalendars = connectionChecks.filter(check => !check.valid);
      
      if (invalidCalendars.length > 0) {
        throw new Error(`Invalid calendar connections: ${invalidCalendars.map(c => c.type).join(', ')}`);
      }

      const results = await Promise.allSettled(
        calendars.map(calendar => this.syncCalendar(calendar))
      );

      const syncResults = {};
      results.forEach((result, index) => {
        const calendar = calendars[index];
        syncResults[calendar] = result.status === 'fulfilled' ? 
          result.value : 
          { status: 'failed', error: result.reason.message };
      });

      await this.updateSyncStatus(syncResults);

      return {
        status: 'completed',
        results: syncResults,
        timestamp: DateTime.now().toISO()
      };
    } catch (error) {
      appMonitor.logError(error, { context: 'calendar_sync' });
      return {
        status: 'failed',
        error: error.message,
        timestamp: DateTime.now().toISO()
      };
    } finally {
      this.syncInProgress = false;
      this.saveSyncStatus();
    }
  }

  async validateCalendarConnections(calendars) {
    return Promise.all(calendars.map(async (calendarType) => {
      try {
        const calendar = calendarIntegrationService.calendars[calendarType];
        const isValid = await calendar.checkAuthStatus();
        return { type: calendarType, valid: isValid };
      } catch (error) {
        return { type: calendarType, valid: false, error: error.message };
      }
    }));
  }

  async syncCalendar(calendarType, retryCount = 0) {
    const syncStart = DateTime.now();
    
    try {
      appMonitor.logInfo(`Starting sync for ${calendarType}`, { retryCount });
      
      const calendar = calendarIntegrationService.calendars[calendarType];
      const lastSync = this.syncStatus.get(calendarType)?.lastSync;
      
      const changes = await calendar.fetchCalendarEvents(
        lastSync ? DateTime.fromISO(lastSync).toJSDate() : undefined
      );

      const processedChanges = await this.processSyncChanges(calendarType, changes);

      return {
        status: 'success',
        changes: processedChanges.length,
        timestamp: syncStart.toISO(),
        details: {
          added: processedChanges.filter(c => c.type === 'created').length,
          updated: processedChanges.filter(c => c.type === 'updated').length,
          deleted: processedChanges.filter(c => c.type === 'deleted').length,
        }
      };
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'calendar_sync',
        calendarType,
        retryCount 
      });

      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.syncCalendar(calendarType, retryCount + 1);
      }
      
      throw error;
    }
  }

  async processSyncChanges(calendarType, events) {
    const lastSync = this.syncStatus.get(calendarType)?.lastSync;
    const lastSyncDate = lastSync ? DateTime.fromISO(lastSync) : null;
    const changes = [];

    for (const event of events) {
      try {
        const eventDate = DateTime.fromISO(event.updated || event.created);
        const changeType = !lastSyncDate ? 'created' :
          eventDate > lastSyncDate ? 'updated' : null;

        if (changeType) {
          changes.push({
            type: changeType,
            event: event
          });
        }
      } catch (error) {
        appMonitor.logError(error, {
          context: 'process_change',
          calendarType,
          eventId: event.id
        });
      }
    }

    // Process changes in batches
    const batchSize = 10;
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize);
      await Promise.all(batch.map(change => 
        this.processChange(change, calendarType)
      ));
    }

    return changes;
  }

  async processChange(change, sourceCalendar) {
    try {
      switch (change.type) {
        case 'created':
          await this.handleCreatedEvent(sourceCalendar, change.event);
          break;
        case 'updated':
          await this.handleUpdatedEvent(sourceCalendar, change.event);
          break;
        case 'deleted':
          await this.handleDeletedEvent(sourceCalendar, change.eventId);
          break;
      }
    } catch (error) {
      appMonitor.logError(error, {
        context: 'process_change',
        changeType: change.type,
        sourceCalendar
      });
      throw error;
    }
  }

  async handleCreatedEvent(sourceCalendar, event) {
    try {
      const standardEvent = calendarIntegrationService.standardizeEvent(event, sourceCalendar);
      await this.checkAndResolveConflicts(standardEvent, sourceCalendar);
      await this.propagateToOtherCalendars(standardEvent, sourceCalendar);
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'handle_created_event',
        sourceCalendar,
        eventId: event.id
      });
      throw error;
    }
  }

  async checkAndResolveConflicts(event, sourceCalendar) {
    const existingEvents = await this.findConflictingEvents(event);
    
    if (existingEvents.length > 0) {
      switch (this.conflictResolutionStrategy) {
        case 'latest':
          // Keep the most recently updated event
          const latestEvent = [...existingEvents, event]
            .sort((a, b) => DateTime.fromISO(b.updated) - DateTime.fromISO(a.updated))[0];
          return latestEvent;

        case 'source':
          // Keep the event from the source calendar
          return event;

        case 'manual':
          // Store conflict for manual resolution
          await this.storeConflict({
            sourceEvent: event,
            conflictingEvents: existingEvents,
            sourceCalendar
          });
          throw new Error('Manual conflict resolution required');
      }
    }

    return event;
  }

  async findConflictingEvents(event) {
    const allEvents = await calendarIntegrationService.getAllEvents({
      start: event.start,
      end: event.end
    });

    return allEvents.filter(e => 
      e.id !== event.id && 
      this.eventsOverlap(e, event)
    );
  }

  eventsOverlap(event1, event2) {
    const start1 = DateTime.fromISO(event1.start);
    const end1 = DateTime.fromISO(event1.end);
    const start2 = DateTime.fromISO(event2.start);
    const end2 = DateTime.fromISO(event2.end);

    return start1 < end2 && start2 < end1;
  }

  async storeConflict(conflict) {
    try {
      const conflicts = await this.getStoredConflicts();
      conflicts.push({
        ...conflict,
        timestamp: DateTime.now().toISO(),
        resolved: false
      });
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.SYNC_CONFLICTS,
        JSON.stringify(conflicts)
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'store_conflict' });
    }
  }

  async getStoredConflicts() {
    try {
      const conflicts = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.SYNC_CONFLICTS);
      return conflicts ? JSON.parse(conflicts) : [];
    } catch (error) {
      appMonitor.logError(error, { context: 'get_conflicts' });
      return [];
    }
  }

  async resolveConflict(conflictId, resolution) {
    const conflicts = await this.getStoredConflicts();
    const conflict = conflicts.find(c => c.id === conflictId);
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    try {
      await this.processChange({
        type: 'updated',
        event: resolution
      }, conflict.sourceCalendar);

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolution = resolution;
      conflict.resolvedAt = DateTime.now().toISO();

      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.SYNC_CONFLICTS,
        JSON.stringify(conflicts)
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'resolve_conflict' });
      throw error;
    }
  }

  async updateSyncStatus(results) {
    Object.entries(results).forEach(([calendar, result]) => {
      this.syncStatus.set(calendar, {
        lastSync: DateTime.now().toISO(),
        lastStatus: result.status,
        changeCount: result.changes,
        details: result.details,
        error: result.error
      });
    });

    await this.saveSyncStatus();
  }

  async saveSyncStatus() {
    try {
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.SYNC_STATUS,
        JSON.stringify(Object.fromEntries(this.syncStatus))
      );
      
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.LAST_SYNC,
        DateTime.now().toISO()
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'save_sync_status' });
    }
  }

  getSyncStatus() {
    return {
      calendars: Object.fromEntries(this.syncStatus),
      lastFullSync: Math.min(...Array.from(this.syncStatus.values())
        .map(status => DateTime.fromISO(status.lastSync).toMillis())),
      syncInProgress: this.syncInProgress,
      conflictResolutionStrategy: this.conflictResolutionStrategy
    };
  }

  async setConflictResolutionStrategy(strategy) {
    if (!['latest', 'source', 'manual'].includes(strategy)) {
      throw new Error('Invalid conflict resolution strategy');
    }
    this.conflictResolutionStrategy = strategy;
  }

  async forceSyncByCalendar(calendarType) {
    if (!calendarIntegrationService.activeCalendars.has(calendarType)) {
      throw new Error(`Calendar ${calendarType} is not active`);
    }

    return await this.syncCalendar(calendarType);
  }
}

export const calendarSyncService = new CalendarSyncService();
