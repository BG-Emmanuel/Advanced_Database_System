import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../components/common/ProductCard';

const SC = {
  pending:    { l:'Pending',    i:'⏳', c:'status-pending'    },
  confirmed:  { l:'Confirmed',  i:'✅', c:'status-confirmed'  },
  processing: { l:'Processing', i:'⚙️', c:'status-processing' },
  shipped:    { l:'Shipped',    i:'🚚', c:'status-shipped'    },
  delivered:  { l:'Delivered',  i:'📦', c:'status-delivered'  },
  cancelled:  { l:'Cancelled',  i:'❌', c:'status-cancelled'  },
};

const PAY = {
  mtn_momo:'📲 MTN MoMo', orange_money:'🟠 Orange Money',
  cash_on_delivery:'💵 Cash on Delivery', card:'💳 Bank Card',
};

const MOCK_ORDERS = [
  { order_id:'o1', order_number:'B237-20240115-ABC123', status:'delivered', payment_method:'mtn_momo',        total_amount:85000, item_count:2, created_at:'2024-01-15T10:00:00', city:'Yaoundé',  neighborhood:'Bastos' },
  { order_id:'o2', order_number:'B237-20240120-DEF456', status:'shipped',   payment_method:'cash_on_delivery',total_amount:34500, item_count:1, created_at:'2024-01-20T14:30:00', city:'Douala',   neighborhood:'Akwa' },
  { order_id:'o3', order_number:'B237-20240125-GHI789', status:'pending',   payment_method:'orange_money',    total_amount:22000, item_count:3, created_at:'2024-01-25T09:15:00', city:'Yaoundé',  neighborhood:'Melen' },
];

