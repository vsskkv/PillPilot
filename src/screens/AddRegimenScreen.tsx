import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { databaseService } from '../services/DatabaseService';
import { Regimen, Constraints } from '../types';
import { NavigationProps, AddRegimenScreenRouteProp } from '../types/navigation';

export default function AddRegimenScreen() {
  const [doseAmount, setDoseAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'cycles' | 'interval' | 'timesPerDay'>('daily');
  const [intervalHours, setIntervalHours] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [prn, setPrn] = useState(false);
  const [prnMaxPerDay, setPrnMaxPerDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<AddRegimenScreenRouteProp>();
  const { medicationId } = route.params;

  const frequencyOptions = [
    { label: 'Daily (once per day)', value: 'daily' },
    { label: 'Weekly (specific days)', value: 'weekly' },
    { label: 'Every X hours', value: 'interval' },
    { label: 'X times per day', value: 'timesPerDay' },
    { label: 'Cycles (complex)', value: 'cycles' },
  ];

  const handleFrequencySelect = (selectedFrequency: typeof frequency) => {
    setFrequency(selectedFrequency);
    setShowFrequencyPicker(false);
  };

  const handleSave = async () => {
    if (!doseAmount.trim() || !frequency) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week');
      return;
    }

    if (frequency === 'interval' && !intervalHours.trim()) {
      Alert.alert('Error', 'Please enter the interval in hours');
      return;
    }

    if (frequency === 'timesPerDay' && !timesPerDay.trim()) {
      Alert.alert('Error', 'Please enter the number of times per day');
      return;
    }

    if (prn && !prnMaxPerDay.trim()) {
      Alert.alert('Error', 'Please enter the maximum number of doses per day for PRN medications');
      return;
    }

    try {
      setLoading(true);
      
      await databaseService.saveRegimen({
        medicationId,
        doseAmount: doseAmount.trim(),
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        intervalHours: frequency === 'interval' ? parseFloat(intervalHours) : undefined,
        timesPerDay: frequency === 'timesPerDay' ? parseInt(timesPerDay) : undefined,
        startDate,
        endDate: endDate || undefined,
        prn,
        prnMaxPerDay: prn ? parseInt(prnMaxPerDay) : undefined,
      });

      Alert.alert('Success', 'Regimen added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving regimen:', error);
      Alert.alert('Error', 'Failed to save regimen. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (doseAmount.trim() || prnMaxPerDay.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getDayLabel = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  const renderWeeklyDaysSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Days of the Week *</Text>
      <View style={styles.daysContainer}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              daysOfWeek.includes(day.toString()) && styles.dayButtonSelected
            ]}
            onPress={() => toggleDay(day.toString())}
          >
            <Text style={[
              styles.dayButtonText,
              daysOfWeek.includes(day.toString()) && styles.dayButtonTextSelected
            ]}>
              {getDayLabel(day)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>✨ Create Your Dosing Plan</Text>
            <Text style={styles.subtitle}>
              Let's set up a schedule that works perfectly for you and helps you stay on track!
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dose Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={doseAmount}
                onChangeText={setDoseAmount}
                placeholder="e.g., 1, 2, 0.5"
                placeholderTextColor="#999"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.helperText}>
                Number of tablets/pills to take each time
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency *</Text>
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => setShowFrequencyPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {frequencyOptions.find(opt => opt.value === frequency)?.label || 'Select Frequency'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {frequency === 'weekly' && renderWeeklyDaysSelector()}

            {frequency === 'interval' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Every (hours) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={intervalHours}
                  onChangeText={setIntervalHours}
                  placeholder="e.g., 6"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Take {doseAmount || 'X'} tablet{doseAmount && parseInt(doseAmount) > 1 ? 's' : ''} every X hours
                </Text>
              </View>
            )}

            {frequency === 'timesPerDay' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Times per day *</Text>
                <TextInput
                  style={styles.textInput}
                  value={timesPerDay}
                  onChangeText={setTimesPerDay}
                  placeholder="e.g., 3"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Take {doseAmount || 'X'} tablet{doseAmount && parseInt(doseAmount) > 1 ? 's' : ''} X times per day
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {startDate.toLocaleDateString()}
                </Text>
                <TouchableOpacity style={styles.dateButton}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date (Optional)</Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {endDate ? endDate.toLocaleDateString() : 'No end date'}
                </Text>
                <TouchableOpacity style={styles.dateButton}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {endDate ? 'Change' : 'Set'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>PRN (As Needed)</Text>
                <Switch
                  value={prn}
                  onValueChange={setPrn}
                  trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              </View>
              {prn && (
                <TextInput
                  style={styles.textInput}
                  value={prnMaxPerDay}
                  onChangeText={setPrnMaxPerDay}
                  placeholder="Max doses per day (e.g., 3)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              )}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                🎉 Great job setting up your plan! After this, you can add timing rules like "take with food" or "keep 2 hours apart from other medications" to make it perfect for you.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Regimen'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Frequency</Text>
              <TouchableOpacity 
                onPress={() => setShowFrequencyPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalOptions}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    frequency === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => handleFrequencySelect(option.value)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    frequency === option.value && styles.modalOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {frequency === option.value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  modalOptions: {
    maxHeight: '70%',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
