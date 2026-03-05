import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, Plus, Copy, Users, Check, X, HelpCircle, 
  Utensils, Share2, Trash2 
} from "lucide-react";
import { toast } from "sonner";
import { format, previousSaturday, nextSaturday, isSaturday } from "date-fns";

interface GuestInvitationsProps {
  userId: string;
}

interface Invitation {
  id: string;
  shabbat_date: string;
  host_name: string;
  address: string;
  message: string;
  candle_lighting: string;
  havdalah: string;
  invite_code: string;
}

interface Guest {
  id: string;
  guest_name: string;
  guest_contact: string | null;
  status: string;
  dish_to_bring: string | null;
  notes: string | null;
}

const getNextShabbatDate = (): string => {
  const today = new Date();
  const next = isSaturday(today) ? today : nextSaturday(today);
  return format(next, "yyyy-MM-dd");
};

export const GuestInvitations = ({ userId }: GuestInvitationsProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [guests, setGuests] = useState<Record<string, Guest[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form
  const [hostName, setHostName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("מוזמנים לשבת אצלנו! 🕯️");
  const [candleLighting, setCandleLighting] = useState("");
  const [havdalah, setHavdalah] = useState("");

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from("shabbat_invitations")
      .select("*")
      .eq("user_id", userId)
      .order("shabbat_date", { ascending: false })
      .limit(10);
    
    if (data) {
      setInvitations(data as Invitation[]);
      // Fetch guests for each invitation
      for (const inv of data) {
        const { data: guestData } = await supabase
          .from("invitation_guests")
          .select("*")
          .eq("invitation_id", inv.id)
          .order("created_at", { ascending: true });
        if (guestData) {
          setGuests(prev => ({ ...prev, [inv.id]: guestData as Guest[] }));
        }
      }
    }
    setLoading(false);
  };

  const createInvitation = async () => {
    if (!hostName.trim()) {
      toast.error("יש להזין שם מארח");
      return;
    }

    const { error } = await supabase.from("shabbat_invitations").insert({
      user_id: userId,
      shabbat_date: getNextShabbatDate(),
      host_name: hostName,
      address,
      message,
      candle_lighting: candleLighting,
      havdalah: havdalah,
    });

    if (error) {
      toast.error("שגיאה ביצירת הזמנה");
    } else {
      toast.success("הזמנה נוצרה!");
      setShowCreate(false);
      fetchInvitations();
    }
  };

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("הלינק הועתק!");
  };

  const shareInvite = (inv: Invitation) => {
    const url = `${window.location.origin}/invite/${inv.invite_code}`;
    const text = `${inv.message}\n\n📍 ${inv.address}\n🕯️ הדלקת נרות: ${inv.candle_lighting}\n✨ הבדלה: ${inv.havdalah}\n\nלאישור הגעה: ${url}`;
    
    if (navigator.share) {
      navigator.share({ title: "הזמנה לשבת", text, url });
    } else {
      // WhatsApp fallback
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("shabbat_invitations").delete().eq("id", id);
    fetchInvitations();
    toast.success("הזמנה נמחקה");
  };

  const statusEmoji: Record<string, string> = {
    accepted: "✅",
    declined: "❌",
    maybe: "🤔",
    pending: "⏳",
  };

  const statusLabel: Record<string, string> = {
    accepted: "מגיע/ה",
    declined: "לא מגיע/ה",
    maybe: "אולי",
    pending: "ממתין",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              הזמנות לשבת
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1">
              <Plus className="w-4 h-4" />
              הזמנה חדשה
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create form */}
          {showCreate && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <Input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="שם המארח/ת" dir="rtl" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="כתובת" dir="rtl" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={candleLighting} onChange={(e) => setCandleLighting(e.target.value)} placeholder="הדלקת נרות (למשל 18:30)" />
                <Input value={havdalah} onChange={(e) => setHavdalah(e.target.value)} placeholder="הבדלה (למשל 19:45)" />
              </div>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="הודעה אישית" dir="rtl" rows={2} />
              <div className="flex gap-2">
                <Button onClick={createInvitation} className="flex-1">צור הזמנה</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              </div>
            </div>
          )}

          {/* Invitations list */}
          {invitations.map((inv) => {
            const invGuests = guests[inv.id] || [];
            const accepted = invGuests.filter(g => g.status === "accepted").length;
            return (
              <div key={inv.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">שבת {format(new Date(inv.shabbat_date + "T12:00:00"), "dd/MM/yyyy")}</p>
                    <p className="text-sm text-muted-foreground">{inv.address}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => shareInvite(inv)} title="שתף">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => copyInviteLink(inv.invite_code)} title="העתק לינק">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteInvitation(inv.id)} title="מחק">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Guest summary */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{accepted} אישרו</span>
                  <span className="text-xs text-muted-foreground">מתוך {invGuests.length} הוזמנו</span>
                </div>

                {/* Guest list */}
                {invGuests.length > 0 && (
                  <div className="space-y-1">
                    {invGuests.map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-sm p-1.5 rounded bg-muted">
                        <div className="flex items-center gap-2">
                          <span>{statusEmoji[g.status]}</span>
                          <span>{g.guest_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {g.dish_to_bring && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Utensils className="w-3 h-3" />
                              {g.dish_to_bring}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{statusLabel[g.status]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {invitations.length === 0 && !loading && !showCreate && (
            <p className="text-center text-sm text-muted-foreground py-4">
              עדיין לא יצרת הזמנות 📨 צור הזמנה ושתף עם האורחים
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
