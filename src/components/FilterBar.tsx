import React from 'react';
import { Search, X } from 'lucide-react';
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
}) => {
  const countAll = accounts.length;
  const countActive = accounts.filter((a) => a.status === 'active').length;
  const countBanned = accounts.filter((a) => a.status === 'banned').length;
  const countWrongPw = accounts.filter((a) => a.status === 'wrong_pw').length;

  return (
    <div className="space-y-3.5 mb-5">
      {/* Top row: Search input & Numeric filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e95a5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tài khoản, Role ID, tên nhân vật..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#1c1e22] text-sm text-slate-100 placeholder-[#717684] border border-[#2b2d35] focus:outline-none focus:border-cyan-500 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e95a5] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Numeric Filter */}
        <div className="flex items-center gap-2 bg-[#1c1e22] px-3 py-1.5 rounded-xl border border-[#2b2d35]">
          <span className="text-xs text-[#8e95a5] font-medium">
            📊 Lọc số:
          </span>

          <select
            value={numericField}
            onChange={(e) => onNumericFilterChange(e.target.value, numericValue)}
            className="bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="none" className="bg-[#1c1e22] text-slate-200">
              Chọn mục
            </option>
            <option value="fruits" className="bg-[#1c1e22] text-slate-200">
              📦 Rương quả ≥
            </option>
            <option value="gems" className="bg-[#1c1e22] text-slate-200">
              💎 Kim Cương ≥
            </option>
            <option value="stars" className="bg-[#1c1e22] text-slate-200">
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
              className="w-20 px-2 py-0.5 rounded bg-[#272a31] text-xs text-white border border-[#373a43] focus:outline-none focus:border-cyan-400"
            />
          )}

          {numericField !== 'none' && (
            <button
              onClick={() => onNumericFilterChange('none', null)}
              className="text-[#8e95a5] hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-700 text-white ring-1 ring-slate-500'
              : 'bg-[#1c1e22] text-[#8e95a5] hover:text-white'
          }`}
        >
          <span>Tất cả</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold">
            {countAll}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('active')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            statusFilter === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
              : 'bg-[#1c1e22] text-[#8e95a5] hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Vào được</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            {countActive}
          </span>
        </button>

        {countBanned > 0 && (
          <button
            onClick={() => onStatusFilterChange('banned')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              statusFilter === 'banned'
                ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                : 'bg-[#1c1e22] text-[#8e95a5] hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Bị khóa</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-bold">
              {countBanned}
            </span>
          </button>
        )}

        {countWrongPw > 0 && (
          <button
            onClick={() => onStatusFilterChange('wrong_pw')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              statusFilter === 'wrong_pw'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-[#1c1e22] text-[#8e95a5] hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Sai mật khẩu</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
              {countWrongPw}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
