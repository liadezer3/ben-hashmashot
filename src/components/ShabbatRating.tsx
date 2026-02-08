import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, previousSaturday, isSaturday } from "date-fns";
import { ShabbatRatingChart } from "@/components/ShabbatRatingChart";

interface ShabbatRating {
  id: string;
  rating: number;
  notes: string | null;
  shabbat_date: string;
  parsha: string | null;
  created_at: string;
}

interface ShabbatRatingProps {
  userId: string;
}

const ShabbatRating = ({ userId }: ShabbatRatingProps) => {
  const [ratings, setRatings] = useState<ShabbatRating[]>([]);
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [existingRating, setExistingRating] = useState<ShabbatRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getLastShabbatDate = (): string => {
    const today = new Date();
    const lastShabbat = isSaturday(today) ? today : previousSaturday(today);
    return format(lastShabbat, "yyyy-MM-dd");
  };

  const shabbatDate = getLastShabbatDate();

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shabbat_ratings")
      .select("*")
      .eq("user_id", userId)
      .order("shabbat_date", { ascending: false })
      .limit(52);

    if (!error && data) {
      setRatings(data);
      const existing = data.find((r) => r.shabbat_date === shabbatDate);
      if (existing) {
        setExistingRating(existing);
        setCurrentRating(existing.rating);
        setNotes(existing.notes || "");
      }
    }
    setLoading(false);
  };

  const submitRating = async () => {
    if (currentRating === 0) {
      toast({ title: "בחר דירוג", description: "יש לבחור לפחות כוכב אחד", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    if (existingRating) {
      const { error } = await supabase
        .from("shabbat_ratings")
        .update({ rating: currentRating, notes: notes || null })
        .eq("id", existingRating.id);

      if (error) {
        toast({ title: "שגיאה", description: "לא ניתן לעדכן את הדירוג", variant: "destructive" });
      } else {
        toast({ title: "עודכן!", description: "הדירוג עודכן בהצלחה" });
        fetchRatings();
      }
    } else {
      const { error } = await supabase.from("shabbat_ratings").insert({
        user_id: userId,
        rating: currentRating,
        notes: notes || null,
        shabbat_date: shabbatDate,
      });

      if (error) {
        toast({ title: "שגיאה", description: "לא ניתן לשמור את הדירוג", variant: "destructive" });
      } else {
        toast({ title: "נשמר!", description: "הדירוג נשמר בהצלחה" });
        fetchRatings();
      }
    }

    setSubmitting(false);
  };

  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : "—";

  const ratingLabels = ["", "צריך שיפור", "בסדר", "טוב", "מעולה", "שבת חלומית!"];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">טוען...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rate this Shabbat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-secondary" />
            דרג את השבת האחרונה
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 inline ml-1" />
            שבת {format(new Date(shabbatDate + "T12:00:00"), "dd/MM/yyyy")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stars */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setCurrentRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || currentRating)
                      ? "fill-secondary text-secondary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating label */}
          {(hoverRating || currentRating) > 0 && (
            <p className="text-center text-sm font-medium text-foreground">
              {ratingLabels[hoverRating || currentRating]}
            </p>
          )}

          {/* Notes */}
          <Textarea
            placeholder="ספר על השבת... מה היה מיוחד? 🕯️"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
            dir="rtl"
          />

          <Button
            onClick={submitRating}
            disabled={submitting || currentRating === 0}
            className="w-full"
          >
            {existingRating ? "עדכן דירוג" : "שמור דירוג"}
          </Button>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              הסטטיסטיקות שלי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">{averageRating}</p>
                <p className="text-xs text-muted-foreground">ממוצע</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-secondary">{ratings.length}</p>
                <p className="text-xs text-muted-foreground">שבתות</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">
                  {ratings.filter((r) => r.rating >= 4).length}
                </p>
                <p className="text-xs text-muted-foreground">שבתות מצוינות</p>
              </div>
            </div>

            {/* Chart */}
            <ShabbatRatingChart ratings={ratings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShabbatRating;
