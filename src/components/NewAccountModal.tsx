import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Account, AccountStatus } from '../types';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<Account, 'id' | 'updatedAt'>) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState<AccountStatus>('active');
  const [stars, setStars] = useState(1);
  const [gems, setGems] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [cash, setCash] = useState(0);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    onAdd({
      username: username.trim(),
      password: password.trim(),
      characterName: characterName.trim() || username.trim(),
      roleId: roleId.trim(),
      status,
      stars: Math.max(1, Number(stars) || 1),
      gems: Math.max(0, Number(gems) || 0),
      tickets: Math.max(0, Number(tickets) || 0),
      cash: Math.max(0, Number(cash) || 0),
      fruits: [], // Rương ban đầu trống
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white">Thêm Tài Khoản Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tên tài khoản / Đăng nhập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: taikhoan1"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-bold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Mật khẩu (Tùy chọn)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Role ID (Mã Role)
              </label>
              <input
                type="text"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder="VD: KAIA3SM48R"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-mono font-bold text-sky-600 dark:text-cyan-300 border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Tên nhân vật in-game
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Để trống = Tên tài khoản"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Tình trạng
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-sm font-bold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">🟢 Vào được</option>
                <option value="pending">⚪ Chưa kiểm tra</option>
                <option value="wrong_pw">🟡 Sai mật khẩu</option>
                <option value="banned">🔴 Bị khóa</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E2D5] dark:border-[#292c34]">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#8e95a5] mb-2">
              Chỉ số ban đầu
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-amber-500 mb-0.5">⭐ Level</label>
                <input
                  type="number"
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#22242a] text-xs font-black text-center text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-500 mb-0.5">💵 Tiền</label>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#22242a] text-xs font-black text-center text-emerald-600 dark:text-emerald-400 border border-[#E8E2D5] dark:border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-fuchsia-500 mb-0.5">💎 KC</label>
                <input
                  type="number"
                  value={gems}
                  onChange={(e) => setGems(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#22242a] text-xs font-black text-center text-fuchsia-600 dark:text-fuchsia-300 border border-[#E8E2D5] dark:border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-500 mb-0.5">🎫 Vé</label>
                <input
                  type="number"
                  value={tickets}
                  onChange={(e) => setTickets(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#22242a] text-xs font-black text-center text-sky-600 dark:text-sky-300 border border-[#E8E2D5] dark:border-[#323640]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm về tài khoản này..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#22242a] text-xs text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D5] dark:border-[#292c34]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
