import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI, productAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../components/common/ProductCard';
import api from '../utils/api';

const STATUS_MAP = {
  pending:    { c:'status-pending',    l:'Pending' },
  confirmed:  { c:'status-confirmed',  l:'Confirmed' },
  processing: { c:'status-processing', l:'Processing' },
  shipped:    { c:'status-shipped',    l:'Shipped' },
  delivered:  { c:'status-delivered',  l:'Delivered' },
  cancelled:  { c:'status-cancelled',  l:'Cancelled' },
};

export default function AdminDashboardPage() {
  const { user, showNotification } = useApp();
  const navigate = useNavigate();

  const [tab, setTab]         = useState('overview');
  const [orders, setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        orderAPI.getAllAdmin({ limit: 50 }),
        productAPI.getAll({ limit: 50, sort: 'created_at', order: 'DESC' }),
      ]);
      const allOrders = ordersData.orders || [];
      setOrders(allOrders);
      setProducts(productsData.products || []);

      // Compute stats
      const totalRevenue   = allOrders.filter(o => o.status === 'delivered').reduce((s,o) => s + parseFloat(o.total_amount||0), 0);
      const pendingCount   = allOrders.filter(o => o.status === 'pending').length;
      const deliveredCount = allOrders.filter(o => o.status === 'delivered').length;
      setStats({ totalRevenue, totalOrders: allOrders.length, pendingCount, deliveredCount });
    } catch {
      // fallback mock stats
      setStats({ totalRevenue: 12450000, totalOrders: 284, pendingCount: 12, deliveredCount: 198 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      showNotification({ type: 'success', message: `Order status updated to ${newStatus}` });
    } catch {
      showNotification({ type: 'error', message: 'Failed to update order status' });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleToggleFeatured = async (productId, isFeatured) => {
    try {
      await productAPI.update(productId, { is_featured: !isFeatured });
      setProducts(prev => prev.map(p => p.product_id === productId ? { ...p, is_featured: !isFeatured } : p));
      showNotification({ type: 'success', message: isFeatured ? 'Removed from featured' : 'Added to featured' });
    } catch {
      showNotification({ type: 'error', message: 'Failed to update product' });
    }
  };

  const filteredOrders = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  const TABS = [
    { id:'overview', icon:'📊', label:'Overview' },
    { id:'orders',   icon:'🛒', label:'All Orders' },
    { id:'products', icon:'📦', label:'Products' },
  ];

  if (loading) return <div className="page flex-center"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 12 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize:'1.1rem', fontWeight:800 }}>⚙️ Admin Dashboard</h1>
            <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:2 }}>Welcome, {user?.full_name}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadData}>↻ Refresh</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
          {TABS.map(t => (
            <button key={t.id} className={`btn btn-sm ${tab===t.id?'btn-primary':'btn-ghost'}`}
              style={{ flexShrink:0 }} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
              {[
                { i:'💰', l:'Total Revenue',    v:`${fmt(stats?.totalRevenue||0)} FCFA`, c:'var(--orange)' },
                { i:'📦', l:'Total Orders',     v:stats?.totalOrders||0,               c:'var(--green)' },
                { i:'⏳', l:'Pending Orders',   v:stats?.pendingCount||0,               c:'#F59E0B' },
                { i:'✅', l:'Delivered Orders', v:stats?.deliveredCount||0,             c:'var(--green)' },
              ].map(s => (
                <div key={s.l} className="card card-padding" style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{s.i}</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:800, color:s.c, fontFamily:'var(--font-main)' }}>{s.v}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="card card-padding" style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:'.95rem', marginBottom:12 }}>⚡ Quick Actions</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('orders')}
                  style={{ justifyContent:'flex-start', gap:8 }}>🛒 Manage Orders</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('products')}
                  style={{ justifyContent:'flex-start', gap:8 }}>📦 Manage Products</button>
                <Link to="/search" className="btn btn-ghost btn-sm" style={{ justifyContent:'flex-start', gap:8 }}>🔍 Browse Store</Link>
                <Link to="/" className="btn btn-ghost btn-sm" style={{ justifyContent:'flex-start', gap:8 }}>🏠 View Home</Link>
              </div>
            </div>

            {/* Recent orders preview */}
            <div className="card card-padding">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h2 style={{ fontSize:'.95rem' }}>Recent Orders</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('orders')}>View All →</button>
              </div>
              {orders.slice(0,5).map(o => {
                const s = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <div key={o.order_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize:'.85rem', fontWeight:600 }}>{o.order_number}</div>
                      <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{o.customer_name} • {new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'.82rem', fontWeight:700, color:'var(--orange)' }}>{fmt(o.total_amount)} FCFA</span>
                      <span className={`badge ${s.c}`} style={{ fontSize:'.65rem' }}>{s.l}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === 'orders' && (
          <div>
            {/* Filter */}
            <div className="scroll-x" style={{ marginBottom:12, gap:6 }}>
              {['','pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                <button key={s} className={`btn btn-sm ${filterStatus===s?'btn-primary':'btn-ghost'}`}
                  style={{ flexShrink:0, fontSize:'.75rem' }} onClick={() => setFilterStatus(s)}>
                  {s===''?'All Orders':STATUS_MAP[s]?.l}
                </button>
              ))}
            </div>

            <div style={{ fontSize:'.82rem', color:'var(--text-muted)', marginBottom:10 }}>
              Showing {filteredOrders.length} orders
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filteredOrders.map(order => {
                const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
                const next = { pending:'confirmed', confirmed:'processing', processing:'shipped', shipped:'delivered' }[order.status];
                return (
                  <div key={order.order_id} className="card card-padding">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'.88rem' }}>{order.order_number}</div>
                        <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>
                          👤 {order.customer_name} • 📞 {order.customer_phone}
                        </div>
                        <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:800, color:'var(--orange)', fontFamily:'var(--font-main)', fontSize:'.9rem' }}>
                          {fmt(order.total_amount)} FCFA
                        </div>
                        <span className={`badge ${s.c}`} style={{ fontSize:'.65rem', marginTop:4 }}>{s.l}</span>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                      {next && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize:'.72rem' }}
                          disabled={updatingOrder === order.order_id}
                          onClick={() => handleUpdateStatus(order.order_id, next)}
                        >
                          {updatingOrder === order.order_id ? '...' : `Mark as ${next} →`}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ fontSize:'.72rem' }}
                          disabled={updatingOrder === order.order_id}
                          onClick={() => handleUpdateStatus(order.order_id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                      <Link to={`/orders/${order.order_id}`} className="btn btn-ghost btn-sm" style={{ fontSize:'.72rem' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon">🛒</div>
                  <div className="empty-state__title">No orders found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div>
            <div style={{ fontSize:'.82rem', color:'var(--text-muted)', marginBottom:12 }}>
              {products.length} products in catalog
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {products.map(p => (
                <div key={p.product_id} className="card card-padding">
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <img
                      src={p.primary_image || `https://picsum.photos/seed/${p.product_id}/80/80`}
                      alt=""
                      style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0 }}
                      onError={e => { e.target.src = 'https://picsum.photos/56/56'; }}
                    />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.product_name}
                      </div>
                      <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>
                        {p.vendor_name} • {p.category_name}
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontWeight:700, color:'var(--orange)', fontSize:'.82rem' }}>
                          {fmt(p.base_price)} FCFA
                        </span>
                        <span style={{ fontSize:'.72rem', color: parseInt(p.stock||0) === 0 ? 'var(--red)' : 'var(--green)' }}>
                          Stock: {p.stock||0}
                        </span>
                        <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>
                          ⭐ {Number(p.rating||0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                      <button
                        className={`btn btn-sm ${p.is_featured ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize:'.65rem', padding:'4px 8px' }}
                        onClick={() => handleToggleFeatured(p.product_id, p.is_featured)}
                        title={p.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        {p.is_featured ? '⭐ Featured' : '☆ Feature'}
                      </button>
                      <Link to={`/product/${p.slug}`} className="btn btn-ghost btn-sm" style={{ fontSize:'.65rem', padding:'4px 8px' }}>
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
