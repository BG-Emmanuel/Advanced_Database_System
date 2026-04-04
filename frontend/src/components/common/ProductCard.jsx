import React, { useState } from 'react';
import WishlistButton from './WishlistButton';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const fmt = (p) => new Intl.NumberFormat('fr-CM').format(Math.round(p));

export const Stars = ({ rating, count, interactive, onRate }) => (
  <div className="stars" style={{ cursor: interactive ? 'pointer' : 'default' }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`star ${i <= Math.floor(rating) ? '' : 'star-empty'}`}
        style={{ fontSize: interactive ? '1.5rem' : '0.85rem' }}
        onClick={() => interactive && onRate && onRate(i)}>★</span>
    ))}
    {count !== undefined && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:4 }}>({count})</span>}
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart, user, showNotification } = useApp();
  const [adding, setAdding] = useState(false);

  const disc = product.discount_price
    ? Math.round(((product.base_price - product.discount_price) / product.base_price) * 100) : 0;
  const displayPrice = product.discount_price || product.base_price;
  const imgSrc = product.primary_image || `https://picsum.photos/seed/${product.product_id}/300/300`;

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { showNotification({ type: 'warning', message: 'Please login to add to cart' }); return; }
    setAdding(true);
    try { await addToCart(product.product_id); }
    catch { showNotification({ type: 'error', message: 'Failed to add to cart' }); }
    finally { setAdding(false); }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.slug}`}>
        <div className="product-card__img">
          <img src={imgSrc} alt={product.product_name} loading="lazy"
            onError={e => { e.target.src = `https://picsum.photos/seed/fallback${product.product_id}/300/300`; }} />
          {disc > 0 && <span className="product-card__discount" style={{ position:'absolute', top:8, left:8 }}>-{disc}%</span>}
          {product.is_deal_of_day && <span className="badge badge-orange" style={{ position:'absolute', top:40, right:8, fontSize:'0.65rem' }}>🔥 Deal</span>}
          <WishlistButton product={product} style={{ position:'absolute', top:8, right:8 }}/>
        </div>
        <div className="product-card__body">
          <div className="product-card__name">{product.product_name}</div>
          <div className="product-card__price">
            <span className="product-card__price-main">{fmt(displayPrice)} FCFA</span>
            {disc > 0 && <span className="product-card__price-old">{fmt(product.base_price)}</span>}
          </div>
          {product.rating > 0 && <Stars rating={product.rating} count={product.review_count} />}
          {product.vendor_name && (
            <div className="product-card__vendor">🏪 {product.vendor_name}{product.vendor_verified && <span style={{ color:'var(--green)', marginLeft:4 }}>✓</span>}</div>
          )}
        </div>
      </Link>
      <div style={{ padding:'0 12px 12px' }}>
        <button className="btn btn-primary btn-sm btn-full" onClick={handleAdd}
          disabled={adding || product.stock === 0}>
          {adding ? '...' : product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export const ProductCardSkeleton = () => (
  <div className="product-card">
    <div className="skeleton" style={{ aspectRatio:'1', width:'100%' }} />
    <div style={{ padding:12 }}>
      <div className="skeleton" style={{ height:14, marginBottom:6, borderRadius:4 }} />
      <div className="skeleton" style={{ height:14, width:'60%', marginBottom:8, borderRadius:4 }} />
      <div className="skeleton" style={{ height:18, width:'70%', marginBottom:8, borderRadius:4 }} />
      <div className="skeleton" style={{ height:34, borderRadius:8 }} />
    </div>
  </div>
);

export default ProductCard;
