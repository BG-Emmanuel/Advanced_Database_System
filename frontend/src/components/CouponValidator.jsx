import React, { useState } from 'react';

export default function CouponValidator({ onCouponApplied, orderTotal }) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.toUpperCase() })
      });
      const data = await response.json();
      if (!data.success) {
        setError('Invalid or expired coupon code');
        return;
      }
      const coupon = data.data;
      const discountAmount = (orderTotal * coupon.discount_percent) / 100;
      const newTotal = orderTotal - discountAmount;
      setAppliedCoupon(coupon);
      setSuccess(`Coupon applied! You save ${discountAmount.toFixed(0)} XAF`);
      if (onCouponApplied) {
        onCouponApplied({
          coupon,
          discountAmount,
          newTotal
        });
      }
    } catch (error) {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setSuccess('');
    setError('');
    if (onCouponApplied) {
      onCouponApplied(null);
    }
  };

  return (
    <div className="coupon-container">
      <h3>??? Apply Coupon</h3>

      {!appliedCoupon ? (
        <div className="coupon-input-group">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="coupon-input"
            disabled={loading}
          />
          <button
            onClick={validateCoupon}
            disabled={loading}
            className="btn-apply"
          >
            {loading ? 'Validating...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className="applied-coupon">
          <div className="coupon-badge">
            <span>?? {appliedCoupon.code}</span>
            <span className="discount-label">
              -{appliedCoupon.discount_percent}% OFF
            </span>
          </div>
          <button onClick={removeCoupon} className="btn-remove-coupon">
            Remove Coupon
          </button>
        </div>
      )}

      {error && (
        <div className="coupon-error">
          ? {error}
        </div>
      )}

      {success && (
        <div className="coupon-success">
          ? {success}
        </div>
      )}

      {appliedCoupon && orderTotal && (
        <div className="discount-summary">
          <div className="summary-row">
            <span>Original Total:</span>
            <span>{orderTotal} XAF</span>
          </div>
          <div className="summary-row discount">
            <span>Discount ({appliedCoupon.discount_percent}%):</span>
            <span>-{((orderTotal * appliedCoupon.discount_percent) / 100).toFixed(0)} XAF</span>
          </div>
          <div className="summary-row total">
            <strong>New Total:</strong>
            <strong>
              {(orderTotal - (orderTotal * appliedCoupon.discount_percent) / 100).toFixed(0)} XAF
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
