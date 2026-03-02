import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserLocation {
  lat: number;
  lon: number;
  tz: string;
}

export interface CustomOffsets {
  candleLightingMinutesBefore: number;
  shkiahOffset: number;
  tzeitOffset: number;
}

export interface NotificationChannels {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface VerifiedChannels {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
}

export type ObservanceLevel = "religious" | "traditional" | "secular";
export type ZmanimPreset = "strict" | "standard" | "lenient" | "custom";
export type AppLanguage = "he" | "en";

export interface UserPreferences {
  id: string;
  user_id: string;
  observance_level: ObservanceLevel;
  language: AppLanguage;
  minhag: string | null;
  location: UserLocation | null;
  multiple_locations: UserLocation[];
  timezone: string;
  zmanim_preset: ZmanimPreset;
  custom_offsets: CustomOffsets | null;
  silent_during_shabbat: boolean;
  channels: NotificationChannels;
  verified_channels: VerifiedChannels;
  created_at: string;
  updated_at: string;
}

export type UserPreferencesUpdate = Partial<
  Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">
>;

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery<UserPreferences>({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("user-preferences", {
        method: "GET",
      });
      if (res.error) throw res.error;
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      const res = await supabase.functions.invoke("user-preferences", {
        method: "PUT",
        body: updates,
      });
      if (res.error) throw res.error;
      return res.data.data as UserPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-preferences"], data);
      toast.success("ההעדפות עודכנו בהצלחה");
    },
    onError: (error: Error) => {
      toast.error(`שגיאה בעדכון העדפות: ${error.message}`);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: mutation.mutate,
    updatePreferencesAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
