import { createClient } from '@supabase/supabase-js';

// ビルド時にenv未設定でもエラーにならないようプレースホルダーを使用
// 実際の API 呼び出しはクライアントサイドの useEffect 内でのみ実行される
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

// Supabase Storage の avatars バケットにアイコン画像をアップロードし public URL を返す
// 事前に Supabase Dashboard で "avatars" バケットを public で作成してください
export async function uploadAvatar(roomId: string, userType: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${roomId}/${userType}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
