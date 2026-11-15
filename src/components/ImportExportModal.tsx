import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Account } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (jsonStr: string) => { success: boolean; message: string; count?: number };
  onResetSample: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onResetSample,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = onImportJSON(content);
        if (result.success) {
          setImportStatus({ type: 'success', message: result.message });
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportStatus({ type: 'error', message: result.message });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white">Sao Lưu &amp; Xuất Nhập Dữ Liệu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importStatus.type && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
                importStatus.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#8e95a5]">
              1. Xuất dữ liệu ra máy (Backup / Chia sẻ)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tải toàn bộ danh sách {accounts.length} tài khoản và kho nông sản về máy của bạn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onExportJSON}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#22242a] hover:bg-slate-50 dark:hover:bg-[#2c303a] text-slate-800 dark:text-slate-100 text-xs font-bold border border-[#E8E2D5] dark:border-[#343842] transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>Xuất file JSON (.json)</span>
              </button>

              <button
                onClick={onExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#22242a] hover:bg-slate-50 dark:hover:bg-[#2c303a] text-slate-800 dark:text-slate-100 text-xs font-bold border border-[#E8E2D5] dark:border-[#343842] transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Xuất file Excel (.csv)</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#E8E2D5] dark:border-[#292c34]">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#8e95a5]">
              2. Nhập dữ liệu từ tệp (.json)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khôi phục từ bản sao lưu hoặc nạp danh sách tài khoản được người khác chia sẻ.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.01]"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn tệp JSON để nhập</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#E8E2D5] dark:border-[#292c34] flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                Xóa sạch toàn bộ dữ liệu
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#8e95a5]">
                Xóa hết tài khoản và đơn hàng để nhập dữ liệu thật
              </span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ tài khoản và đơn hàng để làm mới từ đầu?')) {
                  onResetSample();
                  setImportStatus({ type: 'success', message: 'Đã xóa sạch dữ liệu, sẵn sàng nhập dữ liệu thật!' });
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa sạch dữ liệu</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-[#E8E2D5] dark:border-[#2b2d35] bg-[#F4EFE6] dark:bg-[#16171b]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
