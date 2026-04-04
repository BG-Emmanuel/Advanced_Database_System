import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fmt } from '../components/common/ProductCard';

export default function CartPage() {
  const { cart, user, updateCartItem, removeCartItem } = useApp();
  const navigate = useNavigate();
  const items       = cart?.items || [];
  const subtotal    = cart?.subtotal || 0;
  const deliveryFee = subtotal > 25000 ? 0 : 1500;
  const total       = subtotal + deliveryFee;

  if (!user) return (
    <div className="page flex-center" style={{ flexDirection:'column', gap:16, paddingTop:60 }}>
      <div style={{ fontSize:'3rem' }}>🛒</div>
      <h2>Login to view your cart</h2>
      <Link to="/login" className="btn btn-primary">Login</Link>
    </div>
  );

  if (!items.length) return (
    <div className="page">
      <div className="container" style={{ paddingTop:40 }}>
        <div className="empty-state">
          <div className="empty-state__icon">🛒</div>
          <div className="empty-state__title">Your cart is empty</div>
          <p className="empty-state__text">Add some products to get started</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop:20 }}>Start Shopping</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        <h1 style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:16 }}>🛒 My Cart ({items.length} {items.length===1?'item':'items'})</h1>

        <div style={{ display:'grid', gap:16, alignItems:'start' }}>
          <style>{`@media(min-width:768px){.cart-layout{grid-template-columns:1fr 340px!important}}`}</style>
          <div className="cart-layout" style={{ display:'grid', gap:16 }}>
            {/* Items */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {items.map(item => (
                <div key={item.cart_item_id} className="card card-padding" style={{ display:'flex', gap:12, position:'relative' }}>
                  <Link to={`/product/${item.slug}`} style={{ width:80, height:80, flexShrink:0, borderRadius:'var(--radius-sm)', overflow:'hidden', background:'var(--bg)' }}>
                    <img src={item.product_image||`https://picsum.photos/seed/${item.product_id}/200/200`} alt={item.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.src='https://picsum.photos/80/80';}}/>
                  </Link>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link to={`/product/${item.slug}`} style={{ fontSize:'.88rem', fontWeight:600, color:'var(--text-primary)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.product_name}</Link>
                    {item.vendor_name && <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>🏪 {item.vendor_name}</div>}
                    {item.stock===0 && <div style={{ color:'var(--red)', fontSize:'.78rem', marginTop:4 }}>⚠ Out of stock</div>}
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
                        <button onClick={() => updateCartItem(item.cart_item_id, item.quantity-1)} style={{ padding:'5px 10px', background:'var(--bg)', border:'none', cursor:'pointer', fontSize:'1rem', fontWeight:700 }} disabled={item.quantity<=1}>−</button>
                        <span style={{ padding:'5px 12px', fontWeight:700, fontSize:'.9rem' }}>{item.quantity}</span>
                        <button onClick={() => updateCartItem(item.cart_item_id, item.quantity+1)} style={{ padding:'5px 10px', background:'var(--bg)', border:'none', cursor:'pointer', fontSize:'1rem', fontWeight:700 }}>+</button>
                      </div>
                      <span style={{ fontWeight:800, color:'var(--orange)', fontFamily:'var(--font-main)' }}>{fmt(item.unit_price*item.quantity)} FCFA</span>
                    </div>
                  </div>
                  <button onClick={() => removeCartItem(item.cart_item_id)} style={{ position:'absolute', top:12, right:12, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'.8rem' }} title="Remove">✕</button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card card-padding">
              <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:16 }}>Order Summary</h2>
              <div style={{ fontSize:'.85rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}><span>Subtotal ({items.length} items)</span><span>{fmt(subtotal)} FCFA</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                  <span>Delivery</span>
                  <span style={{ color:deliveryFee===0?'var(--green)':'inherit' }}>{deliveryFee===0?'🎉 FREE':`${fmt(deliveryFee)} FCFA`}</span>
                </div>
                {deliveryFee>0 && <div style={{ background:'var(--green-light)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:'.8rem', color:'var(--green)', marginTop:8 }}>Add {fmt(25000-subtotal)} FCFA more for free delivery!</div>}
                <div className="divider"/>
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1.05rem' }}>
                  <span>Total</span><span style={{ color:'var(--orange)' }}>{fmt(total)} FCFA</span>
                </div>
              </div>
              <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginTop:12 }}>
                <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginBottom:6 }}>Accepted payments:</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span className="momo-badge">MTN MoMo</span>
                  <span className="orange-money-badge">Orange Money</span>
                  <span className="badge badge-gray">Cash on Delivery</span>
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-full" style={{ marginTop:16 }} onClick={() => navigate('/checkout')}>Proceed to Checkout →</button>
              <Link to="/" className="btn btn-ghost btn-full" style={{ marginTop:8 }}>← Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
