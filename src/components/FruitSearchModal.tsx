import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Copy,
  Check,
  RotateCcw,
  Package,
  Sparkles,
  UserCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Account, HarvestedFruit } from '../types';
import {
  PLAY_TOGETHER_CROPS,
  PLAY_TOGETHER_VARIANTS,
  GameCrop,
  getVariantStyle,
} from '../data/initialData';
import { CropImage } from './CropImage';
import { normalizeVietnamese } from './CropSearchSelect';

interface FruitSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onOpenChest: (account: Account) => void;
  initialFruit?: string | null;
  initialVariant?: string;
}

interface MatchingAccountGroup {
  account: Account;
  fruits: HarvestedFruit[];
}

export const FruitSearchModal: React.FC<FruitSearchModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onOpenChest,
  initialFruit = null,
  initialVariant = 'all',
}) => {
  if (!isOpen) return null;

  // Search input state for typing fruit name
  const [fruitSearchQuery, setFruitSearchQuery] = useState('');
  
  // Selected fruit (null = chưa chọn, hiển thị toàn bộ icon & tên trái để chọn)
  const [selectedFruit, setSelectedFruit] = useState<string | null>(initialFruit);

  // Selected variant ('all' | 'normal' | variantName)
  const [selectedVariant, setSelectedVariant] = useState<string>(initialVariant);

  // Copied Role ID state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRoleId = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roleId);
    setCopiedId(roleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tính tổng số quả của từng loại trái cây trên toàn bộ tài khoản
  const fruitStockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const acc of accounts) {
      for (const f of acc.fruits || []) {
        const key = f.fruitName.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [accounts]);

  // Lọc danh sách trái cây theo từ khóa tìm kiếm (hỗ trợ tiếng Việt có dấu và không dấu)
  const filteredCrops = useMemo(() => {
    const qNorm = normalizeVietnamese(fruitSearchQuery);
    if (!qNorm) return PLAY_TOGETHER_CROPS;
    return PLAY_TOGETHER_CROPS.filter((c) => {
      const nameNorm = normalizeVietnamese(c.name);
      return nameNorm.includes(qNorm);
    });
  }, [fruitSearchQuery]);

  // Đếm số lượng quả theo từng biến thể của trái đang chọn
  const variantCountsForSelectedFruit = useMemo(() => {
    if (!selectedFruit) return { normal: 0, total: 0, variants: {} as Record<string, number> };
    let normal = 0;
    let total = 0;
    const variants: Record<string, number> = {};

    for (const acc of accounts) {
      for (const f of acc.fruits || []) {
        if (f.fruitName.toLowerCase() === selectedFruit.toLowerCase()) {
          total++;
          if (!f.variants || f.variants.length === 0) {
            normal++;
          } else {
            for (const v of f.variants) {
              variants[v.toLowerCase()] = (variants[v.toLowerCase()] || 0) + 1;
            }
          }
        }
      }
    }
    return { normal, total, variants };
  }, [accounts, selectedFruit]);

  // Tìm các quả khớp với Trái cây + Biến thể trên toàn bộ tài khoản
  const searchResults = useMemo(() => {
    if (!selectedFruit) return { allMatches: [], groupedAccounts: [], totalFruits: 0 };

    const matches: { account: Account; fruit: HarvestedFruit }[] = [];

    for (const acc of accounts) {
      for (const fruit of acc.fruits || []) {
        if (fruit.fruitName.toLowerCase() !== selectedFruit.toLowerCase()) {
          continue;
        }

        let isMatch = false;
        if (selectedVariant === 'all') {
          isMatch = true;
        } else if (selectedVariant === 'normal') {
          isMatch = !fruit.variants || fruit.variants.length === 0;
        } else {
          isMatch = (fruit.variants || []).some(
            (v) => v.toLowerCase() === selectedVariant.toLowerCase()
          );
        }

        if (isMatch) {
          matches.push({ account: acc, fruit });
        }
      }
    }

    // Sắp xếp ưu tiên: trái ít biến thể nhất đứng trước, nhiều biến thể đứng sau
    matches.sort((a, b) => (a.fruit.variants?.length || 0) - (b.fruit.variants?.length || 0));

    // Gom nhóm theo tài khoản
    const groupMap = new Map<string, MatchingAccountGroup>();
    for (const m of matches) {
      const existing = groupMap.get(m.account.id);
      if (existing) {
        existing.fruits.push(m.fruit);
      } else {
        groupMap.set(m.account.id, {
          account: m.account,
          fruits: [m.fruit],
        });
      }
    }

    return {
      allMatches: matches,
      groupedAccounts: Array.from(groupMap.values()),
      totalFruits: matches.length,
    };
  }, [accounts, selectedFruit, selectedVariant]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-md p-1.5 shrink-0">
              {selectedFruit ? (
                <CropImage name={selectedFruit} className="w-7 h-7 object-contain drop-shadow" />
              ) : (
                <span className="text-xl">🌾</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                  Tìm Kiếm Nông Sản &amp; Biến Thể
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  41 Nông sản · 19 Biến thể
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedFruit
                  ? `Đang tra cứu: ${selectedFruit} · Chọn biến thể để lọc tài khoản`
                  : 'Gõ tên để tìm nhanh hoặc bấm chọn từ danh sách 41 loại trái cây bên dưới'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
          {/* ========================================================================= */}
          {/* BƯỚC 1: TÌM THEO TÊN - TRƯỚC KHI NHẬP TÊN HIỆN ICON VÀ TÊN TRÁI            */}
          {/* ========================================================================= */}
          {!selectedFruit ? (
            <div className="space-y-4">
              {/* Ô nhập tìm kiếm tên củ/quả */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                <input
                  type="text"
                  autoFocus
                  value={fruitSearchQuery}
                  onChange={(e) => setFruitSearchQuery(e.target.value)}
                  placeholder="Gõ tên trái để tìm nhanh... (vd: Lúa, Táo, Cà chua, Sầu riêng, Bắp...)"
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-[#252831] border-2 border-[#E8E2D5] dark:border-[#353945] focus:border-amber-500 dark:focus:border-amber-500 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-sm transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCrops.length > 0) {
                      e.preventDefault();
                      setSelectedFruit(filteredCrops[0].name);
                      setSelectedVariant('all');
                    }
                  }}
                />
                {fruitSearchQuery && (
                  <button
                    onClick={() => setFruitSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Lời nhắc hiển thị trước khi nhập tên */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>
                  {fruitSearchQuery
                    ? `Kết quả tìm kiếm cho "${fruitSearchQuery}" (${filteredCrops.length} loại trái):`
                    : 'Toàn bộ 41 loại trái cây (Bấm vào trái muốn tìm):'}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  💡 Hỗ trợ gõ tiếng Việt có dấu &amp; không dấu
                </span>
              </div>

              {/* Grid 41 củ/quả với ICON và TÊN TRÁI RÕ NÉT */}
              {filteredCrops.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="font-extrabold text-sm">Không tìm thấy nông sản nào với từ khóa "{fruitSearchQuery}"</p>
                  <p className="text-xs mt-1">Thử gõ tên khác như "Lúa", "Cà chua", "Bí ngô", "Táo"...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredCrops.map((crop) => {
                    const countInStock = fruitStockMap.get(crop.name.toLowerCase()) || 0;
                    const hasStock = countInStock > 0;

                    return (
                      <button
                        key={crop.name}
                        type="button"
                        onClick={() => {
                          setSelectedFruit(crop.name);
                          setSelectedVariant('all');
                        }}
                        className={`group relative p-3 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] ${
                          hasStock
                            ? 'bg-white dark:bg-[#252831] border-[#E8E2D5] dark:border-[#353945] hover:border-amber-500 dark:hover:border-amber-400 shadow-xs'
                            : 'bg-white/60 dark:bg-[#202229]/60 border-slate-200/80 dark:border-[#2C2F3A] hover:border-slate-300 opacity-80'
                        }`}
                      >
                        {/* Icon Trái Cây */}
                        <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1E24] border border-[#E8E2D5] dark:border-[#353945] flex items-center justify-center p-1 shrink-0 group-hover:border-amber-400 transition-colors">
                          <CropImage name={crop.name} className="w-8 h-8 object-contain drop-shadow-xs" />
                        </div>

                        {/* Tên Trái & Số lượng trong kho */}
                        <div className="overflow-hidden flex-1">
                          <h4 className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {crop.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                            {hasStock ? (
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                Có: {countInStock} quả
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Hết hàng</span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* BƯỚC 2 & 3: ĐÃ CHỌN TRÁI -> CHỌN BIẾN THỂ -> HIỆN KẾT QUẢ GIỐNG ĐƠN HÀNG */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Thanh hiển thị trái cây đang chọn + Nút đổi trái khác */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#252831] border-2 border-amber-400/50 dark:border-amber-500/40 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] border border-amber-400/40 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                    <CropImage name={selectedFruit} className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                        Đang chọn nông sản
                      </span>
                    </div>
                    <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100">
                      {selectedFruit}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tổng kho đang có: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{variantCountsForSelectedFruit.total} quả</strong> ({variantCountsForSelectedFruit.normal} quả thường)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFruit(null);
                    setFruitSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1E24] hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-300 dark:border-slate-700 font-bold text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chọn trái khác</span>
                </button>
              </div>

              {/* BỘ LỌC BIẾN THỂ: CHỌN BIẾN THỂ RỒI TÌM KIẾM */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Chọn biến thể cần tìm:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Bấm chọn biến thể để lọc danh sách tài khoản
                  </span>
                </div>

                {/* Danh sách các chip biến thể (Tất cả, Trái thường, 19 Biến thể) */}
                <div className="flex flex-wrap gap-2">
                  {/* 1. Tất cả biến thể */}
                  <button
                    type="button"
                    onClick={() => setSelectedVariant('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedVariant === 'all'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                        : 'bg-slate-100 dark:bg-[#1C1E24] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    🌟 Tất cả biến thể ({variantCountsForSelectedFruit.total})
                  </button>

                  {/* 2. Trái thường */}
                  <button
                    type="button"
                    onClick={() => setSelectedVariant('normal')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedVariant === 'normal'
                        ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-[#1C1E24] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    ⚪ Trái thường ({variantCountsForSelectedFruit.normal})
                  </button>

                  {/* 3. 19 Biến thể game Play Together */}
                  {PLAY_TOGETHER_VARIANTS.map((v) => {
                    const isSelected = selectedVariant.toLowerCase() === v.name.toLowerCase();
                    const style = getVariantStyle(v.name);
                    const vCount = variantCountsForSelectedFruit.variants[v.name.toLowerCase()] || 0;

                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v.name)}
                        style={{
                          backgroundColor: isSelected ? (style ? style.color : '#a855f7') : style ? style.bgColor : '#2A2D37',
                          color: isSelected ? '#ffffff' : style ? style.color : '#e2e8f0',
                          borderColor: style ? style.borderColor : '#475569',
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                          isSelected
                            ? 'shadow-md scale-105 ring-2 ring-white/50'
                            : 'hover:scale-102 opacity-85 hover:opacity-100'
                        }`}
                      >
                        ✦ {v.name} {vCount > 0 && `(${vCount})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* KẾT QUẢ TÌM KIẾM: GIỐNG PHẦN CHI TIẾT CỦA CÁI ĐƠN HÀNG                   */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                {/* Thanh tóm tắt kết quả */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Kết quả tìm kiếm:
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      Tìm thấy {searchResults.totalFruits} quả trên {searchResults.groupedAccounts.length} tài khoản
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Đang xem: <strong>{selectedVariant === 'all' ? 'Tất cả biến thể' : selectedVariant === 'normal' ? 'Trái thường' : selectedVariant}</strong>
                  </span>
                </div>

                {/* Danh sách các tài khoản có trái khớp */}
                {searchResults.groupedAccounts.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-[#252831] rounded-3xl border border-[#E8E2D5] dark:border-[#353945] p-6 space-y-2">
                    <div className="text-4xl">🧺</div>
                    <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                      Không có tài khoản nào giữ {selectedFruit} (Biến thể: {selectedVariant === 'all' ? 'Tất cả' : selectedVariant === 'normal' ? 'Trái thường' : selectedVariant})
                    </p>
                    <p className="text-xs text-slate-400">
                      Thử chuyển sang <strong>"Tất cả biến thể"</strong> hoặc bấm <strong>"Chọn trái khác"</strong> để tìm củ/quả khác.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVariant('all')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                      >
                        Xem tất cả biến thể của {selectedFruit}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.groupedAccounts.map(({ account, fruits }) => {
                      return (
                        <div
                          key={account.id}
                          className="p-4 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] shadow-xs space-y-3 transition-all hover:border-amber-400 dark:hover:border-amber-500"
                        >
                          {/* Hàng Header Tài Khoản: Tên Game / ID Game / Trạng thái / Mở Rương */}
                          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm shrink-0">
                                {(account.characterName || account.username || 'P').charAt(0).toUpperCase()}
                              </div>

                              <div>
                                {/* Tên Game Nhân Vật (Tiêu đề chính) */}
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                                    {account.characterName || 'Chưa đặt tên NV'}
                                  </h4>
                                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    Có {fruits.length} quả
                                  </span>
                                </div>

                                {/* ID Game & Trạng thái */}
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyRoleId(e, account.roleId)}
                                    title="Bấm để sao chép ID Game"
                                    className="font-mono text-xs text-sky-600 dark:text-cyan-400 font-extrabold flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors"
                                  >
                                    <span>ID: {account.roleId || 'No ID'}</span>
                                    {copiedId === account.roleId ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-sky-400" />
                                    )}
                                  </button>

                                  <span>·</span>

                                  {account.status === 'active' && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Vào được
                                    </span>
                                  )}
                                  {account.status === 'banned' && (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      Bị khóa
                                    </span>
                                  )}
                                  {account.status === 'wrong_pw' && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Sai MK
                                    </span>
                                  )}
                                  {account.status === 'pending' && (
                                    <span className="text-slate-400 font-medium text-[11px]">
                                      Chưa test
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Nút Mở Rương của tài khoản này */}
                            <button
                              type="button"
                              onClick={() => onOpenChest(account)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-xs"
                            >
                              <Package className="w-4 h-4 text-amber-500" />
                              <span>Mở rương tài khoản</span>
                            </button>
                          </div>

                          {/* Danh sách từng quả trong tài khoản này (Giống phần chi tiết của FarmOrderModal) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {fruits.map((f, fIdx) => {
                              const variantCount = f.variants?.length || 0;

                              return (
                                <div
                                  key={f.id || fIdx}
                                  className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2026] border border-[#E8E2D5] dark:border-[#2C2F3A] flex items-center justify-between gap-2.5"
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                                      <CropImage name={f.fruitName} className="w-6 h-6 object-contain" />
                                    </div>

                                    <div className="overflow-hidden">
                                      <div className="flex items-center gap-1.5">
                                        <h5 className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                                          {f.fruitName} #{fIdx + 1}
                                        </h5>
                                        {f.weight && (
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                                            ({f.weight} kg)
                                          </span>
                                        )}
                                      </div>

                                      {/* Biến thể */}
                                      <div className="flex flex-wrap items-center gap-1 mt-1">
                                        {variantCount === 0 ? (
                                          <span className="text-[10px] text-slate-400 font-medium">
                                            ⚪ Trái thường
                                          </span>
                                        ) : (
                                          f.variants.map((vName) => {
                                            const style = getVariantStyle(vName);
                                            const isTargetVariant =
                                              selectedVariant.toLowerCase() === vName.toLowerCase();

                                            return (
                                              <span
                                                key={vName}
                                                style={{
                                                  backgroundColor: style ? style.bgColor : '#334155',
                                                  color: style ? style.color : '#e2e8f0',
                                                  borderColor: style ? style.borderColor : '#475569',
                                                }}
                                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                                                  isTargetVariant
                                                    ? 'ring-2 ring-amber-400 ring-offset-1 font-black'
                                                    : ''
                                                }`}
                                              >
                                                {isTargetVariant && '★ '}
                                                {vName}
                                              </span>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nhãn tag */}
                                  <div className="shrink-0 text-right">
                                    {variantCount >= 3 ? (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                        Hiếm
                                      </span>
                                    ) : variantCount > 0 ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                        {variantCount} biến thể
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedFruit ? (
              <span>
                Đang lọc: <strong>{selectedFruit}</strong> · Biến thể: <strong>{selectedVariant === 'all' ? 'Tất cả' : selectedVariant}</strong>
              </span>
            ) : (
              <span>Chọn một loại củ/quả ở trên để tiếp tục bước chọn biến thể</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-opacity"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
