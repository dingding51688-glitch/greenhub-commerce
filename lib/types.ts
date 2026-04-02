export type WalletBalanceResponse = {
  success: boolean;
  balance: number;
  lifetimeTopUp: number;
  bonusAwarded: number;
};

export type WalletTransaction = {
  id: number;
  documentId?: string;
  type: string;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  reviewStatus?: string;
  createdAt?: string;
  balanceBefore?: number;
  balanceAfter?: number;
};

export type WalletTransactionsResponse = {
  success: boolean;
  data: WalletTransaction[];
};

export type NotificationRecord = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
};

export type NotificationsResponse = {
  success: boolean;
  data: NotificationRecord[];
};

export type UnreadCountResponse = {
  success: boolean;
  unreadCount: number;
};

export type OrderItem = {
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
  weight?: string | null;
  lineTotal: number;
};

export type OrderRecord = {
  id: number;
  documentId?: string;
  reference: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt?: string;
  items?: OrderItem[];
};

export type OrdersResponse = {
  success: boolean;
  data: OrderRecord[];
};

export type CheckoutResponse = {
  success: boolean;
  order: {
    id: number;
    reference: string;
    status: string;
    totalAmount: number;
  };
};
