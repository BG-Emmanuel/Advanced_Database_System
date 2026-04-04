import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function VendorRegisterPage() {
  const { user, showNotification } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ shop_name:'', shop_description:'', city:'Yaoundé', address:'', phone:user?.phone||'', whatsapp:'' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  if (!user) { navigate('/login'); return null; }
  if (user.role==='vendor') { navigate('/vendor/dashboard'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.shop_name.trim()) errs.shop_name = 'Shop name is required';
    if (!form.phone.trim())     errs.phone     = 'Phone number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await vendorAPI.register(form);
      showNotification({ type:'success', message:'🎉 Your shop is live!' });
      navigate('/vendor/dashboard');
    } catch (err) { setErrors({ general: err.message||'Failed to create shop' }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ background:'white', borderRadius:'var(--radius-lg)', padding:'32px 24px', width:'100%', maxWidth:480, boxShadow:'var(--shadow-lg)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🏪</div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:800 }}>Start Selling on Buy237</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'.88rem', marginTop:6 }}>Reach millions of customers across Cameroon</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
          {[['📱','Mobile-first'],['💰','MoMo payments'],['🚀','Easy setup']].map(([ic,tx])=>(
            <div key={ic} style={{ textAlign:'center', padding:12, background:'var(--green-light)', borderRadius:'var(--radius-sm)' }}>
              <div style={{ fontSize:'1.2rem' }}>{ic}</div>
              <div style={{ fontSize:'.72rem', fontWeight:600, color:'var(--green)', marginTop:4 }}>{tx}</div>
            </div>
          ))}
        </div>

        {errors.general&&<div style={{ background:'var(--red-light)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'.85rem', color:'var(--red)', marginBottom:16 }}>{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Shop Name *</label>
            <input className={`form-control ${errors.shop_name?'error':''}`} value={form.shop_name} onChange={e=>setForm(p=>({...p,shop_name:e.target.value}))} placeholder="e.g. TechCM Store"/>
            {errors.shop_name&&<div className="form-error">{errors.shop_name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Shop Description</label>
            <textarea className="form-control" rows={2} value={form.shop_description} onChange={e=>setForm(p=>({...p,shop_description:e.target.value}))} placeholder="What do you sell?" style={{ resize:'vertical' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <select className="form-control" value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}>
                {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua','Maroua','Ngaoundéré','Bertoua','Ebolowa','Kribi'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className={`form-control ${errors.phone?'error':''}`} type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+237 6XX XXX XXX"/>
              {errors.phone&&<div className="form-error">{errors.phone}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp (for customer chat)</label>
            <input className="form-control" type="tel" value={form.whatsapp} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))} placeholder="+237 6XX XXX XXX"/>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
            {saving?<><div className="spinner spinner-sm"/>Creating Shop...</>:'🚀 Create My Shop'}
          </button>
        </form>
        <div style={{ marginTop:16, fontSize:'.75rem', color:'var(--text-muted)', textAlign:'center' }}>Free to start • No monthly fees • Only pay per successful sale</div>
      </div>
    </div>
  );
}
