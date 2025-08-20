export interface Medication {
  id: string;
  name: string;
  form: string;
  strength?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Regimen {
  id: string;
  medicationId: string;
  doseAmount: string;
  frequency: 'daily' | 'weekly' | 'cycles' | 'interval' | 'timesPerDay';
  daysOfWeek?: string[];
  intervalHours?: number; // for frequency = 'interval'
  timesPerDay?: number;   // for frequency = 'timesPerDay'
  startDate: Date;
  endDate?: Date;
  prn: boolean;
  prnMaxPerDay?: number;
  lastTakenAt?: Date; // used for interval scheduling baseline
  createdAt: Date;
  updatedAt: Date;
}

export interface Constraints {
  id: string;
  regimenId: string;
  withFood: boolean;
  noFoodBeforeMinutes?: number;
  afterFoodMinutes?: number;
  avoidWith?: string[];
  spacingHours?: number;
  earliestTime?: string;
  latestTime?: string;
  quietHours: boolean;
  anchor: 'meal' | 'clock';
  createdAt: Date;
  updatedAt: Date;
}

export interface MealEvent {
  id: string;
  dateTime: Date;
  type: string;
  createdAt: Date;
}

export interface DoseEvent {
  id: string;
  regimenId: string;
  scheduledAt: Date;
  takenAt?: Date;
  status: 'scheduled' | 'taken' | 'skipped' | 'missed';
  reason?: string;
  createdAt: Date;
}

export interface Inventory {
  id: string;
  medicationId: string;
  unitsRemaining: number;
  lowThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPrefs {
  id: string;
  sleepWindow: string;
  workHours: string;
  notificationStyle: 'gentle' | 'persistent' | 'urgent';
  timezonePolicy: 'relative' | 'absolute';
  // Meal timing preferences
  breakfastTime: string; // HH:mm format
  lunchTime: string; // HH:mm format
  dinnerTime: string; // HH:mm format
  snackTime: string; // HH:mm format
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConflict {
  type: 'spacing' | 'quiet-hours' | 'meal-timing' | 'work-hours' | 'timing' | 'schedule';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export interface DailySchedule {
  date: Date;
  medications: Array<{
    id: string;
    medicationId: string;
    doseAmount: string;
    frequency: string;
    scheduledTimes: Date[];
    constraints: Constraints[];
  }>;
  meals: MealEvent[];
  conflicts: ScheduleConflict[];
}
