import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Bot,
  Sparkles,
  Key,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  PlusCircle,
  Images,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Account, DetectedFruitItem } from '../types';
import {
  PLAY_TOGETHER_CROPS,
  PLAY_TOGETHER_VARIANTS,
  getVariantStyle,
  GameCrop,
} from '../data/initialData';
import { CropImage } from './CropImage';
import { CropSearchSelect } from './CropSearchSelect';
import { generateContentWithGeminiFallback } from '../utils/geminiApi';

interface UploadedImageItem {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  name: string;
}

export interface EditableFruitItem {
  id: string;
  fruitName: string;
  variants: string[];
  quantity: number;
}

interface GeminiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount: Account | null;
  onSyncFruits?: (
    accountId: string,
    detected: DetectedFruitItem[],
    mode: 'replace' | 'append'
  ) => void;
  onAddDetectedFruits?: (accountId: string, detected: DetectedFruitItem[]) => void;
}

export const GeminiScanModal: React.FC<GeminiScanModalProps> = ({
  isOpen,
  onClose,
  targetAccount,
  onSyncFruits,
  onAddDetectedFruits,
}) => {
  if (!isOpen || !targetAccount) return null;

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [modelChoice, setModelChoice] = useState(() => localStorage.getItem('pt_gemini_model_choice') || 'auto');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('pt_custom_gemini_model') || 'gemini-3.5-flash');

  // Hỗ trợ tải nhiều ảnh cuộn rương
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chế độ đồng bộ mặc định: 'append' (Cộng dồn đợt thu hoạch mới)
  const [syncMode, setSyncMode] = useState<'replace' | 'append'>('append');

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [detectedList, setDetectedList] = useState<EditableFruitItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingFruitIndex, setEditingFruitIndex] = useState<number | null>(null);

  // Lắng nghe phím Ctrl+V để dán trực tiếp ảnh chụp màn hình từ clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.split(',')[1] || '';
              setUploadedImages((prev) => [
                ...prev,
                {
                  id: 'paste_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                  dataUrl,
                  base64,
                  mimeType: file.type || 'image/png',
                  name: `Ảnh dán clipboard #${prev.length + 1}`,
                },
              ]);
              setErrorMsg('');
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setIsSavingKey(true);
    setTimeout(() => setIsSavingKey(false), 1200);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        setUploadedImages((prev) => [
          ...prev,
          {
            id: 'file_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 6),
            dataUrl,
            base64,
            mimeType: file.type || 'image/jpeg',
            name: file.name,
          },
        ]);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleClearAllImages = () => {
    setUploadedImages([]);
    setDetectedList([]);
    setErrorMsg('');
  };

  // Cập nhật thông tin từng món đã quét
  const handleUpdateItem = (index: number, updates: Partial<EditableFruitItem>) => {
    setDetectedList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleToggleVariantForItem = (itemIndex: number, variantName: string) => {
    setDetectedList((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const currentVariants = item.variants || [];
        const exists = currentVariants.some(
          (v) => v.toLowerCase() === variantName.toLowerCase()
        );
        let updated: string[];
        if (exists) {
          updated = currentVariants.filter(
            (v) => v.toLowerCase() !== variantName.toLowerCase()
          );
        } else {
          if (currentVariants.length >= 5) return item; // Giới hạn tối đa 5 biến thể
          updated = [...currentVariants, variantName];
        }
        return { ...item, variants: updated };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setDetectedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    const defaultCrop = PLAY_TOGETHER_CROPS[0]?.name || 'Lúa';
    const newItem: EditableFruitItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      fruitName: defaultCrop,
      variants: [],
      quantity: 1,
    };
    setDetectedList((prev) => [newItem, ...prev]);
  };

  // Quét AI với Skill Quét Rương Nông Sản Chuyên Sâu + Đa ảnh + Khử trùng lặp cuộn trang
  const handleScanWithGemini = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Vui lòng nhập API Key Gemini (lấy miễn phí tại aistudio.google.com).');
      return;
    }
    if (uploadedImages.length === 0) {
      setErrorMsg('Vui lòng tải lên ít nhất 1 ảnh chụp màn hình rương đồ trong game.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');
    setScanStatus(`Đang chuẩn bị ${uploadedImages.length} ảnh và kết nối AI...`);

    try {
      const cropNames = PLAY_TOGETHER_CROPS.map((c) => c.name).join(', ');
      const variantNames = PLAY_TOGETHER_VARIANTS.map((v) => v.name).join(', ');

      const prompt = `Bạn là chuyên gia nhận diện RƯƠNG NÔNG SẢN trong game Play Together (Play Together Chest Inventory Specialist).

NHIỆM VỤ ĐẶC TRƯNG:
1. VÙNG QUAN SÁT DUY NHẤT:
   - CHỈ ĐỌC DUY NHẤT CÁC Ô / KHAY NÔNG SẢN trong rương đồ/kho túi đồ của người chơi.
   - TUYỆT ĐỐI BỎ QUA mọi thành phần khác: tiền sao/vàng, kim cương, cấp độ nông trại, tên nhân vật, nút điều khiển, chat hoặc cảnh vật game.

2. CÁCH ĐỌC CHÍNH XÁC TỪNG Ô NÔNG SẢN:
   - "fruitName": Tên loại quả trong game, chuẩn hóa chính xác theo danh mục 41 nông sản hợp lệ sau:
     [${cropNames}]
   - "variants": Mảng các biến thể hiển thị trên ô quả đó (từ 0 đến tối đa 5 biến thể).
     Nếu là trái thường không đột biến thì variants là [].
     Nếu có các tag biến thể (ví dụ: "Sương", "Ánh trăng", "Cầu vồng", "Ánh vàng", "Ẩm ướt", "Cát", "Khô héo", "Băng", "Bóng tối", "Pháo hoa", v.v.) thì lấy đúng tên các biến thể đó.
     Danh mục 19 biến thể hợp lệ: [${variantNames}].
   - "quantity": Số lượng quả ghi trên góc ô (ví dụ: x10, x5, 12, hoặc nếu không có số thì mặc định là 1). Tối thiểu là 1.

3. QUY TẮC NHIỀU ẢNH CUỘN TRANG & CHỐNG QUÉT LẶP (ANTI-DUPLICATION SKILL):
   - Người dùng tải lên ${uploadedImages.length} ảnh chụp màn hình do phải cuộn rương đồ xuống để xem hết nông sản.
   - Khi cuộn túi đồ, một số ô nông sản ở hàng dưới của ảnh trước SẼ XUẤT HIỆN LẠI ở hàng trên của ảnh sau.
   - BẠN BẮT BUỘC PHẢI SO SÁNH GIỮA CÁC ẢNH VÀ LOẠI BỎ HOÀN TOÀN TRÙNG LẶP:
     Nếu cùng một ô nông sản (cùng loại quả, cùng biến thể và cùng số lượng) xuất hiện ở cả 2 ảnh do cuộn trang, CHỈ GHI NHẬN Ô ĐÓ 1 LẦN DUY NHẤT. Tuyệt đối không được nhân đôi ô bị lặp!

4. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC: Trả về duy nhất JSON hợp lệ (không kèm markdown \`\`\`json hay giải thích):
[
  {
    "fruitName": "Lúa",
    "variants": ["Ánh trăng"],
    "quantity": 5
  },
  {
    "fruitName": "Cúc vạn thọ (cam)",
    "variants": ["Sương", "Ẩm ướt"],
    "quantity": 2
  },
  {
    "fruitName": "Việt quất",
    "variants": [],
    "quantity": 10
  }
]`;

      const preferredModel =
        modelChoice === 'custom'
          ? customModel.trim()
          : modelChoice === 'auto'
          ? undefined
          : modelChoice;

      const { text, modelUsed } = await generateContentWithGeminiFallback({
        apiKey,
        prompt,
        images: uploadedImages.map((img) => ({
          base64Data: img.base64,
          mimeType: img.mimeType,
        })),
        preferredModel,
        onStatusUpdate: (status) => setScanStatus(status),
      });

      setUsedModel(modelUsed);

      const parsed: DetectedFruitItem[] = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Gán id cho từng item để hỗ trợ chỉnh sửa
        const mappedList: EditableFruitItem[] = parsed.map((item, idx) => ({
          id: 'scanned_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 6),
          fruitName: item.fruitName,
          variants: Array.isArray(item.variants) ? item.variants : [],
          quantity: Math.max(1, Number(item.quantity) || 1),
        }));
        setDetectedList(mappedList);
      } else {
        throw new Error('Không phát hiện thấy nông sản nào trong ảnh.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi quét ảnh: ' + (err.message || 'Không thể kết nối Gemini API.'));
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const handleConfirmSync = () => {
    if (detectedList.length === 0) return;

    const formattedDetected: DetectedFruitItem[] = detectedList.map((item) => ({
      fruitName: item.fruitName,
      variants: item.variants,
      quantity: item.quantity,
    }));

    if (onSyncFruits) {
      onSyncFruits(targetAccount.id, formattedDetected, syncMode);
    } else if (onAddDetectedFruits) {
      onAddDetectedFruits(targetAccount.id, formattedDetected);
    }

    const totalFruits = detectedList.reduce((sum, item) => sum + item.quantity, 0);
    if (syncMode === 'replace') {
      alert(
        `✅ Đã ĐỒNG BỘ GHI ĐÈ rương của ${targetAccount.username} thành công!\n(Đã cập nhật đúng ${totalFruits} quả chuẩn theo game)`
      );
    } else {
      alert(
        `✅ Đã CỘNG DỒN ${totalFruits} quả vào rương của ${targetAccount.username} thành công!`
      );
    }
    onClose();
  };

  const totalFruitCount = detectedList.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>AI Quét Rương Đa Ảnh &amp; Đồng Bộ Nông Sản</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold">
                  Miễn phí
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                Đồng bộ rương cho tài khoản: <strong className="text-purple-600 dark:text-purple-300">{targetAccount.username}</strong>
                {targetAccount.roleId && <span className="font-mono text-slate-400 ml-1">({targetAccount.roleId})</span>}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* LỰA CHỌN CHẾ ĐỘ ĐỒNG BỘ (Ghi đè vs Cộng dồn) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span>Chế độ cập nhật vào tài khoản:</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 lowercase">
                (Hiện tại có {targetAccount.fruits.length} quả trong rương web)
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Cộng dồn (MẶC ĐỊNH AN TOÀN) */}
              <div
                onClick={() => setSyncMode('append')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                  syncMode === 'append'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#1A1C22] border-[#E8E2D5] dark:border-[#323640] hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">➕</span>
                    <strong className="text-xs font-black text-slate-900 dark:text-white">
                      Cộng dồn đợt thu hoạch mới
                    </strong>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                    Mặc định
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Giữ nguyên toàn bộ nông sản hiện có trong rương web, chỉ cộng dồn thêm các nông sản mới quét được vào tài khoản.
                </p>
              </div>

              {/* Option 2: Đồng bộ ghi đè rương */}
              <div
                onClick={() => setSyncMode('replace')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                  syncMode === 'replace'
                    ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-600 ring-1 ring-purple-600/30 shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#1A1C22] border-[#E8E2D5] dark:border-[#323640] hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔄</span>
                    <strong className="text-xs font-black text-slate-900 dark:text-white">
                      Đồng bộ ghi đè rương
                    </strong>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                    Ghi đè 100%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Thay thế toàn bộ kho quả cũ bằng danh sách quét từ game. Dùng khi muốn đồng bộ chuẩn xác lại rương từ đầu.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#22252C] border border-purple-500/30 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Google Gemini API Key (Miễn phí 100%)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Lấy key free tại Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán API Key (AIzaSy...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-mono text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                {isSavingKey ? 'Đã lưu!' : 'Lưu Key'}
              </button>
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Model AI Gemini quét ảnh rương:</span>
              </label>

              <select
                value={modelChoice}
                onChange={(e) => {
                  setModelChoice(e.target.value);
                  localStorage.setItem('pt_gemini_model_choice', e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-bold border border-[#E8E2D5] dark:border-[#323640] text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:border-purple-400"
              >
                <option value="auto">⚡ Tự động (Ưu tiên model xịn nhất &amp; tự hạ cấp)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Mới nhất, siêu nhanh &amp; chuẩn)</option>
                <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Bản 2.0 Thử nghiệm)</option>
                <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b (Siêu nhẹ)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Thông minh tối đa)</option>
                <option value="custom">✍️ Tùy chỉnh (Tự nhập tên model: 3.5 fl, 2.5 fl...)</option>
              </select>
            </div>

            {modelChoice === 'custom' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 animate-in fade-in">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">
                  Tên model:
                </span>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => {
                    setCustomModel(e.target.value);
                    localStorage.setItem('pt_custom_gemini_model', e.target.value);
                  }}
                  placeholder="VD: gemini-3.5-flash, gemini-2.5-flash..."
                  className="flex-1 px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C22] text-xs font-mono font-bold border border-purple-500/40 text-slate-800 dark:text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Upload Multiple Images & Drag & Drop & Paste */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e95a5] flex items-center gap-1.5">
                <Images className="w-4 h-4 text-purple-500" />
                <span>Ảnh chụp màn hình rương đồ trong game</span>
              </label>

              {uploadedImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllImages}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết {uploadedImages.length} ảnh</span>
                </button>
              )}
            </div>

            {/* Khung upload & Dán */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-[#E0D9CB] dark:border-[#343842] hover:border-purple-500 rounded-2xl p-5 text-center cursor-pointer bg-white dark:bg-[#181a1f] transition-all shadow-xs group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <div className="py-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    Bấm để chọn hoặc kéo thả nhiều ảnh chụp rương vào đây
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-300 font-bold mt-1">
                    💡 Hỗ trợ bấm <strong>Ctrl + V</strong> để dán trực tiếp ảnh chụp màn hình từ Clipboard!
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Có thể tải 2–3 ảnh cuộn túi đồ: AI có Skill tự động loại bỏ các ô bị quét lặp giữa các ảnh!
                  </p>
                </div>
              </div>
            </div>

            {/* Dải Thumbnail các ảnh đã tải lên */}
            {uploadedImages.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>Danh sách ảnh đã chọn ({uploadedImages.length} ảnh):</span>
                  <span className="text-purple-600 dark:text-purple-300">
                    Sẽ gửi toàn bộ để AI tổng hợp &amp; khử trùng lặp
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative group rounded-xl border border-[#E8E2D5] dark:border-[#2b2d35] overflow-hidden bg-black/5 dark:bg-white/5 aspect-4/3 flex items-center justify-center"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-transform hover:scale-110"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Nút thêm ảnh */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-[#E0D9CB] dark:border-[#343842] hover:border-purple-500 aspect-4/3 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">+ Thêm ảnh cuộn</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nút bắt đầu quét AI */}
          {uploadedImages.length > 0 && (
            <button
              onClick={handleScanWithGemini}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-98"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{scanStatus || 'AI đang phân tích nhận diện & khử trùng lặp các ô quả...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Bắt đầu Quét {uploadedImages.length} ảnh với AI Gemini (Skill Khử Trùng Lặp)
                  </span>
                </>
              )}
            </button>
          )}

          {/* Lỗi hiển thị nếu có */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* KẾT QUẢ QUÉT ĐƯỢC: HỖ TRỢ CHỈNH SỬA TOÀN DIỆN TRƯỚC KHI LƯU */}
          {detectedList.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#E8E2D5] dark:border-[#2a2d36]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Nông sản nhận diện ({detectedList.length} khay · Tổng {totalFruitCount} quả)</span>
                  </h4>
                  {usedModel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Model: {usedModel}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Thêm quả thủ công</span>
                </button>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Bạn có thể bấm vào tên quả, bấm vào huy hiệu biến thể hoặc chỉnh số lượng bên dưới để sửa đổi nếu AI nhận diện chưa khớp 100%.
                </span>
              </div>

              {/* Danh sách từng nông sản với giao diện chỉnh sửa inline */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {detectedList.map((item, idx) => {
                  const isEditing = editingFruitIndex === idx;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white dark:bg-[#22242a] border border-[#E8E2D5] dark:border-[#333742] shadow-xs flex flex-col gap-2 hover:border-purple-400 transition-colors"
                    >
                      {/* Hàng 1: Icon quả, Tên quả, Số lượng, Nút xóa */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-[#18191E] border border-[#E8E2D5] dark:border-[#333742] flex items-center justify-center p-1 shrink-0">
                            <CropImage name={item.fruitName} className="w-7 h-7 object-contain" />
                          </div>

                          {/* Chọn loại quả (Hỗ trợ gõ tìm nhanh hoặc đổi) */}
                          <div className="flex-1">
                            {isEditing ? (
                              <CropSearchSelect
                                value={item.fruitName}
                                onChange={(crop) => {
                                  handleUpdateItem(idx, { fruitName: crop.name });
                                  setEditingFruitIndex(null);
                                }}
                                autoFocus={true}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingFruitIndex(idx)}
                                className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-slate-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 text-left group"
                                title="Bấm để đổi loại quả khác"
                              >
                                <span>{item.fruitName}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bộ đếm số lượng */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold text-slate-400">SL:</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(idx, {
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#18191E] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-14 px-1.5 py-0.5 rounded-lg bg-[#FAF7F2] dark:bg-[#18191E] border border-[#E8E2D5] dark:border-[#333742] text-center font-black text-xs text-emerald-600 dark:text-emerald-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(idx, {
                                quantity: item.quantity + 1,
                              })
                            }
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#18191E] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1 transition-colors"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Hàng 2: Biến thể nhiễm (Hiển thị các pill có màu sắc & bấm để bật/tắt) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          Biến thể ({item.variants.length}/5):
                        </span>

                        {item.variants.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">Trái thường</span>
                        ) : (
                          item.variants.map((vName) => {
                            const style = getVariantStyle(vName);
                            return (
                              <span
                                key={vName}
                                style={{
                                  backgroundColor: style ? style.bgColor : '#334155',
                                  color: style ? style.color : '#e2e8f0',
                                  borderColor: style ? style.borderColor : '#475569',
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1"
                              >
                                <span>{vName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVariantForItem(idx, vName)}
                                  className="hover:opacity-75"
                                  title={`Bỏ biến thể ${vName}`}
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })
                        )}

                        {/* Dropdown nhanh để thêm biến thể */}
                        {item.variants.length < 5 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleToggleVariantForItem(idx, e.target.value);
                              }
                            }}
                            className="text-[10px] bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <option value="">+ Thêm biến thể...</option>
                            {PLAY_TOGETHER_VARIANTS.filter(
                              (v) => !item.variants.some((cur) => cur.toLowerCase() === v.name.toLowerCase())
                            ).map((v) => (
                              <option key={v.name} value={v.name}>
                                ✦ {v.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút hành động xác nhận đồng bộ */}
              <button
                type="button"
                onClick={handleConfirmSync}
                className={`w-full py-3.5 rounded-2xl text-white text-xs sm:text-sm font-black shadow-lg transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 ${
                  syncMode === 'replace'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
                }`}
              >
                {syncMode === 'replace' ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      🔄 Xác nhận Ghi Đè Toàn Bộ Rương ({totalFruitCount} quả) cho {targetAccount.username}
                    </span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      ➕ Xác nhận Cộng Dồn {totalFruitCount} quả vào Rương của {targetAccount.username}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
