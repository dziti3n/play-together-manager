import React, { useState, useMemo } from 'react';
import { X, Search, Check, Pin, RotateCcw, Trash2 } from 'lucide-react';
import { PLAY_TOGETHER_CROPS } from '../data/initialData';
import { CropImage } from './CropImage';

interface FeaturedCropsModalProps {
  isOpen: boolean;
  onClose: () => void;
  featuredCrops: string[];
  onToggleCrop: (cropName: string) => void;
  onResetDefaults: () => void;
  onClearAll?: () => void;
}

export const FeaturedCropsModal: React.FC<FeaturedCropsModalProps> = ({
  isOpen,
  onClose,
  featuredCrops,
  onToggleCrop,
  onResetDefaults,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');

  const filteredCrops = useMemo(() => {
    return PLAY_TOGETHER_CROPS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center text-lg shadow-xs">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                Chọn Quả Nổi Bật Hiển Thị Trên Bảng
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                {featuredCrops.length > 0 ? (
                  <>
                    Các quả được chọn sẽ hiện thành cột riêng (Đã chọn:{' '}
                    <strong className="text-sky-600 dark:text-sky-400 font-extrabold">
                      {featuredCrops.length}
                    </strong>{' '}
                    quả)
                  </>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Chưa chọn quả nào (Không bắt buộc phải chọn, có thể để trống)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar & quick action */}
        <div className="p-4 sm:px-6 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#FAF7F2] dark:bg-[#1C1E24] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh loại quả cần ghim lên bảng..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#252831] text-xs sm:text-sm font-bold border border-[#E8E2D5] dark:border-[#353945] focus:outline-none focus:border-sky-500"
            />
          </div>

          {featuredCrops.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors shrink-0 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bỏ chọn hết</span>
            </button>
          )}
        </div>

        {/* Crops Grid with proper CropImage */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredCrops.map((crop) => {
              const isSelected = featuredCrops.includes(crop.name);

              return (
                <button
                  key={crop.name}
                  type="button"
                  onClick={() => onToggleCrop(crop.name)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xs ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500 text-sky-800 dark:text-sky-300 ring-1 ring-sky-500/40'
                      : 'bg-white dark:bg-[#252831] border-[#E8E2D5] dark:border-[#353945] text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <CropImage name={crop.name} className="w-6 h-6 object-contain shrink-0 drop-shadow-xs" />
                    <span className="font-extrabold text-xs truncate text-slate-800 dark:text-slate-100">
                      {crop.name}
                    </span>
                  </div>

                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định (Khoai lang, Lúa)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#25A9E0] hover:bg-[#1d96c9] text-white text-xs font-black shadow-md shadow-sky-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Xác nhận &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
