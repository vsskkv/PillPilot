import * as SQLite from 'expo-sqlite';
import { Medication, Regimen, Constraints, MealEvent, DoseEvent, Inventory, UserPrefs } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      console.log('DatabaseService: Starting initialization...');
      
      // Test if SQLite is available
      console.log('DatabaseService: Testing SQLite availability...');
      if (!SQLite || typeof SQLite.openDatabaseAsync !== 'function') {
        throw new Error('SQLite is not available or openDatabaseAsync method not found');
      }
      console.log('DatabaseService: SQLite is available');
      
      this.db = await SQLite.openDatabaseAsync('pillpilot.db');
      console.log('DatabaseService: Database opened successfully');
      
      // Test if database is working
      console.log('DatabaseService: Testing database connection...');
      await this.db.runAsync('SELECT 1');
      console.log('DatabaseService: Database connection test passed');
      
      await this.createTables();
      console.log('DatabaseService: Tables created successfully');
    } catch (error) {
      console.error('DatabaseService: Initialization failed:', error);
      this.db = null; // Reset on failure
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('DatabaseService: Creating tables...');
      
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS medications (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          form TEXT NOT NULL,
          strength TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS regimens (
          id TEXT PRIMARY KEY,
          medicationId TEXT NOT NULL,
          doseAmount TEXT NOT NULL,
          frequency TEXT NOT NULL,
          daysOfWeek TEXT,
          intervalHours REAL,
          timesPerDay INTEGER,
          startDate TEXT NOT NULL,
          endDate TEXT,
          prn BOOLEAN DEFAULT FALSE,
          prnMaxPerDay INTEGER,
          lastTakenAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (medicationId) REFERENCES medications (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS constraints (
          id TEXT PRIMARY KEY,
          regimenId TEXT NOT NULL,
          withFood BOOLEAN DEFAULT FALSE,
          noFoodBeforeMinutes INTEGER,
          afterFoodMinutes INTEGER,
          avoidWith TEXT,
          spacingHours REAL,
          earliestTime TEXT,
          latestTime TEXT,
          quietHours BOOLEAN DEFAULT FALSE,
          anchor TEXT DEFAULT 'clock',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (regimenId) REFERENCES regimens (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS meal_events (
          id TEXT PRIMARY KEY,
          dateTime TEXT NOT NULL,
          type TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS dose_events (
          id TEXT PRIMARY KEY,
          regimenId TEXT NOT NULL,
          scheduledAt TEXT NOT NULL,
          takenAt TEXT,
          status TEXT NOT NULL DEFAULT 'scheduled',
          reason TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (regimenId) REFERENCES regimens (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          medicationId TEXT NOT NULL,
          unitsRemaining INTEGER NOT NULL,
          lowThreshold INTEGER DEFAULT 7,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (medicationId) REFERENCES medications (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_prefs (
          id TEXT PRIMARY KEY,
          sleepWindow TEXT NOT NULL,
          workHours TEXT NOT NULL,
          notificationStyle TEXT NOT NULL DEFAULT 'gentle',
          timezonePolicy TEXT NOT NULL DEFAULT 'relative',
          breakfastTime TEXT NOT NULL DEFAULT '08:00',
          lunchTime TEXT NOT NULL DEFAULT '12:00',
          dinnerTime TEXT NOT NULL DEFAULT '18:00',
          snackTime TEXT NOT NULL DEFAULT '15:00',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;

      // Split the SQL into individual statements and execute them
      const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
      console.log(`DatabaseService: Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`DatabaseService: Executing statement ${i + 1}:`, statement.trim().substring(0, 50) + '...');
          await this.executeSQL(statement.trim());
        }
      }

      // Lightweight migrations for new columns (ignore errors if they already exist)
      try { await this.executeSQL('ALTER TABLE regimens ADD COLUMN intervalHours REAL'); } catch {}
      try { await this.executeSQL('ALTER TABLE regimens ADD COLUMN timesPerDay INTEGER'); } catch {}
      try { await this.executeSQL('ALTER TABLE regimens ADD COLUMN lastTakenAt TEXT'); } catch {}
      
      console.log('DatabaseService: All tables created successfully');
    } catch (error) {
      console.error('DatabaseService: Error creating tables:', error);
      throw error;
    }
  }

  private async executeSQL(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log(`DatabaseService: Executing SQL: ${sql.substring(0, 50)}...`);
      await this.db.runAsync(sql, params);
      console.log('DatabaseService: SQL executed successfully');
    } catch (error) {
      console.error('DatabaseService: SQL execution failed:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  private async querySQL<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<T>(sql, params);
  }

  private async queryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync<T>(sql, params);
  }

  // Check if database is initialized
  private checkInitialized(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  // Get database status
  isInitialized(): boolean {
    return this.db !== null;
  }

  // Get database instance (for debugging)
  getDatabase(): SQLite.SQLiteDatabase | null {
    return this.db;
  }

  // Helper function to generate UUIDs
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Medication CRUD operations
  async saveMedication(medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await this.executeSQL(
      'INSERT INTO medications (id, name, form, strength, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, medication.name, medication.form, medication.strength, medication.notes, now, now]
    );
    
    return id;
  }

  async getMedication(id: string): Promise<Medication | null> {
    this.checkInitialized();
    
    try {
      const result = await this.queryFirst<any>(
        'SELECT * FROM medications WHERE id = ?',
        [id]
      );
      
      if (result) {
        // Convert string dates back to Date objects
        return {
          ...result,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      }
      
      return null;
    } catch (error) {
      console.error('DatabaseService: Error getting medication:', error);
      throw new Error(`Failed to get medication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllMedications(): Promise<Medication[]> {
    this.checkInitialized();
    
    try {
      const medications = await this.querySQL<any>('SELECT * FROM medications ORDER BY name');
      
      // Convert string dates back to Date objects
      return medications.map(medication => ({
        ...medication,
        createdAt: new Date(medication.createdAt),
        updatedAt: new Date(medication.updatedAt),
      }));
    } catch (error) {
      console.error('DatabaseService: Error getting medications:', error);
      throw new Error(`Failed to get medications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMedication(id: string, updates: Partial<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.checkInitialized();
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), now, id];
    
    await this.executeSQL(
      `UPDATE medications SET ${fields}, updatedAt = ? WHERE id = ?`,
      values
    );
  }

  async deleteMedication(id: string): Promise<void> {
    this.checkInitialized();
    
    await this.executeSQL('DELETE FROM medications WHERE id = ?', [id]);
  }

  // Regimen CRUD operations
  async saveRegimen(regimen: Omit<Regimen, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    // Convert daysOfWeek array to JSON string for SQLite storage
    const daysOfWeekJson = regimen.daysOfWeek ? JSON.stringify(regimen.daysOfWeek) : null;
    
    try {
      await this.executeSQL(
        'INSERT INTO regimens (id, medicationId, doseAmount, frequency, daysOfWeek, intervalHours, timesPerDay, startDate, endDate, prn, prnMaxPerDay, lastTakenAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, regimen.medicationId, regimen.doseAmount, regimen.frequency, daysOfWeekJson, regimen.intervalHours ?? null, regimen.timesPerDay ?? null, regimen.startDate.toISOString(), regimen.endDate?.toISOString() ?? null, regimen.prn, regimen.prnMaxPerDay ?? null, regimen.lastTakenAt ? regimen.lastTakenAt.toISOString() : null, now, now]
      );
      
      return id;
    } catch (error) {
      console.error('DatabaseService: Error saving regimen:', error);
      throw new Error(`Failed to save regimen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRegimensByMedication(medicationId: string): Promise<Regimen[]> {
    this.checkInitialized();
    
    try {
      const regimens = await this.querySQL<any>(
        'SELECT * FROM regimens WHERE medicationId = ? ORDER BY startDate',
        [medicationId]
      );
      
      // Convert JSON strings back to arrays and dates
      return regimens.map(regimen => ({
        ...regimen,
        daysOfWeek: regimen.daysOfWeek ? JSON.parse(regimen.daysOfWeek) : undefined,
        intervalHours: regimen.intervalHours != null ? Number(regimen.intervalHours) : undefined,
        timesPerDay: regimen.timesPerDay != null ? Number(regimen.timesPerDay) : undefined,
        startDate: new Date(regimen.startDate),
        endDate: regimen.endDate ? new Date(regimen.endDate) : undefined,
        lastTakenAt: regimen.lastTakenAt ? new Date(regimen.lastTakenAt) : undefined,
        createdAt: new Date(regimen.createdAt),
        updatedAt: new Date(regimen.updatedAt),
      }));
    } catch (error) {
      console.error('DatabaseService: Error getting regimens:', error);
      throw new Error(`Failed to get regimens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRegimen(id: string): Promise<void> {
    this.checkInitialized();
    
    await this.executeSQL('DELETE FROM regimens WHERE id = ?', [id]);
  }

  async updateRegimen(id: string, updates: Partial<Omit<Regimen, 'id' | 'createdAt' | 'updatedAt' | 'medicationId'>>): Promise<void> {
    this.checkInitialized();

    const now = new Date().toISOString();
    const values: any[] = [];
    const sets: string[] = [];

    if (updates.doseAmount !== undefined) { sets.push('doseAmount = ?'); values.push(updates.doseAmount); }
    if (updates.frequency !== undefined) { sets.push('frequency = ?'); values.push(updates.frequency); }
    if (updates.daysOfWeek !== undefined) { sets.push('daysOfWeek = ?'); values.push(JSON.stringify(updates.daysOfWeek)); }
    if (updates.intervalHours !== undefined) { sets.push('intervalHours = ?'); values.push(updates.intervalHours); }
    if (updates.timesPerDay !== undefined) { sets.push('timesPerDay = ?'); values.push(updates.timesPerDay); }
    if (updates.startDate !== undefined) { sets.push('startDate = ?'); values.push(updates.startDate.toISOString()); }
    if (updates.endDate !== undefined) { sets.push('endDate = ?'); values.push(updates.endDate ? updates.endDate.toISOString() : null); }
    if (updates.prn !== undefined) { sets.push('prn = ?'); values.push(updates.prn); }
    if (updates.prnMaxPerDay !== undefined) { sets.push('prnMaxPerDay = ?'); values.push(updates.prnMaxPerDay); }
    if (updates.lastTakenAt !== undefined) { sets.push('lastTakenAt = ?'); values.push(updates.lastTakenAt ? updates.lastTakenAt.toISOString() : null); }

    if (sets.length === 0) return;

    values.push(now, id);
    const sql = `UPDATE regimens SET ${sets.join(', ')}, updatedAt = ? WHERE id = ?`;
    await this.executeSQL(sql, values);
  }

  // Constraints CRUD operations
  async saveConstraints(constraints: Omit<Constraints, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await this.executeSQL(
      'INSERT INTO constraints (id, regimenId, withFood, noFoodBeforeMinutes, afterFoodMinutes, avoidWith, spacingHours, earliestTime, latestTime, quietHours, anchor, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, constraints.regimenId, constraints.withFood, constraints.noFoodBeforeMinutes, constraints.afterFoodMinutes, constraints.avoidWith, constraints.spacingHours, constraints.earliestTime, constraints.latestTime, constraints.quietHours, constraints.anchor, now, now]
    );
    
    return id;
  }

  async getConstraintsByRegimen(regimenId: string): Promise<Constraints[]> {
    this.checkInitialized();
    
    return await this.querySQL<Constraints>(
      'SELECT * FROM constraints WHERE regimenId = ?',
      [regimenId]
    );
  }

  // Meal events
  async saveMealEvent(mealEvent: Omit<MealEvent, 'id' | 'createdAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await this.executeSQL(
      'INSERT INTO meal_events (id, dateTime, type, createdAt) VALUES (?, ?, ?, ?)',
      [id, mealEvent.dateTime.toISOString(), mealEvent.type, now]
    );
    
    return id;
  }

  async getMealEventsForDate(date: Date): Promise<MealEvent[]> {
    this.checkInitialized();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.querySQL<MealEvent>(
      'SELECT * FROM meal_events WHERE dateTime BETWEEN ? AND ? ORDER BY dateTime',
      [startOfDay.toISOString(), endOfDay.toISOString()]
    );
  }

  // Dose events
  async saveDoseEvent(doseEvent: Omit<DoseEvent, 'id' | 'createdAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await this.executeSQL(
      'INSERT INTO dose_events (id, regimenId, scheduledAt, takenAt, status, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, doseEvent.regimenId, doseEvent.scheduledAt.toISOString(), doseEvent.takenAt?.toISOString(), doseEvent.status, doseEvent.reason, now]
    );
    
    return id;
  }

  async getDoseEventsForDate(date: Date): Promise<DoseEvent[]> {
    this.checkInitialized();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.querySQL<DoseEvent>(
      'SELECT * FROM dose_events WHERE scheduledAt BETWEEN ? AND ? ORDER BY scheduledAt',
      [startOfDay.toISOString(), endOfDay.toISOString()]
    );
  }

  // User preferences
  async saveUserPrefs(prefs: Omit<UserPrefs, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.checkInitialized();
    
    const id = this.generateUUID();
    const now = new Date().toISOString();
    
    await this.executeSQL(
      'INSERT INTO user_prefs (id, sleepWindow, workHours, notificationStyle, timezonePolicy, breakfastTime, lunchTime, dinnerTime, snackTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, prefs.sleepWindow, prefs.workHours, prefs.notificationStyle, prefs.timezonePolicy, prefs.breakfastTime, prefs.lunchTime, prefs.dinnerTime, prefs.snackTime, now, now]
    );
    
    return id;
  }

  async getUserPrefs(): Promise<UserPrefs | null> {
    this.checkInitialized();
    
    try {
      const prefs = await this.queryFirst<UserPrefs>('SELECT * FROM user_prefs ORDER BY createdAt DESC LIMIT 1');
      
      if (prefs) {
        // Convert string dates back to Date objects
        return {
          ...prefs,
          createdAt: new Date(prefs.createdAt),
          updatedAt: new Date(prefs.updatedAt),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user prefs:', error);
      return null;
    }
  }

  async updateUserPrefs(id: string, updates: Partial<Omit<UserPrefs, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.checkInitialized();
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), now, id];
    
    await this.executeSQL(
      `UPDATE user_prefs SET ${fields}, updatedAt = ? WHERE id = ?`,
      values
    );
  }
}

export const databaseService = new DatabaseService();
