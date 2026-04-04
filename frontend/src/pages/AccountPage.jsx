import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI, addressAPI } from '../utils/api';
import { fmt } from '../components/common/ProductCard';

export default function AccountPage() {
  const { user, logout, showNotification, setLanguage, language } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name:user?.full_name||'', phone:user?.phone||'' });
  const [passwords, setPasswords] = useState({ current_password:'', new_password:'', confirm:'' });
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    addressAPI.getAll().then(d=>setAddresses(d.addresses||[])).catch(()=>{});
  }, [user, navigate]);

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await authAPI.updateProfile(profile); showNotification({type:'success',message:'Profile updated!'}); }
    catch { showNotification({type:'error',message:'Update failed'}); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password!==passwords.confirm) { showNotification({type:'error',message:'Passwords do not match'}); return; }
    setSaving(true);
    try { await authAPI.changePassword({current_password:passwords.current_password,new_password:passwords.new_password}); showNotification({type:'success',message:'Password changed!'}); setPasswords({current_password:'',new_password:'',confirm:''}); }
    catch (err) { showNotification({type:'error',message:err.message||'Failed'}); }
    finally { setSaving(false); }
  };

  const deleteAddr = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try { await addressAPI.delete(id); setAddresses(a=>a.filter(x=>x.address_id!==id)); showNotification({type:'success',message:'Address deleted'}); }
    catch { showNotification({type:'error',message:'Failed to delete'}); }
  };

  if (!user) return null;

  const TABS = [
    {id:'profile',icon:'👤',label:'Profile'},
    {id:'addresses',icon:'📍',label:'Addresses'},
    {id:'security',icon:'🔒',label:'Security'},
    {id:'settings',icon:'⚙️',label:'Settings'},
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        {/* Profile header */}
        <div className="card card-padding" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--green)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-main)', flexShrink:0 }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{user.full_name}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'.82rem' }}>{user.email}</div>
              <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                {user.tier_name&&<span className="badge badge-green">{user.tier_name}</span>}
                {user.is_verified&&<span className="badge badge-green">✓ Verified</span>}
              </div>
            </div>
          </div>
          {user.lifetime_value>0&&(
            <div style={{ marginTop:12, padding:10, background:'var(--bg)', borderRadius:'var(--radius-sm)', fontSize:'.82rem', color:'var(--text-secondary)' }}>
              💎 Lifetime spent: <strong style={{ color:'var(--orange)' }}>{fmt(user.lifetime_value)} FCFA</strong>
              {user.discount_percentage>0&&<> • 🎁 {user.discount_percentage}% discount applied</>}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          {[
            {to:'/orders',icon:'📦',label:'My Orders'},
            {to:user.role==='vendor'?'/vendor/dashboard':'/vendor/register',icon:'🏪',label:user.role==='vendor'?'My Shop':'Sell Here'},
            {to:'/search',icon:'🔍',label:'Browse'},
          ].map(item=>(
            <Link key={item.to} to={item.to} className="card card-padding" style={{ textAlign:'center', display:'block' }}>
              <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{item.icon}</div>
              <div style={{ fontSize:'.75rem', fontWeight:600 }}>{item.label}</div>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="scroll-x" style={{ marginBottom:16, gap:6 }}>
          {TABS.map(t=>(
            <button key={t.id} className={`btn btn-sm ${tab===t.id?'btn-primary':'btn-ghost'}`} style={{ flexShrink:0 }} onClick={()=>setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab==='profile'&&(
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:16 }}>Edit Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Phone Number</label><input className="form-control" type="tel" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="+237 6XX XXX XXX"/></div>
              <div className="form-group"><label className="form-label">Email (cannot change)</label><input className="form-control" value={user.email} disabled style={{ opacity:.6 }}/></div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
            </form>
          </div>
        )}

        {/* Addresses tab */}
        {tab==='addresses'&&(
          <div>
            {addresses.length===0?(
              <div className="empty-state"><div className="empty-state__icon">📍</div><div className="empty-state__title">No addresses saved</div><Link to="/checkout" className="btn btn-primary" style={{ marginTop:16 }}>Add Address</Link></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {addresses.map(addr=>(
                  <div key={addr.address_id} className="card card-padding">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                          <span className="badge badge-green">{addr.label}</span>
                          {addr.is_default&&<span className="badge badge-orange">Default</span>}
                        </div>
                        <div style={{ fontWeight:600, fontSize:'.9rem' }}>{addr.recipient_name}</div>
                        <div style={{ fontSize:'.82rem', color:'var(--text-secondary)', marginTop:2 }}>{addr.neighborhood&&`${addr.neighborhood}, `}{addr.city}</div>
                        {addr.landmark&&<div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Near {addr.landmark}</div>}
                        <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>📞 {addr.phone}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={()=>deleteAddr(addr.address_id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security tab */}
        {tab==='security'&&(
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:16 }}>Change Password</h2>
            <form onSubmit={changePassword}>
              {[['current_password','Current Password'],['new_password','New Password'],['confirm','Confirm New Password']].map(([n,l])=>(
                <div key={n} className="form-group"><label className="form-label">{l}</label><input className="form-control" type="password" value={passwords[n]} onChange={e=>setPasswords(p=>({...p,[n]:e.target.value}))} required/></div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Changing...':'Change Password'}</button>
            </form>
          </div>
        )}

        {/* Settings tab */}
        {tab==='settings'&&(
          <div className="card card-padding">
            <h2 style={{ fontSize:'.95rem', marginBottom:16 }}>Settings</h2>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
              <div><div style={{ fontWeight:600, fontSize:'.9rem' }}>Language</div><div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>App display language</div></div>
              <select className="form-control" style={{ width:'auto' }} value={language} onChange={e=>setLanguage(e.target.value)}>
                <option value="en">English</option><option value="fr">Français</option>
              </select>
            </div>
            <div style={{ marginTop:24 }}>
              <button className="btn btn-danger btn-full" onClick={()=>{ logout(); navigate('/'); }}>🚪 Logout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
