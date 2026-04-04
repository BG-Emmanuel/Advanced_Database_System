import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAPI, productAPI, chatAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../components/common/ProductCard';

const MOCK_DASH = {
  stats:{ total_orders:142, total_revenue:4850000, total_products:28, avg_rating:4.6, pending_orders:5, delivered_orders:128 },
  recent_orders:[
    { order_number:'B237-001', status:'pending',  total_amount:85000, customer_name:'Jean Paul',   product_name:'Samsung A54',   quantity:1, created_at:new Date().toISOString() },
    { order_number:'B237-002', status:'shipped',  total_amount:45000, customer_name:'Marie Claire',product_name:'Nike Air Max',  quantity:2, created_at:new Date().toISOString() },
    { order_number:'B237-003', status:'delivered',total_amount:22000, customer_name:'Pierre',      product_name:'Casserole Inox',quantity:1, created_at:new Date().toISOString() },
  ],
  top_products:[
    { product_name:'Samsung Galaxy A54', total_sold:56, rating:4.5, base_price:85000, stock:12 },
    { product_name:'iPhone 15 Case',    total_sold:112,rating:4.8, base_price:5000,  stock:34 },
  ],
  monthly_revenue:[
    {month:'Aug 2024',revenue:420000},{month:'Sep 2024',revenue:580000},{month:'Oct 2024',revenue:720000},
    {month:'Nov 2024',revenue:890000},{month:'Dec 2024',revenue:1100000},{month:'Jan 2025',revenue:850000},
  ],
};

const MOCK_PRODUCTS = [
  { product_id:'1', product_name:'Samsung Galaxy A54 5G', slug:'samsung-a54', base_price:85000, discount_price:72000, is_available:true, rating:4.5, review_count:128, total_sold:56, stock:12, category_name:'Electronics', primary_image:null },
  { product_id:'2', product_name:'iPhone 15 Clear Case',  slug:'iphone-case', base_price:5000,  discount_price:null,  is_available:true, rating:4.8, review_count:45,  total_sold:112,stock:0,  category_name:'Electronics', primary_image:null },
];

const STATUS_MAP = {
  pending:{c:'status-pending',l:'⏳ Pending'}, confirmed:{c:'status-confirmed',l:'✅ Confirmed'},
  shipped:{c:'status-shipped',l:'🚚 Shipped'}, delivered:{c:'status-delivered',l:'📦 Delivered'},
  cancelled:{c:'status-cancelled',l:'❌ Cancelled'},
};

