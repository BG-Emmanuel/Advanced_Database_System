import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI } from '../utils/api';

const GOOGLE_SCRIPT_ID = 'buy237-google-identity-script';

const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  const existing = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existing) {
    existing.addEventListener('load', () => resolve());
    existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
    return;
  }
  const script = document.createElement('script');
  script.id = GOOGLE_SCRIPT_ID;
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Failed to load Google script'));
  document.head.appendChild(script);
});

function GoogleAuthButton({ onCredential, disabled }) {
  const ref = React.useRef(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured.');
      return;
    }

    let active = true;
    loadGoogleScript()
      .then(() => {
        if (!active || !ref.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });
        if (ref.current) {
          // Safe DOM manipulation (SECURITY FIX: was using innerHTML = '')
          while (ref.current.firstChild) ref.current.removeChild(ref.current.firstChild);
        }
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          width: 340,
        });
      })
      .catch(() => setError('Unable to load Google sign-in.'));

    return () => { active = false; };
  }, [onCredential]);

  if (error) return <div style={{ fontSize:'.8rem', color:'var(--text-muted)', textAlign:'center' }}>{error}</div>;

  return (
    <div style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div ref={ref} style={{ display:'flex', justifyContent:'center' }}/>
    </div>
  );
}

const AuthShell = ({ children, title, subtitle }) => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
    <div style={{ background:'white', borderRadius:'var(--radius-lg)', padding:'32px 24px', width:'100%', maxWidth:420, boxShadow:'var(--shadow-lg)' }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, textDecoration:'none' }}>
        <span style={{ fontFamily:'var(--font-main)', fontSize:'1.6rem', fontWeight:800, color:'white', background:'var(--green)', padding:'4px 8px', borderRadius:6 }}>Buy</span>
        <span style={{ fontFamily:'var(--font-main)', fontSize:'1.6rem', fontWeight:800, color:'var(--orange)', marginLeft:2 }}>237</span>
        <span style={{ fontSize:'1.2rem', marginLeft:4 }}>🇨🇲</span>
      </Link>
      <h1 style={{ fontSize:'1.3rem', textAlign:'center', marginBottom:6 }}>{title}</h1>
      <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.88rem', marginBottom:24 }}>{subtitle}</p>
      {children}
    </div>
  </div>
);

