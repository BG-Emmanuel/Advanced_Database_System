import React, { useState, useEffect } from 'react';

export default function Wishlist({ userId }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchWishlist();
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/wishlist/${userId}`);
      const data = await response.json();
      setWishlist(data.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await fetch(`${API_URL}/wishlist/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });
      setWishlist(wishlist.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) return <div className="loading">Loading wishlist...</div>;

  return (
    <div className="wishlist-container">
      <h2>My Wishlist ({wishlist.length} items)</h2>
      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p>Your wishlist is empty</p>
          <a href="/">Continue Shopping</a>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map(item => (
            <div key={item.product_id} className="wishlist-card">
              <div className="wishlist-item-info">
                <h3>{item.product_name}</h3>
                <div className="wishlist-price">
                  {item.discount_price ? (
                    <>
                      <span className="original-price">{item.base_price} XAF</span>
                      <span className="discount-price">{item.discount_price} XAF</span>
                    </>
                  ) : (
                    <span>{item.base_price} XAF</span>
                  )}
                </div>
                <div className="wishlist-rating">
                  ? {item.rating || 'No rating'}
                </div>
              </div>
              <div className="wishlist-actions">
                <a href={`/product/${item.product_id}`} className="btn-view">
                  View Product
                </a>
                <button
                  onClick={() => removeFromWishlist(item.product_id)}
                  className="btn-remove"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
