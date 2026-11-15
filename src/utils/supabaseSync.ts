import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Account, FarmOrder } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  roomId: string; // Tên phòng / mã nhóm (ví dụ: team_nongdan_2026)
}

export interface RemoteFarmData {
  room_id: string;
  accounts: Account[];
  orders: FarmOrder[];
  featured_crops: string[];
  updated_at: string;
}

const CONFIG_STORAGE_KEY = 'pt_supabase_config';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let lastPushedTimestamp = 0;

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
  if (supabaseClient) return supabaseClient;
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
  if (realtimeChannel) {
    try {
      realtimeChannel.unsubscribe();
    } catch {}
    realtimeChannel = null;
  }
  supabaseClient = null;
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

    const { data, error } = await client
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
 * Tải dữ liệu từ Supabase về
 */
export async function fetchRemoteTeamData(
  config: SupabaseConfig
): Promise<RemoteFarmData | null> {
  try {
    const client = getOrCreateSupabaseClient(config);
    const { data, error } = await client
      .from('farm_teams')
      .select('*')
      .eq('room_id', config.roomId.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Lỗi tải dữ liệu nhóm:', error);
      return null;
    }

    if (data) {
      return data as RemoteFarmData;
    }
  } catch (err) {
    console.error('fetchRemoteTeamData error:', err);
  }
  return null;
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
 */
export function subscribeToTeamRoom(
  config: SupabaseConfig,
  onRemoteChange: (data: RemoteFarmData) => void
): () => void {
  const client = getOrCreateSupabaseClient(config);

  if (realtimeChannel) {
    try {
      realtimeChannel.unsubscribe();
    } catch {}
    realtimeChannel = null;
  }

  const channelName = 'room_' + config.roomId.trim();
  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'farm_teams',
        filter: `room_id=eq.${config.roomId.trim()}`,
      },
      (payload) => {
        // Nếu thay đổi do chính máy này vừa gửi lên trong vòng 1.5 giây thì bỏ qua
        if (Date.now() - lastPushedTimestamp < 1500) {
          return;
        }

        const newRecord = payload.new as RemoteFarmData;
        if (newRecord && Array.isArray(newRecord.accounts)) {
          onRemoteChange(newRecord);
        }
      }
    )
    .subscribe();

  realtimeChannel = channel;

  return () => {
    try {
      channel.unsubscribe();
    } catch {}
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
