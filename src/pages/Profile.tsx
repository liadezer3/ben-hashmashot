import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "שגיאה בטעינת הפרופיל",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setProfile(data);
        setFormData({
          fullName: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }

      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "הפרופיל עודכן בהצלחה!",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה בעדכון הפרופיל",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Header />
      <div className="container mx-auto p-4 pt-24">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>הפרופיל שלי</CardTitle>
            <CardDescription>נהל את הפרטים האישיים שלך</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  dir="rtl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  dir="ltr"
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  לא ניתן לשנות את כתובת האימייל
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "שומר..." : "שמור שינויים"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSignOut}>
                  התנתק
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
