'use client';

import { useState, useRef } from 'react';
import { Save, Download, Trash2, LogOut, Copy, Check, Camera, Plus, X } from 'lucide-react';
import { useApp } from '@/lib/context';
import { CustomCategory } from '@/types';

export default function SettingsPage() {
  const { data, roomId, myUser, updateAppSettings, uploadIcon, updateCategories, leaveRoom, clearAllData } = useApp();
  const [u1, setU1] = useState(data.settings.user1Name);
  const [u2, setU2] = useState(data.settings.user2Name);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iconUploading, setIconUploading] = useState<string | null>(null);

  // カテゴリ管理
  const [expCats, setExpCats] = useState<CustomCategory[]>(data.settings.expenseCategories);
  const [incCats, setIncCats] = useState<CustomCategory[]>(data.settings.incomeCategories);
  const [newExpName, setNewExpName] = useState('');
  const [newExpColor, setNewExpColor] = useState('#6366f1');
  const [newIncName, setNewIncName] = useState('');
  const [newIncColor, setNewIncColor] = useState('#4CAF50');
  const [catSaved, setCatSaved] = useState(false);

  // ファイル入力 ref
  const user1IconRef = useRef<HTMLInputElement>(null);
  const user2IconRef = useRef<HTMLInputElement>(null);
  const giyodollIconRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await updateAppSettings({ user1Name: u1, user2Name: u2 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giyodoll-money-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (confirm('すべての取引と予算データを削除しますか？\nこの操作は元に戻せません。')) {
      await clearAllData();
      alert('データを削除しました');
    }
  };

  const handleLeaveRoom = () => {
    if (confirm('このルームから退出しますか？\n（クラウドのデータは削除されません）')) {
      leaveRoom();
    }
  };

  const handleIconUpload = async (userType: 'user1' | 'user2' | 'giyodoll', file: File) => {
    setIconUploading(userType);
    try {
      await uploadIcon(userType, file);
    } catch (err) {
      console.error('アイコンのアップロードに失敗しました:', err);
      alert('アイコンのアップロードに失敗しました。Supabase Storage の avatars バケットが作成されているか確認してください。');
    } finally {
      setIconUploading(null);
    }
  };

  const handleSaveCategories = async () => {
    await updateCategories('expense', expCats);
    await updateCategories('income', incCats);
    setCatSaved(true);
    setTimeout(() => setCatSaved(false), 2000);
  };

  const addExpCategory = () => {
    const name = newExpName.trim();
    if (!name) return;
    if (expCats.some((c) => c.name === name)) return;
    setExpCats((prev) => [...prev, { name, color: newExpColor }]);
    setNewExpName('');
  };

  const deleteExpCategory = (idx: number) => {
    setExpCats((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExpCategoryColor = (idx: number, color: string) => {
    setExpCats((prev) => prev.map((c, i) => i === idx ? { ...c, color } : c));
  };

  const addIncCategory = () => {
    const name = newIncName.trim();
    if (!name) return;
    if (incCats.some((c) => c.name === name)) return;
    setIncCats((prev) => [...prev, { name, color: newIncColor }]);
    setNewIncName('');
  };

  const deleteIncCategory = (idx: number) => {
    setIncCats((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateIncCategoryColor = (idx: number, color: string) => {
    setIncCats((prev) => prev.map((c, i) => i === idx ? { ...c, color } : c));
  };

  const userIcons = [
    { type: 'user1' as const, name: u1, icon: data.settings.user1Icon, ref: user1IconRef, color: '#6366f1' },
    { type: 'user2' as const, name: u2, icon: data.settings.user2Icon, ref: user2IconRef, color: '#f59e0b' },
    { type: 'giyodoll' as const, name: 'GiyoDoll', icon: data.settings.giyodollIcon, ref: giyodollIconRef, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">設定</h2>
        <p className="text-sm text-gray-400">アプリの設定を変更</p>
      </div>

      {/* ルームコード */}
      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-700 mb-3">📱 ルームコード</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-white rounded-xl px-4 py-3 text-center border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-700 tracking-[0.15em]">{roomId}</p>
          </div>
          <button
            onClick={handleCopyRoomCode}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl flex-shrink-0"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-xs text-indigo-500 leading-relaxed">
          このコードをパートナーに共有すると、同じデータをリアルタイムで共有できます
        </p>
      </div>

      {/* ユーザー名・アイコン */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">ユーザー設定</h3>

        {/* アイコン */}
        <div className="flex justify-around mb-5">
          {userIcons.map(({ type, name, icon, ref, color }) => (
            <div key={type} className="flex flex-col items-center gap-2">
              <div className="relative">
                {icon ? (
                  <img src={icon} alt={name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {name[0]}
                  </div>
                )}
                <button
                  onClick={() => ref.current?.click()}
                  disabled={iconUploading === type}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                  {iconUploading === type ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
                <input
                  ref={ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIconUpload(type, file);
                    e.target.value = '';
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 text-center max-w-[64px] truncate">{name}</span>
            </div>
          ))}
        </div>

        {/* 名前入力 */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ユーザー1</label>
            <input
              type="text"
              value={u1}
              onChange={(e) => setU1(e.target.value)}
              placeholder="名前を入力"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ユーザー2</label>
            <input
              type="text"
              value={u2}
              onChange={(e) => setU2(e.target.value)}
              placeholder="名前を入力"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Save size={16} />
            {saved ? '保存しました！' : '保存する'}
          </button>
        </div>
      </div>

      {/* カテゴリ管理 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">カテゴリ管理</h3>

        {/* 支出カテゴリ */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">支出カテゴリ</h4>
          <div className="space-y-2">
            {expCats.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) => updateExpCategoryColor(idx, e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                />
                <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                <button
                  onClick={() => deleteExpCategory(idx)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="color"
              value={newExpColor}
              onChange={(e) => setNewExpColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0"
            />
            <input
              type="text"
              placeholder="新しいカテゴリ名"
              value={newExpName}
              onChange={(e) => setNewExpName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExpCategory()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={addExpCategory}
              className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-lg flex-shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* 収入カテゴリ */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">収入カテゴリ</h4>
          <div className="space-y-2">
            {incCats.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) => updateIncCategoryColor(idx, e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                />
                <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                <button
                  onClick={() => deleteIncCategory(idx)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="color"
              value={newIncColor}
              onChange={(e) => setNewIncColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0"
            />
            <input
              type="text"
              placeholder="新しいカテゴリ名"
              value={newIncName}
              onChange={(e) => setNewIncName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIncCategory()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={addIncCategory}
              className="w-9 h-9 flex items-center justify-center bg-green-600 text-white rounded-lg flex-shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveCategories}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
            catSaved
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <Save size={16} />
          {catSaved ? '保存しました！' : 'カテゴリを保存'}
        </button>
      </div>

      {/* データ管理 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">データ管理</h3>
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          データをエクスポート（JSON）
        </button>
      </div>

      {/* 統計 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">統計</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>取引件数</span>
            <span className="font-medium">{data.transactions.length}件</span>
          </div>
          <div className="flex justify-between">
            <span>収入件数</span>
            <span className="font-medium">{data.transactions.filter((t) => t.type === 'income').length}件</span>
          </div>
          <div className="flex justify-between">
            <span>支出件数</span>
            <span className="font-medium">{data.transactions.filter((t) => (t.type ?? 'expense') === 'expense').length}件</span>
          </div>
        </div>
      </div>

      {/* 危険な操作 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-4">危険な操作</h3>
        <div className="space-y-3">
          {myUser === 'user1' && (
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              すべてのデータを削除
            </button>
          )}
          <button
            onClick={handleLeaveRoom}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            このルームから退出する
          </button>
        </div>
      </div>
    </div>
  );
}
