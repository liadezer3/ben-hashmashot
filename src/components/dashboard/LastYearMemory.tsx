import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, BookOpen, Image as ImageIcon } from "lucide-react";
import { HDate, HebrewCalendar } from "@hebcal/core";

interface LastYearMemoryProps {
  userId: string;
}

interface Memory {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  type: string;
  date: string | null;
  parsha: string | null;
  tags: string[] | null;
}

export const LastYearMemory = ({ userId }: LastYearMemoryProps) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentParsha, setCurrentParsha] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current parsha from hebcal events
    const now = new Date();
    const events = HebrewCalendar.calendar({
      start: now,
      end: new Date(now.getTime() + 7 * 86400000),
      sedrot: true,
      il: true,
      noHolidays: true,
    });
    const parshaEvent = events.find(e => e.getDesc().startsWith("Parashat"));
    if (parshaEvent) {
      setCurrentParsha(parshaEvent.render("he"));
    }
  }, []);

  useEffect(() => {
    if (!currentParsha) return;

    const fetchMemories = async () => {
      // Search for memories from last year with same parsha
      const { data } = await supabase
        .from("family_memories")
        .select("*")
        .eq("user_id", userId)
        .eq("parsha", currentParsha)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        setMemories(data);
      } else {
        // Fallback: any memories from roughly same time last year
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const startDate = new Date(lastYear);
        startDate.setDate(startDate.getDate() - 10);
        const endDate = new Date(lastYear);
        endDate.setDate(endDate.getDate() + 10);

        const { data: fallbackData } = await supabase
          .from("family_memories")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0])
          .order("created_at", { ascending: false })
          .limit(3);

        if (fallbackData) setMemories(fallbackData);
      }
      setLoading(false);
    };
    fetchMemories();
  }, [userId, currentParsha]);

  if (loading) return null;
  if (memories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-500" />
          השבת שלי בשנה שעברה
        </CardTitle>
        {currentParsha && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            פרשת {currentParsha}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {memories.map((memory) => (
          <div key={memory.id} className="flex gap-3 p-3 rounded-lg bg-muted">
            {memory.image_url && (
              <img
                src={memory.image_url}
                alt={memory.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm">{memory.title}</p>
              {memory.content && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{memory.content}</p>
              )}
              {memory.date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(memory.date).toLocaleDateString("he-IL")}
                </p>
              )}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {memory.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
