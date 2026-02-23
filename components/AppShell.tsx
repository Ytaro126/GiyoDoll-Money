'use client';

import { useApp } from '@/lib/context';
import RoomEntry from './RoomEntry';
import Navigation from './Navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { roomId, myUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ルームIDもしくはユーザーIDが未設定ならログイン画面
  if (!roomId || !myUser) {
    return <RoomEntry />;
  }

  return (
    <>
      <Navigation />
      <main
        className="md:ml-56 min-h-screen"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-5 md:py-6">{children}</div>
      </main>
    </>
  );
}
