import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Moon,
  Sun,
  Plus,
  Download,
  ClipboardList,
  Smartphone,
  Cloud,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import { Account, FarmOrder } from '../types';
import { CropImage } from './CropImage';

interface NavbarProps {
  accounts: Account[];
  orders?: FarmOrder[];
  orderCount?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewAccount: () => void;
  onOpenBackup: () => void;
  onOpenFarmOrder: () => void;
  onOpenFruitSearch?: () => void;
  onOpenConnectMobile: () => void;
  onOpenCloudSync: () => void;
  isCloudConnected?: boolean;
  cloudStatus?: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  cloudRoomId?: string;
  onReconnectCloud?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
  syncFeedback?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  orders = [],
  orderCount,
  theme,
  onToggleTheme,
  onOpenNewAccount,
  onOpenBackup,
  onOpenFarmOrder,
  onOpenFruitSearch,
  onOpenConnectMobile,
  onOpenCloudSync,
  isCloudConnected = false,
  cloudStatus = 'IDLE',
  cloudRoomId,
  onReconnectCloud,
  onManualSync,
  isSyncing = false,
  syncFeedback,
}) => {
  const activeCount = accounts.filter((a) => a.status === 'active').length;
  const countOfOrders = orderCount !== undefined ? orderCount : orders.length;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-[#14161C]/95 border-b border-slate-200 dark:border-[#26282F] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/25 p-1 shrink-0">
            <CropImage name="Khoai lang" className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                Play Together
              </h1>
              <span className="text-[9px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Farm
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#8e95a5] hidden xl:block font-medium">
              Kiểm tra củ quả &amp; tự động làm đơn hàng trên toàn bộ tài khoản
            </p>
          </div>
        </div>

        {/* Nút hành động chính (Gọn gàng, không bao giờ bị tràn màn hình) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Nút Làm Đơn Nông Trại (CÓ HUY HIỆU SỐ ĐƠN CHỜ LÀM) */}
          <button
            onClick={onOpenFarmOrder}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title={countOfOrders > 0 ? `Có ${countOfOrders} đơn hàng đang chờ làm` : 'Làm đơn nông trại'}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Làm Đơn</span>
            <span className="sm:hidden inline">Đơn</span>

            {countOfOrders > 0 && (
              <span className="min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 rounded-full bg-rose-500 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-white dark:border-[#14161C] shadow-sm animate-pulse shrink-0">
                {countOfOrders}
              </span>
            )}
          </button>

          {/* 2. Nút Tìm Nông Sản */}
          {onOpenFruitSearch && (
            <button
              onClick={onOpenFruitSearch}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs sm:text-sm font-black shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              title="Tìm kiếm củ/quả & biến thể nhanh trên toàn bộ tài khoản"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Tìm Nông Sản</span>
              <span className="sm:hidden inline">Tìm</span>
            </button>
          )}

          {/* 3. Nút Thêm Tài Khoản */}
          <button
            onClick={onOpenNewAccount}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title="Thêm tài khoản mới"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">Thêm tài khoản</span>
            <span className="sm:hidden inline">Thêm</span>
          </button>

          {/* 4. BIỂU TƯỢNG DẤU 3 GẠCH (HAMBURGER MENU ☰) - CHỨA TOÀN BỘ CÁC CÔNG CỤ CÒN LẠI */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all hover:scale-105 active:scale-95 shadow-xs ${
                isMenuOpen
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white'
                  : 'bg-slate-100 dark:bg-[#1C1E24] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2B2D35] hover:border-slate-400'
              }`}
              title="Menu tiện ích: Làm mới, Đồng bộ Cloud, Mở điện thoại, Sao lưu, Giao diện"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[2.5]" />
              )}
              <span className="hidden sm:inline">Menu</span>
            </button>

            {/* Panel Dropdown Menu khi bấm vào dấu 3 gạch */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1C1E24] rounded-2xl border-2 border-slate-200 dark:border-[#2E333D] shadow-2xl p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Làm mới / Đồng bộ dữ liệu */}
                <button
                  type="button"
                  onClick={() => {
                    if (onManualSync) onManualSync();
                    setIsMenuOpen(false);
                  }}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <RefreshCw className={`w-4 h-4 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span>{isSyncing ? 'Đang làm mới...' : syncFeedback || 'Làm mới dữ liệu'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-500 font-mono">F5</span>
                </button>

                {/* 2. Đồng bộ Cloud Supabase */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (cloudStatus === 'DISCONNECTED' && onReconnectCloud) {
                      onReconnectCloud();
                    } else {
                      onOpenCloudSync();
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <Cloud className="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <span>Đồng bộ Cloud</span>
                      {cloudRoomId && (
                        <p className="text-[10px] text-slate-400 font-normal">
                          Phòng: {cloudRoomId}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    cloudStatus === 'CONNECTED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : cloudStatus === 'CONNECTING'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {cloudStatus === 'CONNECTED' ? '🟢 Đã nối' : cloudStatus === 'CONNECTING' ? '🟡 Đang nối' : '⚙️ Cài đặt'}
                  </span>
                </button>

                {/* 3. Mở trên điện thoại khác */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenConnectMobile();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Quét mã mở trên đt khác</span>
                </button>

                {/* 4. Sao lưu & Xuất nhập file */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-500" />
                  </div>
                  <span>Sao lưu / Xuất nhập tệp</span>
                </button>

                {/* 5. Chuyển giao diện Sáng / Tối */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    </div>
                    <span>{theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}</span>
                  </div>
                </button>

                {/* Footer thông tin acc */}
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Acc hoạt động:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {activeCount}/{accounts.length} tài khoản
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
