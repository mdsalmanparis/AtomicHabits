import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getLogicalDate, isHabitScheduledForDate } from '../utils/dateUtils';

/**
 * Robust notification trigger helper using Service Worker showNotification if available,
 * with standard browser Notification fallback.
 */
const showPushNotification = async (title: string, options: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch (e) {
      console.warn('Service worker not ready for notification, falling back to window Notification:', e);
    }
  }
  
  new Notification(title, options);
};

export function useNotifications() {
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const profile = useStore(state => state.profile);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAndTriggerNotifications = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const hrs = now.getHours();
      const todayLogical = getLogicalDate(now, profile.day_offset_hours);

      // Phase configuration mapping starts and end-warnings (1 hr before end)
      // Phase 1: 1 PM - 4 PM. Starts at 13:00. End warning at 15:00.
      // Phase 2: 4 PM - 8 PM. Starts at 16:00. End warning at 19:00.
      // Phase 3: 8 PM - 12 AM. Starts at 20:00. End warning at 23:00.
      // Phase 4: 12 AM - 4 AM. Starts at 00:00. End warning at 03:00.
      const phaseTriggers = [
        {
          phaseId: 'phase_1',
          name: 'Phase 1 (Afternoon Kickoff)',
          startHour: 13,
          warningHour: 15,
          startTitle: 'Phase 1 Started',
          startBody: 'Phase 1 (Afternoon Kickoff) has started! Time to execute your routines.',
          warningTitle: 'Phase 1 Ending Soon',
          warningBody: 'Only 1 hour left in Phase 1! You have remaining habits to finish.'
        },
        {
          phaseId: 'phase_2',
          name: 'Phase 2 (Prime Focus)',
          startHour: 16,
          warningHour: 19,
          startTitle: 'Phase 2 Started',
          startBody: 'Phase 2 (Prime Focus) has started! Lock in.',
          warningTitle: 'Phase 2 Ending Soon',
          warningBody: 'Only 1 hour left in Phase 2! You have remaining habits to finish.'
        },
        {
          phaseId: 'phase_3',
          name: 'Phase 3 (Night Shift Core)',
          startHour: 20,
          warningHour: 23,
          startTitle: 'Phase 3 Started',
          startBody: 'Phase 3 (Night Shift Core) has started! Transition to your evening habits.',
          warningTitle: 'Phase 3 Ending Soon',
          warningBody: 'Only 1 hour left in Phase 3! You have remaining habits to finish.'
        },
        {
          phaseId: 'phase_4',
          name: 'Phase 4 (Late Night Burn)',
          startHour: 0,
          warningHour: 3,
          startTitle: 'Phase 4 Started',
          startBody: 'Phase 4 (Late Night Burn) has started! Complete your night tasks.',
          warningTitle: 'Phase 4 Ending Soon',
          warningBody: 'Only 1 hour left in Phase 4! You have remaining habits to finish.'
        }
      ];

      phaseTriggers.forEach(trigger => {
        // 1. Check Phase Start Notification
        if (hrs === trigger.startHour) {
          const storageKey = `last_notified_start_${trigger.phaseId}`;
          const lastSent = localStorage.getItem(storageKey);

          if (lastSent !== todayLogical) {
            showPushNotification(trigger.startTitle, {
              body: trigger.startBody,
              icon: '/favicon.svg'
            });
            localStorage.setItem(storageKey, todayLogical);
          }
        }

        // 2. Check Phase End (1 hr warning) Notification
        if (hrs === trigger.warningHour) {
          const storageKey = `last_notified_warning_${trigger.phaseId}`;
          const lastSent = localStorage.getItem(storageKey);

          if (lastSent !== todayLogical) {
            // Check if there are remaining incomplete habits in this phase
            const phaseHabits = habits.filter(
              h => h.cue_phase === trigger.phaseId && !h.is_archived && isHabitScheduledForDate(h, todayLogical)
            );

            const hasIncomplete = phaseHabits.some(h => {
              const log = logs.find(l => l.habit_id === h.id && l.logical_date === todayLogical);
              if (!log) return true;
              const isCompleted = log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version) || log.is_skipped || log.is_justified;
              return !isCompleted;
            });

            if (hasIncomplete) {
              showPushNotification(trigger.warningTitle, {
                body: trigger.warningBody,
                icon: '/favicon.svg'
              });
            }
            // Even if there are no incomplete habits, we save the key to prevent checking/firing again during this hour
            localStorage.setItem(storageKey, todayLogical);
          }
        }
      });
    };

    // Run check immediately on mount and every 30 seconds
    checkAndTriggerNotifications();
    const intervalId = setInterval(checkAndTriggerNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [habits, logs, profile]);
}
