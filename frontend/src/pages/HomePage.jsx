import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/common/ProductCard';
import { productAPI } from '../utils/api';

const BANNERS = [
  { bg:'linear-gradient(135deg,#0B8F4D,#06592f)', title:'Shop Everything Cameroonian', sub:'Best prices, fast delivery nationwide', cta:'Shop Now', link:'/search', emoji:'🇨🇲' },
  { bg:'linear-gradient(135deg,#FF6B00,#cc4400)', title:'Pay with Mobile Money',        sub:'MTN MoMo & Orange Money accepted everywhere', cta:'See Deals', link:'/search?deal=true', emoji:'📱' },
  { bg:'linear-gradient(135deg,#1565C0,#0d47a1)', title:'Deals of the Day',             sub:'Up to 60% off selected products', cta:'Grab Now', link:'/search?deal=true', emoji:'🔥' },
];

const MOCK = Array.from({ length:10 }, (_, i) => ({
  product_id:`m${i}`, slug:`product-${i}`,
  product_name:['Samsung Galaxy A54','Nike Air Max','Casserole Inox 5L','iPhone 15 Pro','Sac Cuir','Laptop HP','Ventilateur USB','Robe Africaine','Poulet Frais','TV 43"'][i],
  base_price:[85000,45000,12500,320000,18000,180000,8500,22000,2500,125000][i],
  discount_price:[72000,null,null,295000,15000,null,null,null,null,110000][i],
  rating:[4.5,4.2,4.8,4.9,4.6,4.1,3.9,4.3,4.0,4.8][i],
  review_count:[128,67,203,45,89,34,28,156,412,189][i],
  vendor_name:['TechCM','SneakersCM','MaisonPro','TechCM','ModeCM','TechCM','ElectroCM','AfriMode','FreshMarket','TechCM'][i],
  vendor_verified: i%2===0, is_deal_of_day: i<3, primary_image:null, stock:i===5?0:10,
}));

const DEFAULT_CATS = [
  {category_id:1,name:'Electronics',slug:'electronics',icon:'📱'},
  {category_id:2,name:'Fashion',slug:'fashion',icon:'👗'},
  {category_id:3,name:'Home',slug:'home-living',icon:'🏠'},
  {category_id:4,name:'Food',slug:'food-groceries',icon:'🛒'},
  {category_id:5,name:'Beauty',slug:'health-beauty',icon:'💄'},
  {category_id:6,name:'Agriculture',slug:'agriculture',icon:'🌱'},
  {category_id:7,name:'Cars',slug:'automotive',icon:'🚗'},
  {category_id:8,name:'Sports',slug:'sports-outdoors',icon:'⚽'},
  {category_id:9,name:'Books',slug:'books-education',icon:'📚'},
  {category_id:10,name:'Kids',slug:'baby-kids',icon:'🧸'},
];

