import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Notification from './components/common/Notification';
import './styles/global.css';

// Pages
import HomePage             from './pages/HomePage';
import SearchPage           from './pages/SearchPage';
import ProductDetailPage    from './pages/ProductDetailPage';
import CartPage             from './pages/CartPage';
import CheckoutPage         from './pages/CheckoutPage';
import { OrdersPage, OrderDetailPage } from './pages/OrdersPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import ResetPasswordPage    from './pages/ResetPasswordPage';
import AccountPage          from './pages/AccountPage';
import VendorDashboardPage  from './pages/VendorDashboardPage';
import VendorRegisterPage   from './pages/VendorRegisterPage';
import VendorPublicPage     from './pages/VendorPublicPage';
import AdminDashboardPage   from './pages/AdminDashboardPage';
import VendorChatPage       from './pages/VendorChatPage';
import WishlistPage          from './pages/WishlistPage';

// ─── Route Guards ────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading } = useApp();
  if (isLoading) return (
    <div className="flex-center" style={{ height:'100vh' }}>
      <div className="spinner"/>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// ─── Layout wrapper (header + bottom nav) ────────────────────────────────────

const Layout = ({ children }) => (
  <>
    <Header/>
    <main>{children}</main>
    <BottomNav/>
    <Notification/>
  </>
);

// ─── Routes ──────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isLoading } = useApp();

  if (isLoading) return (
    <div className="flex-center" style={{ height:'100vh', flexDirection:'column', gap:16, background:'var(--bg)' }}>
      <div style={{ fontFamily:'var(--font-main)', fontSize:'2.5rem', display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ color:'white', background:'var(--green)', padding:'6px 10px', borderRadius:8 }}>Buy</span>
        <span style={{ color:'var(--orange)', fontWeight:800 }}>237</span>
        <span>🇨🇲</span>
      </div>
      <div className="spinner"/>
      <div style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>Loading...</div>
    </div>
  );

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"               element={<Layout><HomePage/></Layout>}/>
      <Route path="/search"         element={<Layout><SearchPage/></Layout>}/>
      <Route path="/product/:slug"  element={<Layout><ProductDetailPage/></Layout>}/>
      <Route path="/cart"           element={<Layout><CartPage/></Layout>}/>
      <Route path="/vendor/:id"     element={<Layout><VendorPublicPage/></Layout>}/>

      {/* ── Auth (no layout) ── */}
      <Route path="/login"            element={<LoginPage/>}/>
      <Route path="/register"         element={<RegisterPage/>}/>
      <Route path="/forgot-password"  element={<ForgotPasswordPage/>}/>
      <Route path="/reset-password"   element={<ResetPasswordPage/>}/>

      {/* ── Protected (requires login) ── */}
      <Route path="/checkout"   element={<ProtectedRoute><Layout><CheckoutPage/></Layout></ProtectedRoute>}/>
      <Route path="/orders"     element={<ProtectedRoute><Layout><OrdersPage/></Layout></ProtectedRoute>}/>
      <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetailPage/></Layout></ProtectedRoute>}/>
      <Route path="/account"    element={<ProtectedRoute><Layout><AccountPage/></Layout></ProtectedRoute>}/>

      {/* ── Vendor (requires vendor or admin role) ── */}
      <Route path="/vendor/register"  element={<ProtectedRoute><Layout><VendorRegisterPage/></Layout></ProtectedRoute>}/>
      <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor','admin']}><Layout><VendorDashboardPage/></Layout></ProtectedRoute>}/>

      {/* ── Admin only ── */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboardPage/></Layout></ProtectedRoute>}/>
      <Route path="/chat/:vendorId" element={<Layout><VendorChatPage/></Layout>}/>
      <Route path="/wishlist" element={<Layout><WishlistPage/></Layout>}/>

      {/* ── 404 ── */}
      <Route path="*" element={
        <Layout>
          <div className="page flex-center" style={{ flexDirection:'column', gap:16, paddingTop:80 }}>
            <div style={{ fontSize:'4rem' }}>🔍</div>
            <h1 style={{ fontSize:'1.3rem' }}>Page Not Found</h1>
            <p style={{ color:'var(--text-muted)', fontSize:'.9rem' }}>The page you're looking for doesn't exist.</p>
            <a href="/" className="btn btn-primary" style={{ marginTop:8 }}>Go to Homepage</a>
          </div>
        </Layout>
      }/>
    </Routes>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes/>
      </AppProvider>
    </BrowserRouter>
  );
}
