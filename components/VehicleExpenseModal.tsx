import { Vehicle, VehicleExpense, VehicleExpenseCategory } from '@/types/expense';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Calendar, Camera as CameraIcon } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { generateText } from '@rork-ai/toolkit-sdk';

interface VehicleExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    vehicleId: string,
    category: VehicleExpenseCategory,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    mileage?: number,
    gallons?: number,
    pricePerGallon?: number,
    notes?: string
  ) => Promise<void>;
  vehicles: Vehicle[];
  editingExpense?: VehicleExpense | null;
}

const categories: VehicleExpenseCategory[] = [
  'Gas',
  'Auto Repair',
  'Maintenance',
  'Insurance',
  'Registration',
  'Car Wash',
  'Parking',
];

export default function VehicleExpenseModal({
  visible,
  onClose,
  onSubmit,
  vehicles,
  editingExpense,
}: VehicleExpenseModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleExpenseCategory>('Gas');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [mileage, setMileage] = useState<string>('');
  const [gallons, setGallons] = useState<string>('');
  const [pricePerGallon, setPricePerGallon] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (editingExpense) {
      setSelectedVehicleId(editingExpense.vehicleId);
      setSelectedCategory(editingExpense.category);
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setMerchant(editingExpense.merchant || '');
      setMileage(editingExpense.mileage?.toString() || '');
      setGallons(editingExpense.gallons?.toString() || '');
      setPricePerGallon(editingExpense.pricePerGallon?.toString() || '');
      setNotes(editingExpense.notes || '');
      setDate(new Date(editingExpense.date));
    } else {
      if (vehicles.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehicles[0].id);
      }
      setSelectedCategory('Gas');
      setAmount('');
      setDescription('');
      setMerchant('');
      setMileage('');
      setGallons('');
      setPricePerGallon('');
      setNotes('');
      setDate(new Date());
    }
  }, [editingExpense, visible, vehicles, selectedVehicleId]);

  const handleScanReceipt = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }

    if (!permission.granted) {
      await requestPermission();
      return;
    }

    setShowCamera(true);
  };

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
                - Current mileage (if visible on receipt)
                - Gallons of gas purchased (if this is a gas receipt)
                - Price per gallon (if this is a gas receipt)
                - Date of the receipt (if visible, in YYYY-MM-DD format)
                
                Respond in this exact format:
                AMOUNT: [amount]
                MERCHANT: [merchant name]
                MILEAGE: [mileage or "NOT_FOUND"]
                GALLONS: [gallons or "NOT_FOUND"]
                PRICE_PER_GALLON: [price or "NOT_FOUND"]
                DATE: [YYYY-MM-DD or "NOT_FOUND"]
                IS_GAS: [YES or NO]`,
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
      const mileageMatch = result.match(/MILEAGE:\s*([\d.]+|NOT_FOUND)/);
      const gallonsMatch = result.match(/GALLONS:\s*([\d.]+|NOT_FOUND)/);
      const pricePerGallonMatch = result.match(/PRICE_PER_GALLON:\s*([\d.]+|NOT_FOUND)/);
      const dateMatch = result.match(/DATE:\s*([\d-]+|NOT_FOUND)/);
      const isGasMatch = result.match(/IS_GAS:\s*(YES|NO)/);

      const scannedAmount = amountMatch ? amountMatch[1] : '';
      const scannedMerchant = merchantMatch ? merchantMatch[1].trim() : '';
      const scannedMileage = mileageMatch && mileageMatch[1] !== 'NOT_FOUND' ? mileageMatch[1] : '';
      const scannedGallons = gallonsMatch && gallonsMatch[1] !== 'NOT_FOUND' ? gallonsMatch[1] : '';
      const scannedPricePerGallon = pricePerGallonMatch && pricePerGallonMatch[1] !== 'NOT_FOUND' ? pricePerGallonMatch[1] : '';
      const isGas = isGasMatch && isGasMatch[1] === 'YES';

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

      setAmount(scannedAmount);
      setMerchant(scannedMerchant);
      setMileage(scannedMileage);
      setGallons(scannedGallons);
      setPricePerGallon(scannedPricePerGallon);
      setDate(receiptDate);
      
      if (isGas) {
        setSelectedCategory('Gas');
        setDescription('Gas fill-up');
      } else {
        setDescription('');
      }

      setShowCamera(false);
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedMileage = mileage ? parseFloat(mileage) : undefined;
    const parsedGallons = gallons ? parseFloat(gallons) : undefined;
    const parsedPricePerGallon = pricePerGallon ? parseFloat(pricePerGallon) : undefined;

    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    await onSubmit(
      selectedVehicleId,
      selectedCategory,
      parsedAmount,
      description.trim(),
      date,
      merchant.trim() || undefined,
      parsedMileage,
      parsedGallons,
      parsedPricePerGallon,
      notes.trim() || undefined
    );

    setSelectedVehicleId(vehicles.length > 0 ? vehicles[0].id : '');
    setSelectedCategory('Gas');
    setAmount('');
    setDescription('');
    setMerchant('');
    setMileage('');
    setGallons('');
    setPricePerGallon('');
    setNotes('');
    setDate(new Date());
    onClose();
  };

  if (showCamera) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={setCameraRef}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <Pressable
                onPress={() => setShowCamera(false)}
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
                <Text style={styles.title}>{editingExpense ? 'Edit Vehicle Expense' : 'Add Vehicle Expense'}</Text>
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
                {!editingExpense && (
                  <View style={styles.inputGroup}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.scanButton,
                        pressed && styles.scanButtonPressed,
                      ]}
                      onPress={handleScanReceipt}
                    >
                      <CameraIcon size={20} color="#FFFFFF" />
                      <Text style={styles.scanButtonText}>Scan Receipt</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vehicle</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.vehiclesContainer}
                  >
                    {vehicles.map((vehicle) => (
                      <Pressable
                        key={vehicle.id}
                        style={({ pressed }) => [
                          styles.vehicleChip,
                          selectedVehicleId === vehicle.id && styles.vehicleChipSelected,
                          pressed && styles.vehicleChipPressed,
                        ]}
                        onPress={() => setSelectedVehicleId(vehicle.id)}
                      >
                        <Text
                          style={[
                            styles.vehicleChipText,
                            selectedVehicleId === vehicle.id && styles.vehicleChipTextSelected,
                          ]}
                        >
                          {vehicle.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
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
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="What is this expense for?"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Merchant (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Store name"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={merchant}
                    onChangeText={setMerchant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Mileage (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Current odometer reading"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={mileage}
                    onChangeText={(text) => setMileage(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                  />
                </View>

                {selectedCategory === 'Gas' && (
                  <>
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabel}>Gallons (Optional)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="10.5"
                          placeholderTextColor="rgba(36, 0, 70, 0.4)"
                          value={gallons}
                          onChangeText={(text) => {
                            const filtered = text.replace(/[^0-9.]/g, '');
                            setGallons(filtered);
                          }}
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabel}>Price/Gallon (Optional)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="3.50"
                          placeholderTextColor="rgba(36, 0, 70, 0.4)"
                          value={pricePerGallon}
                          onChangeText={(text) => {
                            const filtered = text.replace(/[^0-9.]/g, '');
                            setPricePerGallon(filtered);
                          }}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.dateButton,
                      pressed && styles.dateButtonPressed,
                    ]}
                    onPress={() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      setDate(today);
                    }}
                  >
                    <Calendar size={20} color="#9D4EDD" style={styles.calendarIcon} />
                    <Text style={styles.dateText}>
                      {date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const prevDay = new Date(date);
                        prevDay.setDate(prevDay.getDate() - 1);
                        setDate(prevDay);
                      }}
                      style={({ pressed }) => [
                        styles.dateControlButton,
                        pressed && styles.dateControlButtonPressed,
                      ]}
                    >
                      <Text style={styles.dateControlText}>−</Text>
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const nextDay = new Date(date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setDate(nextDay);
                      }}
                      style={({ pressed }) => [
                        styles.dateControlButton,
                        pressed && styles.dateControlButtonPressed,
                      ]}
                    >
                      <Text style={styles.dateControlText}>+</Text>
                    </Pressable>
                  </Pressable>
                  <Text style={styles.dateHint}>Tap calendar to reset to today. Use + and − to adjust.</Text>
                </View>

                <View style={[styles.inputGroup, styles.lastInputGroup]}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="Additional notes"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!amount || !description.trim() || !selectedVehicleId || parseFloat(amount) <= 0}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!amount || !description.trim() || !selectedVehicleId || parseFloat(amount) <= 0) &&
                      styles.submitButtonDisabled,
                    pressed && styles.submitButtonPressed,
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
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
    paddingBottom: 500,
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
  vehiclesContainer: {
    gap: 8,
  },
  vehicleChip: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  vehicleChipSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  vehicleChipPressed: {
    opacity: 0.6,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  vehicleChipTextSelected: {
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
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonPressed: {
    opacity: 0.6,
  },
  calendarIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#240046',
    fontWeight: '600' as const,
    flex: 1,
  },
  dateControlButton: {
    width: 32,
    height: 32,
    backgroundColor: '#9D4EDD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  dateControlButtonPressed: {
    opacity: 0.7,
  },
  dateControlText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dateHint: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.5)',
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanButtonPressed: {
    opacity: 0.7,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
