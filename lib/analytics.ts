import { Transaction, Budget, CATEGORY_COLORS } from '@/types';

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
  byCategory: CategorySummary[];
  byUser: { user1: number; user2: number };
  budget: number | null;
  remaining: number | null;
  deficit: number | null;
}

export interface YearSummary {
  year: number;
  total: number;
  byCategory: CategorySummary[];
  byMonth: { month: number; label: string; amount: number }[];
  byUser: { user1: number; user2: number };
  budget: number | null;
  remaining: number | null;
  deficit: number | null;
}

function buildCategorySummary(transactions: Transaction[]): CategorySummary[] {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const map = new Map<string, number>();
  transactions.forEach((t) => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] ?? '#BDBDBD',
      percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthSummary(
  transactions: Transaction[],
  budgets: Budget[],
  year: number,
  month: number
): MonthSummary {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const byCategory = buildCategorySummary(filtered);
  const user1Total = filtered.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = filtered.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);

  const budget =
    budgets.find((b) => b.year === year && b.month === month && b.category === null)?.amount ?? null;

  const remaining = budget !== null ? budget - total : null;
  const deficit = remaining !== null && remaining < 0 ? Math.abs(remaining) : null;

  return {
    year,
    month,
    label: `${year}年${month}月`,
    total,
    byCategory,
    byUser: { user1: user1Total, user2: user2Total },
    budget,
    remaining,
    deficit,
  };
}

export function getYearSummary(
  transactions: Transaction[],
  budgets: Budget[],
  year: number
): YearSummary {
  const filtered = transactions.filter((t) => new Date(t.date).getFullYear() === year);
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const byCategory = buildCategorySummary(filtered);
  const user1Total = filtered.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = filtered.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const monthTx = filtered.filter((t) => new Date(t.date).getMonth() + 1 === m);
    return {
      month: m,
      label: `${m}月`,
      amount: monthTx.reduce((s, t) => s + t.amount, 0),
    };
  });

  const budget =
    budgets.find((b) => b.year === year && b.month === null && b.category === null)?.amount ?? null;

  const remaining = budget !== null ? budget - total : null;
  const deficit = remaining !== null && remaining < 0 ? Math.abs(remaining) : null;

  return {
    year,
    total,
    byCategory,
    byMonth,
    byUser: { user1: user1Total, user2: user2Total },
    budget,
    remaining,
    deficit,
  };
}

export function getAllTimeSummary(
  transactions: Transaction[],
  budgets: Budget[]
): {
  total: number;
  byCategory: CategorySummary[];
  byUser: { user1: number; user2: number };
  byYear: { year: number; amount: number }[];
} {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const byCategory = buildCategorySummary(transactions);
  const user1Total = transactions.filter((t) => t.user === 'user1').reduce((s, t) => s + t.amount, 0);
  const user2Total = transactions.filter((t) => t.user === 'user2').reduce((s, t) => s + t.amount, 0);

  const yearMap = new Map<number, number>();
  transactions.forEach((t) => {
    const y = new Date(t.date).getFullYear();
    yearMap.set(y, (yearMap.get(y) ?? 0) + t.amount);
  });
  const byYear = Array.from(yearMap.entries())
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => a.year - b.year);

  void budgets; // future use
  return { total, byCategory, byUser: { user1: user1Total, user2: user2Total }, byYear };
}
