import { Transaction, CustomCategory, DEFAULT_EXPENSE_CATEGORIES } from '@/types';

export interface CategorySummary {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  label: string;
  total: number;
  incomeTotal: number;
  byCategory: CategorySummary[];
  byUser: { user1: number; user2: number; giyodoll: number };
  budget: number | null;
  remaining: number | null;
  deficit: number | null;
}

export interface YearSummary {
  year: number;
  total: number;
  incomeTotal: number;
  byCategory: CategorySummary[];
  byMonth: { month: number; label: string; amount: number; income: number }[];
  byUser: { user1: number; user2: number; giyodoll: number };
  budget: number | null;
  remaining: number | null;
  deficit: number | null;
}

function buildCategorySummary(
  transactions: Transaction[],
  categoryColors: Record<string, string>
): CategorySummary[] {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const map = new Map<string, number>();
  transactions.forEach((t) => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: categoryColors[category] ?? '#BDBDBD',
      percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildColorMap(categories: CustomCategory[]): Record<string, string> {
  const map: Record<string, string> = {};
  categories.forEach((c) => { map[c.name] = c.color; });
  return map;
}

export function getMonthSummary(
  transactions: Transaction[],
  year: number,
  month: number,
  expenseCategories?: CustomCategory[]
): MonthSummary {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const expenses = filtered.filter((t) => (t.type ?? 'expense') === 'expense');
  const incomes = filtered.filter((t) => t.type === 'income');

  const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);

  const colorMap = buildColorMap(expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES);
  const byCategory = buildCategorySummary(expenses, colorMap);

  const user1Total = expenses.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = expenses.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);
  const giyodollTotal = expenses.filter((t) => t.user === 'giyodoll').reduce((s, t) => s + t.amount, 0);

  const budget = incomeTotal > 0 ? incomeTotal : null;
  const remaining = budget !== null ? budget - expenseTotal : null;
  const deficit = remaining !== null && remaining < 0 ? Math.abs(remaining) : null;

  return {
    year,
    month,
    label: `${year}年${month}月`,
    total: expenseTotal,
    incomeTotal,
    byCategory,
    byUser: { user1: user1Total, user2: user2Total, giyodoll: giyodollTotal },
    budget,
    remaining,
    deficit,
  };
}

export function getYearSummary(
  transactions: Transaction[],
  year: number,
  expenseCategories?: CustomCategory[]
): YearSummary {
  const filtered = transactions.filter((t) => new Date(t.date).getFullYear() === year);

  const expenses = filtered.filter((t) => (t.type ?? 'expense') === 'expense');
  const incomes = filtered.filter((t) => t.type === 'income');

  const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);

  const colorMap = buildColorMap(expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES);
  const byCategory = buildCategorySummary(expenses, colorMap);

  const user1Total = expenses.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = expenses.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);
  const giyodollTotal = expenses.filter((t) => t.user === 'giyodoll').reduce((s, t) => s + t.amount, 0);

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const monthExpenses = expenses.filter((t) => new Date(t.date).getMonth() + 1 === m);
    const monthIncomes = incomes.filter((t) => new Date(t.date).getMonth() + 1 === m);
    return {
      month: m,
      label: `${m}月`,
      amount: monthExpenses.reduce((s, t) => s + t.amount, 0),
      income: monthIncomes.reduce((s, t) => s + t.amount, 0),
    };
  });

  const budget = incomeTotal > 0 ? incomeTotal : null;
  const remaining = budget !== null ? budget - expenseTotal : null;
  const deficit = remaining !== null && remaining < 0 ? Math.abs(remaining) : null;

  return {
    year,
    total: expenseTotal,
    incomeTotal,
    byCategory,
    byMonth,
    byUser: { user1: user1Total, user2: user2Total, giyodoll: giyodollTotal },
    budget,
    remaining,
    deficit,
  };
}

export function getAllTimeSummary(
  transactions: Transaction[],
  expenseCategories?: CustomCategory[]
): {
  total: number;
  incomeTotal: number;
  byCategory: CategorySummary[];
  byUser: { user1: number; user2: number; giyodoll: number };
  byYear: { year: number; amount: number; income: number }[];
} {
  const expenses = transactions.filter((t) => (t.type ?? 'expense') === 'expense');
  const incomes = transactions.filter((t) => t.type === 'income');

  const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);

  const colorMap = buildColorMap(expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES);
  const byCategory = buildCategorySummary(expenses, colorMap);

  const user1Total = expenses.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = expenses.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);
  const giyodollTotal = expenses.filter((t) => t.user === 'giyodoll').reduce((s, t) => s + t.amount, 0);

  const yearMap = new Map<number, { expense: number; income: number }>();
  transactions.forEach((t) => {
    const y = new Date(t.date).getFullYear();
    const existing = yearMap.get(y) ?? { expense: 0, income: 0 };
    if ((t.type ?? 'expense') === 'expense') {
      yearMap.set(y, { ...existing, expense: existing.expense + t.amount });
    } else {
      yearMap.set(y, { ...existing, income: existing.income + t.amount });
    }
  });
  const byYear = Array.from(yearMap.entries())
    .map(([year, { expense, income }]) => ({ year, amount: expense, income }))
    .sort((a, b) => a.year - b.year);

  return {
    total: expenseTotal,
    incomeTotal,
    byCategory,
    byUser: { user1: user1Total, user2: user2Total, giyodoll: giyodollTotal },
    byYear,
  };
}
