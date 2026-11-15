import React, { useState } from 'react';
import { X, Eye, EyeOff, Copy, Check, Save } from 'lucide-react';
import { Account, AccountStatus } from '../types';

interface AccountInfoModalProps {
  account: Account | null;
  onClose: () => void;
  onSave: (account: Account) => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({
  account,
  onClose,
  onSave,
}) => {
  if (!account) return null;

  const [formData, setFormData] = useState<Account>({ ...account });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow">
              {(formData.username || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                Thông Tin Tài Khoản
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                {formData.username}
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
        <div className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tên tài khoản / Đăng nhập
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-bold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500 pr-10"
              />
              <button
                type="button"
                onClick={() => handleCopy('username', formData.username)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 dark:hover:text-white p-1"
                title="Sao chép tên"
              >
                {copiedField === 'username' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Role ID */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Role ID (Mã nhân vật trong game)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-mono font-bold text-sky-600 dark:text-cyan-300 border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500 pr-10"
              />
              <button
                type="button"
                onClick={() => handleCopy('roleId', formData.roleId)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 dark:hover:text-white p-1"
                title="Sao chép Role ID"
              >
                {copiedField === 'roleId' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Mật khẩu tài khoản
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Chưa lưu mật khẩu"
                className="w-full pl-3.5 pr-20 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-bold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-sky-600 dark:hover:text-white p-1"
                  title={showPassword ? 'Ẩn' : 'Hiện'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('password', formData.password || '')}
                  className="text-slate-400 hover:text-sky-600 dark:hover:text-white p-1"
                  title="Sao chép mật khẩu"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tình trạng đăng nhập
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-bold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="active">🟢 Vào được bình thường</option>
              <option value="banned">🔴 Bị khóa tài khoản (Ban)</option>
              <option value="wrong_pw">🟠 Sai mật khẩu</option>
              <option value="pending">⚪ Chưa kiểm tra</option>
            </select>
          </div>

          {/* Numeric stats */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#22242A] border border-[#E8E2D5] dark:border-[#323640] text-center">
              <span className="text-[11px] font-bold text-slate-400 block">⭐ Level</span>
              <input
                type="number"
                value={formData.stars}
                onChange={(e) => setFormData({ ...formData, stars: Number(e.target.value) })}
                className="w-full text-center font-black text-amber-500 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#22242A] border border-[#E8E2D5] dark:border-[#323640] text-center">
              <span className="text-[11px] font-bold text-slate-400 block">💎 Kim Cương</span>
              <input
                type="number"
                value={formData.gems}
                onChange={(e) => setFormData({ ...formData, gems: Number(e.target.value) })}
                className="w-full text-center font-black text-fuchsia-500 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#22242A] border border-[#E8E2D5] dark:border-[#323640] text-center">
              <span className="text-[11px] font-bold text-slate-400 block">🎫 Vé</span>
              <input
                type="number"
                value={formData.tickets}
                onChange={(e) => setFormData({ ...formData, tickets: Number(e.target.value) })}
                className="w-full text-center font-black text-slate-700 dark:text-slate-200 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Ghi chú riêng
            </label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Ghi chú về acc này..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-xs text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25A9E0] hover:bg-[#1d96c9] active:scale-95 text-white text-xs font-black shadow-md shadow-sky-500/30 transition-all hover:scale-105"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã lưu!' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
