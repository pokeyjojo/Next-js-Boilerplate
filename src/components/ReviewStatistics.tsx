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
    <div className="bg-[#F4F5F6] rounded-lg p-4 mb-4 border border-[#BFC37C]">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Overall Rating Summary */}
        <div className="flex flex-col items-center sm:items-start sm:min-w-[140px]">
          <div className="text-2xl font-bold text-[#7F8B9F] mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center mb-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? 'text-[#7F8B9F] fill-current'
                    : 'text-[#7F8B9F]'
                }`}
              />
            ))}
          </div>
          <div className="text-[#7F8B9F] text-xs">
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
                  <span className="text-[#7F8B9F] text-xs">{star}</span>
                  <Star className="w-3 h-3 text-[#7F8B9F] fill-current" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#BFC37C]">
                  <div
                    className="h-full bg-[#BFC37C] transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count */}
                <div className="min-w-[25px] text-right">
                  <span className="text-[#7F8B9F] text-xs font-medium">
                    {count}
                  </span>
                </div>

                {/* Percentage */}
                <div className="min-w-[35px] text-right">
                  <span className="text-[#7F8B9F] text-xs">
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
              <div className="bg-[#F4F5F6] rounded-lg p-3 border border-[#BFC37C] mt-3">
                <h4 className="text-sm font-semibold text-[#7F8B9F] mb-2">
                  Your Star Ratings (
                  {starOnlyReviews.length}
                  )
                </h4>
                <div className="space-y-2">
                  {starOnlyReviews.map(review => (
                    <div key={review.id} className="flex items-center justify-between p-2 bg-[#F4F5F6] rounded border border-[#BFC37C]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'text-[#7F8B9F] fill-current'
                                  : 'text-[#7F8B9F]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[#7F8B9F] text-xs">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-[#7F8B9F] transition-colors px-2 py-1 rounded border border-[#BFC37C]"
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
