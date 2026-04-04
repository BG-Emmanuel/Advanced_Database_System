import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const BottomNav = () => {
  const { cart, user } = useApp();
  const cartCount = cart?.item_count || 0;

  const items = [
    { to: '/',          icon: '🏠', label: 'Home',    exact: true },
    { to: '/search',    icon: '🔍', label: 'Search' },
    { to: '/cart',      icon: '🛒', label: 'Cart',    badge: cartCount },
    { to: '/wishlist',  icon: '❤️', label: 'Wishlist' },
    { to: user ? '/account' : '/login', icon: '👤', label: user ? 'Account' : 'Login' },
  ];

  return (
    <>
      <style>{`
        .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:var(--bottom-nav);background:white;display:flex;align-items:center;box-shadow:0 -2px 12px rgba(0,0,0,.1);z-index:99;border-top:1px solid var(--border)}
        @media(min-width:768px){.bottom-nav{display:none}}
        .bottom-nav__item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 0;color:var(--text-muted);text-decoration:none;transition:color .2s}
        .bottom-nav__item.active{color:var(--green)}
        .bottom-nav__icon{position:relative;font-size:1.3rem;line-height:1}
        .bottom-nav__badge{position:absolute;top:-5px;right:-8px;background:var(--orange);color:white;font-size:.55rem;font-weight:800;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px;font-family:var(--font-main)}
        .bottom-nav__label{font-size:.65rem;font-weight:600;font-family:var(--font-main)}
      `}</style>
      <nav className="bottom-nav">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
            <span className="bottom-nav__icon">
              {item.icon}
              {item.badge > 0 && <span className="bottom-nav__badge">{item.badge > 9 ? '9+' : item.badge}</span>}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default BottomNav;
