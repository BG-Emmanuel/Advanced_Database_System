import React, { useState, useEffect } from 'react';

export default function InventoryDashboard({ vendorId }) {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [restockAmount, setRestockAmount] = useState({});
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchAllInventory();
  }, [vendorId]);

  const fetchAllInventory = async () => {
    try {
      setLoading(true);
      const [invResponse, lowResponse, outResponse] = await Promise.all([
        fetch(`${API_URL}/inventory/vendor/${vendorId}`),
        fetch(`${API_URL}/inventory/vendor/${vendorId}/low-stock`),
        fetch(`${API_URL}/inventory/vendor/${vendorId}/out-of-stock`)
      ]);
      const invData = await invResponse.json();
      const lowData = await lowResponse.json();
      const outData = await outResponse.json();
      setInventory(invData.data || []);
      setLowStock(lowData.data || []);
      setOutOfStock(outData.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (productId) => {
    const amount = restockAmount[productId];
    if (!amount || amount <= 0) return;
    try {
      const response = await fetch(`${API_URL}/inventory/restock/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addQuantity: parseInt(amount) })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully restocked ${data.data.product_name}`);
        setRestockAmount({ ...restockAmount, [productId]: '' });
        fetchAllInventory();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error restocking:', error);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: '#ef4444' };
    if (quantity <= 5) return { label: 'Low Stock', color: '#f59e0b' };
    return { label: 'In Stock', color: '#10b981' };
  };

  const getCurrentList = () => {
    if (activeTab === 'low') return lowStock;
    if (activeTab === 'out') return outOfStock;
    return inventory;
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className="inventory-container">
      <h2>?? Inventory Management</h2>

      <div className="inventory-stats">
        <div className="stat-card">
          <h3>{inventory.length}</h3>
          <p>Total Products</p>
        </div>
        <div className="stat-card warning">
          <h3>{lowStock.length}</h3>
          <p>Low Stock</p>
        </div>
        <div className="stat-card danger">
          <h3>{outOfStock.length}</h3>
          <p>Out of Stock</p>
        </div>
      </div>

      {success && (
        <div className="success-message">? {success}</div>
      )}

      <div className="inventory-tabs">
        <button
          className={activeTab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('all')}
        >
          All Products ({inventory.length})
        </button>
        <button
          className={activeTab === 'low' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('low')}
        >
          Low Stock ({lowStock.length})
        </button>
        <button
          className={activeTab === 'out' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('out')}
        >
          Out of Stock ({outOfStock.length})
        </button>
      </div>

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Price</th>
              <th>Restock</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentList().length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No products found</td>
              </tr>
            ) : (
              getCurrentList().map(product => {
                const status = getStockStatus(product.stock_quantity);
                return (
                  <tr key={product.product_id}>
                    <td>{product.product_name}</td>
                    <td>{product.category_name}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td>{product.base_price} XAF</td>
                    <td>
                      <div className="restock-group">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={restockAmount[product.product_id] || ''}
                          onChange={(e) => setRestockAmount({
                            ...restockAmount,
                            [product.product_id]: e.target.value
                          })}
                          className="restock-input"
                        />
                        <button
                          onClick={() => handleRestock(product.product_id)}
                          className="btn-restock"
                        >
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
