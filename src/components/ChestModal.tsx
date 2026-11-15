import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Account, FruitStock } from '../types';
import { PLAY_TOGETHER_CROPS, PLAY_TOGETHER_VARIANTS, GameCrop } from '../data/initialData';

interface ChestModalProps {
  account: Account | null;
  onClose: () => void;
  onUpdateAccount: (updated: Account) => void;
  onOpenAIScan: (account: Account) => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  account,
  onClose,
  onUpdateAccount,
  onOpenAIScan,
}) => {
  if (!account) return null;

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New fruit state
  const [selectedCrop, setSelectedCrop] = useState<GameCrop>(PLAY_TOGETHER_CROPS[0]);
  const [customFruitName, setCustomFruitName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [newFruitQty, setNewFruitQty] = useState<number>(5);

  // Expanded fruit names
  const [expandedFruits, setExpandedFruits] = useState<Record<string, boolean>>({});

  const toggleExpand = (fruitName: string) => {
    setExpandedFruits((prev) => ({
      ...prev,
      [fruitName]: prev[fruitName] === undefined ? false : !prev[fruitName],
    }));
  };

  const handleToggleVariant = (variantName: string) => {
    if (selectedVariants.includes(variantName)) {
      setSelectedVariants(selectedVariants.filter((v) => v !== variantName));
    } else {
      if (selectedVariants.length >= 5) {
        alert('Một trái chỉ có thể nhiễm tối đa 5 biến thể!');
        return;
      }
      setSelectedVariants([...selectedVariants, variantName]);
    }
  };

  const handleAddFruit = () => {
    const name = useCustomName ? customFruitName.trim() : selectedCrop.name;
    const icon = useCustomName ? '🍎' : selectedCrop.icon;
    if (!name) return;

    const newStock: FruitStock = {
      id: 'fs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      fruitName: name,
      fruitIcon: icon,
      variants: [...selectedVariants],
      quantity: Math.max(1, Number(newFruitQty) || 1),
    };

    const updatedAccount: Account = {
      ...account,
      fruits: [newStock, ...account.fruits],
    };

    onUpdateAccount(updatedAccount);
    setSelectedVariants([]);
    setNewFruitQty(5);
    setShowAddForm(false);
  };

  const handleUpdateQuantity = (stockId: string, delta: number) => {
    const updatedFruits = account.fruits
      .map((f) => (f.id === stockId ? { ...f, quantity: Math.max(0, f.quantity + delta) } : f))
      .filter((f) => f.quantity > 0);

    onUpdateAccount({
      ...account,
      fruits: updatedFruits,
    });
  };

  const handleDirectQuantity = (stockId: string, val: number) => {
    const updatedFruits = account.fruits
      .map((f) => (f.id === stockId ? { ...f, quantity: Math.max(0, val) } : f))
      .filter((f) => f.quantity > 0);

    onUpdateAccount({
      ...account,
      fruits: updatedFruits,
    });
  };

  const handleDeleteStock = (stockId: string) => {
    onUpdateAccount({
      ...account,
      fruits: account.fruits.filter((f) => f.id !== stockId),
    });
  };

  // Group fruits by fruitName
  const groupedFruits = useMemo(() => {
    const groups: Record<
      string,
      {
        fruitName: string;
        fruitIcon: string;
        totalQuantity: number;
        stocks: FruitStock[];
      }
    > = {};

    for (const stock of account.fruits) {
      if (!groups[stock.fruitName]) {
        groups[stock.fruitName] = {
          fruitName: stock.fruitName,
          fruitIcon: stock.fruitIcon,
          totalQuantity: 0,
          stocks: [],
        };
      }
      groups[stock.fruitName].totalQuantity += stock.quantity;
      groups[stock.fruitName].stocks.push(stock);
    }

    return Object.values(groups).filter((g) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchName = g.fruitName.toLowerCase().includes(q);
      const matchVar = g.stocks.some((s) => s.variants.some((v) => v.toLowerCase().includes(q)));
      return matchName || matchVar;
    });
  }, [account.fruits, search]);

  const totalFruitCount = account.fruits.reduce((sum, f) => sum + f.quantity, 0);

  const getVariantStyle = (varName: string) => {
    return PLAY_TOGETHER_VARIANTS.find((v) => v.name === varName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Rương Nông Sản: {account.username}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  {totalFruitCount} trái
                </span>
              </div>
              <p className="text-xs text-[#8e95a5]">
                Quản lý từng quả và các biến thể nhiễm (tối đa 5 biến thể/trái)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAIScan(account)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all"
              title="Quét rương đồ tự động bằng AI Gemini"
            >
              <Bot className="w-4 h-4 text-purple-300" />
              <span className="hidden sm:inline">AI Quét Rương</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252830]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 sm:px-7 border-b border-[#2b2d35] bg-[#191a1e] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e95a5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh tên trái hoặc biến thể..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#22242a] text-xs sm:text-sm text-white placeholder-[#717684] border border-[#323640] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm quả mới</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
          {/* Add Fruit Form */}
          {showAddForm && (
            <div className="p-5 rounded-2xl bg-[#20232a] border border-emerald-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Thêm Nông Sản Vào Rương</span>
                </h4>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Select fruit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    1. Chọn loại trái (41 loại cây chuẩn Play Together):
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomName(!useCustomName)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {useCustomName ? '← Chọn từ danh sách game' : '+ Tự gõ tên khác'}
                  </button>
                </div>

                {useCustomName ? (
                  <input
                    type="text"
                    value={customFruitName}
                    onChange={(e) => setCustomFruitName(e.target.value)}
                    placeholder="Nhập tên loại quả..."
                    className="w-full px-3 py-2 rounded-xl bg-[#17181c] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-1 bg-[#17181c] rounded-xl border border-[#2b2d35]">
                    {PLAY_TOGETHER_CROPS.map((crop) => {
                      const isSel = selectedCrop.name === crop.name;
                      return (
                        <button
                          key={crop.name}
                          type="button"
                          onClick={() => setSelectedCrop(crop)}
                          className={`p-1.5 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                            isSel
                              ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-300 scale-105'
                              : 'bg-[#22242a] text-slate-300 hover:bg-[#2c2f38]'
                          }`}
                        >
                          <span className="text-xl mb-0.5">{crop.icon}</span>
                          <span className="text-[10px] font-medium truncate w-full px-0.5">
                            {crop.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Select variants (up to 5) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    2. Chọn Biến Thể Nhiễm (Đã chọn: <strong className="text-amber-400">{selectedVariants.length}</strong>/5):
                  </label>
                  {selectedVariants.length === 0 && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ Trái thường (Không biến thể)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#17181c] rounded-xl border border-[#2b2d35]">
                  {PLAY_TOGETHER_VARIANTS.map((variant) => {
                    const isSelected = selectedVariants.includes(variant.name);
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleToggleVariant(variant.name)}
                        style={{
                          backgroundColor: isSelected ? variant.bgColor : '#22242a',
                          color: isSelected ? variant.color : '#94a3b8',
                          borderColor: isSelected ? variant.borderColor : '#334155',
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          isSelected ? 'ring-1 shadow scale-105' : 'hover:border-slate-500'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Quantity */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Số lượng:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newFruitQty}
                    onChange={(e) => setNewFruitQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 px-3 py-1.5 rounded-lg bg-[#17181c] text-sm font-bold text-center text-emerald-400 border border-[#323640] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFruit}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
                  >
                    Lưu vào rương
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Fruits List */}
          {groupedFruits.length === 0 ? (
            <div className="py-12 text-center text-[#8e95a5]">
              <div className="text-3xl mb-2">🧺</div>
              <p className="text-sm font-semibold">Chưa có quả nào trong rương</p>
              <p className="text-xs mt-1">Bấm "Thêm quả mới" hoặc dùng "AI Quét Rương" để nạp vào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedFruits.map((group) => {
                const isExpanded = expandedFruits[group.fruitName] !== false; // expanded by default

                return (
                  <div
                    key={group.fruitName}
                    className="rounded-2xl bg-[#17181c] border border-[#2b2d35] overflow-hidden transition-colors hover:border-slate-600"
                  >
                    {/* Fruit Group Header */}
                    <div
                      onClick={() => toggleExpand(group.fruitName)}
                      className="px-4 sm:px-5 py-3 flex items-center justify-between cursor-pointer bg-[#202228] hover:bg-[#252830] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1 bg-[#17181c] rounded-xl">
                          {group.fruitIcon}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{group.fruitName}</span>
                            <span className="text-xs text-[#8e95a5] font-normal">
                              ({group.stocks.length} đợt / loại)
                            </span>
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-sm border border-emerald-500/30">
                          Tổng: {group.totalQuantity}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Stock Batches under this fruit */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 space-y-2 divide-y divide-[#26282f]">
                        {group.stocks.map((stock) => (
                          <div
                            key={stock.id}
                            className="pt-2 first:pt-0 flex flex-wrap items-center justify-between gap-2"
                          >
                            {/* Variants Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                              {stock.variants.length === 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                                  Trái thường (Không biến thể)
                                </span>
                              ) : (
                                stock.variants.map((vName) => {
                                  const style = getVariantStyle(vName);
                                  return (
                                    <span
                                      key={vName}
                                      style={{
                                        backgroundColor: style ? style.bgColor : '#334155',
                                        color: style ? style.color : '#e2e8f0',
                                        borderColor: style ? style.borderColor : '#475569',
                                      }}
                                      className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                                    >
                                      ✦ {vName}
                                    </span>
                                  );
                                })
                              )}
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={() => handleUpdateQuantity(stock.id, -10)}
                                className="px-1.5 py-1 rounded bg-[#23252d] hover:bg-[#2e313b] text-[10px] text-slate-400 font-bold"
                                title="Giảm 10"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => handleUpdateQuantity(stock.id, -1)}
                                className="p-1 rounded bg-[#23252d] hover:bg-[#2e313b] text-slate-300"
                                title="Giảm 1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={stock.quantity}
                                onChange={(e) =>
                                  handleDirectQuantity(stock.id, Number(e.target.value))
                                }
                                className="w-16 px-1.5 py-1 text-center font-bold text-sm bg-[#22242b] text-emerald-300 rounded border border-[#32353e] focus:outline-none focus:border-emerald-400"
                              />

                              <button
                                onClick={() => handleUpdateQuantity(stock.id, 1)}
                                className="p-1 rounded bg-[#23252d] hover:bg-emerald-600 text-slate-300 hover:text-white"
                                title="Tăng 1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateQuantity(stock.id, 10)}
                                className="px-1.5 py-1 rounded bg-[#23252d] hover:bg-emerald-600 text-[10px] text-slate-300 hover:text-white font-bold"
                                title="Tăng 10"
                              >
                                +10
                              </button>

                              <button
                                onClick={() => handleDeleteStock(stock.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 ml-1"
                                title="Xóa đợt này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-5 sm:px-7 py-3.5 border-t border-[#2b2d35] bg-[#16171b]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm font-bold transition-all"
          >
            Đóng rương
          </button>
        </div>
      </div>
    </div>
  );
};
