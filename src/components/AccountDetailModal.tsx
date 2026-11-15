import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Minus,
  Sparkles,
  Wheat,
  Info,
  Layers,
} from 'lucide-react';
import { Account, AccountStatus, FruitItem } from '../types';
import { getTotalFruits } from '../hooks/useAccounts';

interface AccountDetailModalProps {
  account: Account | null;
  onClose: () => void;
  onSave: (account: Account) => void;
  onDelete: (id: string) => void;
}

const COMMON_EMOJIS = ['🥕', '🍅', '🍎', '🌽', '🍓', '🌾', '🥬', '🍉', '🌶️', '🍄', '🍇', '🥑', '🍊', '🍌', '🍍', '🥜', '🥦', '🥔'];

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!account) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'farm'>('info');
  const [formData, setFormData] = useState<Account>({ ...account });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const [showAddFruitForm, setShowAddFruitForm] = useState(false);
  const [newFruitName, setNewFruitName] = useState('');
  const [newFruitIcon, setNewFruitIcon] = useState('🥕');
  const [newFruitQty, setNewFruitQty] = useState<number>(10);

  useEffect(() => {
    setFormData({ ...account });
  }, [account]);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 700);
  };

  const handleUpdateFruitQty = (fruitId: string, delta: number) => {
    setFormData((prev) => ({
      ...prev,
      fruits: (prev.fruits || []).map((f) =>
        f.id === fruitId ? { ...f, quantity: Math.max(0, (f.quantity || 0) + delta) } : f
      ),
    }));
  };

  const handleSetFruitQtyDirect = (fruitId: string, val: number) => {
    setFormData((prev) => ({
      ...prev,
      fruits: (prev.fruits || []).map((f) =>
        f.id === fruitId ? { ...f, quantity: Math.max(0, val) } : f
      ),
    }));
  };

  const handleDeleteFruit = (fruitId: string) => {
    setFormData((prev) => ({
      ...prev,
      fruits: (prev.fruits || []).filter((f) => f.id !== fruitId),
    }));
  };

  const handleAddNewFruit = () => {
    if (!newFruitName.trim()) return;
    const newFruit: FruitItem = {
      id: 'fruit_' + Date.now(),
      name: newFruitName.trim(),
      icon: newFruitIcon,
      quantity: Math.max(0, Number(newFruitQty) || 0),
    };
    setFormData((prev) => ({
      ...prev,
      fruits: [...(prev.fruits || []), newFruit],
    }));
    setNewFruitName('');
    setNewFruitQty(10);
    setShowAddFruitForm(false);
  };

  const currentTotalFruits = getTotalFruits(formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#1c1e22] dark:bg-[#1c1e22] light:bg-white rounded-2xl border border-[#2e313b] dark:border-[#2e313b] light:border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#2b2d35] dark:border-[#2b2d35] light:border-slate-200 bg-[#16171b] dark:bg-[#16171b] light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
              {(formData.username || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white dark:text-white light:text-slate-900">
                  {formData.username}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
                    formData.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : formData.status === 'banned'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : formData.status === 'wrong_pw'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      formData.status === 'active'
                        ? 'bg-emerald-400'
                        : formData.status === 'banned'
                        ? 'bg-rose-400'
                        : formData.status === 'wrong_pw'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  {formData.status === 'active'
                    ? 'Vào được'
                    : formData.status === 'banned'
                    ? 'Bị khóa'
                    : formData.status === 'wrong_pw'
                    ? 'Sai mật khẩu'
                    : 'Chưa kiểm tra'}
                </span>
              </div>
              <p className="text-xs text-[#8e95a5] font-mono mt-0.5">
                Role ID: {formData.roleId || 'Chưa thiết lập'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8e95a5] hover:text-white hover:bg-[#272930] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#2b2d35] dark:border-[#2b2d35] light:border-slate-200 px-5 sm:px-7 bg-[#191a1e] dark:bg-[#191a1e] light:bg-slate-100">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'info'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-[#8e95a5] hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Thông tin &amp; Tài nguyên</span>
          </button>

          <button
            onClick={() => setActiveTab('farm')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'farm'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-[#8e95a5] hover:text-slate-200'
            }`}
          >
            <Wheat className="w-4 h-4 text-emerald-400" />
            <span>Quản Lý Nông Trại (Kho Trái Cây)</span>
            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              {currentTotalFruits}
            </span>
          </button>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-[#17181c] dark:bg-[#17181c] light:bg-slate-50 p-4 sm:p-5 rounded-xl border border-[#2b2d35] dark:border-[#2b2d35] light:border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e95a5] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thông tin đăng nhập &amp; Định danh</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Tên tài khoản / Đăng nhập
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#22242a] dark:bg-[#22242a] light:bg-white text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 border border-[#323640] focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy('username', formData.username)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title="Sao chép tên tài khoản"
                      >
                        {copiedField === 'username' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Nhập mật khẩu nếu có"
                        className="w-full pl-3 pr-16 py-2 rounded-lg bg-[#22242a] dark:bg-[#22242a] light:bg-white text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 border border-[#323640] focus:outline-none focus:border-cyan-500"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-white p-1"
                          title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy('password', formData.password || '')}
                          className="text-slate-400 hover:text-white p-1"
                          title="Sao chép mật khẩu"
                        >
                          {copiedField === 'password' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Tên nhân vật (In-game)
                    </label>
                    <input
                      type="text"
                      value={formData.characterName}
                      onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                      placeholder="VD: Tunafish_01"
                      className="w-full px-3 py-2 rounded-lg bg-[#22242a] dark:bg-[#22242a] light:bg-white text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 border border-[#323640] focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Role ID (Mã nhân vật)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.roleId}
                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                        placeholder="VD: KAIA3SM48R"
                        className="w-full px-3 py-2 rounded-lg bg-[#22242a] dark:bg-[#22242a] light:bg-white text-sm font-mono text-slate-100 dark:text-slate-100 light:text-slate-900 border border-[#323640] focus:outline-none focus:border-cyan-500"
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

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Tình trạng tài khoản
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { val: 'active', label: 'Vào được', color: 'emerald' },
                        { val: 'banned', label: 'Bị khóa', color: 'rose' },
                        { val: 'wrong_pw', label: 'Sai mật khẩu', color: 'amber' },
                        { val: 'pending', label: 'Chưa kiểm tra', color: 'slate' },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s.val as AccountStatus })}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            formData.status === s.val
                              ? 'bg-slate-700 text-white border-cyan-400 ring-1 ring-cyan-400'
                              : 'bg-[#22242a] text-[#8e95a5] border-[#323640] hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full bg-${s.color}-400`}></span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#17181c] dark:bg-[#17181c] light:bg-slate-50 p-4 sm:p-5 rounded-xl border border-[#2b2d35] dark:border-[#2b2d35] light:border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e95a5] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tài nguyên trong game</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                      <span>⭐</span>
                      <span>Cấp sao</span>
                    </div>
                    <input
                      type="number"
                      value={formData.stars}
                      onChange={(e) => setFormData({ ...formData, stars: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                      <span>💵</span>
                      <span>Tiền Sao</span>
                    </div>
                    <input
                      type="number"
                      value={formData.gameBucks}
                      onChange={(e) => setFormData({ ...formData, gameBucks: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 font-semibold mb-1">
                      <span>💎</span>
                      <span>Kim Cương</span>
                    </div>
                    <input
                      type="number"
                      value={formData.gems}
                      onChange={(e) => setFormData({ ...formData, gems: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
                      <span>🧈</span>
                      <span>Thỏi Vàng</span>
                    </div>
                    <input
                      type="number"
                      value={formData.goldBars}
                      onChange={(e) => setFormData({ ...formData, goldBars: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold mb-1">
                      <span>📦</span>
                      <span>Hộp quà / Rương</span>
                    </div>
                    <input
                      type="number"
                      value={formData.boxes}
                      onChange={(e) => setFormData({ ...formData, boxes: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1">
                      <span>🎫</span>
                      <span>Vé &amp; Phiếu</span>
                    </div>
                    <input
                      type="number"
                      value={formData.tickets}
                      onChange={(e) => setFormData({ ...formData, tickets: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#22242a] dark:bg-[#22242a] light:bg-white p-3 rounded-xl border border-[#323640]">
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mb-1">
                      <span>🍁</span>
                      <span>Điểm sự kiện</span>
                    </div>
                    <input
                      type="number"
                      value={formData.eventPoints}
                      onChange={(e) => setFormData({ ...formData, eventPoints: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-base font-bold text-white dark:text-white light:text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div
                    onClick={() => setActiveTab('farm')}
                    className="bg-emerald-950/20 hover:bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <span>🥕</span>
                        <span>Kho Trái Cây</span>
                      </span>
                      <span className="text-[10px] underline">Chi tiết →</span>
                    </div>
                    <div className="text-base font-bold text-emerald-300">
                      {currentTotalFruits} trái
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8e95a5] mb-2">
                  Ghi chú riêng cho tài khoản
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú thêm (thiết bị đang treo, ai đang giữ nick, v.v.)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181c] dark:bg-[#17181c] light:bg-white text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 border border-[#2b2d35] focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'farm' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-[#182a22] to-[#17181c] border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                    🌾
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      Kho Nông Sản Của Tài Khoản
                    </h4>
                    <p className="text-xs text-[#8e95a5]">
                      Theo dõi số lượng từng loại trái cây sở hữu. Tổng số lượng sẽ tự động đồng bộ ra ngoài bảng chính.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right pr-2 border-r border-[#2d3b33]">
                    <span className="text-[11px] text-[#8e95a5] block">Tổng số trái</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {currentTotalFruits}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddFruitForm(!showAddFruitForm)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm loại trái mới</span>
                  </button>
                </div>
              </div>

              {showAddFruitForm && (
                <div className="p-4 rounded-xl bg-[#20232a] border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>➕</span>
                      <span>Thêm Nông Sản Mới</span>
                    </h5>
                    <button
                      onClick={() => setShowAddFruitForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[#8e95a5] mb-1">
                        Tên loại trái / rau củ
                      </label>
                      <input
                        type="text"
                        value={newFruitName}
                        onChange={(e) => setNewFruitName(e.target.value)}
                        placeholder="VD: Dưa lưới, Nho xanh..."
                        className="w-full px-3 py-1.5 rounded-lg bg-[#17181c] text-sm text-white border border-[#343842] focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8e95a5] mb-1">
                        Số lượng ban đầu
                      </label>
                      <input
                        type="number"
                        value={newFruitQty}
                        onChange={(e) => setNewFruitQty(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#17181c] text-sm text-white border border-[#343842] focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#8e95a5] mb-1.5">
                      Chọn biểu tượng:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewFruitIcon(emoji)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform ${
                            newFruitIcon === emoji
                              ? 'bg-emerald-600 scale-110 shadow ring-2 ring-emerald-300'
                              : 'bg-[#17181c] hover:bg-[#2b2e37]'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowAddFruitForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#8e95a5] hover:text-white"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddNewFruit}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Lưu Nông Sản Này
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(formData.fruits || []).map((fruit) => (
                  <div
                    key={fruit.id}
                    className="p-3.5 rounded-xl bg-[#17181c] dark:bg-[#17181c] light:bg-slate-50 border border-[#2b2d35] hover:border-emerald-500/40 transition-colors flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 bg-[#22242b] rounded-lg">
                          {fruit.icon || '🥕'}
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                            {fruit.name}
                          </h5>
                          <span className="text-[11px] text-[#8e95a5]">
                            Trong kho
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFruit(fruit.id)}
                        className="text-[#717684] hover:text-rose-400 p-1"
                        title="Xóa loại trái này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateFruitQty(fruit.id, -10)}
                        title="Giảm 10"
                        className="px-1.5 py-1 rounded bg-[#23252d] hover:bg-[#2e313b] text-[10px] text-slate-400 font-bold"
                      >
                        -10
                      </button>

                      <button
                        onClick={() => handleUpdateFruitQty(fruit.id, -1)}
                        title="Giảm 1"
                        className="p-1 rounded bg-[#23252d] hover:bg-[#2e313b] text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        value={fruit.quantity}
                        onChange={(e) =>
                          handleSetFruitQtyDirect(fruit.id, Math.max(0, Number(e.target.value)))
                        }
                        className="w-16 px-1.5 py-1 text-center font-bold text-sm bg-[#22242b] text-emerald-300 rounded border border-[#32353e] focus:outline-none focus:border-emerald-400"
                      />

                      <button
                        onClick={() => handleUpdateFruitQty(fruit.id, 1)}
                        title="Tăng 1"
                        className="p-1 rounded bg-[#23252d] hover:bg-emerald-600 text-slate-300 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleUpdateFruitQty(fruit.id, 10)}
                        title="Tăng 10"
                        className="px-1.5 py-1 rounded bg-[#23252d] hover:bg-emerald-600 text-[10px] text-slate-300 hover:text-white font-bold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                ))}

                {(!formData.fruits || formData.fruits.length === 0) && (
                  <div className="sm:col-span-3 py-8 text-center text-[#8e95a5]">
                    Chưa có loại nông sản nào. Bấm nút "Thêm loại trái mới" ở trên để bắt đầu!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-t border-[#2b2d35] dark:border-[#2b2d35] light:border-slate-200 bg-[#16171b] dark:bg-[#16171b] light:bg-slate-50">
          <button
            onClick={() => {
              if (window.confirm(`Bạn có chắc muốn xóa tài khoản "${formData.username}"?`)) {
                onDelete(formData.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa tài khoản này</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#8e95a5] hover:text-white hover:bg-[#252830] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSavedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
