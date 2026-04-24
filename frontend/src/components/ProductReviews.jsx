import React, { useState, useEffect } from 'react';

export default function ProductReviews({ productId, userId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchReviews();
    fetchSummary();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reviews/product/${productId}`);
      const data = await response.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/product/${productId}/summary`);
      const data = await response.json();
      setSummary(data.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      setError('Please write a comment');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const response = await fetch(`${API_URL}/reviews/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Review submitted successfully!');
        setNewReview({ rating: 5, comment: '' });
        setShowForm(false);
        fetchReviews();
        fetchSummary();
      }
    } catch (error) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setReviews(reviews.filter(r => r.review_id !== reviewId));
      fetchSummary();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return [1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
        onClick={() => interactive && setNewReview({ ...newReview, rating: star })}
      >
        ?
      </span>
    ));
  };

  return (
    <div className="reviews-container">
      <h2>Customer Reviews</h2>

      {summary && (
        <div className="reviews-summary">
          <div className="average-rating">
            <span className="big-rating">{Number(summary.average_rating).toFixed(1)}</span>
            <div className="stars-display">
              {renderStars(Math.round(summary.average_rating))}
            </div>
            <span>{summary.total_reviews} reviews</span>
          </div>
          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="rating-bar">
                <span>{star}?</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: summary.total_reviews > 0
                        ? `${(summary[`${['one','two','three','four','five'][star-1]}_star`] / summary.total_reviews) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <span>{summary[`${['one','two','three','four','five'][star-1]}_star`]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {userId && (
        <div className="add-review-section">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-write-review">
              ?? Write a Review
            </button>
          ) : (
            <div className="review-form">
              <h3>Write Your Review</h3>
              <div className="rating-selector">
                <label>Your Rating:</label>
                <div className="interactive-stars">
                  {renderStars(newReview.rating, true)}
                </div>
              </div>
              <textarea
                placeholder="Share your experience with this product..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="review-textarea"
                rows={4}
              />
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
              <div className="form-actions">
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="btn-submit"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reviews-list">
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.review_id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.full_name}</span>
                  <div className="review-stars">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="review-comment">{review.comment}</p>
              {userId === review.user_id && (
                <button
                  onClick={() => deleteReview(review.review_id)}
                  className="btn-delete-review"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
