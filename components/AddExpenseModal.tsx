import { MainExpenseCategory, ExpenseSubCategory, Expense } from '@/types/expense';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    mainCategory: MainExpenseCategory,
    subCategory: ExpenseSubCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    notes?: string
  ) => Promise<void>;
  editingExpense?: Expense | null;
}

const mainCategories: MainExpenseCategory[] = ['Standard Expense', 'Vacation Expense'];

const subCategories: ExpenseSubCategory[] = [
  'Auto Repair',
  'Beauty & Health',
  'Clothing',
  'Convenience Store',
  'Electronics',
  'Entertainment',
  'Fast Food',
  'Gas',
  'Grocery',
  'Household',
  'Lottery',
  'Monthly Bill',
  'Recreation',
  'Shoes',
  'Travel',
];

export default function AddExpenseModal({ visible, onClose, onSubmit, editingExpense }: AddExpenseModalProps) {
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainExpenseCategory>('Standard Expense');
  const [selectedSubCategory, setSelectedSubCategory] = useState<ExpenseSubCategory>('Grocery');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (editingExpense) {
      setSelectedMainCategory(editingExpense.mainCategory);
      setSelectedSubCategory(editingExpense.subCategory);
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setMerchant(editingExpense.merchant || '');
      setNotes(editingExpense.notes || '');
      setDate(new Date(editingExpense.date));
    } else {
      setSelectedMainCategory('Standard Expense');
      setSelectedSubCategory('Grocery');
      setAmount('');
      setDescription('');
      setMerchant('');
      setNotes('');
      setDate(new Date());
    }
  }, [editingExpense, visible]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    await onSubmit(
      selectedMainCategory,
      selectedSubCategory,
      parsedAmount,
      description.trim(),
      date,
      merchant.trim() || undefined,
      notes.trim() || undefined
    );

    setAmount('');
    setDescription('');
    setMerchant('');
    setNotes('');
    setDate(new Date());
    setSelectedMainCategory('Standard Expense');
    setSelectedSubCategory('Grocery');
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
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modal}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
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
                  <Text style={styles.inputLabel}>Main Category</Text>
                  <View style={styles.mainCategoriesContainer}>
                    {mainCategories.map((category) => (
                      <Pressable
                        key={category}
                        style={({ pressed }) => [
                          styles.mainCategoryButton,
                          selectedMainCategory === category && styles.mainCategoryButtonSelected,
                          pressed && styles.mainCategoryButtonPressed,
                        ]}
                        onPress={() => setSelectedMainCategory(category)}
                      >
                        <Text
                          style={[
                            styles.mainCategoryText,
                            selectedMainCategory === category && styles.mainCategoryTextSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sub Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                  >
                    {subCategories.map((category) => (
                      <Pressable
                        key={category}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          selectedSubCategory === category && styles.categoryChipSelected,
                          pressed && styles.categoryChipPressed,
                        ]}
                        onPress={() => setSelectedSubCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedSubCategory === category && styles.categoryChipTextSelected,
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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="Additional notes"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    testID="expense-notes-input"
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
                  <Text style={styles.submitButtonText}>{editingExpense ? 'Update Expense' : 'Add Expense'}</Text>
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
    padding: 24,
    paddingBottom: 240,
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
  mainCategoriesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mainCategoryButton: {
    flex: 1,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    alignItems: 'center',
  },
  mainCategoryButtonSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  mainCategoryButtonPressed: {
    opacity: 0.6,
  },
  mainCategoryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  mainCategoryTextSelected: {
    color: '#FFFFFF',
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
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
});
