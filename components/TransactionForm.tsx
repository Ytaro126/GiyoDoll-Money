'use client';

import { useState } from 'react';
import { Transaction, User, TransactionType } from '@/types';
import { useApp } from '@/lib/context';

interface Props {
  initial?: Partial<Transaction>;
  onDone?: () => void;
}

export default function TransactionForm({ initial, onDone }: Props) {
  const { data, addTx, updateTx, myUser } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const expCats = data.settings.expenseCategories;
  const incCats = data.settings.incomeCategories;

  const initType: TransactionType = initial?.type ?? 'expense';
  const initCat = initial?.category ?? (initType === 'expense' ? expCats[0]?.name ?? '食費' : incCats[0]?.name ?? '給与');

  const [form, setForm] = useState({
    type: initType,
    date: initial?.date ?? today,
    category: initCat,
    description: initial?.description ?? '',
    user: initial?.user ?? ((myUser ?? 'user1') as User),
    amount: initial?.amount?.toString() ?? '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleTypeChange = (newType: TransactionType) => {
    const cats = newType === 'expense' ? expCats : incCats;
    setForm((p) => ({
      ...p,
      type: newType,
      category: cats[0]?.name ?? (newType === 'expense' ? '食費' : '給与'),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError('金額を正しく入力してください');
      return;
    }
    if (!form.date) {
      setError('日付を入力してください');
      return;
    }
    const tx = {
      type: form.type as TransactionType,
      date: form.date,
      category: form.category,
      description: form.description,
      user: form.user as User,
      amount,
    };
    if (initial?.id) {
      updateTx(initial.id, tx);
    } else {
      addTx(tx);
    }
    onDone?.();
  };

  const userName1 = data.settings.user1Name;
  const userName2 = data.settings.user2Name;
  const activeCategories = form.type === 'expense' ? expCats : incCats;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2.5 rounded-lg">{error}</p>}

      {/* 収入/支出トグル */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            form.type === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            form.type === 'income' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          収入
        </button>
      </div>

      {/* 日付・金額 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">日付</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">金額</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="0"
              min="1"
              inputMode="numeric"
              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              required
            />
          </div>
        </div>
      </div>

      {/* カテゴリ */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">カテゴリ</label>
        <div className="grid grid-cols-3 gap-2">
          {activeCategories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => set('category', cat.name)}
              className={`py-2.5 px-1 rounded-xl border text-xs font-medium transition-colors min-h-[44px] ${
                form.category === cat.name
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600 active:bg-gray-100'
              }`}
              style={form.category === cat.name ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 支払い者 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">支払い者</label>
        <div className="grid grid-cols-3 gap-2">
          {(['user1', 'user2', 'giyodoll'] as User[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set('user', u)}
              className={`py-3 rounded-xl border text-sm font-semibold transition-colors min-h-[48px] ${
                form.user === u
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 active:bg-gray-100'
              }`}
            >
              {u === 'user1' ? userName1 : u === 'user2' ? userName2 : 'GiyoDoll'}
            </button>
          ))}
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">メモ（任意）</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="例：スーパーで買い物"
          className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 active:bg-indigo-800 text-white font-bold py-4 rounded-xl text-base transition-colors min-h-[52px]"
      >
        {initial?.id ? '更新する' : '追加する'}
      </button>
    </form>
  );
}
