import { Request, Response } from 'express';
import { FlashSaleService } from '../services/flashsale.service';
import { PurchaseRequest } from '../models/types';

export class FlashSaleController {
  private flashSaleService: FlashSaleService;

  constructor(flashSaleService: FlashSaleService) {
    this.flashSaleService = flashSaleService;
  }

  getFlashSaleStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Flash sale ID is required' });
        return;
      }

      const status = await this.flashSaleService.getFlashSaleStatus(id);
      
      if (!status) {
        res.status(404).json({ error: 'Flash sale not found' });
        return;
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting flash sale status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  attemptPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, flashSaleId }: PurchaseRequest = req.body;
      
      if (!userId || !flashSaleId) {
        res.status(400).json({ error: 'userId and flashSaleId are required' });
        return;
      }

      const result = await this.flashSaleService.attemptPurchase({ userId, flashSaleId });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error attempting purchase:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getUserPurchaseStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, flashSaleId } = req.params;
      
      if (!userId || !flashSaleId) {
        res.status(400).json({ error: 'userId and flashSaleId are required' });
        return;
      }

      const purchase = await this.flashSaleService.getUserPurchaseStatus(userId, flashSaleId);
      
      if (!purchase) {
        res.json({ hasPurchased: false });
        return;
      }

      res.json({ 
        hasPurchased: true, 
        purchase 
      });
    } catch (error) {
      console.error('Error getting user purchase status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAllFlashSales = async (req: Request, res: Response): Promise<void> => {
    try {
      const flashSales = await this.flashSaleService.getAllFlashSales();
      res.json(flashSales);
    } catch (error) {
      console.error('Error getting all flash sales:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
