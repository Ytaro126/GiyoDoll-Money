'use client';

import { useState, useMemo } from 'react';
import { PiggyBank, AlertTriangle, TrendingDown } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/storage';
import { getMonthSummary, getYearSummary } from '@/lib/analytics';
import BudgetBar from '@/components/BudgetBar';
import { CATEGORIES } from '@/types';

const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function BudgetPage() {
  const { data, upsertBudgetEntry } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<'month' | 'year'>('month');

  const currency = data.settings.currency;

  const monthSummary = useMemo(
    () => getMonthSummary(data.transactions, data.budgets, year, month),
    [data, year, month]
  );
  const yearSummary = useMemo(
    () => getYearSummary(data.transactions, data.budgets, year),
    [data, year]
  );

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const getBudget = (y: number, m: number | null, cat: string | null) =>
    data.budgets.find((b) => b.year === y && b.month === m && b.category === cat)?.amount ?? 0;

  const handleBudgetChange = (value: string, cat: string | null, m: number | null) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    upsertBudgetEntry({ year, month: mode === 'month' ? m ?? month : null, category: cat, amount });
  };

  const activeSummary = mode === 'month' ? monthSummary : yearSummary;
  const activeMonthKey = mode === 'month' ? month : null;

  // Category spent for current period
  const getCategorySpent = (cat: string) => {
    return (mode === 'month' ? monthSummary : yearSummary).byCategory.find(
      (c) => c.category === cat
    )?.amount ?? 0;
  };

  const totalBudget = getBudget(year, activeMonthKey, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">予算管理</h2>
        <p className="text-sm text-gray-400">月・年の予算を設定して進捗を確認</p>
      </div>

      {/* Mode */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('month')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            mode === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          月別予算
        </button>
        <button
          onClick={() => setMode('year')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            mode === 'year' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          年間予算
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

      {/* Business plan style summary */}
      <div className={`rounded-2xl p-5 shadow-sm border ${
        activeSummary.deficit
          ? 'bg-red-50 border-red-200'
          : activeSummary.remaining !== null
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          {activeSummary.deficit ? (
            <AlertTriangle size={18} className="text-red-500" />
          ) : (
            <PiggyBank size={18} className="text-indigo-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-700">
            {mode === 'month' ? `${year}年${month}月` : `${year}年`} 予算サマリー
          </h3>
        </div>

        {totalBudget > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/70 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">予算</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {formatCurrency(totalBudget, currency)}
                </p>
              </div>
              <div className="bg-white/70 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">支出</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {formatCurrency(activeSummary.total, currency)}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${
                activeSummary.deficit ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <p className="text-xs text-gray-500 mb-1">
                  {activeSummary.deficit ? '赤字' : '残り'}
                </p>
                <p className={`text-sm font-bold leading-tight ${
                  activeSummary.deficit ? 'text-red-600' : 'text-green-700'
                }`}>
                  {activeSummary.deficit
                    ? `-${formatCurrency(activeSummary.deficit, currency)}`
                    : formatCurrency(activeSummary.remaining!, currency)}
                </p>
              </div>
            </div>
            <BudgetBar
              label="合計"
              budget={totalBudget}
              spent={activeSummary.total}
              currency={currency}
            />
            {activeSummary.deficit && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2">
                <TrendingDown size={16} />
                <span>予算を <strong>{formatCurrency(activeSummary.deficit, currency)}</strong> オーバーしています</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">下記で予算を設定してください</p>
        )}
      </div>

      {/* Total budget input */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">合計予算を設定</h3>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm flex-shrink-0">合計予算</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
            <input
              type="number"
              min="0"
              defaultValue={totalBudget || ''}
              placeholder="0"
              key={`total-${year}-${month}-${mode}`}
              onBlur={(e) => handleBudgetChange(e.target.value, null, null)}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Category budgets */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">カテゴリ別予算</h3>
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const budget = getBudget(year, activeMonthKey, cat);
            const spent = getCategorySpent(cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-700 w-16 flex-shrink-0">{cat}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                    <input
                      type="number"
                      min="0"
                      defaultValue={budget || ''}
                      placeholder="設定なし"
                      key={`${cat}-${year}-${month}-${mode}`}
                      onBlur={(e) => handleBudgetChange(e.target.value, cat, null)}
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
                    使用: {formatCurrency(spent, currency)}
                  </span>
                </div>
                {budget > 0 && (
                  <BudgetBar label="" budget={budget} spent={spent} currency={currency} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
