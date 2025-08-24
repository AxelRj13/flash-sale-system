import { FlashSaleService } from '../flashsale.service';
import { RedisService } from '../redis.service';
import { FlashSale, PurchaseRequest } from '../../models/types';

// Mock the RedisService
jest.mock('../redis.service');
jest.mock('uuid', () => ({ v4: () => 'test-uuid-123' }));

describe('FlashSaleService', () => {
  let flashSaleService: FlashSaleService;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock Redis service matching actual interface
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hgetall: jest.fn(),
      decrementStock: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getClient: jest.fn()
    } as any;

    // Create service instance with mocked Redis
    flashSaleService = new FlashSaleService(mockRedisService);
  });

  describe('createFlashSale', () => {
    it('should create a flash sale with upcoming status', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000); // 1 hour from now
      const endTime = new Date(now.getTime() + 7200000); // 2 hours from now

      const flashSaleInput = {
        productName: 'Test Product',
        totalStock: 100,
        startTime,
        endTime,
        maxPurchasePerUser: 1
      };

      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue('[]'); // Mock flashsale:ids as empty array

      const result = await flashSaleService.createFlashSale(flashSaleInput);

      expect(result).toMatchObject({
        id: 'test-uuid-123',
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 100,
        status: 'upcoming',
        startTime,
        endTime,
        maxPurchasePerUser: 1
      });

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'flashsale:test-uuid-123',
        JSON.stringify(result)
      );
      expect(mockRedisService.set).toHaveBeenCalledWith('stock:test-uuid-123', '100');
    });

    it('should create a flash sale with active status', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 1800000); // 30 minutes ago
      const endTime = new Date(now.getTime() + 1800000); // 30 minutes from now

      const flashSaleInput = {
        productName: 'Active Product',
        totalStock: 50,
        startTime,
        endTime,
        maxPurchasePerUser: 2
      };

      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue('[]');

      const result = await flashSaleService.createFlashSale(flashSaleInput);

      expect(result.status).toBe('active');
    });
  });

  describe('getFlashSaleById', () => {
    it('should return null when flash sale not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await flashSaleService.getFlashSaleById('non-existent-id');

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith('flashsale:non-existent-id');
    });

    it('should return flash sale with updated stock and status', async () => {
      const now = new Date();
      const flashSaleData = {
        id: 'test-id',
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 100,
        startTime: new Date(now.getTime() - 1800000),
        endTime: new Date(now.getTime() + 1800000),
        status: 'upcoming',
        maxPurchasePerUser: 1
      };

      mockRedisService.get
        .mockResolvedValueOnce(JSON.stringify(flashSaleData))
        .mockResolvedValueOnce('75'); // updated stock

      const result = await flashSaleService.getFlashSaleById('test-id');

      expect(result).toMatchObject({
        id: 'test-id',
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 75,
        status: 'active' // status should be updated based on current time
      });
      expect(result?.startTime).toBeInstanceOf(Date);
      expect(result?.endTime).toBeInstanceOf(Date);
    });
  });

  describe('attemptPurchase', () => {
    it('should return error when flash sale not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const request: PurchaseRequest = {
        userId: 'user1',
        flashSaleId: 'non-existent-id'
      };

      const result = await flashSaleService.attemptPurchase(request);

      expect(result).toEqual({
        success: false,
        message: 'Flash sale not found'
      });
    });

    it('should return error when user has already purchased', async () => {
      const now = new Date();
      const flashSaleData = {
        id: 'test-id',
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 99,
        startTime: new Date(now.getTime() - 1800000),
        endTime: new Date(now.getTime() + 1800000),
        status: 'active',
        maxPurchasePerUser: 1
      };

      mockRedisService.get
        .mockResolvedValueOnce(JSON.stringify(flashSaleData))
        .mockResolvedValueOnce('99')
        .mockResolvedValueOnce('existing-purchase-id'); // User already has a purchase

      const request: PurchaseRequest = {
        userId: 'user1',
        flashSaleId: 'test-id'
      };

      const result = await flashSaleService.attemptPurchase(request);

      expect(result).toEqual({
        success: false,
        message: 'You have already purchased this item'
      });
    });

    it('should successfully process purchase when conditions are met', async () => {
      const now = new Date();
      const flashSaleData = {
        id: 'test-id',
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 50,
        startTime: new Date(now.getTime() - 1800000),
        endTime: new Date(now.getTime() + 1800000),
        status: 'active',
        maxPurchasePerUser: 1
      };

      mockRedisService.get
        .mockResolvedValueOnce(JSON.stringify(flashSaleData))
        .mockResolvedValueOnce('50')
        .mockResolvedValueOnce(null); // no existing purchase

      // Mock the decrementStock operation
      mockRedisService.decrementStock.mockResolvedValue(49);

      mockRedisService.set.mockResolvedValue(undefined);

      const request: PurchaseRequest = {
        userId: 'user1',
        flashSaleId: 'test-id'
      };

      const result = await flashSaleService.attemptPurchase(request);

      expect(result).toEqual({
        success: true,
        message: 'Purchase successful!',
        purchaseId: 'test-uuid-123',
        remainingStock: 49
      });

      expect(mockRedisService.decrementStock).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'purchase:test-uuid-123',
        expect.stringContaining('"userId":"user1"')
      );
    });
  });

  describe('getAllFlashSales', () => {
    it('should return empty array when no flash sales exist', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await flashSaleService.getAllFlashSales();

      expect(result).toEqual([]);
    });

    it('should return all flash sales with updated data', async () => {
      const flashSaleIds = ['id1', 'id2'];
      const flashSale1 = {
        id: 'id1',
        productName: 'Product 1',
        totalStock: 100,
        remainingStock: 90,
        startTime: new Date(),
        endTime: new Date(),
        status: 'active',
        maxPurchasePerUser: 1
      };

      mockRedisService.get
        .mockResolvedValueOnce(JSON.stringify(flashSaleIds)) // flashsale:ids
        .mockResolvedValueOnce(JSON.stringify(flashSale1))
        .mockResolvedValueOnce('90'); // stock for id1

      const result = await flashSaleService.getAllFlashSales();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'id1',
        productName: 'Product 1'
      });
    });
  });

  describe('deleteFlashSale', () => {
    it('should successfully delete a flash sale and related data', async () => {
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.get.mockResolvedValue('["test-id"]');
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await flashSaleService.deleteFlashSale('test-id');

      expect(result).toBe(true);
      expect(mockRedisService.del).toHaveBeenCalledWith('flashsale:test-id');
      expect(mockRedisService.del).toHaveBeenCalledWith('stock:test-id');
    });
  });
});
