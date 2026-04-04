import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = sp.get('token');

  const [form, setForm]       = useState({ new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new password reset.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.new_password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: form.new_password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ background:'white', borderRadius:'var(--radius-lg)', padding:'32px 24px', width:'100%', maxWidth:420, boxShadow:'var(--shadow-lg)' }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, textDecoration:'none' }}>
          <span style={{ fontFamily:'var(--font-main)', fontSize:'1.6rem', fontWeight:800, color:'white', background:'var(--green)', padding:'4px 8px', borderRadius:6 }}>Buy</span>
          <span style={{ fontFamily:'var(--font-main)', fontSize:'1.6rem', fontWeight:800, color:'var(--orange)', marginLeft:2 }}>237</span>
          <span style={{ fontSize:'1.2rem', marginLeft:4 }}>🇨🇲</span>
        </Link>

        {done ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>✅</div>
            <h2 style={{ marginBottom:8 }}>Password Reset!</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'.88rem', marginBottom:16 }}>
              Your password has been changed. Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-primary btn-full">Login Now</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize:'1.3rem', textAlign:'center', marginBottom:6 }}>Set New Password</h1>
            <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.88rem', marginBottom:24 }}>
              Enter your new password below
            </p>

            {error && (
              <div style={{ background:'var(--red-light)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'.85rem', color:'var(--red)', marginBottom:16 }}>
                ❌ {error}
                {!token && (
                  <div style={{ marginTop:8 }}>
                    <Link to="/forgot-password" style={{ color:'var(--green)', fontWeight:600 }}>Request new reset link →</Link>
                  </div>
                )}
              </div>
            )}

            {token && !error && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <div style={{ position:'relative' }}>
                    <input
                      className="form-control"
                      type={showPw ? 'text' : 'password'}
                      required
                      value={form.new_password}
                      onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
                      placeholder="At least 6 characters"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat your password"
                  />
                </div>

                {/* Password strength indicator */}
                {form.new_password && (
                  <div style={{ marginTop:-8, marginBottom:12 }}>
                    {(() => {
                      const len = form.new_password.length;
                      const hasNum = /\d/.test(form.new_password);
                      const hasUpper = /[A-Z]/.test(form.new_password);
                      const strength = len >= 10 && hasNum && hasUpper ? 3 : len >= 8 ? 2 : len >= 6 ? 1 : 0;
                      const labels = ['Too short', 'Weak', 'Good', 'Strong'];
                      const colors = ['var(--red)', 'var(--orange)', '#F59E0B', 'var(--green)'];
                      return (
                        <div>
                          <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                            {[0,1,2].map(i => (
                              <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i < strength ? colors[strength] : 'var(--border)' }}/>
                            ))}
                          </div>
                          <span style={{ fontSize:'.75rem', color: colors[strength] }}>{labels[strength]}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !token}>
                  {loading ? <><div className="spinner spinner-sm"/>Resetting...</> : 'Set New Password'}
                </button>
              </form>
            )}

            <div style={{ marginTop:20, textAlign:'center', fontSize:'.85rem', color:'var(--text-muted)' }}>
              <Link to="/login" style={{ color:'var(--green)', fontWeight:600 }}>← Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
