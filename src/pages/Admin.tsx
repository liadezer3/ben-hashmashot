import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast({
          title: "אין הרשאה",
          description: "אין לך הרשאות אדמין לצפות בדף זה",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    };

    checkAdminStatus();
  }, [navigate, toast]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המשתמשים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ["תאריך רישום", "שם מלא", "אימייל", "טלפון"];
    const rows = users.map(user => [
      new Date(user.created_at).toLocaleDateString("he-IL"),
      user.full_name || "",
      user.email || "",
      user.phone || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Add BOM for Hebrew support in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "הצלחה",
      description: "הקובץ יוצא בהצלחה",
    });
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
            </div>
            <Button onClick={exportToExcel} className="gap-2">
              <Download className="w-4 h-4" />
              ייצא לאקסל
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-3 font-semibold">תאריך רישום</th>
                  <th className="text-right p-3 font-semibold">שם מלא</th>
                  <th className="text-right p-3 font-semibold">אימייל</th>
                  <th className="text-right p-3 font-semibold">טלפון</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {new Date(user.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td className="p-3">{user.full_name || "-"}</td>
                    <td className="p-3" dir="ltr">{user.email || "-"}</td>
                    <td className="p-3" dir="ltr">{user.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                אין משתמשים רשומים
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
