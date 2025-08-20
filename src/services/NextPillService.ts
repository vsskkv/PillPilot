import { databaseService } from './DatabaseService';
import { notificationService } from './NotificationService';
import { Medication, Regimen, Constraints } from '../types';

export interface NextPillCalculation {
  regimenId: string;
  medicationName: string;
  doseAmount: string;
  nextDueTime: Date;
  reason: string;
  intervalHours?: number;
  timesPerDay?: number;
  lastTakenAt?: Date;
  isOverdue: boolean;
  minutesOverdue?: number;
  canTakeNow: boolean;
  mealConstraints?: {
    needsFood: boolean;
    waitAfterFood?: number;
    waitBeforeFood?: number;
    nextMealTime?: Date;
  };
}

export interface MealNotification {
  type: 'meal_reminder' | 'pill_available';
  message: string;
  scheduledFor: Date;
  regimenId: string;
}

class NextPillService {
  private static instance: NextPillService;
  
  static getInstance(): NextPillService {
    if (!NextPillService.instance) {
      NextPillService.instance = new NextPillService();
    }
    return NextPillService.instance;
  }

  /**
   * Calculate the next pill that needs to be taken
   */
  async getNextPill(): Promise<NextPillCalculation | null> {
    try {
      const medications = await databaseService.getAllMedications();
      const calculations: NextPillCalculation[] = [];

      for (const medication of medications) {
        const regimens = await databaseService.getRegimensByMedication(medication.id);
        
        for (const regimen of regimens) {
          const calculation = await this.calculateNextDoseForRegimen(medication, regimen);
          if (calculation) {
            calculations.push(calculation);
          }
        }
      }

      // Sort by next due time and return the most urgent
      calculations.sort((a, b) => a.nextDueTime.getTime() - b.nextDueTime.getTime());
      return calculations.length > 0 ? calculations[0] : null;
    } catch (error) {
      console.error('Error getting next pill:', error);
      return null;
    }
  }

  /**
   * Calculate all upcoming pills for today
   */
  async getTodaysPills(): Promise<NextPillCalculation[]> {
    try {
      const medications = await databaseService.getAllMedications();
      const calculations: NextPillCalculation[] = [];
      const today = new Date();
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      for (const medication of medications) {
        const regimens = await databaseService.getRegimensByMedication(medication.id);
        
        for (const regimen of regimens) {
          const calculation = await this.calculateNextDoseForRegimen(medication, regimen);
          if (calculation && calculation.nextDueTime <= endOfDay) {
            calculations.push(calculation);
          }
        }
      }

      // Sort by next due time
      calculations.sort((a, b) => a.nextDueTime.getTime() - b.nextDueTime.getTime());
      return calculations;
    } catch (error) {
      console.error('Error getting today\'s pills:', error);
      return [];
    }
  }

  /**
   * Mark a pill as taken and recalculate next dose
   */
  async markPillTaken(regimenId: string, takenAt: Date = new Date()): Promise<void> {
    try {
      // Update the regimen's lastTakenAt
      await databaseService.updateRegimen(regimenId, { lastTakenAt: takenAt });

      // Save dose event
      await databaseService.saveDoseEvent({
        regimenId,
        scheduledAt: takenAt, // Use actual taken time as scheduled time
        takenAt,
        status: 'taken',
        reason: 'user-marked'
      });

      // Recalculate and schedule next notifications
      await this.scheduleNextNotifications(regimenId, takenAt);

      console.log(`Pill marked as taken at ${takenAt.toLocaleTimeString()}, next dose recalculated`);
    } catch (error) {
      console.error('Error marking pill taken:', error);
      throw error;
    }
  }

  /**
   * Calculate next dose for a specific regimen
   */
  private async calculateNextDoseForRegimen(
    medication: Medication, 
    regimen: Regimen
  ): Promise<NextPillCalculation | null> {
    try {
      const constraints = await databaseService.getConstraintsByRegimen(regimen.id);
      const now = new Date();
      
      let nextDueTime: Date;
      let reason = '';

      // If never taken, use start time logic
      if (!regimen.lastTakenAt) {
        nextDueTime = await this.calculateInitialDoseTime(regimen, constraints);
        reason = this.getInitialDoseReason(regimen, constraints);
      } else {
        // Calculate based on last taken time and interval
        nextDueTime = this.calculateIntervalBasedNextDose(regimen);
        reason = this.getIntervalBasedReason(regimen);
      }

      // Check meal constraints and adjust timing
      const mealConstraints = await this.checkMealConstraints(constraints, nextDueTime);
      if (mealConstraints && mealConstraints.nextMealTime) {
        nextDueTime = mealConstraints.nextMealTime;
        reason = `${reason} (adjusted for meal timing)`;
      }

      // Calculate if overdue
      const isOverdue = now > nextDueTime;
      const minutesOverdue = isOverdue ? Math.floor((now.getTime() - nextDueTime.getTime()) / (1000 * 60)) : 0;

      // Check if can take now based on constraints
      const canTakeNow = await this.canTakeNow(regimen, constraints);

      return {
        regimenId: regimen.id,
        medicationName: medication.name,
        doseAmount: regimen.doseAmount,
        nextDueTime,
        reason,
        intervalHours: regimen.intervalHours,
        timesPerDay: regimen.timesPerDay,
        lastTakenAt: regimen.lastTakenAt,
        isOverdue,
        minutesOverdue: isOverdue ? minutesOverdue : undefined,
        canTakeNow,
        mealConstraints
      };
    } catch (error) {
      console.error('Error calculating next dose for regimen:', error);
      return null;
    }
  }

