import React from 'react';
import { Moon, Sun, Plus, Download, ClipboardList } from 'lucide-react';
import { Account } from '../types';

interface NavbarProps {
  accounts: Account[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewAccount: () => void;
  onOpenBackup: () => void;
  onOpenFarmOrder: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  theme,
  onToggleTheme,
  onOpenNewAccount,
  onOpenBackup,
  onOpenFarmOrder,
}) => {
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#141518]/90 dark:bg-[#141518]/90 light:bg-white/90 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-extrabold text-lg tracking-wider">
            PT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white dark:text-white light:text-slate-800 tracking-tight">
                Play Together Farm
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Nông Trại &amp; Biến Thể
              </span>
            </div>
            <p className="text-xs text-[#8e95a5] dark:text-[#8e95a5] light:text-slate-500 hidden sm:block">
              Quản lý rương đồ &amp; tự động làm đơn trên toàn bộ tài khoản
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1e22] border border-[#2b2d35] text-xs text-[#9a9fa8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang hoạt động: <strong className="text-emerald-400">{activeCount}</strong>/{accounts.length}
            </span>
          </div>

          {/* Làm Đơn Nông Trại Button */}
          <button
            onClick={onOpenFarmOrder}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Làm Đơn Nông Trại</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
            className="p-2 rounded-xl bg-[#1c1e22] text-[#9a9fa8] hover:text-white border border-[#2b2d35] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Backup */}
          <button
            onClick={onOpenBackup}
            title="Sao lưu & Xuất nhập file"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1e22] text-xs sm:text-sm font-medium text-slate-200 hover:text-white border border-[#2b2d35] transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Sao lưu</span>
          </button>

          {/* Add account */}
          <button
            onClick={onOpenNewAccount}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>
    </header>
  );
};
