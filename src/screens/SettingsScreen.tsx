import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/DatabaseService';
import { UserPrefs } from '../types';
import { getTheme } from '../theme/theme';
import { Button, Card, Text, Input, LogoHeader, SplashScreen } from '../components/ui';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(false);
  const t = getTheme();

  useEffect(() => {
    loadUserPrefs();
  }, []);

  const loadUserPrefs = async () => {
    try {
      const userPrefs = await databaseService.getUserPrefs();
      setPrefs(userPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const updatePrefs = (updates: Partial<UserPrefs>) => {
    if (!prefs) return;
    setPrefs({ ...prefs, ...updates });
  };

  const handleSave = async () => {
    if (!prefs) return;

    try {
      setLoading(true);
      await databaseService.updateUserPrefs(prefs.id, prefs);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (type: 'sleep' | 'work', field: 'start' | 'end', value: string) => {
    if (!prefs) return;
    
    if (type === 'sleep') {
      const [start, end] = prefs.sleepWindow.split('-');
      const newWindow = field === 'start' ? `${value}-${end}` : `${start}-${value}`;
      updatePrefs({ sleepWindow: newWindow });
    } else if (type === 'work') {
      const [start, end] = prefs.workHours.split('-');
      const newHours = field === 'start' ? `${value}-${end}` : `${start}-${value}`;
      updatePrefs({ workHours: newHours });
    }
  };

  const handleMealTimeChange = (field: 'breakfastTime' | 'lunchTime' | 'dinnerTime' | 'snackTime', value: string) => {
    if (!prefs) return;
    updatePrefs({ [field]: value });
  };

  const renderTimePicker = (
    label: string,
    value: string,
    onTimeChange: (value: string) => void
  ) => (
    <View style={styles.timePickerRow}>
      <Text variant="body" size="medium" weight="medium" style={styles.timeLabel}>
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onTimeChange}
        placeholder="HH:MM"
        style={styles.timeInput}
        containerStyle={styles.timeInputContainer}
      />
    </View>
  );

  // Initialize default preferences if none exist
  if (!prefs) {
    const defaultPrefs: Omit<UserPrefs, 'id' | 'createdAt' | 'updatedAt'> = {
      sleepWindow: '22:00-08:00',
      workHours: '09:00-17:00',
      notificationStyle: 'gentle',
      timezonePolicy: 'relative',
      breakfastTime: '08:00',
      lunchTime: '12:00',
      dinnerTime: '18:00',
      snackTime: '15:00',
    };
    
    // Set default prefs locally first
    const localPrefs: UserPrefs = {
      ...defaultPrefs, 
      id: 'default', 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    setPrefs(localPrefs);
    
    // Try to save to database in background
    databaseService.saveUserPrefs(defaultPrefs).then((savedId) => {
      // Update the local prefs with the real ID from database
      setPrefs({
        ...localPrefs,
        id: savedId,
      });
    }).catch(error => {
      console.error('Failed to save default prefs:', error);
    });
    
    return (
      <SafeAreaView style={styles.container}>
        <SplashScreen message="Initializing settings..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoHeader size="medium" />
          <Text variant="title" size="xl">
            Settings
          </Text>
          <Text variant="secondary" size="medium" style={styles.subtitle}>
            Customize your PillPilot experience
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          <Card variant="default" style={styles.settingGroup}>
            <Text variant="title" size="large" style={styles.groupTitle}>
              Sleep Schedule
            </Text>
            {renderTimePicker(
              'Bedtime',
              prefs.sleepWindow.split('-')[0],
              (value) => handleTimeChange('sleep', 'start', value)
            )}
            {renderTimePicker(
              'Wake Time',
              prefs.sleepWindow.split('-')[1],
              (value) => handleTimeChange('sleep', 'end', value)
            )}
          </Card>

          <Card variant="default" style={styles.settingGroup}>
            <Text variant="title" size="large" style={styles.groupTitle}>
              Work Hours
            </Text>
            {renderTimePicker(
              'Start Time',
              prefs.workHours.split('-')[0],
              (value) => handleTimeChange('work', 'start', value)
            )}
            {renderTimePicker(
              'End Time',
              prefs.workHours.split('-')[1],
              (value) => handleTimeChange('work', 'end', value)
            )}
          </Card>

          <Card variant="default" style={styles.settingGroup}>
            <Text variant="title" size="large" style={styles.groupTitle}>
              Meal Times
            </Text>
            {renderTimePicker(
              'Breakfast',
              prefs.breakfastTime,
              (value) => handleMealTimeChange('breakfastTime', value)
            )}
            {renderTimePicker(
              'Lunch',
              prefs.lunchTime,
              (value) => handleMealTimeChange('lunchTime', value)
            )}
            {renderTimePicker(
              'Dinner',
              prefs.dinnerTime,
              (value) => handleMealTimeChange('dinnerTime', value)
            )}
            {renderTimePicker(
              'Snack',
              prefs.snackTime,
              (value) => handleMealTimeChange('snackTime', value)
            )}
          </Card>

          <Card variant="default" style={styles.settingGroup}>
            <Text variant="title" size="large" style={styles.groupTitle}>
              Notifications
            </Text>
            <View style={styles.settingRow}>
              <Text variant="body" size="medium">
                Notification Style
              </Text>
              <View style={styles.settingValue}>
                <Text variant="secondary" size="medium">
                  {prefs.notificationStyle.charAt(0).toUpperCase() + prefs.notificationStyle.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={t.color.textMuted} />
              </View>
            </View>
          </Card>

          <Button
            title={loading ? 'Saving...' : 'Save Settings'}
            onPress={handleSave}
            variant="primary"
            disabled={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#CFD9D8',
  },
  subtitle: {
    marginTop: 4,
  },
  settingsContainer: {
    padding: 20,
  },
  settingGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    marginRight: 10,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F9F9',
  },
});
