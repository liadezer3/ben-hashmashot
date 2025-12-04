import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Mail, Phone, MessageCircle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface FamilyMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notify_sms: boolean;
  notify_email: boolean;
  notify_whatsapp: boolean;
}

export const FamilyMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    email: "",
    notify_sms: false,
    notify_email: false,
    notify_whatsapp: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading family members:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMember.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          name: newMember.name,
          phone: newMember.phone || null,
          email: newMember.email || null,
          notify_sms: newMember.notify_sms,
          notify_email: newMember.notify_email,
          notify_whatsapp: newMember.notify_whatsapp,
        });

      if (error) throw error;

      setNewMember({
        name: "",
        phone: "",
        email: "",
        notify_sms: false,
        notify_email: false,
        notify_whatsapp: false,
      });
      setShowForm(false);
      loadMembers();

      toast({
        title: "הצלחה!",
        description: "בן המשפחה נוסף בהצלחה",
      });
    } catch (error) {
      console.error("Error adding family member:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להוסיף את בן המשפחה",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      loadMembers();
      toast({
        title: "הצלחה!",
        description: "בן המשפחה נמחק",
      });
    } catch (error) {
      console.error("Error deleting family member:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את בן המשפחה",
        variant: "destructive",
      });
    }
  };

  const toggleNotification = async (id: string, field: 'notify_sms' | 'notify_email' | 'notify_whatsapp', value: boolean) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
      loadMembers();
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">בני משפחה</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 ml-1" />
          הוסף
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        הוסף בני משפחה כדי לשלוח להם גם התראות על זמני שבת
      </p>

      {showForm && (
        <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
          <Input
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            placeholder="שם"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="טלפון"
              type="tel"
              dir="ltr"
            />
            <Input
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="אימייל"
              type="email"
              dir="ltr"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={newMember.notify_sms}
                onCheckedChange={(v) => setNewMember({ ...newMember, notify_sms: v })}
              />
              <Label>SMS</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newMember.notify_email}
                onCheckedChange={(v) => setNewMember({ ...newMember, notify_email: v })}
              />
              <Label>אימייל</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newMember.notify_whatsapp}
                onCheckedChange={(v) => setNewMember({ ...newMember, notify_whatsapp: v })}
              />
              <Label>וואטסאפ</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addMember} disabled={saving}>
              {saving ? "שומר..." : "שמור"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              ביטול
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{member.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMember(member.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-3 space-y-1">
              {member.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{member.phone}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span dir="ltr">{member.email}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1">
                <Switch
                  checked={member.notify_sms}
                  onCheckedChange={(v) => toggleNotification(member.id, 'notify_sms', v)}
                />
                <Label className="text-xs">SMS</Label>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={member.notify_email}
                  onCheckedChange={(v) => toggleNotification(member.id, 'notify_email', v)}
                />
                <Label className="text-xs">אימייל</Label>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={member.notify_whatsapp}
                  onCheckedChange={(v) => toggleNotification(member.id, 'notify_whatsapp', v)}
                />
                <Label className="text-xs">וואטסאפ</Label>
              </div>
            </div>
          </div>
        ))}

        {members.length === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-4">
            עדיין לא הוספת בני משפחה
          </p>
        )}
      </div>
    </Card>
  );
};
