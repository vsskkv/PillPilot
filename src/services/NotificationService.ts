import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { DoseEvent, DailySchedule, MealEvent } from '../types';
import { databaseService } from './DatabaseService';

export class NotificationService {
  private isInitialized = false;

  async init(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Configure Android channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('meal-reminders', {
          name: 'Meal Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('countdown-timers', {
          name: 'Countdown Timers',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  async scheduleMedicationReminder(medication: any, scheduledTime: Date): Promise<string> {
    await this.init();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medication Reminder',
        body: `Time to take ${medication.doseAmount}`,
        data: { type: 'medication', medicationId: medication.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        date: scheduledTime,
        channelId: 'medication-reminders',
      },
    });

    return notificationId;
  }

  async scheduleMealReminder(mealType: string, scheduledTime: Date, medicationName?: string): Promise<string> {
    await this.init();

    let body = `Time for ${mealType}`;
    if (medicationName) {
      body += ` - Remember to take ${medicationName}`;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ Meal Reminder',
        body,
        data: {
          type: 'meal-reminder',
          mealType,
          scheduledTime: scheduledTime.toISOString(),
          medicationName,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        categoryIdentifier: 'meal-reminder',
      },
      trigger: {
        date: scheduledTime,
        channelId: 'meal-reminders',
      },
    });

    return notificationId;
  }

