'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, TrendingDown, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { getMonthSummary } from '@/lib/analytics';
import { formatCurrency } from '@/lib/context';
import BudgetBar from '@/components/BudgetBar';
import TransactionForm from '@/components/TransactionForm';

function UserAvatar({ name, icon, color = 'bg-indigo-100' }: { name: string; icon?: string | null; color?: string }) {
  if (icon) {
    return <img src={icon} alt={name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />;
  }
  return (
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
      <span className="font-bold text-lg" style={{ color: 'inherit' }}>{name[0]}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data } = useApp();
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const summary = useMemo(
    () => getMonthSummary(data.transactions, year, month, data.settings.expenseCategories),
    [data, year, month]
  );

  const recentTx = useMemo(
    () => [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [data.transactions]
  );

  const currency = data.settings.currency;
  const u1 = data.settings.user1Name;
  const u2 = data.settings.user2Name;

  const users = [
    { key: 'user1' as const, name: u1, amount: summary.byUser.user1, icon: data.settings.user1Icon, textColor: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    { key: 'user2' as const, name: u2, amount: summary.byUser.user2, icon: data.settings.user2Icon, textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
    { key: 'giyodoll' as const, name: 'GiyoDoll', amount: summary.byUser.giyodoll, icon: data.settings.giyodollIcon, textColor: 'text-rose-700', bgColor: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{summary.label}</h2>
          <p className="text-sm text-gray-400">今月の家計サマリー</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* 収入 */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-1 text-green-600 text-xs mb-2">
            <TrendingUp size={13} />
            収入
          </div>
          <p className="text-lg font-bold text-green-700 leading-tight">
            {formatCurrency(summary.incomeTotal, currency)}
          </p>
        </div>

        {/* 支出 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
            <TrendingDown size={13} />
            支出
          </div>
          <p className="text-lg font-bold text-gray-900 leading-tight">
            {formatCurrency(summary.total, currency)}
          </p>
        </div>

        {/* 残高 */}
        <div
          className={`rounded-2xl p-4 border ${
            summary.deficit
              ? 'bg-red-50 border-red-100'
              : summary.remaining !== null
              ? 'bg-blue-50 border-blue-100'
              : 'bg-white border-gray-100'
          }`}
        >
          {summary.deficit ? (
            <>
              <div className="flex items-center gap-1 text-red-400 text-xs mb-2">
                <AlertTriangle size={13} />
                赤字
              </div>
              <p className="text-lg font-bold text-red-600 leading-tight">
                -{formatCurrency(summary.deficit, currency)}
              </p>
            </>
          ) : summary.remaining !== null ? (
            <>
              <div className="flex items-center gap-1 text-blue-500 text-xs mb-2">
                <Wallet size={13} />
                残高
              </div>
              <p className="text-lg font-bold text-blue-700 leading-tight">
                {formatCurrency(summary.remaining, currency)}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                <Wallet size={13} />
                残高
              </div>
              <p className="text-xs text-gray-400 mt-1">収入なし</p>
            </>
          )}
        </div>
      </div>

      {/* Per-user breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">支払い者別（支出）</h3>
        <div className="grid grid-cols-3 gap-3">
          {users.map(({ key, name, amount, icon, textColor, bgColor }) => (
            <div key={key} className="text-center">
              {icon ? (
                <img src={icon} alt={name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />
              ) : (
                <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <span className={`${textColor} font-bold text-lg`}>{name[0]}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 truncate">{name}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {formatCurrency(amount, currency)}
              </p>
              <p className="text-xs text-gray-400">
                {summary.total > 0 ? ((amount / summary.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget bar */}
      {summary.budget ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">収支進捗</h3>
          <BudgetBar
            label={`${summary.label} 合計`}
            budget={summary.budget}
            spent={summary.total}
            currency={currency}
          />
        </div>
      ) : null}

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">カテゴリ別（支出）</h3>
            <Link href="/analytics" className="text-xs text-indigo-500">
              詳細 →
            </Link>
          </div>
          <div className="space-y-3">
            {summary.byCategory.slice(0, 5).map(({ category, amount, percentage, color }) => (
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

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">最近の取引</h3>
          <Link href="/transactions" className="text-xs text-indigo-500">
            すべて見る →
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">まだ取引がありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-indigo-600 text-sm font-medium underline"
            >
              最初の取引を追加する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTx.map((tx) => {
              const catColor = [...data.settings.expenseCategories, ...data.settings.incomeCategories]
                .find((c) => c.name === tx.category)?.color ?? '#6366f1';
              const userName = tx.user === 'user1' ? u1 : tx.user === 'user2' ? u2 : 'GiyoDoll';
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: catColor }}
                  >
                    {tx.category[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.description || tx.category}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.date} · {userName}
                      {tx.type === 'income' && (
                        <span className="ml-1 text-green-600 font-medium">収入</span>
                      )}
                    </p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '92dvh' }}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">取引を追加</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
              <TransactionForm onDone={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
