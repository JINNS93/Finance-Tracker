import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useApp } from '../context/AppContext';
import { categoryIconMap } from '../utils/categoriesIcons';

function getCategoryIconSource(categoryId: string, categories: any[]) {
  const cat = categories.find(c => c.id === categoryId);
  const key = cat?.icon || 'money';
  return categoryIconMap[key] || categoryIconMap.money;
}

export default function HomeScreen() {
  const navigation = useNavigation();

  const {
    categories,
    getCategorySpent,
    getCategoryBudget,
    getFilteredTransactions,
    getTotalBudget,
    getTotalSpent,
    globalSelectedDate,
    setGlobalSelectedDate,
  } = useApp();

  // CURRENT USER NAME
  // The signed-in user's displayName from Firebase Auth,
  // falling back to the email prefix for accounts without a name.
  // On sign-up the name is set with updateProfile after signing in, so
  // follow onUserChanged to re-render once it arrives.
  const [currentUser, setCurrentUser] = useState(auth().currentUser);
  useEffect(() => auth().onUserChanged(setCurrentUser), []);

  const displayName =
    currentUser?.displayName?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'User';

  // MONTHLY DATA
  const monthlyData = useMemo(() => {
    const monthTransactions = getFilteredTransactions(globalSelectedDate, 'month');
    const monthlyTotal = getTotalSpent(globalSelectedDate, 'month');
    // Pass date to getTotalBudget
    const monthlyBudget = getTotalBudget('month', globalSelectedDate);

    const monthlyCategoryTotals: Record<string, number> = {};
    categories.forEach(cat => {
      monthlyCategoryTotals[cat.id] = getCategorySpent(cat.id, globalSelectedDate, 'month');
    });

    const overBudgetCategories = categories
      .map(cat => {
        const spent = monthlyCategoryTotals[cat.id] || 0;
        // Pass date to getCategoryBudget
        const budget = getCategoryBudget(cat, 'month', globalSelectedDate);

        if (spent > budget && budget > 0) {
          return {
            category: cat.id,
            categoryName: cat.name,
            spent,
            budget,
            excess: spent - budget,
          };
        }
        return null;
      })
      .filter(Boolean);

    return {
      monthlyTotal,
      monthlyBudget,
      monthlyCategoryTotals,
      overBudgetCategories,
      monthTransactions,
    };
  }, [globalSelectedDate, categories, getFilteredTransactions, getTotalSpent, getTotalBudget, getCategorySpent, getCategoryBudget]);

  const balance = monthlyData.monthlyBudget - monthlyData.monthlyTotal;

  const recentTransactions = useMemo(() => {
    // Newest transaction date first (same day: most recently added first)
    return [...monthlyData.monthTransactions]
      .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
      .slice(0, 5);
  }, [monthlyData.monthTransactions]);

  const handlePreviousMonth = () => {
    // Build from the 1st so e.g. Oct 31 - 1 month does not roll over back into October
    setGlobalSelectedDate(
      new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    const currentDate = new Date();
    const isCurrentMonth =
      globalSelectedDate.getMonth() === currentDate.getMonth() &&
      globalSelectedDate.getFullYear() === currentDate.getFullYear();

    if (!isCurrentMonth) {
      setGlobalSelectedDate(
        new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth() + 1, 1),
      );
    }
  };

  const monthName = globalSelectedDate.toLocaleString('en-US', {
    month: 'long', year: 'numeric',
  });

  const isCurrentMonth =
    globalSelectedDate.getMonth() === new Date().getMonth() &&
    globalSelectedDate.getFullYear() === new Date().getFullYear();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome Back </Text>
          <Text style={styles.username}>{displayName}</Text>
        </View>
        <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => {
              Alert.alert('Account', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: () => auth().signOut(),
                },
              ]);
            }}
          >
            <Text style={styles.profileText}>
              {displayName.slice(0, 2).toUpperCase()}
            </Text>
        </TouchableOpacity>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.balanceCard}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthArrow}>
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>{monthName}</Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
            disabled={isCurrentMonth}
          >
            <Text style={[styles.arrowText, isCurrentMonth && styles.arrowTextDisabled]}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.balanceLabel}>Monthly Budget</Text>
        <Text style={styles.balanceAmount}>RM {monthlyData.monthlyBudget.toFixed(2)}</Text>

        <View style={styles.monthlyExpenseRow}>
          <Text style={styles.monthlyExpenseLabel}>Total Spent</Text>
          <Text style={styles.monthlyExpenseAmount}>
            RM {monthlyData.monthlyTotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.monthlyExpenseRow}>
          <Text style={styles.monthlyExpenseLabel}>Remaining</Text>
          <Text style={[
            styles.monthlyExpenseAmount,
            balance < 0 ? styles.negativeBalance : styles.positiveBalance
          ]}>
            RM {balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* BUDGET PROGRESS */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetTitle}>Budget Progress</Text>

        <View style={styles.budgetSection}>
          {categories.length > 0 ? (
            categories.map(cat => {
              const spent = monthlyData.monthlyCategoryTotals[cat.id] || 0;
              // Pass date to getCategoryBudget
              const budget = getCategoryBudget(cat, 'month', globalSelectedDate);
              const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const isOverBudget = spent > budget && budget > 0;

              return (
                <View key={cat.id} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetLeft}>
                      <Image
                        source={getCategoryIconSource(cat.id, categories)}
                        style={styles.budgetIconImage}
                      />
                      <Text style={styles.budgetCategory}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.budgetText, isOverBudget && styles.overBudgetText]}>
                      RM {spent.toFixed(0)} / {budget.toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${percentage}%` as `${number}%`, backgroundColor: isOverBudget ? '#F87171' : '#D4A017' },
                      ]}
                    />
                  </View>

                  {budget === 0 && (
                    <Text style={styles.noBudgetHint}>No budget set for this month</Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.noBudgetText}>No categories yet</Text>
          )}
        </View>
      </View>

      {/* OVER BUDGET WARNING */}
      {monthlyData.overBudgetCategories.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}> Over Budget Alert</Text>
          {monthlyData.overBudgetCategories.map((item: any) => (
            <View key={item.category} style={styles.warningItem}>
              <View style={styles.warningCategoryRow}>
                <Image
                  source={getCategoryIconSource(item.category, categories)}
                  style={styles.warningIconImage}
                />
                <Text style={styles.warningCategory}>{item.categoryName}</Text>
              </View>
              <Text style={styles.warningAmount}>
                Over RM {item.excess.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('History' as never)}
        >
          <Image source={categoryIconMap.history} style={styles.actionIconImage} />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('View' as never)}
        >
          <Image source={categoryIconMap.viewsearch} style={styles.actionIconImage} />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Add' as never)}
        >
          <Image source={categoryIconMap.add} style={styles.actionIconImage} />
          <Text style={styles.actionText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORIES */}
      <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Categories</Text>

      <View style={styles.categoryContainer}>
        {categories.slice(0, 4).map((cat) => {
          const amount = monthlyData.monthlyCategoryTotals[cat.id] || 0;
          const total = monthlyData.monthlyTotal || 1;
          const percentage: string = ((amount / total) * 100).toFixed(0);

          return (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryTop}>
                <Text style={styles.categoryPercent}>{percentage}%</Text>
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryAmount}>RM {amount.toFixed(2)}</Text>
              <View style={styles.categoryProgressBg}>
                <View
                  style={[styles.categoryProgressFill, { width: `${percentage}%` as `${number}%` }]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* RECENT TRANSACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History' as never)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length > 0 ? (
        recentTransactions.map(t => (
          <View key={t.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionIcon}>
                <Image
                  source={getCategoryIconSource(t.categoryId, categories)}
                  style={styles.transactionIconImage}
                />
              </View>
              <View>
                <Text style={styles.transactionTitle}>
                  {t.note || t.categoryName}
                </Text>
                <Text style={styles.transactionDate}>{t.date}</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>-RM {t.amount.toFixed(2)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No transactions yet</Text>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  welcome: { color: '#8B8B99', fontSize: 14 },
  username: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D4A017', justifyContent: 'center', alignItems: 'center' },
  profileText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  balanceCard: { backgroundColor: '#15151C', borderRadius: 28, padding: 24, marginBottom: 20, shadowColor: '#D4A017', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#23232D', justifyContent: 'center', alignItems: 'center' },
  monthArrowDisabled: { opacity: 0.3 },
  arrowText: { color: '#D4A017', fontSize: 20, fontWeight: 'bold' },
  arrowTextDisabled: { color: '#8B8B99' },
  monthText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  balanceLabel: { color: '#8B8B99', fontSize: 14, marginBottom: 10 },
  balanceAmount: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold', marginBottom: 20 },
  monthlyExpenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#23232D', marginTop: 8 },
  monthlyExpenseLabel: { color: '#8B8B99', fontSize: 14 },
  monthlyExpenseAmount: { color: '#F87171', fontSize: 20, fontWeight: 'bold' },
  positiveBalance: { color: '#2ECC71' },
  negativeBalance: { color: '#F87171' },
  budgetCard: { backgroundColor: '#15151C', borderRadius: 24, padding: 20, marginBottom: 20 },
  budgetTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  budgetSection: { gap: 16 },
  budgetItem: { marginBottom: 12 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center' },
  budgetIconImage: { width: 20, height: 20, marginRight: 8 },
  budgetCategory: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  budgetText: { color: '#8B8B99', fontSize: 14 },
  overBudgetText: { color: '#F87171', fontWeight: '600' },
  progressBarBg: { height: 8, backgroundColor: '#23232D', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  noBudgetText: { color: '#8B8B99', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  noBudgetHint: { color: '#555', fontSize: 11, marginTop: 4 },
  warningCard: { backgroundColor: '#2D1515', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#F87171' },
  warningTitle: { color: '#F87171', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  warningItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#3D2525' },
  warningCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningIconImage: { width: 16, height: 16 },
  warningCategory: { color: '#FFFFFF', fontSize: 14 },
  warningAmount: { color: '#F87171', fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 20 },
  seeAll: { color: '#D4A017', fontSize: 14 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  actionCard: { width: '30%', backgroundColor: '#15151C', borderRadius: 20, paddingVertical: 20, alignItems: 'center' },
  actionIconImage: { width: 24, height: 24, marginBottom: 10 },
  actionText: { color: '#FFFFFF', fontSize: 12 },
  categoryContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  categoryCard: { width: '48%', backgroundColor: '#15151C', borderRadius: 22, padding: 20, marginBottom: 15 },
  categoryTop: { marginBottom: 15 },
  categoryPercent: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  categoryName: { color: '#8B8B99', fontSize: 14, marginBottom: 6 },
  categoryAmount: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  categoryProgressBg: { height: 6, backgroundColor: '#23232D', borderRadius: 3, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', backgroundColor: '#D4A017', borderRadius: 3 },
  transactionCard: { backgroundColor: '#15151C', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#23232D', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  transactionIconImage: { width: 22, height: 22 },
  transactionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 5 },
  transactionDate: { color: '#8B8B99', fontSize: 12 },
  transactionAmount: { color: '#F87171', fontWeight: 'bold', fontSize: 16 },
  noDataText: { color: '#8B8B99', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});