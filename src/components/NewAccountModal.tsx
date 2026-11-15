import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Account, AccountStatus, FruitItem } from '../types';
import { DEFAULT_FRUITS_TEMPLATE } from '../data/initialData';

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
  const [gameBucks, setGameBucks] = useState(0);
  const [gems, setGems] = useState(0);
  const [goldBars, setGoldBars] = useState(0);
  const [boxes, setBoxes] = useState(0);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const initialFruits: FruitItem[] = DEFAULT_FRUITS_TEMPLATE.map((template, idx) => ({
      id: `fruit_${Date.now()}_${idx}`,
      name: template.name,
      icon: template.icon,
      quantity: 0,
    }));

    onAdd({
      username: username.trim(),
      password: password.trim(),
      characterName: characterName.trim() || username.trim(),
      roleId: roleId.trim(),
      status,
      stars: Math.max(1, Number(stars) || 1),
      gameBucks: Math.max(0, Number(gameBucks) || 0),
      gems: Math.max(0, Number(gems) || 0),
      goldBars: Math.max(0, Number(goldBars) || 0),
      boxes: Math.max(0, Number(boxes) || 0),
      tickets: 0,
      eventPoints: 0,
      fruits: initialFruits,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2d35] bg-[#16171b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Thêm Tài Khoản Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252830]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên tài khoản / Đăng nhập <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: tunafishboyby99"
              className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mật khẩu (Tùy chọn)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu đăng nhập"
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tên nhân vật in-game
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Để trống = Tên tài khoản"
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role ID (Mã Role)
              </label>
              <input
                type="text"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder="VD: KAIA3SM48R"
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm font-mono text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tình trạng
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">🟢 Vào được</option>
                <option value="pending">⚪ Chưa kiểm tra</option>
                <option value="wrong_pw">🟡 Sai mật khẩu</option>
                <option value="banned">🔴 Bị khóa</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#292c34]">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#8e95a5] mb-2">
              Tài nguyên ban đầu
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">⭐ Cấp sao</label>
                <input
                  type="number"
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-[#22242a] text-xs font-bold text-white border border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400 mb-0.5">💵 Tiền Sao</label>
                <input
                  type="number"
                  value={gameBucks}
                  onChange={(e) => setGameBucks(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-[#22242a] text-xs font-bold text-emerald-300 border border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-fuchsia-400 mb-0.5">💎 Kim Cương</label>
                <input
                  type="number"
                  value={gems}
                  onChange={(e) => setGems(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-[#22242a] text-xs font-bold text-fuchsia-300 border border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-amber-300 mb-0.5">🧈 Thỏi Vàng</label>
                <input
                  type="number"
                  value={goldBars}
                  onChange={(e) => setGoldBars(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-[#22242a] text-xs font-bold text-amber-300 border border-[#323640]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-orange-400 mb-0.5">📦 Hộp quà</label>
                <input
                  type="number"
                  value={boxes}
                  onChange={(e) => setBoxes(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-[#22242a] text-xs font-bold text-orange-300 border border-[#323640]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm về tài khoản này..."
              className="w-full px-3 py-2 rounded-lg bg-[#22242a] text-sm text-white border border-[#323640] focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292c34]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
