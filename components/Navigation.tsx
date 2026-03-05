'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, BarChart2, ArrowLeftRight, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'ホーム', icon: LayoutDashboard },
  { href: '/transactions', label: '取引', icon: List },
  { href: '/analytics', label: '分析', icon: BarChart2 },
  { href: '/budget', label: '収支', icon: ArrowLeftRight },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-indigo-600">GiyoDoll Money</h1>
          <p className="text-xs text-gray-400 mt-0.5">ふたりの家計管理</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav — safe area対応 */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 text-xs font-medium transition-colors min-h-[52px] justify-center ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-[11px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
