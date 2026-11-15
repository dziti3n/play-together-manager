import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  UserCheck,
  Bot,
  AlertTriangle,
  ExternalLink,
  GripHorizontal,
  ArrowLeft,
  Minimize2,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { Account, FarmOrder, HarvestedFruit, OrderItem } from '../types';
import {
  PLAY_TOGETHER_CROPS,
  PLAY_TOGETHER_VARIANTS,
  getVariantStyle,
} from '../data/initialData';
import { CropImage } from './CropImage';
import { ScanOrderModal } from './ScanOrderModal';
import { CropSearchSelect } from './CropSearchSelect';

interface FarmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  orders: FarmOrder[];
  onAddOrder: (order: Omit<FarmOrder, 'id' | 'createdAt'>) => FarmOrder | void;
  onDeleteOrder: (orderId: string) => void;
  onFulfillOrderDeduction: (deductionMap: Record<string, string[]>) => void;
}

interface MatchingFruitDetail {
  account: Account;
  fruit: HarvestedFruit;
  isSelected: boolean;
  isExcluded: boolean;
}

export const FarmOrderModal: React.FC<FarmOrderModalProps> = ({
  isOpen,
  onClose,
  accounts,
  orders,
  onAddOrder,
  onDeleteOrder,
  onFulfillOrderDeduction,
}) => {
  if (!isOpen) return null;

  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.length > 0 ? orders[0].id : ''
  );

  // Chế độ Pop-up thu nhỏ (Mặc định khi mở trên web là false; chỉ hiện khi người dùng ấn nút Pop-up)
  const [isCompactPopUp, setIsCompactPopUp] = useState<boolean>(false);

  // Vị trí cửa sổ nổi trong trang web (Kéo thả di chuyển mượt mà 60fps không lag)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pt_order_popup_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaultX = typeof window !== 'undefined' ? Math.max(15, window.innerWidth - 425) : 750;
    const defaultY = typeof window !== 'undefined' ? Math.max(15, window.innerHeight - 560) : 150;
    return { x: defaultX, y: defaultY };
  });

  // Kích thước cửa sổ nổi (Kéo dãn thay đổi kích cỡ mượt mà)
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem('pt_order_popup_size');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { width: 400, height: 520 };
  });

  // Cửa sổ nổi ngoài Desktop (Always-on-top qua Chrome Document Picture-in-Picture hoặc window.open)
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

  // Modal to inspect accounts & individual fruits holding a specific item
  const [inspectingItem, setInspectingItem] = useState<OrderItem | null>(null);

  // Quản lý chính xác danh sách ID các quả ĐƯỢC CHỌN nộp cho từng món trong đơn (Record: itemId -> fruitId[])
  // Mặc định tự động chọn ĐÚNG số lượng cần nộp từ những trái ít biến thể nhất.
  // Tuyệt đối không cho chọn vượt quá số lượng để tránh xóa nhầm trái quý/nhiều biến thể của người dùng!
  const [selectedFruitsPerItem, setSelectedFruitsPerItem] = useState<Record<string, string[]>>({});

  // Cảnh báo khi người dùng cố tick vượt quá số lượng cần nộp của đơn
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);

  // Quản lý màn hình hiển thị trong modal: 'list' (danh sách đơn), 'inspect' (chi tiết củ/quả), 'create' (tạo đơn mới), 'scan' (quét AI)
  // Đảm bảo 100% không bao giờ bị đè, che khuất hoặc chồng cửa sổ!
  type FarmModalView = 'list' | 'inspect' | 'create' | 'scan';
  const [orderView, setOrderView] = useState<FarmModalView>('list');

  const [newOrderTitle, setNewOrderTitle] = useState('Đơn Nông Sản');
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);

  // Form controls to add an item into new order
  const [draftFruitName, setDraftFruitName] = useState(PLAY_TOGETHER_CROPS[0].name);
  const [draftVariant, setDraftVariant] = useState<string>('none');
  const [draftQuantity, setDraftQuantity] = useState<number>(1);

  // Refs phục vụ kéo thả & kéo dãn siêu mượt (Direct DOM Manipulation, không trigger React render gây lag)
  const popupRef = useRef<HTMLDivElement>(null);
  const currentPosRef = useRef({ x: pos.x, y: pos.y });
  const currentSizeRef = useRef({ width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  useEffect(() => {
    currentPosRef.current = pos;
  }, [pos]);

  useEffect(() => {
    currentSizeRef.current = size;
  }, [size]);

  // Current active order
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Helper: Tìm tất cả củ/quả khớp với OrderItem trên toàn bộ tài khoản
  // Tự động phân bổ đúng số lượng cần nộp từ những quả ít biến thể nhất
  // excludeFruitIds: tránh double-count các quả đã được món trước trong đơn chọn
  const findMatchesAcrossAccounts = (item: OrderItem, excludeFruitIds?: Set<string>) => {
    const list: { account: Account; fruit: HarvestedFruit }[] = [];

    for (const acc of accounts) {
      for (const fruit of acc.fruits || []) {
        if (excludeFruitIds && excludeFruitIds.has(fruit.id)) {
          continue; // Trái này đã được chọn cho món khác trong đơn
        }

        if (fruit.fruitName.toLowerCase() !== item.fruitName.toLowerCase()) {
          continue;
        }

        let isMatch = false;
        if (item.matchAnyVariant) {
          isMatch = true;
        } else if (item.requiredVariant) {
          if ((fruit.variants || []).some((v) => v.toLowerCase() === item.requiredVariant!.toLowerCase())) {
            isMatch = true;
          }
        } else {
          // Trái thường (không đột biến)
          if (!fruit.variants || fruit.variants.length === 0) {
            isMatch = true;
          }
        }

        if (isMatch) {
          list.push({
            account: acc,
            fruit,
          });
        }
      }
    }

    // Sắp xếp ưu tiên: trái ít biến thể nhất đứng đầu (dùng trước), trái nhiều biến thể nhất đứng cuối
    list.sort((a, b) => (a.fruit.variants?.length || 0) - (b.fruit.variants?.length || 0));

    // Danh sách ID hợp lệ hiện có trong kho
    const validFruitIdSet = new Set(list.map((m) => m.fruit.id));
    const savedSelected = selectedFruitsPerItem[item.id];

    let selectedIds: string[];
    if (savedSelected !== undefined) {
      // Đã từng tùy chỉnh: Lọc ID còn trong kho và chặn cứng tối đa đúng requiredQuantity
      selectedIds = savedSelected
        .filter((id) => validFruitIdSet.has(id))
        .slice(0, item.requiredQuantity);
    } else {
      // Mặc định ban đầu: CHỈ LẤY ĐÚNG số lượng cần nộp từ những quả ít biến thể nhất
      selectedIds = list.slice(0, item.requiredQuantity).map((m) => m.fruit.id);
    }

    const selectedSet = new Set(selectedIds);

    const allMatches: MatchingFruitDetail[] = list.map((m) => {
      const isSelected = selectedSet.has(m.fruit.id);
      return {
        ...m,
        isSelected,
        isExcluded: !isSelected,
      };
    });

    // Gom nhóm theo tài khoản (đếm số acc có)
    const accountSet = new Set(list.map((m) => m.account.id));

    return {
      allMatches,
      selectedIds,
      accountCount: accountSet.size,
      totalMatches: list.length,
      selectedCount: selectedIds.length,
      availableCount: selectedIds.length,
      requiredQuantity: item.requiredQuantity,
      isEnough: selectedIds.length === item.requiredQuantity,
      hasEnoughInStock: list.length >= item.requiredQuantity,
    };
  };

  // Bật/tắt chọn một củ/quả cụ thể - CHẶN CỨNG không cho chọn vượt quá số lượng cần nộp
  const toggleSelectFruitForItem = (item: OrderItem, fruitId: string) => {
    const { selectedIds } = findMatchesAcrossAccounts(item);
    const isCurrentlySelected = selectedIds.includes(fruitId);

    if (isCurrentlySelected) {
      // Bỏ chọn quả này -> Cho phép bình thường
      const updated = selectedIds.filter((id) => id !== fruitId);
      setSelectedFruitsPerItem((prev) => ({
        ...prev,
        [item.id]: updated,
      }));
      setSelectionWarning(null);
    } else {
      // Người dùng muốn chọn thêm quả này
      // KIỂM TRA CHẶN: Nếu đã chọn đủ số lượng cần nộp thì ngăn chặn ngay
      if (selectedIds.length >= item.requiredQuantity) {
        setSelectionWarning(
          `⚠️ Đơn chỉ cần đúng ${item.requiredQuantity} quả! Đã chọn đủ ${item.requiredQuantity}/${item.requiredQuantity} quả. Hãy bỏ chọn quả khác trước nếu muốn đổi sang dùng quả này (tránh xóa nhầm trái quý)!`
        );
        return;
      }

      const updated = [...selectedIds, fruitId];
      setSelectedFruitsPerItem((prev) => ({
        ...prev,
        [item.id]: updated,
      }));
      setSelectionWarning(null);
    }
  };

  // Check if entire current order can be fulfilled
  const orderAnalysis = useMemo(() => {
    if (!currentOrder) return { isAllEnough: false, itemsStatus: [] };

    const allocatedIds = new Set<string>();
    const itemsStatus = currentOrder.items.map((item) => {
      const matchResult = findMatchesAcrossAccounts(item, allocatedIds);
      matchResult.selectedIds.forEach((id) => allocatedIds.add(id));
      return {
        item,
        ...matchResult,
      };
    });

    const isAllEnough = itemsStatus.length > 0 && itemsStatus.every((s) => s.isEnough);

    return { isAllEnough, itemsStatus };
  }, [currentOrder, accounts, selectedFruitsPerItem]);

  // Xử lý nộp đơn hàng - CHỈ TRỪ CHÍNH XÁC NHỮNG QUẢ ĐÃ ĐƯỢC CHỌN (KHÔNG BỊ TRÙNG QUẢ GIỮA CÁC MÓN)
  const handleFulfillOrder = () => {
    if (!currentOrder || !orderAnalysis.isAllEnough) return;

    const confirmMsg = `Bạn có chắc muốn gửi "${currentOrder.title}"? Đúng số lượng nông sản đã chọn sẽ được trừ khỏi kho các tài khoản.`;
    if (!window.confirm(confirmMsg)) return;

    const allocatedIds = new Set<string>();
    const deductionMap: Record<string, string[]> = {};

    for (const item of currentOrder.items) {
      const { allMatches, selectedIds } = findMatchesAcrossAccounts(item, allocatedIds);
      selectedIds.forEach((id) => allocatedIds.add(id));
      const selectedSet = new Set(selectedIds);

      for (const m of allMatches) {
        if (selectedSet.has(m.fruit.id)) {
          if (!deductionMap[m.account.id]) {
            deductionMap[m.account.id] = [];
          }
          deductionMap[m.account.id].push(m.fruit.id);
        }
      }
    }

    onFulfillOrderDeduction(deductionMap);
    onDeleteOrder(currentOrder.id);
    alert('🎉 Đã gửi đơn hàng thành công! Đúng số lượng nông sản đã chọn đã được trừ khỏi kho.');
  };

  const handleAddItemToDraftOrder = () => {
    const newItem: OrderItem = {
      id: 'item_' + Date.now(),
      fruitName: draftFruitName,
      requiredVariant: draftVariant === 'none' ? undefined : draftVariant,
      requiredQuantity: Math.max(1, draftQuantity),
    };
    setNewOrderItems((prev) => [...prev, newItem]);
    setDraftQuantity(1);
  };

  // ===================== VIEW CON: TẠO ĐƠN MỚI THỦ CÔNG (TRONG CÙNG KHUNG, KHÔNG CHỒNG MODAL) =====================
  const renderCreateOrderView = (isCompact: boolean) => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] dark:bg-[#1E2026] text-slate-800 dark:text-slate-100 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOrderView('list')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-white leading-tight">
              Tạo Đơn Hàng Nông Sản Mới
            </h4>
          </div>
        </div>
        <button
          onClick={() => {
            setOrderView('list');
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
        {/* Shortcut to AI Scan */}
        <button
          type="button"
          onClick={() => setOrderView('scan')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-xs"
        >
          <Bot className="w-4 h-4" />
          <span>Hoặc Quét Tự Động Từ Ảnh Chụp Màn Hình Bằng AI Gemini</span>
        </button>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Tên đơn hàng:
          </label>
          <input
            type="text"
            value={newOrderTitle}
            onChange={(e) => setNewOrderTitle(e.target.value)}
            placeholder="VD: Đơn Nông Sản #1"
            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#282B33] border border-[#E2DCcf] dark:border-[#383C48] text-xs sm:text-sm font-bold focus:outline-none"
          />
        </div>

        {/* Items in new order */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
            Danh sách món trong đơn ({newOrderItems.length} món):
          </label>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {newOrderItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có món nào trong đơn. Hãy chọn món bên dưới và bấm "Thêm".
              </p>
            ) : (
              newOrderItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#282B33] border border-[#E2DCcf] dark:border-[#383C48] text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <CropImage name={item.fruitName} className="w-6 h-6 object-contain" />
                    <span className="font-bold">{item.fruitName}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      ({item.requiredVariant || 'Trái thường'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-sky-600 dark:text-sky-400">
                      x{item.requiredQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewOrderItems(newOrderItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Xóa món này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add item to new order row (CÓ HỖ TRỢ GÕ TÌM NHANH TRÁI CÂY) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24262E] border border-[#E2DCcf] dark:border-[#323640] space-y-2.5">
          <label className="block text-xs font-black text-slate-600 dark:text-slate-300">
            + Thêm món vào đơn này:
          </label>

          {/* Nhập tìm nhanh củ/quả với CropSearchSelect */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 mb-1 block">
              Loại củ/quả (Gõ để tìm nhanh):
            </span>
            <CropSearchSelect
              value={draftFruitName}
              onChange={(crop) => setDraftFruitName(crop.name)}
              placeholder="Gõ tên trái để tìm (vd: Lúa, Cúc vạn thọ...)..."
            />
          </div>

          {/* Biến thể & Số lượng */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="col-span-2">
              <span className="text-[11px] font-bold text-slate-500 mb-1 block">
                Yêu cầu biến thể:
              </span>
              <select
                value={draftVariant}
                onChange={(e) => setDraftVariant(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2026] border border-[#E2DCcf] dark:border-[#383C48] text-xs font-bold focus:outline-none"
              >
                <option value="none">Trái thường (không nhiễm)</option>
                {PLAY_TOGETHER_VARIANTS.map((v) => (
                  <option key={v.name} value={v.name}>
                    ✦ {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 mb-1 block">
                Số lượng:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={draftQuantity}
                  onChange={(e) => setDraftQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2026] border border-[#E2DCcf] dark:border-[#383C48] text-xs font-black text-center"
                />
                <button
                  type="button"
                  onClick={handleAddItemToDraftOrder}
                  className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] shrink-0">
        <button
          type="button"
          onClick={() => setOrderView('list')}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          Hủy &amp; Quay lại
        </button>
        <button
          type="button"
          disabled={newOrderItems.length === 0}
          onClick={() => {
            if (!newOrderTitle.trim() || newOrderItems.length === 0) return;
            const res = onAddOrder({
              title: newOrderTitle.trim(),
              description: 'Đơn hàng nông sản',
              items: newOrderItems,
            });
            if (res && (res as any).id) {
              setSelectedOrderId((res as any).id);
            }
            setOrderView('list');
          }}
          className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          Tạo đơn này ngay
        </button>
      </div>
    </div>
  );

  // ===================== VIEW CON: AI QUÉT ĐƠN (TRONG CÙNG KHUNG, KHÔNG CHỒNG MODAL) =====================
  const renderScanOrderView = (isCompact: boolean) => (
    <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-150">
      <ScanOrderModal
        isOpen={true}
        embedded={true}
        onClose={() => setOrderView('list')}
        onAddOrder={(order) => {
          const res = onAddOrder(order);
          if (res && (res as any).id) {
            setSelectedOrderId((res as any).id);
          }
          setOrderView('list');
        }}
      />
    </div>
  );

  // ===================== KÉO THẢ DI CHUYỂN POP-UP SIÊU MƯỢT 60FPS (KHÔNG LAG) =====================
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input, a')) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: currentPosRef.current.x,
      posY: currentPosRef.current.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - currentSizeRef.current.width - 10, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - currentSizeRef.current.height - 10, dragStartRef.current.posY + dy));
      currentPosRef.current = { x: newX, y: newY };

      // Thay đổi vị trí trực tiếp qua CSS DOM Style để mượt mà tuyệt đối 60fps, không gây lag React
      if (popupRef.current) {
        popupRef.current.style.left = `${newX}px`;
        popupRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setPos(currentPosRef.current);
      try {
        localStorage.setItem('pt_order_popup_pos', JSON.stringify(currentPosRef.current));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ===================== KÉO DÃN THAY ĐỔI KÍCH CỠ POP-UP SIÊU MƯỢT (KHÔNG LAG) =====================
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: currentSizeRef.current.width,
      startH: currentSizeRef.current.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dw = moveEvent.clientX - resizeStartRef.current.mouseX;
      const dh = moveEvent.clientY - resizeStartRef.current.mouseY;
      const newW = Math.max(300, Math.min(window.innerWidth - currentPosRef.current.x - 10, resizeStartRef.current.startW + dw));
      const newH = Math.max(260, Math.min(window.innerHeight - currentPosRef.current.y - 10, resizeStartRef.current.startH + dh));
      currentSizeRef.current = { width: newW, height: newH };

      // Cập nhật kích thước trực tiếp qua CSS DOM Style để mượt mà
      if (popupRef.current) {
        popupRef.current.style.width = `${newW}px`;
        popupRef.current.style.height = `${newH}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setSize(currentSizeRef.current);
      try {
        localStorage.setItem('pt_order_popup_size', JSON.stringify(currentSizeRef.current));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ===================== GHIM NỔI NGOÀI MÀN HÌNH (ALWAYS-ON-TOP / PiP) =====================
  const copyStylesToTarget = (targetWin: Window) => {
    try {
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          targetWin.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type || 'text/css';
            link.media = styleSheet.media?.mediaText || 'all';
            link.href = styleSheet.href;
            targetWin.document.head.appendChild(link);
          }
        }
      });
      targetWin.document.documentElement.className = document.documentElement.className;
      targetWin.document.body.className =
        document.body.className + ' bg-[#FAF7F2] dark:bg-[#1C1E24] m-0 p-0 overflow-hidden';
      targetWin.document.title = '📋 Đơn Hàng Nông Trại - Play Together';
    } catch (err) {
      console.warn('Lỗi khi sao chép stylesheet sang cửa sổ ngoài:', err);
    }
  };

  const openOutsideWindow = async () => {
    // 1. Thử mở qua Chrome Document Picture-in-Picture (Always on top trên toàn bộ Windows/Desktop/Game)
    if ('documentPictureInPicture' in window && window.documentPictureInPicture?.requestWindow) {
      try {
        const pip = await window.documentPictureInPicture.requestWindow({
          width: Math.max(360, Math.min(650, Math.round(size.width))),
          height: Math.max(420, Math.min(850, Math.round(size.height))),
        });

        copyStylesToTarget(pip);

        const container = pip.document.createElement('div');
        container.id = 'pip-order-root';
        container.className =
          'w-full h-full flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans select-none';
        pip.document.body.appendChild(container);

        setPipWindow(pip);
        setPipContainer(container);
        setIsCompactPopUp(true);

        pip.addEventListener('pagehide', () => {
          setPipWindow(null);
          setPipContainer(null);
        });
        return;
      } catch (err) {
        console.warn('Document Picture-in-Picture không mở được, fallback sang window.open:', err);
      }
    }

    // 2. Fallback: window.open popup window
    const popup = window.open(
      '',
      'FarmOrderPipWindow',
      `width=${Math.round(size.width)},height=${Math.round(size.height)},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
    if (popup) {
      copyStylesToTarget(popup);

      const container = popup.document.createElement('div');
      container.id = 'popup-order-root';
      container.className =
        'w-full h-full flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans select-none';
      popup.document.body.appendChild(container);

      setPipWindow(popup);
      setPipContainer(container);
      setIsCompactPopUp(true);

      popup.addEventListener('beforeunload', () => {
        setPipWindow(null);
        setPipContainer(null);
      });
    }
  };

  const closeOutsideWindow = () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      setPipContainer(null);
    }
  };

  // Đồng bộ chế độ dark mode sang cửa sổ ngoài
  useEffect(() => {
    if (pipWindow && pipWindow.document) {
      pipWindow.document.documentElement.className = document.documentElement.className;
    }
  }, [pipWindow]);

  // Dọn dẹp cửa sổ ngoài khi đóng modal
  useEffect(() => {
    return () => {
      if (pipWindow) {
        try {
          pipWindow.close();
        } catch {}
      }
    };
  }, [pipWindow]);

  // ===================== GIAO DIỆN POP-UP COMPACT =====================
  const renderCompactContent = (isOutside: boolean) => {
    // Nếu đang xem chi tiết từng củ/quả của một món trong đơn
    if (orderView === 'inspect' && inspectingItem) {
      const matchResult = findMatchesAcrossAccounts(inspectingItem);

      return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 select-none">
          {/* Header xem chi tiết */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectionWarning(null);
                setInspectingItem(null);
                setOrderView('list');
              }}
              className="flex items-center gap-1.5 text-xs font-black text-sky-600 dark:text-sky-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại đơn</span>
            </button>

            <div className="flex items-center gap-2 overflow-hidden px-2">
              <CropImage name={inspectingItem.fruitName} className="w-5 h-5 object-contain shrink-0" />
              <span className="text-xs font-black truncate max-w-[150px]">
                {inspectingItem.fruitName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setInspectingItem(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Danh sách từng trái riêng biệt kèm tên acc */}
          <div className="p-2.5 overflow-y-auto flex-1 space-y-2">
            {/* Cảnh báo khi người dùng cố chọn quá số lượng */}
            {selectionWarning && (
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center justify-between gap-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 leading-snug">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{selectionWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectionWarning(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 leading-relaxed">
              💡 Đã giới hạn chuẩn <strong>{inspectingItem.requiredQuantity} quả</strong>. Bấm tick để chọn quả nộp hoặc <strong>"🔒 Giữ lại"</strong> trái hiếm.
            </div>

            {matchResult.allMatches.length === 0 ? (
              <div className="py-8 text-center text-xs text-rose-500 font-bold">
                ❌ Không có tài khoản nào có trái này!
              </div>
            ) : (
              matchResult.allMatches.map(({ account, fruit, isSelected }, idx) => {
                const isMaxReached = !isSelected && matchResult.selectedCount >= inspectingItem.requiredQuantity;
                return (
                  <div
                    key={fruit.id}
                    onClick={() => toggleSelectFruitForItem(inspectingItem, fruit.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-white dark:bg-[#252831] border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/30 shadow-2xs'
                        : isMaxReached
                        ? 'bg-slate-100/50 dark:bg-[#1c1e24] border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-100/70 dark:bg-[#202229] border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isMaxReached}
                          onChange={() => toggleSelectFruitForItem(inspectingItem, fruit.id)}
                          className={`w-3.5 h-3.5 rounded text-sky-600 ${isMaxReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          onClick={(e) => e.stopPropagation()}
                          title={isMaxReached ? `Đã chọn đủ ${inspectingItem.requiredQuantity} quả! Bỏ chọn quả khác trước nếu muốn đổi.` : undefined}
                        />
                        <CropImage name={fruit.fruitName} className="w-4 h-4 object-contain shrink-0 drop-shadow-xs" />
                        <span className="font-black text-xs">
                          {fruit.fruitName} #{idx + 1}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[10px] font-bold">
                          <UserCheck className="w-3 h-3 text-sky-500" />
                          <span>{account.characterName || account.username}</span>
                          {account.roleId && (
                            <span className="text-slate-400 font-mono">({account.roleId})</span>
                          )}
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black">
                            🎯 {account.dailyDones !== undefined ? account.dailyDones : 20}/20
                          </span>
                        </span>
                      </div>

                      <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isSelected ? '✓ Sẽ dùng' : '🔒 Giữ lại'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pl-5.5 text-[10px]">
                      <span className="text-slate-400">Nhiễm:</span>
                      {fruit.variants.length === 0 ? (
                        <span className="text-slate-400 italic">Trái thường</span>
                      ) : (
                        fruit.variants.map((vName) => {
                          const style = getVariantStyle(vName);
                          const isReq = inspectingItem.requiredVariant?.toLowerCase() === vName.toLowerCase();
                          return (
                            <span
                              key={vName}
                              style={{
                                backgroundColor: style ? style.bgColor : '#334155',
                                color: style ? style.color : '#e2e8f0',
                                borderColor: style ? style.borderColor : '#475569',
                              }}
                              className={`px-1.5 py-0.2 rounded-full border font-bold ${isReq ? 'ring-1 ring-sky-500 font-black' : ''}`}
                            >
                              {isReq && '★ '}
                              {vName}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer xem chi tiết */}
          <div className="p-2.5 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>Đã chọn:</span>
              <strong className={matchResult.isEnough ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-amber-600 dark:text-amber-400 font-black"}>
                {matchResult.selectedCount} / {inspectingItem.requiredQuantity} quả
              </strong>
              {matchResult.isEnough ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  ✓ Đã đủ
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  ⚠️ Cần thêm {inspectingItem.requiredQuantity - matchResult.selectedCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectionWarning(null);
                setInspectingItem(null);
                setOrderView('list');
              }}
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-xs active:scale-95 transition-all"
            >
              Xong &amp; Quay lại
            </button>
          </div>
        </div>
      );
    }

    // Nếu đang tạo đơn mới hoặc quét AI trong Pop-up
    if (orderView === 'create') {
      return renderCreateOrderView(true);
    }
    if (orderView === 'scan') {
      return renderScanOrderView(true);
    }

    // Màn hình chính của Pop-up đơn hàng
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 select-none relative">
        {/* Header - Kéo thả di chuyển vị trí tự do */}
        <div
          onMouseDown={!isOutside ? handleHeaderMouseDown : undefined}
          className={`flex items-center justify-between px-3.5 py-2.5 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0 ${
            !isOutside ? 'cursor-grab active:cursor-grabbing hover:bg-[#EDE6DA] dark:hover:bg-[#1F2128] transition-colors' : ''
          }`}
          title={!isOutside ? 'Nhấn giữ chuột vào thanh này để kéo di chuyển cửa sổ bất kỳ đâu' : undefined}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {!isOutside && (
              <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0 hover:text-sky-500" />
            )}
            <span className="text-base shrink-0">📋</span>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black truncate text-slate-800 dark:text-white">
                  {currentOrder?.title || 'Đơn Hàng'}
                </h4>
                {orders.length > 1 && (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="text-[10px] bg-white dark:bg-[#252831] border border-slate-300 dark:border-slate-600 rounded-md px-1 py-0.5 font-bold cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {orders.map((o, idx) => (
                      <option key={o.id} value={o.id}>
                        #{idx + 1}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block truncate">
                {currentOrder?.items.length || 0} món · {isOutside ? '📌 Ngoài Desktop' : 'Pop-up'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Nút Tạo Đơn Nhanh */}
            <button
              type="button"
              onClick={() => setOrderView('create')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black transition-all hover:scale-105 active:scale-95"
              title="Tạo đơn hàng nông sản mới"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline">Tạo</span>
            </button>

            {/* Nút AI Quét Đơn */}
            <button
              type="button"
              onClick={() => setOrderView('scan')}
              className="p-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-all hover:scale-105 active:scale-95"
              title="AI Quét Đơn Bằng Ảnh Chụp Màn Hình"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>

            {/* Nút Ghim nổi ngoài màn hình Desktop (Always-on-top PiP) */}
            {!isOutside ? (
              <button
                type="button"
                onClick={openOutsideWindow}
                className="p-1.5 rounded-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-500/25 transition-all shadow-2xs hover:scale-105"
                title="Ghim nổi ngoài màn hình Desktop (Always-on-top hiển thị trên game & ứng dụng khác)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={closeOutsideWindow}
                className="px-2 py-1 rounded-xl text-[10px] font-black bg-sky-500 hover:bg-sky-600 text-white shadow-2xs"
                title="Đưa cửa sổ về lại trong trang web"
              >
                Thu về web
              </button>
            )}

            {/* Nút Phóng to lại giao diện thường trên web */}
            {!isOutside && (
              <button
                type="button"
                onClick={() => setIsCompactPopUp(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                title="Mở rộng về bảng đơn bình thường"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Đóng */}
            <button
              type="button"
              onClick={isOutside ? closeOutsideWindow : onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Đóng đơn hàng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Danh sách các món trong đơn */}
        <div className="p-2.5 overflow-y-auto flex-1 space-y-2">
          {!currentOrder ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <p className="font-bold">Chưa có đơn hàng nào!</p>
              <button
                type="button"
                onClick={() => setOrderView('create')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs"
              >
                + Tạo đơn ngay
              </button>
            </div>
          ) : (
            orderAnalysis.itemsStatus.map(({ item, accountCount, availableCount, isEnough }) => {
              const variantStyle = item.requiredVariant
                ? getVariantStyle(item.requiredVariant)
                : undefined;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] shadow-2xs hover:border-sky-400 transition-all gap-2"
                >
                  {/* Left: Icon & Badge */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="relative w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                      <CropImage name={item.fruitName} className="w-5 h-5 object-contain" />
                      <span
                        className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full font-black text-[9px] border shadow-2xs ${
                          isEnough
                            ? 'bg-emerald-500 text-white border-white'
                            : 'bg-rose-500 text-white border-white'
                        }`}
                      >
                        {availableCount}/{item.requiredQuantity}
                      </span>
                    </div>

                    <div className="overflow-hidden">
                      <h5 className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                        {item.fruitName}
                      </h5>
                      <div className="text-[11px] font-bold truncate">
                        {item.matchAnyVariant ? (
                          <span className="text-sky-600 dark:text-sky-400">Bất kỳ biến thể</span>
                        ) : item.requiredVariant ? (
                          <span style={{ color: variantStyle ? variantStyle.color : '#a855f7' }}>
                            {item.requiredVariant}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Trái thường</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Xem acc nào có */}
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingItem(item);
                      setOrderView('inspect');
                    }}
                    className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-[#1E2026] hover:bg-sky-50 dark:hover:bg-sky-950/50 text-[10px] font-extrabold text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                    title="Xem chi tiết từng củ/quả & acc có"
                  >
                    {accountCount} acc
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleFulfillOrder}
            disabled={!orderAnalysis.isAllEnough}
            className={`flex-1 py-2 rounded-2xl font-black text-xs transition-all shadow-sm ${
              orderAnalysis.isAllEnough
                ? 'bg-[#00A3FF] hover:bg-[#0092E6] active:scale-95 text-white shadow-sky-500/20'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {orderAnalysis.isAllEnough ? 'Gửi Đơn Này' : 'Chưa đủ nông sản'}
          </button>

          {currentOrder && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Xóa đơn hàng "${currentOrder.title}"?`)) {
                  onDeleteOrder(currentOrder.id);
                }
              }}
              className="p-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors"
              title="Xóa đơn hàng hiện tại"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nút kéo dãn kích thước ở góc dưới bên phải */}
        {!isOutside && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0.5 right-0.5 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-sky-500 select-none z-10"
            title="Kéo góc này để mở rộng hoặc thu nhỏ kích cỡ pop-up"
          >
            <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
              <path d="M8 2 L2 8 M8 5 L5 8 M8 8 L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. KHI CỬA SỔ NỔI NGOÀI MÀN HÌNH (DOCUMENT PICTURE-IN-PICTURE) ĐANG BẬT */}
      {pipContainer && createPortal(renderCompactContent(true), pipContainer)}

      {/* 2. CHẾ ĐỘ POP-UP (CHỈ HIỆN KHI NGƯỜI DÙNG BẤM NÚT POP-UP) */}
      {isCompactPopUp ? (
        pipContainer ? (
          /* Nếu đang mở ngoài Desktop, hiện thẻ điều khiển nhỏ gọn ở góc màn hình */
          <div
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            className="fixed z-50 p-3.5 rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 border-2 border-sky-400 dark:border-sky-500 shadow-2xl flex flex-col gap-2 max-w-xs animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm shrink-0">
                📌
              </div>
              <div>
                <h4 className="text-xs font-black">Đang ghim ngoài Desktop</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  (Always-on-top trên game &amp; ứng dụng)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={closeOutsideWindow}
                className="flex-1 py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
              >
                Thu về trang web
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Cửa sổ nổi trong trang web: Kéo thả di chuyển 60fps mượt mà không lag */
          <div
            ref={popupRef}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
            }}
            className="fixed z-50 rounded-3xl border-2 border-sky-400 dark:border-sky-500 shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {renderCompactContent(false)}
          </div>
        )
      ) : (
        /* ===================== CHẾ ĐỘ MẶC ĐỊNH TRÊN WEB ===================== */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1E2026] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#323642] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {orderView === 'inspect' && inspectingItem ? (
              /* VIEW 2 TRÊN WEB: XEM CHI TIẾT CỦ/QUẢ & BIẾN THỂ (CHUYỂN MÀN HÌNH MƯỢT MÀ NHƯ ẢNH 1, KHÔNG BỊ CHE) */
              <>
                {/* Header với nút ← Quay lại đơn */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionWarning(null);
                        setInspectingItem(null);
                        setOrderView('list');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại đơn</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      <CropImage name={inspectingItem.fruitName} className="w-9 h-9 object-contain drop-shadow" />
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-slate-800 dark:text-white leading-tight">
                          Chi tiết: {inspectingItem.fruitName}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Yêu cầu: {inspectingItem.requiredVariant ? `Biến thể "${inspectingItem.requiredVariant}"` : 'Trái thường'} · Cần nộp: <strong className="text-sky-600 dark:text-sky-400">{inspectingItem.requiredQuantity} quả</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectionWarning(null);
                      setInspectingItem(null);
                      setOrderView('list');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Thân danh sách chi tiết */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                  {/* Helper notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Bảo vệ nông sản quý:</strong> Hệ thống tự động chọn đúng <strong>{inspectingItem.requiredQuantity} quả</strong> từ những trái ít biến thể nhất trước. <strong>Đã khóa giới hạn:</strong> bạn không thể chọn vượt quá {inspectingItem.requiredQuantity} quả nhằm tránh xóa nhầm trái hiếm. Muốn đổi sang dùng quả khác, hãy bỏ tick quả đang chọn trước.
                    </div>
                  </div>

                  {/* Cảnh báo khi người dùng cố chọn quá số lượng */}
                  {selectionWarning && (
                    <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{selectionWarning}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectionWarning(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* DANH SÁCH TỪNG TRÁI: TÊN ACC NẰM TRỰC TIẾP TRONG Ô CỦA TRÁI */}
                  <div className="space-y-3 pr-1">
                    {findMatchesAcrossAccounts(inspectingItem).allMatches.length === 0 ? (
                      <div className="py-10 text-center text-xs text-rose-500 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">
                        ❌ Chưa có tài khoản nào có loại trái này!
                      </div>
                    ) : (
                      findMatchesAcrossAccounts(inspectingItem).allMatches.map(({ account, fruit, isSelected }, idx) => {
                        const variantCount = fruit.variants.length;
                        const isMultiMutant = variantCount >= 3;
                        const matchesInfo = findMatchesAcrossAccounts(inspectingItem);
                        const isMaxReached = !isSelected && matchesInfo.selectedCount >= inspectingItem.requiredQuantity;

                        return (
                          <div
                            key={fruit.id}
                            onClick={() => toggleSelectFruitForItem(inspectingItem, fruit.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                              isSelected
                                ? 'bg-white dark:bg-[#252831] border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/30 shadow-xs'
                                : isMaxReached
                                ? 'bg-slate-100/50 dark:bg-[#1a1c22] border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                                : 'bg-slate-100/70 dark:bg-[#202229] border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {/* Hàng 1: Checkbox, Icon, Tên trái #, Tên Acc sở hữu, Tag độ hiếm, Trạng thái Sẽ dùng/Giữ lại */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isMaxReached}
                                  onChange={() => toggleSelectFruitForItem(inspectingItem, fruit.id)}
                                  className={`w-4 h-4 rounded text-sky-600 focus:ring-sky-500 ${isMaxReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title={isMaxReached ? `Đã chọn đủ ${inspectingItem.requiredQuantity} quả! Bỏ chọn quả khác trước nếu muốn đổi.` : undefined}
                                />

                                <CropImage name={fruit.fruitName} className="w-5 h-5 object-contain shrink-0 drop-shadow-xs" />

                                <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                                  {fruit.fruitName} #{idx + 1}
                                </span>

                                {/* TÊN TÀI KHOẢN NẰM TRỰC TIẾP TRONG Ô CỦA TRÁI NÀY! */}
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-xs font-bold">
                                  <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                                  <span>Game: <strong className="font-black text-slate-900 dark:text-white">{account.characterName || account.username}</strong></span>
                                  {account.roleId && (
                                    <span className="text-[10px] text-slate-400 font-mono font-bold">(ID: {account.roleId})</span>
                                  )}
                                  <span className="ml-1 px-1.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[11px] font-black border border-purple-500/25">
                                    🎯 {account.dailyDones !== undefined ? account.dailyDones : 20}/20 lượt
                                  </span>
                                </span>

                                {/* Tag độ hiếm */}
                                {isMultiMutant ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-black border border-rose-500/30 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>Hiếm: {variantCount} biến thể</span>
                                  </span>
                                ) : variantCount === 2 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                    2 biến thể
                                  </span>
                                ) : variantCount === 1 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 text-[10px] font-semibold border border-sky-500/30">
                                    1 biến thể
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    Trái thường
                                  </span>
                                )}
                              </div>

                              {/* Right: Sẽ dùng / 🔒 Giữ lại */}
                              <div className="shrink-0 text-right">
                                {isSelected ? (
                                  <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>✓ Sẽ dùng (Sẽ trừ khỏi kho)</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>🔒 Giữ lại an toàn (Không bị xóa)</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Hàng 2: Các biến thể nhiễm của trái này */}
                            <div className="flex flex-wrap items-center gap-1.5 pl-6.5">
                              <span className="text-[11px] text-slate-400 font-medium">Nhiễm:</span>
                              {fruit.variants.length === 0 ? (
                                <span className="text-[11px] text-slate-400 font-semibold italic">
                                  Không nhiễm biến thể (Trái thường)
                                </span>
                              ) : (
                                fruit.variants.map((vName) => {
                                  const style = getVariantStyle(vName);
                                  const isRequiredTarget =
                                    inspectingItem.requiredVariant?.toLowerCase() ===
                                    vName.toLowerCase();

                                  return (
                                    <span
                                      key={vName}
                                      style={{
                                        backgroundColor: style ? style.bgColor : '#334155',
                                        color: style ? style.color : '#e2e8f0',
                                        borderColor: style ? style.borderColor : '#475569',
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                        isRequiredTarget
                                          ? 'ring-2 ring-sky-500 ring-offset-1'
                                          : ''
                                      }`}
                                    >
                                      {isRequiredTarget && '★ '}
                                      {vName}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer xem chi tiết */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Đã chọn nộp:{' '}
                      <strong
                        className={
                          findMatchesAcrossAccounts(inspectingItem).isEnough
                            ? 'text-emerald-600 dark:text-emerald-400 font-black text-sm'
                            : 'text-amber-600 dark:text-amber-400 font-black text-sm'
                        }
                      >
                        {findMatchesAcrossAccounts(inspectingItem).selectedCount} /{' '}
                        {inspectingItem.requiredQuantity} quả
                      </strong>
                    </span>

                    {findMatchesAcrossAccounts(inspectingItem).isEnough ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-black border border-emerald-500/30">
                        ✓ Đã đủ số lượng nộp
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/30">
                        ⚠️ Cần chọn thêm{' '}
                        {inspectingItem.requiredQuantity -
                          findMatchesAcrossAccounts(inspectingItem).selectedCount}{' '}
                        quả nữa
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-medium">
                      (Kho có tổng {findMatchesAcrossAccounts(inspectingItem).totalMatches} quả khớp)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectionWarning(null);
                      setInspectingItem(null);
                      setOrderView('list');
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-[#25A9E0] hover:bg-[#1d96c9] text-white text-xs font-black shadow-md shadow-sky-500/30 active:scale-95 transition-all"
                  >
                    Xác nhận &amp; Quay lại đơn
                  </button>
                </div>
              </>
            ) : orderView === 'create' ? (
              renderCreateOrderView(false)
            ) : orderView === 'scan' ? (
              renderScanOrderView(false)
            ) : (
              /* VIEW 1 TRÊN WEB: DANH SÁCH TẤT CẢ CÁC MÓN TRONG ĐƠN */
              <>
                {/* Header trên web */}
                <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center text-xl shadow-xs">
                      📋
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-white">
                          {currentOrder?.title || 'Đơn Hàng Nông Trại'}
                        </h3>
                        {orders.length > 1 && (
                          <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="text-xs bg-white dark:bg-[#252831] border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-bold cursor-pointer"
                          >
                            {orders.map((o, idx) => (
                              <option key={o.id} value={o.id}>
                                #{idx + 1} {o.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentOrder?.items.length || 0} món · Tự động tìm trái &amp; biến thể trên toàn bộ tài khoản
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* AI Quét Đơn */}
                    <button
                      onClick={() => setOrderView('scan')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xs"
                      title="Quét đơn hàng tự động từ ảnh chụp màn hình bằng AI"
                    >
                      <Bot className="w-4 h-4" />
                      <span className="hidden sm:inline">AI Quét Đơn</span>
                    </button>

                    {/* + Tạo đơn */}
                    <button
                      onClick={() => setOrderView('create')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#FFAA00] hover:bg-[#e69900] active:scale-95 text-white text-xs font-black shadow-md shadow-amber-500/30 transition-all hover:scale-105"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tạo đơn</span>
                    </button>

                    {/* Nút Chuyển sang Pop-up nổi */}
                    <button
                      type="button"
                      onClick={() => setIsCompactPopUp(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xs"
                      title="Thu nhỏ thành cửa sổ Pop-up nổi trên màn hình"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Pop-up nổi</span>
                    </button>

                    {/* Nút Ghim Ngoài Desktop (Always-on-top PiP) */}
                    <button
                      type="button"
                      onClick={openOutsideWindow}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xs"
                      title="Ghim nổi ngoài màn hình Desktop (Always-on-top hiển thị trên game & ứng dụng khác)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ghim Desktop</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Thân đơn hàng: CHỈ HIỆN CÁC MÓN TRONG ĐƠN */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                  {!currentOrder ? (
                    <div className="py-16 text-center text-slate-400">
                      <div className="text-4xl mb-2">🧺</div>
                      <p className="font-extrabold text-sm">Chưa có đơn hàng nào!</p>
                      <p className="text-xs mt-1">Bấm "+ Tạo đơn" hoặc "AI Quét Đơn" để thêm đơn hàng mới.</p>
                    </div>
                  ) : (
                    orderAnalysis.itemsStatus.map(({ item, accountCount, availableCount, isEnough }) => {
                      const variantStyle = item.requiredVariant
                        ? getVariantStyle(item.requiredVariant)
                        : undefined;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#252831] border border-[#E8E2D5] dark:border-[#353945] shadow-xs flex items-center justify-between gap-3 transition-all hover:border-sky-400"
                        >
                          {/* Left: Avatar with fraction badge */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                              <CropImage name={item.fruitName} className="w-8 h-8 object-contain drop-shadow" />
                              <span
                                className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full font-black text-[10px] border shadow-xs ${
                                  isEnough
                                    ? 'bg-emerald-500 text-white border-white'
                                    : 'bg-rose-500 text-white border-white'
                                }`}
                              >
                                {availableCount}/{item.requiredQuantity}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-black text-sm text-slate-800 dark:text-slate-100">
                                {item.fruitName}
                              </h5>
                              <div className="text-xs font-bold mt-0.5">
                                {item.matchAnyVariant ? (
                                  <span className="text-sky-600 dark:text-sky-400">Bất kỳ biến thể</span>
                                ) : item.requiredVariant ? (
                                  <span style={{ color: variantStyle ? variantStyle.color : '#a855f7' }}>
                                    | {item.requiredVariant}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">| Trái thường</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Xem chi tiết acc nào có */}
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingItem(item);
                              setOrderView('inspect');
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-xs font-black transition-all hover:scale-105 active:scale-95"
                          >
                            <span>Chi tiết ({accountCount} acc có)</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {currentOrder && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2C2F3A] bg-[#F4EFE6] dark:bg-[#18191E] shrink-0">
                    <div className="text-xs">
                      {orderAnalysis.isAllEnough ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Tất cả củ/quả đã đủ!
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Còn thiếu nông sản để hoàn tất.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa đơn hàng "${currentOrder.title}"?`)) {
                            onDeleteOrder(currentOrder.id);
                          }
                        }}
                        className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors"
                        title="Xóa đơn hàng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleFulfillOrder}
                        disabled={!orderAnalysis.isAllEnough}
                        className={`px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 ${
                          orderAnalysis.isAllEnough
                            ? 'bg-[#00A3FF] hover:bg-[#0092E6] text-white shadow-sky-500/30 hover:scale-105'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Gửi Đơn Này
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
