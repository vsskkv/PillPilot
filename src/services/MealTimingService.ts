import { databaseService } from './DatabaseService';
import { UserPrefs, Constraints, Regimen } from '../types';

export interface MealTiming {
  breakfast: Date;
  lunch: Date;
  dinner: Date;
  snack: Date;
}

export interface MedicationSchedule {
  medicationId: string;
  scheduledTime: Date;
  reason: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  regimenId?: string; // Add regimen ID for reference
  doseAmount?: string; // Add dose amount for display
  intervalHours?: number; // Add interval for next dose calculation
}

export class MealTimingService {
  private static instance: MealTimingService;
  private userPrefs: UserPrefs | null = null;

  static getInstance(): MealTimingService {
    if (!MealTimingService.instance) {
      MealTimingService.instance = new MealTimingService();
    }
    return MealTimingService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.userPrefs = await databaseService.getUserPrefs();
    } catch (error) {
      console.error('Failed to initialize MealTimingService:', error);
    }
  }

  /**
   * Calculate meal times for a given date based on user preferences
   */
  calculateMealTimes(date: Date): MealTiming {
    if (!this.userPrefs) {
      throw new Error('MealTimingService not initialized');
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month, day, hours, minutes, 0, 0);
    };

    return {
      breakfast: parseTime(this.userPrefs.breakfastTime),
      lunch: parseTime(this.userPrefs.lunchTime),
      dinner: parseTime(this.userPrefs.dinnerTime),
      snack: parseTime(this.userPrefs.snackTime),
    };
  }

  /**
   * Calculate when to take a medication based on constraints and meal times
   */
  calculateMedicationTime(
    constraints: Constraints,
    mealTimes: MealTiming,
    targetDate: Date
  ): MedicationSchedule[] {
    const schedules: MedicationSchedule[] = [];
    
    // Handle food-related constraints
    if (constraints.withFood) {
      // Take with breakfast, lunch, and dinner
      schedules.push(
        { medicationId: constraints.regimenId, scheduledTime: mealTimes.breakfast, reason: 'Take with breakfast', mealType: 'breakfast' },
        { medicationId: constraints.regimenId, scheduledTime: mealTimes.lunch, reason: 'Take with lunch', mealType: 'lunch' },
        { medicationId: constraints.regimenId, scheduledTime: mealTimes.dinner, reason: 'Take with dinner', mealType: 'dinner' }
      );
    }

    if (constraints.noFoodBeforeMinutes) {
      // Take X minutes before meals
      const beforeBreakfast = new Date(mealTimes.breakfast.getTime() - constraints.noFoodBeforeMinutes * 60000);
      const beforeLunch = new Date(mealTimes.lunch.getTime() - constraints.noFoodBeforeMinutes * 60000);
      const beforeDinner = new Date(mealTimes.dinner.getTime() - constraints.noFoodBeforeMinutes * 60000);
      
      schedules.push(
        { medicationId: constraints.regimenId, scheduledTime: beforeBreakfast, reason: `${constraints.noFoodBeforeMinutes} minutes before breakfast`, mealType: 'breakfast' },
        { medicationId: constraints.regimenId, scheduledTime: beforeLunch, reason: `${constraints.noFoodBeforeMinutes} minutes before lunch`, mealType: 'lunch' },
        { medicationId: constraints.regimenId, scheduledTime: beforeDinner, reason: `${constraints.noFoodBeforeMinutes} minutes before dinner`, mealType: 'dinner' }
      );
    }

    if (constraints.afterFoodMinutes) {
      // Take X minutes after meals
      const afterBreakfast = new Date(mealTimes.breakfast.getTime() + constraints.afterFoodMinutes * 60000);
      const afterLunch = new Date(mealTimes.lunch.getTime() + constraints.afterFoodMinutes * 60000);
      const afterDinner = new Date(mealTimes.dinner.getTime() + constraints.afterFoodMinutes * 60000);
      
      schedules.push(
        { medicationId: constraints.regimenId, scheduledTime: afterBreakfast, reason: `${constraints.afterFoodMinutes} minutes after breakfast`, mealType: 'breakfast' },
        { medicationId: constraints.regimenId, scheduledTime: afterLunch, reason: `${constraints.afterFoodMinutes} minutes after lunch`, mealType: 'lunch' },
        { medicationId: constraints.regimenId, scheduledTime: afterDinner, reason: `${constraints.afterFoodMinutes} minutes after dinner`, mealType: 'dinner' }
      );
    }

    // Handle time constraints
    if (constraints.earliestTime) {
      const [hours, minutes] = constraints.earliestTime.split(':').map(Number);
      const earliestTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes, 0, 0);
      
      // Filter schedules to only include times after earliest time
      schedules.forEach(schedule => {
        if (schedule.scheduledTime < earliestTime) {
          schedule.scheduledTime = earliestTime;
          schedule.reason += ' (adjusted to earliest allowed time)';
        }
      });
    }

    if (constraints.latestTime) {
      const [hours, minutes] = constraints.latestTime.split(':').map(Number);
      const latestTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes, 0, 0);
      
      // Filter schedules to only include times before latest time
      schedules.forEach(schedule => {
        if (schedule.scheduledTime > latestTime) {
          schedule.scheduledTime = latestTime;
          schedule.reason += ' (adjusted to latest allowed time)';
        }
      });
    }

    // Remove duplicate times and sort
    const uniqueSchedules = schedules.filter((schedule, index, self) => 
      index === self.findIndex(s => s.scheduledTime.getTime() === schedule.scheduledTime.getTime())
    );

    return uniqueSchedules.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Get all medication schedules for a specific date
   */
  async getMedicationSchedulesForDate(date: Date): Promise<MedicationSchedule[]> {
    try {
      // Get all medications with constraints
      const medications = await databaseService.getAllMedications();
      const allSchedules: MedicationSchedule[] = [];

      for (const medication of medications) {
        const regimens = await databaseService.getRegimensByMedication(medication.id);
        
        for (const regimen of regimens) {
          // Generate base schedule for regimen type
          const regimenSchedules: MedicationSchedule[] = this.generateRegimenBaseSchedule(regimen, date);

          // Apply constraints to each base schedule time
          const constraints = await databaseService.getConstraintsByRegimen(regimen.id);
          if (constraints.length > 0) {
            const mealTimes = this.calculateMealTimes(date);
            for (const base of regimenSchedules) {
              for (const constraint of constraints) {
                const constrained = this.calculateMedicationTime(constraint, mealTimes, date)
                  .map(s => ({ ...s, scheduledTime: base.scheduledTime }));
                // For now, keep base times and reasons; constraints can annotate UI later
              }
            }
          }

          allSchedules.push(...regimenSchedules);
        }
      }

      return allSchedules.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    } catch (error) {
      console.error('Error getting medication schedules:', error);
      return [];
    }
  }

  private generateRegimenBaseSchedule(regimen: Regimen, date: Date): MedicationSchedule[] {
    const schedules: MedicationSchedule[] = [];
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    if (regimen.frequency === 'interval' && regimen.intervalHours && regimen.intervalHours > 0) {
      // Start from lastTakenAt or start of day
      let base = regimen.lastTakenAt && regimen.lastTakenAt > startOfDay ? new Date(regimen.lastTakenAt) : startOfDay;
      // Move forward in steps of intervalHours until end of day
      while (base <= endOfDay) {
        schedules.push({ 
          medicationId: regimen.id, 
          scheduledTime: new Date(base), 
          reason: `${regimen.doseAmount} tablet${parseInt(regimen.doseAmount) > 1 ? 's' : ''} every ${regimen.intervalHours}h`,
          regimenId: regimen.id,
          doseAmount: regimen.doseAmount,
          intervalHours: regimen.intervalHours,
        });
        base = new Date(base.getTime() + regimen.intervalHours * 60 * 60 * 1000);
      }
      return schedules;
    }

    if (regimen.frequency === 'timesPerDay' && regimen.timesPerDay && regimen.timesPerDay > 0) {
      // Evenly distribute across the day between 07:00 and 22:00
      const startHour = 7;
      const endHour = 22;
      const windowMs = (endHour - startHour) * 60 * 60 * 1000;
      const step = windowMs / regimen.timesPerDay;
      for (let i = 0; i < regimen.timesPerDay; i++) {
        const t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0, 0);
        const scheduled = new Date(t.getTime() + i * step);
        schedules.push({ 
          medicationId: regimen.id, 
          scheduledTime: scheduled, 
          reason: `${regimen.doseAmount} tablet${parseInt(regimen.doseAmount) > 1 ? 's' : ''} ${regimen.timesPerDay}x/day`,
          regimenId: regimen.id,
          doseAmount: regimen.doseAmount,
        });
      }
      return schedules;
    }

    // Default: no specific times here (handled by constraints elsewhere)
    return schedules;
  }

  /**
   * Get next medication time from now
   */
  async getNextMedicationTime(): Promise<MedicationSchedule | null> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Check today and tomorrow for upcoming medications
    const todaySchedules = await this.getMedicationSchedulesForDate(today);
    const tomorrowSchedules = await this.getMedicationSchedulesForDate(tomorrow);
    
    const allSchedules = [...todaySchedules, ...tomorrowSchedules];
    const upcomingSchedules = allSchedules.filter(schedule => schedule.scheduledTime > now);
    
    return upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;
  }
}

export const mealTimingService = MealTimingService.getInstance();
