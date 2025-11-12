import { MainExpenseCategory, ExpenseSubCategory } from '@/types/expense';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { generateText } from '@rork-ai/toolkit-sdk';

interface ReceiptScannerModalProps {
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
}

const subCategories: ExpenseSubCategory[] = [
  'Auto Repair',
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

export default function ReceiptScannerModal({
  visible,
  onClose,
  onSubmit,
}: ReceiptScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<{
    mainCategory: MainExpenseCategory;
    subCategory: ExpenseSubCategory;
    amount: string;
    description: string;
    merchant: string;
    date: Date;
    notes: string;
  } | null>(null);

  const handleTakePicture = async () => {
    if (!cameraRef || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.takePictureAsync({ base64: true });
      
      if (!photo || !photo.base64) {
        Alert.alert('Error', 'Failed to capture photo');
        return;
      }

      const base64Image = `data:image/jpeg;base64,${photo.base64}`;

      const result = await generateText({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following information from this receipt image:
                - Total amount (just the number, no currency symbol)
                - Merchant/Store name
                - Brief description of items or type of purchase
                - Date of the receipt (if visible, in YYYY-MM-DD format)
                - Determine if this is an auto repair receipt
                - If it's an auto repair, extract detailed notes about the services/items (as bullet points)
                
                Respond in this exact format:
                AMOUNT: [amount]
                MERCHANT: [merchant name]
                DESCRIPTION: [brief description]
                DATE: [YYYY-MM-DD or "NOT_FOUND" if no date is visible]
                IS_AUTO_REPAIR: [YES or NO]
                NOTES: [bullet points of services/items, separated by newlines with "• " prefix, or "NONE" if not auto repair or no details]`,
              },
              {
                type: 'image',
                image: base64Image,
              },
            ],
          },
        ],
      });

      const amountMatch = result.match(/AMOUNT:\s*([0-9.]+)/);
      const merchantMatch = result.match(/MERCHANT:\s*(.+?)(?=\n|$)/);
      const descriptionMatch = result.match(/DESCRIPTION:\s*(.+?)(?=\n|$)/);
      const dateMatch = result.match(/DATE:\s*([\d-]+|NOT_FOUND)/);
      const isAutoRepairMatch = result.match(/IS_AUTO_REPAIR:\s*(YES|NO)/);
      const notesMatch = result.match(/NOTES:\s*([\s\S]+?)(?=\n\n|$)/);

      const amount = amountMatch ? amountMatch[1] : '';
      const merchant = merchantMatch ? merchantMatch[1].trim() : '';
      let description = descriptionMatch ? descriptionMatch[1].trim() : '';
      const isAutoRepair = isAutoRepairMatch && isAutoRepairMatch[1] === 'YES';
      let notes = '';
      
      if (isAutoRepair && notesMatch && notesMatch[1].trim() !== 'NONE') {
        notes = notesMatch[1].trim();
        description = '';
      }
      
      let receiptDate = new Date();
      if (dateMatch && dateMatch[1] !== 'NOT_FOUND') {
        const dateParts = dateMatch[1].split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          const parsedDate = new Date(year, month, day);
          if (!isNaN(parsedDate.getTime())) {
            receiptDate = parsedDate;
          }
        }
      }

      setScannedData({
        mainCategory: 'Standard Expense',
        subCategory: isAutoRepair ? 'Auto Repair' : 'Grocery',
        amount,
        description,
        merchant,
        date: receiptDate,
        notes,
      });
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!scannedData) return;

    const parsedAmount = parseFloat(scannedData.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!scannedData.description.trim() && !scannedData.notes.trim()) {
      Alert.alert('Error', 'Please enter a description or notes');
      return;
    }

    await onSubmit(
      scannedData.mainCategory,
      scannedData.subCategory,
      parsedAmount,
      scannedData.description.trim(),
      scannedData.date,
      scannedData.merchant.trim() || undefined,
      scannedData.notes.trim() || undefined
    );

    setScannedData(null);
    onClose();
  };

  const handleClose = () => {
    setScannedData(null);
    onClose();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need your permission to use the camera to scan receipts
            </Text>
            <View style={styles.permissionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.permissionButton,
                  pressed && styles.permissionButtonPressed,
                ]}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.permissionButtonSecondary,
                  pressed && styles.permissionButtonPressed,
                ]}
                onPress={handleClose}
              >
                <Text style={styles.permissionButtonSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (scannedData) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.header}>
              <Text style={styles.title}>Review Expense</Text>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <X size={24} color="#240046" />
              </Pressable>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Main Category</Text>
                <View style={styles.mainCategoriesContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.mainCategoryButton,
                      scannedData.mainCategory === 'Standard Expense' && styles.mainCategoryButtonSelected,
                      pressed && styles.mainCategoryButtonPressed,
                    ]}
                    onPress={() =>
                      setScannedData({ ...scannedData, mainCategory: 'Standard Expense' })
                    }
                  >
                    <Text
                      style={[
                        styles.mainCategoryText,
                        scannedData.mainCategory === 'Standard Expense' && styles.mainCategoryTextSelected,
                      ]}
                    >
                      Standard Expense
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.mainCategoryButton,
                      scannedData.mainCategory === 'Vacation Expense' && styles.mainCategoryButtonSelected,
                      pressed && styles.mainCategoryButtonPressed,
                    ]}
                    onPress={() =>
                      setScannedData({ ...scannedData, mainCategory: 'Vacation Expense' })
                    }
                  >
                    <Text
                      style={[
                        styles.mainCategoryText,
                        scannedData.mainCategory === 'Vacation Expense' && styles.mainCategoryTextSelected,
                      ]}
                    >
                      Vacation Expense
                    </Text>
                  </Pressable>
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
                        scannedData.subCategory === category && styles.categoryChipSelected,
                        pressed && styles.categoryChipPressed,
                      ]}
                      onPress={() =>
                        setScannedData({ ...scannedData, subCategory: category })
                      }
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          scannedData.subCategory === category && styles.categoryChipTextSelected,
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
                  value={scannedData.amount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    setScannedData({ ...scannedData, amount: filtered });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={scannedData.description}
                  onChangeText={(text) =>
                    setScannedData({ ...scannedData, description: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Merchant</Text>
                <TextInput
                  style={styles.textInput}
                  value={scannedData.merchant}
                  onChangeText={(text) =>
                    setScannedData({ ...scannedData, merchant: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={scannedData.notes}
                  onChangeText={(text) =>
                    setScannedData({ ...scannedData, notes: text })
                  }
                  multiline
                  numberOfLines={4}
                  placeholder="Additional notes (e.g., • Service 1\n• Service 2)"
                  placeholderTextColor="rgba(36, 0, 70, 0.4)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => {
                    const dateStr = scannedData.date.toISOString().split('T')[0];
                    Alert.prompt(
                      'Edit Date',
                      'Enter date in YYYY-MM-DD format',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'OK',
                          onPress: (text?: string) => {
                            if (text) {
                              const newDate = new Date(text);
                              if (!isNaN(newDate.getTime())) {
                                setScannedData({ ...scannedData, date: newDate });
                              } else {
                                Alert.alert('Invalid Date', 'Please enter a valid date');
                              }
                            }
                          },
                        },
                      ],
                      'plain-text',
                      dateStr
                    );
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {scannedData.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={setCameraRef}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButtonCamera,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <X size={32} color="#FFFFFF" />
            </Pressable>

            <View style={styles.cameraInstructions}>
              <Text style={styles.instructionText}>Position receipt in frame</Text>
            </View>

            <View style={styles.receiptFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
            </View>

            <View style={styles.cameraControls}>
              <Pressable
                onPress={handleTakePicture}
                disabled={isProcessing}
                style={({ pressed }) => [
                  styles.captureButton,
                  pressed && styles.captureButtonPressed,
                  isProcessing && styles.captureButtonDisabled,
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <CameraIcon size={32} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: Platform.OS === 'web' ? '85%' : Dimensions.get('window').height * 0.85,
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
    maxHeight: Platform.OS === 'web' ? '500px' : Dimensions.get('window').height * 0.5,
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
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButtonCamera: {
    position: 'absolute' as const,
    top: 50,
    right: 20,
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraInstructions: {
    position: 'absolute' as const,
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    position: 'absolute' as const,
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9D4EDD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonPressed: {
    opacity: 0.7,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#240046',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  permissionText: {
    fontSize: 16,
    color: '#5A189A',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  permissionButtons: {
    width: '100%',
    gap: 12,
  },
  permissionButton: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  permissionButtonSecondary: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  permissionButtonPressed: {
    opacity: 0.7,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  permissionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9D4EDD',
    letterSpacing: 1,
  },
  dateButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#240046',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top' as const,
    paddingTop: 14,
  },
  receiptFrame: {
    position: 'absolute' as const,
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '25%',
    borderWidth: 2,
    borderColor: '#9D4EDD',
    borderRadius: 12,
  },
  frameCorner: {
    position: 'absolute' as const,
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 4,
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  frameCornerTopRight: {
    left: undefined,
    right: -2,
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 12,
  },
  frameCornerBottomLeft: {
    top: undefined,
    bottom: -2,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 12,
  },
  frameCornerBottomRight: {
    top: undefined,
    bottom: -2,
    left: undefined,
    right: -2,
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 12,
  },
});
