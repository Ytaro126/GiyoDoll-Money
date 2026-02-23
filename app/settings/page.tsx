'use client';

import { useState } from 'react';
import { Save, Download, Trash2, LogOut, Copy, Check } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function SettingsPage() {
  const { data, roomId, updateAppSettings, leaveRoom, clearAllData } = useApp();
  const [u1, setU1] = useState(data.settings.user1Name);
  const [u2, setU2] = useState(data.settings.user2Name);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

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

      {/* ユーザー名 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">ユーザー名</h3>
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
            <span>予算設定数</span>
            <span className="font-medium">{data.budgets.length}件</span>
          </div>
        </div>
      </div>

      {/* 危険な操作 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-4">危険な操作</h3>
        <div className="space-y-3">
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            すべてのデータを削除
          </button>
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