export default function VendorDashboardPage() {
  const { user, showNotification } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [inbox, setInbox] = useState([]);
  const [dash, setDash] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newP, setNewP] = useState({ product_name:'', description:'', base_price:'', discount_price:'', category_id:'', initial_stock:10, images:[{url:''}] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role!=='vendor'&&user.role!=='admin') { navigate('/vendor/register'); return; }
    Promise.all([vendorAPI.getDashboard(), vendorAPI.getProducts(), productAPI.getCategories(), chatAPI.getVendorInbox().catch(() => ({ chats: [] }))])
      .then(([d,p,c,ch]) => { setDash(d); setProducts(p.products||[]); setCategories(c.categories||[]); setInbox((ch||{}).chats||[]); })
      .catch(() => { setDash(MOCK_DASH); setProducts(MOCK_PRODUCTS); })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const toggleProduct = async (id, avail) => {
    try { await productAPI.update(id,{is_available:!avail}); setProducts(ps=>ps.map(p=>p.product_id===id?{...p,is_available:!avail}:p)); showNotification({type:'success',message:avail?'Product hidden':'Product listed'}); }
    catch { showNotification({type:'error',message:'Failed'}); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await productAPI.create({ ...newP, base_price:parseFloat(newP.base_price), discount_price:newP.discount_price?parseFloat(newP.discount_price):null, initial_stock:parseInt(newP.initial_stock), images:newP.images.filter(i=>i.url) });
      showNotification({type:'success',message:'Product added!'}); setShowAdd(false);
      vendorAPI.getProducts().then(d=>setProducts(d.products||[]));
    } catch (err) { showNotification({type:'error',message:err.message||'Failed to add product'}); }
    finally { setSaving(false); }
  };

  const s  = dash?.stats||{};
  const maxR = Math.max(...(dash?.monthly_revenue?.map(m=>m.revenue)||[1]));

  if (loading) return <div className="page flex-center"><div className="spinner"/></div>;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h1 style={{ fontSize:'1.1rem', fontWeight:800 }}>🏪 Vendor Dashboard</h1>
          <button className="btn btn-primary btn-sm" onClick={()=>{setTab('products');setShowAdd(true);}}>+ Add Product</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[{id:'overview',i:'📊',l:'Overview'},{id:'products',i:'📦',l:'Products'},{id:'orders',i:'🛒',l:'Orders'}].map(t=>(
            <button key={t.id} className={`btn btn-sm ${tab===t.id?'btn-primary':'btn-ghost'}`} onClick={()=>setTab(t.id)}>{t.i} {t.l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
              {[
                {i:'💰',l:'Total Revenue',v:`${fmt(s.total_revenue||0)} FCFA`,c:'var(--orange)'},
                {i:'📦',l:'Total Orders',v:s.total_orders||0,c:'var(--green)'},
                {i:'🏪',l:'Products',v:s.total_products||0,c:'var(--text-primary)'},
                {i:'⭐',l:'Avg Rating',v:Number(s.avg_rating||0).toFixed(1),c:'#856400'},
              ].map(st=>(
                <div key={st.l} className="card card-padding" style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{st.i}</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:800, color:st.c, fontFamily:'var(--font-main)' }}>{st.v}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>{st.l}</div>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            <div className="card card-padding" style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:'.95rem', marginBottom:16 }}>📈 Monthly Revenue (FCFA)</h2>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120, padding:'0 4px' }}>
                {dash?.monthly_revenue?.map((m,i)=>(
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:'.6rem', color:'var(--text-muted)', fontWeight:600 }}>{fmt(m.revenue/1000)}k</div>
                    <div style={{ width:'100%', background:'var(--green)', borderRadius:'4px 4px 0 0', height:`${Math.max(8,(m.revenue/maxR)*80)}px`, opacity:i===dash.monthly_revenue.length-1?1:0.7 }}/>
                    <div style={{ fontSize:'.6rem', color:'var(--text-muted)', textAlign:'center', whiteSpace:'nowrap' }}>{m.month.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="card card-padding" style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:'.95rem', marginBottom:12 }}>🔥 Top Selling Products</h2>
              {dash?.top_products?.map((p,i)=>(
                <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'8px 0', borderBottom:i<dash.top_products.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:800, color:'var(--green)' }}>{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>⭐ {Number(p.rating).toFixed(1)} • {p.total_sold} sold</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:700, color:'var(--orange)', fontSize:'.85rem' }}>{fmt(p.base_price)} FCFA</div>
                    <div style={{ fontSize:'.72rem', color:p.stock===0?'var(--red)':'var(--text-muted)' }}>Stock: {p.stock}</div>
                  </div>
                </div>
              ))}
            </div>

            {s.pending_orders>0&&(
              <div style={{ background:'#FFF8E1', border:'1px solid #FFC72C', borderRadius:'var(--radius-md)', padding:14, display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:'1.3rem' }}>⏳</span>
                <div><strong>{s.pending_orders} pending order{s.pending_orders>1?'s':''}</strong> need your attention
                  <div><button className="btn btn-sm btn-ghost" style={{ marginTop:6, padding:'4px 10px', fontSize:'.78rem' }} onClick={()=>setTab('orders')}>View Orders →</button></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {tab==='products'&&(
          <div>
            {showAdd&&(
              <div className="card card-padding" style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:'.95rem', marginBottom:16 }}>Add New Product</h2>
                <form onSubmit={handleAddProduct}>
                  <div className="form-group"><label className="form-label">Product Name *</label><input className="form-control" required value={newP.product_name} onChange={e=>setNewP(p=>({...p,product_name:e.target.value}))} placeholder="e.g. Samsung Galaxy A54 5G"/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group"><label className="form-label">Price (FCFA) *</label><input className="form-control" type="number" required value={newP.base_price} onChange={e=>setNewP(p=>({...p,base_price:e.target.value}))} placeholder="85000"/></div>
                    <div className="form-group"><label className="form-label">Sale Price (FCFA)</label><input className="form-control" type="number" value={newP.discount_price} onChange={e=>setNewP(p=>({...p,discount_price:e.target.value}))} placeholder="Optional"/></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="form-group"><label className="form-label">Category *</label>
                      <select className="form-control" required value={newP.category_id} onChange={e=>setNewP(p=>({...p,category_id:e.target.value}))}>
                        <option value="">Select category</option>
                        {categories.map(c=><option key={c.category_id} value={c.category_id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Initial Stock</label><input className="form-control" type="number" value={newP.initial_stock} onChange={e=>setNewP(p=>({...p,initial_stock:e.target.value}))}/></div>
                  </div>
                  <div className="form-group"><label className="form-label">Image URL</label><input className="form-control" value={newP.images[0]?.url||''} onChange={e=>setNewP(p=>({...p,images:[{url:e.target.value}]}))} placeholder="https://..."/></div>
                  <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={newP.description} onChange={e=>setNewP(p=>({...p,description:e.target.value}))} placeholder="Describe your product..." style={{ resize:'vertical' }}/></div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Adding...':'Add Product'}</button>
                    <button type="button" className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            {products.length===0?(
              <div className="empty-state"><div className="empty-state__icon">📦</div><div className="empty-state__title">No products yet</div><button className="btn btn-primary" style={{ marginTop:16 }} onClick={()=>setShowAdd(true)}>Add Your First Product</button></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {products.map(p=>(
                  <div key={p.product_id} className="card card-padding">
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <img src={p.primary_image||`https://picsum.photos/seed/${p.product_id}/80/80`} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, flexShrink:0 }} onError={e=>{e.target.src='https://picsum.photos/60/60';}}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:'.88rem' }}>{p.product_name}</div>
                        <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{p.category_name} • ⭐ {Number(p.rating).toFixed(1)} ({p.review_count})</div>
                        <div style={{ fontSize:'.8rem', fontWeight:700, color:'var(--orange)', marginTop:2 }}>{fmt(p.base_price)} FCFA</div>
                        <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                          <span style={{ fontSize:'.72rem', color:p.stock===0?'var(--red)':'var(--green)' }}>{p.stock===0?'⚠ Out of stock':`✓ Stock: ${p.stock}`}</span>
                          <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>Sold: {p.total_sold}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                        <button className={`btn btn-sm ${p.is_available?'btn-outline':'btn-primary'}`} style={{ fontSize:'.72rem', padding:'5px 10px' }} onClick={()=>toggleProduct(p.product_id,p.is_available)}>{p.is_available?'Hide':'List'}</button>
                        <Link to={`/product/${p.slug}`} className="btn btn-ghost btn-sm" style={{ fontSize:'.72rem', padding:'5px 10px' }}>View</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INBOX */}
        {tab==='inbox'&&(
          <div>
            {inbox.length===0?(
              <div className="empty-state"><div className="empty-state__icon">💬</div><div className="empty-state__title">No messages yet</div><p className="empty-state__text">When buyers chat with you, messages will appear here</p></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {inbox.map((c,i)=>(
                  <div key={i} className="card card-padding" style={{ cursor:'pointer', borderLeft: c.unread_count>0 ? '3px solid var(--green)' : '3px solid transparent' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'.9rem', display:'flex', alignItems:'center', gap:8 }}>
                          👤 {c.buyer_name}
                          {c.unread_count>0 && <span style={{ background:'var(--green)', color:'white', borderRadius:10, padding:'2px 8px', fontSize:'.65rem', fontWeight:800 }}>{c.unread_count} new</span>}
                        </div>
                        {c.buyer_phone && <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>📞 {c.buyer_phone}</div>}
                        {c.last_message && <div style={{ fontSize:'.8rem', color:'var(--text-secondary)', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>💬 {c.last_message}</div>}
                      </div>
                      <div style={{ fontSize:'.72rem', color:'var(--text-muted)', flexShrink:0, marginLeft:8 }}>
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : 'No messages'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab==='orders'&&(
          <div>
            {!dash?.recent_orders?.length?(
              <div className="empty-state"><div className="empty-state__icon">🛒</div><div className="empty-state__title">No orders yet</div></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {dash.recent_orders.map((o,i)=>{
                  const st = STATUS_MAP[o.status]||{c:'badge-gray',l:o.status};
                  return (
                    <div key={i} className="card card-padding">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'.88rem' }}>{o.order_number}</div>
                          <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{o.customer_name} • {o.product_name} × {o.quantity}</div>
                          <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:800, color:'var(--orange)', fontFamily:'var(--font-main)', fontSize:'.9rem' }}>{fmt(o.total_amount)} FCFA</div>
                          <span className={`badge ${st.c}`} style={{ marginTop:4 }}>{st.l}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
