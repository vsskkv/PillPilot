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
import { nextPillService, NextPillCalculation } from '../services/NextPillService';
import { NavigationProps } from '../types/navigation';
import { databaseService } from '../services/DatabaseService';

export default function NextPillScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [nextPill, setNextPill] = useState<NextPillCalculation | null>(null);
  const [todaysPills, setTodaysPills] = useState<NextPillCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const t = getTheme();

  useEffect(() => {
    loadNextPillData();
    
    // Update countdown every minute
    const interval = setInterval(() => {
      updateCountdown();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []); // Clean dependency array

  const updateCountdown = () => {
    if (nextPill) {
      setTimeUntilNext(getTimeUntil(nextPill.nextDueTime));
    }
  };

  const loadNextPillData = async () => {
    try {
      setLoading(true);
      
      // Check if nextPillService is available
      if (!nextPillService) {
        console.warn('NextPillService not available, showing empty state');
        setNextPill(null);
        setTodaysPills([]);
        return;
      }
      
      const nextPillData = await nextPillService.getNextPill();
      const todaysPillsData = await nextPillService.getTodaysPills();
      
      setNextPill(nextPillData);
      setTodaysPills(todaysPillsData || []);
      
      if (nextPillData) {
        setTimeUntilNext(getTimeUntil(nextPillData.nextDueTime));
      }
      
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading next pill data:', error);
      // Set empty state instead of crashing
      setNextPill(null);
      setTodaysPills([]);
      setHasInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Check if nextPillService is available
      if (!nextPillService) {
        console.warn('NextPillService not available during refresh');
        setNextPill(null);
        setTodaysPills([]);
        return;
      }
      
      const nextPillData = await nextPillService.getNextPill();
      const todaysPillsData = await nextPillService.getTodaysPills();
      
      setNextPill(nextPillData);
      setTodaysPills(todaysPillsData || []);
      
      if (nextPillData) {
        setTimeUntilNext(getTimeUntil(nextPillData.nextDueTime));
      }
      setHasInitialized(true);
    } catch (error) {
      console.error('Error refreshing next pill data:', error);
      // Set empty state instead of crashing
      setNextPill(null);
      setTodaysPills([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkTaken = async (pill: NextPillCalculation) => {
    try {
      // Mark pill as taken using the new service
      await nextPillService.markPillTaken(pill.regimenId, new Date());
      
      // Reload data to see updated next pill
      await loadNextPillData();
      
      console.log(`${pill.medicationName} marked as taken, next dose recalculated`);
    } catch (e) {
      console.error('Failed to mark dose taken:', e);
    }
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

  const getTimeUntil = (scheduledTime: Date) => {
    const now = new Date();
    
    // Get today's date at the scheduled time
    const today = new Date();
    today.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    
    const diff = today.getTime() - now.getTime();
    
    if (diff < 0) {
      return 'Overdue';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isOverdue = (scheduledTime: Date) => {
    const now = new Date();
    
    // Get today's date at the scheduled time
    const today = new Date();
    today.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    
    // Debug logging
    console.log('Time comparison:', {
      now: now.toLocaleTimeString(),
      scheduled: scheduledTime.toLocaleTimeString(),
      todayScheduled: today.toLocaleTimeString(),
      isOverdue: now > today
    });
    
    // Check if it's past the scheduled time today
    return now > today;
  };

  const isUpcoming = (scheduledTime: Date) => {
    const now = new Date();
    
    // Get today's date at the scheduled time
    const today = new Date();
    today.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    
    const diff = today.getTime() - now.getTime();
    return diff > 0 && diff <= 30 * 60 * 1000; // Within 30 minutes
  };

  const renderPillCard = (pill: NextPillCalculation, index: number) => {
    try {
      const isOverdueMed = pill.isOverdue;
      const isUpcomingMed = isUpcoming(pill.nextDueTime);
      
      return (
        <Card
          key={`${pill.regimenId}-${index}`}
          variant={isOverdueMed ? 'elevated' : 'default'}
          style={[
            styles.medicationCard,
            isOverdueMed && styles.overdueCard,
            isUpcomingMed && styles.upcomingCard,
          ]}
        >
          <View style={styles.medicationHeader}>
            <View style={styles.medicationInfo}>
              <Text variant="title" size="large" weight="semibold">
                💊 {pill.medicationName}
              </Text>
              <Text variant="secondary" size="medium">
                {pill.doseAmount} • {pill.reason}
              </Text>
              <Text variant="secondary" size="small" style={styles.medicationTime}>
                Due: {pill.nextDueTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            
            <View style={styles.medicationActions}>
              {isOverdueMed && (
                <View style={styles.overdueBadge}>
                  <Text variant="caption" style={styles.overdueText}>
                    {pill.minutesOverdue}m late
                  </Text>
                </View>
              )}
              {isUpcomingMed && (
                <View style={styles.upcomingBadge}>
                  <Text variant="caption" style={styles.upcomingText}>
                    Soon
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.medicationFooter}>
            <Text variant="secondary" size="small" style={styles.timeUntil}>
              {getTimeUntil(pill.nextDueTime)}
            </Text>
            
            <View style={styles.actionButtons}>
              <Button
                title={pill.canTakeNow ? (isOverdueMed ? 'Take Now! 🎯' : 'Take Now ✨') : 'Not Ready'}
                onPress={() => pill.canTakeNow && handleMarkTaken(pill)}
                variant={isOverdueMed ? 'accent' : 'primary'}
                size="small"
                style={styles.takeButton}
                disabled={!pill.canTakeNow}
              />
            </View>
          </View>
          
          {/* Show last taken and next calculation info */}
          {pill.lastTakenAt && (
            <View style={styles.nextDoseInfo}>
              <Text variant="caption" size="small" style={styles.nextDoseText}>
                ⏰ Last taken: {new Date(pill.lastTakenAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {pill.intervalHours && ` • Next: ${pill.intervalHours}h from when you take it`}
              </Text>
            </View>
          )}

          {/* Show meal constraints */}
          {pill.mealConstraints && (
            <View style={styles.constraintsContainer}>
              <Text variant="caption" size="small" style={styles.constraintText}>
                {pill.mealConstraints.needsFood && '🍽️ Take with food'}
                {pill.mealConstraints.waitAfterFood && ` • Wait ${pill.mealConstraints.waitAfterFood}min after eating`}
                {pill.mealConstraints.waitBeforeFood && ` • Take ${pill.mealConstraints.waitBeforeFood}min before eating`}
              </Text>
            </View>
          )}
        </Card>
      );
    } catch (error) {
      console.error('Error rendering pill card:', error);
      return null;
    }
  };

  const renderEmptyState = () => (
    <Card variant="outlined" style={styles.emptyState}>
      <View style={styles.emptyStateContent}>
        <Text style={styles.emptyStateIcon}>💊✨</Text>
        <Text variant="title" size="large" style={styles.emptyStateTitle}>
          Ready to start your wellness journey?
        </Text>
        <Text variant="secondary" size="medium" style={styles.emptyStateSubtitle}>
          Add your first medication and let's create a personalized plan to help you stay healthy and on track!
        </Text>
        <Button
          title="Start My Journey ✨"
          onPress={() => {
            // Use parent navigation to go to AddMedication
            const parentNavigation = navigation.getParent();
            if (parentNavigation) {
              parentNavigation.navigate('AddMedication');
            }
          }}
          variant="primary"
          style={styles.emptyStateButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GradientAppBar
        title="Next Pill"
        subtitle={nextPill ? `🎯 ${nextPill.medicationName} due in ${timeUntilNext}` : '✨ Your personalized medication journey starts here!'}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 120 }} // Adjusted for floating pill nav bar
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
          <SplashScreen message="Loading your next pill..." />
        ) : (
          <>
            {/* Next Pill Section */}
            {nextPill && (
              <View style={styles.nextPillSection}>
                <View style={styles.sectionHeader}>
                  <Text variant="title" size="large" weight="semibold">
                    🎯 Next Pill Due
                  </Text>
                  <Text variant="secondary" size="small">
                    Smart timing that adjusts when you take it late
                  </Text>
                </View>
                {renderPillCard(nextPill, 0)}
              </View>
            )}

            {/* Today's Pills Section */}
            {todaysPills && todaysPills.length > 0 ? (
              <View style={styles.schedulesContainer}>
                <View style={styles.sectionHeader}>
                  <Text variant="title" size="large" weight="semibold">
                    📋 Today's Complete Schedule
                  </Text>
                  <Text variant="secondary" size="small">
                    {todaysPills.length} medication{todaysPills.length !== 1 ? 's' : ''} scheduled for today
                  </Text>
                </View>
                
                {todaysPills.map((pill, index) => 
                  renderPillCard(pill, index)
                )}
              </View>
            ) : !nextPill ? (
              renderEmptyState()
            ) : null}
          </>
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
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
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
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyState: {
    margin: 20,
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
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doseInfo: {
    flex: 1,
    marginRight: 12,
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
    marginBottom: 4,
  },
  scheduledTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  doseActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  takeButton: {
    minWidth: 80,
  },
  skipButton: {
    backgroundColor: '#FF9800',
  },
  snoozeButton: {
    minWidth: 80,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  conflictsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  conflictsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  conflictText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 2,
  },
  constraintsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  constraintsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  constraintText: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 2,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 16,
  },
  medicationTime: {
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
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
  medicationCard: {
    marginBottom: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueBadge: {
    backgroundColor: '#FFCDD2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  overdueText: {
    color: '#C62828',
    fontWeight: '600',
  },
  upcomingBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  upcomingText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  medicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  timeUntil: {
    fontSize: 14,
    color: '#666',
  },
  nextPillSection: {
    padding: 20,
    paddingBottom: 10,
  },
  schedulesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateButton: {
    marginTop: 20,
  },
  overdueCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
    borderWidth: 1,
  },
  upcomingCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  nextDoseInfo: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  nextDoseText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
});
