import React, { useState } from 'react';

export default function ProductComparison() {
  const [productIds, setProductIds] = useState(['', '']);
  const [comparison, setComparison] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleCompare = async () => {
    const validIds = productIds.filter(id => id.trim() !== '');
    if (validIds.length < 2) {
      setError('Please enter at least 2 product IDs to compare');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [compResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/comparison/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: validIds })
        }),
        fetch(`${API_URL}/comparison/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: validIds })
        })
      ]);
      const compData = await compResponse.json();
      const summaryData = await summaryResponse.json();
      setComparison(compData.data);
      setSummary(summaryData.data);
    } catch (error) {
      setError('Failed to compare products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addProductField = () => {
    if (productIds.length < 4) {
      setProductIds([...productIds, '']);
    }
  };

  const updateProductId = (index, value) => {
    const updated = [...productIds];
    updated[index] = value;
    setProductIds(updated);
  };

  const removeProductField = (index) => {
    if (productIds.length > 2) {
      setProductIds(productIds.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="comparison-container">
      <h2>?? Compare Products</h2>
      <p>Compare up to 4 products side by side</p>

      <div className="comparison-inputs">
        {productIds.map((id, index) => (
          <div key={index} className="input-group">
            <input
              type="text"
              placeholder={`Product ${index + 1} ID`}
              value={id}
              onChange={(e) => updateProductId(index, e.target.value)}
              className="product-id-input"
            />
            {productIds.length > 2 && (
              <button
                onClick={() => removeProductField(index)}
                className="btn-remove"
              >
                ?
              </button>
            )}
          </div>
        ))}

        {productIds.length < 4 && (
          <button onClick={addProductField} className="btn-add">
            + Add Product
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        onClick={handleCompare}
        disabled={loading}
        className="btn-compare"
      >
        {loading ? 'Comparing...' : 'Compare Products'}
      </button>

      {summary && (
        <div className="comparison-summary">
          <h3>?? Summary</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <span>?? Cheapest</span>
              <p>{summary.cheapest?.product_name}</p>
            </div>
            <div className="summary-card">
              <span>? Highest Rated</span>
              <p>{summary.highest_rated?.product_name}</p>
            </div>
            <div className="summary-card">
              <span>?? Most Reviewed</span>
              <p>{summary.most_reviewed?.product_name}</p>
            </div>
            <div className="summary-card">
              <span>?? Best In Stock</span>
              <p>{summary.best_in_stock?.product_name}</p>
            </div>
          </div>
        </div>
      )}

      {comparison && comparison.length > 0 && (
        <div className="comparison-table-wrapper">
          <h3>Detailed Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {comparison.map(product => (
                  <th key={product.product_id}>{product.product_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Price</td>
                {comparison.map(product => (
                  <td key={product.product_id}>
                    {product.discount_price || product.base_price} XAF
                  </td>
                ))}
              </tr>
              <tr>
                <td>Rating</td>
                {comparison.map(product => (
                  <td key={product.product_id}>? {product.rating || 'N/A'}</td>
                ))}
              </tr>
              <tr>
                <td>Reviews</td>
                {comparison.map(product => (
                  <td key={product.product_id}>{product.review_count || 0}</td>
                ))}
              </tr>
              <tr>
                <td>In Stock</td>
                {comparison.map(product => (
                  <td key={product.product_id}>{product.stock_quantity || 0}</td>
                ))}
              </tr>
              <tr>
                <td>Category</td>
                {comparison.map(product => (
                  <td key={product.product_id}>{product.category_name}</td>
                ))}
              </tr>
              <tr>
                <td>Vendor</td>
                {comparison.map(product => (
                  <td key={product.product_id}>{product.vendor_name}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
