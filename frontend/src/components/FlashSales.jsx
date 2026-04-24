import React, { useState, useEffect } from 'react';

export default function FlashSales() {
  const [flashSales, setFlashSales] = useState([]);
  const [upcomingSales, setUpcomingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchFlashSales();
    fetchUpcomingSales();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, [flashSales]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/flash-sales/active`);
      const data = await response.json();
      setFlashSales(data.data || []);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingSales = async () => {
    try {
      const response = await fetch(`${API_URL}/flash-sales/upcoming`);
      const data = await response.json();
      setUpcomingSales(data.data || []);
    } catch (error) {
      console.error('Error fetching upcoming sales:', error);
    }
  };

  const updateTimers = () => {
    const newTimers = {};
    flashSales.forEach(sale => {
      const endTime = new Date(sale.end_time);
      const now = new Date();
      const diff = endTime - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        newTimers[sale.flash_sale_id] = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        newTimers[sale.flash_sale_id] = 'Ended';
      }
    });
    setTimers(newTimers);
  };

  const calculateDiscount = (originalPrice, salePrice) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  if (loading) return <div className="loading">Loading flash sales...</div>;

  return (
    <div className="flash-sales-container">
      <div className="flash-sales-header">
        <h2>? Flash Sales</h2>
        <p>Limited time deals - grab them before they are gone!</p>
      </div>

      {flashSales.length === 0 ? (
        <div className="no-sales">
          <p>No active flash sales right now</p>
        </div>
      ) : (
        <div className="flash-sales-grid">
          {flashSales.map(sale => (
            <div key={sale.flash_sale_id} className="flash-sale-card">
              <div className="discount-badge">
                -{calculateDiscount(sale.base_price, sale.sale_price)}%
              </div>
              <div className="sale-info">
                <h3>{sale.product_name}</h3>
                <p className="vendor-name">{sale.shop_name}</p>
                <div className="sale-prices">
                  <span className="original-price">{sale.base_price} XAF</span>
                  <span className="sale-price">{sale.sale_price} XAF</span>
                </div>
                <div className="sale-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(sale.sold_count / sale.max_quantity) * 100}%` }}
                    />
                  </div>
                  <span>{sale.max_quantity - sale.sold_count} left</span>
                </div>
                <div className="sale-timer">
                  ? Ends in: {timers[sale.flash_sale_id] || 'Calculating...'}
                </div>
                <div className="sale-rating">
                  ? {sale.rating || 'N/A'} ({sale.review_count || 0} reviews)
                </div>
              </div>
              <a href={`/product/${sale.product_id}`} className="btn-buy">
                Buy Now
              </a>
            </div>
          ))}
        </div>
      )}

      {upcomingSales.length > 0 && (
        <div className="upcoming-sales">
          <h3>?? Upcoming Flash Sales</h3>
          <div className="upcoming-grid">
            {upcomingSales.map(sale => (
              <div key={sale.flash_sale_id} className="upcoming-card">
                <h4>{sale.product_name}</h4>
                <p>{sale.shop_name}</p>
                <p className="starts-in">
                  Starts in: {Math.floor(sale.seconds_until_start / 3600)}h
                </p>
                <span className="upcoming-price">{sale.base_price} XAF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
