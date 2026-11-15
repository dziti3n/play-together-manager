import React from 'react';
import { Search, X, Sparkles, Eye } from 'lucide-react';
import { Account, StatusFilter } from '../types';
import { PLAY_TOGETHER_CROPS, PLAY_TOGETHER_VARIANTS } from '../data/initialData';

interface FilterBarProps {
  accounts: Account[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  numericField: string;
  numericValue: number | null;
  onNumericFilterChange: (field: any, val: number | null) => void;
  // Bộ lọc trái + biến thể nhanh (giống phần chi tiết đơn hàng)
  selectedFruit: string;
  onSelectFruit: (crop: string) => void;
  selectedVariant: string;
  onSelectVariant: (variant: string) => void;
  onOpenFruitInspect?: () => void;
  totalMatchingFruits?: number;
  totalMatchingAccounts?: number;
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
  selectedFruit = 'all',
  onSelectFruit,
  selectedVariant = 'all',
  onSelectVariant,
  onOpenFruitInspect,
  totalMatchingFruits = 0,
  totalMatchingAccounts = 0,
}) => {
  const countAll = accounts.length;
  const countActive = accounts.filter((a) => a.status === 'active').length;
  const countBanned = accounts.filter((a) => a.status === 'banned').length;
  const countWrongPw = accounts.filter((a) => a.status === 'wrong_pw').length;

  return (
    <div className="space-y-3.5 mb-6">
      {/* Top row: Search input & Numeric filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#8e95a5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tài khoản, Role ID, tên nhân vật..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1C1E24] text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-[#717684] border border-slate-200 dark:border-[#2B2F3A] focus:outline-none focus:border-sky-500 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Numeric Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1E24] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-[#2B2F3A] shadow-xs">
          <span className="text-xs text-slate-500 dark:text-[#8e95a5] font-bold">
            📊 Lọc số:
          </span>

          <select
            value={numericField}
            onChange={(e) => onNumericFilterChange(e.target.value, numericValue)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="none" className="bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-slate-200">
              Chọn mục
            </option>
            <option value="fruits" className="bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-slate-200">
              📦 Rương quả ≥
            </option>
            <option value="gems" className="bg-white dark:bg-[#1C1E24] text-slate-800 dark:text-slate-200">
              💎 Kim Cương ≥
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

      {/* Row 2: Tìm Trái & Biến Thể Nhanh (Giống chi tiết đơn hàng) */}
      <div className="flex flex-wrap items-center gap-2.5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-sky-500/10 p-2.5 rounded-2xl border border-amber-500/20 dark:border-purple-500/20 shadow-xs">
        <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pl-1">
          <span>🌾</span>
          <span>Tìm Nông Sản &amp; Biến Thể:</span>
        </span>

        {/* Chọn Cây / Trái */}
        <select
          value={selectedFruit}
          onChange={(e) => onSelectFruit(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2026] text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#2C2F3A] focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
        >
          <option value="all">Tất cả nông sản (41 loại)</option>
          {PLAY_TOGETHER_CROPS.map((c) => (
            <option key={c.name} value={c.name}>
              {c.emoji || '🍎'} {c.name}
            </option>
          ))}
        </select>

        {/* Chọn Biến Thể */}
        <select
          value={selectedVariant}
          onChange={(e) => onSelectVariant(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2026] text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#2C2F3A] focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
        >
          <option value="all">Tất cả biến thể (Mọi trái)</option>
          <option value="normal">⚪ Trái thường (Không đột biến)</option>
          {PLAY_TOGETHER_VARIANTS.map((v) => (
            <option key={v.name} value={v.name}>
              ✨ {v.name}
            </option>
          ))}
        </select>

        {/* Nút Xem Chi Tiết Từng Quả (giống chi tiết đơn hàng) */}
        {(selectedFruit !== 'all' || selectedVariant !== 'all') && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
              Có: <strong>{totalMatchingFruits ?? 0} quả</strong> trên{' '}
              <strong>{totalMatchingAccounts ?? 0} acc</strong>
            </span>

            {onOpenFruitInspect && (
              <button
                type="button"
                onClick={onOpenFruitInspect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md shadow-purple-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem chi tiết</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectFruit('all');
                onSelectVariant('all');
              }}
              title="Xóa bộ lọc nông sản"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
            statusFilter === 'all'
              ? 'bg-slate-800 dark:bg-slate-700 text-white'
              : 'bg-white dark:bg-[#1C1E24] text-slate-600 dark:text-[#8e95a5] border border-slate-200 dark:border-[#2B2F3A] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Tất cả</span>
          <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-600 dark:text-cyan-400 text-[11px] font-black">
            {countAll}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('active')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
            statusFilter === 'active'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40'
              : 'bg-white dark:bg-[#1C1E24] text-slate-600 dark:text-[#8e95a5] border border-slate-200 dark:border-[#2B2F3A] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Vào được</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-black">
            {countActive}
          </span>
        </button>

        {countBanned > 0 && (
          <button
            onClick={() => onStatusFilterChange('banned')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
              statusFilter === 'banned'
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40'
                : 'bg-white dark:bg-[#1C1E24] text-slate-600 dark:text-[#8e95a5] border border-slate-200 dark:border-[#2B2F3A] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Bị khóa</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] font-black">
              {countBanned}
            </span>
          </button>
        )}

        {countWrongPw > 0 && (
          <button
            onClick={() => onStatusFilterChange('wrong_pw')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
              statusFilter === 'wrong_pw'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-white dark:bg-[#1C1E24] text-slate-600 dark:text-[#8e95a5] border border-slate-200 dark:border-[#2B2F3A] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Sai mật khẩu</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black">
              {countWrongPw}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
