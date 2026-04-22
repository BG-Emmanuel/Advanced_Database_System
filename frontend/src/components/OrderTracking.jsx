import React, { useState, useEffect } from 'react';

export default function OrderTracking({ userId }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchUserOrders();
  }, [userId]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/order-tracking/user/${userId}`);
      const data = await response.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(orderId);
      const response = await fetch(`${API_URL}/order-tracking/${orderId}/status`);
      const data = await response.json();
      setOrderDetails(data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const response = await fetch(`${API_URL}/order-tracking/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o =>
          o.order_id === orderId ? { ...o, status: 'cancelled' } : o
        ));
        if (selectedOrder === orderId) {
          setOrderDetails({ ...orderDetails, status: 'cancelled' });
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusSteps = (status) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) return <div className="loading">Loading your orders...</div>;

  return (
    <div className="order-tracking-container">
      <h2>?? My Orders</h2>

      <div className="orders-layout">
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>You have no orders yet</p>
              <a href="/">Start Shopping</a>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.order_id}
                className={`order-card ${selectedOrder === order.order_id ? 'selected' : ''}`}
                onClick={() => fetchOrderDetails(order.order_id)}
              >
                <div className="order-card-header">
                  <span className="order-id">
                    #{order.order_id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="order-card-body">
                  <p>{order.item_count} items</p>
                  <p className="order-amount">{order.total_amount} XAF</p>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrder(order.order_id);
                    }}
                    className="btn-cancel"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {selectedOrder && (
          <div className="order-details">
            {detailLoading ? (
              <div className="loading">Loading details...</div>
            ) : orderDetails ? (
              <>
                <h3>Order Details</h3>
                <div className="status-tracker">
                  {getStatusSteps(orderDetails.status).map(({ step, completed, current }) => (
                    <div
                      key={step}
                      className={`status-step ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}
                    >
                      <div className="step-dot" />
                      <span>{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-items-list">
                  <h4>Items Ordered</h4>
                  {orderDetails.items && orderDetails.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.product_name}</span>
                      <span>x{item.quantity}</span>
                      <span>{item.total_price} XAF</span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <strong>Total: {orderDetails.total_amount} XAF</strong>
                </div>
                <div className="delivery-address">
                  <h4>Delivery Address</h4>
                  <p>{orderDetails.delivery_address}</p>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
