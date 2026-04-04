import React, { useState, useEffect } from 'react';
import { useWishlist } from '../../pages/WishlistPage';

/**
 * WishlistButton — reusable ❤️ button
 * Used on ProductCard and ProductDetailPage
 */
const WishlistButton = ({ product, style = {} }) => {
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const [saved, setSaved] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted(product.product_id));
  }, [product.product_id]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    if (saved) {
      removeFromWishlist(product.product_id);
      setSaved(false);
    } else {
      addToWishlist(product);
      setSaved(true);
    }
  };

  return (
    <button
      onClick={toggle}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        background: 'white',
        border: 'none',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: 'var(--shadow-sm)',
        transform: animating ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        ...style,
      }}
    >
      {saved ? '❤️' : '🤍'}
    </button>
  );
};

export default WishlistButton;
