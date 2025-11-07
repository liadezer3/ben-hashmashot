import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Bell, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface NotificationRecord {
  id: string;
  notification_type: string;
  sent_at: string;
  status: string;
  message: string | null;
}

export const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      "sms": "SMS",
      "email": "אימייל",
      "whatsapp": "WhatsApp",
      "push": "התראה"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">היסטוריית התראות</h2>
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          עדיין לא נשלחו התראות
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {notification.status === "sent" ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    {getNotificationTypeLabel(notification.notification_type)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(notification.sent_at), "dd/MM/yyyy HH:mm", { locale: he })}
                  </span>
                </div>
                {notification.message && (
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