export default function HomePage() {
  const [cur, setCur] = useState(0);
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals]   = useState([]);
  const [newArr, setNewArr] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCur(c => (c+1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      productAPI.getCategories(),
      productAPI.getAll({ featured:'true', limit:10 }),
      productAPI.getAll({ deal:'true', limit:8 }),
      productAPI.getAll({ sort:'created_at', order:'DESC', limit:10 }),
    ]).then(([c,f,d,n]) => {
      setCats(c.categories||[]); setFeatured(f.products||[]); setDeals(d.products||[]); setNewArr(n.products||[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const b = BANNERS[cur];
  const displayCats  = cats.length     ? cats     : DEFAULT_CATS;
  const displayDeals = deals.length    ? deals    : MOCK.slice(0,6);
  const displayFeat  = featured.length ? featured : MOCK;
  const displayNew   = newArr.length   ? newArr   : MOCK.slice(2);

  return (
    <div className="page" style={{ paddingTop:0 }}>
      {/* Banner */}
      <div style={{ background:b.bg, minHeight:160, display:'flex', flexDirection:'column', justifyContent:'center', padding:'20px 16px 40px', position:'relative', overflow:'hidden', transition:'background .5s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, maxWidth:'var(--max-width)', margin:'0 auto', width:'100%' }}>
          <span style={{ fontSize:'3rem', flexShrink:0 }}>{b.emoji}</span>
          <div>
            <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'white', marginBottom:6, fontFamily:'var(--font-main)' }}>{b.title}</h2>
            <p style={{ fontSize:'.85rem', color:'rgba(255,255,255,.88)', marginBottom:14 }}>{b.sub}</p>
            <Link to={b.link} style={{ display:'inline-block', background:'white', color:'var(--green)', padding:'8px 20px', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'.88rem', fontFamily:'var(--font-main)' }}>{b.cta} →</Link>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
          {BANNERS.map((_,i) => <button key={i} onClick={() => setCur(i)} style={{ width:8, height:8, borderRadius:'50%', background:i===cur?'white':'rgba(255,255,255,.4)', border:'none', cursor:'pointer', padding:0 }} />)}
        </div>
      </div>

      <div className="container">
        {/* Categories */}
        <div className="scroll-x" style={{ marginTop:16 }}>
          {displayCats.map(cat => (
            <Link key={cat.category_id} to={`/search?category=${cat.slug}`}
              style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'white', borderRadius:'var(--radius-md)', padding:'10px 14px', minWidth:70, boxShadow:'var(--shadow-sm)', textDecoration:'none', transition:'var(--transition)' }}>
              <span style={{ fontSize:'1.4rem' }}>{cat.icon||'📦'}</span>
              <span style={{ fontSize:'.68rem', fontWeight:600, color:'var(--text-secondary)', textAlign:'center', whiteSpace:'nowrap', fontFamily:'var(--font-main)' }}>{cat.name}</span>
            </Link>
          ))}
        </div>

        {/* MoMo Promo */}
        <div style={{ background:'linear-gradient(135deg,#FFC72C,#FF9500)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginTop:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:'1.8rem', flexShrink:0 }}>📲</span>
          <div style={{ flex:1 }}>
            <strong style={{ fontSize:'.9rem', fontFamily:'var(--font-main)', color:'#1A1A1A' }}>Pay with Mobile Money</strong>
            <div style={{ fontSize:'.78rem', color:'#333' }}>MTN MoMo & Orange Money accepted everywhere</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <span className="momo-badge">MTN MoMo</span>
            <span className="orange-money-badge">Orange</span>
          </div>
        </div>

        {/* Deals */}
        <section style={{ marginTop:20 }}>
          <div className="section-title"><h2>🔥 Deals of the Day</h2><Link to="/search?deal=true">See all</Link></div>
          <div className="product-grid">
            {loading ? [1,2,3,4].map(i=><ProductCardSkeleton key={i}/>) : displayDeals.map(p=><ProductCard key={p.product_id} product={p}/>)}
          </div>
        </section>

        {/* Trust badges */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginTop:16 }}>
          {[['✅','Verified Vendors'],['🚚','Fast Delivery'],['🔒','Secure Payment'],['↩️','Easy Returns']].map(([ic,tx]) => (
            <div key={tx} style={{ background:'white', borderRadius:'var(--radius-sm)', padding:12, display:'flex', alignItems:'center', gap:8, boxShadow:'var(--shadow-sm)' }}>
              <span style={{ fontSize:'1.2rem' }}>{ic}</span>
              <span style={{ fontSize:'.78rem', fontWeight:600, fontFamily:'var(--font-main)', color:'var(--text-secondary)' }}>{tx}</span>
            </div>
          ))}
        </div>

        {/* Featured */}
        <section style={{ marginTop:20 }}>
          <div className="section-title"><h2>⭐ Featured Products</h2><Link to="/search?featured=true">See all</Link></div>
          <div className="product-grid">
            {loading ? [1,2,3,4,5,6].map(i=><ProductCardSkeleton key={i}/>) : displayFeat.map(p=><ProductCard key={p.product_id} product={p}/>)}
          </div>
        </section>

        {/* New Arrivals */}
        <section style={{ marginTop:20 }}>
          <div className="section-title"><h2>🆕 New Arrivals</h2><Link to="/search">See all</Link></div>
          <div className="product-grid">
            {loading ? [1,2,3,4].map(i=><ProductCardSkeleton key={i}/>) : displayNew.map(p=><ProductCard key={p.product_id} product={p}/>)}
          </div>
        </section>

        {/* Vendor CTA */}
        <div style={{ background:'linear-gradient(135deg,var(--green),var(--green-dark))', borderRadius:'var(--radius-md)', padding:20, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:20, marginBottom:16 }}>
          <div>
            <h3 style={{ color:'white', fontSize:'1rem', fontFamily:'var(--font-main)' }}>🏪 Sell on Buy237</h3>
            <p style={{ color:'rgba(255,255,255,.85)', fontSize:'.8rem', marginTop:4 }}>Reach millions of customers across Cameroon</p>
          </div>
          <Link to="/vendor/register" className="btn btn-secondary btn-sm">Start Selling</Link>
        </div>
      </div>
    </div>
  );
}
