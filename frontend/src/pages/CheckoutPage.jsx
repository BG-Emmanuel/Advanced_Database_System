import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { addressAPI, orderAPI } from '../utils/api';
import { fmt } from '../components/common/ProductCard';

const PAYMENTS = [
  { id:'mtn_momo',        label:'MTN Mobile Money',  icon:'📲', color:'#FFC72C', desc:'Pay with your MTN MoMo account',    recommended:true },
  { id:'orange_money',    label:'Orange Money',       icon:'🟠', color:'#FF6600', desc:'Pay with Orange Money' },
  { id:'cash_on_delivery',label:'Cash on Delivery',   icon:'💵', color:'#27AE60', desc:'Pay when your order arrives' },
  { id:'card',            label:'Bank Card',          icon:'💳', color:'#3498DB', desc:'Visa / Mastercard' },
];

export default function CheckoutPage() {
  const { cart, user, fetchCart, showNotification } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [zones, setZones]         = useState([]);
  const [selAddr, setSelAddr]     = useState(null);
  const [selPay, setSelPay]       = useState('mtn_momo');
  const [momoPhone, setMomoPhone] = useState(user?.phone||'');
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [newAddr, setNewAddr] = useState({ label:'Home', recipient_name:user?.full_name||'', phone:user?.phone||'', city:'', neighborhood:'', landmark:'', street_details:'', delivery_zone_id:'' });

  const items    = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const selectedZone = zones.find(z => { const a=addresses.find(x=>x.address_id===selAddr); return a && z.zone_id===a.delivery_zone_id; });
  const deliveryFee  = selectedZone?.base_fee || (subtotal>25000?0:1500);
  const total = subtotal + parseFloat(deliveryFee||0);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([addressAPI.getAll(), addressAPI.getZones()])
      .then(([a,z]) => { setAddresses(a.addresses||[]); setZones(z.zones||[]); const d=a.addresses?.find(x=>x.is_default); if(d) setSelAddr(d.address_id); })
      .catch(() => {});
  }, [user, navigate]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const d = await addressAPI.add({ ...newAddr, is_default: addresses.length===0 });
      setAddresses(p=>[...p,d.address]); setSelAddr(d.address.address_id); setShowAddAddr(false);
    } catch { showNotification({ type:'error', message:'Failed to save address' }); }
  };

  const handlePlaceOrder = async () => {
    if (!selAddr) { showNotification({ type:'warning', message:'Please select a delivery address' }); return; }
    setSubmitting(true);
    try {
      const data = await orderAPI.checkout({ address_id:selAddr, payment_method:selPay, notes:(selPay!=='cash_on_delivery'?`Mobile money: ${momoPhone}`:'') });
      await fetchCart();
      navigate(`/orders/${data.order.order_id}?success=1`);
    } catch (err) { showNotification({ type:'error', message:err.message||'Order failed. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  if (!items.length) return (
    <div className="page flex-center" style={{ flexDirection:'column', gap:16, paddingTop:60 }}>
      <div style={{ fontSize:'3rem' }}>🛒</div><h2>Your cart is empty</h2>
      <Link to="/" className="btn btn-primary">Start Shopping</Link>
    </div>
  );

  const STEP_LABELS = ['Address','Payment','Confirm'];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        <h1 style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:16 }}>Checkout</h1>

        {/* Step indicator */}
        <div style={{ display:'flex', marginBottom:20 }}>
          {STEP_LABELS.map((s,i) => (
            <React.Fragment key={s}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:i+1<step?'pointer':'default' }} onClick={() => i+1<step&&setStep(i+1)}>
                <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:i+1<=step?'var(--green)':'var(--border)', color:i+1<=step?'white':'var(--text-muted)', fontSize:'.8rem', fontWeight:700 }}>{i+1<step?'✓':i+1}</div>
                <span style={{ fontSize:'.7rem', fontWeight:600, color:i+1===step?'var(--green)':'var(--text-muted)' }}>{s}</span>
              </div>
              {i<2&&<div style={{ flex:1, height:2, background:i+1<step?'var(--green)':'var(--border)', alignSelf:'flex-start', marginTop:14 }}/>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display:'grid', gap:16, alignItems:'start' }}>
          <style>{`@media(min-width:768px){.co-layout{grid-template-columns:1fr 280px!important}}`}</style>
          <div className="co-layout" style={{ display:'grid', gap:16 }}>
            <div>
              {/* STEP 1 */}
              {step===1 && (
                <div className="card card-padding">
                  <h2 style={{ fontSize:'1rem', marginBottom:16 }}>📍 Delivery Address</h2>
                  {addresses.map(addr => (
                    <label key={addr.address_id} onClick={() => setSelAddr(addr.address_id)}
                      style={{ display:'flex', gap:12, padding:12, border:`1.5px solid ${selAddr===addr.address_id?'var(--green)':'var(--border)'}`, borderRadius:'var(--radius-sm)', cursor:'pointer', marginBottom:10, background:selAddr===addr.address_id?'var(--green-light)':'white' }}>
                      <span style={{ fontSize:'1rem', flexShrink:0 }}>{selAddr===addr.address_id?'🟢':'⚪'}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'.9rem' }}>{addr.label} — {addr.recipient_name}</div>
                        <div style={{ fontSize:'.82rem', color:'var(--text-secondary)', marginTop:3 }}>{addr.neighborhood&&`${addr.neighborhood}, `}{addr.city}{addr.landmark&&` (Near ${addr.landmark})`}</div>
                        <div style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>📞 {addr.phone}</div>
                        {addr.zone_name && <div style={{ fontSize:'.78rem', marginTop:4 }}>🚚 {addr.zone_name} • {fmt(addr.base_fee)} FCFA • {addr.estimated_days_min}-{addr.estimated_days_max} days</div>}
                      </div>
                    </label>
                  ))}
                  <button className="btn btn-outline btn-sm" style={{ marginTop:12 }} onClick={() => setShowAddAddr(!showAddAddr)}>+ Add New Address</button>
                  {showAddAddr && (
                    <form onSubmit={handleAddAddress} style={{ marginTop:16, padding:16, background:'var(--bg)', borderRadius:'var(--radius-sm)' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div className="form-group"><label className="form-label">Recipient Name *</label><input className="form-control" required value={newAddr.recipient_name} onChange={e=>setNewAddr(p=>({...p,recipient_name:e.target.value}))}/></div>
                        <div className="form-group"><label className="form-label">Phone *</label><input className="form-control" required value={newAddr.phone} onChange={e=>setNewAddr(p=>({...p,phone:e.target.value}))} placeholder="+237 6XX XXX XXX"/></div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div className="form-group"><label className="form-label">City *</label><input className="form-control" required value={newAddr.city} onChange={e=>setNewAddr(p=>({...p,city:e.target.value}))} placeholder="Yaoundé"/></div>
                        <div className="form-group"><label className="form-label">Neighborhood</label><input className="form-control" value={newAddr.neighborhood} onChange={e=>setNewAddr(p=>({...p,neighborhood:e.target.value}))} placeholder="Bastos..."/></div>
                      </div>
                      <div className="form-group"><label className="form-label">Landmark *</label><input className="form-control" required value={newAddr.landmark} onChange={e=>setNewAddr(p=>({...p,landmark:e.target.value}))} placeholder="Near Total Melen, Opposite..."/></div>
                      <div className="form-group">
                        <label className="form-label">Delivery Zone</label>
                        <select className="form-control" value={newAddr.delivery_zone_id} onChange={e=>setNewAddr(p=>({...p,delivery_zone_id:e.target.value}))}>
                          <option value="">Select zone</option>
                          {zones.map(z=><option key={z.zone_id} value={z.zone_id}>{z.zone_name} — {fmt(z.base_fee)} FCFA ({z.estimated_days_min}-{z.estimated_days_max} days)</option>)}
                        </select>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <button type="submit" className="btn btn-primary btn-sm">Save Address</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddAddr(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                  <button className="btn btn-primary btn-full" style={{ marginTop:20 }} onClick={() => { if(selAddr) setStep(2); else showNotification({type:'warning',message:'Select an address'}); }}>Continue to Payment →</button>
                </div>
              )}

              {/* STEP 2 */}
              {step===2 && (
                <div className="card card-padding">
                  <h2 style={{ fontSize:'1rem', marginBottom:16 }}>💳 Payment Method</h2>
                  <div style={{ background:'#FFF8E1', border:'1px solid #FFC72C', borderRadius:'var(--radius-sm)', padding:12, marginBottom:16, display:'flex', gap:8 }}>
                    <span>💡</span><div style={{ fontSize:'.82rem' }}><strong>Mobile Money Recommended</strong> — Fast, safe, works everywhere in Cameroon</div>
                  </div>
                  {PAYMENTS.map(pm => (
                    <label key={pm.id} onClick={() => setSelPay(pm.id)}
                      style={{ display:'flex', gap:12, alignItems:'center', padding:14, border:`1.5px solid ${selPay===pm.id?pm.color:'var(--border)'}`, borderRadius:'var(--radius-sm)', cursor:'pointer', marginBottom:10, background:selPay===pm.id?'#fffbf0':'white' }}>
                      <span style={{ fontSize:'1.4rem' }}>{pm.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'.9rem', display:'flex', alignItems:'center', gap:8 }}>{pm.label}{pm.recommended&&<span className="badge badge-green" style={{ fontSize:'.6rem' }}>Recommended</span>}</div>
                        <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{pm.desc}</div>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${selPay===pm.id?pm.color:'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {selPay===pm.id&&<div style={{ width:10, height:10, borderRadius:'50%', background:pm.color }}/>}
                      </div>
                    </label>
                  ))}
                  {(selPay==='mtn_momo'||selPay==='orange_money') && (
                    <div style={{ marginTop:16, padding:16, background:'var(--bg)', borderRadius:'var(--radius-sm)' }}>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">{selPay==='mtn_momo'?'MTN MoMo':'Orange Money'} Phone Number</label>
                        <input className="form-control" type="tel" value={momoPhone} onChange={e=>setMomoPhone(e.target.value)} placeholder="+237 6XX XXX XXX"/>
                        <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:4 }}>You will receive a payment prompt on this number</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:10, marginTop:20 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(3)}>Review Order →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step===3 && (
                <div className="card card-padding">
                  <h2 style={{ fontSize:'1rem', marginBottom:16 }}>✅ Review & Confirm</h2>
                  {(() => { const a=addresses.find(x=>x.address_id===selAddr); return a&&(
                    <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginBottom:12 }}>
                      <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginBottom:4 }}>DELIVERY ADDRESS</div>
                      <div style={{ fontSize:'.88rem' }}><strong>{a.recipient_name}</strong> • {a.phone}<br/>{a.neighborhood&&`${a.neighborhood}, `}{a.city}{a.landmark&&<><br/>Near {a.landmark}</>}</div>
                    </div>
                  ); })()}
                  <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginBottom:16 }}>
                    <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginBottom:4 }}>PAYMENT METHOD</div>
                    <div style={{ fontSize:'.88rem', fontWeight:600 }}>
                      {PAYMENTS.find(p=>p.id===selPay)?.icon} {PAYMENTS.find(p=>p.id===selPay)?.label}
                      {momoPhone&&(selPay==='mtn_momo'||selPay==='orange_money')&&<span style={{ color:'var(--text-muted)', fontWeight:400 }}> • {momoPhone}</span>}
                    </div>
                  </div>
                  {items.slice(0,3).map(item => (
                    <div key={item.cart_item_id} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8, fontSize:'.85rem' }}>
                      <img src={item.product_image||'https://picsum.photos/seed/p/50/50'} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:6 }} onError={e=>{e.target.src='https://picsum.photos/40/40';}}/>
                      <div style={{ flex:1 }}><div style={{ fontWeight:600 }}>{item.product_name}</div><div style={{ color:'var(--text-muted)' }}>Qty: {item.quantity}</div></div>
                      <div style={{ fontWeight:700 }}>{fmt(item.unit_price*item.quantity)} FCFA</div>
                    </div>
                  ))}
                  {items.length>3&&<div style={{ fontSize:'.8rem', color:'var(--text-muted)', marginBottom:8 }}>+{items.length-3} more items</div>}
                  <div style={{ display:'flex', gap:10, marginTop:20 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                    <button className="btn btn-secondary" style={{ flex:1, fontSize:'1rem' }} onClick={handlePlaceOrder} disabled={submitting}>
                      {submitting?<><div className="spinner spinner-sm"/>Placing Order...</>:`🛒 Place Order • ${fmt(total)} FCFA`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar summary */}
            <div style={{ order:-1 }}>
              <style>{`@media(min-width:768px){.co-sidebar{order:1!important}}`}</style>
              <div className="co-sidebar card card-padding">
                <h3 style={{ fontSize:'.95rem', marginBottom:12 }}>Order Total</h3>
                <div style={{ fontSize:'.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0' }}><span>Subtotal</span><span>{fmt(subtotal)} FCFA</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0' }}><span>Delivery</span><span style={{ color:deliveryFee===0?'var(--green)':'inherit' }}>{deliveryFee===0?'FREE':`${fmt(deliveryFee)} FCFA`}</span></div>
                  <div className="divider"/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1rem' }}><span>Total</span><span style={{ color:'var(--orange)' }}>{fmt(total)} FCFA</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
