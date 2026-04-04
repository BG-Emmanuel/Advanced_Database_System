import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import { Stars, fmt } from '../components/common/ProductCard';
import WishlistButton from '../components/common/WishlistButton';

const MOCK = (slug) => ({
  product_id:'mock-1', product_name:'Samsung Galaxy A54 5G', slug,
  description:'The Samsung Galaxy A54 5G is a powerful mid-range smartphone. Featuring a stunning 6.4" Super AMOLED display, 50MP camera system, and all-day 5000mAh battery life. Perfect for everyday use in Cameroon.',
  base_price:85000, discount_price:72000, currency_code:'XAF',
  rating:4.5, review_count:128, total_sold:456, is_available:true, total_stock:15,
  category_name:'Electronics', category_slug:'electronics',
  shop_name:'TechCM Store', vendor_id:'v1', vendor_verified:true,
  vendor_city:'Douala', vendor_phone:'+237 699 123 456', vendor_whatsapp:'+237699123456',
  vendor_rating:4.7, vendor_review_count:234,
  images:[{ image_url:'https://picsum.photos/seed/phone1/600/600', is_primary:true },
          { image_url:'https://picsum.photos/seed/phone2/600/600' },
          { image_url:'https://picsum.photos/seed/phone3/600/600' }],
  attributes:[{ attribute_name:'Storage', value:'256GB' },{ attribute_name:'RAM', value:'8GB' },
              { attribute_name:'Color', value:'Graphite' },{ attribute_name:'Battery', value:'5000mAh' }],
  reviews:[
    { reviewer_name:'Jean Paul', rating:5, title:'Excellent!', body:'Very satisfied. Fast delivery and product as described.', is_verified_purchase:true, created_at:'2024-01-15' },
    { reviewer_name:'Marie Claire', rating:4, title:'Good value', body:'Good phone for the price. Camera quality is great.', is_verified_purchase:true, created_at:'2024-01-10' },
  ],
});

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, user, showNotification } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading]  = useState(true);
  const [selImg, setSelImg]    = useState(0);
  const [qty, setQty]          = useState(1);
  const [adding, setAdding]    = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [review, setReview]    = useState({ rating:5, title:'', body:'' });

  useEffect(() => {
    productAPI.getOne(slug)
      .then(d => setProduct(d.product))
      .catch(() => setProduct(MOCK(slug)))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    if (!user) { showNotification({ type:'warning', message:'Please login first' }); navigate('/login'); return; }
    setAdding(true);
    try { await addToCart(product.product_id, qty); }
    catch { showNotification({ type:'error', message:'Failed to add to cart' }); }
    finally { setAdding(false); }
  };

  const handleBuyNow = async () => { await handleAdd(); navigate('/cart'); };

  const handleReview = async (e) => {
    e.preventDefault();
    try { await productAPI.addReview(product.product_id, review); showNotification({ type:'success', message:'Review submitted!' }); setShowReview(false); }
    catch { showNotification({ type:'error', message:'Failed to submit review' }); }
  };

  if (loading) return (
    <div className="page"><div className="container" style={{ paddingTop:16 }}>
      <div className="skeleton" style={{ height:300, borderRadius:12, marginBottom:16 }}/>
      <div className="skeleton" style={{ height:24, marginBottom:8, borderRadius:4 }}/>
      <div className="skeleton" style={{ height:24, width:'60%', borderRadius:4 }}/>
    </div></div>
  );

  if (!product) return (
    <div className="page flex-center" style={{ flexDirection:'column', gap:16, paddingTop:80 }}>
      <div style={{ fontSize:'3rem' }}>😢</div><h2>Product not found</h2>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  const displayPrice = product.discount_price || product.base_price;
  const disc = product.discount_price ? Math.round(((product.base_price - product.discount_price)/product.base_price)*100) : 0;
  const images = product.images?.length ? product.images : [{ image_url:`https://picsum.photos/seed/${product.product_id}/600/600` }];
  const highlightPaymentText = (tx) => {
    const parts = tx.split(/(MTN MoMo|Orange Money)/g);
    return parts.map((part, idx) => (
      part === 'MTN MoMo' || part === 'Orange Money'
        ? <strong key={`${part}-${idx}`}>{part}</strong>
        : <React.Fragment key={`t-${idx}`}>{part}</React.Fragment>
    ));
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        {/* Breadcrumb */}
        <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginBottom:12, display:'flex', gap:4, flexWrap:'wrap' }}>
          <Link to="/" style={{ color:'var(--green)' }}>Home</Link><span>/</span>
          {product.category_name && <><Link to={`/search?category=${product.category_slug}`} style={{ color:'var(--green)' }}>{product.category_name}</Link><span>/</span></>}
          <span>{product.product_name.substring(0,35)}{product.product_name.length>35?'...':''}</span>
        </div>

        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr' }}>
          <style>{`@media(min-width:768px){.pdl{grid-template-columns:1fr 1fr!important}}`}</style>
          <div className="pdl" style={{ display:'grid', gap:16 }}>
            {/* Images */}
            <div>
              <div style={{ position:'relative', aspectRatio:'1', borderRadius:'var(--radius-md)', overflow:'hidden', background:'white' }}>
                <img src={images[selImg]?.image_url} alt={product.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.src='https://picsum.photos/seed/p/600/600'; }}/>
                {disc>0 && <span className="product-card__discount" style={{ position:'absolute', top:12, left:12, fontSize:'.85rem', padding:'4px 10px' }}>-{disc}%</span>}
              </div>
              {images.length>1 && (
                <div className="scroll-x" style={{ marginTop:10 }}>
                  {images.map((img,i) => (
                    <button key={i} onClick={() => setSelImg(i)} style={{ width:64, height:64, flexShrink:0, borderRadius:'var(--radius-sm)', overflow:'hidden', border:`2px solid ${i===selImg?'var(--green)':'transparent'}`, cursor:'pointer', background:'none', padding:0 }}>
                      <img src={img.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.src='https://picsum.photos/seed/th/64/64'; }}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <h1 style={{ fontSize:'1.1rem', fontWeight:800, lineHeight:1.4, flex:1 }}>{product.product_name}</h1>
                <WishlistButton product={product} style={{ flexShrink:0, marginTop:2 }}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, flexWrap:'wrap' }}>
                <Stars rating={product.rating}/>
                <span style={{ fontSize:'.82rem', color:'var(--text-muted)' }}>({product.review_count} reviews) • {product.total_sold} sold</span>
              </div>

              {/* Price */}
              <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', marginTop:12 }}>
                <span style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--orange)', fontFamily:'var(--font-main)' }}>{fmt(displayPrice)} FCFA</span>
                {disc>0 && <><span style={{ fontSize:'.95rem', color:'var(--text-muted)', textDecoration:'line-through' }}>{fmt(product.base_price)} FCFA</span><span className="badge badge-red">Save {disc}%</span></>}
              </div>

              {/* Stock */}
              <div style={{ marginTop:10 }}>
                {product.total_stock>0 ? <span className="badge badge-green">✓ In Stock ({product.total_stock} units)</span> : <span className="badge badge-red">✗ Out of Stock</span>}
              </div>

              {/* Attributes */}
              {product.attributes?.length>0 && (
                <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
                  {product.attributes.map((a,i) => (
                    <div key={i} style={{ display:'flex', gap:8, fontSize:'.85rem' }}>
                      <span style={{ color:'var(--text-muted)', minWidth:80 }}>{a.attribute_name}:</span>
                      <span style={{ fontWeight:600 }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginTop:16 }}>
                <div className="form-label">Quantity</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
                    <button onClick={() => setQty(q=>Math.max(1,q-1))} style={{ padding:'8px 14px', background:'var(--bg)', border:'none', cursor:'pointer', fontSize:'1.1rem', fontWeight:700 }} disabled={qty<=1}>−</button>
                    <span style={{ padding:'8px 16px', fontWeight:700 }}>{qty}</span>
                    <button onClick={() => setQty(q=>Math.min(product.total_stock||99,q+1))} style={{ padding:'8px 14px', background:'var(--bg)', border:'none', cursor:'pointer', fontSize:'1.1rem', fontWeight:700 }}>+</button>
                  </div>
                  <span style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>Total: {fmt(displayPrice*qty)} FCFA</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
                <button className="btn btn-primary btn-lg btn-full" onClick={handleAdd} disabled={adding||!product.total_stock}>
                  {adding ? <><div className="spinner spinner-sm"/>Adding...</> : '🛒 Add to Cart'}
                </button>
                <button className="btn btn-secondary btn-lg btn-full" onClick={handleBuyNow} disabled={!product.total_stock}>⚡ Buy Now</button>
              </div>

              {/* Contact seller */}
              <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                <Link
                  to={`/chat/${product.vendor_id}?product=${product.slug}&pname=${encodeURIComponent(product.product_name)}&price=${product.discount_price||product.base_price}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex:1, minWidth:120 }}
                >
                  💬 Chat with Seller
                </Link>
                {product.vendor_phone && (
                  <a href={`tel:${product.vendor_phone}`} className="btn btn-ghost btn-sm">📞 Call</a>
                )}
                {product.vendor_whatsapp && (
                  <a href={`https://wa.me/${product.vendor_whatsapp.replace(/\D/g,'')}?text=Hi, interested in: ${product.product_name}`}
                    target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background:'#25D366', color:'white' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{marginRight:4}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.484 2 12.017c0 1.996.576 3.864 1.583 5.452L2 22l4.607-1.538A9.98 9.98 0 0012 22c5.523 0 10-4.478 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.062-1.113l-.291-.173-3.014 1.006 1.018-2.926-.189-.299A7.986 7.986 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>

              {/* Delivery */}
              <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                {[['🚚','Free delivery on orders over 25,000 FCFA'],['📲','Pay with MTN MoMo or Orange Money'],['↩️','Easy returns within 7 days']].map(([ic,tx]) => (
                  <div key={ic} style={{ display:'flex', gap:10, fontSize:'.83rem' }}><span>{ic}</span><span>{highlightPaymentText(tx)}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vendor card */}
        <div className="card card-padding" style={{ marginTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>🏪</div>
              <div>
                <div style={{ fontWeight:700, fontSize:'.95rem', display:'flex', alignItems:'center', gap:6 }}>
                  {product.shop_name}
                  {product.vendor_verified && <span style={{ color:'var(--green)', fontSize:'.8rem' }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>📍 {product.vendor_city} • ⭐ {Number(product.vendor_rating||0).toFixed(1)} ({product.vendor_review_count} reviews)</div>
              </div>
            </div>
            <Link to={`/vendor/${product.vendor_id}`} className="btn btn-outline btn-sm">View Shop</Link>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="card card-padding" style={{ marginTop:12 }}>
            <h2 style={{ fontSize:'1rem', marginBottom:10 }}>Product Description</h2>
            <p style={{ fontSize:'.9rem', lineHeight:1.7, color:'var(--text-secondary)', whiteSpace:'pre-wrap' }}>{product.description}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="card card-padding" style={{ marginTop:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h2 style={{ fontSize:'1rem' }}>Reviews ({product.review_count})</h2>
            {user && <button className="btn btn-outline btn-sm" onClick={() => setShowReview(!showReview)}>{showReview?'Cancel':'+ Write Review'}</button>}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:12, background:'var(--bg)', borderRadius:'var(--radius-sm)' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', fontWeight:800, fontFamily:'var(--font-main)' }}>{Number(product.rating||0).toFixed(1)}</div>
              <Stars rating={product.rating||0}/>
              <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:4 }}>{product.review_count} reviews</div>
            </div>
          </div>

          {showReview && (
            <form onSubmit={handleReview} style={{ marginBottom:16, padding:16, background:'var(--bg)', borderRadius:'var(--radius-sm)' }}>
              <div className="form-group"><label className="form-label">Rating</label><Stars rating={review.rating} interactive onRate={r=>setReview(p=>({...p,rating:r}))}/></div>
              <div className="form-group"><label className="form-label">Title</label><input className="form-control" value={review.title} onChange={e=>setReview(p=>({...p,title:e.target.value}))} required/></div>
              <div className="form-group"><label className="form-label">Review</label><textarea className="form-control" rows={3} value={review.body} onChange={e=>setReview(p=>({...p,body:e.target.value}))} required style={{ resize:'vertical' }}/></div>
              <button type="submit" className="btn btn-primary">Submit Review</button>
            </form>
          )}

          {!product.reviews?.length ? (
            <div className="empty-state" style={{ padding:24 }}><div className="empty-state__icon">💬</div><div className="empty-state__text">No reviews yet. Be the first!</div></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {product.reviews.map((r,i) => (
                <div key={i} style={{ borderBottom:i<product.reviews.length-1?'1px solid var(--border)':'none', paddingBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', fontWeight:700, color:'var(--green)' }}>{r.reviewer_name?.charAt(0)||'U'}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'.85rem', display:'flex', alignItems:'center', gap:6 }}>
                        {r.reviewer_name||'Anonymous'}
                        {r.is_verified_purchase && <span className="badge badge-green" style={{ fontSize:'.6rem' }}>✓ Verified</span>}
                      </div>
                      <Stars rating={r.rating}/>
                    </div>
                  </div>
                  {r.title && <div style={{ fontWeight:600, fontSize:'.88rem', marginBottom:4 }}>{r.title}</div>}
                  <p style={{ fontSize:'.85rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
