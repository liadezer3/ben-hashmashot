import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Send, ShoppingCart, Plus, Trash2, Phone, Bell,
  MessageCircle, Sparkles, Copy, Edit3, Calendar
} from "lucide-react";
import { toast } from "sonner";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface Props {
  userId: string;
  candleLighting?: string;
  havdalah?: string;
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
}

interface Member {
  id: string;
  name: string;
  phone: string | null;
}

interface ShoppingItem {
  id: string;
  title: string;
  quantity: string;
  is_purchased: boolean;
}

interface Guest {
  id: string;
  guest_name: string;
  guest_contact: string | null;
  status: string;
}

const LANDING_URL = "https://ben-hashmashot.com/landing";

const buildDefaultShareMessage = (groupName: string) =>
  `🕯️ *הזמנה לקהילת ${groupName}* ✨

הצטרפו אלינו לאפליקציית *בין השמשות* - לא שוכחים יותר כניסת שבת!

✅ זמני שבת מדויקים לפי המיקום שלך
✅ תזכורות חכמות בוואטסאפ
✅ ניהול קהילה ורשימות משותפות
✅ ללא הרשמה - אפשר להתחיל מיד

👈 התנסה עכשיו בחינם:
${LANDING_URL}`;

const buildShoppingMessage = (groupName: string, items: ShoppingItem[]) => {
  const list = items
    .filter((i) => !i.is_purchased)
    .map((i) => `▫️ ${i.title}${i.quantity && i.quantity !== "1" ? ` (${i.quantity})` : ""}`)
    .join("\n");
  return `🛒 *רשימת קניות לשבת - ${groupName}*

${list || "הרשימה ריקה"}

📲 נשלח מאפליקציית *בין השמשות*
${LANDING_URL}`;
};

const buildGuestReminderMessage = (
  guestName: string,
  hostName: string,
  candleLighting: string,
  havdalah: string,
  address: string,
  type: "day" | "hour"
) => {
  const intro = type === "day"
    ? `שלום ${guestName}! 👋\nתזכורת ידידותית - מחר אנחנו מארחים אותך לשבת! 🕯️`
    : `שלום ${guestName}! 👋\nתזכורת אחרונה - בעוד כשעה כניסת שבת! ✨`;

  return `${intro}

🏠 אצל: ${hostName}
📍 ${address || "כתובת תישלח"}
🕯️ הדלקת נרות: ${candleLighting || "—"}
✨ הבדלה: ${havdalah || "—"}

מחכים לראותך! שבת שלום 💛

📲 _נשלח מאפליקציית בין השמשות_
${LANDING_URL}`;
};

