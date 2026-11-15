export type AccountStatus = 'active' | 'banned' | 'wrong_pw' | 'pending';

// Từng củ/trái riêng lẻ đã thu hoạch (như Ảnh 1 trong game)
export interface HarvestedFruit {
  id: string;
  fruitName: string;
  variants: string[]; // 0 đến tối đa 5 biến thể, mảng rỗng [] là Trái thường
  weight?: string | number; // Ví dụ '2,42kg' hoặc số (tùy chọn)
  createdAt: string;
}

export interface Account {
  id: string;
  username: string;
  password?: string;
  characterName: string;
  roleId: string;
  status: AccountStatus;
  note: string;
  stars: number;             // ⭐ Level
  gems: number;              // 💎 Kim Cương
  tickets: number;           // 🎫 Vé
  cash?: number;             // 💵 Tiền sao
  gold?: number;             // 🪙 Vàng
  fruits: HarvestedFruit[];  // Danh sách từng trái đã thu hoạch trong rương
  updatedAt: string;
}

// Món hàng trong đơn
export interface OrderItem {
  id: string;
  fruitName: string;
  requiredVariant?: string; // Tên biến thể yêu cầu (vd: 'Ánh trăng'), nếu undefined = Trái thường
  matchAnyVariant?: boolean; // true = nhận bất kỳ biến thể nào
  requiredQuantity: number;  // Số lượng cần (mẫu số của phân số: vd 3 trong 1/3)
  weight?: string;          // Ví dụ: '0,1kg' (tùy chọn)
}

// Đơn hàng nông sản (như Ảnh 2)
export interface FarmOrder {
  id: string;
  title: string;
  description: string;
  npcName?: string;         // Ví dụ 'Speedo'
  nextRefreshTime?: string; // Ví dụ '1 giờ 34 phút'
  items: OrderItem[];
  createdAt: string;
}

// Cấu trúc kết quả AI phát hiện được từ ảnh
export interface DetectedFruitItem {
  fruitName: string;
  variants: string[];
  quantity: number;
}

export type StatusFilter = 'all' | AccountStatus;
