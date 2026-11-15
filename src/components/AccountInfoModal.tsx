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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {(formData.username || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Thông Tin Tài Khoản
              </h3>
              <p className="text-xs text-[#8e95a5]">
                {formData.username}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên tài khoản / Đăng nhập
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-cyan-500 pr-9"
              />
              <button
                type="button"
                onClick={() => handleCopy('username', formData.username)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Sao chép tên"
              >
                {copiedField === 'username' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Role ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Role ID (Mã nhân vật in-game)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm font-mono text-cyan-300 border border-[#323640] focus:outline-none focus:border-cyan-500 pr-9"
              />
              <button
                type="button"
                onClick={() => handleCopy('roleId', formData.roleId)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Sao chép Role ID"
              >
                {copiedField === 'roleId' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Chưa lưu mật khẩu"
                className="w-full pl-3 pr-16 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-cyan-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white p-1"
                  title={showPassword ? 'Ẩn' : 'Hiện'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('password', formData.password || '')}
                  className="text-slate-400 hover:text-white p-1"
                  title="Sao chép mật khẩu"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tình trạng tài khoản
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'active', label: '🟢 Vào được', color: 'emerald' },
                { val: 'banned', label: '🔴 Bị khóa', color: 'rose' },
                { val: 'wrong_pw', label: '🟡 Sai mật khẩu', color: 'amber' },
                { val: 'pending', label: '⚪ Chưa kiểm tra', color: 'slate' },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s.val as AccountStatus })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all ${
                    formData.status === s.val
                      ? 'bg-slate-700 text-white border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-[#22242a] text-[#8e95a5] border-[#323640] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Mini Row: Stars, Gems, Tickets */}
          <div className="pt-2 border-t border-[#2a2d36]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8e95a5] mb-2">
              Chỉ số phụ
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#22242a] p-2 rounded-lg border border-[#323640]">
                <span className="text-[11px] text-amber-400 font-semibold block">⭐ Level</span>
                <input
                  type="number"
                  value={formData.stars}
                  onChange={(e) => setFormData({ ...formData, stars: Math.max(1, Number(e.target.value)) })}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div className="bg-[#22242a] p-2 rounded-lg border border-[#323640]">
                <span className="text-[11px] text-fuchsia-400 font-semibold block">💎 Kim Cương</span>
                <input
                  type="number"
                  value={formData.gems}
                  onChange={(e) => setFormData({ ...formData, gems: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div className="bg-[#22242a] p-2 rounded-lg border border-[#323640]">
                <span className="text-[11px] text-sky-400 font-semibold block">🎫 Vé</span>
                <input
                  type="number"
                  value={formData.tickets}
                  onChange={(e) => setFormData({ ...formData, tickets: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Ghi chú về acc này..."
              className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-xs text-white border border-[#323640] focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-[#2b2d35] bg-[#16171b]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.02]"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã lưu!' : 'Lưu thông tin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
