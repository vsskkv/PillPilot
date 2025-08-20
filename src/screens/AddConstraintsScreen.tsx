import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/DatabaseService';
import { Constraints } from '../types';
import { NavigationProps } from '../types/navigation';
import { getTheme } from '../theme/theme';
import { Button, Card, Text, Input, LogoHeader } from '../components/ui';

type AddConstraintsScreenRouteProp = {
  medicationId: string;
};

export default function AddConstraintsScreen() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<{ params: AddConstraintsScreenRouteProp }>();
  const { medicationId } = route.params;
  const t = getTheme();

  const [constraints, setConstraints] = useState({
    withFood: false,
    noFoodBeforeMinutes: '',
    afterFoodMinutes: '',
    avoidWith: '',
    spacingHours: '',
    earliestTime: '',
    latestTime: '',
    quietHours: false,
    anchor: 'meal' as 'meal' | 'clock',
  });

  const [loading, setLoading] = useState(false);

  // Helper function to generate UUIDs
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate that at least one constraint is set
      if (!constraints.withFood && !constraints.noFoodBeforeMinutes && 
          !constraints.afterFoodMinutes && !constraints.spacingHours &&
          !constraints.earliestTime && !constraints.latestTime) {
        Alert.alert('No Constraints', 'Please set at least one timing constraint.');
        return;
      }

      // Create a temporary regimen ID for constraints (will be updated when regimen is created)
      const tempRegimenId = generateUUID();
      
      await databaseService.saveConstraints({
        regimenId: tempRegimenId,
        withFood: constraints.withFood,
        noFoodBeforeMinutes: constraints.noFoodBeforeMinutes ? parseInt(constraints.noFoodBeforeMinutes) : undefined,
        afterFoodMinutes: constraints.afterFoodMinutes ? parseInt(constraints.afterFoodMinutes) : undefined,
        avoidWith: constraints.avoidWith ? constraints.avoidWith.split(',').map(s => s.trim()) : undefined,
        spacingHours: constraints.spacingHours ? parseFloat(constraints.spacingHours) : undefined,
        earliestTime: constraints.earliestTime || undefined,
        latestTime: constraints.latestTime || undefined,
        quietHours: constraints.quietHours,
        anchor: constraints.anchor,
      });

      Alert.alert(
        'Constraints Added',
        'Timing rules have been saved. You can now add a dosing regimen.',
        [
          {
            text: 'Add Regimen',
            onPress: () => navigation.navigate('AddRegimen', { medicationId }),
          },
          {
            text: 'Done',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving constraints:', error);
      Alert.alert('Error', 'Failed to save timing rules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoHeader size="medium" />
          <Text variant="title" size="xl">
            Medication Timing Rules
          </Text>
          <Text variant="secondary" size="medium" style={styles.subtitle}>
            Set when this medication should be taken relative to meals and other factors
          </Text>
        </View>

        <View style={styles.form}>
          {/* Food-related constraints */}
          <Card variant="default" style={styles.section}>
            <Text variant="title" size="large" style={styles.sectionTitle}>
              🍽️ Food Timing
            </Text>
            
            <View style={styles.constraintItem}>
              <View style={styles.constraintHeader}>
                <Text variant="body" size="medium" weight="medium">
                  Take with food
                </Text>
                <Switch
                  value={constraints.withFood}
                  onValueChange={(value) => setConstraints(prev => ({ ...prev, withFood: value }))}
                  trackColor={{ false: t.color.outline, true: t.color.primary }}
                  thumbColor={constraints.withFood ? t.color.onPrimary : '#f4f3f4'}
                />
              </View>
            </View>

            <Input
              label="No food before taking (minutes)"
              value={constraints.noFoodBeforeMinutes}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, noFoodBeforeMinutes: value }))}
              placeholder="e.g., 60 (1 hour)"
              keyboardType="numeric"
            />

            <Input
              label="Take after food (minutes)"
              value={constraints.afterFoodMinutes}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, afterFoodMinutes: value }))}
              placeholder="e.g., 30 (30 minutes)"
              keyboardType="numeric"
            />
          </Card>

          {/* Time constraints */}
          <Card variant="default" style={styles.section}>
            <Text variant="title" size="large" style={styles.sectionTitle}>
              ⏰ Time Constraints
            </Text>
            
            <Input
              label="Earliest time"
              value={constraints.earliestTime}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, earliestTime: value }))}
              placeholder="e.g., 08:00"
            />

            <Input
              label="Latest time"
              value={constraints.latestTime}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, latestTime: value }))}
              placeholder="e.g., 20:00"
            />
          </Card>

          {/* Spacing constraints */}
          <Card variant="default" style={styles.section}>
            <Text variant="title" size="large" style={styles.sectionTitle}>
              ⏳ Spacing Rules
            </Text>
            
            <Input
              label="Keep apart from other meds (hours)"
              value={constraints.spacingHours}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, spacingHours: value }))}
              placeholder="e.g., 2.5"
              keyboardType="numeric"
            />

            <Input
              label="Avoid taking with (medication names)"
              value={constraints.avoidWith}
              onChangeText={(value) => setConstraints(prev => ({ ...prev, avoidWith: value }))}
              placeholder="e.g., Iron, Calcium"
            />
          </Card>

          <Card variant="outlined" style={styles.infoBox}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={20} color={t.color.info} />
              <Text variant="secondary" size="small" style={styles.infoText}>
                These timing rules will be used to automatically schedule your medication around your meal times and other constraints.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="secondary"
          disabled={loading}
          style={styles.footerButton}
        />
        
        <Button
          title={loading ? 'Saving...' : 'Save Rules'}
          onPress={handleSave}
          variant="primary"
          disabled={loading}
          style={styles.footerButton}
        />
      </View>
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
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  constraintItem: {
    marginBottom: 16,
  },
  constraintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBox: {
    marginTop: 8,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#CFD9D8',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
