import { useState, useEffect } from 'react';
import { Account, FruitStock, OrderAllocation } from '../types';
import { INITIAL_ACCOUNTS } from '../data/initialData';

const STORAGE_KEY = 'play_together_accounts_v2';

export function getTotalFruits(account: Account): number {
  if (!account.fruits || !Array.isArray(account.fruits)) return 0;
  return account.fruits.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading accounts from localStorage', err);
    }
    return INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.error('Error saving accounts to localStorage', err);
    }
  }, [accounts]);

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

  // Hoàn tất đơn hàng: Tự động trừ số lượng trái trên các tài khoản đã phân bổ
  const fulfillOrder = (allocations: OrderAllocation[]) => {
    setAccounts((prevAccounts) => {
      // Clone accounts
      const newAccounts = prevAccounts.map((acc) => {
        // Find all allocations for this account
        const accAllocations = allocations.filter((a) => a.accountId === acc.id);
        if (accAllocations.length === 0) return acc;

        let newFruits = [...acc.fruits];

        for (const alloc of accAllocations) {
          newFruits = newFruits
            .map((fruit) => {
              if (fruit.id === alloc.fruitStockId) {
                const remaining = Math.max(0, fruit.quantity - alloc.takeQuantity);
                return { ...fruit, quantity: remaining };
              }
              return fruit;
            })
            .filter((fruit) => fruit.quantity > 0); // Xóa những dòng trái có số lượng về 0
        }

        return {
          ...acc,
          fruits: newFruits,
          updatedAt: new Date().toISOString(),
        };
      });

      return newAccounts;
    });
  };

  const exportToCSV = () => {
    const headers = ['Tài khoản', 'Tên nhân vật', 'Role ID', 'Tình trạng', 'Level', 'Kim cương', 'Vé', 'Tổng quả trong rương', 'Ghi chú'];
    const rows = accounts.map((acc) => [
      `"${acc.username}"`,
      `"${acc.characterName}"`,
      `"${acc.roleId}"`,
      acc.status === 'active' ? 'Vào được' : acc.status === 'banned' ? 'Bị khóa' : acc.status === 'wrong_pw' ? 'Sai mật khẩu' : 'Chưa kiểm tra',
      acc.stars,
      acc.gems,
      acc.tickets,
      getTotalFruits(acc),
      `"${(acc.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `PlayTogether_Farm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(accounts, null, 2));
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
      if (!Array.isArray(parsed)) {
        return { success: false, message: 'Dữ liệu tệp JSON không hợp lệ.' };
      }
      const validAccounts: Account[] = parsed.map((item, idx) => ({
        id: item.id || `acc_imported_${Date.now()}_${idx}`,
        username: String(item.username || 'unknown'),
        password: String(item.password || ''),
        characterName: String(item.characterName || item.username || 'NoName'),
        roleId: String(item.roleId || ''),
        status: ['active', 'banned', 'wrong_pw', 'pending'].includes(item.status) ? item.status : 'active',
        note: String(item.note || ''),
        stars: Number(item.stars) || 1,
        gems: Number(item.gems) || 0,
        tickets: Number(item.tickets) || 0,
        fruits: Array.isArray(item.fruits)
          ? item.fruits.map((f: FruitStock, fIdx: number) => ({
              id: f.id || `fs_${Date.now()}_${fIdx}`,
              fruitName: String(f.fruitName || 'Trái cây'),
              fruitIcon: String(f.fruitIcon || '🍎'),
              variants: Array.isArray(f.variants) ? f.variants : [],
              quantity: Number(f.quantity) || 0,
            }))
          : [],
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      setAccounts(validAccounts);
      return { success: true, message: `Đã nhập thành công ${validAccounts.length} tài khoản!`, count: validAccounts.length };
    } catch (err: any) {
      return { success: false, message: 'Lỗi đọc tệp: ' + (err.message || 'Không thể giải mã dữ liệu.') };
    }
  };

  const resetToSampleData = () => {
    setAccounts(INITIAL_ACCOUNTS);
  };

  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    fulfillOrder,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToSampleData,
  };
}
