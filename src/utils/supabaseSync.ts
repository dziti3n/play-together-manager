import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Account, FarmOrder } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  roomId: string; // Tên phòng / mã nhóm (ví dụ: 2 vợ chồng)
}

export interface RemoteFarmData {
  room_id: string;
  accounts: Account[];
  orders: FarmOrder[];
  featured_crops: string[];
  updated_at: string;
}

export interface FetchRemoteResult {
  data: RemoteFarmData | null;
  notFound: boolean;
  error?: any;
}

export type ConnectionStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

const CONFIG_STORAGE_KEY = 'pt_supabase_config';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let currentClientKey = '';
let lastPushedTimestamp = 0;

/**
 * Mã hóa tên phòng sang chuỗi ký tự ASCII an toàn cho WebSocket topic của Supabase Realtime
 * Tránh lỗi ngắt kết nối do dấu tiếng Việt hoặc khoảng trắng (vd: "2 vợ chồng")
 */
export function toSafeChannelName(roomId: string): string {
  try {
    const raw = roomId.trim();
    let hex = '';
    for (let i = 0; i < raw.length; i++) {
      hex += raw.charCodeAt(i).toString(16).padStart(4, '0');
    }
    return `farm_room_${hex.substring(0, 48)}`;
  } catch {
    return `farm_room_default`;
  }
}

export function getSavedSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.anonKey && parsed.roomId) {
      return parsed;
    }
  } catch {}
  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearSupabaseConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  disconnectSupabase();
}

export function getOrCreateSupabaseClient(config: SupabaseConfig): SupabaseClient {
  const clientKey = `${config.url.trim()}:::${config.anonKey.trim()}`;
  if (supabaseClient && currentClientKey === clientKey) {
    return supabaseClient;
  }

  // Nếu thay đổi cấu hình URL hoặc Key, đóng kết nối cũ
  disconnectSupabase();
  currentClientKey = clientKey;

  supabaseClient = createClient(config.url.trim(), config.anonKey.trim(), {
    auth: { persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  return supabaseClient;
}

export function disconnectSupabase() {
  if (realtimeChannel && supabaseClient) {
    try {
      supabaseClient.removeChannel(realtimeChannel);
    } catch {}
    realtimeChannel = null;
  }
  supabaseClient = null;
  currentClientKey = '';
}

/**
 * Kiểm tra kết nối tới bảng farm_teams trên Supabase
 */
export async function testSupabaseConnection(
  config: SupabaseConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: { persistSession: false },
    });

    const { error } = await client
      .from('farm_teams')
      .select('room_id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message:
            'Chưa tạo bảng "farm_teams" trên Supabase. Vui lòng mở mục SQL Editor trên Supabase và chạy đoạn script tạo bảng.',
        };
      }
      return {
        success: false,
        message: 'Lỗi Supabase: ' + (error.message || JSON.stringify(error)),
      };
    }

    return {
      success: true,
      message: 'Kết nối Supabase Cloud thành công!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Không thể kết nối tới Supabase URL: ' + (err.message || String(err)),
    };
  }
}

/**
 * Tải dữ liệu từ Supabase về có phân biệt rõ:
 * - Có dữ liệu: { data: ..., notFound: false }
 * - Phòng hoàn toàn mới (chưa có trong DB): { data: null, notFound: true }
 * - Mất mạng / Lỗi kết nối: { data: null, notFound: false, error: ... } (KHÔNG ĐƯỢC GHI ĐÈ DỮ LIỆU)
 */
export async function fetchRemoteTeamData(
  config: SupabaseConfig
): Promise<FetchRemoteResult> {
  try {
    const client = getOrCreateSupabaseClient(config);
    const { data, error } = await client
      .from('farm_teams')
      .select('*')
      .eq('room_id', config.roomId.trim())
      .single();

    if (error) {
      // PGRST116 là mã chuẩn của PostgREST: 0 rows found (phòng chưa từng được tạo)
      if (error.code === 'PGRST116') {
        return { data: null, notFound: true };
      }
      console.warn('Lỗi tải dữ liệu phòng từ Supabase:', error);
      return { data: null, notFound: false, error };
    }

    if (data) {
      return { data: data as RemoteFarmData, notFound: false };
    }
  } catch (err) {
    console.error('fetchRemoteTeamData exception:', err);
    return { data: null, notFound: false, error: err };
  }
  return { data: null, notFound: true };
}

