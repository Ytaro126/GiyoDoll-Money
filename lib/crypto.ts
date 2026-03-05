/**
 * パスワードをSHA-256でハッシュ化する
 * 注: 本格的な実装ではbcrypt+saltを推奨。
 * ここではDBへの平文保存を防ぐ最低限の対策として使用。
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
