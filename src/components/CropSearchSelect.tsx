import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { PLAY_TOGETHER_CROPS, GameCrop } from '../data/initialData';
import { CropImage } from './CropImage';

export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

interface CropSearchSelectProps {
  value: string;
  onChange: (crop: GameCrop) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CropSearchSelect: React.FC<CropSearchSelectProps> = ({
  value,
  onChange,
  placeholder = 'Nhập tên trái để tìm nhanh (vd: Lúa, Anh đào...)...',
  className = '',
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCrop = useMemo(() => {
    return PLAY_TOGETHER_CROPS.find((c) => c.name.toLowerCase() === value.toLowerCase()) || PLAY_TOGETHER_CROPS[0];
  }, [value]);

  // Filter crops based on typed query (hỗ trợ gõ tiếng Việt có dấu hoặc không dấu)
  const filteredCrops = useMemo(() => {
    const qNorm = normalizeVietnamese(search);
    if (!qNorm) return PLAY_TOGETHER_CROPS;
    return PLAY_TOGETHER_CROPS.filter((c) => {
      const nameNorm = normalizeVietnamese(c.name);
      return nameNorm.includes(qNorm);
    });
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (crop: GameCrop) => {
    onChange(crop);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Clickable display / trigger */}
      <div
        onClick={() => {
          setIsOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] hover:border-sky-400 cursor-pointer shadow-xs transition-all"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] dark:bg-[#1E2026] border border-[#E8E2D5] dark:border-[#353945] flex items-center justify-center p-0.5 shrink-0">
            <CropImage name={selectedCrop.name} className="w-5 h-5 object-contain" />
          </div>
          <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
            {selectedCrop.name}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <span className="text-[10px] hidden sm:inline text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded-md border border-sky-500/20">
            Gõ để tìm
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu with Search Input */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-60 bg-[#FAF7F2] dark:bg-[#1C1E24] rounded-2xl border-2 border-sky-400 dark:border-sky-500 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoFocus={autoFocus}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-white dark:bg-[#252831] px-3 py-1.5 rounded-xl border border-[#E8E2D5] dark:border-[#353945] text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredCrops.length > 0) {
                  e.preventDefault();
                  handleSelect(filteredCrops[0]);
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtered Crops List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {filteredCrops.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                Không tìm thấy củ/quả nào với từ khóa "{search}"
              </div>
            ) : (
              filteredCrops.map((crop) => {
                const isSelected = crop.name.toLowerCase() === selectedCrop.name.toLowerCase();

                return (
                  <button
                    key={crop.name}
                    type="button"
                    onClick={() => handleSelect(crop)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-white font-black shadow-xs'
                        : 'hover:bg-white dark:hover:bg-[#252831] text-slate-800 dark:text-slate-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-6 h-6 rounded-md bg-white/80 dark:bg-black/20 flex items-center justify-center p-0.5 shrink-0">
                        <CropImage name={crop.name} className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs truncate">{crop.name}</span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-1.5 bg-[#FAF7F2] dark:bg-[#16171B] border-t border-[#E8E2D5] dark:border-[#2B2F3A] text-[10px] text-slate-400 font-bold flex justify-between items-center">
            <span>Tìm thấy {filteredCrops.length} loại quả</span>
            <span>Nhấn Enter để chọn quả đầu tiên</span>
          </div>
        </div>
      )}
    </div>
  );
};
