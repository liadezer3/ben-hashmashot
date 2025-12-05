import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  display_name: string | null;
  created_at: string;
}

export const AppReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('app_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error("יש להתחבר כדי להשאיר ביקורת");
      return;
    }
    if (rating === 0) {
      toast.error("יש לבחור דירוג");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('app_reviews').insert({
        user_id: user.id,
        rating,
        review_text: reviewText || null,
        display_name: displayName || null,
      });

      if (error) throw error;

      toast.success("הביקורת נשלחה בהצלחה!");
      setShowForm(false);
      setRating(0);
      setReviewText("");
      setDisplayName("");
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("שגיאה בשליחת הביקורת");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 transition-colors ${
            star <= (interactive ? (hoverRating || rating) : value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-accent" />
          ביקורות משתמשים
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 bg-warm/10 px-3 py-1.5 rounded-full">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-foreground">{averageRating}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm ? (
        <div className="mb-6 p-4 bg-warm/5 rounded-xl border border-warm/20 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">איך היית מדרג את האפליקציה?</p>
            <div className="flex justify-center">
              <StarRating value={rating} interactive />
            </div>
          </div>
          <Input
            placeholder="השם שיוצג (אופציונלי)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-background"
          />
          <Textarea
            placeholder="ספר לנו על החוויה שלך..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="bg-background min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={submitReview}
              disabled={submitting || rating === 0}
              className="flex-1 bg-warm hover:bg-warm/90 text-warm-foreground"
            >
              <Send className="w-4 h-4 ml-2" />
              {submitting ? "שולח..." : "שלח ביקורת"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              ביטול
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full mb-6 border-warm/30 hover:bg-warm/10 hover:border-warm"
        >
          <Star className="w-4 h-4 ml-2" />
          השאר ביקורת
        </Button>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg bg-background/50 border border-border hover:border-warm/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  {review.display_name || "משתמש אנונימי"}
                </span>
                <StarRating value={review.rating} />
              </div>
              {review.review_text && (
                <p className="text-muted-foreground text-sm">{review.review_text}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-2">
                {new Date(review.created_at).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            היה הראשון להשאיר ביקורת!
          </p>
        )}
      </div>
    </Card>
  );
};
