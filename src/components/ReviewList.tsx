import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
import ReviewCard from "./ReviewCard";

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpful: string[];
  isVerified?: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

const ReviewList = ({
  reviews,
  isLoading,
  hasMore = false,
  onLoadMore,
  onMarkHelpful,
  onReport,
  onEdit,
  onDelete,
}: ReviewListProps) => {
  const [showAll, setShowAll] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const handleLoadMore = async () => {
    if (onLoadMore) {
      setIsLoadMoreLoading(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadMoreLoading(false);
      }
    } else {
      setShowAll(true);
    }
  };

  if (isLoading && reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this product!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onMarkHelpful={onMarkHelpful}
              onReport={onReport}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        {reviews.length > 3 && !showAll && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
              className="flex items-center gap-2"
            >
              Show All Reviews ({reviews.length})
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showAll && reviews.length > 3 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAll(false)}
              className="flex items-center gap-2"
            >
              Show Less
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadMoreLoading}
              className="flex items-center gap-2"
            >
              {isLoadMoreLoading ? "Loading..." : "Load More Reviews"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewList;