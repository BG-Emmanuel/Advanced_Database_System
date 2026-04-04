import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vendorAPI } from '../utils/api';
import ProductCard, { ProductCardSkeleton } from '../components/common/ProductCard';
import { Stars } from '../components/common/ProductCard';

export default function VendorPublicPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    vendorAPI.getPublic(id)
      .then(d => { setVendor(d.vendor); setProducts(d.products || []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 16 }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-md)', marginBottom: 16 }}/>
        <div className="product-grid">{[1,2,3,4].map(i => <ProductCardSkeleton key={i}/>)}</div>
      </div>
    </div>
  );

  if (error || !vendor) return (
    <div className="page flex-center" style={{ flexDirection:'column', gap:16, paddingTop:80 }}>
      <div style={{ fontSize:'3rem' }}>🏪</div>
      <h2>Shop not found</h2>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  return (
    <div className="page">
      {/* Shop Banner */}
      <div style={{ background:'linear-gradient(135deg, var(--green), var(--green-dark))', padding:'24px 0 16px' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', flexShrink:0 }}>
              {vendor.shop_logo_url ? <img src={vendor.shop_logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/> : '🏪'}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <h1 style={{ color:'white', fontSize:'1.2rem', fontWeight:800 }}>{vendor.shop_name}</h1>
                {vendor.is_verified && <span className="badge badge-green" style={{ fontSize:'.65rem' }}>✓ Verified</span>}
              </div>
              {vendor.city && <div style={{ color:'rgba(255,255,255,.85)', fontSize:'.82rem', marginTop:2 }}>📍 {vendor.city}</div>}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
                {vendor.rating > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Stars rating={vendor.rating}/>
                    <span style={{ color:'white', fontSize:'.78rem' }}>({vendor.review_count})</span>
                  </div>
                )}
                <span style={{ color:'rgba(255,255,255,.7)', fontSize:'.75rem' }}>Member since {new Date(vendor.created_at).getFullYear()}</span>
              </div>
            </div>
          </div>
          {vendor.shop_description && (
            <p style={{ color:'rgba(255,255,255,.85)', fontSize:'.85rem', marginTop:12, lineHeight:1.6 }}>{vendor.shop_description}</p>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop:16 }}>
        {/* Trust badges */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {vendor.is_verified && <span className="badge badge-green">✓ Verified Seller</span>}
          {vendor.total_sales > 0 && <span className="badge badge-orange">💰 {new Intl.NumberFormat('fr-CM').format(Math.round(vendor.total_sales))} FCFA in sales</span>}
          <span className="badge badge-gray">📦 {products.length} products</span>
        </div>

        {/* Products */}
        <div className="section-title">
          <h2>Products by {vendor.shop_name}</h2>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <div className="empty-state__title">No products listed yet</div>
            <p className="empty-state__text">This vendor hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => <ProductCard key={p.product_id} product={p}/>)}
          </div>
        )}

        {/* Contact */}
        <div className="card card-padding" style={{ marginTop:20 }}>
          <h3 style={{ fontSize:'.95rem', marginBottom:12 }}>Contact Seller</h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link to={`/search?vendor_id=${vendor.vendor_id}`} className="btn btn-outline btn-sm">
              🔍 All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
