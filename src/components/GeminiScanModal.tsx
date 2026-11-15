import React, { useState } from 'react';
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
} from 'lucide-react';
import { Account, FruitStock } from '../types';
import { PLAY_TOGETHER_CROPS, PLAY_TOGETHER_VARIANTS } from '../data/initialData';

interface GeminiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount: Account | null;
  onAddDetectedFruits: (accountId: string, detected: Omit<FruitStock, 'id'>[]) => void;
}

export const GeminiScanModal: React.FC<GeminiScanModalProps> = ({
  isOpen,
  onClose,
  targetAccount,
  onAddDetectedFruits,
}) => {
  if (!isOpen || !targetAccount) return null;

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [detectedList, setDetectedList] = useState<Omit<FruitStock, 'id'>[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setIsSavingKey(true);
    setTimeout(() => setIsSavingKey(false), 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setDetectedList([]);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleScanWithGemini = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Vui lòng nhập API Key Gemini (lấy miễn phí tại aistudio.google.com).');
      return;
    }
    if (!selectedImage) {
      setErrorMsg('Vui lòng chọn ảnh chụp màn hình rương đồ trong game.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');

    try {
      const base64Data = selectedImage.split(',')[1];
      const cropNames = PLAY_TOGETHER_CROPS.map((c) => c.name).join(', ');
      const variantNames = PLAY_TOGETHER_VARIANTS.map((v) => v.name).join(', ');

      const prompt = `Bạn là trợ lý nhận diện hình ảnh rương nông sản trong game Play Together.
Trong ảnh chụp màn hình rương đồ nông sản, hãy nhận diện các loại quả/nông sản, số lượng của từng loại và các biến thể (nếu có).

Danh mục nông sản hợp lệ trong game: [${cropNames}]
Danh mục 19 biến thể hợp lệ trong game: [${variantNames}]

Lưu ý:
1. Mỗi loại quả có thể có 0 đến tối đa 5 biến thể (nếu là quả thường không đột biến thì mảng variants là []).
2. Số lượng là số nguyên dương hiển thị trên ảnh.
3. Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm giải thích nào khác):
[
  {
    "fruitName": "Tên loại quả",
    "fruitIcon": "biểu tượng emoji phù hợp",
    "variants": ["Tên biến thể 1", "Tên biến thể 2"],
    "quantity": 10
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Lỗi từ Gemini API');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('AI không đọc được dữ liệu nào từ ảnh.');
      }

      const parsed: Omit<FruitStock, 'id'>[] = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDetectedList(parsed);
      } else {
        throw new Error('Không phát hiện thấy nông sản nào trong ảnh.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi quét ảnh: ' + (err.message || 'Không thể kết nối Gemini API.'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAdd = () => {
    if (detectedList.length === 0) return;
    onAddDetectedFruits(targetAccount.id, detectedList);
    alert(`✅ Đã thêm ${detectedList.length} loại quả vào rương của tài khoản ${targetAccount.username}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#1c1e22] rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                AI Vision Quét Ảnh Rương Đồ (Client-side)
              </h3>
              <p className="text-xs text-[#8e95a5]">
                Quét tự động cho tài khoản: <strong className="text-purple-300">{targetAccount.username}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* API Key Box */}
          <div className="p-4 rounded-xl bg-[#22242a] border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Google Gemini API Key (Miễn phí 100%)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
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
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#17181c] text-xs font-mono text-white border border-[#323640] focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
              >
                {isSavingKey ? 'Đã lưu!' : 'Lưu Key'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Key được lưu riêng trong trình duyệt máy bạn, chạy trực tiếp từ máy bạn đến Google không qua bất kỳ server nào.
            </p>
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8e95a5] mb-2">
              Ảnh chụp màn hình rương nông sản trong game
            </label>

            <div className="relative border-2 border-dashed border-[#343842] hover:border-purple-500 rounded-2xl p-4 text-center cursor-pointer bg-[#181a1f] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {selectedImage ? (
                <div className="space-y-2">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-xl object-contain border border-[#2b2d35]"
                  />
                  <p className="text-xs text-purple-300">Bấm để đổi ảnh khác</p>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    Kéo thả hoặc bấm để chọn ảnh chụp rương đồ
                  </p>
                  <p className="text-[11px] text-[#717684]">
                    Hỗ trợ JPG, PNG chụp từ game Play Together
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scan Action */}
          {selectedImage && (
            <button
              onClick={handleScanWithGemini}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.01]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích nhận diện quả &amp; biến thể...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu Quét với AI Gemini</span>
                </>
              )}
            </button>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Detected Results Preview */}
          {detectedList.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#2a2d36]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Kết Quả Nhận Diện ({detectedList.length} món)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {detectedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#22242a] border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.fruitIcon || '🍎'}</span>
                      <div>
                        <span className="font-bold text-white block">{item.fruitName}</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.variants.length === 0 ? (
                            <span className="text-[10px] text-slate-400">Trái thường</span>
                          ) : (
                            item.variants.map((v) => (
                              <span
                                key={v}
                                className="px-1.5 py-0.2 rounded-full bg-purple-900/50 text-purple-300 text-[10px] border border-purple-600/30"
                              >
                                {v}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-extrabold text-emerald-400 text-sm">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmAdd}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01]"
              >
                Xác nhận thêm tất cả vào rương của {targetAccount.username}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
