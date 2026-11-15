import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles, Package } from 'lucide-react';
import { Account, HarvestedFruit } from '../types';
import { CropImage } from './CropImage';
import { PLAY_TOGETHER_VARIANTS, getVariantStyle } from '../data/initialData';

interface FruitInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  fruitName: string;
  variantFilter: string; // 'all' | 'normal' | variantName
  accounts: Account[];
  onOpenChest: (account: Account) => void;
}

interface MatchItem {
  account: Account;
  fruit: HarvestedFruit;
}

export const FruitInspectModal: React.FC<FruitInspectModalProps> = ({
  isOpen,
  onClose,
  fruitName,
  variantFilter,
  accounts,
  onOpenChest,
}) => {
  if (!isOpen) return null;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRoleId = (roleId: string) => {
    navigator.clipboard.writeText(roleId);
    setCopiedId(roleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Lọc tất cả các quả khớp trên toàn bộ các tài khoản
  const matches: MatchItem[] = [];
  for (const acc of accounts) {
    for (const fruit of acc.fruits || []) {
      if (fruitName !== 'all' && fruit.fruitName.toLowerCase() !== fruitName.toLowerCase()) {
        continue;
      }

      let isMatch = false;
      if (variantFilter === 'all') {
        isMatch = true;
      } else if (variantFilter === 'normal') {
        isMatch = !fruit.variants || fruit.variants.length === 0;
      } else {
        isMatch = (fruit.variants || []).some(
          (v) => v.toLowerCase() === variantFilter.toLowerCase()
        );
      }

      if (isMatch) {
        matches.push({ account: acc, fruit });
      }
    }
  }

  // Sắp xếp ưu tiên: trái ít biến thể nhất đứng trước, nhiều biến thể đứng sau
  matches.sort((a, b) => (a.fruit.variants?.length || 0) - (b.fruit.variants?.length || 0));

  // Gom nhóm theo tài khoản
  const accountGroupMap = new Map<string, { account: Account; fruits: HarvestedFruit[] }>();
  for (const m of matches) {
    const existing = accountGroupMap.get(m.account.id);
    if (existing) {
      existing.fruits.push(m.fruit);
    } else {
      accountGroupMap.set(m.account.id, {
        account: m.account,
        fruits: [m.fruit],
      });
    }
  }
  const groupedList = Array.from(accountGroupMap.values());

  const variantObj =
    variantFilter !== 'all' && variantFilter !== 'normal'
      ? PLAY_TOGETHER_VARIANTS.find((v) => v.name.toLowerCase() === variantFilter.toLowerCase())
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md p-1.5 shrink-0">
              {fruitName !== 'all' ? (
                <CropImage name={fruitName} className="w-full h-full object-contain drop-shadow" />
              ) : (
                <span className="text-2xl">🌾</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                  {fruitName !== 'all' ? fruitName : 'Tất Cả Nông Sản'}
                </h3>
                {variantFilter === 'all' && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Mọi biến thể
                  </span>
                )}
                {variantFilter === 'normal' && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    ⚪ Trái thường
                  </span>
                )}
                {variantObj && (
                  <span
                    className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      color: variantObj.color,
                      backgroundColor: variantObj.bgColor,
                      borderColor: variantObj.borderColor,
                    }}
                  >
                    ✨ {variantObj.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5] font-medium mt-0.5">
                Tìm thấy tổng cộng{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                  {matches.length} quả
                </strong>{' '}
                khớp trên{' '}
                <strong className="text-sky-600 dark:text-sky-400 font-black">
                  {groupedList.length} tài khoản
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list grouped by Account */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {groupedList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">Không tìm thấy quả nào khớp trong toàn bộ rương!</p>
              <p className="text-xs mt-1 text-slate-500">
                Hãy thử chọn loại nông sản hoặc biến thể khác.
              </p>
            </div>
          ) : (
            groupedList.map(({ account, fruits }) => (
              <div
                key={account.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#22242B] border border-[#E8E2D5] dark:border-[#2C303A] shadow-xs space-y-3"
              >
                {/* Account Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2D313C] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                      {(account.characterName || 'N').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800 dark:text-white">
                          {account.characterName || 'Chưa đặt tên'}
                        </span>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {fruits.length} quả
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          onClick={() => handleCopyRoleId(account.roleId)}
                          className="font-mono text-[11px] text-sky-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                          title="Bấm để sao chép Role ID"
                        >
                          <span>ID: {account.roleId || 'No ID'}</span>
                          {copiedId === account.roleId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-sky-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenChest(account);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Mở rương</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Fruits List in this Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fruits.map((f, idx) => {
                    const isNormal = !f.variants || f.variants.length === 0;

                    return (
                      <div
                        key={f.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A1C22] border border-slate-200/60 dark:border-[#2E323D] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CropImage name={f.fruitName} className="w-6 h-6 object-contain shrink-0" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 block truncate">
                              {f.fruitName}
                            </span>
                            {f.weight && (
                              <span className="text-[10px] text-slate-400 block">
                                {f.weight}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[130px]">
                          {isNormal ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Trái thường
                            </span>
                          ) : (
                            f.variants.map((vName) => {
                              const style = getVariantStyle(vName);
                              return (
                                <span
                                  key={vName}
                                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border"
                                  style={
                                    style
                                      ? {
                                          color: style.color,
                                          backgroundColor: style.bgColor,
                                          borderColor: style.borderColor,
                                        }
                                      : {
                                          color: '#a855f7',
                                          backgroundColor: '#3b0764',
                                          borderColor: '#9333ea',
                                        }
                                  }
                                >
                                  {vName}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            💡 Bấm <strong>"Mở rương"</strong> trên từng tài khoản để quản lý hoặc điều chuyển nông sản.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#282B34] text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-[#343844] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
