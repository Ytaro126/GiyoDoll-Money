'use client';

import { useState } from 'react';
import { Users, Plus, ArrowRight, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/lib/context';

type Mode = 'join' | 'create';

export default function RoomEntry() {
  const { joinRoom, createRoom } = useApp();
  const [mode, setMode] = useState<Mode>('join');

  // 参加フォーム
  const [roomCode, setRoomCode] = useState('');
  // 共通
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ルームコードを XXXX-XXXX 形式に整形
  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length <= 8) {
      const formatted = cleaned.length > 4
        ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
        : cleaned;
      setRoomCode(formatted);
    }
    setError('');
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !username.trim() || !password.trim()) {
      setError('すべての項目を入力してください');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await joinRoom(roomCode, username, password);
    if (!result.success) {
      setError(result.error ?? 'エラーが発生しました');
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      setError('ログインIDとパスワードを入力してください');
      return;
    }
    setIsLoading(true);
    setError('');
    const code = await createRoom(username, password);
    setCreatedCode(code);
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setUsername('');
    setPassword('');
    setRoomCode('');
  };

  // ルーム作成後: コードを表示して共有を促す
  if (createdCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ルームを作成しました！</h2>
          <p className="text-sm text-gray-500 mb-6">
            このコードをパートナーに共有してください
          </p>

          {/* ルームコード表示 */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4">
            <p className="text-xs text-indigo-400 mb-1">ルームコード</p>
            <p className="text-4xl font-bold text-indigo-700 tracking-[0.15em]">
              {createdCode}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-semibold mb-5 min-h-[48px]"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'コピーしました！' : 'コードをコピー'}
          </button>

          <p className="text-xs text-gray-400 leading-relaxed">
            パートナーは「ログイン」タブで<br />
            このルームコード＋自分のIDとパスワードで参加できます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Giyodoll Money</h1>
          <p className="text-sm text-gray-500 mt-1">ふたりで使う家計管理</p>
        </div>

        {/* タブ切り替え */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => switchMode('join')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'join' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => switchMode('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            新規作成
          </button>
        </div>

        <div className="space-y-3">
          {/* ルームコード (ログイン時のみ) */}
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                ルームコード
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
          )}

          {/* ログインID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              ログインID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="例：tanaka"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              autoComplete="username"
            />
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') mode === 'join' ? handleJoin() : handleCreate();
                }}
                placeholder="パスワードを入力"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 実行ボタン */}
          {mode === 'join' ? (
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 min-h-[52px] transition-colors active:bg-indigo-700 mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              ログイン / 参加する
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 min-h-[52px] transition-colors active:bg-indigo-700 mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              ルームを作成する
            </button>
          )}
        </div>

        {/* 説明文 */}
        <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
          {mode === 'join'
            ? 'パートナーから共有されたルームコードと\n自分のIDとパスワードでログインします'
            : 'はじめてのかたはここからルームを作成します\nあなたがユーザー1になります'}
        </p>
      </div>
    </div>
  );
}
