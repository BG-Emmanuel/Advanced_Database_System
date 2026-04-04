import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../../utils/api';

/**
 * VisualSearchModal
 * 
 * Allows users to:
 * 1. Upload a photo from their gallery
 * 2. Take a photo with their camera (mobile)
 * 3. See detected labels + matching products
 * 4. Navigate to full search results filtered by visual match
 */
const VisualSearchModal = ({ onClose }) => {
  const navigate = useNavigate();
  const fileInputRef  = useRef(null);
  const cameraInputRef = useRef(null);

  const [step, setStep]       = useState('select');   // select | preview | searching | results | error
  const [preview, setPreview] = useState(null);        // base64 preview URL
  const [file, setFile]       = useState(null);        // File object
  const [results, setResults] = useState(null);        // { products, analysis }
  const [error, setError]     = useState('');

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image too large. Please use an image under 10MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target.result); setStep('preview'); };
    reader.readAsDataURL(f);
    setError('');
  };

  const doSearch = async () => {
    if (!file) return;
    setStep('searching');
    setError('');
    try {
      const response = await searchAPI.visual(file);

      if (response.success && response.products.length > 0) {
        setResults(response);
        setStep('results');
      } else {
        setResults(response);
        setStep('results');
      }
    } catch (err) {
      setError(err.message || 'Visual search failed. Please try a different image.');
      setStep('error');
    }
  };

  const handleViewAll = () => {
    if (!results?.analysis?.detected_labels?.length) return;
    const query = results.analysis.detected_labels.slice(0, 3).join(' ');
    const cat   = results.analysis.category_hint || '';
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}${cat ? `&category=${cat}` : ''}`);
  };

  const reset = () => {
    setStep('select'); setPreview(null); setFile(null); setResults(null); setError('');
  };

  const fmt = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n));

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>🔍 Search by Image</h2>
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Take or upload a photo to find similar products
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* ── STEP: SELECT ── */}
        {step === 'select' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {/* Camera button */}
              <button
                className="btn btn-ghost"
                style={{ flexDirection: 'column', gap: 8, padding: 24, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', height: 130 }}
                onClick={() => cameraInputRef.current?.click()}
              >
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Take Photo</span>
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Use camera</span>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

              {/* Upload button */}
              <button
                className="btn btn-ghost"
                style={{ flexDirection: 'column', gap: 8, padding: 24, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', height: 130 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ fontSize: '2rem' }}>🖼️</span>
                <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Upload Photo</span>
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>From gallery</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
            </div>

            {/* How it works */}
            <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>💡 How it works</div>
              {[
                'Take or upload a photo of any product',
                'Our AI analyzes what\'s in the image',
                'We find similar products on Buy237',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Example use cases */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                Try it with:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['👟 A shoe you like', '📱 A phone you want', '👗 A dress you saw', '🏠 Furniture you want'].map(ex => (
                  <span key={ex} style={{ background: 'var(--bg)', borderRadius: 20, padding: '4px 10px', fontSize: '.72rem', color: 'var(--text-secondary)' }}>
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, color: 'var(--red)', fontSize: '.82rem', background: 'var(--red-light)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                ❌ {error}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && preview && (
          <div>
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16 }}>
              <img src={preview} alt="Search" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: '#f0f0f0' }} />
              <button
                onClick={reset}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>Change Image</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={doSearch}>
                🔍 Search for This
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: SEARCHING ── */}
        {step === 'searching' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔍</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Analyzing your image...</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>Our AI is identifying what's in your photo</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {['Detecting objects', 'Matching products', 'Ranking results'].map((s, i) => (
                <span key={s} style={{ fontSize: '.7rem', background: 'var(--green-light)', color: 'var(--green)', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: RESULTS ── */}
        {step === 'results' && results && (
          <div>
            {/* Analysis summary */}
            {results.analysis?.detected_labels?.length > 0 && (
              <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>
                  🤖 AI detected in your image:
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {results.analysis.detected_labels.slice(0, 8).map(label => (
                    <span key={label} style={{ background: 'white', borderRadius: 20, padding: '3px 8px', fontSize: '.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {label}
                    </span>
                  ))}
                </div>
                {results.analysis.detected_colors?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Colors:</span>
                    {results.analysis.detected_colors.map(c => (
                      <span key={c} style={{ fontSize: '.72rem', background: 'white', borderRadius: 4, padding: '2px 6px' }}>
                        🎨 {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Product results */}
            {results.products?.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state__icon">😕</div>
                <div className="empty-state__title">No matches found</div>
                <p className="empty-state__text">
                  {results.fallback ? 'Try a clearer image or search by text.' : 'No products match this image yet. Vendors are adding products daily!'}
                </p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={reset}>Try Another Image</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 700 }}>
                    {results.products.length} matching product{results.products.length > 1 ? 's' : ''} found
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '.72rem' }} onClick={reset}>New Search</button>
                </div>

                {/* Product list */}
                <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.products.slice(0, 8).map(p => (
                    <div
                      key={p.product_id}
                      style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', padding: 8, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                      onClick={() => { onClose(); navigate(`/product/${p.slug}`); }}
                    >
                      <img
                        src={p.primary_image || `https://picsum.photos/seed/${p.product_id}/80/80`}
                        alt={p.product_name}
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        onError={e => { e.target.src = 'https://picsum.photos/60/60'; }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.product_name}
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                          {p.vendor_name} {p.vendor_verified ? '✓' : ''}
                          {p.category_name && ` • ${p.category_name}`}
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--orange)', fontFamily: 'var(--font-main)', fontSize: '.9rem', marginTop: 2 }}>
                          {fmt(p.discount_price || p.base_price)} FCFA
                          {p.discount_price && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.75rem', textDecoration: 'line-through', marginLeft: 6 }}>{fmt(p.base_price)}</span>}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
                    </div>
                  ))}
                </div>

                {results.products.length > 8 && (
                  <button className="btn btn-outline btn-full" style={{ marginTop: 12 }} onClick={handleViewAll}>
                    View All {results.products.length} Results →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>😕</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Search Failed</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={reset}>Try Again</button>
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSearchModal;
