import React, { useState } from 'react';
import { Copy, Check, Edit3, Trash2, Package } from 'lucide-react';
import { Account } from '../types';
import { getTotalFruits } from '../hooks/useAccounts';

interface AccountTableProps {
  accounts: Account[];
  onOpenAccountInfo: (account: Account) => void;
  onOpenChest: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  onOpenAccountInfo,
  onOpenChest,
  onDeleteAccount,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRoleId = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roleId);
    setCopiedId(roleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const avatarColors = [
    'bg-sky-500 text-white',
    'bg-amber-500 text-white',
    'bg-emerald-500 text-white',
    'bg-purple-500 text-white',
    'bg-rose-500 text-white',
    'bg-indigo-500 text-white',
  ];

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-[#1c1e22] rounded-2xl border border-[#2b2d35] p-12 text-center shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#272a32] flex items-center justify-center text-2xl mb-4">
          🔍
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Không tìm thấy tài khoản nào
        </h3>
        <p className="text-sm text-[#8e95a5] mt-1">
          Hãy thử đổi từ khóa tìm kiếm hoặc bấm nút "Thêm tài khoản" ở góc trên.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1e22] rounded-2xl border border-[#2b2d35] shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#2b2d35] bg-[#17181c] text-xs font-semibold text-[#8e95a5] uppercase tracking-wider">
              <th className="py-4 px-6 min-w-[240px]">
                Tài khoản · Tình trạng
              </th>

              <th className="py-4 px-4 text-center min-w-[80px]" title="Level / Cấp sao">
                <span className="flex items-center justify-center gap-1">
                  <span>⭐</span>
                  <span>Level</span>
                </span>
              </th>

              <th className="py-4 px-4 text-center min-w-[100px]" title="Kim Cương / Đá quý">
                <span className="flex items-center justify-center gap-1">
                  <span>💎</span>
                  <span>Kim Cương</span>
                </span>
              </th>

              <th className="py-4 px-4 text-center min-w-[80px]" title="Vé và Phiếu">
                <span className="flex items-center justify-center gap-1">
                  <span>🎫</span>
                  <span>Vé</span>
                </span>
              </th>

              <th className="py-4 px-4 text-center min-w-[130px]" title="Rương Nông Sản">
                <span className="flex items-center justify-center gap-1 text-amber-400">
                  <span>📦</span>
                  <span>Rương Đồ</span>
                </span>
              </th>

              <th className="py-4 px-6 text-right min-w-[100px]">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#26282f] text-sm">
            {accounts.map((acc) => {
              const totalFruits = getTotalFruits(acc);
              const initialLetter = (acc.username || 'P').charAt(0).toUpperCase();
              const avatarBg = getAvatarColor(acc.username);

              return (
                <tr
                  key={acc.id}
                  className="hover:bg-[#23262d] transition-colors group"
                >
                  {/* Account Name & Info (Clicking opens AccountInfoModal) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        onClick={() => onOpenAccountInfo(acc)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow cursor-pointer hover:scale-105 transition-transform ${avatarBg}`}
                      >
                        {initialLetter}
                      </div>

                      <div>
                        {/* Clickable Username */}
                        <div
                          onClick={() => onOpenAccountInfo(acc)}
                          className="font-bold text-slate-100 hover:text-cyan-400 cursor-pointer flex items-center gap-2 transition-colors"
                          title="Bấm vào để xem & chỉnh sửa Tên, Mật khẩu, ID"
                        >
                          <span>{acc.username}</span>
                          {acc.characterName && acc.characterName !== acc.username && (
                            <span className="text-xs text-[#8e95a5] font-normal">
                              ({acc.characterName})
                            </span>
                          )}
                        </div>

                        {/* Status & Role ID */}
                        <div className="flex items-center gap-2 text-xs text-[#8e95a5] mt-0.5">
                          {acc.status === 'active' && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Vào được
                            </span>
                          )}
                          {acc.status === 'banned' && (
                            <span className="flex items-center gap-1 text-rose-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Bị khóa
                            </span>
                          )}
                          {acc.status === 'wrong_pw' && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Sai mật khẩu
                            </span>
                          )}
                          {acc.status === 'pending' && (
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Chưa kiểm tra
                            </span>
                          )}

                          <span>·</span>

                          <button
                            onClick={(e) => handleCopyRoleId(e, acc.roleId)}
                            title="Bấm để sao chép Role ID"
                            className="font-mono text-[11px] text-[#9a9fa8] hover:text-white flex items-center gap-1 bg-[#252830] px-1.5 py-0.5 rounded transition-colors"
                          >
                            <span>{acc.roleId || 'No ID'}</span>
                            {copiedId === acc.roleId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ⭐ Level */}
                  <td className="py-4 px-4 text-center font-bold text-amber-400 text-sm">
                    {formatNumber(acc.stars)}
                  </td>

                  {/* 💎 Gems */}
                  <td className="py-4 px-4 text-center font-bold text-fuchsia-400 text-sm">
                    {formatNumber(acc.gems)}
                  </td>

                  {/* 🎫 Tickets */}
                  <td className="py-4 px-4 text-center text-slate-300 text-sm">
                    {formatNumber(acc.tickets)}
                  </td>

                  {/* 📦 Rương Nông Sản (Clicking opens ChestModal) */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onOpenChest(acc)}
                      title="Bấm để mở rương nông sản & quản lý biến thể"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-600/40 hover:border-amber-400 text-amber-200 text-xs font-bold shadow transition-all hover:scale-105 active:scale-95"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatNumber(totalFruits)} quả</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenAccountInfo(acc)}
                        title="Xem & Chỉnh sửa thông tin tài khoản"
                        className="p-2 rounded-lg bg-[#262831] hover:bg-cyan-500/20 text-[#8e95a5] hover:text-cyan-400 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenChest(acc)}
                        title="Mở rương đồ nông sản"
                        className="p-2 rounded-lg bg-[#262831] hover:bg-amber-500/20 text-[#8e95a5] hover:text-amber-400 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa tài khoản "${acc.username}"?`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        title="Xóa tài khoản"
                        className="p-2 rounded-lg bg-[#262831] hover:bg-rose-500/20 text-[#8e95a5] hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
