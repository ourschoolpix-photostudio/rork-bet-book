import { Vehicle } from '@/types/expense';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    make: string,
    model: string,
    year: number,
    startingMileage: number,
    color?: string,
    licensePlate?: string,
    yearStartMileage?: number,
    yearEndingMileage?: number
  ) => Promise<void>;
  editingVehicle?: Vehicle | null;
}

export default function AddVehicleModal({ visible, onClose, onSubmit, editingVehicle }: AddVehicleModalProps) {
  const [name, setName] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [startingMileage, setStartingMileage] = useState<string>('');
  const [yearStartMileage, setYearStartMileage] = useState<string>('');
  const [yearEndingMileage, setYearEndingMileage] = useState<string>('');

  useEffect(() => {
    if (editingVehicle) {
      setName(editingVehicle.name);
      setMake(editingVehicle.make);
      setModel(editingVehicle.model);
      setYear(editingVehicle.year.toString());
      setColor(editingVehicle.color || '');
      setLicensePlate(editingVehicle.licensePlate || '');
      setStartingMileage(editingVehicle.startingMileage.toString());
      setYearStartMileage(editingVehicle.yearStartMileage?.toString() || editingVehicle.startingMileage.toString());
      setYearEndingMileage(editingVehicle.yearEndingMileage?.toString() || '');
    } else {
      setName('');
      setMake('');
      setModel('');
      setYear('');
      setColor('');
      setLicensePlate('');
      setStartingMileage('');
      setYearStartMileage('');
      setYearEndingMileage('');
    }
  }, [editingVehicle, visible]);

  const handleSubmit = async () => {
    const parsedYear = parseInt(year);
    const parsedStartingMileage = parseInt(startingMileage);
    const parsedYearStartMileage = yearStartMileage ? parseInt(yearStartMileage) : undefined;
    const parsedYearEndingMileage = yearEndingMileage ? parseInt(yearEndingMileage) : undefined;

    if (!name.trim() || !make.trim() || !model.trim()) {
      return;
    }

    if (!parsedYear || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 1) {
      return;
    }

    if (!parsedStartingMileage || parsedStartingMileage < 0) {
      return;
    }

    await onSubmit(
      name.trim(),
      make.trim(),
      model.trim(),
      parsedYear,
      parsedStartingMileage,
      color.trim() || undefined,
      licensePlate.trim() || undefined,
      parsedYearStartMileage,
      parsedYearEndingMileage
    );

    setName('');
    setMake('');
    setModel('');
    setYear('');
    setColor('');
    setLicensePlate('');
    setStartingMileage('');
    setYearStartMileage('');
    setYearEndingMileage('');
    onClose();
  };

  const isValid = name.trim() && make.trim() && model.trim() && year && startingMileage &&
    parseInt(year) >= 1900 && parseInt(year) <= new Date().getFullYear() + 1 &&
    parseInt(startingMileage) >= 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modal}
              keyboardVerticalOffset={0}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <X size={24} color="#240046" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vehicle Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., My Honda Civic"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.inputLabel}>Make</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Honda"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={make}
                      onChangeText={setMake}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.inputLabel}>Model</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Civic"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={model}
                      onChangeText={setModel}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.inputLabel}>Year</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="2020"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={year}
                      onChangeText={(text) => setYear(text.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.inputLabel}>Color (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Blue"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={color}
                      onChangeText={setColor}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>License Plate (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ABC-1234"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={licensePlate}
                    onChangeText={setLicensePlate}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Starting Mileage</Text>
                  <Text style={styles.inputHint}>Total miles on the vehicle when you start tracking</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="50000"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={startingMileage}
                    onChangeText={(text) => setStartingMileage(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Year Start Mileage (Optional)</Text>
                  <Text style={styles.inputHint}>Mileage at the beginning of this year for tracking purposes</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={startingMileage || '50000'}
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={yearStartMileage}
                    onChangeText={(text) => setYearStartMileage(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.lastInputGroup]}>
                  <Text style={styles.inputLabel}>Year Ending Mileage (Optional)</Text>
                  <Text style={styles.inputHint}>Mileage at the end of the year - edit this at year end to calculate total miles driven</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter at end of year"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={yearEndingMileage}
                    onChangeText={(text) => setYearEndingMileage(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid}
                  style={({ pressed }) => [
                    styles.submitButton,
                    !isValid && styles.submitButtonDisabled,
                    pressed && styles.submitButtonPressed,
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 600,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 0, 70, 0.05)',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  lastInputGroup: {
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.6)',
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  textInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