  /**
   * Calculate next dose based on interval (e.g., every 6 hours from last taken)
   */
  private calculateIntervalBasedNextDose(regimen: Regimen): Date {
    if (!regimen.lastTakenAt || !regimen.intervalHours) {
      // Fallback to current time if no data
      return new Date();
    }

    const lastTaken = new Date(regimen.lastTakenAt);
    const nextDose = new Date(lastTaken.getTime() + (regimen.intervalHours * 60 * 60 * 1000));
    return nextDose;
  }

  /**
   * Calculate initial dose time based on schedule and constraints
   */
  private async calculateInitialDoseTime(regimen: Regimen, constraints: Constraints[]): Promise<Date> {
    const now = new Date();
    
    // If it's a times-per-day regimen, calculate based on day schedule
    if (regimen.timesPerDay) {
      return this.calculateTimesPerDayNextDose(regimen.timesPerDay, now);
    }
    
    // If it's an interval regimen, start now
    if (regimen.intervalHours) {
      return now;
    }
    
    // Default to now
    return now;
  }

  /**
   * Calculate next dose for times-per-day regimens
   */
  private calculateTimesPerDayNextDose(timesPerDay: number, fromTime: Date): Date {
    const wakeTime = 7; // 7 AM default wake time
    const sleepTime = 22; // 10 PM default sleep time
    const awakeHours = sleepTime - wakeTime;
    const intervalHours = awakeHours / timesPerDay;
    
    const currentHour = fromTime.getHours();
    let nextHour = wakeTime;
    
    // Find next dose time
    for (let i = 0; i < timesPerDay; i++) {
      const doseHour = wakeTime + (i * intervalHours);
      if (doseHour > currentHour) {
        nextHour = doseHour;
        break;
      }
    }
    
    // If past all doses for today, start tomorrow
    if (nextHour <= currentHour) {
      const tomorrow = new Date(fromTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(wakeTime, 0, 0, 0);
      return tomorrow;
    }
    
    const nextDose = new Date(fromTime);
    nextDose.setHours(Math.floor(nextHour), (nextHour % 1) * 60, 0, 0);
    return nextDose;
  }

  /**
   * Check meal constraints and return adjusted timing
   */
  private async checkMealConstraints(constraints: Constraints[], proposedTime: Date): Promise<any> {
    for (const constraint of constraints) {
      if (constraint.withFood || constraint.noFoodBeforeMinutes || constraint.afterFoodMinutes) {
        // Get user's meal preferences
        const userPrefs = await databaseService.getUserPrefs();
        if (!userPrefs) return null;

        // This would need meal timing logic - simplified for now
        return {
          needsFood: !!constraint.withFood,
          waitAfterFood: constraint.afterFoodMinutes,
          waitBeforeFood: constraint.noFoodBeforeMinutes,
          nextMealTime: proposedTime // Simplified - would calculate actual meal time
        };
      }
    }
    return null;
  }

  /**
   * Check if medication can be taken now based on constraints
   */
  private async canTakeNow(regimen: Regimen, constraints: Constraints[]): Promise<boolean> {
    // Check minimum interval
    if (regimen.lastTakenAt && regimen.intervalHours) {
      const lastTaken = new Date(regimen.lastTakenAt);
      const minNextTime = new Date(lastTaken.getTime() + (regimen.intervalHours * 60 * 60 * 1000));
      if (new Date() < minNextTime) {
        return false;
      }
    }

    // Check other constraints (meal timing, etc.)
    // Simplified for now
    return true;
  }

  /**
   * Schedule notifications for next doses and meal reminders
   */
  private async scheduleNextNotifications(regimenId: string, takenAt: Date): Promise<void> {
    try {
      const regimen = await databaseService.getRegimen(regimenId);
      if (!regimen) return;

      const medication = await databaseService.getMedication(regimen.medicationId);
      if (!medication) return;

      const constraints = await databaseService.getConstraintsByRegimen(regimenId);

      // Schedule next dose notification
      if (regimen.intervalHours) {
        const nextDose = new Date(takenAt.getTime() + (regimen.intervalHours * 60 * 60 * 1000));
        await notificationService.scheduleNotification({
          id: `next-dose-${regimenId}`,
          title: `${medication.name} - Time for next dose`,
          body: `Take ${regimen.doseAmount} ${medication.form}`,
          scheduledFor: nextDose,
          data: { regimenId, type: 'next_dose' }
        });
      }

      // Schedule meal constraint notifications
      for (const constraint of constraints) {
        if (constraint.afterFoodMinutes) {
          const canEatAt = new Date(takenAt.getTime() + (constraint.afterFoodMinutes * 60 * 1000));
          await notificationService.scheduleNotification({
            id: `can-eat-${regimenId}`,
            title: 'You can eat now!',
            body: `It's been ${constraint.afterFoodMinutes} minutes since taking ${medication.name}`,
            scheduledFor: canEatAt,
            data: { regimenId, type: 'can_eat' }
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  private getInitialDoseReason(regimen: Regimen, constraints: Constraints[]): string {
    if (regimen.timesPerDay) {
      return `${regimen.timesPerDay} times daily`;
    }
    if (regimen.intervalHours) {
      return `Every ${regimen.intervalHours} hours`;
    }
    return 'As needed';
  }

  private getIntervalBasedReason(regimen: Regimen): string {
    if (regimen.intervalHours) {
      return `${regimen.intervalHours} hours since last dose`;
    }
    return 'Next scheduled dose';
  }
}

export const nextPillService = NextPillService.getInstance();
