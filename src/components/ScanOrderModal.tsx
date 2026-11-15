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
  ArrowLeft,
  Plus,
  Layers,
  Images,
} from 'lucide-react';
import { FarmOrder, OrderItem } from '../types';
import {
  PLAY_TOGETHER_CROPS,
  PLAY_TOGETHER_VARIANTS,
  getVariantStyle,
} from '../data/initialData';
import { CropImage } from './CropImage';
import { generateContentWithGeminiFallback } from '../utils/geminiApi';

interface ScanOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Omit<FarmOrder, 'id' | 'createdAt'>) => void;
  embedded?: boolean;
}

export interface ScannedOrderItem {
  fruitName: string;
  requiredVariant?: string | null;
  requiredQuantity: number;
}

interface ScannedOrderData {
  title: string;
  items: ScannedOrderItem[];
}

interface UploadedImageItem {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  name: string;
}

export const ScanOrderModal: React.FC<ScanOrderModalProps> = ({
  isOpen,
  onClose,
  onAddOrder,
  embedded = false,
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [modelChoice, setModelChoice] = useState(() => localStorage.getItem('pt_gemini_model_choice') || 'auto');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('pt_custom_gemini_model') || 'gemini-3.5-flash');

  // Hỗ trợ chọn nhiều hình ảnh (cuộn trang nhiều màn hình)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [scannedData, setScannedData] = useState<ScannedOrderData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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
                  name: `Ảnh dán #${prev.length + 1}`,
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

  // Xử lý nạp nhiều file ảnh từ máy
  const handleFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadedImageItem[] = [];
    let processed = 0;
    const total = files.length;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        newItems.push({
          id: 'file_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 6),
          dataUrl,
          base64,
          mimeType: file.type || 'image/jpeg',
          name: file.name || `Ảnh #${index + 1}`,
        });
        processed++;
        if (processed === total) {
          setUploadedImages((prev) => [...prev, ...newItems]);
          setErrorMsg('');
        }
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
    setScannedData(null);
    setErrorMsg('');
  };

  // Cập nhật thông tin từng món nông sản đã quét (cho phép người dùng sửa)
  const handleUpdateItem = (index: number, updates: Partial<ScannedOrderItem>) => {
    if (!scannedData) return;
    setScannedData({
      ...scannedData,
      items: scannedData.items.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!scannedData) return;
    setScannedData({
      ...scannedData,
      items: scannedData.items.filter((_, i) => i !== index),
    });
  };

  const handleAddNewItem = () => {
    if (!scannedData) return;
    const defaultCrop = PLAY_TOGETHER_CROPS[0]?.name || 'Lúa';
    setScannedData({
      ...scannedData,
      items: [
        ...scannedData.items,
        {
          fruitName: defaultCrop,
          requiredVariant: null,
          requiredQuantity: 1,
        },
      ],
    });
  };

  // Quét AI với Skill làm đơn chuyên sâu + Đa ảnh + Khử trùng lặp
  const handleScanOrderWithGemini = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Vui lòng nhập API Key Gemini (lấy miễn phí tại aistudio.google.com).');
      return;
    }
    if (uploadedImages.length === 0) {
      setErrorMsg('Vui lòng tải lên ít nhất 1 ảnh chụp màn hình đơn hàng trong game.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');
    setScanStatus(`Đang chuẩn bị ${uploadedImages.length} ảnh và kết nối AI...`);

    try {
      const cropNames = PLAY_TOGETHER_CROPS.map((c) => c.name).join(', ');
      const variantNames = PLAY_TOGETHER_VARIANTS.map((v) => v.name).join(', ');

      const prompt = `Bạn là chuyên gia nhận diện Đơn Hàng Nông Trại (Play Together Farm Order Vision Specialist).

NHIỆM VỤ ĐẶC TRƯNG (SKILL LÀM ĐƠN NÔNG TRẠI):
1. VÙNG QUAN SÁT DUY NHẤT:
   - CHỈ ĐỌC DUY NHẤT BẢNG DANH SÁCH ĐƠN HÀNG NÔNG SẢN (Bảng hiển thị các ô nông sản và phân số yêu cầu giao nộp).
   - TUYỆT ĐỐI BỎ QUA mọi thành phần khác trên màn hình: hội thoại NPC, tiền vàng/sao, kim cương, cấp độ, tên nhân vật, nút điều khiển, thanh nhiệm vụ hoặc cảnh vật game xung quanh.

2. CÁCH ĐỌC CHÍNH XÁC TỪNG MÓN TRONG ĐƠN:
   - "fruitName": Tên loại quả trong game, chuẩn hóa chính xác theo danh mục 41 nông sản hợp lệ bên dưới:
     [${cropNames}]
   - "requiredVariant": Biến thể yêu cầu hiển thị trên thẻ quả.
     Nếu trên thẻ quả có ghi hoặc gắn huy hiệu biến thể (ví dụ: "Sương", "Ánh trăng", "Cầu vồng", "Ánh vàng", "Ẩm ướt", "Cát", "Khô héo", "Băng", "Bóng tối", "Pháo hoa", v.v.) thì lấy đúng tên biến thể đó.
     Nếu là trái thường (không có huy hiệu biến thể hoặc ghi "Trái thường") thì bắt buộc trả về: null.
     Danh mục 19 biến thể hợp lệ: [${variantNames}].
   - "requiredQuantity": Số lượng yêu cầu nộp.
     LƯU Ý QUAN TRỌNG: Trên ảnh game hiển thị phân số "Đang có / Cần nộp" (ví dụ: 1/3, 0/2, 2/2, 1/1, 3/5...).
     Số lượng cần nộp của đơn là MẪU SỐ BÊN PHẢI (ví dụ: 1/3 => requiredQuantity = 3, 0/2 => requiredQuantity = 2, 2/2 => requiredQuantity = 2, 1/1 => requiredQuantity = 1, 3/5 => requiredQuantity = 5). Tối thiểu là 1.

3. QUY TẮC NHIỀU ẢNH CUỘN TRANG & CHỐNG QUÉT LẶP (ANTI-DUPLICATION SKILL):
   - Người dùng tải lên ${uploadedImages.length} ảnh chụp màn hình do phải cuộn trang xuống trong game để xem hết đơn hàng.
   - Khi cuộn trang, một số món nông sản ở đáy ảnh trước SẼ XUẤT HIỆN LẠI ở đầu ảnh sau.
   - BẠN BẮT BUỘC PHẢI SO SÁNH GIỮA CÁC ẢNH VÀ LOẠI BỎ HOÀN TOÀN TRÙNG LẶP:
     Nếu cùng một loại củ/quả, cùng biến thể và cùng số lượng yêu cầu xuất hiện ở nhiều ảnh do cuộn trang, CHỈ GHI NHẬN MÓN ĐÓ 1 LẦN DUY NHẤT. Tuyệt đối không được nhân đôi món bị lặp!

4. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC: Trả về duy nhất JSON hợp lệ (không kèm markdown \`\`\`json hay giải thích):
{
  "title": "Đơn Nông Sản",
  "items": [
    {
      "fruitName": "Lúa",
      "requiredVariant": "Ánh trăng",
      "requiredQuantity": 3
    },
    {
      "fruitName": "Cúc vạn thọ (cam)",
      "requiredVariant": "Sương",
      "requiredQuantity": 2
    }
  ]
}`;

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

      // Parse JSON from text
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: ScannedOrderData = JSON.parse(cleanText);

      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Client-side fallback deduplication để đảm bảo 100% không bị trùng món do cuộn ảnh
        const uniqueItems: ScannedOrderItem[] = [];
        const seenKeys = new Set<string>();

        for (const it of parsed.items) {
          const normFruit = (it.fruitName || '').trim();
          const normVariant = (it.requiredVariant || '').trim().toLowerCase();
          const normQty = Math.max(1, Number(it.requiredQuantity) || 1);
          const dedupeKey = `${normFruit.toLowerCase()}__${normVariant}__${normQty}`;

          if (!seenKeys.has(dedupeKey)) {
            seenKeys.add(dedupeKey);
            uniqueItems.push({
              fruitName: normFruit,
              requiredVariant: it.requiredVariant ? it.requiredVariant.trim() : null,
              requiredQuantity: normQty,
            });
          }
        }

        setScannedData({
          title: parsed.title || 'Đơn Nông Sản',
          items: uniqueItems,
        });
      } else {
        throw new Error('Không phát hiện thấy danh sách món hàng nào trong các ảnh đã chọn.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi quét đơn: ' + (err.message || 'Không thể kết nối Gemini API.'));
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const handleConfirmAddOrder = () => {
    if (!scannedData || scannedData.items.length === 0) return;

    const mappedItems: OrderItem[] = scannedData.items.map((item, idx) => ({
      id: 'item_ai_' + Date.now() + '_' + idx,
      fruitName: item.fruitName,
      requiredVariant: item.requiredVariant || undefined,
      requiredQuantity: Math.max(1, Number(item.requiredQuantity) || 1),
    }));

    onAddOrder({
      title: scannedData.title || 'Đơn Nông Sản',
      description: 'Đơn hàng quét từ ảnh (AI Gemini)',
      items: mappedItems,
    });

    alert(`🎉 Đã thêm đơn hàng gồm ${mappedItems.length} món thành công!`);
    onClose();
  };

  const modalContent = (
    <div
      className={
        embedded
          ? 'w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] dark:bg-[#1E2026] text-slate-800 dark:text-slate-100 select-none'
          : 'w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]'
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
        <div className="flex items-center gap-2.5">
          {embedded && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black mr-1 transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>Quét Đơn Nông Trại Bằng Hình Ảnh</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold border border-purple-500/30">
                AI Vision
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
              Hỗ trợ nhiều ảnh cuộn trang, tự động khử trùng lặp và cho phép chỉnh sửa món quét
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
              <span>Lấy key free tại đây</span>
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 active:scale-95"
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
              <span>Model AI Gemini quét ảnh:</span>
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
          <p className="text-[11px] text-slate-400">
            💡 AI tự động học skill lọc đúng phần bảng đơn và đối chiếu cuộn trang giữa các ảnh để tránh quét 2 lần.
          </p>
        </div>

        {/* Upload Multiple Images (Cuộn trang) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Images className="w-4 h-4 text-sky-500" />
              <span>Ảnh chụp màn hình đơn hàng ({uploadedImages.length} ảnh):</span>
            </label>

            {uploadedImages.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllImages}
                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa hết ảnh</span>
              </button>
            )}
          </div>

          {/* Dải ảnh đã tải lên */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white dark:bg-[#1E2026] border border-[#E8E2D5] dark:border-[#323640]">
              {uploadedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-[#E8E2D5] dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex flex-col"
                >
                  <img
                    src={img.dataUrl}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-full h-28 object-contain bg-black/10 dark:bg-black/30"
                  />
                  <div className="p-1.5 px-2 bg-white/90 dark:bg-[#252831]/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                      Ảnh #{idx + 1} {idx === 0 ? '(Đầu đơn)' : '(Cuộn tiếp)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Nút thêm ảnh tiếp theo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-34 border-2 border-dashed border-sky-400/50 hover:border-sky-500 rounded-xl flex flex-col items-center justify-center gap-1 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[11px] font-bold">+ Thêm ảnh cuộn</span>
              </button>
            </div>
          )}

          {/* Hộp tải file hoặc kéo thả / dán Ctrl+V */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-[#E0D9CB] dark:border-[#343842] hover:border-purple-500 rounded-2xl p-5 text-center cursor-pointer bg-white dark:bg-[#181a1f] transition-colors shadow-xs"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesSelect(e.target.files)}
              className="hidden"
            />

            <div className="py-3 space-y-1.5">
              <Upload className="w-7 h-7 text-purple-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Bấm để chọn ảnh, kéo thả hoặc <span className="text-purple-600 dark:text-purple-400 font-extrabold underline">dán trực tiếp (Ctrl + V)</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                📸 Đơn hàng game dài cần cuộn màn hình? Bạn hãy chụp 2 hoặc nhiều ảnh rồi tải lên cùng lúc.
                AI sẽ tự động ghép ảnh và lọc bỏ các món bị chụp lặp lại do cuộn trang!
              </p>
            </div>
          </div>
        </div>

        {/* Scan Action Button */}
        {uploadedImages.length > 0 && (
          <button
            onClick={handleScanOrderWithGemini}
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{scanStatus || 'AI đang phân tích đơn hàng và các biến thể...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu Quét Đơn Hàng Với AI Gemini ({uploadedImages.length} ảnh)</span>
              </>
            )}
          </button>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scanned Result Preview & Interactive Editing */}
        {scannedData && (
          <div className="space-y-3 pt-3 border-t border-[#E8E2D5] dark:border-[#2a2d36] animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Đã nhận diện: {scannedData.items.length} món nông sản (Đã khử trùng lặp)</span>
              </h4>
              {usedModel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Model: {usedModel} ✓
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
              ✏️ Bạn có thể trực tiếp đổi loại quả, chọn lại biến thể (kèm màu đặc trưng) hoặc tăng/giảm số lượng bên dưới trước khi tạo đơn:
            </div>

            {/* Editable Items List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {scannedData.items.map((item, idx) => {
                const vStyle = item.requiredVariant
                  ? getVariantStyle(item.requiredVariant)
                  : undefined;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-[#22242a] border border-[#E8E2D5] dark:border-slate-700 shadow-xs space-y-2.5 transition-all"
                  >
                    {/* Hàng 1: Loại củ/quả & Nút xóa */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-[#18191E] border border-[#E8E2D5] dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                          <CropImage name={item.fruitName} className="w-7 h-7 object-contain" />
                        </div>

                        <div className="flex-1 min-w-[130px]">
                          <select
                            value={item.fruitName}
                            onChange={(e) => handleUpdateItem(idx, { fruitName: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#181A20] border border-[#E8E2D5] dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                          >
                            {PLAY_TOGETHER_CROPS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Xóa món này khỏi đơn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hàng 2: Biến thể (Kèm màu sắc chuẩn) & Số lượng cần nộp */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0EBE1] dark:border-slate-800/80">
                      {/* Chọn Biến Thể có màu */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-500">Biến thể:</span>
                          {item.requiredVariant && vStyle && (
                            <span
                              style={{
                                backgroundColor: vStyle.bgColor,
                                color: vStyle.color,
                                borderColor: vStyle.borderColor,
                              }}
                              className="px-1.5 py-0.2 rounded-full text-[9px] font-black border"
                            >
                              ✦ {item.requiredVariant}
                            </span>
                          )}
                        </div>
                        <select
                          value={item.requiredVariant || 'none'}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              requiredVariant: e.target.value === 'none' ? null : e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 rounded-xl bg-[#FAF7F2] dark:bg-[#181A20] border border-[#E8E2D5] dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="none">Trái thường (không nhiễm)</option>
                          {PLAY_TOGETHER_VARIANTS.map((v) => (
                            <option key={v.name} value={v.name}>
                              ✦ {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Số lượng cần nộp */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">
                          Cần nộp:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(idx, {
                                requiredQuantity: Math.max(1, item.requiredQuantity - 1),
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-black flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.requiredQuantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                requiredQuantity: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="flex-1 px-1 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#181A20] border border-[#E8E2D5] dark:border-slate-700 text-xs font-black text-center text-sky-600 dark:text-sky-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(idx, {
                                requiredQuantity: item.requiredQuantity + 1,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-black flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút thêm món thủ công vào đơn */}
            <button
              type="button"
              onClick={handleAddNewItem}
              className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm món nông sản khác vào đơn này</span>
            </button>

            {/* Confirm Add Button */}
            <button
              onClick={handleConfirmAddOrder}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-95"
            >
              Xác nhận tạo đơn hàng này ngay ({scannedData.items.length} món)
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return modalContent;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {modalContent}
    </div>
  );
};