export function OrdersPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getAll({ status: filter||undefined })
      .then(d => setOrders(d.orders||[]))
      .catch(() => setOrders(MOCK_ORDERS))
      .finally(() => setLoading(false));
  }, [user, navigate, filter]);

  const statuses = ['','pending','confirmed','processing','shipped','delivered','cancelled'];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        <h1 style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:16 }}>📦 My Orders</h1>
        <div className="scroll-x" style={{ marginBottom:16, gap:6 }}>
          {statuses.map(s => (
            <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-ghost'}`}
              style={{ flexShrink:0, fontSize:'.75rem' }} onClick={() => { setFilter(s); setLoading(true); }}>
              {s===''?'All':SC[s]?.i+' '+SC[s]?.l}
            </button>
          ))}
        </div>
        {loading ? <div className="flex-center" style={{ padding:40 }}><div className="spinner"/></div>
        : orders.length===0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div><div className="empty-state__title">No orders found</div>
            <Link to="/" className="btn btn-primary" style={{ marginTop:16 }}>Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orders.map(o => {
              const s = SC[o.status]||SC.pending;
              return (
                <Link key={o.order_id} to={`/orders/${o.order_id}`} className="card card-padding" style={{ display:'block', textDecoration:'none', color:'inherit' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'.88rem' }}>{o.order_number}</div>
                      <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>{new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <span className={`badge ${s.c}`}>{s.i} {s.l}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ fontSize:'.82rem', color:'var(--text-muted)' }}>{o.item_count} item{o.item_count!==1?'s':''} • {PAY[o.payment_method]||o.payment_method}</div>
                      {o.city&&<div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>📍 {o.neighborhood&&`${o.neighborhood}, `}{o.city}</div>}
                    </div>
                    <div style={{ fontWeight:800, color:'var(--orange)', fontFamily:'var(--font-main)', fontSize:'1rem' }}>{fmt(o.total_amount)} FCFA</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [sp]   = useSearchParams();
  const { user, showNotification } = useApp();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSuccess = sp.get('success')==='1';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getOne(id)
      .then(d => setOrder(d.order))
      .catch(() => setOrder({
        order_id:id, order_number:'B237-20240115-ABC123', status:'delivered',
        payment_method:'mtn_momo', payment_status:'paid', subtotal:72000,
        delivery_fee:1000, discount_amount:0, total_amount:73000, created_at:'2024-01-15T10:00:00',
        recipient_name:'Jean Paul Atangana', delivery_phone:'+237 699 123 456',
        city:'Yaoundé', neighborhood:'Bastos', landmark:'Near Total Station',
        items:[{ order_item_id:'1', product_name:'Samsung Galaxy A54 5G', unit_price:72000, quantity:1, total_price:72000, product_image:null }]
      }))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try { await orderAPI.cancel(id); setOrder(o=>({...o,status:'cancelled'})); showNotification({type:'success',message:'Order cancelled'}); }
    catch { showNotification({type:'error',message:'Cannot cancel this order'}); }
  };

  if (loading) return <div className="page flex-center"><div className="spinner"/></div>;
  if (!order) return <div className="page flex-center"><h2>Order not found</h2></div>;

  const s = SC[order.status]||SC.pending;
  const trackSteps = ['confirmed','processing','shipped','delivered'];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        {isSuccess && (
          <div style={{ background:'var(--green)', color:'white', borderRadius:'var(--radius-md)', padding:20, marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>🎉</div>
            <h2 style={{ fontSize:'1.1rem', marginBottom:4 }}>Order Placed Successfully!</h2>
            <p style={{ fontSize:'.85rem', opacity:.9 }}>You'll receive a confirmation soon</p>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>← Back</button>
          <h1 style={{ fontSize:'1rem', fontWeight:800, flex:1 }}>{order.order_number}</h1>
          <span className={`badge ${s.c}`}>{s.i} {s.l}</span>
        </div>

        {/* Progress tracker */}
        <div className="card card-padding" style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
            <div style={{ position:'absolute', top:12, left:'12%', right:'12%', height:2, background:'var(--border)', zIndex:0 }}/>
            {trackSteps.map((ts,i) => {
              const allS = ['pending','confirmed','processing','shipped','delivered'];
              const done = allS.indexOf(order.status) >= allS.indexOf(ts);
              return (
                <div key={ts} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, zIndex:1, flex:1 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:done?'var(--green)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', color:done?'white':'var(--text-muted)' }}>{done?'✓':i+1}</div>
                  <span style={{ fontSize:'.65rem', color:done?'var(--green)':'var(--text-muted)', textAlign:'center', fontWeight:done?600:400 }}>{SC[ts]?.l}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:'grid', gap:12 }}>
          {/* Items */}
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:12 }}>Order Items</h2>
            {order.items?.map(item => (
              <div key={item.order_item_id} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                <img src={item.product_image||`https://picsum.photos/seed/${item.order_item_id}/80/80`} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, flexShrink:0 }} onError={e=>{e.target.src='https://picsum.photos/60/60';}}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'.88rem' }}>{item.product_name}</div>
                  <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Qty: {item.quantity} × {fmt(item.unit_price)} FCFA</div>
                </div>
                <div style={{ fontWeight:700, color:'var(--orange)', fontFamily:'var(--font-main)', fontSize:'.9rem' }}>{fmt(item.total_price)} FCFA</div>
              </div>
            ))}
          </div>

          {/* Delivery */}
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:12 }}>Delivery Details</h2>
            <div style={{ fontSize:'.88rem', lineHeight:2 }}>
              <div><strong>Name:</strong> {order.recipient_name}</div>
              <div><strong>Phone:</strong> {order.delivery_phone}</div>
              <div><strong>Location:</strong> {order.neighborhood&&`${order.neighborhood}, `}{order.city}</div>
              {order.landmark&&<div><strong>Landmark:</strong> Near {order.landmark}</div>}
            </div>
          </div>

          {/* Payment */}
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:12 }}>Payment Summary</h2>
            <div style={{ fontSize:'.85rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Method</span><span>{PAY[order.payment_method]}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Subtotal</span><span>{fmt(order.subtotal)} FCFA</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}><span>Delivery</span><span>{fmt(order.delivery_fee)} FCFA</span></div>
              {order.discount_amount>0&&<div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', color:'var(--green)' }}><span>Discount</span><span>-{fmt(order.discount_amount)} FCFA</span></div>}
              <div className="divider"/>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1rem' }}><span>Total</span><span style={{ color:'var(--orange)' }}>{fmt(order.total_amount)} FCFA</span></div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10 }}>
            {(order.status==='pending'||order.status==='confirmed')&&<button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Order</button>}
            <Link to="/" className="btn btn-primary btn-sm">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