/**
 * Đẩy dữ liệu mới lên Supabase cho cả phòng cùng thấy
 */
export async function pushRemoteTeamData(
  config: SupabaseConfig,
  payload: {
    accounts: Account[];
    orders: FarmOrder[];
    featuredCrops: string[];
  }
): Promise<boolean> {
  try {
    const client = getOrCreateSupabaseClient(config);
    const now = new Date().toISOString();
    lastPushedTimestamp = Date.now();

    const { error } = await client.from('farm_teams').upsert(
      {
        room_id: config.roomId.trim(),
        accounts: payload.accounts,
        orders: payload.orders,
        featured_crops: payload.featuredCrops,
        updated_at: now,
      },
      { onConflict: 'room_id' }
    );

    if (error) {
      console.error('pushRemoteTeamData error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('pushRemoteTeamData exception:', err);
    return false;
  }
}

/**
 * Đăng ký lắng nghe thay đổi thời gian thực (Realtime Subscription)
 * Sử dụng topic an toàn và lọc room_id phía client để tránh lỗi syntax PostgREST khi có dấu tiếng Việt/khoảng trắng
 */
export function subscribeToTeamRoom(
  config: SupabaseConfig,
  onRemoteChange: (data: RemoteFarmData) => void,
  onStatusChange?: (status: ConnectionStatus) => void
): () => void {
  const client = getOrCreateSupabaseClient(config);

  if (realtimeChannel) {
    try {
      client.removeChannel(realtimeChannel);
    } catch {}
    realtimeChannel = null;
  }

  onStatusChange?.('CONNECTING');
  const safeTopic = toSafeChannelName(config.roomId);
  const targetRoomId = config.roomId.trim();

  const channel = client
    .channel(safeTopic)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'farm_teams',
      },
      (payload) => {
        const newRecord = payload.new as RemoteFarmData;
        if (!newRecord || !newRecord.room_id) return;
        
        // Kiểm tra đúng phòng của 2 người
        if (newRecord.room_id.trim() !== targetRoomId) return;

        // Bỏ qua tin dội ngược nếu vừa được đẩy bởi chính máy này trong 1.8 giây qua
        if (Date.now() - lastPushedTimestamp < 1800) {
          return;
        }

        if (Array.isArray(newRecord.accounts)) {
          onRemoteChange(newRecord);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        onStatusChange?.('CONNECTED');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Supabase Realtime socket status:', status, err);
        onStatusChange?.('DISCONNECTED');
      }
    });

  realtimeChannel = channel;

  return () => {
    try {
      client.removeChannel(channel);
    } catch {}
    if (realtimeChannel === channel) {
      realtimeChannel = null;
    }
  };
}

export const SUPABASE_SQL_SCRIPT = `-- 1. Tạo bảng farm_teams để lưu dữ liệu nông trại theo Mã Nhóm (Room ID)
create table if not exists public.farm_teams (
  room_id text primary key,
  accounts jsonb not null default '[]'::jsonb,
  orders jsonb not null default '[]'::jsonb,
  featured_crops jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Cho phép các bạn bè trong nhóm đọc và ghi dữ liệu (Public RLS)
alter table public.farm_teams enable row level security;

drop policy if exists "Cho phép các bạn bè đọc ghi dữ liệu nhóm" on public.farm_teams;
create policy "Cho phép các bạn bè đọc ghi dữ liệu nhóm"
  on public.farm_teams
  for all
  using (true)
  with check (true);

-- 3. Bật tính năng Realtime để điện thoại tự động nhảy số khi bạn bè cập nhật
alter publication supabase_realtime add table public.farm_teams;`;
