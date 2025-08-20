import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';
import { Button, Card, Text, GradientAppBar, SplashScreen } from '../components/ui';
import { mealTimingService, MedicationSchedule } from '../services/MealTimingService';
import { NavigationProps } from '../types/navigation';

export default function ScheduleScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [weekSchedules, setWeekSchedules] = useState<{ [key: string]: MedicationSchedule[] }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const t = getTheme();

  useEffect(() => {
    loadWeekSchedule();
  }, []);

  const loadWeekSchedule = async () => {
    try {
      setLoading(true);
      const schedules: { [key: string]: MedicationSchedule[] } = {};
      
      // Load schedules for the next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const daySchedules = await mealTimingService.getMedicationSchedulesForDate(date);
        schedules[dateKey] = daySchedules;
      }
      
      setWeekSchedules(schedules);
    } catch (error) {
      console.error('Error loading week schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const schedules: { [key: string]: MedicationSchedule[] } = {};
      
      // Load schedules for the next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const daySchedules = await mealTimingService.getMedicationSchedulesForDate(date);
        schedules[dateKey] = daySchedules;
      }
      
      setWeekSchedules(schedules);
    } catch (error) {
      console.error('Error refreshing week schedule:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  const getDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMealIcon = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '💊';
    }
  };

  const renderDaySchedule = (dateString: string, schedules: MedicationSchedule[]) => {
    const dayName = getDayName(dateString);
    const dateDisplay = getDateDisplay(dateString);
    const isToday = dayName === 'Today';
    
    return (
      <Card
        key={dateString}
        variant={isToday ? 'elevated' : 'default'}
        style={[styles.dayCard, isToday && styles.todayCard]}
      >
        <View style={styles.dayHeader}>
          <View style={styles.dayInfo}>
            <Text variant="title" size="large" weight="semibold">
              {dayName}
            </Text>
            <Text variant="secondary" size="small">
              {dateDisplay}
            </Text>
          </View>
          
          <View style={styles.dayStats}>
            <Text variant="caption" size="small">
              {schedules.length} medication{schedules.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {schedules.length > 0 ? (
          <View style={styles.schedulesList}>
            {schedules.map((schedule, index) => (
              <View key={index} style={styles.scheduleItem}>
                <View style={styles.scheduleTime}>
                  <Text variant="body" size="medium" weight="semibold">
                    {schedule.scheduledTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.scheduleInfo}>
                  <Text variant="body" size="medium">
                    {getMealIcon(schedule.mealType)} {schedule.reason}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyDay}>
            <Text variant="secondary" size="small" style={styles.emptyDayText}>
              No medications scheduled
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card variant="outlined" style={styles.emptyState}>
      <View style={styles.emptyStateContent}>
        <Text variant="title" size="large" style={styles.emptyStateTitle}>
          No weekly schedule yet
        </Text>
        <Text variant="secondary" size="medium" style={styles.emptyStateSubtitle}>
          Add medications and set up timing rules to see your weekly schedule here
        </Text>
        <Button
          title="Add Your First Medication"
          onPress={() => navigation.navigate('AddMedication')}
          variant="primary"
          style={styles.emptyStateButton}
        />
      </View>
    </Card>
  );

  const hasAnySchedules = Object.values(weekSchedules).some(schedules => schedules.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <GradientAppBar
        title="Weekly Schedule"
        subtitle="Your medication schedule for the next 7 days"
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 100 }} // Responsive padding
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#12A5A2']}
            tintColor="#12A5A2"
          />
        }
      >
        {loading ? (
          <SplashScreen message="Loading your weekly schedule..." />
        ) : hasAnySchedules ? (
          <View style={styles.weekContainer}>
            {Object.entries(weekSchedules).map(([dateString, schedules]) =>
              renderDaySchedule(dateString, schedules)
            )}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  dateButton: {
    padding: 8,
  },
  dateDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  dateSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyState: {
    margin: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  doseItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doseTime: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  doseInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  doseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  constraintsContainer: {
    gap: 4,
  },
  constraintText: {
    fontSize: 12,
    color: '#666',
  },
  conflictBadge: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealTime: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  mealTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  timelineInfo: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  timelineInfoText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
  },
  medicationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTime: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  medicationsList: {
    padding: 16,
  },
  dayCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#12A5A2',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8FAF9',
  },
  dayInfo: {
    flex: 1,
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  schedulesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTime: {
    width: 60,
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyDay: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDayText: {
    textAlign: 'center',
  },
  weekContainer: {
    paddingBottom: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateButton: {
    marginTop: 20,
  },
});
