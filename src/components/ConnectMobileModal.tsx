import React, { useState } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Wifi,
  ExternalLink,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkIp?: string;
}

export const ConnectMobileModal: React.FC<ConnectMobileModalProps> = ({
  isOpen,
  onClose,
  networkIp = '192.168.1.7',
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const mobileUrl = `http://${networkIp}:5173`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    mobileUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Chạy Ứng Dụng Trên Điện Thoại</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  Dễ Dàng 100%
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                Quét mã QR để mở trực tiếp trên iPhone / Android
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
          {/* QR Code Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] shadow-xs text-center space-y-3">
            <div className="w-56 h-56 mx-auto bg-white p-2.5 rounded-2xl border-2 border-emerald-500/30 shadow-inner flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code Mobile"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" />
                <span>Mở Camera điện thoại hoặc Zalo quét mã này</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Điện thoại và máy tính chỉ cần bắt chung 1 mạng Wi-Fi nhà
              </p>
            </div>

            {/* Link Box */}
            <div className="flex items-center gap-2 max-w-sm mx-auto pt-1">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-mono font-bold text-slate-800 dark:text-emerald-400 border border-[#E8E2D5] dark:border-[#323640] truncate select-all text-center">
                {mobileUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hướng Dẫn Cực Dễ 3 Bước */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>Hướng Dẫn 3 Bước Mở &amp; Cài Ra Màn Hình Điện Thoại:</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Bước 1 */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-white block">Kết nối cùng Wi-Fi</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Đảm bảo điện thoại của bạn đang kết nối vào cùng mạng Wi-Fi với máy tính này.
                  </span>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-white block">Mở trên điện thoại</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Bật Camera quét mã QR ở trên hoặc mở trình duyệt (Safari / Chrome) gõ:{' '}
                    <strong className="text-sky-600 dark:text-sky-400 font-mono">{mobileUrl}</strong>
                  </span>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-white block">
                    Cài thành App ra Màn Hình Chính (Toàn màn hình)
                  </strong>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 space-y-1">
                    <p>
                      🍏 <strong>Trên iPhone (Safari):</strong> Bấm nút <strong>Chia sẻ (nút vuông mũi tên lên)</strong> ➜ Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
                    </p>
                    <p>
                      🤖 <strong>Trên Android (Chrome):</strong> Bấm dấu <strong>3 chấm góc trên</strong> ➜ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lợi ích khi dùng trên điện thoại */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-purple-500 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong>Siêu tiện lợi khi chơi game:</strong> Khi chơi Play Together trên điện thoại, bạn chỉ cần chụp màn hình rương đồ ➜ Chuyển sang app này ➜ Bấm <strong>"AI Quét Rương"</strong> rồi chọn ảnh trực tiếp từ Thư viện ảnh điện thoại! AI sẽ đồng bộ ngay lập tức mà không cần chuyển ảnh qua máy tính!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-black transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
