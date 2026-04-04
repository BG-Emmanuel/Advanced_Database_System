import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import VisualSearchModal from '../components/common/VisualSearchModal';
import useVoiceSearch from '../hooks/useVoiceSearch';
import ProductCard, { ProductCardSkeleton } from '../components/common/ProductCard';
import { productAPI } from '../utils/api';

const SORTS = [
  { v:'created_at-DESC', l:'Newest' },
  { v:'price-ASC',       l:'Price ↑' },
  { v:'price-DESC',      l:'Price ↓' },
  { v:'rating-DESC',     l:'Top Rated' },
  { v:'sold-DESC',       l:'Best Selling' },
];

const MOCK_PRODUCTS = Array.from({ length:20 }, (_, i) => ({
  product_id:`s${i}`, slug:`search-product-${i}`,
  product_name:['Samsung A54','Nike Air Max','Casserole Inox','iPhone 15','Sac Cuir','Laptop HP','Ventilateur','Robe Wax','Poulet Frais','Table Basse','Montre Homme','Parfum','Bottes Pluie','Vélo','Mixer','TV 43"','Chaise Gaming','Tapis','Chaussures','Jacket Cuir'][i],
  base_price:[85000,45000,12500,320000,18000,180000,8500,22000,2500,35000,15000,28000,9500,75000,18000,125000,55000,40000,38000,65000][i],
  discount_price:[72000,null,null,295000,15000,null,null,null,null,30000,null,22000,null,null,null,110000,48000,null,null,null][i],
  rating:[4.5,4.2,4.8,4.9,4.6,4.1,3.9,4.3,4.0,4.7,3.8,4.4,4.1,4.6,4.2,4.8,4.3,4.5,4.0,3.7][i],
  review_count:[128,67,203,45,89,34,28,156,412,78,44,91,23,37,62,189,55,33,47,19][i],
  vendor_name:['TechCM','SneakersCM','MaisonPro','TechCM','ModeCM','TechCM','ElectroCM','AfriMode','FreshMarket','MaisonPro','LuxuryCM','BeautyCM','ModeCM','SportCM','CuisineCM','TechCM','GamingCM','MaisonPro','SportCM','ModeCM'][i],
  vendor_verified: i%3!==2, is_deal_of_day: i<4, primary_image:null, stock: i%5===0?0:10,
}));

