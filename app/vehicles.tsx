import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import { Vehicle, VehicleExpense } from '@/types/expense';
import { WALLPAPER_URL } from '@/constants/wallpaper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Car, Plus, Edit2, Trash2, ChevronRight, DollarSign, Archive, ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddVehicleModal from '@/components/AddVehicleModal';
import VehicleExpenseModal from '@/components/VehicleExpenseModal';

export default function VehiclesScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vehicles, vehicleExpenses, vehicleArchives, addVehicle, updateVehicle, deleteVehicle, addVehicleExpense, updateVehicleExpense, deleteVehicleExpense, archiveVehicleYear } = useExpenses();

  const [showAddVehicleModal, setShowAddVehicleModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingExpense, setEditingExpense] = useState<VehicleExpense | null>(null);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showArchives, setShowArchives] = useState<boolean>(false);
  const [expandedArchives, setExpandedArchives] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const userVehicles = vehicles.filter(v => v.userId === currentUser?.id && v.isActive);
  const userExpenses = vehicleExpenses.filter(e => e.userId === currentUser?.id);
  const userArchives = vehicleArchives.filter(a => a.userId === currentUser?.id);

  const toggleVehicleExpanded = (vehicleId: string) => {
    setExpandedVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  const toggleMonthExpanded = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const toggleArchiveExpanded = (archiveId: string) => {
    setExpandedArchives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(archiveId)) {
        newSet.delete(archiveId);
      } else {
        newSet.add(archiveId);
      }
      return newSet;
    });
  };

  const handleAddVehicle = async (
    name: string,
    make: string,
    model: string,
    year: number,
    startingMileage: number,
    color?: string,
    licensePlate?: string,
    yearStartMileage?: number,
    yearEndingMileage?: number
  ) => {
    if (currentUser) {
      await addVehicle(
        currentUser.id,
        name,
        make,
        model,
        year,
        startingMileage,
        color,
        licensePlate,
        yearStartMileage,
        yearEndingMileage
      );
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddVehicleModal(true);
  };

  const handleUpdateVehicle = async (
    name: string,
    make: string,
    model: string,
    year: number,
    startingMileage: number,
    color?: string,
    licensePlate?: string,
    yearStartMileage?: number,
    yearEndingMileage?: number
  ) => {
    if (editingVehicle) {
      await updateVehicle(
        editingVehicle.id,
        name,
        make,
        model,
        year,
        startingMileage,
        editingVehicle.currentMileage,
        color,
        licensePlate,
        yearStartMileage,
        yearEndingMileage
      );
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This will also delete all associated expenses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVehicle(vehicleId);
          },
        },
      ]
    );
  };

  const handleArchiveYear = (vehicleId: string) => {
    const vehicle = userVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const currentYear = new Date().getFullYear();
    const yearExpenses = getVehicleExpenses(vehicleId).filter(e => {
      const expenseYear = new Date(e.date).getFullYear();
      return expenseYear === currentYear;
    });

    if (yearExpenses.length === 0) {
      Alert.alert('No Expenses', 'There are no expenses to archive for this year.');
      return;
    }

    if (!vehicle.yearEndingMileage) {
      Alert.alert(
        'Year Ending Mileage Required',
        'Please set the year ending mileage in vehicle settings before archiving.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Archive Year',
      `Archive all ${currentYear} expenses for ${vehicle.name}? This will move all 12 months to the archive and start a new year.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'default',
          onPress: async () => {
            await archiveVehicleYear(vehicleId, currentYear);
            Alert.alert('Success', 'Year archived successfully. A new year has started.');
          },
        },
      ]
    );
  };

  const handleAddExpense = async (
    vehicleId: string,
    category: any,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    mileage?: number,
    gallons?: number,
    pricePerGallon?: number,
    notes?: string
  ) => {
    if (currentUser) {
      await addVehicleExpense(
        currentUser.id,
        vehicleId,
        category,
        amount,
        description,
        date,
        merchant,
        mileage,
        gallons,
        pricePerGallon,
        notes
      );
    }
  };

  const handleUpdateExpense = async (
    vehicleId: string,
    category: any,
    amount: number,
    description: string,
    date: Date,
    merchant?: string,
    mileage?: number,
    gallons?: number,
    pricePerGallon?: number,
    notes?: string
  ) => {
    if (editingExpense) {
      await updateVehicleExpense(
        editingExpense.id,
        category,
        amount,
        description,
        date,
        merchant,
        mileage,
        gallons,
        pricePerGallon,
        notes
      );
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVehicleExpense(expenseId);
          },
        },
      ]
    );
  };

  const handleEditExpense = (expense: VehicleExpense) => {
    setEditingExpense(expense);
    setShowAddExpenseModal(true);
  };

  const handleCloseVehicleModal = () => {
    setShowAddVehicleModal(false);
    setEditingVehicle(null);
  };

  const handleCloseExpenseModal = () => {
    setShowAddExpenseModal(false);
    setEditingExpense(null);
  };

  const getVehicleExpenses = (vehicleId: string) => {
    return userExpenses
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getVehicleExpensesByMonth = (vehicleId: string) => {
    const expenses = getVehicleExpenses(vehicleId);
    const grouped: Record<string, VehicleExpense[]> = {};

    expenses.forEach(expense => {
      if (!grouped[expense.monthKey]) {
        grouped[expense.monthKey] = [];
      }
      grouped[expense.monthKey].push(expense);
    });

    return Object.entries(grouped)
      .map(([monthKey, monthExpenses]) => ({
        monthKey,
        expenses: monthExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const getVehicleTotalExpenses = (vehicleId: string) => {
    return getVehicleExpenses(vehicleId).reduce((sum, e) => sum + e.amount, 0);
  };

  const getYearMileage = (vehicle: Vehicle) => {
    const yearStart = vehicle.yearStartMileage || vehicle.startingMileage;
    const yearEnd = vehicle.yearEndingMileage;
    
    if (yearEnd && yearEnd > yearStart) {
      return yearEnd - yearStart;
    }
    
    const current = vehicle.currentMileage;
    return current - yearStart;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: WALLPAPER_URL }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.purpleOverlay} />
      </ImageBackground>
      <LinearGradient
        colors={['rgba(157, 78, 221, 0.7)', 'rgba(123, 44, 191, 0.7)', 'rgba(90, 24, 154, 0.7)', 'rgba(36, 0, 70, 0.7)', 'rgba(16, 0, 43, 0.7)']}
        style={styles.gradientOverlay}
      />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>VEHICLE EXPENSES</Text>
          </View>
        </View>
      </View>

      <View style={styles.topSection}>
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowAddVehicleModal(true)}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Vehicle</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowAddExpenseModal(true)}
            disabled={userVehicles.length === 0}
          >
            <DollarSign size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </Pressable>

          {userArchives.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.archiveButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setShowArchives(!showArchives)}
            >
              <Archive size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {showArchives ? 'Current' : 'Archives'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>{showArchives ? 'Archived Years' : 'My Vehicles'}</Text>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {showArchives ? (
            userArchives.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Archive size={48} color="#FFFFFF" />
                <Text style={styles.emptyText}>No archived years</Text>
              </View>
            ) : (
              userArchives
                .sort((a, b) => {
                  if (a.vehicleId !== b.vehicleId) {
                    const vehicleA = vehicles.find(v => v.id === a.vehicleId);
                    const vehicleB = vehicles.find(v => v.id === b.vehicleId);
                    const nameA = vehicleA?.name || '';
                    const nameB = vehicleB?.name || '';
                    return nameA.localeCompare(nameB);
                  }
                  return b.year - a.year;
                })
                .map((archive) => {
                  const vehicle = vehicles.find(v => v.id === archive.vehicleId);
                  if (!vehicle) return null;

                  const isExpanded = expandedArchives.has(archive.id);
                  const months = Object.keys(archive.monthlyExpenses).sort((a, b) => b.localeCompare(a));

                  return (
                    <View key={archive.id} style={styles.archiveCard}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.archiveHeader,
                          pressed && styles.vehicleHeaderPressed,
                        ]}
                        onPress={() => toggleArchiveExpanded(archive.id)}
                      >
                        <View style={styles.archiveHeaderLeft}>
                          <View style={styles.vehicleIconContainer}>
                            <ChevronRight
                              size={20}
                              color="#FFFFFF"
                              style={{
                                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                              }}
                            />
                          </View>
                          <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleName}>{vehicle.name} - {archive.year}</Text>
                            <Text style={styles.vehicleDetails}>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </Text>
                            <Text style={styles.mileageText}>
                              Miles: {archive.startMileage.toLocaleString()} → {archive.endMileage.toLocaleString()} ({(archive.endMileage - archive.startMileage).toLocaleString()} mi)
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.totalExpenses}>${archive.totalExpenses.toFixed(2)}</Text>
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.monthsList}>
                          {months.map((monthKey) => {
                            const monthExpenses = archive.monthlyExpenses[monthKey];
                            const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

                            return (
                              <View key={monthKey} style={styles.monthCard}>
                                <View style={styles.monthHeader}>
                                  <Text style={styles.monthLabel}>{getMonthLabel(monthKey)}</Text>
                                  <Text style={styles.monthTotal}>${monthTotal.toFixed(2)}</Text>
                                </View>
                                <View style={styles.monthExpensesList}>
                                  {monthExpenses.map((expense) => (
                                    <View key={expense.id} style={styles.expenseItemCompact}>
                                      <View style={styles.expenseInfo}>
                                        <Text style={styles.expenseCategory}>{expense.category}</Text>
                                        <Text style={styles.expenseDescription}>{expense.description}</Text>
                                        <Text style={styles.expenseDate}>
                                          {new Date(expense.date).toLocaleDateString()}
                                        </Text>
                                      </View>
                                      <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
            )
          ) : (
            userVehicles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Car size={48} color="#FFFFFF" />
                <Text style={styles.emptyText}>No vehicles yet</Text>
                <Text style={styles.emptySubtext}>
                  Add a vehicle to start tracking expenses
                </Text>
              </View>
            ) : (
              userVehicles.map((vehicle) => {
                const isExpanded = expandedVehicles.has(vehicle.id);
                const monthlyGroups = getVehicleExpensesByMonth(vehicle.id);
                const totalExpenses = getVehicleTotalExpenses(vehicle.id);
                const yearMileage = getYearMileage(vehicle);

                return (
                  <View key={vehicle.id} style={styles.vehicleCard}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.vehicleHeader,
                        pressed && styles.vehicleHeaderPressed,
                      ]}
                      onPress={() => toggleVehicleExpanded(vehicle.id)}
                    >
                      <View style={styles.vehicleHeaderLeft}>
                        <View style={styles.vehicleIconContainer}>
                          <ChevronRight
                            size={20}
                            color="#FFFFFF"
                            style={{
                              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                            }}
                          />
                        </View>
                        <View style={styles.vehicleInfo}>
                          <Text style={styles.vehicleName}>{vehicle.name}</Text>
                          <Text style={styles.vehicleDetails}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Text>
                          <View style={styles.mileageRow}>
                            <Text style={styles.mileageText}>
                              Current: {vehicle.currentMileage.toLocaleString()} mi
                            </Text>
                            <Text style={styles.mileageText}>
                              Year: {yearMileage.toLocaleString()} mi
                            </Text>
                          </View>
                          {vehicle.yearEndingMileage && vehicle.yearEndingMileage > 0 && (
                            <View style={styles.yearEndBadge}>
                              <Text style={styles.yearEndText}>
                                Year End: {vehicle.yearEndingMileage.toLocaleString()} mi
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.vehicleActions}>
                        <Text style={styles.totalExpenses}>${totalExpenses.toFixed(2)}</Text>
                        <View style={styles.vehicleButtons}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconButton,
                              pressed && styles.iconButtonPressed,
                            ]}
                            onPress={() => handleArchiveYear(vehicle.id)}
                          >
                            <Archive size={16} color="#FFFFFF" />
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconButton,
                              pressed && styles.iconButtonPressed,
                            ]}
                            onPress={() => handleEditVehicle(vehicle)}
                          >
                            <Edit2 size={16} color="#FFFFFF" />
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconButton,
                              pressed && styles.iconButtonPressed,
                            ]}
                            onPress={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash2 size={16} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.monthsList}>
                        {monthlyGroups.length === 0 ? (
                          <View style={styles.noExpenses}>
                            <Text style={styles.noExpensesText}>No expenses yet</Text>
                          </View>
                        ) : (
                          monthlyGroups.map((monthGroup) => {
                            const isMonthExpanded = expandedMonths.has(monthGroup.monthKey);

                            return (
                              <View key={monthGroup.monthKey} style={styles.monthCard}>
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.monthHeader,
                                    pressed && styles.monthHeaderPressed,
                                  ]}
                                  onPress={() => toggleMonthExpanded(monthGroup.monthKey)}
                                >
                                  <View style={styles.monthHeaderLeft}>
                                    <ChevronDown
                                      size={16}
                                      color="#FFFFFF"
                                      style={{
                                        transform: [{ rotate: isMonthExpanded ? '0deg' : '-90deg' }],
                                      }}
                                    />
                                    <Text style={styles.monthLabel}>{getMonthLabel(monthGroup.monthKey)}</Text>
                                  </View>
                                  <Text style={styles.monthTotal}>${monthGroup.total.toFixed(2)}</Text>
                                </Pressable>

                                {isMonthExpanded && (
                                  <View style={styles.monthExpensesList}>
                                    {monthGroup.expenses.map((expense) => (
                                      <Pressable
                                        key={expense.id}
                                        style={({ pressed }) => [
                                          styles.expenseItem,
                                          pressed && styles.expenseItemPressed,
                                        ]}
                                        onPress={() => handleEditExpense(expense)}
                                      >
                                        <View style={styles.expenseInfo}>
                                          <Text style={styles.expenseCategory}>{expense.category}</Text>
                                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                                          {expense.merchant && (
                                            <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                                          )}
                                          {expense.mileage && (
                                            <Text style={styles.expenseMileage}>
                                              Mileage: {expense.mileage.toLocaleString()} mi
                                            </Text>
                                          )}
                                          {expense.gallons && expense.pricePerGallon && (
                                            <Text style={styles.expenseGas}>
                                              {expense.gallons.toFixed(2)} gal @ ${expense.pricePerGallon.toFixed(2)}/gal
                                            </Text>
                                          )}
                                          {expense.notes && (
                                            <Text style={styles.expenseNotes}>{expense.notes}</Text>
                                          )}
                                          <Text style={styles.expenseDate}>
                                            {new Date(expense.date).toLocaleDateString()}
                                          </Text>
                                        </View>
                                        <View style={styles.expenseRight}>
                                          <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                                          <Pressable
                                            style={({ pressed }) => [
                                              styles.deleteButton,
                                              pressed && styles.deleteButtonPressed,
                                            ]}
                                            onPress={() => handleDeleteExpense(expense.id)}
                                          >
                                            <Trash2 size={16} color="#FFFFFF" />
                                          </Pressable>
                                        </View>
                                      </Pressable>
                                    ))}
                                  </View>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      </View>

      <AddVehicleModal
        visible={showAddVehicleModal}
        onClose={handleCloseVehicleModal}
        onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
        editingVehicle={editingVehicle}
      />

      <VehicleExpenseModal
        visible={showAddExpenseModal}
        onClose={handleCloseExpenseModal}
        onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
        vehicles={userVehicles}
        editingExpense={editingExpense}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purpleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 78, 221, 0.3)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.9)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  topSection: {
    padding: 20,
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#9D4EDD',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  archiveButton: {
    backgroundColor: '#7B2CBF',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#D4A5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
  },
  vehicleCard: {
    backgroundColor: '#9D4EDD',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  archiveCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  vehicleHeaderPressed: {
    opacity: 0.7,
  },
  vehicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  archiveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  mileageRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mileageText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  yearEndBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  yearEndText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  vehicleActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  totalExpenses: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  vehicleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  monthsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  monthCard: {
    backgroundColor: '#5A189A',
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  monthHeaderPressed: {
    opacity: 0.7,
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  monthTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  monthExpensesList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  noExpenses: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noExpensesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(90, 24, 154, 0.6)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12,
  },
  expenseItemPressed: {
    opacity: 0.8,
    backgroundColor: 'rgba(123, 44, 191, 0.6)',
  },
  expenseItemCompact: {
    flexDirection: 'row',
    backgroundColor: 'rgba(90, 24, 154, 0.4)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
    gap: 3,
  },
  expenseCategory: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  expenseMerchant: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expenseMileage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  expenseGas: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  expenseNotes: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic' as const,
  },
  expenseDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
});
