import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

// TYPES
type Transaction = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  note: string;
  date: string;
  timestamp: number;
};

type Category = {
  id: string;
  name: string;
  icon?: string;
  color: string;
  // KEY FORMAT:
  // dailyBudget:   { "2025-05-15": 50 }
  // monthlyBudget: { "2025-05": 1500 }
  dailyBudget: Record<string, number>;
  monthlyBudget: Record<string, number>;
};

type AppState = {
  transactions: Transaction[];
  categories: Category[];
};

// DEFAULT CATEGORIES — all budgets start at 0 (empty dict)
const defaultCategories: Category[] = [
  {
    id: 'food',
    name: 'Food',
    icon: 'money',
    color: '#E24A4A',
    dailyBudget: {},
    monthlyBudget: {},
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'money',
    color: '#4A90E2',
    dailyBudget: {},
    monthlyBudget: {},
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'money',
    color: '#9B59B6',
    dailyBudget: {},
    monthlyBudget: {},
  },
  {
    id: 'daily',
    name: 'Daily',
    icon: 'money',
    color: '#F39C12',
    dailyBudget: {},
    monthlyBudget: {},
  },
];

// DATE KEY HELPERS
export const getDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getMonthKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// CONTEXT TYPE
type AppContextType = {
  transactions: Transaction[];
  categories: Category[];

  globalSelectedDate: Date;
  globalDateMode: 'day' | 'month';
  setGlobalSelectedDate: (date: Date) => void;
  setGlobalDateMode: (mode: 'day' | 'month') => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Omit<Category, 'dailyBudget' | 'monthlyBudget'>> & {
    name?: string;
    icon?: string;
    color?: string;
  }) => void;
  deleteCategory: (id: string) => void;

  // Set budget for a specific date
  setCategoryBudget: (
    categoryId: string,
    mode: 'day' | 'month',
    date: Date,
    amount: number
  ) => void;

  resetData: () => void;

  getCategorySpent: (categoryId: string, date: Date, mode: 'day' | 'month') => number;
  getCategoryBudget: (category: Category, mode: 'day' | 'month', date: Date) => number;
  getFilteredTransactions: (date: Date, mode: 'day' | 'month') => Transaction[];
  getTotalBudget: (mode: 'day' | 'month', date: Date) => number;
  getTotalSpent: (date: Date, mode: 'day' | 'month') => number;
};

// CONTEXT
const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_BASE = '@budget_manager_data_v2';

// One storage key per account, scoped by uid, so accounts never see each other's data
const getStorageKey = (userId: string) => `${STORAGE_KEY_BASE}:${userId}`;

