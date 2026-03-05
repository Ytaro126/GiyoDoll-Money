export type User = 'user1' | 'user2' | 'giyodoll';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  category: string;
  description: string;
  user: User;
  amount: number;
  type: TransactionType;
}

export interface Budget {
  id: string;
  year: number;
  month: number | null; // null = yearly budget
  category: string | null; // null = total budget
  amount: number;
}

export interface CustomCategory {
  name: string;
  color: string;
}

export interface AppSettings {
  user1Name: string;
  user2Name: string;
  currency: string;
  user1Icon: string | null;
  user2Icon: string | null;
  giyodollIcon: string | null;
  expenseCategories: CustomCategory[];
  incomeCategories: CustomCategory[];
}

export interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
  settings: AppSettings;
}

export const CATEGORIES = [
  '食費',
  '外食',
  '日用品',
  '交通費',
  '光熱費',
  '通信費',
  '娯楽',
  '医療',
  '衣類',
  '住居費',
  '貯蓄',
  'その他',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  食費: '#FF6384',
  外食: '#FF9F40',
  日用品: '#FFCD56',
  交通費: '#4BC0C0',
  光熱費: '#36A2EB',
  通信費: '#9966FF',
  娯楽: '#FF6384',
  医療: '#FF99CC',
  衣類: '#66BB6A',
  住居費: '#29B6F6',
  貯蓄: '#26C6DA',
  その他: '#BDBDBD',
};

export const DEFAULT_EXPENSE_CATEGORIES: CustomCategory[] = CATEGORIES.map((name) => ({
  name,
  color: CATEGORY_COLORS[name] ?? '#BDBDBD',
}));

export const DEFAULT_INCOME_CATEGORIES: CustomCategory[] = [
  { name: '給与', color: '#4CAF50' },
  { name: '副業', color: '#8BC34A' },
  { name: 'その他収入', color: '#CDDC39' },
];
