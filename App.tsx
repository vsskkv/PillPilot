import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { databaseService } from './src/services/DatabaseService';
import { schedulingService } from './src/services/SchedulingService';
import { notificationService } from './src/services/NotificationService';
import { mealTimingService } from './src/services/MealTimingService';
import AppNavigator from './src/navigation/AppNavigator';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import MedicationDetailScreen from './src/screens/MedicationDetailScreen';
import AddRegimenScreen from './src/screens/AddRegimenScreen';
import AddConstraintsScreen from './src/screens/AddConstraintsScreen';

// Create context for app initialization state
export const AppContext = createContext<{
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}>({
  isInitialized: false,
  isInitializing: false,
  error: null,
});

// Hook to use app context
export const useAppContext = () => useContext(AppContext);

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      console.log('App: Starting initialization...');
      
      // Initialize database
      console.log('App: Initializing database...');
      await databaseService.init();
      console.log('App: Database initialized successfully');
      
      // Verify database is working
      if (!databaseService.isInitialized()) {
        throw new Error('Database initialization failed - database is null');
      }
      console.log('App: Database verification passed');
      
      // Initialize notification service
      console.log('App: Initializing notification service...');
      await notificationService.init();
      console.log('App: Notification service initialized successfully');
      
      // Initialize meal timing service
      console.log('App: Initializing meal timing service...');
      await mealTimingService.initialize();
      console.log('App: Meal timing service initialized successfully');

      setIsInitialized(true);
      console.log('App: All services initialized successfully');
    } catch (error) {
      console.error('App: Failed to initialize app:', error);
      setError(`Failed to initialize app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.loadingText}>Initializing PillPilot...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Text style={styles.retryText}>Please restart the app</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.loadingText}>Waiting for initialization...</Text>
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ isInitialized, isInitializing, error }}>
      <AppNavigator />
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
