import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Account, FarmOrderItem, OrderAllocation } from '../types';
import { PLAY_TOGETHER_CROPS, PLAY_TOGETHER_VARIANTS } from '../data/initialData';

interface FarmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onFulfillOrder: (allocations: OrderAllocation[]) => void;
}

export const FarmOrderModal: React.FC<FarmOrderModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onFulfillOrder,
}) => {
  if (!isOpen) return null;

  // Order Items
  const [orderItems, setOrderItems] = useState<FarmOrderItem[]>([
    {
      id: 'item_1',
      fruitName: 'Dưa hấu',
      requiredVariants: ['Cực quang', 'Ánh vàng'],
      matchExactVariants: true,
      requiredQuantity: 6,
    },
    {
      id: 'item_2',
      fruitName: 'Cà chua',
      requiredVariants: ['Khí lạnh'],
      matchExactVariants: true,
      requiredQuantity: 10,
    },
  ]);

  // Form to add item to order
  const [newFruitName, setNewFruitName] = useState(PLAY_TOGETHER_CROPS[0].name);
  const [newRequiredVariants, setNewRequiredVariants] = useState<string[]>([]);
  const [newMatchExact, setNewMatchExact] = useState(true);
  const [newQty, setNewQty] = useState(5);
  const [showAddItem, setShowAddItem] = useState(false);

  // Manual allocation adjustments
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});

  const handleToggleNewVariant = (vName: string) => {
    if (newRequiredVariants.includes(vName)) {
      setNewRequiredVariants(newRequiredVariants.filter((v) => v !== vName));
    } else {
      if (newRequiredVariants.length >= 5) {
        alert('Tối đa 5 biến thể!');
        return;
      }
      setNewRequiredVariants([...newRequiredVariants, vName]);
    }
  };

  const handleAddOrderItem = () => {
    const newItem: FarmOrderItem = {
      id: 'item_' + Date.now(),
      fruitName: newFruitName,
      requiredVariants: [...newRequiredVariants],
      matchExactVariants: newMatchExact,
      requiredQuantity: Math.max(1, Number(newQty) || 1),
    };

    setOrderItems([...orderItems, newItem]);
    setNewRequiredVariants([]);
    setNewQty(5);
    setShowAddItem(false);
  };

  const handleRemoveOrderItem = (id: string) => {
    setOrderItems(orderItems.filter((i) => i.id !== id));
  };

  // Cross-Account Scanner & Smart Allocation
  const scanResults = useMemo(() => {
    return orderItems.map((orderItem) => {
      // Find all matching stocks across all accounts
      const matchedStocks: {
        account: Account;
        fruitStock: any;
      }[] = [];

      for (const acc of accounts) {
        for (const stock of acc.fruits) {
          if (stock.fruitName.toLowerCase() !== orderItem.fruitName.toLowerCase()) {
            continue;
          }

          if (orderItem.matchExactVariants) {
            // Check if stock has all required variants
            const hasAll = orderItem.requiredVariants.every((reqV) =>
              stock.variants.includes(reqV)
            );
            // If requiredVariants is empty, match only normal fruits (stock.variants.length === 0)
            if (orderItem.requiredVariants.length === 0) {
              if (stock.variants.length === 0) {
                matchedStocks.push({ account: acc, fruitStock: stock });
              }
            } else if (hasAll) {
              matchedStocks.push({ account: acc, fruitStock: stock });
            }
          } else {
            // Any variant accepted
            matchedStocks.push({ account: acc, fruitStock: stock });
          }
        }
      }

      const totalAvailable = matchedStocks.reduce(
        (sum, item) => sum + item.fruitStock.quantity,
        0
      );

      // Smart allocation: distribute requiredQuantity across matched stocks
      let remainingNeeded = orderItem.requiredQuantity;
      const allocations: OrderAllocation[] = [];

      for (const item of matchedStocks) {
        if (remainingNeeded <= 0) break;
        const allocKey = `${item.account.id}_${item.fruitStock.id}`;
        const canTake = Math.min(item.fruitStock.quantity, remainingNeeded);

        // Check if user manually customized
        const takeQty =
          customAllocations[allocKey] !== undefined
            ? Math.min(item.fruitStock.quantity, customAllocations[allocKey])
            : canTake;

        allocations.push({
          accountId: item.account.id,
          username: item.account.username,
          fruitStockId: item.fruitStock.id,
          fruitName: item.fruitStock.fruitName,
          variants: item.fruitStock.variants,
          availableQuantity: item.fruitStock.quantity,
          takeQuantity: takeQty,
        });

        remainingNeeded -= takeQty;
      }

      return {
        orderItem,
        matchedStocks,
        totalAvailable,
        isSufficient: totalAvailable >= orderItem.requiredQuantity,
        allocations,
      };
    });
  }, [orderItems, accounts, customAllocations]);

  const allAllocations = useMemo(() => {
    const list: OrderAllocation[] = [];
    for (const res of scanResults) {
      list.push(...res.allocations);
    }
    return list;
  }, [scanResults]);

  const totalFruitsToDeduct = allAllocations.reduce((sum, a) => sum + a.takeQuantity, 0);

  const isWholeOrderReady =
    scanResults.length > 0 && scanResults.every((res) => res.isSufficient);

  const handleCompleteOrder = () => {
    if (allAllocations.length === 0) {
      alert('Không có món nào để hoàn tất!');
      return;
    }

    if (
      window.confirm(
        `Xác nhận HOÀN TẤT ĐƠN HÀNG?\n\nHệ thống sẽ tự động trừ ${totalFruitsToDeduct} quả trên các tài khoản tương ứng.`
      )
    ) {
      onFulfillOrder(allAllocations);
      alert('✅ Đã hoàn tất đơn hàng và tự động trừ nông sản thành công!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Làm Đơn Nông Trại Play Together
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Quét toàn bộ {accounts.length} acc
                </span>
              </div>
              <p className="text-xs text-[#8e95a5]">
                Tìm kiếm trái &amp; biến thể trên mọi tài khoản, tự động trừ kho khi hoàn tất đơn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252830]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Order Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span>Danh Sách Món Trong Đơn Hàng</span>
              </h4>
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm món vào đơn</span>
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <div className="p-4 rounded-xl bg-[#20232a] border border-cyan-500/40 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Loại quả:
                    </label>
                    <select
                      value={newFruitName}
                      onChange={(e) => setNewFruitName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#17181c] text-sm text-white border border-[#323640] focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {PLAY_TOGETHER_CROPS.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Số lượng cần:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newQty}
                      onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-[#17181c] text-sm font-bold text-center text-cyan-300 border border-[#323640] focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quy tắc biến thể:
                    </label>
                    <select
                      value={newMatchExact ? 'exact' : 'any'}
                      onChange={(e) => setNewMatchExact(e.target.value === 'exact')}
                      className="w-full px-3 py-2 rounded-lg bg-[#17181c] text-xs text-white border border-[#323640] focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="exact">Đúng chính xác biến thể</option>
                      <option value="any">Bất kỳ biến thể nào cũng được</option>
                    </select>
                  </div>
                </div>

                {/* Variants Selection */}
                {newMatchExact && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-slate-300">
                        Chọn Biến Thể Cần (Đã chọn: {newRequiredVariants.length}/5):
                      </label>
                      {newRequiredVariants.length === 0 && (
                        <span className="text-[11px] text-emerald-400">
                          (Đơn yêu cầu Trái thường / Không đột biến)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-[#17181c] rounded-lg border border-[#2b2d35]">
                      {PLAY_TOGETHER_VARIANTS.map((v) => {
                        const isSel = newRequiredVariants.includes(v.name);
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => handleToggleNewVariant(v.name)}
                            style={{
                              backgroundColor: isSel ? v.bgColor : '#22242a',
                              color: isSel ? v.color : '#94a3b8',
                              borderColor: isSel ? v.borderColor : '#334155',
                            }}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isSel ? 'ring-1' : ''
                            }`}
                          >
                            {isSel && '✓ '}
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddOrderItem}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                  >
                    Thêm vào đơn
                  </button>
                </div>
              </div>
            )}

            {/* List of order items with scanning results */}
            <div className="space-y-4">
              {scanResults.map((result) => {
                const item = result.orderItem;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border transition-colors ${
                      result.isSufficient
                        ? 'bg-[#18231e] border-emerald-500/40'
                        : 'bg-[#26191c] border-rose-500/40'
                    }`}
                  >
                    {/* Item Title & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {PLAY_TOGETHER_CROPS.find((c) => c.name === item.fruitName)?.icon || '🍎'}
                        </span>
                        <div>
                          <h5 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{item.fruitName}</span>
                            <span className="text-xs text-slate-300 font-normal">
                              (Cần: <strong className="text-amber-400">{item.requiredQuantity}</strong> quả)
                            </span>
                          </h5>
                          {/* Required variants tags */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {!item.matchExactVariants ? (
                              <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[11px] font-medium border border-blue-600/30">
                                Bất kỳ biến thể nào
                              </span>
                            ) : item.requiredVariants.length === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium">
                                Trái thường (Không đột biến)
                              </span>
                            ) : (
                              item.requiredVariants.map((v) => (
                                <span
                                  key={v}
                                  className="px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 text-[11px] font-semibold border border-purple-500/40"
                                >
                                  ✦ {v}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        {result.isSufficient ? (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đủ hàng ({result.totalAvailable}/{item.requiredQuantity})</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Thiếu ({result.totalAvailable}/{item.requiredQuantity})</span>
                          </span>
                        )}

                        <button
                          onClick={() => handleRemoveOrderItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Xóa món này khỏi đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown by Account */}
                    {result.matchedStocks.length === 0 ? (
                      <p className="text-xs text-rose-300/80 italic">
                        Không tìm thấy tài khoản nào có loại trái này theo yêu cầu.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-700/50">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Phân bổ nguồn lấy từ các tài khoản:
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.allocations.map((alloc) => (
                            <div
                              key={`${alloc.accountId}_${alloc.fruitStockId}`}
                              className="p-2.5 rounded-xl bg-[#17181c] border border-slate-700/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-cyan-300">
                                  Acc: {alloc.username}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  Có sẵn: {alloc.availableQuantity} quả
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px]">Lấy:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={alloc.availableQuantity}
                                  value={alloc.takeQuantity}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      Math.min(alloc.availableQuantity, Number(e.target.value))
                                    );
                                    setCustomAllocations((prev) => ({
                                      ...prev,
                                      [`${alloc.accountId}_${alloc.fruitStockId}`]: val,
                                    }));
                                  }}
                                  className="w-14 px-1.5 py-1 text-center font-bold text-xs bg-[#22242b] text-emerald-300 rounded border border-[#32353e] focus:outline-none focus:border-cyan-400"
                                />
                                <span className="text-slate-400 text-[11px]">quả</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm text-slate-300">
              Dự kiến trừ: <strong className="text-emerald-400 font-extrabold">{totalFruitsToDeduct}</strong> quả trên các tài khoản
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Hủy
            </button>

            <button
              onClick={handleCompleteOrder}
              disabled={allAllocations.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all ${
                isWholeOrderReady
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:scale-[1.02]'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isWholeOrderReady ? '✅ Hoàn Tất Đơn Hàng' : '⚡ Hoàn Tất Phần Có Sẵn'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
