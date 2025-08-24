import { Router } from 'express';
import { FlashSaleController } from '../controllers/flashsale.controller';
import { FlashSaleService } from '../services/flashsale.service';
import { RedisService } from '../services/redis.service';
import rateLimit from 'express-rate-limit';

// Create rate limiter for purchase attempts
const purchaseRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 10 requests per windowMs
  message: 'Too many purchase attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create services and controller
const redisService = new RedisService();
const flashSaleService = new FlashSaleService(redisService);
const flashSaleController = new FlashSaleController(flashSaleService);

const router = Router();

// Routes
router.get('/status/:id', flashSaleController.getFlashSaleStatus);
router.post('/purchase', purchaseRateLimit, flashSaleController.attemptPurchase);
router.get('/user/:userId/purchase/:flashSaleId', flashSaleController.getUserPurchaseStatus);
router.get('/all', flashSaleController.getAllFlashSales);
router.post('/delete', flashSaleController.deleteFlashSale);
router.post('/deleteExpiredFlashSale', flashSaleController.deleteExpiredFlashSale);
router.get('/getLatestActiveFlashSale', flashSaleController.getLatestActiveFlashSale);

export { router as flashSaleRoutes, redisService };
