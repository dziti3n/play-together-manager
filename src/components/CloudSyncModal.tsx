import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CloudCheck,
  Check,
  Key,
  Copy,
  ExternalLink,
  Users,
  Database,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  LogOut,
  Share2,
} from 'lucide-react';
import {
  SupabaseConfig,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCRIPT,
} from '../utils/supabaseSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: (config: SupabaseConfig | null) => void;
  isConnected: boolean;
  currentRoomId?: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  isConnected,
  currentRoomId,
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [roomId, setRoomId] = useState('team_nongdan');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInviteLink = () => {
    const base = window.location.origin + window.location.pathname;
    const geminiKey = localStorage.getItem('gemini_api_key') || '';
    const inviteLink = `${base}?s_url=${encodeURIComponent(url.trim())}&s_key=${encodeURIComponent(anonKey.trim())}&s_room=${encodeURIComponent(roomId.trim() || 'team_nongdan')}${
      geminiKey.trim() ? `&s_gemini=${encodeURIComponent(geminiKey.trim())}` : ''
    }`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  useEffect(() => {
    const saved = getSavedSupabaseConfig();
    if (saved) {
      setUrl(saved.url);
      setAnonKey(saved.anonKey);
      setRoomId(saved.roomId);
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập đầy đủ Supabase Project URL và Anon Public Key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection({
      url: url.trim(),
      anonKey: anonKey.trim(),
      roomId: roomId.trim() || 'team_nongdan',
    });

    setIsTesting(false);
    setTestResult(res);
  };

  const handleSaveAndConnect = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert('Vui lòng nhập Supabase Project URL và Anon Key!');
      return;
    }

    const cleanRoomId = roomId.trim() || 'team_nongdan';
    const config: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      roomId: cleanRoomId,
    };

    saveSupabaseConfig(config);
    onConfigChanged(config);
    alert(`✅ Đã kết nối Cloud Realtime thành công với Mã Nhóm: "${cleanRoomId}"!\nBạn bè của bạn chỉ cần nhập cùng URL, Key và Mã Nhóm này là tự động đồng bộ.`);
    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Bạn có chắc muốn ngắt kết nối Cloud? Dữ liệu sẽ trở về chế độ lưu trữ riêng trong trình duyệt (Offline).')) {
      clearSupabaseConfig();
      onConfigChanged(null);
      setTestResult(null);
      alert('Đã ngắt kết nối Cloud.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1E24] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#E8E2D5] dark:border-[#2E333D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D5] dark:border-[#2B2F3A] bg-[#F4EFE6] dark:bg-[#16171B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${
              isConnected ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-sky-600 shadow-sky-600/30'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Đồng Bộ Cloud Realtime Cho Nhóm Bạn Bè
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}>
                  {isConnected ? `🟢 Đang Online (${currentRoomId})` : '⚪ Ngoại tuyến (Offline)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8e95a5]">
                Người A quét rương ở nhà ➜ Người B ở xa thấy số nhảy ngay trên điện thoại (Miễn phí 100%)
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* BANNER LINK MỜI NHANH CHO VỢ/CHỒNG TRÊN IPHONE */}
          {isConnected && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <strong className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Link Mời Tham Gia Phòng (Dành Cho iPhone Ở Xa)
                  </strong>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  1 Chạm Vào Phòng Ngay
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Bạn chỉ cần sao chép link bên dưới rồi gửi qua Zalo / Messenger. Người bên kia mở trên iPhone chỉ cần bấm link là <strong>tự động kết nối vào phòng "{roomId}"</strong> mà không cần gõ URL hay Key!
              </p>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã chép link mời! Hãy gửi qua Zalo cho vợ/chồng</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>🔗 Sao chép link mời phòng "{roomId}"</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Thông tin phòng chung (Room Code) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>1. Đặt Mã Nhóm / Phòng Chung (Room ID):</span>
            </label>
            <div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="VD: team_nongdan_2026, hoi_cay_tien..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-extrabold text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                💡 Bạn và bạn bè của bạn chỉ cần nhập cùng <strong>Mã Nhóm</strong> này là sẽ dùng chung 1 kho tài khoản &amp; rương nông sản.
              </p>
            </div>
          </div>

          {/* Cấu hình Supabase (URL + Anon Key) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#22252C] border border-[#E8E2D5] dark:border-[#323640] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-sky-500" />
                <span>2. Khóa Kết Nối Supabase (Miễn Phí 100%):</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-sky-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Ẩn hướng dẫn' : 'Chưa có? Bấm xem cách tạo (2 phút)'}</span>
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-2.5">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Project URL:
                </span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-mono text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Anon Public Key:
                </span>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#17181C] text-xs font-mono text-slate-800 dark:text-white border border-[#E8E2D5] dark:border-[#323640] focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Nút Kiểm Tra Kết Nối */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1A1C22] hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kiểm tra kết nối</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                  }`}
                >
                  {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* HƯỚNG DẪN TẠO SUPABASE MIỄN PHÍ TRONG 2 PHÚT */}
          {showGuide && (
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-black text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Cách Tạo Supabase Miễn Phí 100% (Không Cần Thẻ Ngân Hàng):</span>
              </h4>

              <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Vào trang{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-0.5"
                  >
                    <span>supabase.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ➜ Bấm <strong>"Start your project"</strong> (Đăng nhập bằng Google hoặc GitHub).
                </li>
                <li>
                  Bấm <strong>"New project"</strong> ➜ Đặt tên dự án (VD: <code>PlayTogetherFarm</code>) và mật khẩu bất kỳ ➜ Bấm <strong>Create new project</strong> (chờ 1 phút để hoàn tất).
                </li>
                <li>
                  Nhìn sang menu bên trái, bấm vào <strong>SQL Editor</strong> (biểu tượng <code>&gt;_</code>) ➜ Bấm <strong>New query</strong> ➜ Dán đoạn mã SQL bên dưới vào và bấm nút <strong>Run</strong>:
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] relative">
                    <pre className="overflow-x-auto max-h-32 text-[10px]">{SUPABASE_SQL_SCRIPT}</pre>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-sans text-[10px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSql ? 'Đã chép' : 'Sao chép mã SQL'}</span>
                    </button>
                  </div>
                </li>
                <li>
                  Vào <strong>Project Settings</strong> (biểu tượng bánh răng góc dưới trái) ➜ Chọn mục <strong>API</strong> ➜ Sao chép <strong>Project URL</strong> và <strong>anon public key</strong> dán vào 2 ô ở trên.
                </li>
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D5] dark:border-[#2B2F3A] flex-wrap gap-2">
            <div>
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ngắt kết nối Cloud</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveAndConnect}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Cloud className="w-4 h-4" />
                <span>Lưu &amp; Bắt Đầu Đồng Bộ Nhóm</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
