import { CASINOS_BY_STATE, US_STATES } from '@/constants/casinos';
import { GameType } from '@/types/user';
import { Clover, Spade, Circle, Grid3x3, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface EditSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    casinoName: string;
    state: string;
    gameType?: GameType;
    startAmount: number;
    addOnAmount: number;
    addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
    borrowFrom?: string;
    startDate: Date;
    endDate?: Date;
  }) => void;
  initialData: {
    casinoName: string;
    state: string;
    gameType?: GameType;
    startAmount: number;
    addOnAmount: number;
    addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance';
    borrowFrom?: string;
    startDate: Date;
    endDate?: Date;
  };
  isCompleted?: boolean;
}

export default function EditSessionModal({ visible, onClose, onSubmit, initialData, isCompleted = false }: EditSessionModalProps) {
  const [selectedState, setSelectedState] = useState<string>(initialData.state);
  const [selectedCasino, setSelectedCasino] = useState<string>(initialData.casinoName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCasinoList, setShowCasinoList] = useState<boolean>(false);
  const [startAmount, setStartAmount] = useState<string>('');
  const [addOnAmount, setAddOnAmount] = useState<string>('');
  const [addOnCategory, setAddOnCategory] = useState<'ATM' | 'Borrow' | 'Cash Advance' | undefined>(undefined);
  const [borrowFrom, setBorrowFrom] = useState<string>('');
  const [startDateString, setStartDateString] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [endDateString, setEndDateString] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('AM');
  const [gameType, setGameType] = useState<GameType | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setSelectedState(initialData.state);
      setSelectedCasino(initialData.casinoName);
      setGameType(initialData.gameType);
      setStartAmount((initialData.startAmount * 100).toString());
      setAddOnAmount((initialData.addOnAmount * 100).toString());
      setAddOnCategory(initialData.addOnCategory);
      setBorrowFrom(initialData.borrowFrom || '');
      setSearchQuery('');
      setShowCasinoList(false);
      
      const startDate = new Date(initialData.startDate);
      const startYear = startDate.getFullYear();
      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const startDay = String(startDate.getDate()).padStart(2, '0');
      setStartDateString(`${startMonth}/${startDay}/${startYear}`);
      
      let startHours24 = startDate.getHours();
      const startMins = startDate.getMinutes();
      const startIsAM = startHours24 < 12;
      let startHours12 = startHours24 % 12;
      if (startHours12 === 0) startHours12 = 12;
      setStartTime(`${String(startHours12).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`);
      setStartAmPm(startIsAM ? 'AM' : 'PM');
      
      if (initialData.endDate) {
        const endDate = new Date(initialData.endDate);
        const endYear = endDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(endDate.getDate()).padStart(2, '0');
        setEndDateString(`${endMonth}/${endDay}/${endYear}`);
        
        let endHours24 = endDate.getHours();
        const endMins = endDate.getMinutes();
        const endIsAM = endHours24 < 12;
        let endHours12 = endHours24 % 12;
        if (endHours12 === 0) endHours12 = 12;
        setEndTime(`${String(endHours12).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
        setEndAmPm(endIsAM ? 'AM' : 'PM');
      } else {
        setEndDateString('');
        setEndTime('');
        setEndAmPm('AM');
      }
    }
  }, [visible, initialData]);

  const handleCurrencyChange = (text: string, setter: (value: string) => void) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setter(numbers);
  };

  const displayCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return `${amount.toFixed(2)}`;
  };

  const calculateTotalInvestment = () => {
    const start = parseFloat(startAmount) / 100 || 0;
    const addOn = parseFloat(addOnAmount) / 100 || 0;
    return start + addOn;
  };

  const totalInvestment = calculateTotalInvestment();

  const handleSubmit = () => {
    const isValidStart = selectedState && selectedCasino && startAmount && startDateString && startTime;
    const isValidEnd = !isCompleted || (endDateString && endTime);
    
    if (isValidStart && isValidEnd) {
      const start = parseFloat(startAmount) / 100;
      const addOn = parseFloat(addOnAmount) / 100 || 0;
      
      const [startMonth, startDay, startYear] = startDateString.split('/').map(Number);
      const [startHoursStr, startMinutesStr] = startTime.split(':');
      let startHours24 = parseInt(startHoursStr);
      if (startAmPm === 'PM' && startHours24 !== 12) startHours24 += 12;
      if (startAmPm === 'AM' && startHours24 === 12) startHours24 = 0;
      const finalStartDate = new Date(startYear, startMonth - 1, startDay, startHours24, parseInt(startMinutesStr));
      
      let finalEndDate: Date | undefined = undefined;
      if (isCompleted && endDateString && endTime) {
        const [endMonth, endDay, endYear] = endDateString.split('/').map(Number);
        const [endHoursStr, endMinutesStr] = endTime.split(':');
        let endHours24 = parseInt(endHoursStr);
        if (endAmPm === 'PM' && endHours24 !== 12) endHours24 += 12;
        if (endAmPm === 'AM' && endHours24 === 12) endHours24 = 0;
        finalEndDate = new Date(endYear, endMonth - 1, endDay, endHours24, parseInt(endMinutesStr));
      }
      
      onSubmit({
        casinoName: selectedCasino,
        state: selectedState,
        gameType,
        startAmount: start,
        addOnAmount: addOn,
        addOnCategory,
        borrowFrom: addOnCategory === 'Borrow' ? borrowFrom : undefined,
        startDate: finalStartDate,
        endDate: finalEndDate,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setBorrowFrom('');
    setAddOnCategory(undefined);
    onClose();
  };

  const filteredCasinos = selectedState
    ? CASINOS_BY_STATE[selectedState].filter((casino) =>
        casino.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const addOnCategories: ('ATM' | 'Borrow' | 'Cash Advance')[] = ['ATM', 'Borrow', 'Cash Advance'];
  const gameTypes: GameType[] = ['Baccarat', 'Blackjack', 'Roulette', 'Slots'];

  const getGameIcon = (game: GameType) => {
    switch (game) {
      case 'Baccarat':
        return <Clover size={20} color="#9D4EDD" />;
      case 'Blackjack':
        return <Spade size={20} color="#9D4EDD" />;
      case 'Roulette':
        return <Circle size={20} color="#9D4EDD" />;
      case 'Slots':
        return <Grid3x3 size={20} color="#9D4EDD" />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Session</Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              testID="close-edit-modal-button"
            >
              <X size={24} color="#240046" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.label}>Select State</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.stateScroll}
                contentContainerStyle={styles.stateScrollContent}
              >
                {US_STATES.map((state) => (
                  <Pressable
                    key={state}
                    onPress={() => {
                      setSelectedState(state);
                      setSelectedCasino('');
                      setSearchQuery('');
                      setShowCasinoList(true);
                    }}
                    style={({ pressed }) => [
                      styles.stateChip,
                      selectedState === state && styles.stateChipSelected,
                      pressed && styles.stateChipPressed,
                    ]}
                    testID={`edit-state-${state}`}
                  >
                    <Text
                      style={[
                        styles.stateChipText,
                        selectedState === state && styles.stateChipTextSelected,
                      ]}
                    >
                      {state}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {selectedCasino && !showCasinoList && (
              <View style={styles.section}>
                <Text style={styles.label}>Selected Casino</Text>
                <View style={styles.selectedCasinoDisplay}>
                  <Text style={styles.selectedCasinoText}>{selectedCasino}</Text>
                  <Pressable
                    onPress={() => setShowCasinoList(true)}
                    style={({ pressed }) => [
                      styles.changeCasinoButton,
                      pressed && styles.changeCasinoButtonPressed,
                    ]}
                    testID="change-casino-button"
                  >
                    <Text style={styles.changeCasinoButtonText}>Change</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {selectedState && showCasinoList && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Casino</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search casinos..."
                  placeholderTextColor="rgba(36, 0, 70, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  testID="edit-casino-search-input"
                />
                <View style={styles.casinoList}>
                  {filteredCasinos.map((casino) => (
                    <Pressable
                      key={casino.name}
                      onPress={() => {
                        setSelectedCasino(casino.name);
                        setShowCasinoList(false);
                      }}
                      style={({ pressed }) => [
                        styles.casinoItem,
                        selectedCasino === casino.name && styles.casinoItemSelected,
                        pressed && styles.casinoItemPressed,
                      ]}
                      testID={`edit-casino-${casino.name}`}
                    >
                      <View style={styles.casinoInfo}>
                        <Text
                          style={[
                            styles.casinoName,
                            selectedCasino === casino.name && styles.casinoNameSelected,
                          ]}
                        >
                          {casino.name}
                        </Text>
                        <Text
                          style={[
                            styles.casinoCity,
                            selectedCasino === casino.name && styles.casinoCitySelected,
                          ]}
                        >
                          {casino.city}
                        </Text>
                      </View>
                      {selectedCasino === casino.name && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {selectedCasino && (
              <View style={styles.section}>
                <Text style={styles.label}>Session Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Game Type</Text>
                  <View style={styles.gameTypeContainer}>
                    {gameTypes.map((game) => (
                      <Pressable
                        key={game}
                        onPress={() => setGameType(game)}
                        style={({ pressed }) => [
                          styles.gameTypeChip,
                          gameType === game && styles.gameTypeChipSelected,
                          pressed && styles.gameTypeChipPressed,
                        ]}
                        testID={`game-type-${game}`}
                      >
                        {getGameIcon(game)}
                        <Text
                          style={[
                            styles.gameTypeChipText,
                            gameType === game && styles.gameTypeChipTextSelected,
                          ]}
                        >
                          {game}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                
                <Text style={styles.sectionHeader}>Start Time</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="mm/dd/yyyy"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={startDateString}
                    onChangeText={(text) => {
                      const digits = text.replace(/[^0-9]/g, '');
                      
                      if (digits.length === 0) {
                        setStartDateString('');
                        return;
                      }
                      
                      if (digits.length <= 8) {
                        if (digits.length <= 2) {
                          setStartDateString(digits);
                        } else if (digits.length <= 4) {
                          const month = digits.slice(0, 2);
                          const day = digits.slice(2);
                          setStartDateString(`${month}/${day}`);
                        } else {
                          const month = digits.slice(0, 2);
                          const day = digits.slice(2, 4);
                          const year = digits.slice(4);
                          setStartDateString(`${month}/${day}/${year}`);
                        }
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                    testID="edit-start-date-input"
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Time</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="HH:MM"
                      placeholderTextColor="rgba(36, 0, 70, 0.4)"
                      value={startTime}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, '');
                        
                        if (digits.length === 0) {
                          setStartTime('');
                          return;
                        }
                        
                        if (digits.length <= 4) {
                          if (digits.length <= 2) {
                            setStartTime(digits);
                          } else {
                            const hours = parseInt(digits.slice(0, -2));
                            const mins = digits.slice(-2);
                            setStartTime(`${hours}:${mins}`);
                          }
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      testID="edit-start-time-input"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Period</Text>
                    <View style={styles.amPmContainer}>
                      <Pressable
                        onPress={() => setStartAmPm('AM')}
                        style={({ pressed }) => [
                          styles.amPmButton,
                          startAmPm === 'AM' && styles.amPmButtonSelected,
                          pressed && styles.amPmButtonPressed,
                        ]}
                        testID="edit-start-am-button"
                      >
                        <Text
                          style={[
                            styles.amPmText,
                            startAmPm === 'AM' && styles.amPmTextSelected,
                          ]}
                        >
                          AM
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setStartAmPm('PM')}
                        style={({ pressed }) => [
                          styles.amPmButton,
                          startAmPm === 'PM' && styles.amPmButtonSelected,
                          pressed && styles.amPmButtonPressed,
                        ]}
                        testID="edit-start-pm-button"
                      >
                        <Text
                          style={[
                            styles.amPmText,
                            startAmPm === 'PM' && styles.amPmTextSelected,
                          ]}
                        >
                          PM
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {isCompleted && (
                  <>
                    <Text style={styles.sectionHeader}>End Time</Text>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Date</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="mm/dd/yyyy"
                        placeholderTextColor="rgba(36, 0, 70, 0.4)"
                        value={endDateString}
                        onChangeText={(text) => {
                          const digits = text.replace(/[^0-9]/g, '');
                          
                          if (digits.length === 0) {
                            setEndDateString('');
                            return;
                          }
                          
                          if (digits.length <= 8) {
                            if (digits.length <= 2) {
                              setEndDateString(digits);
                            } else if (digits.length <= 4) {
                              const month = digits.slice(0, 2);
                              const day = digits.slice(2);
                              setEndDateString(`${month}/${day}`);
                            } else {
                              const month = digits.slice(0, 2);
                              const day = digits.slice(2, 4);
                              const year = digits.slice(4);
                              setEndDateString(`${month}/${day}/${year}`);
                            }
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={10}
                        testID="edit-end-date-input"
                      />
                    </View>

                    <View style={styles.timeRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Time</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="HH:MM"
                          placeholderTextColor="rgba(36, 0, 70, 0.4)"
                          value={endTime}
                          onChangeText={(text) => {
                            const digits = text.replace(/[^0-9]/g, '');
                            
                            if (digits.length === 0) {
                              setEndTime('');
                              return;
                            }
                            
                            if (digits.length <= 4) {
                              if (digits.length <= 2) {
                                setEndTime(digits);
                              } else {
                                const hours = parseInt(digits.slice(0, -2));
                                const mins = digits.slice(-2);
                                setEndTime(`${hours}:${mins}`);
                              }
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={5}
                          testID="edit-end-time-input"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Period</Text>
                        <View style={styles.amPmContainer}>
                          <Pressable
                            onPress={() => setEndAmPm('AM')}
                            style={({ pressed }) => [
                              styles.amPmButton,
                              endAmPm === 'AM' && styles.amPmButtonSelected,
                              pressed && styles.amPmButtonPressed,
                            ]}
                            testID="edit-end-am-button"
                          >
                            <Text
                              style={[
                                styles.amPmText,
                                endAmPm === 'AM' && styles.amPmTextSelected,
                              ]}
                            >
                              AM
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setEndAmPm('PM')}
                            style={({ pressed }) => [
                              styles.amPmButton,
                              endAmPm === 'PM' && styles.amPmButtonSelected,
                              pressed && styles.amPmButtonPressed,
                            ]}
                            testID="edit-end-pm-button"
                          >
                            <Text
                              style={[
                                styles.amPmText,
                                endAmPm === 'PM' && styles.amPmTextSelected,
                              ]}
                            >
                              PM
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Amount</Text>
                  <TextInput
                    style={styles.currencyInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(startAmount)}
                    onChangeText={(text) => handleCurrencyChange(text, setStartAmount)}
                    keyboardType="numeric"
                    testID="edit-start-amount-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Add-On Amount</Text>
                  <TextInput
                    style={styles.currencyInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(addOnAmount)}
                    onChangeText={(text) => handleCurrencyChange(text, setAddOnAmount)}
                    keyboardType="numeric"
                    testID="edit-addon-amount-input"
                  />
                </View>

                {addOnAmount && parseFloat(addOnAmount) > 0 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Add-On Category</Text>
                      <View style={styles.categoryContainer}>
                        {addOnCategories.map((category) => (
                          <Pressable
                            key={category}
                            onPress={() => setAddOnCategory(category)}
                            style={({ pressed }) => [
                              styles.categoryChip,
                              addOnCategory === category && styles.categoryChipSelected,
                              pressed && styles.categoryChipPressed,
                            ]}
                            testID={`addon-category-${category}`}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                addOnCategory === category && styles.categoryChipTextSelected,
                              ]}
                            >
                              {category}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {addOnCategory === 'Borrow' && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Borrow From</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter name..."
                          placeholderTextColor="rgba(36, 0, 70, 0.4)"
                          value={borrowFrom}
                          onChangeText={setBorrowFrom}
                          testID="borrow-from-input"
                        />
                      </View>
                    )}
                  </>
                )}

                {startAmount && (
                  <View style={styles.resultsCard}>
                    <Text style={styles.resultsTitle}>Total Investment</Text>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Start Amount:</Text>
                      <Text style={styles.resultValue}>${(parseFloat(startAmount) / 100).toFixed(2)}</Text>
                    </View>
                    {addOnAmount && parseFloat(addOnAmount) > 0 && (
                      <>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Add-On:</Text>
                          <Text style={styles.resultValue}>${(parseFloat(addOnAmount) / 100).toFixed(2)}</Text>
                        </View>
                        {addOnCategory && (
                          <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Category:</Text>
                            <Text style={styles.resultValue}>{addOnCategory}</Text>
                          </View>
                        )}
                        {addOnCategory === 'Borrow' && borrowFrom && (
                          <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>From:</Text>
                            <Text style={styles.resultValue}>{borrowFrom}</Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[styles.resultRow, styles.resultRowHighlight]}>
                      <Text style={styles.resultLabelHighlight}>Total:</Text>
                      <Text style={styles.resultValueHighlight}>${totalInvestment.toFixed(2)}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedState || !selectedCasino || !startAmount || !startDateString || !startTime || (isCompleted && (!endDateString || !endTime))}
              style={({ pressed }) => [
                styles.submitButton,
                (!selectedState || !selectedCasino || !startAmount || !startDateString || !startTime || (isCompleted && (!endDateString || !endTime))) && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}
              testID="submit-edit-session-button"
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 600,
    height: '90%',
    maxHeight: 800,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
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
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  stateScroll: {
    flexGrow: 0,
  },
  stateScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  stateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  stateChipSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  stateChipPressed: {
    opacity: 0.7,
  },
  stateChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  stateChipTextSelected: {
    color: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  casinoList: {
    gap: 8,
  },
  casinoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.1)',
  },
  casinoItemSelected: {
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
    borderColor: '#9D4EDD',
  },
  casinoItemPressed: {
    opacity: 0.7,
  },
  casinoInfo: {
    flex: 1,
    gap: 4,
  },
  casinoName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  casinoNameSelected: {
    color: '#9D4EDD',
  },
  casinoCity: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.8)',
  },
  casinoCitySelected: {
    color: 'rgba(157, 78, 221, 0.8)',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9D4EDD',
  },
  modalFooter: {
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
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
  },
  currencyInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  textInput: {
    backgroundColor: 'rgba(157, 78, 221, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#240046',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  categoryChipSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  categoryChipPressed: {
    opacity: 0.7,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.08)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.2)',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#240046',
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultRowHighlight: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(157, 78, 221, 0.2)',
  },
  resultLabel: {
    fontSize: 12,
    color: '#240046',
  },
  resultValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
  },
  resultLabelHighlight: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#240046',
  },
  resultValueHighlight: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  timeInput: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9D4EDD',
    marginTop: 8,
  },
  amPmContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  amPmButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    minWidth: 50,
    alignItems: 'center',
  },
  amPmButtonSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  amPmButtonPressed: {
    opacity: 0.7,
  },
  amPmText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  amPmTextSelected: {
    color: '#FFFFFF',
  },
  gameTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  gameTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    gap: 6,
  },
  gameTypeChipSelected: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  gameTypeChipPressed: {
    opacity: 0.7,
  },
  gameTypeChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  gameTypeChipTextSelected: {
    color: '#FFFFFF',
  },
  selectedCasinoDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#9D4EDD',
  },
  selectedCasinoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
    flex: 1,
  },
  changeCasinoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#9D4EDD',
  },
  changeCasinoButtonPressed: {
    opacity: 0.7,
  },
  changeCasinoButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
