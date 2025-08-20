import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { Medication, Regimen, Constraints } from '../types';
import { databaseService } from '../services/DatabaseService';
import { NavigationProps, MedicationDetailScreenRouteProp } from '../types/navigation';

export default function MedicationDetailScreen() {
  const [medication, setMedication] = useState<Medication | null>(null);
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<MedicationDetailScreenRouteProp>();
  const { medicationId } = route.params;

  useEffect(() => {
    loadMedication();
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      setLoading(true);
      const med = await databaseService.getMedication(medicationId);
      if (med) {
        setMedication(med);
        const regs = await databaseService.getRegimensByMedication(medicationId);
        setRegimens(regs);
      } else {
        Alert.alert('Error', 'Medication not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading medication:', error);
      Alert.alert('Error', 'Failed to load medication details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedication();
    setRefreshing(false);
  };

  const handleAddRegimen = () => {
    navigation.navigate('AddRegimen', { medicationId });
  };

  const handleEditRegimen = (regimen: Regimen) => {
    // TODO: Navigate to edit regimen screen
    Alert.alert('Coming Soon', 'Edit regimen functionality will be available in a future update.');
  };

  const handleDeleteRegimen = (regimen: Regimen) => {
    Alert.alert(
      'Delete Dosing Plan',
      `Are you sure you want to delete this dosing plan? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteRegimen(regimen.id);
              await loadMedication(); // Refresh the data
            } catch (error) {
              console.error('Error deleting regimen:', error);
              Alert.alert('Error', 'Failed to delete dosing plan');
            }
          },
        },
      ]
    );
  };

  const handleEditMedication = () => {
    // TODO: Implement edit medication functionality
    Alert.alert('Coming Soon', 'Edit medication functionality will be available in a future update.');
  };

  const handleDeleteMedication = () => {
    if (!medication) return;

    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}? This will also remove all associated regimens and constraints.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteMedication(medicationId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const getFormIcon = (form: string) => {
    switch (form) {
      case 'tablet':
        return '💊';
      case 'capsule':
        return '💊';
      case 'liquid':
        return '🥤';
      default:
        return '💊';
    }
  };

  const getDaysOfWeekText = (regimen: Regimen): string => {
    if (regimen.frequency === 'daily') return 'Daily';
    if (regimen.frequency === 'weekly' && regimen.daysOfWeek) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDays = regimen.daysOfWeek.map(d => days[parseInt(d)]).join(', ');
      return `Weekly on ${selectedDays}`;
    }
    return regimen.frequency;
  };

  const renderRegimenItem = (regimen: Regimen) => (
    <View key={regimen.id} style={styles.regimenItem}>
      <View style={styles.regimenHeader}>
        <View style={styles.regimenInfo}>
          <Text style={styles.doseText}>
            {regimen.doseAmount} {medication?.form || 'tablet'}
          </Text>
          <Text style={styles.frequencyText}>
            {getDaysOfWeekText(regimen)}
          </Text>
          <Text style={styles.dateText}>
            {format(regimen.startDate, 'MMM d, yyyy')}
            {regimen.endDate && ` - ${format(regimen.endDate, 'MMM d, yyyy')}`}
          </Text>
        </View>
        
        <View style={styles.regimenActions}>
          <TouchableOpacity 
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed
            ]}
            onPress={() => handleEditRegimen(regimen)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed
            ]}
            onPress={() => handleDeleteRegimen(regimen)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {regimen.prn && (
        <View style={styles.prnBadge}>
          <Text style={styles.prnText}>
            PRN (as needed) - Max {regimen.prnMaxPerDay}/day
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading medication details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Medication not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.medicationHeader}>
            <View style={styles.medicationIconContainer}>
              <Text style={styles.medicationIcon}>{getFormIcon(medication.form)}</Text>
            </View>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              {medication.strength && (
                <Text style={styles.medicationStrength}>💪 {medication.strength}</Text>
              )}
              <Text style={styles.medicationForm}>📋 {medication.form}</Text>
            </View>
          </View>

          <View style={styles.motivationalMessage}>
            <Text style={styles.motivationalText}>
              🎯 You're doing great! Taking your medication is a step toward feeling better.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, styles.editHeaderButton]}
              onPress={handleEditMedication}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
              <Text style={styles.editHeaderButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteHeaderButton]}
              onPress={handleDeleteMedication}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={styles.deleteHeaderButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚀 Your Dosing Plan</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddRegimen}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Plan</Text>
            </TouchableOpacity>
          </View>

          {regimens.length === 0 ? (
            <View style={styles.emptyRegimens}>
              <Text style={styles.emptyRegimensIcon}>📅</Text>
              <Text style={styles.emptyRegimensTitle}>Ready to get started?</Text>
              <Text style={styles.emptyRegimensSubtitle}>
                Let's create your personalized dosing schedule to help you stay on track!
              </Text>
              <TouchableOpacity
                style={styles.addFirstRegimenButton}
                onPress={handleAddRegimen}
              >
                <Text style={styles.addFirstRegimenButtonText}>Create Your First Plan ✨</Text>
              </TouchableOpacity>
            </View>
          ) : (
            regimens.map(renderRegimenItem)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Your Schedule</Text>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleInfoText}>
              🎉 Great news! Your medication is now part of your daily routine. 
              Check your Today screen to see when it's time to take your next dose!
            </Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            <Text style={styles.bold}>💡 Remember:</Text> You're taking great care of yourself! 
            Always follow your healthcare provider's instructions, and this app is here to cheer you on every step of the way.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationIcon: {
    fontSize: 36,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  medicationStrength: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  medicationForm: {
    fontSize: 16,
    color: '#999',
    textTransform: 'capitalize',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  motivationalMessage: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  editHeaderButton: {
    backgroundColor: '#E3F2FD',
  },
  editHeaderButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteHeaderButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteHeaderButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyRegimens: {
    alignItems: 'center',
    padding: 40,
  },
  emptyRegimensIcon: {
    fontSize: 48,
    color: '#ccc',
    marginBottom: 16,
  },
  emptyRegimensTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRegimensSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstRegimenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstRegimenButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  regimenItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  regimenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regimenInfo: {
    flex: 1,
  },
  doseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  regimenActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  editButtonPressed: {
    backgroundColor: '#BBDEFB',
  },
  deleteButtonPressed: {
    backgroundColor: '#FFCDD2',
  },
  prnBadge: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  prnText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  scheduleInfo: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  scheduleInfoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  disclaimer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
});
