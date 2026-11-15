import React from 'react';
import { Moon, Sun, Plus, Download, ClipboardList, Smartphone, Cloud, RefreshCw } from 'lucide-react';
import { Account } from '../types';
import { CropImage } from './CropImage';

interface NavbarProps {
  accounts: Account[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewAccount: () => void;
  onOpenBackup: () => void;
  onOpenFarmOrder: () => void;
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
  theme,
  onToggleTheme,
  onOpenNewAccount,
  onOpenBackup,
  onOpenFarmOrder,
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

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-[#14161C]/95 border-b border-slate-200 dark:border-[#26282F] px-4 lg:px-8 py-3.5 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25 p-1 shrink-0">
            <CropImage name="Khoai lang" className="w-8 h-8 object-contain drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
                Play Together Farm
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Quản Lý Rương Đồ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8e95a5] hidden sm:block font-medium">
              Kiểm tra củ quả &amp; tự động làm đơn hàng trên toàn bộ tài khoản
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1C1E24] border border-slate-200 dark:border-[#2B2D35] text-xs text-slate-600 dark:text-[#9a9fa8]">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang hoạt động: <strong className="text-emerald-600 dark:text-emerald-400">{activeCount}</strong>/{accounts.length}
            </span>
          </div>

          {/* Làm Đơn Nông Trại Button */}
          <button
            onClick={onOpenFarmOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Làm Đơn Nông Trại</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-[#1C1E24] text-slate-600 dark:text-[#9a9fa8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2B2D35] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Nút Làm Mới / Đồng Bộ Ngay (Luôn luôn hiển thị) */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title={
              cloudRoomId
                ? 'Làm mới và tải toàn bộ dữ liệu mới nhất từ Cloud ngay lập tức'
                : 'Tải lại dữ liệu tài khoản và rương'
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs sm:text-sm font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className="font-bold">
              {isSyncing ? 'Đang tải...' : syncFeedback ? syncFeedback : 'Làm mới'}
            </span>
          </button>

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
                ? `Đang kết nối trực tiếp với phòng: ${cloudRoomId}`
                : cloudStatus === 'CONNECTING'
                ? 'Đang kết nối tới Supabase Cloud...'
                : cloudStatus === 'DISCONNECTED'
                ? 'Mất kết nối tới Cloud. Bấm để thử kết nối lại hoặc mở cài đặt'
                : 'Cài đặt đồng bộ Cloud Realtime cho nhóm bạn bè'
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              cloudStatus === 'CONNECTED'
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30'
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
            <span className="hidden sm:inline">
              {cloudStatus === 'CONNECTED'
                ? `🟢 Cloud: ${cloudRoomId}`
                : cloudStatus === 'CONNECTING'
                ? '🟡 Đang nối Cloud...'
                : cloudStatus === 'DISCONNECTED'
                ? '🔴 Mất nối (Bấm thử lại)'
                : '☁️ Cloud Nhóm'}
            </span>
          </button>

          {/* Mở trên điện thoại */}
          <button
            onClick={onOpenConnectMobile}
            title="Mở ứng dụng trên điện thoại (iPhone / Android)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-extrabold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">📱 Trên Đt</span>
          </button>

          {/* Backup */}
          <button
            onClick={onOpenBackup}
            title="Sao lưu & Xuất nhập file"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#1C1E24] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2B2D35] transition-colors"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Sao lưu</span>
          </button>

          {/* Add account */}
          <button
            onClick={onOpenNewAccount}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>
    </header>
  );
};
