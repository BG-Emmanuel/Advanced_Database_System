import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/common/ProductCard';

const STORAGE_KEY = 'buy237_wishlist';

// Wishlist is stored locally (no backend needed) — works even offline
export const useWishlist = () => {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const save = (items) => {
    setWishlist(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addToWishlist = (product) => {
    if (!wishlist.find(p => p.product_id === product.product_id)) {
      save([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId) => {
    save(wishlist.filter(p => p.product_id !== productId));
  };

  const isWishlisted = (productId) => wishlist.some(p => p.product_id === productId);

  const clearWishlist = () => save([]);

  return { wishlist, addToWishlist, removeFromWishlist, isWishlisted, clearWishlist };
};

export default function WishlistPage() {
  const { addToCart, showNotification } = useApp();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const fmt = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n));

  const handleAddAllToCart = async () => {
    let added = 0;
    for (const product of wishlist) {
      try {
        await addToCart(product.product_id);
        added++;
      } catch {}
    }
    if (added > 0) showNotification({ type: 'success', message: `${added} item${added > 1 ? 's' : ''} added to cart!` });
  };

  if (wishlist.length === 0) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-state__icon">❤️</div>
          <div className="empty-state__title">Your wishlist is empty</div>
          <p className="empty-state__text">Save products you love by tapping the ❤️ button</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Discover Products</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>❤️ My Wishlist ({wishlist.length})</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {wishlist.length > 1 && (
              <button className="btn btn-primary btn-sm" onClick={handleAddAllToCart}>
                🛒 Add All to Cart
              </button>
            )}
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={clearWishlist}>
              Clear All
            </button>
          </div>
        </div>

        <div className="product-grid">
          {wishlist.map(product => (
            <div key={product.product_id} style={{ position: 'relative' }}>
              <ProductCard product={product} />
              <button
                onClick={() => removeFromWishlist(product.product_id)}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'white', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer', fontSize: '.85rem',
                  boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}
                title="Remove from wishlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--green-light)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '.82rem', color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>
            💡 Your wishlist is saved on this device
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
            Items are saved locally. Login to sync across devices (coming soon).
          </div>
        </div>
      </div>
    </div>
  );
}
