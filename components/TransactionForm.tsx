'use client';

import { useState } from 'react';
import { CATEGORIES, Transaction, User } from '@/types';
import { useApp } from '@/lib/context';

interface Props {
  initial?: Partial<Transaction>;
  onDone?: () => void;
}

export default function TransactionForm({ initial, onDone }: Props) {
  const { data, addTx, updateTx, myUser } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: initial?.date ?? today,
    category: initial?.category ?? CATEGORIES[0],
    description: initial?.description ?? '',
    user: initial?.user ?? ((myUser ?? 'user1') as User),
    amount: initial?.amount?.toString() ?? '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2.5 rounded-lg">{error}</p>}

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
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className={`py-2.5 px-1 rounded-xl border text-xs font-medium transition-colors min-h-[44px] ${
                form.category === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 active:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 支払い者 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">支払い者</label>
        <div className="grid grid-cols-2 gap-3">
          {(['user1', 'user2'] as User[]).map((u) => (
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
              {u === 'user1' ? userName1 : userName2}
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
