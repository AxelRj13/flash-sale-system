import { FlashSale, FlashSaleStatus, Purchase, PurchaseRequest, PurchaseResponse } from '../models/types';
import { RedisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';

export class FlashSaleService {
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  async createFlashSale(flashSale: Omit<FlashSale, 'id' | 'status' | 'remainingStock'>): Promise<FlashSale> {
    const id = uuidv4();
    const now = new Date();
    let status: FlashSale['status'];
    console.log(`create start ${flashSale.startTime}`);
    console.log(`create end ${flashSale.endTime}`);
    if (now < flashSale.startTime) {
      status = 'upcoming';
    } else if (now >= flashSale.startTime && now <= flashSale.endTime) {
      status = 'active';
    } else {
      status = 'ended';
    }

    console.log(status);

    const newFlashSale: FlashSale = {
      ...flashSale,
      id,
      status,
      remainingStock: flashSale.totalStock
    };

    // Store flash sale data in Redis
    await this.redisService.set(
      `flashsale:${id}`,
      JSON.stringify(newFlashSale)
    );

    // Initialize stock counter for atomic operations
    await this.redisService.set(`stock:${id}`, flashSale.totalStock.toString());

    // Add flash sale ID to the index list
    await this.addFlashSaleToIndex(id);

    return newFlashSale;
  }

  async getFlashSaleById(id: string): Promise<FlashSale | null> {
    const data = await this.redisService.get(`flashsale:${id}`);
    if (!data) return null;
    
    const flashSale: FlashSale = JSON.parse(data);
    
    // Update remaining stock from Redis stock counter
    const stockData = await this.redisService.get(`stock:${id}`);
    if (stockData) {
      flashSale.remainingStock = parseInt(stockData);
    }

    // Update status based on current time
    flashSale.status = this.calculateStatus(flashSale);
    
    return flashSale;
  }

  async getFlashSaleStatus(id: string): Promise<FlashSaleStatus | null> {
    const flashSale = await this.getFlashSaleById(id);
    if (!flashSale) return null;

    const now = new Date();
    const status: FlashSaleStatus = {
      id: flashSale.id,
      status: flashSale.status,
      productName: flashSale.productName,
      remainingStock: flashSale.remainingStock,
      totalStock: flashSale.totalStock,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime
    };

    if (flashSale.status === 'upcoming') {
      status.timeUntilStart = Math.max(0, flashSale.startTime.getTime() - now.getTime());
    } else if (flashSale.status === 'active') {
      status.timeUntilEnd = Math.max(0, flashSale.endTime.getTime() - now.getTime());
    }

    return status;
  }

  async attemptPurchase(request: PurchaseRequest): Promise<PurchaseResponse> {
    const flashSale = await this.getFlashSaleById(request.flashSaleId);
    
    if (!flashSale) {
      return {
        success: false,
        message: 'Flash sale not found'
      };
    }

    // Check if sale is active
    if (flashSale.status !== 'active') {
      return {
        success: false,
        message: flashSale.status === 'upcoming' ? 'Sale has not started yet' : 
                 flashSale.status === 'ended' ? 'Sale has ended' : 'Sale is sold out'
      };
    }

    // Check if user has already purchased
    const userPurchaseKey = `user_purchase:${request.flashSaleId}:${request.userId}`;
    const existingPurchase = await this.redisService.get(userPurchaseKey);
    
    if (existingPurchase) {
      return {
        success: false,
        message: 'You have already purchased this item'
      };
    }

    // Attempt to decrement stock atomically
    const stockKey = `stock:${request.flashSaleId}`;
    const newStock = await this.redisService.decrementStock(stockKey);
    
    if (newStock === null) {
      return {
        success: false,
        message: 'Item is sold out'
      };
    }

    // Create purchase record
    const purchase: Purchase = {
      id: uuidv4(),
      userId: request.userId,
      flashSaleId: request.flashSaleId,
      quantity: 1,
      timestamp: new Date(),
      status: 'confirmed'
    };

    // Store purchase record and mark user as purchased
    await this.redisService.set(`purchase:${purchase.id}`, JSON.stringify(purchase));
    await this.redisService.set(userPurchaseKey, purchase.id);

    // Update flash sale remaining stock in the main record
    flashSale.remainingStock = newStock;
    await this.redisService.set(`flashsale:${request.flashSaleId}`, JSON.stringify(flashSale));

    return {
      success: true,
      message: 'Purchase successful!',
      purchaseId: purchase.id,
      remainingStock: newStock
    };
  }

  async getUserPurchaseStatus(userId: string, flashSaleId: string): Promise<Purchase | null> {
    const userPurchaseKey = `user_purchase:${flashSaleId}:${userId}`;
    const purchaseId = await this.redisService.get(userPurchaseKey);
    
    if (!purchaseId) return null;
    
    const purchaseData = await this.redisService.get(`purchase:${purchaseId}`);
    if (!purchaseData) return null;
    
    return JSON.parse(purchaseData);
  }

  async getAllFlashSales(): Promise<FlashSale[]> {
    try {
      // Get all flash sale IDs from the index set
      const flashSaleIds = await this.redisService.get('flashsale:ids');
      
      if (!flashSaleIds) {
        return [];
      }

      const ids: string[] = JSON.parse(flashSaleIds);
      const flashSales: FlashSale[] = [];

      // Fetch each flash sale by ID
      for (const id of ids) {
        const flashSale = await this.getFlashSaleById(id);
        if (flashSale) {
          flashSales.push(flashSale);
        }
      }

      // Sort by start time (newest first)
      flashSales.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      return flashSales;
    } catch (error) {
      console.error('Error fetching all flash sales:', error);
      return [];
    }
  }

  private calculateStatus(flashSale: FlashSale): FlashSale['status'] {
    const now = new Date();

    if (flashSale.remainingStock <= 0) {
      return 'sold_out';
    }
    
    if (now < flashSale.startTime) {
      return 'upcoming';
    } else if (now >= flashSale.startTime && now <= flashSale.endTime) {
      return 'active';
    } else {
      return 'ended';
    }
  }

  private async addFlashSaleToIndex(flashSaleId: string): Promise<void> {
    try {
      // Get current list of flash sale IDs
      const idsData = await this.redisService.get('flashsale:ids');
      let ids: string[] = [];
      
      if (idsData) {
        ids = JSON.parse(idsData);
      }
      
      // Add new ID if it doesn't already exist
      if (!ids.includes(flashSaleId)) {
        ids.push(flashSaleId);
        await this.redisService.set('flashsale:ids', JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error adding flash sale to index:', error);
    }
  }

  private async removeFlashSaleFromIndex(flashSaleId: string): Promise<void> {
    try {
      // Get current list of flash sale IDs
      const idsData = await this.redisService.get('flashsale:ids');
      
      if (idsData) {
        let ids: string[] = JSON.parse(idsData);
        ids = ids.filter(id => id !== flashSaleId);
        await this.redisService.set('flashsale:ids', JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error removing flash sale from index:', error);
    }
  }

  // Public method to delete a flash sale completely
  async deleteFlashSale(flashSaleId: string): Promise<boolean> {
    try {
      // Remove flash sale data
      await this.redisService.del(`flashsale:${flashSaleId}`);
      
      // Remove stock counter
      await this.redisService.del(`stock:${flashSaleId}`);
      
      // Remove from index
      await this.removeFlashSaleFromIndex(flashSaleId);
      
      // Note: This doesn't clean up purchase records for simplicity
      // In production, you might want to handle this differently
      
      return true;
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      return false;
    }
  }
}
