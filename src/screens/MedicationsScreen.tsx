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
import { databaseService } from '../services/DatabaseService';
import { Medication } from '../types';
import { NavigationProps } from '../types/navigation';
import { getTheme } from '../theme/theme';
import { Button, Card, Text, GradientAppBar, SplashScreen } from '../components/ui';

export default function MedicationsScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const t = getTheme();

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const meds = await databaseService.getAllMedications();
      setMedications(meds);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const meds = await databaseService.getAllMedications();
      setMedications(meds);
    } catch (error) {
      console.error('Error refreshing medications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  const handleMedicationPress = (medication: Medication) => {
    navigation.navigate('MedicationDetail', { medicationId: medication.id });
  };

  const renderMedicationCard = (medication: Medication) => (
    <TouchableOpacity
      key={medication.id}
      onPress={() => handleMedicationPress(medication)}
      activeOpacity={0.7}
    >
      <Card variant="default" style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
          <View style={styles.medicationInfo}>
            <Text variant="title" size="large" weight="semibold">
              {medication.name}
            </Text>
            <Text variant="secondary" size="medium">
              {medication.form} • {medication.strength || 'No strength specified'}
            </Text>
          </View>
          
          <View style={styles.medicationActions}>
            <Ionicons name="chevron-forward" size={20} color={t.color.textMuted} />
          </View>
        </View>

        {medication.notes && (
          <Text variant="secondary" size="small" style={styles.medicationNotes}>
            {medication.notes}
          </Text>
        )}

        <View style={styles.medicationFooter}>
          <View style={styles.chip}>
            <Text variant="caption" style={styles.chipText}>
              {medication.form}
            </Text>
          </View>
          
          <Text variant="caption" size="small" style={styles.medicationDate}>
            Added {medication.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <Card variant="outlined" style={styles.emptyState}>
      <View style={styles.emptyStateContent}>
        <Text variant="title" size="large" style={styles.emptyStateTitle}>
          No medications yet
        </Text>
        <Text variant="secondary" size="medium" style={styles.emptyStateSubtitle}>
          Add your first medication to get started with PillPilot
        </Text>
        <Button
          title="Add Your First Medication"
          onPress={handleAddMedication}
          variant="primary"
          style={styles.emptyStateButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GradientAppBar
        title="Medications"
        subtitle={`${medications.length} medication${medications.length !== 1 ? 's' : ''} in your list`}
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
          <SplashScreen message="Loading medications..." />
        ) : medications.length > 0 ? (
          <View style={styles.medicationsContainer}>
            {medications.map(renderMedicationCard)}
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  medicationsContainer: {
    padding: 20,
  },
  medicationCard: {
    marginBottom: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationActions: {
    justifyContent: 'center',
  },
  medicationNotes: {
    marginTop: 8,
    marginBottom: 12,
  },
  medicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#E8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#12A5A2',
  },
  medicationDate: {
    color: '#666',
  },
  emptyState: {
    margin: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 20,
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
  emptyStateButton: {
    marginTop: 20,
  },
});
