'use client';

import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/context';
import { getMonthSummary, getYearSummary } from '@/lib/analytics';

const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function BudgetPage() {
  const { data } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<'month' | 'year'>('month');

  const currency = data.settings.currency;

  const monthSummary = useMemo(
    () => getMonthSummary(data.transactions, year, month, data.settings.expenseCategories),
    [data, year, month]
  );
  const yearSummary = useMemo(
    () => getYearSummary(data.transactions, year, data.settings.expenseCategories),
    [data, year]
  );

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const activeSummary = mode === 'month' ? monthSummary : yearSummary;

  // 収入カテゴリ別集計
  const incomeByCategory = useMemo(() => {
    const incomeTx = data.transactions.filter((t) => {
      if (t.type !== 'income') return false;
      const d = new Date(t.date);
      if (mode === 'month') {
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }
      return d.getFullYear() === year;
    });
    const map = new Map<string, number>();
    incomeTx.forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data.transactions, year, month, mode]);

  const balance = activeSummary.incomeTotal - activeSummary.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">収支</h2>
        <p className="text-sm text-gray-400">収入と支出の管理</p>
      </div>

      {/* Mode */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('month')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            mode === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          月別
        </button>
        <button
          onClick={() => setMode('year')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            mode === 'year' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          年間
        </button>
      </div>

      {/* Selectors */}
      <div className="flex gap-2">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[48px]"
        >
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        {mode === 'month' && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[48px]"
          >
            {MONTHS_JA.map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* 収入 */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-1 text-green-600 text-xs mb-2">
            <TrendingUp size={13} />
            収入
          </div>
          <p className="text-base font-bold text-green-700 leading-tight">
            {formatCurrency(activeSummary.incomeTotal, currency)}
          </p>
        </div>

        {/* 支出 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
            <TrendingDown size={13} />
            支出
          </div>
          <p className="text-base font-bold text-gray-900 leading-tight">
            {formatCurrency(activeSummary.total, currency)}
          </p>
        </div>

        {/* 残高 */}
        <div className={`rounded-2xl p-4 border ${
          activeSummary.incomeTotal === 0
            ? 'bg-gray-50 border-gray-100'
            : balance < 0
            ? 'bg-red-50 border-red-100'
            : 'bg-blue-50 border-blue-100'
        }`}>
          <div className="flex items-center gap-1 text-xs mb-2 text-gray-400">
            <Wallet size={13} />
            残高
          </div>
          {activeSummary.incomeTotal === 0 ? (
            <p className="text-xs text-gray-400">---</p>
          ) : (
            <p className={`text-base font-bold leading-tight ${balance < 0 ? 'text-red-600' : 'text-blue-700'}`}>
              {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance), currency)}
            </p>
          )}
        </div>
      </div>

      {/* 支出カテゴリ別内訳 */}
      {activeSummary.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">支出カテゴリ別内訳</h3>
          <div className="space-y-3">
            {activeSummary.byCategory.map(({ category, amount, percentage, color }) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{category}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(amount, currency)}
                    <span className="text-xs text-gray-400 ml-1">({percentage}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 収入カテゴリ別内訳 */}
      {incomeByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">収入カテゴリ別内訳</h3>
          <div className="space-y-3">
            {incomeByCategory.map(({ category, amount }) => {
              const cat = data.settings.incomeCategories.find((c) => c.name === category);
              const color = cat?.color ?? '#4CAF50';
              const pct = activeSummary.incomeTotal > 0
                ? Math.round((amount / activeSummary.incomeTotal) * 1000) / 10
                : 0;
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(amount, currency)}
                      <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSummary.total === 0 && activeSummary.incomeTotal === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm">この期間のデータがありません</p>
        </div>
      )}
    </div>
  );
}