const sendViaWhatsApp = (phone: string | null | undefined, message: string) => {
  const cleanPhone = phone?.replace(/[^\d+]/g, "");
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

export const EnhancedFamilyHub = ({ userId, candleLighting = "", havdalah = "" }: Props) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Share message editor
  const [shareMessage, setShareMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(false);

  // New shopping item
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  useEffect(() => {
    loadGroups();
  }, [userId]);

  useEffect(() => {
    if (activeGroup) {
      setShareMessage(buildDefaultShareMessage(activeGroup.name));
      loadGroupData(activeGroup.id);
      loadGuests();
    }
  }, [activeGroup?.id]);

  const loadGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("family_group_members")
      .select("group_id, family_groups(id, name, invite_code)")
      .eq("user_id", userId);

    const g = (data || [])
      .map((d: any) => d.family_groups)
      .filter(Boolean) as Group[];
    setGroups(g);
    if (g.length > 0 && !activeGroup) setActiveGroup(g[0]);
    setLoading(false);
  };

  const loadGroupData = async (groupId: string) => {
    // Members (from family_members table - personal contacts) and family_group_members (group)
    const { data: fm } = await supabase
      .from("family_members")
      .select("id, name, phone")
      .eq("user_id", userId);
    setMembers((fm as Member[]) || []);

    const { data: items } = await supabase
      .from("shopping_list_items")
      .select("id, title, quantity, is_purchased")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    setShoppingItems((items as ShoppingItem[]) || []);
  };

  const loadGuests = async () => {
    const { data: invs } = await supabase
      .from("shabbat_invitations")
      .select("id")
      .eq("user_id", userId)
      .order("shabbat_date", { ascending: false })
      .limit(1);

    if (invs && invs.length > 0) {
      const { data: gs } = await supabase
        .from("invitation_guests")
        .select("id, guest_name, guest_contact, status")
        .eq("invitation_id", invs[0].id);
      setGuests((gs as Guest[]) || []);
    }
  };

  const addShoppingItem = async () => {
    if (!newItemTitle.trim() || !activeGroup) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("shopping_list_items").insert({
      group_id: activeGroup.id,
      title: newItemTitle.trim(),
      quantity: newItemQty || "1",
      added_by: user.id,
      added_by_name: profile?.full_name || "אני",
    });

    if (error) {
      toast.error("שגיאה בהוספת פריט");
    } else {
      setNewItemTitle("");
      setNewItemQty("1");
      loadGroupData(activeGroup.id);
      toast.success("נוסף לרשימה ✓");
    }
  };

  const removeShoppingItem = async (id: string) => {
    await supabase.from("shopping_list_items").delete().eq("id", id);
    if (activeGroup) loadGroupData(activeGroup.id);
  };

  const sendShoppingListToGroup = () => {
    if (!activeGroup) return;
    const msg = buildShoppingMessage(activeGroup.name, shoppingItems);
    sendViaWhatsApp(null, msg);
  };

  const shareInviteToGroup = (member?: Member) => {
    sendViaWhatsApp(member?.phone, shareMessage);
  };

  const sendInviteCodeToWhatsApp = () => {
    if (!activeGroup) return;
    const msg = `🕯️ *הצטרפו לקהילת ${activeGroup.name}* ב'בין השמשות'!

קוד הצטרפות: *${activeGroup.invite_code}*

או הצטרפו ישירות:
${window.location.origin}/invite/${activeGroup.invite_code}

📲 ${LANDING_URL}`;
    sendViaWhatsApp(null, msg);
  };

  const sendGuestReminder = (guest: Guest, type: "day" | "hour") => {
    if (!activeGroup) return;
    const msg = buildGuestReminderMessage(
      guest.guest_name,
      activeGroup.name,
      candleLighting,
      havdalah,
      "",
      type
    );
    sendViaWhatsApp(guest.guest_contact, msg);
  };

  if (loading) return null;

  if (groups.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            מרכז הקהילה והמשפחה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            צרו או הצטרפו לקהילה כדי לפתוח את כל היתרונות: שיתוף קישורים, ניהול קניות לשבת, והזמנות לאורחים.
          </p>
          <Button onClick={() => window.location.assign("/settings?tab=family")} className="gap-2">
            <Plus className="w-4 h-4" />
            צרו קהילה ראשונה
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            מרכז הקהילה והמשפחה
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          {groups.length > 1 && (
            <select
              value={activeGroup?.id || ""}
              onChange={(e) => setActiveGroup(groups.find((g) => g.id === e.target.value) || null)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="gap-1 text-xs">
              <Send className="w-3 h-3" /> שיתוף
            </TabsTrigger>
            <TabsTrigger value="shopping" className="gap-1 text-xs">
              <ShoppingCart className="w-3 h-3" /> ציוד לשבת
            </TabsTrigger>
            <TabsTrigger value="guests" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" /> אורחים
            </TabsTrigger>
          </TabsList>

          {/* SHARE TAB */}
          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">הודעת שיתוף לוואטסאפ</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMessage(!editingMessage)}
                  className="gap-1 h-7"
                >
                  <Edit3 className="w-3 h-3" />
                  {editingMessage ? "שמור" : "ערוך"}
                </Button>
              </div>
              {editingMessage ? (
                <Textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={8}
                  dir="rtl"
                  className="text-sm"
                />
              ) : (
                <div className="p-3 rounded-lg bg-muted text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {shareMessage}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={() => shareInviteToGroup()} className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white">
                <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
                שתף בוואטסאפ
              </Button>
              <Button variant="outline" onClick={sendInviteCodeToWhatsApp} className="gap-2">
                <Copy className="w-4 h-4" />
                שלח קוד הצטרפות
              </Button>
            </div>

            {members.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  שליחה ישירה לאנשי קשר
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {members.filter((m) => m.phone).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm">{m.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => shareInviteToGroup(m)}
                        className="gap-1 h-7"
                      >
                        <img src={whatsappIcon} alt="WhatsApp" className="w-3 h-3" />
                        שלח
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* SHOPPING TAB */}
          <TabsContent value="shopping" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="הוסף פריט לשבת..."
                dir="rtl"
                onKeyDown={(e) => e.key === "Enter" && addShoppingItem()}
              />
              <Input
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="כמות"
                className="w-20"
              />
              <Button size="icon" onClick={addShoppingItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {shoppingItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  הרשימה ריקה - הוסיפו ציוד לשבת 🛒
                </p>
              ) : (
                shoppingItems.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-2 rounded border ${item.is_purchased ? "opacity-50 line-through" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.title}</span>
                      {item.quantity && item.quantity !== "1" && (
                        <Badge variant="outline" className="text-xs">{item.quantity}</Badge>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeShoppingItem(item.id)} className="h-7 w-7">
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {shoppingItems.length > 0 && (
              <Button
                onClick={sendShoppingListToGroup}
                className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
                שלח רשימה לקהילה בוואטסאפ
              </Button>
            )}
          </TabsContent>

          {/* GUESTS TAB */}
          <TabsContent value="guests" className="space-y-3 pt-4">
            {guests.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  אין אורחים רשומים לשבת הקרובה
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.assign("/settings?tab=family")}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  צור הזמנה לשבת
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  שלח תזכורת אישית לכל אורח (כולל זמני שבת ולוגו האפליקציה)
                </p>
                {guests.map((guest) => (
                  <div key={guest.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{guest.guest_name}</p>
                        {guest.guest_contact && (
                          <p className="text-xs text-muted-foreground">{guest.guest_contact}</p>
                        )}
                      </div>
                      <Badge variant={guest.status === "accepted" ? "default" : "outline"}>
                        {guest.status === "accepted" ? "✓ אישר" : "ממתין"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendGuestReminder(guest, "day")}
                        className="gap-1 text-xs"
                      >
                        <Bell className="w-3 h-3" />
                        יום לפני
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendGuestReminder(guest, "hour")}
                        className="gap-1 text-xs bg-[#25D366] hover:bg-[#1da851] text-white"
                      >
                        <MessageCircle className="w-3 h-3" />
                        שעה לפני
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
