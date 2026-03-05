'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Pencil, ChevronDown } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/context';
import { Transaction } from '@/types';
import TransactionForm from '@/components/TransactionForm';

export default function TransactionsPage() {
  const { data, deleteTx } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState<'all' | 'user1' | 'user2' | 'giyodoll'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const currency = data.settings.currency;
  const u1 = data.settings.user1Name;
  const u2 = data.settings.user2Name;

  const allCategories = useMemo(() => [
    ...data.settings.expenseCategories,
    ...data.settings.incomeCategories,
  ], [data.settings]);

  const months = useMemo(() => {
    const set = new Set<string>();
    data.transactions.forEach((t) => {
      const d = new Date(t.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [data.transactions]);

  const filtered = useMemo(() => {
    return [...data.transactions]
      .filter((t) => {
        if (filterUser !== 'all' && t.user !== filterUser) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterType !== 'all' && (t.type ?? 'expense') !== filterType) return false;
        if (filterMonth !== 'all') {
          const d = new Date(t.date);
          const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (m !== filterMonth) return false;
        }
        if (search) {
          const s = search.toLowerCase();
          if (!t.description.toLowerCase().includes(s) && !t.category.toLowerCase().includes(s))
            return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, filterUser, filterCategory, filterType, filterMonth, search]);

  const expenseTotal = filtered.filter((t) => (t.type ?? 'expense') === 'expense').reduce((s, t) => s + t.amount, 0);
  const incomeTotal = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const handleDelete = (id: string) => {
    if (confirm('この取引を削除しますか？')) {
      deleteTx(id);
    }
  };

  const getUserLabel = (tx: Transaction) => {
    if (tx.user === 'user1') return u1;
    if (tx.user === 'user2') return u2;
    return 'GiyoDoll';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">取引一覧</h2>
          <p className="text-sm text-gray-400">
            {filtered.length}件
            {filterType !== 'income' && ` · 支出 ${formatCurrency(expenseTotal, currency)}`}
            {filterType !== 'expense' && ` · 収入 ${formatCurrency(incomeTotal, currency)}`}
          </p>
        </div>
        <button
          onClick={() => { setEditingTx(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="メモ・カテゴリで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {/* 種別フィルター */}
          <div className="relative flex-shrink-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8 min-w-[90px]"
            >
              <option value="all">全種別</option>
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* ユーザーフィルター */}
          <div className="relative flex-shrink-0">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value as 'all' | 'user1' | 'user2' | 'giyodoll')}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8 min-w-[90px]"
            >
              <option value="all">全員</option>
              <option value="user1">{u1}</option>
              <option value="user2">{u2}</option>
              <option value="giyodoll">GiyoDoll</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* カテゴリフィルター */}
          <div className="relative flex-shrink-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8 min-w-[110px]"
            >
              <option value="all">全カテゴリ</option>
              {allCategories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* 月フィルター */}
          <div className="relative flex-shrink-0">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8 min-w-[110px]"
            >
              <option value="all">全期間</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.replace('-', '年')}月</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">取引が見つかりません</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const catColor = allCategories.find((c) => c.name === tx.category)?.color ?? '#6366f1';
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: catColor }}
                >
                  {tx.category[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {tx.description || tx.category}
                    </p>
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isIncome ? '収入' : '支出'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tx.date} · {tx.category} · {getUserLabel(tx)}
                  </p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                  {isIncome ? '+' : ''}{formatCurrency(tx.amount, currency)}
                </p>
                <div className="flex gap-0.5 flex-shrink-0 ml-1">
                  <button
                    onClick={() => { setEditingTx(tx); setShowForm(true); }}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 active:text-indigo-600 active:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 active:text-red-600 active:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingTx(null); } }}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '92dvh' }}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingTx ? '取引を編集' : '取引を追加'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingTx(null); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-full hover:bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
              <TransactionForm
                initial={editingTx ?? undefined}
                onDone={() => { setShowForm(false); setEditingTx(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
