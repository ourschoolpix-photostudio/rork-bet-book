import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface MonthlyUtilitiesModalProps {
  visible: boolean;
  onClose: () => void;
  monthKey: string;
  monthLabel: string;
  electricity: number;
  water: number;
  onSave: (electricity: number, water: number) => Promise<void>;
}

export default function MonthlyUtilitiesModal({
  visible,
  onClose,
  monthKey,
  monthLabel,
  electricity,
  water,
  onSave,
}: MonthlyUtilitiesModalProps) {
  const [electricityValue, setElectricityValue] = useState<string>('0.00');
  const [waterValue, setWaterValue] = useState<string>('0.00');

  useEffect(() => {
    if (visible) {
      setElectricityValue(electricity.toFixed(2));
      setWaterValue(water.toFixed(2));
    }
  }, [visible, electricity, water]);

  const handleSave = async () => {
    const elec = parseFloat(electricityValue) || 0;
    const wat = parseFloat(waterValue) || 0;

    if (elec < 0 || wat < 0) {
      Alert.alert('Error', 'Amounts cannot be negative');
      return;
    }

    await onSave(elec, wat);
    onClose();
  };

  const total = (parseFloat(electricityValue) || 0) + (parseFloat(waterValue) || 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Monthly Utilities</Text>
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
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>{monthLabel}</Text>
                </View>

                <View style={styles.body}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Electricity</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="0.00"
                        placeholderTextColor="rgba(36, 0, 70, 0.4)"
                        value={electricityValue}
                        onChangeText={(text) => {
                          const filtered = text.replace(/[^0-9.]/g, '');
                          setElectricityValue(filtered);
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Water</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="0.00"
                        placeholderTextColor="rgba(36, 0, 70, 0.4)"
                        value={waterValue}
                        onChangeText={(text) => {
                          const filtered = text.replace(/[^0-9.]/g, '');
                          setWaterValue(filtered);
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Utilities</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && styles.cancelButtonPressed,
                      ]}
                      onPress={onClose}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.saveButton,
                        pressed && styles.saveButtonPressed,
                      ]}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  monthBadge: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  monthBadgeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  body: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#240046',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#240046',
  },
  totalCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A189A',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
