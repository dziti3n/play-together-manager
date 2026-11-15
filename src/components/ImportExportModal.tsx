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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Sao Lưu &amp; Xuất Nhập Dữ Liệu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252830]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importStatus.type && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e95a5]">
              1. Xuất dữ liệu ra máy (Backup / Chia sẻ)
            </h4>
            <p className="text-xs text-slate-400">
              Tải toàn bộ danh sách {accounts.length} tài khoản và kho nông sản về máy của bạn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onExportJSON}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#23262e] hover:bg-[#2c303a] text-slate-100 text-xs font-semibold border border-[#343842] transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Xuất file JSON (.json)</span>
              </button>

              <button
                onClick={onExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#23262e] hover:bg-[#2c303a] text-slate-100 text-xs font-semibold border border-[#343842] transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Xuất file Excel (.csv)</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#292c34]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e95a5]">
              2. Nhập dữ liệu từ tệp (.json)
            </h4>
            <p className="text-xs text-slate-400">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.01]"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn tệp JSON để nhập</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#292c34] flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-300">
                Khôi phục dữ liệu mẫu
              </span>
              <span className="text-[11px] text-[#8e95a5]">
                Tải lại 2 tài khoản mẫu Play Together ban đầu
              </span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh sách tài khoản mẫu ban đầu?')) {
                  onResetSample();
                  setImportStatus({ type: 'success', message: 'Đã khôi phục dữ liệu mẫu!' });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252830] hover:bg-[#30333d] text-xs font-medium text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-[#2b2d35] bg-[#16171b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
