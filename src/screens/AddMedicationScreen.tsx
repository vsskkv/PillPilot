import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/DatabaseService';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../types/navigation';
import { getTheme, shadow } from '../theme/theme';
import { Button, Card, Text, Input, LogoHeader } from '../components/ui';

export default function AddMedicationScreen() {
  const navigation = useNavigation<NavigationProps>();
  
  // Medication basic info
  const [name, setName] = useState('');
  const [form, setForm] = useState('tablet');
  const [strength, setStrength] = useState('');
  const [notes, setNotes] = useState('');
  
  // Regimen info
  const [doseAmount, setDoseAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'cycles' | 'interval' | 'timesPerDay'>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [intervalHours, setIntervalHours] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [prn, setPrn] = useState(false);
  const [prnMaxPerDay, setPrnMaxPerDay] = useState('');
  
  // Constraints info
  const [withFood, setWithFood] = useState(false);
  const [noFoodBeforeMinutes, setNoFoodBeforeMinutes] = useState('');
  const [afterFoodMinutes, setAfterFoodMinutes] = useState('');
  const [spacingHours, setSpacingHours] = useState('');
  const [earliestTime, setEarliestTime] = useState('');
  const [latestTime, setLatestTime] = useState('');
  const [quietHours, setQuietHours] = useState(false);
  const [anchor, setAnchor] = useState<'meal' | 'clock'>('clock');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic, 2: Regimen, 3: Constraints

  const formOptions = [
    { label: 'Tablet', value: 'tablet' },
    { label: 'Capsule', value: 'capsule' },
    { label: 'Liquid', value: 'liquid' },
  ];

  const frequencyOptions = [
    { label: 'Daily (once per day)', value: 'daily' },
    { label: 'Weekly (specific days)', value: 'weekly' },
    { label: 'Every X hours', value: 'interval' },
    { label: 'X times per day', value: 'timesPerDay' },
    { label: 'Cycles (complex)', value: 'cycles' },
  ];

  const handleFormSelect = (value: string) => {
    setForm(value);
    setShowFormPicker(false);
  };

  const handleFrequencySelect = (selectedFrequency: typeof frequency) => {
    setFrequency(selectedFrequency);
    setShowFrequencyPicker(false);
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

  const validateForm = () => {
    if (!name.trim() || !form || !doseAmount.trim() || !frequency) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return false;
    }

    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week');
      return false;
    }

    if (frequency === 'interval' && !intervalHours.trim()) {
      Alert.alert('Error', 'Please enter the interval in hours');
      return false;
    }

    if (frequency === 'timesPerDay' && !timesPerDay.trim()) {
      Alert.alert('Error', 'Please enter the number of times per day');
      return false;
    }

    if (prn && !prnMaxPerDay.trim()) {
      Alert.alert('Error', 'Please enter the maximum number of doses per day for PRN medications');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Save medication
      const medicationId = await databaseService.saveMedication({
        name: name.trim(),
        form,
        strength: strength.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Save regimen
      const regimenId = await databaseService.saveRegimen({
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

      // Save constraints if any are set
      if (withFood || noFoodBeforeMinutes || afterFoodMinutes || spacingHours || earliestTime || latestTime || quietHours) {
        await databaseService.saveConstraints({
          regimenId,
          withFood,
          noFoodBeforeMinutes: noFoodBeforeMinutes ? parseInt(noFoodBeforeMinutes) : undefined,
          afterFoodMinutes: afterFoodMinutes ? parseInt(afterFoodMinutes) : undefined,
          spacingHours: spacingHours ? parseFloat(spacingHours) : undefined,
          earliestTime: earliestTime || undefined,
          latestTime: latestTime || undefined,
          quietHours,
          anchor,
        });
      }

      Alert.alert(
        '🎉 Medication Added Successfully!',
        'Your medication has been added with a complete dosing plan and timing rules.',
        [
          {
            text: 'Great!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const t = getTheme();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LogoHeader size="medium" />
            <Text variant="title" size="xl">
              ✨ Add New Medication
            </Text>
            <Text variant="secondary" size="medium" style={styles.subtitle}>
              Complete medication setup with dosing plan and timing rules
            </Text>
          </View>

          <View style={styles.form}>
            {/* Basic Medication Information */}
            <Card variant="outlined" style={styles.section}>
              <Text variant="title" size="large" style={styles.sectionTitle}>
                💊 Basic Information
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medication Name *</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Aspirin, Ibuprofen"
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Form *</Text>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => setShowFormPicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {formOptions.find(opt => opt.value === form)?.label || 'Select Form'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Strength (Optional)</Text>
                <Input
                  value={strength}
                  onChangeText={setStrength}
                  placeholder="e.g., 500mg, 10mg"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special instructions or notes"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </Card>

            {/* Dosing Regimen */}
            <Card variant="outlined" style={styles.section}>
              <Text variant="title" size="large" style={styles.sectionTitle}>
                🚀 Dosing Plan
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dose Amount *</Text>
                <Input
                  value={doseAmount}
                  onChangeText={setDoseAmount}
                  placeholder="e.g., 1, 2, 0.5"
                  keyboardType="numeric"
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

              {frequency === 'weekly' && (
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
              )}

              {frequency === 'interval' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Every (hours) *</Text>
                  <Input
                    value={intervalHours}
                    onChangeText={setIntervalHours}
                    placeholder="e.g., 6"
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
                  <Input
                    value={timesPerDay}
                    onChangeText={setTimesPerDay}
                    placeholder="e.g., 3"
                    keyboardType="numeric"
                  />
                  <Text style={styles.helperText}>
                    Take {doseAmount || 'X'} tablet{doseAmount && parseInt(doseAmount) > 1 ? 's' : ''} X times per day
                  </Text>
                </View>
              )}

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
                  <Input
                    value={prnMaxPerDay}
                    onChangeText={setPrnMaxPerDay}
                    placeholder="Max doses per day (e.g., 3)"
                    keyboardType="numeric"
                    style={styles.prnInput}
                  />
                )}
              </View>
            </Card>

            {/* Timing Constraints */}
            <Card variant="outlined" style={styles.section}>
              <Text variant="title" size="large" style={styles.sectionTitle}>
                ⏰ Timing Rules (Optional)
              </Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Take with food</Text>
                  <Switch
                    value={withFood}
                    onValueChange={setWithFood}
                    trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>No food before (minutes)</Text>
                <Input
                  value={noFoodBeforeMinutes}
                  onChangeText={setNoFoodBeforeMinutes}
                  placeholder="e.g., 60"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Take after food (minutes)</Text>
                <Input
                  value={afterFoodMinutes}
                  onChangeText={setAfterFoodMinutes}
                  placeholder="e.g., 30"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Spacing from other meds (hours)</Text>
                <Input
                  value={spacingHours}
                  onChangeText={setSpacingHours}
                  placeholder="e.g., 2"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Earliest time</Text>
                <Input
                  value={earliestTime}
                  onChangeText={setEarliestTime}
                  placeholder="e.g., 08:00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Latest time</Text>
                <Input
                  value={latestTime}
                  onChangeText={setLatestTime}
                  placeholder="e.g., 22:00"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Respect quiet hours</Text>
                  <Switch
                    value={quietHours}
                    onValueChange={setQuietHours}
                    trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Form Picker Modal */}
        <Modal
          visible={showFormPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFormPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Form</Text>
                <TouchableOpacity 
                  onPress={() => setShowFormPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalOptions}>
                {formOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      form === option.value && styles.modalOptionSelected
                    ]}
                    onPress={() => handleFormSelect(option.value)}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      form === option.value && styles.modalOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {form === option.value && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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

        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="secondary"
            disabled={loading}
            style={styles.footerButton}
          />
          
          <Button
            title={loading ? 'Saving...' : 'Save Medication'}
            onPress={handleSave}
            variant="primary"
            disabled={loading}
            style={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  pickerButton: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chevron: {
    marginLeft: 8,
  },
  notesContainer: {
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  optionButton: {
    marginBottom: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  optionButtonSelected: {
    backgroundColor: '#E8FAF9',
    borderLeftWidth: 4,
    borderLeftColor: '#12A5A2',
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  dayButton: {
    width: '20%', // 5 days per row
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  dayButtonSelected: {
    backgroundColor: '#12A5A2',
    borderWidth: 1,
    borderColor: '#12A5A2',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#333',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prnInput: {
    marginTop: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOptions: {
    maxHeight: 300, // Limit height for scrolling
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOptionSelected: {
    backgroundColor: '#E8FAF9',
    borderLeftWidth: 4,
    borderLeftColor: '#12A5A2',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
