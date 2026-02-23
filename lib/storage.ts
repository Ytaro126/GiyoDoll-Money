import { AppData, AppSettings, Transaction, Budget } from '@/types';

const STORAGE_KEY = 'giyodoll_money_data';

const defaultSettings: AppSettings = {
  user1Name: 'ユーザー1',
  user2Name: 'ユーザー2',
  currency: '¥',
};

const defaultData: AppData = {
  transactions: [],
  budgets: [],
  settings: defaultSettings,
};

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addTransaction(tx: Omit<Transaction, 'id'>): AppData {
  const data = loadData();
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
  };
  const updated = { ...data, transactions: [...data.transactions, newTx] };
  saveData(updated);
  return updated;
}

export function updateTransaction(id: string, tx: Partial<Transaction>): AppData {
  const data = loadData();
  const updated = {
    ...data,
    transactions: data.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)),
  };
  saveData(updated);
  return updated;
}

export function deleteTransaction(id: string): AppData {
  const data = loadData();
  const updated = {
    ...data,
    transactions: data.transactions.filter((t) => t.id !== id),
  };
  saveData(updated);
  return updated;
}

export function upsertBudget(budget: Omit<Budget, 'id'> & { id?: string }): AppData {
  const data = loadData();
  const existing = data.budgets.find(
    (b) => b.year === budget.year && b.month === budget.month && b.category === budget.category
  );
  let budgets: Budget[];
  if (existing) {
    budgets = data.budgets.map((b) =>
      b.id === existing.id ? { ...b, amount: budget.amount } : b
    );
  } else {
    budgets = [...data.budgets, { ...budget, id: budget.id ?? crypto.randomUUID() }];
  }
  const updated = { ...data, budgets };
  saveData(updated);
  return updated;
}

export function updateSettings(settings: Partial<AppSettings>): AppData {
  const data = loadData();
  const updated = { ...data, settings: { ...data.settings, ...settings } };
  saveData(updated);
  return updated;
}

export function formatCurrency(amount: number, currency = '¥'): string {
  return `${currency}${amount.toLocaleString('ja-JP')}`;
}
