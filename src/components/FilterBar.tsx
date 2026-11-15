import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Account, StatusFilter } from '../types';

interface FilterBarProps {
  accounts: Account[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  numericField: string;
  numericValue: number | null;
  onNumericFilterChange: (field: any, val: number | null) => void;
  onOpenFruitSearch: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  accounts,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  numericField,
  numericValue,
  onNumericFilterChange,
  onOpenFruitSearch,
}) => {
  const countAll = accounts.length;
  const countActive = accounts.filter((a) => a.status === 'active').length;
  const countBanned = accounts.filter((a) => a.status === 'banned').length;
  const countWrongPw = accounts.filter((a) => a.status === 'wrong_pw').length;
  const countPending = accounts.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Search Accounts, Status Filter Tabs, Level filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1C1E24] p-3 rounded-2xl border border-[#E8E2D5] dark:border-[#282a32] shadow-xs">
        {/* Search input (Tên NV, Username, Role ID) */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo Tên Game, ID Game, Tên Đăng Nhập..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252831] text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 border border-transparent focus:border-sky-500 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#252831] p-1 rounded-xl overflow-x-auto border border-slate-200 dark:border-[#353842]">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tất cả ({countAll})
          </button>
          <button
            onClick={() => onStatusFilterChange('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Vào được ({countActive})
          </button>
          <button
            onClick={() => onStatusFilterChange('banned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'banned'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Bị khóa ({countBanned})
          </button>
          <button
            onClick={() => onStatusFilterChange('wrong_pw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'wrong_pw'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-500 hover:text-amber-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Sai mật khẩu ({countWrongPw})
          </button>
          {countPending > 0 && (
            <button
              onClick={() => onStatusFilterChange('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-slate-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Chưa test ({countPending})
            </button>
          )}
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={numericField}
            onChange={(e) => onNumericFilterChange(e.target.value, numericValue)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#252831] text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-[#353842] focus:outline-none"
          >
            <option value="none" className="bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-slate-200">
              Bộ lọc Level
            </option>
            <option value="stars" className="bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-slate-200">
              ⭐ Level ≥
            </option>
          </select>

          {numericField !== 'none' && (
            <input
              type="number"
              value={numericValue === null ? '' : numericValue}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                onNumericFilterChange(numericField, val);
              }}
              placeholder="Tối thiểu"
              className="w-20 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#252831] text-xs font-bold text-slate-800 dark:text-white border border-slate-300 dark:border-[#373a43] focus:outline-none focus:border-sky-400"
            />
          )}

          {numericField !== 'none' && (
            <button
              onClick={() => onNumericFilterChange('none', null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Thanh mở Tìm Nông Sản & Biến Thể Siêu Tốc */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-sky-500/10 p-3 rounded-2xl border border-amber-500/20 dark:border-orange-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg shadow-md shadow-orange-500/20 shrink-0">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                Tìm Kiếm Nông Sản &amp; Biến Thể
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                41 Cây · 19 Biến thể
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Gõ tên trái để tìm nhanh (hiện icon &amp; tên trái), chọn biến thể và xem ngay tài khoản nào đang có
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFruitSearch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs sm:text-sm font-black shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>Tìm Nông Sản &amp; Biến Thể</span>
        </button>
      </div>
    </div>
  );
};
