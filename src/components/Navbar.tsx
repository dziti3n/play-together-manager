import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Plus,
  Download,
  ClipboardList,
  Smartphone,
  Cloud,
  RefreshCw,
  Search,
  MoreVertical,
  Check,
  ShieldCheck,
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu mobile khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-[#14161C]/95 border-b border-slate-200 dark:border-[#26282F] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-md sm:shadow-lg shadow-orange-500/25 p-1 shrink-0">
            <CropImage name="Khoai lang" className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
                Play Together
              </h1>
              <span className="text-[9px] sm:text-[11px] font-extrabold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Farm
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8e95a5] hidden md:block font-medium">
              Kiểm tra củ quả &amp; tự động làm đơn hàng trên toàn bộ tài khoản
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Active status indicator (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1C1E24] border border-slate-200 dark:border-[#2B2D35] text-xs text-slate-600 dark:text-[#9a9fa8]">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Hoạt động: <strong className="text-emerald-600 dark:text-emerald-400">{activeCount}</strong>/{accounts.length}
            </span>
          </div>

          {/* 1. Nút Làm Đơn Nông Trại (CÓ HIỆN SỐ LƯỢNG ĐƠN HÀNG KHI CÓ ĐƠN TẠO) */}
          <button
            onClick={onOpenFarmOrder}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title={countOfOrders > 0 ? `Đang có ${countOfOrders} đơn hàng nông trại chờ làm` : 'Mở đơn nông trại'}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Làm Đơn Nông Trại</span>
            <span className="sm:hidden inline">Đơn</span>

            {/* Badge số lượng đơn xuất hiện khi có đơn được tạo */}
            {countOfOrders > 0 && (
              <span className="min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 rounded-full bg-rose-500 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border-2 border-white dark:border-[#14161C] shadow-sm animate-pulse shrink-0">
                {countOfOrders}
              </span>
            )}
          </button>

          {/* 2. Nút Tìm Nông Sản & Biến Thể */}
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

          {/* 4. Nút Làm Mới / Đồng Bộ Ngay */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title={
              cloudRoomId
                ? 'Làm mới và tải toàn bộ dữ liệu mới nhất từ Cloud ngay lập tức'
                : 'Tải lại dữ liệu tài khoản và rương'
            }
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs sm:text-sm font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 text-indigo-500 shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className="font-bold hidden lg:inline">
              {isSyncing ? 'Đang tải...' : syncFeedback ? syncFeedback : 'Làm mới'}
            </span>
          </button>

          {/* 5. CÁC NÚT DESKTOP (Ẩn trên màn hình điện thoại, chuyển vào menu dropdown để thanh công cụ không bị vỡ) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cloud Sync Nhóm Bạn Bè */}
            <button
              onClick={() => {
                if (cloudStatus === 'DISCONNECTED' && onReconnectCloud) {
                  onReconnectCloud();
                } else {
                  onOpenCloudSync();
                }
              }}
              title={
                cloudStatus === 'CONNECTED'
                  ? `Đang kết nối Cloud: ${cloudRoomId}`
                  : cloudStatus === 'CONNECTING'
                  ? 'Đang kết nối tới Supabase Cloud...'
                  : cloudStatus === 'DISCONNECTED'
                  ? 'Mất kết nối tới Cloud. Bấm để thử lại'
                  : 'Cài đặt đồng bộ Cloud Realtime'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                cloudStatus === 'CONNECTED'
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : cloudStatus === 'CONNECTING'
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  : cloudStatus === 'DISCONNECTED'
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
              }`}
            >
              <Cloud
                className={`w-4 h-4 ${
                  cloudStatus === 'CONNECTED'
                    ? 'animate-pulse text-emerald-500'
                    : cloudStatus === 'CONNECTING'
                    ? 'animate-spin text-amber-500'
                    : cloudStatus === 'DISCONNECTED'
                    ? 'text-rose-500'
                    : 'text-sky-500'
                }`}
              />
              <span className="hidden lg:inline">
                {cloudStatus === 'CONNECTED'
                  ? `🟢 ${cloudRoomId}`
                  : cloudStatus === 'CONNECTING'
                  ? '🟡 Đang nối...'
                  : cloudStatus === 'DISCONNECTED'
                  ? '🔴 Mất nối'
                  : '☁️ Cloud'}
              </span>
            </button>

            {/* Mở trên điện thoại */}
            <button
              onClick={onOpenConnectMobile}
              title="Mở ứng dụng trên điện thoại (iPhone / Android)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden lg:inline">📱 Đt</span>
            </button>

            {/* Backup */}
            <button
              onClick={onOpenBackup}
              title="Sao lưu & Xuất nhập file"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#1C1E24] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2B2D35] transition-colors"
            >
              <Download className="w-4 h-4 text-blue-500" />
              <span className="hidden lg:inline">Sao lưu</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-[#1C1E24] text-slate-600 dark:text-[#9a9fa8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2B2D35] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>

          {/* 6. NÚT MENU DROPDOWN CHO ĐIỆN THOẠI (md:hidden) */}
          <div className="relative md:hidden shrink-0" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-[#1C1E24] text-slate-600 dark:text-[#9a9fa8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2B2D35] transition-colors"
              title="Mở thêm tính năng"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Mobile Dropdown Panel */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1C1E24] rounded-2xl border border-slate-200 dark:border-[#2E333D] shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {/* Cloud Sync */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (cloudStatus === 'DISCONNECTED' && onReconnectCloud) {
                      onReconnectCloud();
                    } else {
                      onOpenCloudSync();
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-sky-500" />
                    <span>Đồng bộ Cloud</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    {cloudStatus === 'CONNECTED' ? '🟢 Đã nối' : '⚙️ Cài đặt'}
                  </span>
                </button>

                {/* Mở trên điện thoại */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenConnectMobile();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Quét QR mở trên đt khác</span>
                </button>

                {/* Sao lưu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Sao lưu / Xuất tệp</span>
                </button>

                {/* Chuyển theme */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252831] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    <span>{theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                  </div>
                </button>

                {/* Thông tin tài khoản hoạt động */}
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Acc hoạt động:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {activeCount}/{accounts.length}
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