export default function SearchPage() {
  const [showVisual, setShowVisual] = useState(false);
  const language = localStorage.getItem('buy237_lang') || 'en';
  const { isListening, transcript, isSupported: voiceSupported, isFinalResult, startListening, stopListening, reset: resetVoice } = useVoiceSearch(language);
  const [sp, setSp] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minP, setMinP] = useState(sp.get('min_price')||'');
  const [maxP, setMaxP] = useState(sp.get('max_price')||'');

  const q        = sp.get('q')        || '';
  const category = sp.get('category') || '';
  const sort     = sp.get('sort')     || 'created_at';
  const order    = sp.get('order')    || 'DESC';
  const minPrice = sp.get('min_price')|| '';
  const maxPrice = sp.get('max_price')|| '';
  const deal     = sp.get('deal')     || '';
  const featured = sp.get('featured') || '';
  const page     = parseInt(sp.get('page')||'1');

  // Auto-search when voice recognition completes
  React.useEffect(() => {
    if (isFinalResult && transcript.trim()) {
      stopListening();
      const p = new URLSearchParams(sp);
      p.set('q', transcript.trim());
      p.set('page', '1');
      setSp(p);
      resetVoice();
    }
  }, [isFinalResult, transcript, stopListening, resetVoice]);

  const setParam = (k, v) => { const p=new URLSearchParams(sp); v?p.set(k,v):p.delete(k); p.set('page','1'); setSp(p); };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:20, sort, order };
      if (q)        params.search   = q;
      if (category) params.category = category;
      if (minPrice) params.min_price= minPrice;
      if (maxPrice) params.max_price= maxPrice;
      if (deal)     params.deal     = deal;
      if (featured) params.featured = featured;
      const d = await productAPI.getAll(params);
      setProducts(d.products||[]);
      setPagination(d.pagination||{});
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [q,category,sort,order,minPrice,maxPrice,deal,featured,page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { productAPI.getCategories().then(d=>setCategories(d.categories||[])).catch(()=>{}); }, []);

  const applyPriceFilter = () => {
    const p = new URLSearchParams(sp);
    minP?p.set('min_price',minP):p.delete('min_price');
    maxP?p.set('max_price',maxP):p.delete('max_price');
    p.set('page','1'); setSp(p); setShowFilters(false);
  };

  const title = q ? `Results for "${q}"` : category ? (categories.find(c=>c.slug===category)?.name||'Products') : deal ? '🔥 Deals of the Day' : featured ? '⭐ Featured' : 'All Products';
  const currentSort = `${sort}-${order}`;
  const display = products.length ? products : MOCK_PRODUCTS;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <h1 style={{ fontSize:'1rem', fontWeight:800 }}>{title}</h1>
            {pagination.total>0 && <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:2 }}>{pagination.total} products</div>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>🎛️ Filters</button>
        </div>

        {/* Mobile voice + visual search strip */}
        <div style={{ display:'flex', gap:8, marginBottom:12, padding:'10px 12px', background:'white', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-sm)', alignItems:'center' }}>
          <div style={{ flex:1, fontSize:'.85rem', color: isListening ? 'var(--green)' : 'var(--text-muted)', fontStyle: isListening ? 'italic' : 'normal' }}>
            {isListening ? (language === 'fr' ? '🎤 Je vous écoute...' : '🎤 Listening...') : (q ? `Results: "${q}"` : 'Search products...')}
          </div>
          {voiceSupported && (
            <button
              onClick={() => isListening ? stopListening() : startListening()}
              style={{ background: isListening ? 'var(--red)' : 'var(--green-light)', border:'none', borderRadius:'var(--radius-sm)', padding:'8px 12px', cursor:'pointer', fontSize:'.85rem', color: isListening ? 'white' : 'var(--green)', fontWeight:600, display:'flex', alignItems:'center', gap:4, animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none' }}
              title={language === 'fr' ? 'Recherche vocale' : 'Voice search'}
            >
              {isListening ? '⏹ Stop' : '🎤 Voice'}
            </button>
          )}
          <button
            onClick={() => setShowVisual(true)}
            style={{ background:'var(--orange-light)', border:'none', borderRadius:'var(--radius-sm)', padding:'8px 12px', cursor:'pointer', fontSize:'.85rem', color:'var(--orange)', fontWeight:600 }}
            title={language === 'fr' ? 'Recherche par image' : 'Image search'}
          >
            📷 Image
          </button>
        </div>

        {showVisual && <VisualSearchModal onClose={() => setShowVisual(false)} />}

        {/* Sort */}}
        <div className="scroll-x" style={{ marginBottom:12, gap:6 }}>
          {SORTS.map(s => (
            <button key={s.v} className={`btn btn-sm ${currentSort===s.v?'btn-primary':'btn-ghost'}`}
              style={{ flexShrink:0, fontSize:'.75rem', padding:'6px 12px' }}
              onClick={() => { const [sv,so]=s.v.split('-'); const p=new URLSearchParams(sp); p.set('sort',sv); p.set('order',so); p.set('page','1'); setSp(p); }}>
              {s.l}
            </button>
          ))}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="scroll-x" style={{ marginBottom:12, gap:6 }}>
            <button className={`btn btn-sm ${!category?'btn-primary':'btn-ghost'}`} style={{ flexShrink:0 }} onClick={() => setParam('category','')}>All</button>
            {categories.map(cat => (
              <button key={cat.category_id} className={`btn btn-sm ${category===cat.slug?'btn-primary':'btn-ghost'}`}
                style={{ flexShrink:0, fontSize:'.75rem' }} onClick={() => setParam('category',cat.slug)}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Filters panel */}
        {showFilters && (
          <div className="card card-padding" style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:'.9rem', marginBottom:12 }}>Filter by Price (FCFA)</h3>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input className="form-control" type="number" placeholder="Min" value={minP} onChange={e=>setMinP(e.target.value)} style={{ flex:1 }} />
              <span>—</span>
              <input className="form-control" type="number" placeholder="Max" value={maxP} onChange={e=>setMaxP(e.target.value)} style={{ flex:1 }} />
              <button className="btn btn-primary btn-sm" onClick={applyPriceFilter}>Apply</button>
            </div>
            {(minPrice||maxPrice) && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop:8, fontSize:'.78rem' }}
                onClick={() => { setMinP(''); setMaxP(''); const p=new URLSearchParams(sp); p.delete('min_price'); p.delete('max_price'); setSp(p); }}>
                ✕ Clear price filter
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="product-grid">{Array.from({length:12},(_,i)=><ProductCardSkeleton key={i}/>)}</div>
        ) : display.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <div className="empty-state__title">No products found</div>
            <p className="empty-state__text">Try different keywords or filters</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop:16 }}>Back to Home</Link>
          </div>
        ) : (
          <div className="product-grid">{display.map(p=><ProductCard key={p.product_id} product={p}/>)}</div>
        )}

        {/* Pagination */}
        {pagination.pages>1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:24 }}>
            {page>1 && <button className="btn btn-ghost btn-sm" onClick={()=>setParam('page',page-1)}>← Prev</button>}
            <span style={{ padding:'8px 16px', fontSize:'.85rem', color:'var(--text-muted)' }}>Page {page} / {pagination.pages}</span>
            {page<pagination.pages && <button className="btn btn-primary btn-sm" onClick={()=>setParam('page',page+1)}>Next →</button>}
          </div>
        )}
      </div>
    </div>
  );
}
