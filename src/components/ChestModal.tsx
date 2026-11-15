import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Bot,
  ArrowLeft,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { Account, HarvestedFruit } from '../types';
import {
  PLAY_TOGETHER_CROPS,
  PLAY_TOGETHER_VARIANTS,
  getCropIcon,
  getVariantStyle,
  GameCrop,
} from '../data/initialData';
import { CropImage } from './CropImage';
import { CropSearchSelect } from './CropSearchSelect';

interface ChestModalProps {
  account: Account | null;
  initialFruitName?: string | null;
  onClose: () => void;
  onAddFruits: (accountId: string, newFruits: Omit<HarvestedFruit, 'id' | 'createdAt'>[]) => void;
  onRemoveFruit: (accountId: string, fruitId: string) => void;
  onOpenAIScan: (account: Account) => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  account,
  initialFruitName,
  onClose,
  onAddFruits,
  onRemoveFruit,
  onOpenAIScan,
}) => {
  if (!account) return null;

  // View state: null = All Fruits Overview; string = Viewing specific fruit detail (e.g. 'Khoai lang')
  const [selectedFruitName, setSelectedFruitName] = useState<string | null>(
    initialFruitName || null
  );

  React.useEffect(() => {
    if (initialFruitName) {
      setSelectedFruitName(initialFruitName);
    }
  }, [initialFruitName]);

  const [search, setSearch] = useState('');

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<'default' | 'mutants' | 'normal_first' | 'newest'>('default');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'bien_the' | 'nong_san'>('bien_the');
  const [filterSelectedVariants, setFilterSelectedVariants] = useState<string[]>([]);
  const [filterExcludeMutants, setFilterExcludeMutants] = useState<boolean>(false);
  const [filterSelectedCrops, setFilterSelectedCrops] = useState<string[]>([]);

  // Modal to add fruits in View 1 (can pick any crop)
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [targetCrop, setTargetCrop] = useState<GameCrop>(PLAY_TOGETHER_CROPS[0]);

  // Modal to add fruits directly in View 2 (Image 2 - LOCKED to selectedFruitName, ONLY pick variants)
  const [showAddForCurrentFruitModal, setShowAddForCurrentFruitModal] = useState(false);

  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [batchCount, setBatchCount] = useState<number>(1);

  // Group all harvested fruits by fruitName
  const groupedSummary = useMemo(() => {
    const map: Record<string, { fruitName: string; icon: string; count: number; mutantCount: number }> = {};

    for (const f of account.fruits) {
      if (!map[f.fruitName]) {
        map[f.fruitName] = {
          fruitName: f.fruitName,
          icon: getCropIcon(f.fruitName),
          count: 0,
          mutantCount: 0,
        };
      }
      map[f.fruitName].count += 1;
      if (f.variants.length > 0) {
        map[f.fruitName].mutantCount += 1;
      }
    }

    return Object.values(map).filter((item) =>
      item.fruitName.toLowerCase().includes(search.toLowerCase())
    );
  }, [account.fruits, search]);

  // List of individual fruits filtered and sorted (NO weight dependency)
  const currentFruitList = useMemo(() => {
    let list = account.fruits;

    // Filter by selectedFruitName (if in fruit view) or by filterSelectedCrops
    if (selectedFruitName) {
      list = list.filter((f) => f.fruitName.toLowerCase() === selectedFruitName.toLowerCase());
    } else if (filterSelectedCrops.length > 0) {
      const set = new Set(filterSelectedCrops.map((c) => c.toLowerCase()));
      list = list.filter((f) => set.has(f.fruitName.toLowerCase()));
    }

    // Filter by mutants / variants
    if (filterExcludeMutants) {
      list = list.filter((f) => !f.variants || f.variants.length === 0);
    } else if (filterSelectedVariants.length > 0) {
      const vSet = new Set(filterSelectedVariants);
      list = list.filter((f) => f.variants && f.variants.some((v) => vSet.has(v)));
    }

    // Sort list
    return [...list].sort((a, b) => {
      if (sortBy === 'mutants') {
        return (b.variants?.length || 0) - (a.variants?.length || 0);
      }
      if (sortBy === 'normal_first') {
        return (a.variants?.length || 0) - (b.variants?.length || 0);
      }
      if (sortBy === 'newest') {
        return (b.id || '').localeCompare(a.id || '');
      }
      // 'default' (Theo cấp cao nhất): Most variants first
      return (b.variants?.length || 0) - (a.variants?.length || 0);
    });
  }, [
    account.fruits,
    selectedFruitName,
    filterSelectedCrops,
    filterExcludeMutants,
    filterSelectedVariants,
    sortBy,
  ]);

  const hasActiveFilters =
    filterSelectedVariants.length > 0 || filterExcludeMutants || filterSelectedCrops.length > 0;

  const handleToggleVariant = (vName: string) => {
    if (selectedVariants.includes(vName)) {
      setSelectedVariants(selectedVariants.filter((v) => v !== vName));
    } else {
      if (selectedVariants.length >= 5) {
        alert('Một trái chỉ có thể nhiễm tối đa 5 biến thể!');
        return;
      }
      setSelectedVariants([...selectedVariants, vName]);
    }
  };

  // Add batch in View 1 (any crop)
  const handleConfirmAddBatch = () => {
    const count = Math.max(1, Number(batchCount) || 1);
    const newItems: Omit<HarvestedFruit, 'id' | 'createdAt'>[] = [];

    for (let i = 0; i < count; i++) {
      newItems.push({
        fruitName: targetCrop.name,
        variants: [...selectedVariants],
      });
    }

    onAddFruits(account.id, newItems);
    setShowAddBatchModal(false);
    setSelectedVariants([]);
    setBatchCount(1);
  };

  // Add fruit directly in View 2 (Image 2 - LOCKED to selectedFruitName, ONLY choose variants!)
  const handleConfirmAddForCurrentFruit = () => {
    if (!selectedFruitName) return;
    const count = Math.max(1, Number(batchCount) || 1);
    const newItems: Omit<HarvestedFruit, 'id' | 'createdAt'>[] = [];

    for (let i = 0; i < count; i++) {
      newItems.push({
        fruitName: selectedFruitName,
        variants: [...selectedVariants],
      });
    }

    onAddFruits(account.id, newItems);
    setShowAddForCurrentFruitModal(false);
    setSelectedVariants([]);
    setBatchCount(1);
  };

  const totalFruitsInChest = account.fruits.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================== VIEW 1: TỔNG QUAN TẤT CẢ CÁC TRÁI ===================== */}
        {!selectedFruitName ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center text-xl shadow-xs">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black">
                      Rương Nông Sản: {account.username}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
                      {totalFruitsInChest} trái
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                    Bấm vào từng loại trái để xem chi tiết biến thể và thu hoạch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAIScan(account)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                  title="Quét rương tự động bằng AI Gemini"
                >
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Quét Rương</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="p-4 sm:px-7 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#FAF7F2] dark:bg-[#1C1E24] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm nhanh tên trái trong rương..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#252831] text-xs sm:text-sm font-bold border border-[#E8E2D5] dark:border-[#353945] focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={() => {
                  setTargetCrop(PLAY_TOGETHER_CROPS[0]);
                  setSelectedVariants([]);
                  setBatchCount(1);
                  setShowAddBatchModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Thêm trái</span>
              </button>
            </div>

            {/* Grid of all owned crops */}
            <div className="p-6 overflow-y-auto flex-1">
              {groupedSummary.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="text-4xl mb-2">🧺</div>
                  <p className="text-sm font-semibold">Chưa có trái nào trong rương</p>
                  <p className="text-xs mt-1">Bấm "Thêm trái" hoặc dùng "AI Quét Rương" để nạp vào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {groupedSummary.map((item) => (
                    <div
                      key={item.fruitName}
                      onClick={() => {
                        setSelectedFruitName(item.fruitName);
                        setFilterSelectedVariants([]);
                        setFilterExcludeMutants(false);
                      }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] hover:border-sky-400 dark:hover:border-sky-400 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col items-center text-center justify-between gap-2"
                    >
                      <div className="w-16 h-16 p-2 rounded-2xl bg-[#F4EFE6] dark:bg-[#1E2026] group-hover:scale-110 transition-transform flex items-center justify-center">
                        <CropImage name={item.fruitName} className="w-12 h-12 object-contain drop-shadow" />
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-sky-500 transition-colors">
                          {item.fruitName}
                        </h4>
                        <span className="text-xs font-black text-sky-600 dark:text-sky-400 mt-0.5 block">
                          {item.count} trái
                        </span>
                      </div>

                      {item.mutantCount > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-extrabold border border-purple-500/30">
                          ✦ {item.mutantCount} đột biến
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Trái thường
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ===================== VIEW 2: CHI TIẾT THU HOẠCH TRÁI (ẢNH 2 CHUẨN GAME) ===================== */
          <>
            {/* Top Bar matching in-game Screenshot 4 / Ảnh 2 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedFruitName(null);
                    setFilterSelectedVariants([]);
                    setFilterExcludeMutants(false);
                    setFilterSelectedCrops([]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#252831] border border-[#E2DCcf] dark:border-[#353945] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tất cả quả</span>
                </button>

                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <span>Thu hoạch trái</span>
                  {selectedFruitName && (
                    <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
                      ({selectedFruitName})
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Nút Thêm Trái Trực Tiếp (Image 2 - Khóa chặt theo loại quả hiện tại, chỉ chọn biến thể) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVariants([]);
                    setBatchCount(1);
                    setShowAddForCurrentFruitModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                  title={`Thêm củ/quả ${selectedFruitName} mới trực tiếp vào rương`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Thêm {selectedFruitName}</span>
                </button>

                {/* Sorting Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white dark:bg-[#252831] border border-[#E2DCcf] dark:border-[#353945] rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="default">Theo cấp cao nhất</option>
                  <option value="mutants">Nhiều đột biến nhất</option>
                  <option value="normal_first">Trái thường trước</option>
                  <option value="newest">Mới nhất</option>
                </select>

                {/* Filter button with orange indicator */}
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
                    hasActiveFilters
                      ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300'
                      : 'bg-white dark:bg-[#252831] border-[#E2DCcf] dark:border-[#353945] text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Lọc</span>
                  {hasActiveFilters && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#252831] absolute -top-1 -right-1" />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of individual fruit cards (ĐÃ BỎ ICON ⚙ VÀ ĐÃ XÓA HẾT KÍ (KG) KẾ BÊN TRÁI) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-[#FAF7F2] dark:bg-[#1C1E24]">
              {currentFruitList.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">Không có củ/quả nào phù hợp bộ lọc.</p>
                  <button
                    onClick={() => {
                      setSelectedVariants([]);
                      setBatchCount(1);
                      setShowAddForCurrentFruitModal(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md"
                  >
                    + Thêm {selectedFruitName} ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentFruitList.map((fruit) => (
                    <div
                      key={fruit.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] shadow-xs flex items-center justify-between gap-3 transition-all hover:border-sky-400"
                    >
                      {/* Left: Round Cyan background - ĐÃ BỎ ICON HOA/BÁNH RĂNG ⚙ (HÌNH 1) */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-[#18C2DC]/20 border-2 border-[#18C2DC] flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                          <CropImage name={fruit.fruitName} className="w-8 h-8 object-contain drop-shadow" />
                        </div>

                        {/* Middle: Name (ĐÃ XÓA KÍ/CÂN NẶNG KẾ BÊN TRÁI), and Variant Tags */}
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                            {fruit.fruitName}
                          </h4>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {fruit.variants.length === 0 ? (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Trái thường
                              </span>
                            ) : (
                              fruit.variants.map((vName) => {
                                const style = getVariantStyle(vName);
                                return (
                                  <span
                                    key={vName}
                                    style={{
                                      color: style ? style.color : '#e2e8f0',
                                      backgroundColor: style ? `${style.color}15` : '#334155',
                                      borderColor: style ? `${style.color}40` : '#475569',
                                    }}
                                    className="px-2 py-0.5 rounded-full text-[11px] font-extrabold border"
                                  >
                                    {vName}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right button: Sky-blue "Thu hoạch" button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa / thu hoạch trái "${fruit.fruitName}" này?`)) {
                            onRemoveFruit(account.id, fruit.id);
                          }
                        }}
                        className="px-4 py-2 rounded-2xl bg-[#00A3FF] hover:bg-[#0092E6] active:scale-95 text-white text-xs font-black shadow-md shadow-sky-500/25 transition-all shrink-0"
                      >
                        Thu hoạch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Bar matching Screenshot 4 / Ảnh 2 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
              <button
                onClick={() => {
                  setFilterSelectedVariants([]);
                  setFilterExcludeMutants(false);
                  setFilterSelectedCrops([]);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#E8DFD0] dark:bg-[#252831] hover:bg-[#DDD3C2] text-slate-700 dark:text-slate-200 text-xs font-black transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Refresh</span>
              </button>

              {/* Purple button "Thu hoạch đồng loạt" - Khóa theo loại quả hiện tại, chỉ chọn biến thể */}
              <button
                onClick={() => {
                  setSelectedVariants([]);
                  setBatchCount(5);
                  setShowAddForCurrentFruitModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9B51E0] hover:bg-[#8A43CE] active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-600/30 transition-all"
              >
                <span className="text-base font-bold">+</span>
                <span>Thu hoạch đồng loạt ({selectedFruitName})</span>
              </button>
            </div>
          </>
        )}

        {/* ===================== MODAL: LỌC NÔNG SẢN (CHUẨN ẢNH GAME 1, 2, 3) ===================== */}
        {showFilterModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div
              className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-4 text-center border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                  Lọc nông sản
                </h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#FAF7F2] dark:bg-[#1C1E24] px-6 pt-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('bien_the')}
                  className={`pb-2.5 px-4 text-sm font-black transition-all relative ${
                    filterTab === 'bien_the'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-[#8e95a5]'
                  }`}
                >
                  Biến thể
                  {filterTab === 'bien_the' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5E3C] dark:bg-amber-500 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('nong_san')}
                  className={`pb-2.5 px-4 text-sm font-black transition-all relative ${
                    filterTab === 'nong_san'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-[#8e95a5]'
                  }`}
                >
                  Nông sản
                  {filterTab === 'nong_san' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5E3C] dark:bg-amber-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {filterTab === 'bien_the' ? (
                  /* TAB 1: BIẾN THỂ (Screenshot 3) */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {PLAY_TOGETHER_VARIANTS.map((v) => {
                        const isChecked = filterSelectedVariants.includes(v.name);
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => {
                              setFilterSelectedVariants((prev) =>
                                prev.includes(v.name)
                                  ? prev.filter((x) => x !== v.name)
                                  : [...prev, v.name]
                              );
                            }}
                            className={`py-2 px-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                              isChecked
                                ? 'bg-white dark:bg-[#252831] border-amber-500 ring-1 ring-amber-500/40 shadow-xs'
                                : 'bg-white dark:bg-[#252831] border-[#E8E2D5] dark:border-[#353945] hover:border-slate-400'
                            }`}
                          >
                            <span style={{ color: v.color }} className="truncate font-black">
                              {v.name}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 ml-1 ${
                                isChecked
                                  ? 'bg-amber-500 border-amber-600 text-white font-black'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1C1E24]'
                              }`}
                            >
                              {isChecked && '✓'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Checkbox "Ngoại trừ trái đột biến" */}
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterExcludeMutants}
                        onChange={(e) => setFilterExcludeMutants(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                        Ngoại trừ trái đột biến (Chỉ xem trái thường)
                      </span>
                    </label>
                  </div>
                ) : (
                  /* TAB 2: NÔNG SẢN (Screenshots 1 & 2) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {PLAY_TOGETHER_CROPS.map((crop) => {
                      const countInChest = account.fruits.filter(
                        (f) => f.fruitName.toLowerCase() === crop.name.toLowerCase()
                      ).length;
                      const isChecked = filterSelectedCrops.includes(crop.name);

                      return (
                        <button
                          key={crop.name}
                          type="button"
                          onClick={() => {
                            setFilterSelectedCrops((prev) =>
                              prev.includes(crop.name)
                                ? prev.filter((x) => x !== crop.name)
                                : [...prev, crop.name]
                            );
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-white dark:bg-[#252831] border-amber-500 ring-1 ring-amber-500/40 shadow-xs'
                              : 'bg-white dark:bg-[#252831] border-[#E8E2D5] dark:border-[#353945] hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <CropImage name={crop.name} className="w-5 h-5 object-contain shrink-0" />
                            <span className="truncate text-slate-800 dark:text-slate-200 font-extrabold text-[11px]">
                              {crop.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <span className="text-[11px] font-black text-slate-400">
                              {countInChest}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                isChecked
                                  ? 'bg-amber-500 border-amber-600 text-white font-black'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1C1E24]'
                              }`}
                            >
                              {isChecked && '✓'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Buttons: Bỏ chọn tất cả & Cài đặt bộ lọc */}
              <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
                <button
                  type="button"
                  onClick={() => {
                    setFilterSelectedVariants([]);
                    setFilterExcludeMutants(false);
                    setFilterSelectedCrops([]);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#F5B418] hover:bg-[#E5A510] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all"
                >
                  Bỏ chọn tất cả
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2.5 rounded-full bg-[#00A3FF] hover:bg-[#0092E6] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all"
                >
                  Cài đặt bộ lọc
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL MỚI: THÊM TRÁI TRỰC TIẾP Ở ẢNH 2 (KHÓA CHẶT QUẢ, CHỈ CHỌN BIẾN THỂ) ===================== */}
        {showAddForCurrentFruitModal && selectedFruitName && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div
              className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Hiển thị loại quả cố định */}
              <div className="flex items-center justify-between border-b border-[#E8E2D5] dark:border-[#2B2F3A] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#18C2DC]/20 border border-[#18C2DC] flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                    <CropImage name={selectedFruitName} className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Thu Hoạch Trái: {selectedFruitName}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                      Quả cố định: <strong className="text-slate-800 dark:text-white">{selectedFruitName}</strong> (chỉ cần chọn biến thể)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddForCurrentFruitModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CHỈ ĐƯỢC CHỌN BIẾN THỂ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    Chọn biến thể nhiễm (Tối đa 5 biến thể, không chọn là Trái thường):
                  </label>
                  <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                    {selectedVariants.length}/5
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto p-2 bg-white dark:bg-[#252831] rounded-2xl border border-[#E8E2D5] dark:border-[#353945]">
                  {PLAY_TOGETHER_VARIANTS.map((v) => {
                    const isSelected = selectedVariants.includes(v.name);
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => handleToggleVariant(v.name)}
                        className={`p-2 rounded-xl text-xs font-black border transition-all truncate text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-700 dark:text-slate-300 border-[#E8E2D5] dark:border-[#353945] hover:border-purple-300'
                        }`}
                      >
                        <span style={{ color: isSelected ? '#ffffff' : v.color }} className="truncate">
                          {v.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SỐ LƯỢNG THU HOẠCH */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  Số lượng củ/quả {selectedFruitName} cần thêm:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] font-black text-sm focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {[1, 2, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBatchCount(num)}
                        className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                          batchCount === num
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                            : 'bg-white dark:bg-[#252831] border-[#E8E2D5] dark:border-[#353945] text-slate-600 dark:text-slate-300 hover:border-sky-400'
                        }`}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5] dark:border-[#2B2F3A]">
                <button
                  type="button"
                  onClick={() => setShowAddForCurrentFruitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddForCurrentFruit}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Xác nhận thêm {batchCount} {selectedFruitName}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL: THU HOẠCH Ở VIEW 1 (CHỌN TÙY Ý LOẠI QUẢ) ===================== */}
        {showAddBatchModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div
              className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E8E2D5] dark:border-[#2B2F3A] pb-3">
                <h4 className="font-black text-base flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                  <span>Thu Hoạch Trái Mới Vào Rương</span>
                </h4>
                <button
                  onClick={() => setShowAddBatchModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Chọn loại cây (Hỗ trợ gõ tìm kiếm nhanh, không cần cuộn tìm tay) */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. Loại cây thu hoạch:</span>
                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    💡 Nhập tên trái để chọn nhanh
                  </span>
                </label>
                <CropSearchSelect
                  value={targetCrop.name}
                  onChange={(crop) => setTargetCrop(crop)}
                  autoFocus={true}
                />
              </div>

              {/* 2. Chọn biến thể */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-300">
                    2. Biến thể nhiễm (Tối đa 5):
                  </label>
                  <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                    {selectedVariants.length}/5
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-white dark:bg-[#252831] rounded-2xl border border-[#E8E2D5] dark:border-[#353945]">
                  {PLAY_TOGETHER_VARIANTS.map((v) => {
                    const isSelected = selectedVariants.includes(v.name);
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => handleToggleVariant(v.name)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-black border transition-all truncate text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-700 dark:text-slate-300 border-[#E8E2D5] dark:border-[#353945] hover:border-purple-300'
                        }`}
                      >
                        <span className="truncate">{v.name}</span>
                        {isSelected && <Check className="w-3 h-3 shrink-0 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Số lượng trái cùng loại */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                  3. Số lượng trái thu hoạch:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] font-black text-sm focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5] dark:border-[#2B2F3A]">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddBatch}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};