export function AppProvider({ children }: any) {
  const [state, setState] = useState<AppState>({
    transactions: [],
    categories: defaultCategories,
  });

  const [globalSelectedDate, setGlobalSelectedDate] = useState(new Date());
  const [globalDateMode, setGlobalDateMode] = useState<'day' | 'month'>('month');

  // uid of the signed-in user
  const [uid, setUid] = useState<string | null>(auth().currentUser?.uid ?? null);

  // uid whose data has finished loading. Saving waits for it, otherwise the
  // empty in-memory defaults would be written first and overwrite that account's data
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const { transactions, categories } = state;

  // Track account changes (sign in / sign out)
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      const newUid = firebaseUser?.uid ?? null;

      console.log(`Auth state changed. uid: ${newUid}`);
      setUid(newUid);

      if (!newUid) {
        // Clear in-memory data on sign-out so the previous account's data never flashes
        setState({ transactions: [], categories: defaultCategories });
      }
    });
    return unsubscribe;
  }, []);

  // LOAD FROM STORAGE: reloads whenever the uid changes
  useEffect(() => {
    if (!uid) return; // Not signed in: nothing to load

    let cancelled = false;

    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(getStorageKey(uid));
        if (cancelled) return; // Account changed while loading; drop the stale result

        if (jsonValue != null) {
          const savedData = JSON.parse(jsonValue);

          const loadedCategories = (savedData.categories || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            // Support migration from old format (number → dict)
            dailyBudget: typeof c.dailyBudget === 'object' && !Array.isArray(c.dailyBudget)
              ? c.dailyBudget
              : {},
            monthlyBudget: typeof c.monthlyBudget === 'object' && !Array.isArray(c.monthlyBudget)
              ? c.monthlyBudget
              : {},
          }));

          setState({
            transactions: savedData.transactions || [],
            categories: loadedCategories.length > 0 ? loadedCategories : defaultCategories,
          });

          console.log(`Data loaded for uid: ${uid}`);
        } else {
          // No local data for this account yet; start fresh
          setState({ transactions: [], categories: defaultCategories });
          console.log(`No existing data for uid: ${uid}, starting fresh`);
        }

        setLoadedUid(uid);
      } catch (e) {
        // Don't mark as loaded on failure, so empty data never overwrites what's stored
        console.error('Failed to load data:', e);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // SAVE TO STORAGE: scoped to the uid as well
  useEffect(() => {
    if (!uid) return; // Not signed in: nothing to save
    if (loadedUid !== uid) return; // This account's data hasn't loaded yet

    const saveData = async () => {
      try {
        const jsonValue = JSON.stringify(state);
        await AsyncStorage.setItem(getStorageKey(uid), jsonValue);
        console.log(` Data saved for uid: ${uid}`);
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [state, uid, loadedUid]);

  // FILTER TRANSACTIONS BY DATE
  const getFilteredTransactions = (date: Date, mode: 'day' | 'month'): Transaction[] => {
    return transactions.filter(t => {
      const parts = t.date.split('-');
      const tYear = parseInt(parts[0], 10);
      const tMonth = parseInt(parts[1], 10);
      const tDay = parseInt(parts[2], 10);

      if (mode === 'day') {
        return (
          tYear === date.getFullYear() &&
          tMonth === date.getMonth() + 1 &&
          tDay === date.getDate()
        );
      }

      return (
        tYear === date.getFullYear() &&
        tMonth === date.getMonth() + 1
      );
    });
  };

  // GET CATEGORY BUDGET (for a specific date)
  // Returns 0 if no budget set for that date
  const getCategoryBudget = (category: Category, mode: 'day' | 'month', date: Date): number => {
    if (mode === 'day') {
      const key = getDayKey(date);
      return category.dailyBudget[key] ?? 0;
    } else {
      const key = getMonthKey(date);
      return category.monthlyBudget[key] ?? 0;
    }
  };

  // GET CATEGORY SPENT
  const getCategorySpent = (categoryId: string, date: Date, mode: 'day' | 'month'): number => {
    const filtered = getFilteredTransactions(date, mode);
    return filtered
      .filter(t => t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // GET TOTAL BUDGET (sum of all categories for the date)
  const getTotalBudget = (mode: 'day' | 'month', date: Date): number => {
    return categories.reduce((sum, c) => sum + getCategoryBudget(c, mode, date), 0);
  };

  // GET TOTAL SPENT
  const getTotalSpent = (date: Date, mode: 'day' | 'month'): number => {
    return getFilteredTransactions(date, mode).reduce((sum, t) => sum + t.amount, 0);
  };

  // ADD TRANSACTION
  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      transactions: [
        { ...tx, id: Date.now().toString(), timestamp: new Date(tx.date).getTime() },
        ...prev.transactions,
      ],
    }));
  };

  // DELETE TRANSACTION
  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  // ADD CATEGORY
  const addCategory = (cat: Omit<Category, 'id'>) => {
    setState(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          ...cat,
          id: Date.now().toString(),
          dailyBudget: {},
          monthlyBudget: {},
        },
      ],
    }));
  };

  // UPDATE CATEGORY (name / icon / color only)
  const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'dailyBudget' | 'monthlyBudget'>>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === id ? { ...c, ...data } : c
      ),
    }));
  };

  // SET BUDGET FOR A DATE
  const setCategoryBudget = (
    categoryId: string,
    mode: 'day' | 'month',
    date: Date,
    amount: number
  ) => {
    const key = mode === 'day' ? getDayKey(date) : getMonthKey(date);

    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => {
        if (c.id !== categoryId) return c;

        if (mode === 'day') {
          return {
            ...c,
            dailyBudget: { ...c.dailyBudget, [key]: amount },
          };
        } else {
          return {
            ...c,
            monthlyBudget: { ...c.monthlyBudget, [key]: amount },
          };
        }
      }),
    }));

    console.log(` Budget set: ${categoryId} ${mode} ${key} = ${amount}`);
  };

  // DELETE CATEGORY
  const deleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      transactions: prev.transactions.filter(t => t.categoryId !== id),
    }));
  };

  // RESET: clears only the current account's data
  const resetData = async () => {
    setState({ transactions: [], categories: defaultCategories });
    try {
      if (uid) {
        await AsyncStorage.removeItem(getStorageKey(uid));
      }
    } catch (e) {
      console.error('Failed to reset data:', e);
    }
  };

  // PROVIDER
  return (
    <AppContext.Provider
      value={{
        transactions,
        categories,

        globalSelectedDate,
        globalDateMode,
        setGlobalSelectedDate,
        setGlobalDateMode,

        addTransaction,
        deleteTransaction,

        addCategory,
        updateCategory,
        deleteCategory,
        setCategoryBudget,

        resetData,

        getCategorySpent,
        getCategoryBudget,
        getFilteredTransactions,
        getTotalBudget,
        getTotalSpent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// HOOK
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}