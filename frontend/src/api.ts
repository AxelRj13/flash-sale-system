import axios from 'axios';
import { FlashSaleStatus, PurchaseResponse, UserPurchaseStatus } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const flashSaleApi = {
  getFlashSaleStatus: async (flashSaleId: string): Promise<FlashSaleStatus> => {
    const response = await axios.get(`${API_BASE_URL}/flashsale/status/${flashSaleId}`);
    return response.data;
  },

  attemptPurchase: async (userId: string, flashSaleId: string): Promise<PurchaseResponse> => {
    const response = await axios.post(`${API_BASE_URL}/flashsale/purchase`, {
      userId,
      flashSaleId
    });
    return response.data;
  },

  getUserPurchaseStatus: async (userId: string, flashSaleId: string): Promise<UserPurchaseStatus> => {
    const response = await axios.get(`${API_BASE_URL}/flashsale/user/${userId}/purchase/${flashSaleId}`);
    return response.data;
  }
};
