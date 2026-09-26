import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { categoryIconMap } from '../utils/categoriesIcons';

export default function AddScreen() {
  const {
    categories,
    addTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoryBudget,
    getCategorySpent,
    getCategoryBudget,
    getFilteredTransactions,
    getTotalBudget,
    getTotalSpent,
    globalSelectedDate,
    globalDateMode,
    setGlobalSelectedDate,
    setGlobalDateMode,
  } = useApp();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Add Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Edit Category Modal
    const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  // Set Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategoryId, setBudgetCategoryId] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  // DATE FORMAT
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (globalDateMode === 'month') {
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // DATE CHANGE
  const changeDateBy = (value: number) => {
    const newDate = new Date(globalSelectedDate);
    if (globalDateMode === 'day') {
      newDate.setDate(newDate.getDate() + value);
      setGlobalSelectedDate(newDate);
    } else {
      // Build from the 1st so e.g. Oct 31 - 1 month does not roll over back into October
      setGlobalSelectedDate(
        new Date(newDate.getFullYear(), newDate.getMonth() + value, 1),
      );
    }
  };

  // FILTERED TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return getFilteredTransactions(globalSelectedDate, globalDateMode);
  }, [globalSelectedDate, globalDateMode, getFilteredTransactions]);

  // TOTALS — now pass date to getTotalBudget
  const totalBudget = useMemo(() => {
    return getTotalBudget(globalDateMode, globalSelectedDate);
  }, [globalDateMode, globalSelectedDate, getTotalBudget]);

  const totalSpent = useMemo(() => {
    return getTotalSpent(globalSelectedDate, globalDateMode);
  }, [globalSelectedDate, globalDateMode, getTotalSpent]);

  const remaining = totalBudget - totalSpent;

  // ADD TRANSACTION
  const handleAddTransaction = () => {
    if (!amount || !selectedCategory) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return;

    addTransaction({
      categoryId: category.id,
      categoryName: category.name,
      amount: amt,
      note,
      date: formatDate(globalSelectedDate),
    });

    setAmount('');
    setNote('');
    setSelectedCategory(null);
  };

  // ADD CATEGORY
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    addCategory({
      name: newCategoryName,
      color: '#D4A017',
      icon: 'money',
      dailyBudget: {},
      monthlyBudget: {},
    });

    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  // SAVE EDIT CATEGORY (name only)
  const saveEditCategory = () => {
    if (!editingCategory) return;
    updateCategory(editingCategory.id, {
      name: editingCategory.name,
    });
    setEditingCategory(null);
  };

  // OPEN BUDGET MODAL
  const openBudgetModal = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    const current = getCategoryBudget(cat, globalDateMode, globalSelectedDate);
    setBudgetCategoryId(categoryId);
    setBudgetAmount(current > 0 ? String(current) : '');
    setShowBudgetModal(true);
  };

  // SAVE BUDGET
  const saveBudget = () => {
    if (!budgetCategoryId) return;

    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid number');
      return;
    }

    setCategoryBudget(budgetCategoryId, globalDateMode, globalSelectedDate, amt);
    setShowBudgetModal(false);
    setBudgetCategoryId(null);
    setBudgetAmount('');
  };

  // DELETE (with confirmation)
  const confirmDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Delete "${name}"? All of its transactions will be deleted too. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
      ],
    );
  };

  const confirmDeleteTransaction = (id: string) => {
    Alert.alert('Delete Transaction', 'Delete this transaction? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  const budgetModalCategory = categories.find(c => c.id === budgetCategoryId);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Budget Manager</Text>

      {/* TOTAL CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Total Budget</Text>
        <Text style={styles.main}>RM {totalBudget.toFixed(2)}</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>Spent</Text>
            <Text style={styles.spentAmount}>RM {totalSpent.toFixed(2)}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.sub}>Remaining</Text>
            <Text style={[styles.remainAmount, remaining < 0 && styles.negative]}>
              RM {remaining.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* DATE */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Date</Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, globalDateMode === 'day' && styles.modeBtnActive]}
              onPress={() => setGlobalDateMode('day')}
            >
              <Text style={[styles.modeBtnText, globalDateMode === 'day' && styles.modeBtnTextActive]}>
                Day
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, globalDateMode === 'month' && styles.modeBtnActive]}
              onPress={() => setGlobalDateMode('month')}
            >
              <Text style={[styles.modeBtnText, globalDateMode === 'month' && styles.modeBtnTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => changeDateBy(-1)}>
            <Text style={styles.dateBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDisplayDate(globalSelectedDate)}</Text>
            <Text style={styles.dateModeHint}>
              {globalDateMode === 'day' ? 'Daily Budget' : 'Monthly Budget'}
            </Text>
          </View>

          <TouchableOpacity style={styles.dateBtn} onPress={() => changeDateBy(1)}>
            <Text style={styles.dateBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CATEGORIES */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
            <Text style={styles.addLink}>+ New</Text>
          </TouchableOpacity>
        </View>

        {categories.length === 0 && (
          <Text style={styles.emptyText}>No categories yet</Text>
        )}

        {categories.map(item => {
          // Pass date to getCategoryBudget and getCategorySpent
          const spent = getCategorySpent(item.id, globalSelectedDate, globalDateMode);
          const budget = getCategoryBudget(item, globalDateMode, globalSelectedDate);
          const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const iconSource = categoryIconMap[item.icon || 'money'] || categoryIconMap.money;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedCategory(item.id)}
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.active,
              ]}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Image source={iconSource} style={styles.categoryIconImage} />
                <Text style={styles.categoryName}>{item.name}</Text>
              </View>

              <View style={styles.categoryRight}>
                <Text style={styles.budgetText}>
                  RM {spent.toFixed(0)} / {budget.toFixed(0)}
                </Text>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>

                <View style={styles.actionRow}>
                  {/* Set Budget button */}
                  <TouchableOpacity onPress={() => openBudgetModal(item.id)}>
                    <Text style={styles.budgetBtn}>Set Budget</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setEditingCategory(item as any)}>
                    <Text style={styles.editBtn}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmDeleteCategory(item.id, item.name)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Month mode: show info banner instead of transaction section */}
      {globalDateMode === 'month' ? (
        <View style={styles.monthNotice}>
          <Text style={styles.monthNoticeTitle}>Monthly Budget Mode</Text>
          <Text style={styles.monthNoticeText}>
            Use "Set Budget" above to set each category's monthly budget.{'\n'}
            Switch to Day mode to add transactions.
          </Text>
        </View>
      ) : (
        <>
          {/* ADD TRANSACTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Transaction</Text>

            <TextInput
              placeholder="Amount"
              placeholderTextColor="#777"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              placeholder="Note"
              placeholderTextColor="#777"
              value={note}
              onChangeText={setNote}
              style={styles.input}
            />

            {!selectedCategory && (
              <Text style={styles.hintText}>↑ Tap a category above to select it</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, (!amount || !selectedCategory) && styles.btnDisabled]}
              onPress={handleAddTransaction}
              disabled={!amount || !selectedCategory}
            >
              <Text style={styles.btnText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>

          {/* TRANSACTIONS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transactions</Text>

            {filteredTransactions.length === 0 && (
              <Text style={styles.emptyText}>No transactions</Text>
            )}

            {filteredTransactions.map(item => (
              <View key={item.id} style={styles.transactionItem}>
                <View>
                  <Text style={styles.transactionTitle}>{item.categoryName}</Text>
                  <Text style={styles.transactionNote}>{item.note || 'No note'}</Text>
                  <Text style={styles.transactionDate}>{item.date}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.transactionAmount}>-RM {item.amount}</Text>
                  <TouchableOpacity onPress={() => confirmDeleteTransaction(item.id)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ADD CATEGORY MODAL */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Category</Text>

            <TextInput
              placeholder="Category Name"
              placeholderTextColor="#777"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={styles.input}
            />

            <Text style={styles.modalNote}>
               Budget is set per date — use "Set Budget" on each category after creating.
            </Text>

            <TouchableOpacity style={styles.btn} onPress={handleAddCategory}>
              <Text style={styles.btnText}>Create Category</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowCategoryModal(false);
                setNewCategoryName('');
              }}
            >
              <Text style={styles.close}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT CATEGORY MODAL (name only) */}
      <Modal visible={!!editingCategory} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Category</Text>

            <TextInput
              placeholder="Category Name"
              placeholderTextColor="#777"
              value={editingCategory?.name || ''}
              onChangeText={text =>
                setEditingCategory(prev => prev ? { ...prev, name: text } : null)
              }
              style={styles.input}
            />

            <TouchableOpacity style={styles.btn} onPress={saveEditCategory}>
              <Text style={styles.btnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditingCategory(null)}>
              <Text style={styles.close}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SET BUDGET MODAL */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set Budget</Text>

            <View style={styles.modalSubtitleRow}>
              <Image
                source={categoryIconMap[budgetModalCategory?.icon || 'money'] || categoryIconMap.money}
                style={styles.modalSubtitleIcon}
              />
              <Text style={styles.modalSubtitle}>{budgetModalCategory?.name}</Text>
            </View>

            <View style={styles.modalDateLabelRow}>
              <Image source={categoryIconMap.calendar} style={styles.modalDateLabelIcon} />
              <Text style={styles.modalDateLabel}>
                {globalDateMode === 'day' ? 'Daily budget for:' : 'Monthly budget for:'}
              </Text>
            </View>
            <Text style={styles.modalDateValue}>
              {globalDateMode === 'day'
                ? globalSelectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : globalSelectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              }
            </Text>

            <TextInput
              placeholder="Budget amount (RM)"
              placeholderTextColor="#777"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity style={styles.btn} onPress={saveBudget}>
              <Text style={styles.btnText}>Save Budget</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowBudgetModal(false);
                setBudgetCategoryId(null);
                setBudgetAmount('');
              }}
            >
              <Text style={styles.close}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 15 },
  card: { backgroundColor: '#15151C', borderRadius: 18, padding: 16, marginTop: 14 },
  label: { color: '#888', fontSize: 14 },
  main: { color: '#D4A017', fontSize: 32, fontWeight: 'bold', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  sub: { color: '#888', fontSize: 12 },
  spentAmount: { color: '#E74C3C', fontSize: 18, fontWeight: 'bold' },
  remainAmount: { color: '#2ECC71', fontSize: 18, fontWeight: 'bold' },
  negative: { color: '#E74C3C' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { color: '#D4A017', fontWeight: '700' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#0B0B0F', borderRadius: 10, padding: 4 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#D4A017' },
  modeBtnText: { color: '#777', fontWeight: '600' },
  modeBtnTextActive: { color: '#000' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  dateBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0B0B0F', justifyContent: 'center', alignItems: 'center' },
  dateBtnText: { color: '#D4A017', fontSize: 22, fontWeight: 'bold' },
  dateDisplay: { flex: 1, alignItems: 'center' },
  dateText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dateModeHint: { color: '#777', marginTop: 4 },
  categoryItem: { backgroundColor: '#0B0B0F', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 2, borderColor: 'transparent' },
  active: { borderColor: '#D4A017' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 10, marginRight: 10 },
  categoryIconImage: { width: 18, height: 18, marginRight: 8 },
  categoryName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  categoryRight: { marginTop: 12 },
  budgetText: { color: '#aaa', marginBottom: 8 },
  progressBar: { width: '100%', height: 8, backgroundColor: '#222', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D4A017' },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  budgetBtn: { color: '#2ECC71', fontWeight: '700' },
  editBtn: { color: '#D4A017', fontWeight: '700' },
  deleteBtn: { color: '#E74C3C', fontWeight: '700' },
  input: { backgroundColor: '#0B0B0F', borderRadius: 12, padding: 14, color: '#fff', marginTop: 12 },
  btn: { backgroundColor: '#D4A017', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  hintText: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 10 },
  emptyText: { color: '#777', textAlign: 'center', marginTop: 16 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  transactionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  transactionNote: { color: '#888', marginTop: 4 },
  transactionDate: { color: '#666', marginTop: 4, fontSize: 12 },
  transactionAmount: { color: '#E74C3C', fontWeight: '700', fontSize: 16 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#15151C', borderRadius: 18, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  modalSubtitleIcon: { width: 18, height: 18 },
  modalSubtitle: { color: '#D4A017', fontSize: 18, fontWeight: '700' },
  modalNote: { color: '#666', fontSize: 13, marginTop: 12, lineHeight: 18 },
  modalDateLabel: { color: '#888', fontSize: 13},
  modalDateValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  close: { color: '#888', textAlign: 'center', marginTop: 14 },
  monthNotice: { backgroundColor: '#15151C', borderRadius: 18, padding: 24, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#D4A01733' },
  monthNoticeTitle: { color: '#D4A017', fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center', width: '100%' },
  monthNoticeText: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, width: '100%' },
  modalDateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  modalDateLabelIcon: { width: 14, height: 14 },
});