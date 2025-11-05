import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment must be less than 1000 characters"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ReviewFormData>;
  isEditing?: boolean;
}

const ReviewForm = ({ productId, onSubmit, onCancel, initialData, isEditing = false }: ReviewFormProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initialData?.rating || 0,
      title: initialData?.title || "",
      comment: initialData?.comment || "",
    },
  });

  const handleSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      setHoveredRating(0);
      toast({
        title: isEditing ? "Review updated" : "Review submitted",
        description: isEditing
          ? "Your review has been updated successfully."
          : "Thank you for your review! It will be published after moderation.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Review" : "Write a Review"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 hover:scale-110 transition-transform"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => handleRatingClick(star)}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || field.value)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {field.value > 0 && `${field.value} star${field.value !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share details of your experience with this product"
                      className="min-h-[120px]"
                      {...field}
                      maxLength={1000}
                    />
                  </FormControl>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <FormMessage />
                    <span>{field.value?.length || 0}/1000</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isEditing ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  isEditing ? "Update Review" : "Submit Review"
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;