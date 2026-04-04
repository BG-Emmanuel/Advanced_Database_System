import React, { useState, useRef, useEffect } from 'react';
import VisualSearchModal from '../common/VisualSearchModal';
import useVoiceSearch from '../../hooks/useVoiceSearch';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { user, cart, logout, setLanguage, language } = useApp();
  const [q, setQ] = useState('');
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const { isListening, transcript, isSupported: voiceSupported, isFinalResult, startListening, stopListening, reset: resetVoice } = useVoiceSearch(language);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const cartCount = cart?.item_count || 0;

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auto-fill input and search when voice recognition gets final result
  useEffect(() => {
    if (isFinalResult && transcript.trim()) {
      setQ(transcript.trim());
      stopListening();
      navigate(`/search?q=${encodeURIComponent(transcript.trim())}`);
      resetVoice();
    }
  }, [isFinalResult, transcript, stopListening, resetVoice, navigate]);

  // Keep input in sync with voice transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setQ(transcript);
    }
  }, [isListening, transcript]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <style>{`
        .header{position:sticky;top:0;z-index:100;background:var(--green);height:var(--header-height);box-shadow:0 2px 8px rgba(0,0,0,.15)}
        .header__inner{display:flex;align-items:center;gap:10px;height:100%}
        .header__logo{display:flex;align-items:center;flex-shrink:0;text-decoration:none}
        .logo-buy{font-family:var(--font-main);font-size:1.4rem;font-weight:800;color:white}
        .logo-237{font-family:var(--font-main);font-size:1.4rem;font-weight:800;color:var(--yellow)}
        .logo-dot{font-size:1rem;margin-left:2px}
        .header__search{flex:1;display:flex;background:white;border-radius:var(--radius-sm);overflow:hidden;max-width:600px}
        .header__search input{flex:1;padding:9px 12px;border:none;font-size:.9rem;background:transparent;min-width:0}
        .header__search button{padding:8px 14px;background:var(--orange);border:none;cursor:pointer;font-size:1rem}
        .header__search button:hover{background:#e55f00}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .header__actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .header__lang{background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3);border-radius:4px;padding:5px 8px;font-size:.75rem;font-weight:700;cursor:pointer;display:none}
        @media(min-width:480px){.header__lang{display:block}}
        .header__cart{position:relative;color:white;padding:6px;display:flex;align-items:center;font-size:1.3rem}
        .header__cart-badge{position:absolute;top:-2px;right:-2px;background:var(--orange);color:white;font-size:.6rem;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:var(--font-main)}
        .header__account{position:relative}
        .header__avatar{width:34px;height:34px;border-radius:50%;background:var(--yellow);color:var(--text-primary);font-weight:800;font-family:var(--font-main);display:flex;align-items:center;justify-content:center;font-size:.95rem;cursor:pointer;border:none}
        .header__dropdown{position:absolute;top:calc(100% + 10px);right:0;background:white;border-radius:var(--radius-md);box-shadow:var(--shadow-lg);min-width:220px;overflow:hidden;border:1px solid var(--border);z-index:200}
        .header__dropdown-user{padding:14px 16px;background:var(--green-light)}
        .header__dropdown-name{font-weight:700;font-size:.95rem}
        .header__dropdown-email{font-size:.78rem;color:var(--text-muted);margin-top:2px}
        .header__dropdown-divider{height:1px;background:var(--border)}
        .header__dropdown-item{display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:.88rem;color:var(--text-primary);text-decoration:none;transition:background .15s;width:100%;border:none;background:none;cursor:pointer;font-family:inherit}
        .header__dropdown-item:hover{background:var(--bg)}
        .header__dropdown-logout{color:var(--red)}
        .header__login-btn{font-size:.8rem!important;padding:8px 14px!important}
      `}</style>
      <header className="header">
        <div className="header__inner container">
          <Link to="/" className="header__logo">
            <span className="logo-buy">Buy</span>
            <span className="logo-237">237</span>
            <span className="logo-dot">🇨🇲</span>
          </Link>

          <form className="header__search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={
                isListening
                  ? (language === 'fr' ? '🎤 Je vous écoute...' : '🎤 Listening...')
                  : (language === 'fr' ? 'Rechercher...' : 'Search products...')
              }
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ fontStyle: isListening ? 'italic' : 'normal', color: isListening ? 'var(--green)' : 'inherit' }}
            />
            {/* Voice search button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={() => { isListening ? stopListening() : startListening(); }}
                title={language === 'fr' ? 'Recherche vocale' : 'Voice search'}
                style={{
                  padding: '8px 10px',
                  background: isListening ? 'var(--red)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                  animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {isListening ? '⏹️' : '🎤'}
              </button>
            )}
            {/* Visual search button */}
            <button
              type="button"
              onClick={() => setShowVisualSearch(true)}
              title={language === 'fr' ? 'Recherche par image' : 'Search by image'}
              style={{ padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              📷
            </button>
            <button type="submit" style={{ padding: '8px 14px', background: 'var(--orange)', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🔍</button>
          </form>

          {/* Visual Search Modal */}
          {showVisualSearch && <VisualSearchModal onClose={() => setShowVisualSearch(false)} />}

          <div className="header__actions">
            <button className="header__lang" onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}>
              {language === 'en' ? 'FR' : 'EN'}
            </button>

            <Link to="/cart" className="header__cart">
              <span>🛒</span>
              {cartCount > 0 && <span className="header__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>

            {user ? (
              <div className="header__account" ref={menuRef}>
                <button className="header__avatar" onClick={() => setMenuOpen(!menuOpen)}>
                  {user.full_name?.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="header__dropdown">
                    <div className="header__dropdown-user">
                      <div className="header__dropdown-name">{user.full_name}</div>
                      <div className="header__dropdown-email">{user.email}</div>
                    </div>
                    <div className="header__dropdown-divider" />
                    <Link to="/account"  className="header__dropdown-item" onClick={() => setMenuOpen(false)}>👤 My Account</Link>
                    <Link to="/orders"   className="header__dropdown-item" onClick={() => setMenuOpen(false)}>📦 My Orders</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="header__dropdown-item" onClick={() => setMenuOpen(false)}>⚙️ Admin Dashboard</Link>
                    )}
                    {(user.role === 'vendor' || user.role === 'admin') && (
                      <Link to="/vendor/dashboard" className="header__dropdown-item" onClick={() => setMenuOpen(false)}>🏪 Vendor Dashboard</Link>
                    )}
                    <div className="header__dropdown-divider" />
                    <button className="header__dropdown-item header__dropdown-logout" onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm header__login-btn">
                {language === 'fr' ? 'Connexion' : 'Login'}
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
