import { useAuth } from '@/contexts/AuthContext';
import { useSportsBets } from '@/contexts/SportsBetsContext';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface PlaceBetModalProps {
  visible: boolean;
  onClose: () => void;
  gameData: {
    homeTeam: string;
    awayTeam: string;
    homeSpread?: number;
    awaySpread?: number;
    homeSpreadOdds?: number;
    awaySpreadOdds?: number;
    homeMoneyline?: number;
    awayMoneyline?: number;
    overPoint?: number;
    overPrice?: number;
    underPoint?: number;
    underPrice?: number;
  };
  sport: string;
}

type BetType = 'spread' | 'moneyline' | 'over/under' | 'parlay';
type SelectedTeam = 'home' | 'away' | null;
type OverUnder = 'over' | 'under' | null;

export default function PlaceBetModal({ visible, onClose, gameData, sport }: PlaceBetModalProps) {
  const { currentUser } = useAuth();
  const { addSportsBet } = useSportsBets();
  
  const [betType, setBetType] = useState<BetType>('moneyline');
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam>(null);
  const [overUnder, setOverUnder] = useState<OverUnder>(null);
  const [betAmount, setBetAmount] = useState<string>('');

  const handleCurrencyChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    setBetAmount(numbers);
  };

  const displayCurrency = (value: string): string => {
    if (!value) return '';
    const amount = parseFloat(value) / 100;
    return `${amount.toFixed(2)}`;
  };

  const calculatePayout = (): number => {
    if (!betAmount) return 0;
    const amount = parseFloat(betAmount) / 100;
    
    let odds = 0;
    
    if (betType === 'moneyline') {
      if (selectedTeam === 'home' && gameData.homeMoneyline) {
        odds = gameData.homeMoneyline;
      } else if (selectedTeam === 'away' && gameData.awayMoneyline) {
        odds = gameData.awayMoneyline;
      }
    } else if (betType === 'spread') {
      if (selectedTeam === 'home' && gameData.homeSpreadOdds) {
        odds = gameData.homeSpreadOdds;
      } else if (selectedTeam === 'away' && gameData.awaySpreadOdds) {
        odds = gameData.awaySpreadOdds;
      }
    } else if (betType === 'over/under') {
      if (overUnder === 'over' && gameData.overPrice) {
        odds = gameData.overPrice;
      } else if (overUnder === 'under' && gameData.underPrice) {
        odds = gameData.underPrice;
      }
    }

    if (odds === 0) return 0;

    if (odds > 0) {
      return amount * (odds / 100);
    } else {
      return amount * (100 / Math.abs(odds));
    }
  };



  const handlePlaceBet = async () => {
    if (!currentUser || !betAmount) return;
    
    let betDescription = '';
    let teams = `${gameData.awayTeam} @ ${gameData.homeTeam}`;
    let odds = 0;
    
    if (betType === 'moneyline') {
      const team = selectedTeam === 'home' ? gameData.homeTeam : gameData.awayTeam;
      odds = selectedTeam === 'home' ? (gameData.homeMoneyline || 0) : (gameData.awayMoneyline || 0);
      betDescription = `Moneyline: ${team} (${odds && odds > 0 ? '+' : ''}${odds})`;
    } else if (betType === 'spread') {
      const team = selectedTeam === 'home' ? gameData.homeTeam : gameData.awayTeam;
      const spread = selectedTeam === 'home' ? gameData.homeSpread : gameData.awaySpread;
      odds = selectedTeam === 'home' ? (gameData.homeSpreadOdds || 0) : (gameData.awaySpreadOdds || 0);
      betDescription = `Spread: ${team} ${spread && spread > 0 ? '+' : ''}${spread} (${odds && odds > 0 ? '+' : ''}${odds})`;
    } else if (betType === 'over/under') {
      const point = overUnder === 'over' ? gameData.overPoint : gameData.underPoint;
      odds = overUnder === 'over' ? (gameData.overPrice || 0) : (gameData.underPrice || 0);
      betDescription = `${overUnder === 'over' ? 'Over' : 'Under'} ${point} (${odds && odds > 0 ? '+' : ''}${odds})`;
    } else if (betType === 'parlay') {
      betDescription = 'Parlay Bet';
    }

    const amount = parseFloat(betAmount) / 100;
    const profit = calculatePayout();
    const totalPayout = amount + profit;

    await addSportsBet(
      currentUser.id,
      sport,
      teams,
      betDescription,
      amount,
      null as boolean | null,
      new Date().toISOString(),
      odds,
      totalPayout
    );

    setBetType('moneyline');
    setSelectedTeam(null);
    setOverUnder(null);
    setBetAmount('');
    onClose();
  };

  const isValid = () => {
    if (!betAmount) return false;
    
    if (betType === 'moneyline' || betType === 'spread') {
      return selectedTeam !== null;
    } else if (betType === 'over/under') {
      return overUnder !== null;
    } else if (betType === 'parlay') {
      return true;
    }
    
    return false;
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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Place Bet</Text>
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

              <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator={false}>
                <View style={styles.matchupInfo}>
                  <Text style={styles.matchupText}>{gameData.awayTeam}</Text>
                  <Text style={styles.vsText}>@</Text>
                  <Text style={styles.matchupText}>{gameData.homeTeam}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bet Type</Text>
                  <View style={styles.betTypeContainer}>
                    <Pressable
                      onPress={() => {
                        setBetType('moneyline');
                        setOverUnder(null);
                      }}
                      style={({ pressed }) => [
                        styles.betTypeButton,
                        betType === 'moneyline' && styles.betTypeButtonActive,
                        pressed && styles.betTypeButtonPressed,
                      ]}
                    >
                      <Text style={[styles.betTypeText, betType === 'moneyline' && styles.betTypeTextActive]}>
                        Moneyline
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setBetType('spread');
                        setOverUnder(null);
                      }}
                      style={({ pressed }) => [
                        styles.betTypeButton,
                        betType === 'spread' && styles.betTypeButtonActive,
                        pressed && styles.betTypeButtonPressed,
                      ]}
                    >
                      <Text style={[styles.betTypeText, betType === 'spread' && styles.betTypeTextActive]}>
                        Spread
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setBetType('over/under');
                        setSelectedTeam(null);
                      }}
                      style={({ pressed }) => [
                        styles.betTypeButton,
                        betType === 'over/under' && styles.betTypeButtonActive,
                        pressed && styles.betTypeButtonPressed,
                      ]}
                    >
                      <Text style={[styles.betTypeText, betType === 'over/under' && styles.betTypeTextActive]}>
                        Over/Under
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setBetType('parlay');
                        setSelectedTeam(null);
                        setOverUnder(null);
                      }}
                      style={({ pressed }) => [
                        styles.betTypeButton,
                        betType === 'parlay' && styles.betTypeButtonActive,
                        pressed && styles.betTypeButtonPressed,
                      ]}
                    >
                      <Text style={[styles.betTypeText, betType === 'parlay' && styles.betTypeTextActive]}>
                        Parlay
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {(betType === 'moneyline' || betType === 'spread') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Team</Text>
                    <View style={styles.teamSelectionContainer}>
                      <Pressable
                        onPress={() => setSelectedTeam('away')}
                        style={({ pressed }) => [
                          styles.teamButton,
                          selectedTeam === 'away' && styles.teamButtonActive,
                          pressed && styles.teamButtonPressed,
                        ]}
                      >
                        <Text style={[styles.teamButtonText, selectedTeam === 'away' && styles.teamButtonTextActive]}>
                          {gameData.awayTeam}
                        </Text>
                        {betType === 'spread' && gameData.awaySpread !== undefined && (
                          <Text style={[styles.teamOddsText, selectedTeam === 'away' && styles.teamOddsTextActive]}>
                            {gameData.awaySpread > 0 ? '+' : ''}{gameData.awaySpread} ({gameData.awaySpreadOdds && gameData.awaySpreadOdds > 0 ? '+' : ''}{gameData.awaySpreadOdds})
                          </Text>
                        )}
                        {betType === 'moneyline' && gameData.awayMoneyline !== undefined && (
                          <Text style={[styles.teamOddsText, selectedTeam === 'away' && styles.teamOddsTextActive]}>
                            {gameData.awayMoneyline > 0 ? '+' : ''}{gameData.awayMoneyline}
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => setSelectedTeam('home')}
                        style={({ pressed }) => [
                          styles.teamButton,
                          selectedTeam === 'home' && styles.teamButtonActive,
                          pressed && styles.teamButtonPressed,
                        ]}
                      >
                        <Text style={[styles.teamButtonText, selectedTeam === 'home' && styles.teamButtonTextActive]}>
                          {gameData.homeTeam}
                        </Text>
                        {betType === 'spread' && gameData.homeSpread !== undefined && (
                          <Text style={[styles.teamOddsText, selectedTeam === 'home' && styles.teamOddsTextActive]}>
                            {gameData.homeSpread > 0 ? '+' : ''}{gameData.homeSpread} ({gameData.homeSpreadOdds && gameData.homeSpreadOdds > 0 ? '+' : ''}{gameData.homeSpreadOdds})
                          </Text>
                        )}
                        {betType === 'moneyline' && gameData.homeMoneyline !== undefined && (
                          <Text style={[styles.teamOddsText, selectedTeam === 'home' && styles.teamOddsTextActive]}>
                            {gameData.homeMoneyline > 0 ? '+' : ''}{gameData.homeMoneyline}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                {betType === 'over/under' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Over/Under</Text>
                    <View style={styles.teamSelectionContainer}>
                      <Pressable
                        onPress={() => setOverUnder('over')}
                        style={({ pressed }) => [
                          styles.teamButton,
                          overUnder === 'over' && styles.teamButtonActive,
                          pressed && styles.teamButtonPressed,
                        ]}
                      >
                        <Text style={[styles.teamButtonText, overUnder === 'over' && styles.teamButtonTextActive]}>
                          Over
                        </Text>
                        {gameData.overPoint !== undefined && (
                          <Text style={[styles.teamOddsText, overUnder === 'over' && styles.teamOddsTextActive]}>
                            {gameData.overPoint} ({gameData.overPrice && gameData.overPrice > 0 ? '+' : ''}{gameData.overPrice})
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => setOverUnder('under')}
                        style={({ pressed }) => [
                          styles.teamButton,
                          overUnder === 'under' && styles.teamButtonActive,
                          pressed && styles.teamButtonPressed,
                        ]}
                      >
                        <Text style={[styles.teamButtonText, overUnder === 'under' && styles.teamButtonTextActive]}>
                          Under
                        </Text>
                        {gameData.underPoint !== undefined && (
                          <Text style={[styles.teamOddsText, overUnder === 'under' && styles.teamOddsTextActive]}>
                            {gameData.underPoint} ({gameData.underPrice && gameData.underPrice > 0 ? '+' : ''}{gameData.underPrice})
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bet Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="$0.00"
                    placeholderTextColor="rgba(36, 0, 70, 0.4)"
                    value={displayCurrency(betAmount)}
                    onChangeText={handleCurrencyChange}
                    keyboardType="numeric"
                  />
                </View>

                {betAmount && (
                  <View style={styles.payoutInfo}>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Bet:</Text>
                      <Text style={styles.payoutValue}>${(parseFloat(betAmount) / 100).toFixed(2)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Potential Profit:</Text>
                      <Text style={styles.payoutValue}>${calculatePayout().toFixed(2)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Total Payout:</Text>
                      <Text style={[styles.payoutValue, styles.totalPayoutValue]}>${(parseFloat(betAmount) / 100 + calculatePayout()).toFixed(2)}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.cancelButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.confirmButton,
                    !isValid() && styles.confirmButtonDisabled,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={handlePlaceBet}
                  disabled={!isValid()}
                >
                  <Text style={styles.confirmButtonText}>Place Bet</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#240046',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  modalBody: {
    padding: 24,
    maxHeight: 500,
  },
  modalBodyContent: {
    paddingBottom: 120,
  },
  matchupInfo: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 4,
  },
  matchupText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  vsText: {
    fontSize: 12,
    color: 'rgba(36, 0, 70, 0.6)',
    fontWeight: '600' as const,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  betTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  betTypeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  betTypeButtonActive: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  betTypeButtonPressed: {
    opacity: 0.7,
  },
  betTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9D4EDD',
  },
  betTypeTextActive: {
    color: '#FFFFFF',
  },
  teamSelectionContainer: {
    gap: 12,
  },
  teamButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
    gap: 4,
  },
  teamButtonActive: {
    backgroundColor: '#9D4EDD',
    borderColor: '#9D4EDD',
  },
  teamButtonPressed: {
    opacity: 0.7,
  },
  teamButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  teamButtonTextActive: {
    color: '#FFFFFF',
  },
  teamOddsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(36, 0, 70, 0.7)',
  },
  teamOddsTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
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
  payoutInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  totalPayoutValue: {
    fontSize: 18,
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  resultButtonSelected: {
    borderWidth: 2,
  },
  lostButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  wonButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  resultButtonPressed: {
    opacity: 0.7,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  resultButtonTextSelected: {
    color: '#FFFFFF',
  },
  calculationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  calculationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  calculationValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  calculationWin: {
    color: '#10B981',
  },
  calculationLoss: {
    color: '#EF4444',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 0, 70, 0.1)',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#9D4EDD',
  },
  confirmButton: {
    backgroundColor: '#9D4EDD',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