  async scheduleCountdownTimer(
    title: string,
    message: string,
    durationMinutes: number,
    data?: Record<string, any>
  ): Promise<string> {
    await this.init();

    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data: {
          type: 'countdown-timer',
          durationMinutes,
          endTime: endTime.toISOString(),
          ...data,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'countdown-timer',
      },
      trigger: {
        date: endTime,
        channelId: 'countdown-timers',
      },
    });

    return notificationId;
  }

  async scheduleFoodTimingReminder(
    medicationName: string,
    minutes: number,
    beforeMeal: boolean,
    mealTime: Date
  ): Promise<string> {
    await this.init();

    const reminderTime = beforeMeal 
      ? new Date(mealTime.getTime() - minutes * 60 * 1000)
      : new Date(mealTime.getTime() + minutes * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Food Timing Reminder',
        body: `${medicationName} - ${beforeMeal ? 'No food' : 'Take'} ${minutes} minutes ${beforeMeal ? 'before' : 'after'} meal`,
        data: {
          type: 'food-timing-reminder',
          medicationName,
          minutes,
          beforeMeal,
          mealTime: mealTime.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        date: reminderTime,
        channelId: 'medication-reminders',
      },
    });

    return notificationId;
  }

  async scheduleSpacingReminder(
    medicationName: string,
    hours: number,
    nextDoseTime: Date
  ): Promise<string> {
    await this.init();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏳ Spacing Reminder',
        body: `You can now take ${medicationName} (${hours}h spacing complete)`,
        data: {
          type: 'spacing-reminder',
          medicationName,
          hours,
          nextDoseTime: nextDoseTime.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        date: nextDoseTime,
        channelId: 'medication-reminders',
      },
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async scheduleRollingNotifications(): Promise<void> {
    try {
      // Get upcoming doses for the next 72 hours
      const now = new Date();
      const endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
      
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Schedule new notifications for the rolling window
      const doses = await this.getUpcomingDoses(now, endTime);
      
      for (const dose of doses) {
        await this.scheduleMedicationReminder(dose, dose.scheduledTime);
      }
      
      console.log(`Scheduled ${doses.length} rolling notifications`);
    } catch (error) {
      console.error('Error scheduling rolling notifications:', error);
    }
  }

  private async getUpcomingDoses(startTime: Date, endTime: Date): Promise<any[]> {
    // This would typically query the database for upcoming doses
    // For now, return a mock array
    return [];
  }

  private findNearestMeal(time: Date, meals: MealEvent[]): MealEvent | null {
    if (meals.length === 0) return null;

    let nearestMeal: MealEvent | null = null;
    let minDiff = Infinity;

    for (const meal of meals) {
      const diff = Math.abs(meal.dateTime.getTime() - time.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        nearestMeal = meal;
      }
    }

    return nearestMeal;
  }

  // Handle notification responses
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { type, doseId, medicationId, scheduledTime } = response.notification.request.content.data;

    switch (type) {
      case 'medication-reminder':
        if (doseId && typeof doseId === 'string') {
          // Mark dose as taken
          await this.markDoseAsTaken(doseId);
        }
        break;
      
      case 'meal-reminder':
        // Could open meal logging screen
        break;
      
      case 'countdown-timer':
        // Timer completed
        break;
      
      case 'food-timing-reminder':
        // Food timing reminder
        break;
      
      case 'spacing-reminder':
        // Spacing reminder
        break;
    }
  }

  private async markDoseAsTaken(doseId: string): Promise<void> {
    // This would typically update the database
    // For now, just log the action
    console.log(`Marking dose ${doseId} as taken`);
  }

  /**
   * Schedule smart notification for when you can eat after taking medication
   */
  async scheduleCanEatNotification(
    medicationName: string,
    minutesAfterPill: number,
    pillTakenAt: Date
  ): Promise<string> {
    await this.init();

    const canEatAt = new Date(pillTakenAt.getTime() + minutesAfterPill * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ You can eat now!',
        body: `It's been ${minutesAfterPill} minutes since taking ${medicationName}`,
        data: {
          type: 'can-eat-reminder',
          medicationName,
          minutesAfterPill,
          pillTakenAt: pillTakenAt.toISOString(),
          canEatAt: canEatAt.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'meal-reminder',
      },
      trigger: {
        date: canEatAt,
        channelId: 'meal-reminders',
      },
    });

    return notificationId;
  }

  /**
   * Schedule notification for when you need to take medication before eating
   */
  async scheduleTakeBeforeMealNotification(
    medicationName: string,
    minutesBeforeMeal: number,
    mealTime: Date
  ): Promise<string> {
    await this.init();

    const takePillAt = new Date(mealTime.getTime() - minutesBeforeMeal * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Take medication before eating',
        body: `Take ${medicationName} ${minutesBeforeMeal} minutes before your meal`,
        data: {
          type: 'take-before-meal',
          medicationName,
          minutesBeforeMeal,
          mealTime: mealTime.toISOString(),
          takePillAt: takePillAt.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        date: takePillAt,
        channelId: 'medication-reminders',
      },
    });

    return notificationId;
  }

  /**
   * Schedule next dose notification based on actual taken time
   */
  async scheduleNextDoseNotification(
    medicationName: string,
    doseAmount: string,
    intervalHours: number,
    nextDoseTime: Date
  ): Promise<string> {
    await this.init();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Time for next dose',
        body: `Take ${doseAmount} of ${medicationName} (${intervalHours}h interval)`,
        data: {
          type: 'next-dose-reminder',
          medicationName,
          doseAmount,
          intervalHours,
          nextDoseTime: nextDoseTime.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medication-reminder',
      },
      trigger: {
        date: nextDoseTime,
        channelId: 'medication-reminders',
      },
    });

    return notificationId;
  }

  /**
   * Schedule meal time notifications based on user preferences
   */
  async scheduleMealTimeNotifications(
    breakfastTime: string,
    lunchTime: string,
    dinnerTime: string,
    snackTime: string
  ): Promise<void> {
    await this.init();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Schedule for today and tomorrow
    [today, tomorrow].forEach(date => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // Parse times and create Date objects
      const [breakfastHour, breakfastMin] = breakfastTime.split(':').map(Number);
      const [lunchHour, lunchMin] = lunchTime.split(':').map(Number);
      const [dinnerHour, dinnerMin] = dinnerTime.split(':').map(Number);
      const [snackHour, snackMin] = snackTime.split(':').map(Number);

      const breakfastDate = new Date(year, month, day, breakfastHour, breakfastMin, 0, 0);
      const lunchDate = new Date(year, month, day, lunchHour, lunchMin, 0, 0);
      const dinnerDate = new Date(year, month, day, dinnerHour, dinnerMin, 0, 0);
      const snackDate = new Date(year, month, day, snackHour, snackMin, 0, 0);

      // Only schedule if the time hasn't passed
      const now = new Date();
      
      if (breakfastDate > now) {
        this.scheduleMealReminder('breakfast', breakfastDate);
      }
      if (lunchDate > now) {
        this.scheduleMealReminder('lunch', lunchDate);
      }
      if (dinnerDate > now) {
        this.scheduleMealReminder('dinner', dinnerDate);
      }
      if (snackDate > now) {
        this.scheduleMealReminder('snack', snackDate);
      }
    });
  }
}

export const notificationService = new NotificationService();
