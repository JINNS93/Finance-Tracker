import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { categoryIconMap } from '../utils/categoriesIcons';

export default function ViewScreen() {
  const {
    categories,
    transactions,
    getCategoryBudget,
  } = useApp();

  // LOCAL DATE RANGE STATE
  const [tempStart, setTempStart] = useState(new Date(new Date().setDate(1)));
  const [tempEnd, setTempEnd] = useState(new Date());

  const [startDate, setStartDate] = useState(tempStart);
  const [endDate, setEndDate] = useState(tempEnd);

  const [showModal, setShowModal] = useState(false);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);

  // FILTER BY DATE RANGE
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // new Date("YYYY-MM-DD") parses as UTC, which is the previous day west of UTC,
      // so build the local date from its parts
      const [y, m, d] = t.date.split('-').map(Number);
      const tDate = new Date(y, m - 1, d);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // CATEGORY TOTALS (date range)
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    categories.forEach(cat => { totals[cat.id] = 0; });
    filteredTransactions.forEach(t => {
      if (totals.hasOwnProperty(t.categoryId)) {
        totals[t.categoryId] += t.amount;
      }
    });
    return totals;
  }, [filteredTransactions, categories]);

  // TOTAL SPENT
  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // TOTAL BUDGET
  // For ViewScreen: sum monthly budgets across all months in range
  // We use the endDate as representative date for each month
  const totalBudget = useMemo(() => {
    const startMonth = startDate.getFullYear() * 12 + startDate.getMonth();
    const endMonth = endDate.getFullYear() * 12 + endDate.getMonth();
    const monthCount = endMonth - startMonth + 1;

    // Sum each month's budget across all categories
    let total = 0;
    for (let i = 0; i < monthCount; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      categories.forEach(cat => {
        // Pass the month date to getCategoryBudget
        total += getCategoryBudget(cat, 'month', monthDate);
      });
    }
    return total;
  }, [categories, startDate, endDate, getCategoryBudget]);

  const balance = totalBudget - totalSpent;

  // QUICK FILTERS
  const setToday = () => {
    const now = new Date();
    setTempStart(new Date(now));
    setTempEnd(new Date(now));
  };

  const setLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    setTempStart(start);
    setTempEnd(end);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setTempStart(start);
    setTempEnd(new Date());
  };

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setTempStart(start);
    setTempEnd(end);
  };

  const applyRange = () => {
    // If From is after To, swap them instead of producing an empty range
    const [start, end] = tempStart <= tempEnd ? [tempStart, tempEnd] : [tempEnd, tempStart];
    setStartDate(start);
    setEndDate(end);
    setShowModal(false);
  };

  const format = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>View</Text>

      {/* DATE BAR */}
      <TouchableOpacity style={styles.dateBar} onPress={() => setShowModal(true)}>
        <View>
          <Text style={styles.dateLabel}>Date Range</Text>
          <Text style={styles.dateText}>
            {format(startDate)} → {format(endDate)}
          </Text>
        </View>
        <Text style={styles.edit}>Select</Text>
      </TouchableOpacity>

      {/* SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>RM {totalBudget.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryValue, { color: '#E74C3C' }]}>
            RM {totalSpent.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, { color: balance < 0 ? '#F87171' : '#2ECC71', fontSize: 18, fontWeight: 'bold' }]}>
            RM {balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* BREAKDOWN BY CATEGORY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown by Category</Text>

        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories</Text>
        ) : (
          categories.map(cat => {
            const spent = categoryTotals[cat.id] || 0;
            // Use endDate as the reference month for display
            const budget = getCategoryBudget(cat, 'month', endDate);
            const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const isOverBudget = spent > budget && budget > 0;
            const iconSource = categoryIconMap[cat.icon || 'money'] || categoryIconMap.money;

            return (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIconRow}>
                    <Image source={iconSource} style={styles.categoryIconImage} />
                    <Text style={styles.categoryIcon}>{cat.name}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${percentage}%` as `${number}%`, backgroundColor: isOverBudget ? '#F87171' : '#D4A017' },
                      ]}
                    />
                  </View>
                  <Text style={styles.budgetInfo}>
                    <Text style={{ color: '#aaa' }}>Spent: </Text>
                    <Text style={isOverBudget ? { color: '#F87171' } : {}}>
                      RM {spent.toFixed(2)}
                    </Text>
                    {budget > 0 && (
                      <Text style={{ color: '#aaa' }}> / Month Ref: RM {budget.toFixed(2)}</Text>
                    )}
                    {budget === 0 && (
                      <Text style={{ color: '#555' }}> (no budget set)</Text>
                    )}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Transactions ({filteredTransactions.length})
        </Text>

        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions in this range</Text>
        ) : (
          // Sort a copy: .sort() would mutate the memoized array
          [...filteredTransactions]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(t => (
              <View key={t.id} style={styles.transactionRow}>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{t.categoryName}</Text>
                  <Text style={styles.txNote}>{t.note || 'No note'}</Text>
                  <Text style={styles.txDate}>{t.date}</Text>
                </View>
                <Text style={styles.txAmount}>-RM {t.amount.toFixed(2)}</Text>
              </View>
            ))
        )}
      </View>

      {/* DATE RANGE MODAL */}
      <Modal visible={showModal} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={setToday}>
              <Text style={styles.quickText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={setLast7Days}>
              <Text style={styles.quickText}>7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={setLast30Days}>
              <Text style={styles.quickText}>30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={setThisMonth}>
              <Text style={styles.quickText}>Month</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerSection}>
            <TouchableOpacity style={styles.pickerField} onPress={() => setPicker('start')}>
              <Text style={styles.pickLabel}>From</Text>
              <Text style={styles.pickValue}>{format(tempStart)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerField} onPress={() => setPicker('end')}>
              <Text style={styles.pickLabel}>To</Text>
              <Text style={styles.pickValue}>{format(tempEnd)}</Text>
            </TouchableOpacity>
          </View>

          {picker && (
            <DateTimePicker
              value={picker === 'start' ? tempStart : tempEnd}
              mode="date"
              onChange={(e, date) => {
                // Close the picker first: on cancel date may be undefined, and leaving it open stops the same field from reopening
                setPicker(null);
                if (!date) return;
                if (picker === 'start') setTempStart(date);
                else setTempEnd(date);
              }}
            />
          )}

          <TouchableOpacity style={styles.applyBtn} onPress={applyRange}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 20, },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 25 },
  dateBar: { backgroundColor: '#15151C', padding: 16, borderRadius: 14, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { color: '#8B8B99', fontSize: 12, marginBottom: 4 },
  dateText: { color: '#D4A017', fontWeight: '600', fontSize: 14 },
  edit: { color: '#8B8B99', fontSize: 12 },
  summaryCard: { backgroundColor: '#15151C', padding: 20, borderRadius: 14, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#23232D' },
  summaryLabel: { color: '#8B8B99', fontSize: 14 },
  summaryValue: { color: '#D4A017', fontWeight: 'bold', fontSize: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  categoryRow: { backgroundColor: '#15151C', padding: 14, borderRadius: 12, marginBottom: 10 },
  categoryInfo: { gap: 10 },
  categoryIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryIconImage: { width: 18, height: 18 },
  categoryIcon: { color: '#fff', fontWeight: '600', fontSize: 15 },
  progressBarBg: { height: 8, backgroundColor: '#23232D', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  budgetInfo: { color: '#aaa', fontSize: 12 },
  transactionRow: { backgroundColor: '#15151C', padding: 14, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txInfo: { flex: 1 },
  txCategory: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  txNote: { color: '#8B8B99', fontSize: 12, marginBottom: 4 },
  txDate: { color: '#666', fontSize: 11 },
  txAmount: { color: '#E74C3C', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#8B8B99', textAlign: 'center', paddingVertical: 20 },
  modal: { flex: 1, backgroundColor: '#0B0B0F', padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { color: '#8B8B99', fontSize: 24 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, gap: 10 },
  quickBtn: { flex: 1, backgroundColor: '#15151C', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  quickText: { color: '#D4A017', fontWeight: '600', fontSize: 13 },
  pickerSection: { gap: 20, marginBottom: 30 },
  pickerField: { backgroundColor: '#15151C', padding: 16, borderRadius: 12 },
  pickLabel: { color: '#8B8B99', fontSize: 12, marginBottom: 6 },
  pickValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applyBtn: { backgroundColor: '#D4A017', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  applyText: { textAlign: 'center', fontWeight: 'bold', color: '#000', fontSize: 16 },
  cancelText: { color: '#8B8B99', textAlign: 'center', paddingVertical: 12 },
});