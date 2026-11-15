import { Account } from '../types';

export interface GameCrop {
  name: string;
  icon: string;
}

export interface GameVariant {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// 41 loại cây/nông sản chuẩn game Play Together từ ảnh chụp màn hình
export const PLAY_TOGETHER_CROPS: GameCrop[] = [
  { name: 'Sầu riêng', icon: '🍈' },
  { name: 'Hạt dẻ', icon: '🌰' },
  { name: 'Dừa', icon: '🥥' },
  { name: 'Đu đủ', icon: '🍈' },
  { name: 'Trái sung', icon: '🫐' },
  { name: 'Cây phong', icon: '🍁' },
  { name: 'Anh đào', icon: '🍒' },
  { name: 'Quả lê gai', icon: '🍐' },
  { name: 'Táo', icon: '🍎' },
  { name: 'Nhân sâm', icon: '🥕' },
  { name: 'Dâu tây', icon: '🍓' },
  { name: 'Hoa xương rồng Cholla', icon: '🌼' },
  { name: 'Khoai lang', icon: '🍠' },
  { name: 'Lúa', icon: '🌾' },
  { name: 'Cà chua', icon: '🍅' },
  { name: 'Xương rồng Saguaro', icon: '🌵' },
  { name: 'Mãng cầu', icon: '🍈' },
  { name: 'Khoai tây', icon: '🥔' },
  { name: 'Cà rốt', icon: '🥕' },
  { name: 'Bí ngô', icon: '🎃' },
  { name: 'Nấm', icon: '🍄' },
  { name: 'Rau chân vịt', icon: '🥬' },
  { name: 'Xương rồng gai vàng', icon: '🌵' },
  { name: 'Cúc vạn thọ (cam)', icon: '🏵️' },
  { name: 'Củ cải', icon: '🥬' },
  { name: 'Chanh', icon: '🍋' },
  { name: 'Dưa hấu', icon: '🍉' },
  { name: 'Việt quất', icon: '🫐' },
  { name: 'Khế', icon: '⭐' },
  { name: 'Phượng tím', icon: '🌸' },
  { name: 'Cây bao báp', icon: '🌳' },
  { name: 'Rau xà lách', icon: '🥬' },
  { name: 'Nho', icon: '🍇' },
  { name: 'Cây đậu', icon: '🫛' },
  { name: 'Xoài', icon: '🥭' },
  { name: 'Bắp', icon: '🌽' },
  { name: 'Táo đường', icon: '🍏' },
  { name: 'Trái hồng', icon: '🍅' },
  { name: 'Cây bóng tối', icon: '🌑' },
  { name: 'Cây tùng', icon: '🌲' },
  { name: 'Bí ngô Halloween', icon: '🎃' },
];

// 19 biến thể chuẩn game Play Together từ ảnh chụp màn hình
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

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    username: 'tunafishbonmg88',
    password: 'password123',
    characterName: 'Tunafish_01',
    roleId: 'KAIA3SM48R',
    status: 'active',
    note: 'Acc chính farm trái cây và làm nhiệm vụ',
    stars: 7,
    gems: 339,
    tickets: 12,
    fruits: [
      {
        id: 'fs-1',
        fruitName: 'Dưa hấu',
        fruitIcon: '🍉',
        variants: ['Cực quang', 'Ánh vàng'],
        quantity: 5,
      },
      {
        id: 'fs-2',
        fruitName: 'Dưa hấu',
        fruitIcon: '🍉',
        variants: [], // Trái thường
        quantity: 12,
      },
      {
        id: 'fs-3',
        fruitName: 'Cà chua',
        fruitIcon: '🍅',
        variants: ['Khí lạnh'],
        quantity: 8,
      },
      {
        id: 'fs-4',
        fruitName: 'Cà rốt',
        fruitIcon: '🥕',
        variants: [],
        quantity: 20,
      },
      {
        id: 'fs-5',
        fruitName: 'Sầu riêng',
        fruitIcon: '🍈',
        variants: ['Cầu vồng', 'Nhiễm điện', 'Ánh trăng'],
        quantity: 2,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    username: 'tunafishboyby94',
    password: 'password456',
    characterName: 'Tunafish_Boy',
    roleId: 'KAIA3SM4BK',
    status: 'active',
    note: 'Acc clone tích trữ nông sản và làm đơn',
    stars: 7,
    gems: 451,
    tickets: 5,
    fruits: [
      {
        id: 'fs-6',
        fruitName: 'Dưa hấu',
        fruitIcon: '🍉',
        variants: ['Cực quang', 'Ánh vàng'],
        quantity: 3,
      },
      {
        id: 'fs-7',
        fruitName: 'Cà chua',
        fruitIcon: '🍅',
        variants: ['Khí lạnh'],
        quantity: 15,
      },
      {
        id: 'fs-8',
        fruitName: 'Bắp',
        fruitIcon: '🌽',
        variants: ['Băng'],
        quantity: 10,
      },
      {
        id: 'fs-9',
        fruitName: 'Cà rốt',
        fruitIcon: '🥕',
        variants: [],
        quantity: 25,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];
