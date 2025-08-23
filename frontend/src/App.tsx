import React, { useState, useEffect } from 'react';
import { flashSaleApi } from './api';
import { FlashSaleStatus, UserPurchaseStatus } from './types';
import './App.css';

// Sample flash sale ID - in a real app this would come from a list or URL parameter
const FLASH_SALE_ID = 'b666cfd3-39af-4598-9132-64d676a0f79e';

function App() {
  const [flashSaleStatus, setFlashSaleStatus] = useState<FlashSaleStatus | null>(null);
  const [userPurchaseStatus, setUserPurchaseStatus] = useState<UserPurchaseStatus | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch flash sale status
  const fetchFlashSaleStatus = async () => {
    try {
      const status = await flashSaleApi.getFlashSaleStatus(FLASH_SALE_ID);
      setFlashSaleStatus(status);
    } catch (error) {
      console.error('Error fetching flash sale status:', error);
      setError('Failed to load flash sale information');
    }
  };

  // Fetch user purchase status
  const fetchUserPurchaseStatus = async () => {
    if (!userId) return;
    
    try {
      const status = await flashSaleApi.getUserPurchaseStatus(userId, FLASH_SALE_ID);
      setUserPurchaseStatus(status);
    } catch (error) {
      console.error('Error fetching user purchase status:', error);
    }
  };

  // Handle purchase attempt
  const handlePurchase = async () => {
    if (!userId.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await flashSaleApi.attemptPurchase(userId, FLASH_SALE_ID);
      
      if (result.success) {
        setMessage(result.message);
        // Refresh both statuses
        await Promise.all([fetchFlashSaleStatus(), fetchUserPurchaseStatus()]);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Purchase failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return '#ffa500';
      case 'active': return '#4caf50';
      case 'ended': return '#757575';
      case 'sold_out': return '#f44336';
      default: return '#757575';
    }
  };

  useEffect(() => {
    fetchFlashSaleStatus();
    const interval = setInterval(fetchFlashSaleStatus, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserPurchaseStatus();
  }, [userId]);

  if (!flashSaleStatus) {
    return (
      <div className="app">
        <div className="container">
          <h1>Flash Sale System</h1>
          <div className="loading">Loading flash sale information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <h1>⚡ Flash Sale System</h1>
        
        <div className="flash-sale-card">
          <div className="product-info">
            <h2>{flashSaleStatus.productName}</h2>
            <div className="stock-info">
              <span className="stock-remaining">{flashSaleStatus.remainingStock}</span>
              <span className="stock-total">/{flashSaleStatus.totalStock} remaining</span>
            </div>
          </div>

          <div className="status-section">
            <div 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(flashSaleStatus.status) }}
            >
              {flashSaleStatus.status.toUpperCase().replace('_', ' ')}
            </div>

            {flashSaleStatus.status === 'upcoming' && flashSaleStatus.timeUntilStart && (
              <div className="countdown">
                Starts in: {formatTimeRemaining(flashSaleStatus.timeUntilStart)}
              </div>
            )}

            {flashSaleStatus.status === 'active' && flashSaleStatus.timeUntilEnd && (
              <div className="countdown active">
                Ends in: {formatTimeRemaining(flashSaleStatus.timeUntilEnd)}
              </div>
            )}
          </div>

          <div className="user-section">
            <div className="input-group">
              <label htmlFor="userId">Username:</label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            {userPurchaseStatus?.hasPurchased ? (
              <div className="purchase-status success">
                ✅ You have already purchased this item!
                <div className="purchase-details">
                  Purchase ID: {userPurchaseStatus.purchase?.id}
                </div>
              </div>
            ) : (
              <button
                className={`buy-button ${flashSaleStatus.status !== 'active' ? 'disabled' : ''}`}
                onClick={handlePurchase}
                disabled={loading || flashSaleStatus.status !== 'active'}
              >
                {loading ? 'Processing...' : '🛒 Buy Now'}
              </button>
            )}

            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
          </div>
        </div>

        <div className="sale-times">
          <div className="time-info">
            <strong>Sale Start:</strong> {new Date(flashSaleStatus.startTime).toLocaleString()}
          </div>
          <div className="time-info">
            <strong>Sale End:</strong> {new Date(flashSaleStatus.endTime).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
