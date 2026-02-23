'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppData, Transaction, Budget, AppSettings } from '@/types';
import { supabase } from './supabase';
import {
  getRoomId, setRoomId, clearRoomId,
  getMyUser, setMyUser, clearMyUser,
  generateRoomCode,
} from './room';

// formatCurrency はそのまま維持
export function formatCurrency(amount: number, currency = '¥'): string {
  return `${currency}${amount.toLocaleString('ja-JP')}`;
}

// HTTP環境でも動作するUUID生成 (crypto.randomUUID はHTTPSのみ)
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_SETTINGS: AppSettings = {
  user1Name: 'ユーザー1',
  user2Name: 'ユーザー2',
  currency: '¥',
};

const DEFAULT_DATA: AppData = {
  transactions: [],
  budgets: [],
  settings: DEFAULT_SETTINGS,
};

interface AppContextValue {
  data: AppData;
  loading: boolean;
  roomId: string | null;
  myUser: 'user1' | 'user2' | null;
  joinRoom: (code: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  createRoom: (username: string, password: string) => Promise<string>;
  leaveRoom: () => void;
  addTx: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTx: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTx: (id: string) => Promise<void>;
  upsertBudgetEntry: (budget: Omit<Budget, 'id'> & { id?: string }) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomIdState] = useState<string | null>(null);
  const [myUser, setMyUserState] = useState<'user1' | 'user2' | null>(null);
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Supabaseから全データを取得
  const fetchData = useCallback(async (rid: string) => {
    const [txRes, budgetRes, settingsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('room_id', rid),
      supabase.from('budgets').select('*').eq('room_id', rid),
      supabase.from('room_settings').select('*').eq('room_id', rid).maybeSingle(),
    ]);

    const transactions: Transaction[] = (txRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      date: row.date as string,
      category: row.category as string,
      description: (row.description as string) ?? '',
      user: row.user_type as 'user1' | 'user2',
      amount: Number(row.amount),
    }));

    const budgets: Budget[] = (budgetRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      year: row.year as number,
      month: row.month as number | null,
      category: row.category as string | null,
      amount: Number(row.amount),
    }));

    const settings: AppSettings = settingsRes.data
      ? {
          user1Name: settingsRes.data.user1_name as string,
          user2Name: settingsRes.data.user2_name as string,
          currency: settingsRes.data.currency as string,
        }
      : DEFAULT_SETTINGS;

    setData({ transactions, budgets, settings });
  }, []);

  // リアルタイム購読の設定
  const subscribe = useCallback(
    (rid: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      const channel = supabase
        .channel(`room-${rid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `room_id=eq.${rid}` },
          () => fetchData(rid)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'budgets', filter: `room_id=eq.${rid}` },
          () => fetchData(rid)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_settings', filter: `room_id=eq.${rid}` },
          () => fetchData(rid)
        )
        .subscribe();
      channelRef.current = channel;
    },
    [fetchData]
  );

  // 起動時: localStorageからルームID・ユーザーを復元
  useEffect(() => {
    const storedRoom = getRoomId();
    const storedUser = getMyUser();
    // 両方そろっている場合のみ復元 (片方だけの場合はログイン画面へ)
    if (storedRoom && storedUser) {
      setRoomIdState(storedRoom);
      setMyUserState(storedUser);
      fetchData(storedRoom).finally(() => setLoading(false));
      subscribe(storedRoom);
    } else {
      // 不整合があれば両方クリア
      clearRoomId();
      clearMyUser();
      setLoading(false);
    }
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchData, subscribe]);

  // ルームに参加 (ログイン)
  const joinRoom = async (
    code: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const { data: settings, error } = await supabase
      .from('room_settings')
      .select('*')
      .eq('room_id', normalized)
      .maybeSingle();
    if (error) return { success: false, error: 'エラーが発生しました' };
    if (!settings) return { success: false, error: 'ルームが見つかりません。コードを確認してください' };

    let loggedInAs: 'user1' | 'user2' | null = null;

    // user1の認証チェック
    if (settings.user1_username === username && settings.user1_password === password) {
      loggedInAs = 'user1';
    }
    // user2の認証チェック
    else if (settings.user2_username && settings.user2_username === username && settings.user2_password === password) {
      loggedInAs = 'user2';
    }
    // user2がまだ未登録 → 新規user2として登録
    else if (!settings.user2_username) {
      const { error: updateErr } = await supabase
        .from('room_settings')
        .update({
          user2_username: username,
          user2_password: password,
          user2_name: username,
        })
        .eq('room_id', normalized);
      if (updateErr) return { success: false, error: 'ユーザー登録に失敗しました' };
      loggedInAs = 'user2';
    }
    else {
      return { success: false, error: 'ユーザー名またはパスワードが違います' };
    }

    setRoomId(normalized);
    setRoomIdState(normalized);
    setMyUser(loggedInAs);
    setMyUserState(loggedInAs);
    await fetchData(normalized);
    subscribe(normalized);
    setLoading(false);
    return { success: true };
  };

  // 新しいルームを作成 (user1として登録)
  const createRoom = async (username: string, password: string): Promise<string> => {
    const code = generateRoomCode();
    await supabase.from('room_settings').insert({
      room_id: code,
      user1_name: username,
      user2_name: 'ユーザー2',
      currency: '¥',
      user1_username: username,
      user1_password: password,
    });
    setRoomId(code);
    setRoomIdState(code);
    setMyUser('user1');
    setMyUserState('user1');
    await fetchData(code);
    subscribe(code);
    return code;
  };

  // ルームから退出
  const leaveRoom = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    clearRoomId();
    clearMyUser();
    setRoomIdState(null);
    setMyUserState(null);
    setData(DEFAULT_DATA);
  };

  // 取引を追加 (楽観的更新)
  const addTx = async (tx: Omit<Transaction, 'id'>) => {
    if (!roomId) return;
    const id = generateId();
    const newTx: Transaction = { ...tx, id };
    setData((prev) => ({ ...prev, transactions: [...prev.transactions, newTx] }));
    await supabase.from('transactions').insert({
      id,
      room_id: roomId,
      date: tx.date,
      category: tx.category,
      description: tx.description,
      user_type: tx.user,
      amount: tx.amount,
    });
  };

  // 取引を更新 (楽観的更新)
  const updateTx = async (id: string, tx: Partial<Transaction>) => {
    if (!roomId) return;
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)),
    }));
    const updates: Record<string, unknown> = {};
    if (tx.date !== undefined) updates.date = tx.date;
    if (tx.category !== undefined) updates.category = tx.category;
    if (tx.description !== undefined) updates.description = tx.description;
    if (tx.user !== undefined) updates.user_type = tx.user;
    if (tx.amount !== undefined) updates.amount = tx.amount;
    await supabase.from('transactions').update(updates).eq('id', id).eq('room_id', roomId);
  };

  // 取引を削除 (楽観的更新)
  const deleteTx = async (id: string) => {
    if (!roomId) return;
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    await supabase.from('transactions').delete().eq('id', id).eq('room_id', roomId);
  };

  // 予算をupsert (楽観的更新)
  const upsertBudgetEntry = async (budget: Omit<Budget, 'id'> & { id?: string }) => {
    if (!roomId) return;
    const existing = data.budgets.find(
      (b) => b.year === budget.year && b.month === budget.month && b.category === budget.category
    );
    if (existing) {
      if (budget.amount === 0) {
        setData((prev) => ({ ...prev, budgets: prev.budgets.filter((b) => b.id !== existing.id) }));
        await supabase.from('budgets').delete().eq('id', existing.id);
      } else {
        setData((prev) => ({
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.id === existing.id ? { ...b, amount: budget.amount } : b
          ),
        }));
        await supabase.from('budgets').update({ amount: budget.amount }).eq('id', existing.id);
      }
    } else if (budget.amount > 0) {
      const id = generateId();
      const newBudget: Budget = {
        id,
        year: budget.year,
        month: budget.month,
        category: budget.category,
        amount: budget.amount,
      };
      setData((prev) => ({ ...prev, budgets: [...prev.budgets, newBudget] }));
      await supabase.from('budgets').insert({
        id,
        room_id: roomId,
        year: budget.year,
        month: budget.month,
        category: budget.category,
        amount: budget.amount,
      });
    }
  };

  // 設定を更新 (楽観的更新)
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
    if (!roomId) return;
    const newSettings = { ...data.settings, ...settings };
    setData((prev) => ({ ...prev, settings: newSettings }));
    await supabase.from('room_settings').update({
      user1_name: newSettings.user1Name,
      user2_name: newSettings.user2Name,
      currency: newSettings.currency,
    }).eq('room_id', roomId);
  };

  // 全データ削除
  const clearAllData = async () => {
    if (!roomId) return;
    setData((prev) => ({ ...prev, transactions: [], budgets: [] }));
    await Promise.all([
      supabase.from('transactions').delete().eq('room_id', roomId),
      supabase.from('budgets').delete().eq('room_id', roomId),
    ]);
  };

  // 後方互換 (settings pageで使用していたが、リアルタイムで不要)
  const refresh = () => {
    if (roomId) fetchData(roomId);
  };

  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        roomId,
        myUser,
        joinRoom,
        createRoom,
        leaveRoom,
        addTx,
        updateTx,
        deleteTx,
        upsertBudgetEntry,
        updateAppSettings,
        clearAllData,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
