const ROOM_KEY = 'giyodoll_room_id';
const MY_USER_KEY = 'giyodoll_my_user';

export function getRoomId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROOM_KEY);
}

export function setRoomId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROOM_KEY, id);
}

export function clearRoomId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ROOM_KEY);
}

// この端末が「user1」か「user2」かを記憶
export function getMyUser(): 'user1' | 'user2' | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(MY_USER_KEY);
  if (val === 'user1' || val === 'user2') return val;
  return null;
}

export function setMyUser(user: 'user1' | 'user2'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MY_USER_KEY, user);
}

export function clearMyUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MY_USER_KEY);
}

export function generateRoomCode(): string {
  // 読みやすい文字のみ使用 (O/0, I/1 を除く)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += '-';
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
