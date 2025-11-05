import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Flag, Star, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

interface ReviewCardProps {
  review: Review;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

const ReviewCard = ({ review, onMarkHelpful, onReport, onEdit, onDelete }: ReviewCardProps) => {
  const { user } = useAuth();
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const handleMarkHelpful = async () => {
    if (!user) return;
    setIsHelpfulLoading(true);
    try {
      await onMarkHelpful?.(review._id);
    } finally {
      setIsHelpfulLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user) return;
    setIsReportLoading(true);
    try {
      await onReport?.(review._id);
    } finally {
      setIsReportLoading(false);
    }
  };

  const isOwnReview = user?._id === review.user._id;
  const hasMarkedHelpful = user ? review.helpful.includes(user._id) : false;

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.user.profilePicture} alt={review.user.name} />
              <AvatarFallback>
                {review.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{review.user.name}</h4>
                {review.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {isOwnReview && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(review)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(review._id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{review.rating}/5</span>
          </div>
          <h5 className="font-semibold text-lg mb-2">{review.title}</h5>
          <p className="text-muted-foreground">{review.comment}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkHelpful}
              disabled={!user || isHelpfulLoading}
              className={`h-8 px-3 ${hasMarkedHelpful ? 'text-primary' : ''}`}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful ({review.helpful.length})
            </Button>
          </div>

          {user && !isOwnReview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              disabled={isReportLoading}
              className="h-8 px-3 text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-4 w-4 mr-2" />
              Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;