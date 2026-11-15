export type AccountStatus = 'active' | 'banned' | 'wrong_pw' | 'pending';

export interface FruitStock {
  id: string;
  fruitName: string;
  fruitIcon: string;
  variants: string[]; // Tối đa 5 biến thể, mảng rỗng [] nghĩa là Trái thường (không đột biến)
  quantity: number;
}

export interface Account {
  id: string;
  username: string;
  password?: string;
  characterName: string;
  roleId: string;
  status: AccountStatus;
  note: string;
  stars: number;        // ⭐ Cấp sao / Level
  gems: number;         // 💎 Đá Quý / Kim Cương
  tickets: number;      // 🎫 Vé và Phiếu
  fruits: FruitStock[]; // 📦 Kho rương nông sản (chứa các loại quả và biến thể)
  updatedAt: string;
}

export interface FarmOrderItem {
  id: string;
  fruitName: string;
  requiredVariants: string[]; // Các biến thể yêu cầu (nếu rỗng = chỉ cần đúng loại quả)
  matchExactVariants: boolean; // true = phải có đúng/đủ biến thể này; false = chỉ cần đúng loại quả bất kể biến thể
  requiredQuantity: number;
}

export interface OrderAllocation {
  accountId: string;
  username: string;
  fruitStockId: string;
  fruitName: string;
  variants: string[];
  availableQuantity: number;
  takeQuantity: number;
}

export type StatusFilter = 'all' | AccountStatus;
