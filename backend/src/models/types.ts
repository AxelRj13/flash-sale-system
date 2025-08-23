export interface FlashSale {
  id: string;
  productName: string;
  totalStock: number;
  remainingStock: number;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  maxPurchasePerUser: number;
}

export interface Purchase {
  id: string;
  userId: string;
  flashSaleId: string;
  quantity: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface User {
  id: string;
  username: string;
  purchases: string[]; // Purchase IDs
}

export interface FlashSaleStatus {
  id: string;
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  productName: string;
  remainingStock: number;
  totalStock: number;
  startTime: Date;
  endTime: Date;
  timeUntilStart?: number;
  timeUntilEnd?: number;
}

export interface PurchaseRequest {
  userId: string;
  flashSaleId: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  purchaseId?: string;
  remainingStock?: number;
}
