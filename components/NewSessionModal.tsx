import { useAuth } from '@/contexts/AuthContext';
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

interface NewSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (casinoName: string, state: string, startAmount: number, isFreeBet: boolean, gameType?: GameType, addOnAmount?: number, addOnCategory?: 'ATM' | 'Borrow' | 'Cash Advance', borrowFrom?: string) => void;
}

export default function NewSessionModal({ visible, onClose, onSubmit }: NewSessionModalProps) {
  const { lastCasino } = useAuth();
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCasino, setSelectedCasino] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startAmount, setStartAmount] = useState<string>('');
  const [isFreeBet, setIsFreeBet] = useState<boolean>(false);
  const [showCasinoList, setShowCasinoList] = useState<boolean>(false);
  const [gameType, setGameType] = useState<GameType | undefined>(undefined);
  const [addOnAmount, setAddOnAmount] = useState<string>('');
  const [addOnCategory, setAddOnCategory] = useState<'ATM' | 'Borrow' | 'Cash Advance' | undefined>(undefined);
  const [borrowFrom, setBorrowFrom] = useState<string>('');

  useEffect(() => {
    if (visible && lastCasino) {
      setSelectedState(lastCasino.state);
      setSelectedCasino(lastCasino.casinoName);
    }
  }, [visible, lastCasino]);

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
    const baseInvestment = isFreeBet ? 0 : start;
    return baseInvestment + addOn;
  };

  const totalInvestment = calculateTotalInvestment();
  const displayAmount = parseFloat(startAmount) / 100 || 0;
  const displayAddOn = parseFloat(addOnAmount) / 100 || 0;

  const handleSubmit = () => {
    if (selectedState && selectedCasino && startAmount) {
      const start = parseFloat(startAmount) / 100;
      const addOn = parseFloat(addOnAmount) / 100 || 0;
      onSubmit(selectedCasino, selectedState, start, isFreeBet, gameType, addOn, addOnCategory, addOnCategory === 'Borrow' ? borrowFrom : undefined);
      setSearchQuery('');
      setStartAmount('');
      setIsFreeBet(false);
      setGameType(undefined);
      setAddOnAmount('');
      setAddOnCategory(undefined);
      setBorrowFrom('');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setStartAmount('');
    setIsFreeBet(false);
    setGameType(undefined);
    setAddOnAmount('');
    setAddOnCategory(undefined);
    setBorrowFrom('');
    onClose();
  };

  const filteredCasinos = selectedState
    ? CASINOS_BY_STATE[selectedState].filter((casino) =>
        casino.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const gameTypes: GameType[] = ['Baccarat', 'Blackjack', 'Roulette', 'Slots'];
  const addOnCategories: ('ATM' | 'Borrow' | 'Cash Advance')[] = ['ATM', 'Borrow', 'Cash Advance'];

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
            <Text style={styles.modalTitle}>Start New Session</Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              testID="close-modal-button"
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
                    testID={`state-${state}`}
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
                <View style={styles.selectedCasinoCard}>
                  <Text style={styles.selectedCasinoName}>{selectedCasino}</Text>
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

            {selectedState && selectedState !== '' && showCasinoList && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Casino</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search casinos..."
                  placeholderTextColor="rgba(36, 0, 70, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  testID="casino-search-input"
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
                      testID={`casino-${casino.name}`}
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
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Amount</Text>
                  <TextInput
                    style={styles.currencyInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(startAmount)}
                    onChangeText={(text) => handleCurrencyChange(text, setStartAmount)}
                    keyboardType="numeric"
                    testID="start-amount-input"
                  />
                  <Pressable
                    onPress={() => setIsFreeBet(!isFreeBet)}
                    style={({ pressed }) => [
                      styles.freeBetButton,
                      isFreeBet && styles.freeBetButtonActive,
                      pressed && styles.freeBetButtonPressed,
                    ]}
                    testID="free-bet-toggle"
                  >
                    <Text style={[
                      styles.freeBetButtonText,
                      isFreeBet && styles.freeBetButtonTextActive,
                    ]}>
                      {isFreeBet ? '✓ Casino Free Bet' : 'Casino Free Bet'}
                    </Text>
                  </Pressable>
                  {isFreeBet && (
                    <Text style={styles.freeBetNote}>
                      This amount won&apos;t count as your investment
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Add-On Amount (Optional)</Text>
                  <TextInput
                    style={styles.currencyInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(addOnAmount)}
                    onChangeText={(text) => handleCurrencyChange(text, setAddOnAmount)}
                    keyboardType="numeric"
                    testID="addon-amount-input"
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
                    <Text style={styles.resultsTitle}>Starting Investment</Text>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Start Amount:</Text>
                      <Text style={styles.resultValue}>${displayAmount.toFixed(2)}</Text>
                    </View>
                    {isFreeBet && (
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Free Bet Discount:</Text>
                        <Text style={[styles.resultValue, styles.winText]}>-${displayAmount.toFixed(2)}</Text>
                      </View>
                    )}
                    {addOnAmount && parseFloat(addOnAmount) > 0 && (
                      <>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Add-On:</Text>
                          <Text style={styles.resultValue}>${displayAddOn.toFixed(2)}</Text>
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
                      <Text style={styles.resultLabelHighlight}>Total Investment:</Text>
                      <Text style={[styles.resultValue, styles.resultValueInvestment]}>
                        ${totalInvestment.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedState || !selectedCasino || !startAmount}
              style={({ pressed }) => [
                styles.submitButton,
                (!selectedState || !selectedCasino || !startAmount) && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}
              testID="submit-session-button"
            >
              <Text style={styles.submitButtonText}>Start Session</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
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
    paddingBottom: 120,
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
    color: 'rgba(36, 0, 70, 0.6)',
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
    color: 'rgba(36, 0, 70, 0.7)',
  },
  resultValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#240046',
  },
  resultLabelHighlight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  resultValueHighlight: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  winText: {
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
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
  selectedCasinoCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9D4EDD',
  },
  selectedCasinoName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#240046',
    flex: 1,
  },
  changeCasinoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  freeBetButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    alignItems: 'center',
  },
  freeBetButtonActive: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  freeBetButtonPressed: {
    opacity: 0.7,
  },
  freeBetButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  freeBetButtonTextActive: {
    color: '#FFFFFF',
  },
  freeBetNote: {
    fontSize: 11,
    color: 'rgba(36, 0, 70, 0.6)',
    fontStyle: 'italic' as const,
    marginTop: 4,
    textAlign: 'center',
  },
  resultValueInvestment: {
    color: '#9D4EDD',
    fontWeight: '700' as const,
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
});
