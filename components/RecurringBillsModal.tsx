import { ExpenseCategory } from '@/types/expense';
import { useRecurringBillsByUser } from '@/contexts/ExpensesContext';
import { X, Plus, Trash2, Edit, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface RecurringBillsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onAddBill: (
    name: string,
    amount: number,
    dueDay: number,
    category: ExpenseCategory
  ) => Promise<void>;
  onDeleteBill: (billId: string) => Promise<void>;
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

export default function RecurringBillsModal({
  visible,
  onClose,
  userId,
  onAddBill,
  onDeleteBill,
}: RecurringBillsModalProps) {
  const bills = useRecurringBillsByUser(userId);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [billName, setBillName] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [billDueDay, setBillDueDay] = useState<string>('');
  const [billCategory, setBillCategory] = useState<ExpenseCategory>('Monthly Bill');

  const handleAddBill = async () => {
    const amount = parseFloat(billAmount);
    const dueDay = parseInt(billDueDay, 10);

    if (!billName.trim()) {
      Alert.alert('Error', 'Please enter a bill name');
      return;
    }

    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!dueDay || dueDay < 1 || dueDay > 31) {
      Alert.alert('Error', 'Please enter a valid due day (1-31)');
      return;
    }

    await onAddBill(billName.trim(), amount, dueDay, billCategory);

    setBillName('');
    setBillAmount('');
    setBillDueDay('');
    setBillCategory('Monthly Bill');
    setShowAddForm(false);
  };

  const handleDeleteBill = (billId: string, billName: string) => {
    Alert.alert(
      'Delete Recurring Bill',
      `Are you sure you want to delete "${billName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteBill(billId);
          },
        },
      ]
    );
  };

  const totalMonthly = bills.reduce((sum, bill) => sum + (bill.isActive ? bill.amount : 0), 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Recurring Bills</Text>
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

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Monthly Bills</Text>
            <Text style={styles.summaryAmount}>${totalMonthly.toFixed(2)}</Text>
          </View>

          <View style={styles.body}>
            {!showAddForm ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.addButtonPressed,
                  ]}
                  onPress={() => setShowAddForm(true)}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Recurring Bill</Text>
                </Pressable>

                <FlatList
                  data={bills}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.billsList}
                  renderItem={({ item }) => (
                    <View style={styles.billItem}>
                      <View style={styles.billInfo}>
                        <Text style={styles.billName}>{item.name}</Text>
                        <Text style={styles.billCategory}>{item.category}</Text>
                        <View style={styles.billDetails}>
                          <Calendar size={14} color="#5A189A" />
                          <Text style={styles.billDueDay}>Due: Day {item.dueDay}</Text>
                        </View>
                      </View>
                      <View style={styles.billActions}>
                        <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconButtonPressed,
                          ]}
                          onPress={() => handleDeleteBill(item.id, item.name)}
                        >
                          <Trash2 size={18} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No recurring bills yet</Text>
                      <Text style={styles.emptySubtext}>
                        Add bills that you pay every month
                      </Text>
                    </View>
                  }
                />
              </>
            ) : (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={styles.addForm} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bill Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Electricity, Internet"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={billName}
                      onChangeText={setBillName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount ($)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.00"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={billAmount}
                      onChangeText={(text) => {
                        const filtered = text.replace(/[^0-9.]/g, '');
                        setBillAmount(filtered);
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Due Day (1-31)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="15"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={billDueDay}
                      onChangeText={(text) => {
                        const filtered = text.replace(/[^0-9]/g, '');
                        setBillDueDay(filtered);
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>

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
                            billCategory === category && styles.categoryChipSelected,
                            pressed && styles.categoryChipPressed,
                          ]}
                          onPress={() => setBillCategory(category)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              billCategory === category && styles.categoryChipTextSelected,
                            ]}
                          >
                            {category}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.formActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && styles.cancelButtonPressed,
                      ]}
                      onPress={() => {
                        setBillName('');
                        setBillAmount('');
                        setBillDueDay('');
                        setBillCategory('Monthly Bill');
                        setShowAddForm(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.submitButton,
                        pressed && styles.submitButtonPressed,
                      ]}
                      onPress={handleAddBill}
                    >
                      <Text style={styles.submitButtonText}>Add Bill</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </TouchableWithoutFeedback>
            )}
          </View>
        </View>
      </View>
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
    maxHeight: '85%',
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
  summaryCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5A189A',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  body: {
    flex: 1,
    padding: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  billsList: {
    gap: 12,
  },
  billItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    gap: 12,
  },
  billInfo: {
    flex: 1,
    gap: 4,
  },
  billName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  billCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9D4EDD',
    textTransform: 'uppercase' as const,
  },
  billDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billDueDay: {
    fontSize: 12,
    color: '#5A189A',
  },
  billActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#240046',
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#240046',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.6)',
    textAlign: 'center' as const,
  },
  addForm: {
    flex: 1,
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
  formActions: {
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
  submitButton: {
    flex: 1,
    backgroundColor: '#9D4EDD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
