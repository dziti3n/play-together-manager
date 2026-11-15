import { Account, FarmOrder } from '../types';
import {
  CROP_ASSETS,
  getCropImageByName,
  getCropPngByName,
  getCropEmojiByName,
  CropAssetItem,
} from './cropAssets';

export interface GameCrop {
  id?: number;
  slug?: string;
  name: string;
  icon: string;
  iconSvg?: string;
  iconPng?: string;
  emoji?: string;
}

export interface GameVariant {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// 41 loại cây/nông sản chuẩn game Play Together được nạp trực tiếp từ bộ ảnh Vector HD trích xuất
export const PLAY_TOGETHER_CROPS: GameCrop[] = Object.values(CROP_ASSETS).map((item) => ({
  id: item.id,
  slug: item.slug,
  name: item.name,
  icon: item.icon,
  iconSvg: item.iconSvg,
  iconPng: item.iconPng,
  emoji: item.emoji,
}));

export function getCropIcon(name: string): string {
  const img = getCropImageByName(name);
  return img || '';
}

export function getCropPng(name: string): string {
  return getCropPngByName(name) || '';
}

export function getCropEmoji(name: string): string {
  return getCropEmojiByName(name) || '🍎';
}

// 19 biến thể chuẩn game Play Together từ ảnh chụp màn hình với màu sắc đặc trưng
export const PLAY_TOGETHER_VARIANTS: GameVariant[] = [
  { name: 'Ánh vàng', color: '#fbbf24', bgColor: '#453205', borderColor: '#d97706' },
  { name: 'Cầu vồng', color: '#f87171', bgColor: '#451212', borderColor: '#dc2626' },
  { name: 'Ẩm ướt', color: '#38bdf8', bgColor: '#083344', borderColor: '#0284c7' },
  { name: 'Nhiễm điện', color: '#facc15', bgColor: '#422006', borderColor: '#ca8a04' },
  { name: 'Gió', color: '#2dd4bf', bgColor: '#042f2e', borderColor: '#0d9488' },
  { name: 'Cát', color: '#fb923c', bgColor: '#431407', borderColor: '#ea580c' },
  { name: 'Ánh trăng', color: '#c084fc', bgColor: '#3b0764', borderColor: '#9333ea' },
  { name: 'Cực quang', color: '#f472b6', bgColor: '#500724', borderColor: '#db2777' },
  { name: 'Sương', color: '#a3e635', bgColor: '#1a2e05', borderColor: '#65a30d' },
  { name: 'Khô', color: '#f59e0b', bgColor: '#3b1f06', borderColor: '#d97706' },
  { name: 'Tê điện', color: '#4ade80', bgColor: '#052e16', borderColor: '#16a34a' },
  { name: 'Khí lạnh', color: '#67e8f9', bgColor: '#083344', borderColor: '#06b6d4' },
  { name: 'Băng', color: '#60a5fa', bgColor: '#172554', borderColor: '#2563eb' },
  { name: 'Nguyền rủa', color: '#a78bfa', bgColor: '#2e1065', borderColor: '#7c3aed' },
  { name: 'Đèn trời', color: '#fb923c', bgColor: '#431407', borderColor: '#f97316' },
  { name: 'Ảo ảnh', color: '#f472b6', bgColor: '#4c0519', borderColor: '#e11d48' },
  { name: 'Pháo hoa', color: '#fb7185', bgColor: '#4c0519', borderColor: '#f43f5e' },
  { name: 'Bướm', color: '#e879f9', bgColor: '#3b0764', borderColor: '#c026d3' },
  { name: 'Giai điệu', color: '#5eead4', bgColor: '#042f2e', borderColor: '#14b8a6' },
];

export function getVariantStyle(name: string): GameVariant | undefined {
  return PLAY_TOGETHER_VARIANTS.find((v) => v.name.toLowerCase() === name.toLowerCase());
}

// Dữ liệu tài khoản mặc định (Rỗng để người dùng tự nhập dữ liệu thật)
export const INITIAL_ACCOUNTS: Account[] = [];

// Dữ liệu đơn hàng mặc định (Rỗng để người dùng tự tạo hoặc quét đơn thật)
export const INITIAL_ORDERS: FarmOrder[] = [];
