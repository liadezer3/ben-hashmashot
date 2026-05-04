import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Utensils, Check, X, HelpCircle, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Invitation {
  id: string;
  host_name: string;
  shabbat_date: string;
  address: string;
  message: string;
  candle_lighting: string;
  havdalah: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  invite_code: string;
}

const InvitePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [joining, setJoining] = useState(false);

  // RSVP form
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [dish, setDish] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!code || code === ":code") {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      // 1) Try Shabbat invitation first via secure RPC (no public table read)
      const { data: invRows } = await supabase.rpc("get_invitation_by_code", {
        _code: code,
      });

      if (invRows && Array.isArray(invRows) && invRows.length > 0) {
        setInvitation(invRows[0] as Invitation);
        setLoading(false);
        return;
      }

      // 2) Fallback: try family group invite code (via SECURITY DEFINER RPC)
      const { data: groupData } = await supabase.rpc("get_family_group_by_invite", {
        _code: code,
      });

      if (groupData && Array.isArray(groupData) && groupData.length > 0) {
        setGroup(groupData[0] as FamilyGroup);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [code]);

  const respond = async (status: string) => {
    if (!guestName.trim() || !invitation) {
      toast.error("יש להזין שם");
      return;
    }

    const { error } = await supabase.from("invitation_guests").insert({
      invitation_id: invitation.id,
      guest_name: guestName.trim(),
      guest_contact: guestContact || null,
      status,
      dish_to_bring: dish || null,
      notes: notes || null,
    });

    if (error) {
      toast.error("שגיאה בשליחת התשובה");
    } else {
      setSubmitted(true);
      toast.success(status === "accepted" ? "נהדר! נתראה בשבת 🕯️" : "התשובה נשמרה");
    }
  };

  const joinGroup = async () => {
    if (!group) return;
    setJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Save invite code and send to auth
      sessionStorage.setItem("pending_invite_code", group.invite_code);
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("family_group_members").insert({
      group_id: group.id,
      user_id: user.id,
      display_name: user.email?.split("@")[0] || "חבר חדש",
      role: "member",
    });
    setJoining(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("שגיאה בהצטרפות לקבוצה");
    } else {
      toast.success(`הצטרפת לקהילת ${group.name}! 🎉`);
      setTimeout(() => navigate("/"), 1200);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען הזמנה...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-4xl mb-4">🤷</p>
          <h1 className="text-xl font-bold mb-2">ההזמנה לא נמצאה</h1>
          <p className="text-muted-foreground mb-4">ייתכן שהלינק שגוי או שההזמנה נמחקה</p>
          <Button onClick={() => navigate("/landing")}>לדף הבית</Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-4xl mb-4">🕯️</p>
          <h1 className="text-xl font-bold mb-2">התשובה נשמרה!</h1>
          <p className="text-muted-foreground">שבת שלום ומבורך</p>
        </Card>
      </div>
    );
  }

  // Family group invite view
  if (group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <p className="text-4xl mb-2">👨‍👩‍👧‍👦</p>
            <CardTitle className="text-2xl">הוזמנת לקהילה</CardTitle>
            <p className="text-muted-foreground mt-2">
              <span className="font-semibold text-foreground">{group.name}</span> ב'בין השמשות'
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>תזכורות חכמות לכניסת שבת</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>רשימות קניות ואירוח משותפות</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>זמני שבת מדויקים לפי המיקום</span>
              </div>
            </div>
            <Button onClick={joinGroup} disabled={joining} className="w-full" size="lg">
              {joining ? "מצטרף..." : `הצטרף לקהילת ${group.name}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              קוד הצטרפות: <span className="font-mono">{group.invite_code}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Shabbat invitation view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <p className="text-3xl mb-2">🕯️</p>
          <CardTitle className="text-xl">הזמנה לשבת</CardTitle>
          <p className="text-muted-foreground">
            אצל {invitation!.host_name} • {format(new Date(invitation!.shabbat_date + "T12:00:00"), "dd/MM/yyyy")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation!.message && (
            <p className="text-center text-sm bg-muted p-3 rounded-lg">{invitation!.message}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {invitation!.address && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{invitation!.address}</span>
              </div>
            )}
            {invitation!.candle_lighting && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>🕯️ {invitation!.candle_lighting}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="font-semibold text-center">אישור הגעה</p>
            <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="השם שלך *" dir="rtl" />
            <Input value={guestContact} onChange={(e) => setGuestContact(e.target.value)} placeholder="טלפון / אימייל (אופציונלי)" dir="rtl" />

            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-muted-foreground" />
              <Input value={dish} onChange={(e) => setDish(e.target.value)} placeholder="מה אביא? (סלט, קינוח...)" dir="rtl" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => respond("accepted")} className="gap-1 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4" />
                מגיע/ה!
              </Button>
              <Button onClick={() => respond("maybe")} variant="outline" className="gap-1">
                <HelpCircle className="w-4 h-4" />
                אולי
              </Button>
              <Button onClick={() => respond("declined")} variant="outline" className="gap-1 text-destructive">
                <X className="w-4 h-4" />
                לא הפעם
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;
