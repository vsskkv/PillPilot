import { Medication, Regimen, Constraints, MealEvent, DoseEvent, DailySchedule, ScheduleConflict } from '../types';
import { databaseService } from './DatabaseService';

class SchedulingService {
  async generateDailySchedule(date: Date): Promise<DailySchedule> {
    try {
      // Get all medications and their regimens
      const medications = await databaseService.getAllMedications();
      const allRegimens: Regimen[] = [];
      
      for (const medication of medications) {
        const regimens = await databaseService.getRegimensByMedication(medication.id);
        allRegimens.push(...regimens);
      }

      // Get meal events for the day
      const meals = await databaseService.getMealEventsForDate(date);
      
      // Get existing dose events for the day
      const existingDoses = await databaseService.getDoseEventsForDate(date);
      
      // Get user preferences
      const userPrefs = await databaseService.getUserPrefs();
      
      // Generate optimal schedule
      const schedule = await this.calculateOptimalSchedule(date, allRegimens, meals, userPrefs);
      
      // Detect conflicts
      const conflicts = this.detectConflicts(schedule, existingDoses);
      
      return {
        date,
        medications: schedule.medications,
        meals: schedule.meals,
        conflicts
      };
    } catch (error) {
      console.error('Error generating daily schedule:', error);
      throw error;
    }
  }

  private async calculateOptimalSchedule(
    date: Date,
    regimens: Regimen[],
    meals: MealEvent[],
    userPrefs: any
  ): Promise<{ medications: any[], meals: MealEvent[] }> {
    const medications: any[] = [];
    
    // Process each regimen
    for (const regimen of regimens) {
      if (!this.shouldTakeOnDate(regimen, date)) continue;
      
      const constraints = await this.getConstraintsForRegimen(regimen.id);
      const optimalTimes = this.calculateOptimalTimes(regimen, constraints, meals, userPrefs);
      
      medications.push({
        id: regimen.id,
        medicationId: regimen.medicationId,
        doseAmount: regimen.doseAmount,
        frequency: regimen.frequency,
        scheduledTimes: optimalTimes,
        constraints
      });
    }
    
    return { medications, meals };
  }

  private shouldTakeOnDate(regimen: Regimen, date: Date): boolean {
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (regimen.frequency === 'daily') {
      return true;
    } else if (regimen.frequency === 'weekly' && regimen.daysOfWeek) {
      return regimen.daysOfWeek.includes(dayNames[dayOfWeek]);
    }
    
    return false;
  }

  private async getConstraintsForRegimen(regimenId: string): Promise<Constraints[]> {
    try {
      return await databaseService.getConstraintsByRegimen(regimenId);
    } catch (error) {
      console.error('Error getting constraints:', error);
      return [];
    }
  }

  private calculateOptimalTimes(
    regimen: Regimen,
    constraints: Constraints[],
    meals: MealEvent[],
    userPrefs: any
  ): Date[] {
    const times: Date[] = [];
    
    // Default to morning if no specific constraints
    if (constraints.length === 0) {
      const morningTime = new Date();
      morningTime.setHours(9, 0, 0, 0);
      times.push(morningTime);
      return times;
    }
    
    // Process food-related constraints
    for (const constraint of constraints) {
      if (constraint.withFood) {
        // Schedule with meals
        for (const meal of meals) {
          times.push(meal.dateTime);
        }
      } else if (constraint.noFoodBeforeMinutes) {
        // Schedule before meals
        for (const meal of meals) {
          const beforeMeal = new Date(meal.dateTime);
          beforeMeal.setMinutes(beforeMeal.getMinutes() - constraint.noFoodBeforeMinutes);
          times.push(beforeMeal);
        }
      } else if (constraint.afterFoodMinutes) {
        // Schedule after meals
        for (const meal of meals) {
          const afterMeal = new Date(meal.dateTime);
          afterMeal.setMinutes(afterMeal.getMinutes() + constraint.afterFoodMinutes);
          times.push(afterMeal);
        }
      }
    }
    
    // Apply time constraints
    times.forEach(time => {
      if (constraints.some(c => c.earliestTime)) {
        const earliest = constraints.find(c => c.earliestTime)?.earliestTime;
        if (earliest && time < new Date(earliest)) {
          time.setTime(new Date(earliest).getTime());
        }
      }
      
      if (constraints.some(c => c.latestTime)) {
        const latest = constraints.find(c => c.latestTime)?.latestTime;
        if (latest && time > new Date(latest)) {
          time.setTime(new Date(latest).getTime());
        }
      }
    });
    
    // Remove duplicates and sort
    const uniqueTimes = [...new Set(times.map(t => t.getTime()))].map(t => new Date(t));
    return uniqueTimes.sort((a, b) => a.getTime() - b.getTime());
  }

  private detectConflicts(schedule: any, existingDoses: DoseEvent[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    
    // Check for overlapping scheduled times
    const allTimes = schedule.medications.flatMap((m: any) => m.scheduledTimes);
    for (let i = 0; i < allTimes.length; i++) {
      for (let j = i + 1; j < allTimes.length; j++) {
        const time1 = allTimes[i];
        const time2 = allTimes[j];
        const diff = Math.abs(time1.getTime() - time2.getTime());
        
        if (diff < 30 * 60 * 1000) { // Less than 30 minutes apart
          conflicts.push({
            type: 'timing',
            description: 'Medications scheduled too close together',
            severity: 'medium',
            suggestedFix: 'Space medications at least 30 minutes apart'
          });
        }
      }
    }
    
    // Check for conflicts with existing doses
    for (const dose of existingDoses) {
      if (dose.status === 'taken') {
        // Check if this conflicts with any new schedule
        const conflictingMed = schedule.medications.find((m: any) => 
          m.medicationId === dose.regimenId
        );
        
        if (conflictingMed) {
          conflicts.push({
            type: 'schedule',
            description: 'Dose already taken at different time',
            severity: 'low',
            suggestedFix: 'Adjust schedule to avoid double dosing'
          });
        }
      }
    }
    
    return conflicts;
  }

  async replanDay(date: Date, changes: { mealMoved?: MealEvent, doseTaken?: DoseEvent }): Promise<DailySchedule> {
    // Regenerate schedule with new constraints
    return await this.generateDailySchedule(date);
  }
}

export const schedulingService = new SchedulingService();
