import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { categoryIconMap } from '../utils/categoriesIcons';

// UNIFIED HISTORY ENTRY TYPE
type HistoryEntry =
  | {
      kind: 'transaction';
      id: string;
      date: string;
      categoryId: string;
      categoryName: string;
      categoryIcon: string;
      categoryColor: string;
      amount: number;
      note: string;
    }
  | {
      kind: 'budget';
      id: string;
      date: string; // "2025-05-15" or "2025-05"
      dateMode: 'day' | 'month';
      categoryId: string;
      categoryName: string;
      categoryIcon: string;
      categoryColor: string;
      amount: number;
    };

type FilterTab = 'all' | 'spend' | 'budget';

export default function HistoryScreen() {
  const { transactions, categories } = useApp();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // BUILD BUDGET ENTRIES from category dict
  // dailyBudget:   { "2025-05-15": 50 }
  // monthlyBudget: { "2025-05": 1500 }
  const budgetEntries = useMemo((): HistoryEntry[] => {
    const entries: HistoryEntry[] = [];

    categories.forEach(cat => {
      // Daily budgets
      Object.entries(cat.dailyBudget || {}).forEach(([dateKey, amount]) => {
        if (amount > 0) {
          entries.push({
            kind: 'budget',
            id: `budget-day-${cat.id}-${dateKey}`,
            date: dateKey,
            dateMode: 'day',
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon || 'money',
            categoryColor: cat.color,
            amount,
          });
        }
      });

      // Monthly budgets — stored as "2025-05", display as "2025-05-01" for sorting
      Object.entries(cat.monthlyBudget || {}).forEach(([monthKey, amount]) => {
        if (amount > 0) {
          entries.push({
            kind: 'budget',
            id: `budget-month-${cat.id}-${monthKey}`,
            date: `${monthKey}-01`, // normalise for sorting
            dateMode: 'month',
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon || 'money',
            categoryColor: cat.color,
            amount,
          });
        }
      });
    });

    return entries;
  }, [categories]);

  // BUILD TRANSACTION ENTRIES
  const transactionEntries = useMemo((): HistoryEntry[] => {
    return transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return {
        kind: 'transaction',
        id: t.id,
        date: t.date,
        categoryId: t.categoryId,
        // Prefer the category's current name; fall back to the saved name if it was deleted, then to Uncategorized
        categoryName: cat?.name || t.categoryName || 'Uncategorized',
        categoryIcon: cat?.icon || 'money',
        categoryColor: cat?.color || '#D4A017',
        amount: t.amount,
        note: t.note,
      };
    });
  }, [transactions, categories]);

  // MERGE + FILTER BY TAB
  const allEntries = useMemo((): HistoryEntry[] => {
    let entries: HistoryEntry[] = [];

    if (activeTab === 'all' || activeTab === 'spend') {
      entries = entries.concat(transactionEntries);
    }
    if (activeTab === 'all' || activeTab === 'budget') {
      entries = entries.concat(budgetEntries);
    }

    return entries;
  }, [activeTab, transactionEntries, budgetEntries]);

  // SEARCH FILTER
  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;

    const q = search.toLowerCase();

    return allEntries.filter(entry => {
      if (entry.kind === 'transaction') {
        return (
          entry.categoryName.toLowerCase().includes(q) ||
          (entry.note || '').toLowerCase().includes(q) ||
          entry.amount.toString().includes(q) ||
          entry.date.includes(q)
        );
      } else {
        return (
          entry.categoryName.toLowerCase().includes(q) ||
          entry.amount.toString().includes(q) ||
          entry.date.includes(q)
        );
      }
    });
  }, [allEntries, search]);

  // GROUP BY DATE (descending)
  const grouped = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};

    filtered.forEach(entry => {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    });

    return groups;
  }, [filtered]);

  const groupKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  // STATS
  const totalSpend = useMemo(
    () => transactionEntries.reduce((s, e) => s + e.amount, 0),
    [transactionEntries]
  );

  const totalBudgetSet = useMemo(
    () => budgetEntries.reduce((s, e) => s + e.amount, 0),
    [budgetEntries]
  );

  // FORMAT GROUP HEADER
  const formatGroupHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Check if any entry in this group is a monthly budget
    const entries = grouped[dateStr] || [];
    const hasMonthBudget = entries.some(
      e => e.kind === 'budget' && (e as any).dateMode === 'month'
    );
    const hasNonMonthBudget = entries.some(
      e => e.kind === 'transaction' || (e.kind === 'budget' && (e as any).dateMode === 'day')
    );

    if (hasMonthBudget && !hasNonMonthBudget) {
      return `${months[month - 1]} ${year}`;
    }

    return `${months[month - 1]} ${day}, ${year}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>History</Text>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={[styles.statValue, { color: '#E74C3C' }]}>
            RM {totalSpend.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Budgets Set</Text>
          <Text style={[styles.statValue, { color: '#2ECC71' }]}>
            RM {totalBudgetSet.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Entries</Text>
          <Text style={[styles.statValue, { color: '#D4A017' }]}>
            {allEntries.length}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <Image source={categoryIconMap.search} style={styles.searchIconImage} />
        <TextInput
          style={styles.search}
          placeholder="Search by category, note, amount..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Image source={categoryIconMap.all} style={styles.tabIconImage} />
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'spend' && styles.tabActive]}
          onPress={() => setActiveTab('spend')}
        >
          <Image source={categoryIconMap.spending} style={styles.tabIconImage} />
          <Text style={[styles.tabText, activeTab === 'spend' && styles.tabTextActive]}>
            Spend
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'budget' && styles.tabActive]}
          onPress={() => setActiveTab('budget')}
        >
          <Image source={categoryIconMap.money} style={styles.tabIconImage} />
          <Text style={[styles.tabText, activeTab === 'budget' && styles.tabTextActive]}>
            Budget
          </Text>
        </TouchableOpacity>
      </View>

      {/* RESULTS COUNT */}
      {search.trim().length > 0 && (
        <Text style={styles.resultCount}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </Text>
      )}

      {/* GROUPED ENTRIES */}
      {groupKeys.map(dateKey => (
        <View key={dateKey} style={styles.group}>
          {/* GROUP HEADER */}
          <View style={styles.groupHeader}>
            <Text style={styles.groupDate}>{formatGroupHeader(dateKey)}</Text>
            <Text style={styles.groupTotal}>
              {(() => {
                const entries = grouped[dateKey];
                const daySpend = entries
                  .filter(e => e.kind === 'transaction')
                  .reduce((s, e) => s + e.amount, 0);
                if (daySpend > 0) return `-RM ${daySpend.toFixed(2)}`;
                return '';
              })()}
            </Text>
          </View>

          {grouped[dateKey].map(entry => {
            const iconSource = categoryIconMap[entry.categoryIcon] || categoryIconMap.money;

            if (entry.kind === 'transaction') {
              return (
                <View key={entry.id} style={styles.card}>
                  {/* LEFT: icon + info */}
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: entry.categoryColor + '22' }]}>
                      <Image source={iconSource} style={styles.iconImage} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>
                        {entry.note || entry.categoryName}
                      </Text>
                      <View style={styles.tagRow}>
                        <View style={[styles.tag, { backgroundColor: entry.categoryColor + '33' }]}>
                          <Image source={iconSource} style={styles.tagIcon} />
                          <Text style={styles.tagText}>{entry.categoryName}</Text>
                        </View>
                        <View style={styles.typeTagSpend}>
                          <Image source={categoryIconMap.spending} style={styles.typeTagIcon} />
                          <Text style={styles.typeTagSpendText}>Spent</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* RIGHT: amount */}
                  <Text style={styles.spendAmount}>
                    -RM {entry.amount.toFixed(2)}
                  </Text>
                </View>
              );
            }

            // Budget entry
            return (
              <View key={entry.id} style={[styles.card, styles.budgetCard]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#2ECC7122' }]}>
                    <Image source={iconSource} style={styles.iconImage} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{entry.categoryName}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.typeTagBudget}>
                        <Image source={categoryIconMap.calendar} style={styles.typeTagIcon} />
                        <Text style={styles.typeTagBudgetText}>
                          {entry.dateMode === 'day' ? 'Daily Budget' : 'Monthly Budget'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.budgetAmount}>
                  +RM {entry.amount.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      {/* EMPTY STATE */}
      {groupKeys.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {search.trim() ? 'No results found' : 'No records yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? 'Try a different search term'
              : 'Add transactions or set budgets to see them here'}
          </Text>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 30,
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#15151C',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },

  statLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
  },

  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // SEARCH
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151C',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  search: {
    flex: 1,
    paddingVertical: 13,
    color: '#fff',
    fontSize: 14,
  },

  clearBtn: {
    color: '#555',
    fontSize: 16,
    paddingLeft: 8,
  },

  // TABS
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#15151C',
  },

  tabActive: {
    backgroundColor: '#D4A017',
  },

  tabIconImage: {
    width: 16,
    height: 16,
  },

  tabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },

  tabTextActive: {
    color: '#000',
  },

  // RESULT COUNT
  resultCount: {
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
    marginTop: 4,
  },

  // GROUP
  group: {
    marginTop: 18,
  },

  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  groupDate: {
    color: '#8B8B99',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  groupTotal: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '700',
  },

  // CARD
  card: {
    backgroundColor: '#15151C',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  budgetCard: {
    borderLeftWidth: 2,
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconImage: {
    width: 22,
    height: 22,
  },

  cardInfo: {
    flex: 1,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  tagIcon: {
    width: 12,
    height: 12,
  },

  tagText: {
    color: '#f7a800',
    fontSize: 11,
    fontWeight: '600',
  },

  typeTagIcon: {
    width: 12,
    height: 12,
  },

  typeTagSpend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E74C3C22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  typeTagSpendText: {
    color: '#E74C3C',
    fontSize: 11,
    fontWeight: '600',
  },

  typeTagBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2ECC7122',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  typeTagBudgetText: {
    color: '#2ECC71',
    fontSize: 11,
    fontWeight: '600',
  },

  // AMOUNTS
  spendAmount: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },

  budgetAmount: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },

  // EMPTY
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

searchIconImage: {
 width: 16,
 height: 16,
 marginRight: 8,
 },
 
});