export function LoginPage() {
  const { login, loginWithGoogle, showNotification } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      showNotification({ type:'success', message:'Welcome back!' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credential) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      showNotification({ type:'success', message:'Logged in with Google' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Login to your Buy237 account">
      {error && <div style={{ background:'var(--red-light)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'.85rem', color:'var(--red)', marginBottom:16 }}>❌ {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-control" type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email:e.target.value }))} placeholder="you@example.com" autoComplete="email"/>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position:'relative' }}>
            <input className="form-control" type={showPw?'text':'password'} required value={form.password}
              onChange={e => setForm(p => ({ ...p, password:e.target.value }))} placeholder="Your password"
              style={{ paddingRight:44 }} autoComplete="current-password"/>
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div style={{ textAlign:'right', marginTop:-8, marginBottom:16 }}>
          <Link to="/forgot-password" style={{ fontSize:'.82rem', color:'var(--green)' }}>Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <><div className="spinner spinner-sm"/>Logging in...</> : 'Login'}
        </button>
      </form>
      <div style={{ margin:'16px 0', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        <span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>or</span>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>
      <GoogleAuthButton onCredential={handleGoogle} disabled={loading}/>
      <div style={{ marginTop:20, textAlign:'center', fontSize:'.85rem', color:'var(--text-muted)' }}>
        Don't have an account? <Link to="/register" style={{ color:'var(--green)', fontWeight:600 }}>Sign up free</Link>
      </div>
      <div style={{ marginTop:14, background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, textAlign:'center', fontSize:'.82rem', color:'var(--text-secondary)' }}>
        🔒 Safe & Secure • Your data is protected
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, showNotification } = useApp();
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', password:'', confirm:'', preferred_language:'en' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())       e.full_name = 'Name is required';
    if (!form.email.includes('@'))    e.email     = 'Valid email required';
    if (form.password.length < 6)    e.password  = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      await authAPI.register({ full_name:form.full_name, email:form.email, phone:form.phone||undefined, password:form.password, preferred_language:form.preferred_language });
      await login(form.email, form.password);
      showNotification({ type:'success', message:'Account created! Welcome to Buy237 🎉' });
      navigate('/');
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed' });
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credential) => {
    setErrors({});
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      showNotification({ type:'success', message:'Google account linked successfully 🎉' });
      navigate('/');
    } catch (err) {
      setErrors({ general: err.message || 'Google sign-up failed' });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ name, label, type='text', placeholder, required=true }) => (
    <div className="form-group">
      <label className="form-label">{label}{required ? ' *' : ''}</label>
      <input className={`form-control ${errors[name] ? 'error' : ''}`} type={type}
        value={form[name]} onChange={e => setForm(p => ({ ...p, [name]:e.target.value }))} placeholder={placeholder}/>
      {errors[name] && <div className="form-error">{errors[name]}</div>}
    </div>
  );

  return (
    <AuthShell title="Create Account" subtitle="Join millions of shoppers on Buy237">
      {errors.general && <div style={{ background:'var(--red-light)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'.85rem', color:'var(--red)', marginBottom:16 }}>❌ {errors.general}</div>}
      <form onSubmit={handleSubmit}>
        <F name="full_name" label="Full Name"         placeholder="Jean Paul Atangana"/>
        <F name="email"     label="Email"             type="email"    placeholder="you@example.com"/>
        <F name="phone"     label="Phone Number"      type="tel"      placeholder="+237 6XX XXX XXX" required={false}/>
        <F name="password"  label="Password"          type="password" placeholder="At least 6 characters"/>
        <F name="confirm"   label="Confirm Password"  type="password" placeholder="Repeat your password"/>
        <div className="form-group">
          <label className="form-label">Preferred Language</label>
          <select className="form-control" value={form.preferred_language} onChange={e => setForm(p => ({ ...p, preferred_language:e.target.value }))}>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <><div className="spinner spinner-sm"/>Creating Account...</> : 'Create Account'}
        </button>
      </form>
      <div style={{ margin:'16px 0', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        <span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>or</span>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>
      <GoogleAuthButton onCredential={handleGoogle} disabled={loading}/>
      <div style={{ marginTop:20, textAlign:'center', fontSize:'.85rem', color:'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color:'var(--green)', fontWeight:600 }}>Login</Link>
      </div>
      <div style={{ marginTop:14, fontSize:'.75rem', color:'var(--text-muted)', textAlign:'center' }}>
        By creating an account, you agree to our Terms of Service.
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = await authAPI.forgotPassword({ email });
      setSent(true);
      if (data.dev_reset_token) setDevToken(data.dev_reset_token);
    } catch { setSent(true); /* always show success */ }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email to receive a reset link">
      {!sent ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><div className="spinner spinner-sm"/>Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📧</div>
          <h3 style={{ marginBottom:8 }}>Check your email</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'.88rem', marginBottom:16 }}>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
          </p>
          {devToken && (
            <div style={{ background:'#FFF8E1', border:'1px solid #FFC72C', borderRadius:'var(--radius-sm)', padding:12, fontSize:'.78rem', textAlign:'left', marginBottom:16 }}>
              <strong>🛠 Dev Mode Token:</strong>
              <div style={{ wordBreak:'break-all', marginTop:4, fontFamily:'monospace', fontSize:'.72rem' }}>{devToken}</div>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop:20, textAlign:'center', fontSize:'.85rem', color:'var(--text-muted)' }}>
        <Link to="/login" style={{ color:'var(--green)', fontWeight:600 }}>← Back to Login</Link>
      </div>
    </AuthShell>
  );
}
