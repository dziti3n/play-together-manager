import React, { useState } from 'react';
import { Copy, Check, Edit3, Trash2, Package, Pin, SlidersHorizontal } from 'lucide-react';
import { Account } from '../types';
import { getTotalFruits } from '../hooks/useAccounts';
import { CropImage } from './CropImage';

interface AccountTableProps {
  accounts: Account[];
  featuredCrops?: string[];
  onOpenAccountInfo: (account: Account) => void;
  onOpenChest: (account: Account) => void;
  onOpenFruitDetail?: (account: Account, fruitName: string) => void;
  onOpenFeaturedModal?: () => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  featuredCrops = [],
  onOpenAccountInfo,
  onOpenChest,
  onOpenFruitDetail,
  onOpenFeaturedModal,
  onDeleteAccount,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRoleId = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roleId);
    setCopiedId(roleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return '0';
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
      <div className="bg-white dark:bg-[#1C1E24] rounded-3xl border border-slate-200 dark:border-[#2B2F3A] p-12 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-[#252831] flex items-center justify-center text-3xl mb-4">
          🌾
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Chưa có tài khoản nào được lưu
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8e95a5] mt-1 max-w-md mx-auto">
          Hệ thống đã dọn sạch toàn bộ số liệu mẫu. Hãy bấm nút <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">+ Thêm tài khoản</strong> ở góc trên bên phải để bắt đầu nhập các tài khoản thật của bạn!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C1E24] rounded-3xl border border-slate-200 dark:border-[#2B2F3A] shadow-xl overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#2B2F3A] bg-[#F7F8FA] dark:bg-[#16171B] text-xs font-bold text-slate-500 dark:text-[#8e95a5] uppercase tracking-wider">
              <th className="py-4 px-6 min-w-[240px]">
                Tài khoản · Tình trạng
              </th>

              <th className="py-4 px-4 text-center min-w-[80px]" title="Level / Cấp sao">
                <span className="flex items-center justify-center gap-1">
                  <span>⭐</span>
                  <span>Level</span>
                </span>
              </th>

              <th className="py-4 px-4 text-center min-w-[90px]" title="Tiền sao">
                <span className="flex items-center justify-center gap-1">
                  <span>💵</span>
                  <span>Tiền</span>
                </span>
              </th>

              <th className="py-4 px-4 text-center min-w-[100px]" title="Kim Cương">
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
                <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                  <span>📦</span>
                  <span>Rương Đồ</span>
                </span>
              </th>

              {/* Dynamic Columns: Quả Nổi Bật (Featured Crops) */}
              {featuredCrops.map((cropName) => (
                <th
                  key={cropName}
                  className="py-4 px-3 text-center min-w-[95px] max-w-[130px]"
                  title={`Số lượng ${cropName} hiện có`}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <CropImage name={cropName} className="w-4 h-4 object-contain" />
                    <span className="truncate max-w-[70px] text-xs">{cropName}</span>
                  </div>
                </th>
              ))}

              {/* Edit Featured Crops Button in Header */}
              <th className="py-4 px-2 text-center min-w-[44px]">
                {onOpenFeaturedModal && (
                  <button
                    onClick={onOpenFeaturedModal}
                    title="Cài đặt danh sách quả nổi bật hiển thị chung cho tất cả tài khoản"
                    className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition-all hover:scale-110 active:scale-95 shadow-2xs inline-flex items-center justify-center gap-1 text-[11px] font-bold"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {featuredCrops.length === 0 && (
                      <span className="hidden sm:inline">Ghim quả</span>
                    )}
                  </button>
                )}
              </th>

              <th className="py-4 px-6 text-right min-w-[100px]">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#26282f] text-sm font-semibold">
            {accounts.map((acc) => {
              const totalFruits = getTotalFruits(acc);
              const initialLetter = (acc.username || 'P').charAt(0).toUpperCase();
              const avatarBg = getAvatarColor(acc.username);

              return (
                <tr
                  key={acc.id}
                  className="hover:bg-slate-50 dark:hover:bg-[#23262D] transition-colors group"
                >
                  {/* Account Name & Info (Clicking opens AccountInfoModal) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        onClick={() => onOpenAccountInfo(acc)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow cursor-pointer hover:scale-105 active:scale-95 transition-transform ${avatarBg}`}
                      >
                        {initialLetter}
                      </div>

                      <div>
                        {/* Clickable Username */}
                        <div
                          onClick={() => onOpenAccountInfo(acc)}
                          className="font-extrabold text-slate-800 dark:text-slate-100 hover:text-sky-500 dark:hover:text-cyan-400 cursor-pointer flex items-center gap-2 transition-colors"
                          title="Bấm vào để xem & chỉnh sửa Tên, Mật khẩu, Role ID"
                        >
                          <span>{acc.username}</span>
                          {acc.characterName && acc.characterName !== acc.username && (
                            <span className="text-xs text-slate-400 dark:text-[#8e95a5] font-normal">
                              ({acc.characterName})
                            </span>
                          )}
                        </div>

                        {/* Status & Role ID */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8e95a5] mt-0.5">
                          {acc.status === 'active' && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Vào được
                            </span>
                          )}
                          {acc.status === 'banned' && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Bị khóa
                            </span>
                          )}
                          {acc.status === 'wrong_pw' && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
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
                            className="font-mono text-[11px] text-slate-600 dark:text-[#9a9fa8] hover:text-sky-600 dark:hover:text-white flex items-center gap-1 bg-slate-100 dark:bg-[#252830] px-2 py-0.5 rounded-md transition-colors"
                          >
                            <span>{acc.roleId || 'No ID'}</span>
                            {copiedId === acc.roleId ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ⭐ Level */}
                  <td className="py-4 px-4 text-center font-black text-amber-500 dark:text-amber-400 text-sm">
                    {formatNumber(acc.stars)}
                  </td>

                  {/* 💵 Tiền sao (Cash) */}
                  <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatNumber(acc.cash ?? 5)}
                  </td>

                  {/* 💎 Kim Cương (Gems) */}
                  <td className="py-4 px-4 text-center font-black text-fuchsia-600 dark:text-fuchsia-400 text-sm">
                    {formatNumber(acc.gems)}
                  </td>

                  {/* 🎫 Vé (Tickets) */}
                  <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-300 text-sm font-bold">
                    {formatNumber(acc.tickets)}
                  </td>

                  {/* 📦 Rương Nông Sản (Clicking opens ChestModal) */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onOpenChest(acc)}
                      title="Bấm để mở rương nông sản & xem các củ/quả cùng biến thể"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 hover:border-amber-500 text-amber-700 dark:text-amber-300 text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      {acc.fruits && acc.fruits.length > 0 ? (
                        <div className="flex -space-x-1.5 items-center">
                          {Array.from(new Set(acc.fruits.map((f) => f.fruitName)))
                            .slice(0, 3)
                            .map((name) => (
                              <div
                                key={name}
                                className="w-5 h-5 rounded-full bg-white dark:bg-[#1E2026] border border-amber-500/40 flex items-center justify-center p-0.5 shadow-xs overflow-hidden"
                              >
                                <CropImage name={name} className="w-4 h-4 object-contain" />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <Package className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>{formatNumber(totalFruits)} quả</span>
                    </button>
                  </td>

                  {/* Quả Nổi Bật Columns for this Account */}
                  {featuredCrops.map((cropName) => {
                    const matchingFruits = (acc.fruits || []).filter(
                      (f) => f.fruitName.toLowerCase() === cropName.toLowerCase()
                    );
                    const count = matchingFruits.length;
                    const mutantCount = matchingFruits.filter(
                      (f) => f.variants && f.variants.length > 0
                    ).length;

                    return (
                      <td key={cropName} className="py-4 px-3 text-center">
                        <button
                          onClick={() => {
                            if (onOpenFruitDetail) {
                              onOpenFruitDetail(acc, cropName);
                            } else {
                              onOpenChest(acc);
                            }
                          }}
                          title={`Xem chi tiết ${count} ${cropName} của ${acc.username}${mutantCount > 0 ? ` (${mutantCount} đột biến)` : ''}`}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                            count > 0
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100/60 dark:bg-[#252831] border border-transparent text-slate-300 dark:text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <CropImage name={cropName} className="w-4 h-4 object-contain" />
                          <span>{formatNumber(count)}</span>
                          {mutantCount > 0 && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-purple-500 ring-2 ring-purple-300 dark:ring-purple-900"
                              title={`${mutantCount} quả có đột biến`}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Empty cell aligning with Edit button */}
                  <td className="py-4 px-2 text-center"></td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenAccountInfo(acc)}
                        title="Xem & Chỉnh sửa thông tin tài khoản"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 dark:bg-[#262831] dark:hover:bg-sky-500/20 text-slate-500 hover:text-sky-600 dark:text-[#8e95a5] dark:hover:text-cyan-400 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenChest(acc)}
                        title="Mở rương đồ nông sản"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-[#262831] dark:hover:bg-amber-500/20 text-slate-500 hover:text-amber-600 dark:text-[#8e95a5] dark:hover:text-amber-400 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa tài khoản "${acc.username}"?`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        title="Xóa tài khoản"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-[#262831] dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-[#8e95a5] dark:hover:text-rose-400 transition-colors"
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
