import { useState, useEffect, useRef, useCallback } from 'react';
import { Account, FarmOrder, HarvestedFruit } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_ORDERS } from '../data/initialData';
import {
  SupabaseConfig,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  fetchRemoteTeamData,
  pushRemoteTeamData,
  subscribeToTeamRoom,
  ConnectionStatus,
} from '../utils/supabaseSync';

const ACCOUNTS_STORAGE_KEY = 'play_together_accounts_v4';
const ORDERS_STORAGE_KEY = 'play_together_orders_v2';
const FEATURED_CROPS_KEY = 'play_together_featured_crops_v2';
const DEFAULT_FEATURED_CROPS: string[] = [];

export function getTotalFruits(account: Account): number {
  return account.fruits ? account.fruits.length : 0;
}

function computeTeamDataHash(data: { accounts: Account[]; orders: FarmOrder[]; featuredCrops: string[] }): string {
  try {
    return JSON.stringify({
      acc: data.accounts,
      ord: data.orders,
      fc: data.featuredCrops,
    });
  } catch {
    return '';
  }
}

export function useAccounts() {
  // Tự động dọn dẹp các cache dữ liệu mẫu cũ (tunafish / sample orders) nếu có trong trình duyệt
  useEffect(() => {
    try {
      localStorage.removeItem('play_together_accounts_v3');
      localStorage.removeItem('play_together_accounts_v2');
      localStorage.removeItem('play_together_accounts_v1');
      localStorage.removeItem('play_together_orders_v1');
    } catch {}
  }, []);

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading accounts', err);
    }
    return INITIAL_ACCOUNTS;
  });

  const [orders, setOrders] = useState<FarmOrder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading orders', err);
    }
    return INITIAL_ORDERS;
  });

  const [featuredCrops, setFeaturedCrops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FEATURED_CROPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('Error loading featured crops', err);
    }
    return DEFAULT_FEATURED_CROPS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.error('Error saving accounts', err);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error saving orders', err);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(FEATURED_CROPS_KEY, JSON.stringify(featuredCrops));
    } catch (err) {
      console.error('Error saving featured crops', err);
    }
  }, [featuredCrops]);

  // ================= CLOUD REALTIME SYNC (SUPABASE) =================
  const [cloudConfig, setCloudConfig] = useState<SupabaseConfig | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('s_url');
      const anonKey = params.get('s_key');
      const roomId = params.get('s_room');
      const geminiKey = params.get('s_gemini');
      if (geminiKey) {
        try {
          localStorage.setItem('gemini_api_key', decodeURIComponent(geminiKey).trim());
        } catch {}
      }
      if (url && anonKey && roomId) {
        const inviteConfig: SupabaseConfig = {
          url: decodeURIComponent(url).trim(),
          anonKey: decodeURIComponent(anonKey).trim(),
          roomId: decodeURIComponent(roomId).trim(),
        };
        saveSupabaseConfig(inviteConfig);
        window.history.replaceState({}, document.title, window.location.pathname);
        return inviteConfig;
      }
    } catch {}
    return getSavedSupabaseConfig();
  });

  const [cloudStatus, setCloudStatus] = useState<ConnectionStatus>(
    cloudConfig ? 'CONNECTING' : 'IDLE'
  );

  const isRemoteUpdatingRef = useRef(false);
  const isInitialSyncedRef = useRef(false);
  const lastSyncedHashRef = useRef<string>('');

  // Hàm tải dữ liệu mới nhất từ Cloud về máy
  const syncFromRemote = useCallback(async (cfg: SupabaseConfig) => {
    try {
      setCloudStatus('CONNECTING');
      const result = await fetchRemoteTeamData(cfg);

      if (result.data) {
        // Có dữ liệu phòng trên Cloud
        const remote = result.data;
        const remoteHash = computeTeamDataHash({
          accounts: remote.accounts,
          orders: remote.orders,
          featuredCrops: remote.featured_crops,
        });

        // Chỉ cập nhật state nếu dữ liệu trên Cloud khác với bộ nhớ hiện tại
        if (remoteHash !== lastSyncedHashRef.current) {
          isRemoteUpdatingRef.current = true;
          lastSyncedHashRef.current = remoteHash;
          if (Array.isArray(remote.accounts)) setAccounts(remote.accounts);
          if (Array.isArray(remote.orders)) setOrders(remote.orders);
          if (Array.isArray(remote.featured_crops)) setFeaturedCrops(remote.featured_crops);
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 600);
        }

        isInitialSyncedRef.current = true;
        setCloudStatus('CONNECTED');
        return true;
      } else if (result.notFound) {
        // Phòng hoàn toàn mới chưa từng có trên Supabase: đẩy dữ liệu hiện tại lên để khởi tạo
        const currentHash = computeTeamDataHash({ accounts, orders, featuredCrops });
        lastSyncedHashRef.current = currentHash;
        isInitialSyncedRef.current = true;
        await pushRemoteTeamData(cfg, { accounts, orders, featuredCrops });
        setCloudStatus('CONNECTED');
        return true;
      } else {
        // Lỗi mạng hoặc Supabase: TUYỆT ĐỐI KHÔNG ĐÈ DỮ LIỆU
        console.warn('Lỗi mạng khi tải dữ liệu từ Cloud, giữ nguyên dữ liệu hiện tại:', result.error);
        setCloudStatus('DISCONNECTED');
        return false;
      }
    } catch (err) {
      console.error('syncFromRemote error:', err);
      setCloudStatus('DISCONNECTED');
      return false;
    }
  }, [accounts, orders, featuredCrops]);

  // Kết nối và lắng nghe Realtime từ Cloud
  useEffect(() => {
    if (!cloudConfig || !cloudConfig.url || !cloudConfig.anonKey || !cloudConfig.roomId) {
      setCloudStatus('IDLE');
      isInitialSyncedRef.current = false;
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    // 1. Tải dữ liệu ban đầu
    syncFromRemote(cloudConfig);

    // 2. Đăng ký Realtime Broadcast Channel
    unsubscribe = subscribeToTeamRoom(
      cloudConfig,
      (remoteData) => {
        if (!isMounted) return;
        const remoteHash = computeTeamDataHash({
          accounts: remoteData.accounts,
          orders: remoteData.orders,
          featuredCrops: remoteData.featured_crops,
        });

        // Tránh giật hoặc cập nhật thừa
        if (remoteHash !== lastSyncedHashRef.current) {
          isRemoteUpdatingRef.current = true;
          lastSyncedHashRef.current = remoteHash;
          if (Array.isArray(remoteData.accounts)) setAccounts(remoteData.accounts);
          if (Array.isArray(remoteData.orders)) setOrders(remoteData.orders);
          if (Array.isArray(remoteData.featured_crops)) setFeaturedCrops(remoteData.featured_crops);
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 600);
        }
      },
      (status) => {
        if (!isMounted) return;
        setCloudStatus(status);
      }
    );

    // 3. Xử lý khi điện thoại (đặc biệt iPhone Safari) mở khóa hoặc quay lại trình duyệt
    const handleAppWakeup = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncFromRemote(cloudConfig);
      }
    };

    document.addEventListener('visibilitychange', handleAppWakeup);
    window.addEventListener('online', handleAppWakeup);
    window.addEventListener('focus', handleAppWakeup);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      document.removeEventListener('visibilitychange', handleAppWakeup);
      window.removeEventListener('online', handleAppWakeup);
      window.removeEventListener('focus', handleAppWakeup);
    };
  }, [cloudConfig?.url, cloudConfig?.anonKey, cloudConfig?.roomId]);

  // Tự động đẩy thay đổi từ máy này lên Cloud khi NGƯỜI DÙNG THỰC HIỆN THAO TÁC
  useEffect(() => {
    // KHÓA AN TOÀN:
    // 1. Chưa kết nối Cloud -> Không đẩy
    // 2. Chưa hoàn tất tải ban đầu (Initial Sync) -> TUYỆT ĐỐI KHÔNG ĐẨY (ngăn máy vợ mở lên ghi đè rỗng/cũ vào phòng chồng)
    // 3. Dữ liệu vừa nhận từ máy khác (isRemoteUpdatingRef) -> Không đẩy dội ngược
    if (!cloudConfig || !isInitialSyncedRef.current || isRemoteUpdatingRef.current) {
      return;
    }

    const currentHash = computeTeamDataHash({ accounts, orders, featuredCrops });

    // 4. Nếu dữ liệu hiện tại giống hệt với Cloud -> Không đẩy thừa
    if (currentHash === lastSyncedHashRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isRemoteUpdatingRef.current) return;
      lastSyncedHashRef.current = currentHash;
      await pushRemoteTeamData(cloudConfig, { accounts, orders, featuredCrops });
    }, 400);

    return () => clearTimeout(timer);
  }, [accounts, orders, featuredCrops, cloudConfig]);

  const reconnectCloud = useCallback(() => {
    if (cloudConfig) {
      syncFromRemote(cloudConfig);
    }
  }, [cloudConfig, syncFromRemote]);

  const toggleFeaturedCrop = (cropName: string) => {
    setFeaturedCrops((prev) => {
      if (prev.includes(cropName)) {
        // Can be empty (0 crops)
        return prev.filter((c) => c !== cropName);
      } else {
        return [...prev, cropName];
      }
    });
  };

  const clearFeaturedCrops = () => {
    setFeaturedCrops([]);
  };

  const resetFeaturedCrops = () => {
    setFeaturedCrops(DEFAULT_FEATURED_CROPS);
  };

  const addAccount = (accountData: Omit<Account, 'id' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => [newAccount, ...prev]);
    return newAccount;
  };

  const updateAccount = (updated: Account) => {
    const withUpdatedTime = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => prev.map((acc) => (acc.id === updated.id ? withUpdatedTime : acc)));
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Thêm danh sách trái mới vào tài khoản (hỗ trợ append)
  const addFruitsToAccount = (accountId: string, newFruits: Omit<HarvestedFruit, 'id' | 'createdAt'>[]) => {
    syncAccountFruits(accountId, newFruits, 'append');
  };

  // Đồng bộ nông sản vào rương tài khoản: hỗ trợ 'replace' (ghi đè toàn bộ) hoặc 'append' (cộng dồn)
  const syncAccountFruits = (
    accountId: string,
    newFruits: Omit<HarvestedFruit, 'id' | 'createdAt'>[],
    mode: 'replace' | 'append' = 'replace'
  ) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const mapped: HarvestedFruit[] = newFruits.map((f, idx) => ({
          ...f,
          id: 'fruit_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
          createdAt: new Date().toISOString(),
        }));
        return {
          ...acc,
          fruits: mode === 'replace' ? mapped : [...mapped, ...acc.fruits],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Xóa một trái cụ thể khỏi tài khoản
  const removeFruitFromAccount = (accountId: string, fruitId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return {
          ...acc,
          fruits: acc.fruits.filter((f) => f.id !== fruitId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Hoàn tất đơn hàng: Trừ các trái đã sử dụng trên từng tài khoản
  // deductionMap: { [accountId]: [fruitId1, fruitId2, ...] }
  const fulfillOrderDeduction = (deductionMap: Record<string, string[]>) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        const toRemoveIds = deductionMap[acc.id];
        if (!toRemoveIds || toRemoveIds.length === 0) return acc;
        const removeSet = new Set(toRemoveIds);
        return {
          ...acc,
          fruits: acc.fruits.filter((f) => !removeSet.has(f.id)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Orders CRUD
  const addOrder = (orderData: Omit<FarmOrder, 'id' | 'createdAt'>) => {
    const newOrder: FarmOrder = {
      ...orderData,
      id: 'order_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ accounts, orders }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PlayTogether_Farm_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importFromJSON = (jsonString: string): { success: boolean; message: string; count?: number } => {
    try {
      const parsed = JSON.parse(jsonString);
      const accList = Array.isArray(parsed) ? parsed : parsed.accounts;
      if (!Array.isArray(accList)) {
        return { success: false, message: 'Dữ liệu JSON không hợp lệ.' };
      }
      setAccounts(accList);
      if (parsed.orders && Array.isArray(parsed.orders)) {
        setOrders(parsed.orders);
      }
      return { success: true, message: `Đã nhập thành công ${accList.length} tài khoản!`, count: accList.length };
    } catch (err: any) {
      return { success: false, message: 'Lỗi đọc tệp: ' + err.message };
    }
  };

  const exportToCSV = () => {
    const headers = ['Tài khoản', 'Tên nhân vật', 'Role ID', 'Tình trạng', 'Level', 'Kim cương', 'Vé', 'Tổng số trái', 'Ghi chú'];
    const rows = accounts.map((acc) => [
      `"${acc.username}"`,
      `"${acc.characterName}"`,
      `"${acc.roleId}"`,
      acc.status === 'active' ? 'Vào được' : acc.status === 'banned' ? 'Bị khóa' : acc.status === 'wrong_pw' ? 'Sai MK' : 'Chưa kiểm tra',
      acc.stars,
      acc.gems,
      acc.tickets,
      getTotalFruits(acc),
      `"${(acc.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlayTogether_Farm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    a.remove();
  };

  const clearAllData = () => {
    setAccounts([]);
    setOrders([]);
    setFeaturedCrops([]);
    try {
      localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
      localStorage.removeItem(ORDERS_STORAGE_KEY);
      localStorage.removeItem(FEATURED_CROPS_KEY);
    } catch {}
  };

  const resetToSampleData = () => {
    clearAllData();
  };

  return {
    accounts,
    orders,
    featuredCrops,
    toggleFeaturedCrop,
    clearFeaturedCrops,
    resetFeaturedCrops,
    clearAllData,
    addAccount,
    updateAccount,
    deleteAccount,
    addFruitsToAccount,
    syncAccountFruits,
    removeFruitFromAccount,
    fulfillOrderDeduction,
    addOrder,
    deleteOrder,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToSampleData,
    isCloudConnected: cloudStatus === 'CONNECTED',
    cloudStatus,
    cloudConfig,
    setCloudConfig,
    reconnectCloud,
  };
}
