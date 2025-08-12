import { Star } from 'lucide-react';
import React from 'react';

type ReviewStatisticsProps = {
  reviews: Array<{
    id: string;
    rating: number;
    text?: string | null;
    userName?: string;
    author?: string;
    userId?: string;
    createdAt: string;
  }>;
  currentUserId?: string;
  isAdmin?: boolean;
  onDeleteReview?: (reviewId: string) => void;
};

type StarCount = {
  star: number;
  count: number;
  percentage: number;
};

const ReviewStatistics = React.memo((
  { reviews, currentUserId, isAdmin, onDeleteReview }: ReviewStatisticsProps,
) => {
  const starCounts: StarCount[] = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0];

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating - 1]++;
      }
    });

    const total = reviews.length;

    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: counts[star - 1],
      percentage: total > 0 ? (counts[star - 1] / total) * 100 : 0,
    }));
  }, [reviews]);

  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return null;
  }

  return (
    <div className="bg-[#002C4D] rounded-lg p-4 mb-4 border border-[#BFC3C7]">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Overall Rating Summary */}
        <div className="flex flex-col items-center sm:items-start sm:min-w-[140px]">
          <div className="text-2xl font-bold text-white mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center mb-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? 'text-[#69F0FD] fill-current'
                    : 'text-[#50394D]'
                }`}
              />
            ))}
          </div>
          <div className="text-[#BFC3C7] text-xs">
            {totalReviews}
            {' '}
            review
            {totalReviews !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating Distribution Graph */}
        <div className="flex-1">
          <div className="space-y-1">
            {starCounts.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                {/* Star Label */}
                <div className="flex items-center gap-1 min-w-[45px]">
                  <span className="text-[#BFC3C7] text-xs">{star}</span>
                  <Star className="w-3 h-3 text-[#69F0FD] fill-current" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 bg-[#50394D] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#EC0037] to-[#69F0FD] transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count */}
                <div className="min-w-[25px] text-right">
                  <span className="text-[#BFC3C7] text-xs font-medium">
                    {count}
                  </span>
                </div>

                {/* Percentage */}
                <div className="min-w-[35px] text-right">
                  <span className="text-[#BFC3C7] text-xs">
                    {percentage.toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Star-Only Reviews Section */}
      {currentUserId && onDeleteReview && (
        <>
          {(() => {
            const starOnlyReviews = reviews.filter(
              review => (!review.text || !review.text.trim())
                && (review.userId === currentUserId || isAdmin),
            );

            if (starOnlyReviews.length === 0) {
              return null;
            }

            return (
              <div className="bg-[#011B2E] rounded-lg p-3 border border-[#BFC3C7] mt-3">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Your Star Ratings (
                  {starOnlyReviews.length}
                  )
                </h4>
                <div className="space-y-2">
                  {starOnlyReviews.map(review => (
                    <div key={review.id} className="flex items-center justify-between p-2 bg-[#002C4D] rounded">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'text-[#69F0FD] fill-current'
                                  : 'text-[#50394D]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[#BFC3C7] text-xs">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-[#EC0037] hover:text-[#4A1C23] transition-colors px-2 py-1 rounded"
                        onClick={() => onDeleteReview(review.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
});

ReviewStatistics.displayName = 'ReviewStatistics';

export default ReviewStatistics;
