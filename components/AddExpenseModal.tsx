import { ExpenseCategory } from '@/types/expense';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    category: ExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string
  ) => Promise<void>;
}

const categories: ExpenseCategory[] = [
  'Grocery',
  'Household',
  'Fast Food',
  'Convenience Store',
  'Clothing',
  'Travel',
  'Monthly Bill',
  'Entertainment',
  'Auto Repair',
];

export default function AddExpenseModal({ visible, onClose, onSubmit }: AddExpenseModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Grocery');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    await onSubmit(
      selectedCategory,
      parsedAmount,
      description.trim(),
      date,
      merchant.trim() || undefined
    );

    setAmount('');
    setDescription('');
    setMerchant('');
    setDate(new Date());
    setSelectedCategory('Grocery');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Add Expense</Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                  testID="close-add-expense-button"
                >
                  <X size={24} color="#240046" />
                </Pressable>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                  >
                    {categories.map((category) => (
                      <Pressable
                        key={category}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          selectedCategory === category && styles.categoryChipSelected,
                          pressed && styles.categoryChipPressed,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedCategory === category && styles.categoryChipTextSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount ($)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={amount}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9.]/g, '');
                      const parts = filtered.split('.');
                      if (parts.length > 2) {
                        setAmount(parts[0] + '.' + parts.slice(1).join(''));
                      } else {
                        setAmount(filtered);
                      }
                    }}
                    keyboardType="decimal-pad"
                    testID="expense-amount-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="What did you buy?"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={description}
                    onChangeText={setDescription}
                    testID="expense-description-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Merchant (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Store name"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={merchant}
                    onChangeText={setMerchant}
                    testID="expense-merchant-input"
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!amount || !description.trim() || parseFloat(amount) <= 0}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!amount || !description.trim() || parseFloat(amount) <= 0) &&
                      styles.submitButtonDisabled,
                    pressed && styles.submitButtonPressed,
                  ]}
                  testID="submit-expense-button"
                >
                  <Text style={styles.submitButtonText}>Add Expense</Text>
                </Pressable>
              </View>
            </View>
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
    maxHeight: '90%',
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
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 8,
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
  categoriesContainer: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  categoryChipSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  categoryChipPressed: {
    opacity: 0.6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
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
