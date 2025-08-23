export interface FlashSaleStatus {
  id: string;
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  productName: string;
  remainingStock: number;
  totalStock: number;
  startTime: string;
  endTime: string;
  timeUntilStart?: number;
  timeUntilEnd?: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  purchaseId?: string;
  remainingStock?: number;
}

export interface UserPurchaseStatus {
  hasPurchased: boolean;
  purchase?: {
    id: string;
    userId: string;
    flashSaleId: string;
    quantity: number;
    timestamp: string;
    status: string;
  };
}
