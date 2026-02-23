'use client';

import { formatCurrency } from '@/lib/storage';

interface Props {
  label: string;
  budget: number;
  spent: number;
  currency?: string;
}

export default function BudgetBar({ label, budget, spent, currency = '¥' }: Props) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = spent > budget;
  const remaining = budget - spent;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-semibold ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
          {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{pct.toFixed(0)}% 使用</span>
        {isOver ? (
          <span className="text-xs text-red-500 font-semibold">
            {formatCurrency(Math.abs(remaining), currency)} 赤字
          </span>
        ) : (
          <span className="text-xs text-green-600">
            残り {formatCurrency(remaining, currency)}
          </span>
        )}
      </div>
    </div>
  );
}
