import React, { useEffect, useState } from 'react';
import { Star, ThumbsUp, Calendar, User as UserIcon } from 'lucide-react';
import { reviewsAPI } from '@/api/api';
import { useAuthStore } from '@/store/store';
import ReviewForm from './ReviewForm';
import './ReviewsSection.css';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  helpful_count: number;
  created_at: string;
  user_id: string;
}

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');

  useEffect(() => {
    fetchReviews();
    fetchRatingStats();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await reviewsAPI.getByProduct(productId);
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingStats = async () => {
    const { average, count } = await reviewsAPI.getAverageRating(productId);
    setAverageRating(average);
    setReviewCount(count);
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    fetchReviews();
    fetchRatingStats();
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'helpful':
        return sorted.sort((a, b) => b.helpful_count - a.helpful_count);
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  };

  const renderStars = (rating: number, size = 20) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-secondary mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), 24)}
            <p className="text-sm text-gray-600 mt-2">{reviewCount} reviews</p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600 w-12">{stars} star</span>
                  <div className="reviews-rating-bar">
                    <div
                      className="reviews-rating-bar-fill"
                      style={{ '--rating-percentage': `${percentage}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write Review Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary w-full sm:w-auto"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm productId={productId} onReviewSubmitted={handleReviewSubmitted} />
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Customer Reviews</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
            aria-label="Sort reviews by"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {getSortedReviews().length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">No reviews yet. Be the first to review this product!</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Write a Review
              </button>
            )}
          </div>
        ) : (
          getSortedReviews().map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  {renderStars(review.rating)}
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 mt-2">{review.title}</h4>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon size={16} />
                  <span>Customer Review</span>
                </div>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-secondary transition">
                  <ThumbsUp size={16} />
                  <span>Helpful ({review.helpful_count})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
