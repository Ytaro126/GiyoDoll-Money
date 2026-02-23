'use client';

import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useApp } from '@/lib/context';
import { getMonthSummary, getYearSummary, getAllTimeSummary } from '@/lib/analytics';
import { formatCurrency } from '@/lib/storage';
import { CATEGORY_COLORS } from '@/types';

type ViewMode = 'month' | 'year' | 'all';

const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function AnalyticsPage() {
  const { data } = useApp();
  const now = new Date();
  const [mode, setMode] = useState<ViewMode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const currency = data.settings.currency;
  const u1 = data.settings.user1Name;
  const u2 = data.settings.user2Name;

  const years = useMemo(() => {
    const set = new Set<number>();
    data.transactions.forEach((t) => set.add(new Date(t.date).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort().reverse();
  }, [data.transactions, now]);

  const monthSummary = useMemo(
    () => getMonthSummary(data.transactions, data.budgets, year, month),
    [data, year, month]
  );
  const yearSummary = useMemo(
    () => getYearSummary(data.transactions, data.budgets, year),
    [data, year]
  );
  const allTimeSummary = useMemo(
    () => getAllTimeSummary(data.transactions, data.budgets),
    [data]
  );

  const activeSummary = mode === 'month' ? monthSummary : mode === 'year' ? yearSummary : null;
  const activeByCategory =
    mode === 'all' ? allTimeSummary.byCategory : activeSummary?.byCategory ?? [];
  const activeTotal =
    mode === 'all' ? allTimeSummary.total : activeSummary?.total ?? 0;
  const activeByUser =
    mode === 'all' ? allTimeSummary.byUser : activeSummary?.byUser ?? { user1: 0, user2: 0 };

  const pieData = activeByCategory.map((c) => ({
    name: c.category,
    value: c.amount,
    color: CATEGORY_COLORS[c.category] ?? '#6366f1',
  }));

  const barData =
    mode === 'year'
      ? yearSummary.byMonth.map((m) => ({ name: MONTHS_JA[m.month - 1], amount: m.amount }))
      : mode === 'all'
      ? allTimeSummary.byYear.map((y) => ({ name: `${y.year}年`, amount: y.amount }))
      : null;

  const userPieData = [
    { name: u1, value: activeByUser.user1, color: '#6366f1' },
    { name: u2, value: activeByUser.user2, color: '#f59e0b' },
  ];

  const formatYen = (v: number) => `¥${(v / 10000).toFixed(0)}万`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">分析</h2>
        <p className="text-sm text-gray-400">支出の詳細を確認</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['month', 'year', 'all'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
              mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            {m === 'month' ? '月別' : m === 'year' ? '年別' : '全期間'}
          </button>
        ))}
      </div>

      {/* Selectors */}
      {(mode === 'month' || mode === 'year') && (
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          {mode === 'month' && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {MONTHS_JA.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Total */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">合計支出</p>
        <p className="text-3xl font-bold text-gray-900">{formatCurrency(activeTotal, currency)}</p>
        {mode === 'month' && monthSummary.budget && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">予算</span>
              <span className="font-medium">{formatCurrency(monthSummary.budget, currency)}</span>
            </div>
            {monthSummary.deficit ? (
              <div className="flex justify-between text-sm">
                <span className="text-red-500 font-medium">赤字</span>
                <span className="text-red-600 font-bold">-{formatCurrency(monthSummary.deficit, currency)}</span>
              </div>
            ) : monthSummary.remaining !== null ? (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">残り</span>
                <span className="text-green-700 font-bold">{formatCurrency(monthSummary.remaining, currency)}</span>
              </div>
            ) : null}
          </div>
        )}
        {mode === 'year' && yearSummary.budget && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">年間予算</span>
              <span className="font-medium">{formatCurrency(yearSummary.budget, currency)}</span>
            </div>
            {yearSummary.deficit ? (
              <div className="flex justify-between text-sm">
                <span className="text-red-500 font-medium">赤字</span>
                <span className="text-red-600 font-bold">-{formatCurrency(yearSummary.deficit, currency)}</span>
              </div>
            ) : yearSummary.remaining !== null ? (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">残り</span>
                <span className="text-green-700 font-bold">{formatCurrency(yearSummary.remaining, currency)}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Pie chart - category */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">カテゴリ別支出</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value, currency) : ''}
                  labelStyle={{ fontSize: 13 }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2.5 mt-2">
              {activeByCategory.map(({ category, amount, percentage }) => (
                <div key={category} className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[category] ?? '#6366f1' }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{category}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(amount, currency)}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bar chart - monthly/yearly trend */}
      {barData && barData.some((d) => d.amount > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {mode === 'year' ? '月別推移' : '年別推移'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatYen} tick={{ fontSize: 11 }} width={46} />
              <Tooltip
                formatter={(v: number | undefined) => v !== undefined ? formatCurrency(v, currency) : ''}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* User breakdown pie */}
      {(activeByUser.user1 > 0 || activeByUser.user2 > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">支払い者別</h3>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={userPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {userPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number | undefined) => v !== undefined ? formatCurrency(v, currency) : ''}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {userPieData.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-700">{name}</span>
                    <span className="text-sm font-bold text-gray-900 ml-auto">
                      {formatCurrency(value, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${activeTotal > 0 ? (value / activeTotal) * 100 : 0}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-700 font-medium">
              差額: {formatCurrency(Math.abs(activeByUser.user1 - activeByUser.user2), currency)}
              {activeByUser.user1 > activeByUser.user2
                ? ` (${u1}が多く支払っています)`
                : activeByUser.user2 > activeByUser.user1
                ? ` (${u2}が多く支払っています)`
                : ' (均等に支払っています)'}
            </p>
          </div>
        </div>
      )}

      {pieData.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400">この期間の取引データがありません</p>
        </div>
      )}
    </div>
  );
}
