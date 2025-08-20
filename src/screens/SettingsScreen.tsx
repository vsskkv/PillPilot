import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/DatabaseService';
import { UserPrefs } from '../types';
import { getTheme } from '../theme/theme';
import { Button, Card, Text, LogoHeader } from '../components/ui';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
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
      Alert.alert('✅ Success', 'Your settings have been saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('❌ Error', 'Failed to save settings. Please try again.');
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

  const formatTime = (time: string) => {
    if (!time) return 'Not set';
    return time;
  };

  const renderTimeSetting = (
    label: string,
    value: string,
    onPress: () => void,
    icon: string
  ) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={t.color.primary} style={styles.settingIcon} />
        <Text variant="body" size="medium" weight="medium">
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        <Text variant="secondary" size="medium" style={styles.timeValue}>
          {formatTime(value)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={t.color.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderToggleSetting = (
    label: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string,
    description?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={t.color.primary} style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text variant="body" size="medium" weight="medium">
            {label}
          </Text>
          {description && (
            <Text variant="secondary" size="small" style={styles.settingDescription}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: t.color.primary }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
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
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={48} color={t.color.primary} />
          <Text variant="title" size="large" style={styles.loadingText}>
            Loading Settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LogoHeader size="medium" />
          <Text variant="title" size="xl" style={styles.title}>
            Settings
          </Text>
          <Text variant="secondary" size="medium" style={styles.subtitle}>
            Customize your PillPilot experience
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          {/* Sleep Schedule */}
          <Card variant="default" style={styles.settingGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name="moon" size={24} color={t.color.primary} />
              <Text variant="title" size="large" style={styles.groupTitle}>
                Sleep Schedule
              </Text>
            </View>
            <Text variant="secondary" size="small" style={styles.groupDescription}>
              Set your bedtime and wake time to optimize medication scheduling
            </Text>
            
            {renderTimeSetting(
              'Bedtime',
              prefs.sleepWindow.split('-')[0],
              () => setShowTimePicker('sleep-start'),
              'moon'
            )}
            {renderTimeSetting(
              'Wake Time',
              prefs.sleepWindow.split('-')[1],
              () => setShowTimePicker('sleep-end'),
              'sunny'
            )}
          </Card>

          {/* Work Hours */}
          <Card variant="default" style={styles.settingGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name="briefcase" size={24} color={t.color.primary} />
              <Text variant="title" size="large" style={styles.groupTitle}>
                Work Hours
              </Text>
            </View>
            <Text variant="secondary" size="small" style={styles.groupDescription}>
              Define your work schedule for better medication timing
            </Text>
            
            {renderTimeSetting(
              'Start Time',
              prefs.workHours.split('-')[0],
              () => setShowTimePicker('work-start'),
              'time-outline'
            )}
            {renderTimeSetting(
              'End Time',
              prefs.workHours.split('-')[1],
              () => setShowTimePicker('work-end'),
              'time-outline'
            )}
          </Card>

          {/* Meal Times */}
          <Card variant="default" style={styles.settingGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name="restaurant" size={24} color={t.color.primary} />
              <Text variant="title" size="large" style={styles.groupTitle}>
                Meal Times
              </Text>
            </View>
            <Text variant="secondary" size="small" style={styles.groupDescription}>
              Set your regular meal times for medication coordination
            </Text>
            
            {renderTimeSetting(
              'Breakfast',
              prefs.breakfastTime,
              () => setShowTimePicker('breakfast'),
              'cafe-outline'
            )}
            {renderTimeSetting(
              'Lunch',
              prefs.lunchTime,
              () => setShowTimePicker('lunch'),
              'fast-food-outline'
            )}
            {renderTimeSetting(
              'Dinner',
              prefs.dinnerTime,
              () => setShowTimePicker('dinner'),
              'wine-outline'
            )}
            {renderTimeSetting(
              'Snack',
              prefs.snackTime,
              () => setShowTimePicker('snack'),
              'nutrition-outline'
            )}
          </Card>

          {/* Notifications */}
          <Card variant="default" style={styles.settingGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name="notifications" size={24} color={t.color.primary} />
              <Text variant="title" size="large" style={styles.groupTitle}>
                Notifications
              </Text>
            </View>
            <Text variant="secondary" size="small" style={styles.groupDescription}>
              Customize how you receive medication reminders
            </Text>
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high" size={20} color={t.color.primary} style={styles.settingIcon} />
                <View style={styles.settingText}>
                  <Text variant="body" size="medium" weight="medium">
                    Notification Style
                  </Text>
                  <Text variant="secondary" size="small" style={styles.settingDescription}>
                    Choose how notifications appear
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text variant="secondary" size="medium" style={styles.settingValue}>
                  {prefs.notificationStyle.charAt(0).toUpperCase() + prefs.notificationStyle.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={t.color.textMuted} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Save Button */}
          <Button
            title={loading ? 'Saving...' : '💾 Save Settings'}
            onPress={handleSave}
            variant="primary"
            disabled={loading}
            style={styles.saveButton}
          />

          {/* App Info */}
          <Card variant="default" style={styles.infoCard}>
            <View style={styles.groupHeader}>
              <Ionicons name="information-circle" size={24} color={t.color.textMuted} />
              <Text variant="title" size="medium" style={styles.infoTitle}>
                App Information
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="secondary" size="small">Version</Text>
              <Text variant="body" size="small">1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="secondary" size="small">Built with</Text>
              <Text variant="body" size="small">React Native & Expo</Text>
            </View>
          </Card>
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
  title: {
    marginTop: 8,
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    marginLeft: 12,
  },
  groupDescription: {
    marginBottom: 16,
    marginLeft: 36,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingDescription: {
    marginTop: 2,
    lineHeight: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    marginRight: 8,
    fontFamily: 'monospace',
  },
  settingValue: {
    marginRight: 8,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginLeft: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F9F9',
  },
  loadingText: {
    marginTop: 16,
  },
});
