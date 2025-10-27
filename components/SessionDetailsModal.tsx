import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface SessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  session: {
    casinoName: string;
    state: string;
    startTime: string;
    endTime?: string;
    totalInvestment: number;
    endAmount?: number;
    winLoss?: number;
  } | null;
}

export default function SessionDetailsModal({ visible, onClose, session }: SessionDetailsModalProps) {
  if (!session) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{session.casinoName}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              testID="close-details-modal-button"
            >
              <X size={24} color="#240046" />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{session.state}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Time</Text>
              <Text style={styles.detailValue}>{formatTime(session.startTime)}</Text>
            </View>

            {session.endTime && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Time</Text>
                <Text style={styles.detailValue}>{formatTime(session.endTime)}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{calculateDuration(session.startTime, session.endTime)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Money Invested</Text>
              <Text style={styles.detailValue}>${session.totalInvestment.toFixed(2)}</Text>
            </View>

            {session.endAmount !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Final Amount</Text>
                <Text style={styles.detailValue}>${session.endAmount.toFixed(2)}</Text>
              </View>
            )}

            {session.winLoss !== undefined && (
              <>
                <View style={styles.divider} />
                <View style={[styles.detailRow, styles.winLossRow]}>
                  <Text style={styles.winLossLabel}>
                    {session.winLoss >= 0 ? 'Win' : 'Loss'}
                  </Text>
                  <Text style={[
                    styles.winLossValue,
                    session.winLoss >= 0 ? styles.winText : styles.lossText
                  ]}>
                    {session.winLoss >= 0 ? '+' : ''}${session.winLoss.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    flex: 1,
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
    padding: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(36, 0, 70, 0.85)',
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#240046',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(36, 0, 70, 0.1)',
    marginVertical: 4,
  },
  winLossRow: {
    marginTop: 4,
  },
  winLossLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#240046',
  },
  winLossValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  winText: {
    color: '#047857',
  },
  lossText: {
    color: '#EF4444',
  },
});
