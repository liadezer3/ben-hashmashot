export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_reviews: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_history: {
        Row: {
          action: string
          automation_type: string
          created_at: string
          details: string | null
          executed_at: string
          id: string
          platform: string
          scheduled_time: string | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          automation_type: string
          created_at?: string
          details?: string | null
          executed_at?: string
          id?: string
          platform: string
          scheduled_time?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          automation_type?: string
          created_at?: string
          details?: string | null
          executed_at?: string
          id?: string
          platform?: string
          scheduled_time?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      candle_lighting_log: {
        Row: {
          blessing_said: boolean | null
          created_at: string
          id: string
          lit_at: string | null
          notes: string | null
          shabbat_date: string
          user_id: string
        }
        Insert: {
          blessing_said?: boolean | null
          created_at?: string
          id?: string
          lit_at?: string | null
          notes?: string | null
          shabbat_date: string
          user_id: string
        }
        Update: {
          blessing_said?: boolean | null
          created_at?: string
          id?: string
          lit_at?: string | null
          notes?: string | null
          shabbat_date?: string
          user_id?: string
        }
        Relationships: []
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string | null
          created_at: string
          display_name: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_name?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          display_name?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_playlists: {
        Row: {
          created_at: string
          id: string
          phase_key: string
          playlist_name: string
          spotify_uri: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phase_key: string
          playlist_name?: string
          spotify_uri: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phase_key?: string
          playlist_name?: string
          spotify_uri?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string
          group_id: string | null
          hebrew_date: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          recurrence_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_type?: string
          group_id?: string | null
          hebrew_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string
          group_id?: string | null
          hebrew_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_group_members: {
        Row: {
          display_name: string
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          display_name: string
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          display_name?: string
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          auto_send_shabbat_times: boolean | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notify_email: boolean | null
          notify_sms: boolean | null
          notify_whatsapp: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_send_shabbat_times?: boolean | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_send_shabbat_times?: boolean | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_memories: {
        Row: {
          content: string | null
          created_at: string
          date: string | null
          id: string
          image_url: string | null
          parsha: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date?: string | null
          id?: string
          image_url?: string | null
          parsha?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string | null
          id?: string
          image_url?: string | null
          parsha?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_key: string
          id: string
          log_date: string
          notes: string | null
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_key: string
          id?: string
          log_date?: string
          notes?: string | null
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          habit_key?: string
          id?: string
          log_date?: string
          notes?: string | null
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      invitation_guests: {
        Row: {
          created_at: string
          dish_to_bring: string | null
          guest_contact: string | null
          guest_name: string
          id: string
          invitation_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dish_to_bring?: string | null
          guest_contact?: string | null
          guest_name: string
          id?: string
          invitation_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dish_to_bring?: string | null
          guest_contact?: string | null
          guest_name?: string
          id?: string
          invitation_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_guests_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "shabbat_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          created_at: string
          id: string
          message: string | null
          notification_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          notification_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          custom_message: string | null
          days_before_shabbat: number | null
          email: string | null
          email_days_before_shabbat: number | null
          email_enabled: boolean | null
          email_frequency: string
          email_morning_time: string | null
          email_reminder_time: string | null
          hours_before_shabbat: number | null
          id: string
          morning_time: string | null
          phone: string | null
          push_days_before_shabbat: number | null
          push_enabled: boolean | null
          push_frequency: string
          push_morning_time: string | null
          push_reminder_time: string | null
          shabbat_reminder_time: string | null
          sms_days_before_shabbat: number | null
          sms_enabled: boolean | null
          sms_frequency: string
          sms_morning_time: string | null
          sms_reminder_time: string | null
          telegram_chat_id: string | null
          telegram_days_before_shabbat: number | null
          telegram_enabled: boolean | null
          telegram_frequency: string
          telegram_morning_time: string | null
          telegram_reminder_time: string | null
          updated_at: string
          user_id: string
          whatsapp_days_before_shabbat: number | null
          whatsapp_enabled: boolean | null
          whatsapp_frequency: string
          whatsapp_morning_time: string | null
          whatsapp_reminder_time: string | null
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          days_before_shabbat?: number | null
          email?: string | null
          email_days_before_shabbat?: number | null
          email_enabled?: boolean | null
          email_frequency?: string
          email_morning_time?: string | null
          email_reminder_time?: string | null
          hours_before_shabbat?: number | null
          id?: string
          morning_time?: string | null
          phone?: string | null
          push_days_before_shabbat?: number | null
          push_enabled?: boolean | null
          push_frequency?: string
          push_morning_time?: string | null
          push_reminder_time?: string | null
          shabbat_reminder_time?: string | null
          sms_days_before_shabbat?: number | null
          sms_enabled?: boolean | null
          sms_frequency?: string
          sms_morning_time?: string | null
          sms_reminder_time?: string | null
          telegram_chat_id?: string | null
          telegram_days_before_shabbat?: number | null
          telegram_enabled?: boolean | null
          telegram_frequency?: string
          telegram_morning_time?: string | null
          telegram_reminder_time?: string | null
          updated_at?: string
          user_id: string
          whatsapp_days_before_shabbat?: number | null
          whatsapp_enabled?: boolean | null
          whatsapp_frequency?: string
          whatsapp_morning_time?: string | null
          whatsapp_reminder_time?: string | null
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          days_before_shabbat?: number | null
          email?: string | null
          email_days_before_shabbat?: number | null
          email_enabled?: boolean | null
          email_frequency?: string
          email_morning_time?: string | null
          email_reminder_time?: string | null
          hours_before_shabbat?: number | null
          id?: string
          morning_time?: string | null
          phone?: string | null
          push_days_before_shabbat?: number | null
          push_enabled?: boolean | null
          push_frequency?: string
          push_morning_time?: string | null
          push_reminder_time?: string | null
          shabbat_reminder_time?: string | null
          sms_days_before_shabbat?: number | null
          sms_enabled?: boolean | null
          sms_frequency?: string
          sms_morning_time?: string | null
          sms_reminder_time?: string | null
          telegram_chat_id?: string | null
          telegram_days_before_shabbat?: number | null
          telegram_enabled?: boolean | null
          telegram_frequency?: string
          telegram_morning_time?: string | null
          telegram_reminder_time?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_days_before_shabbat?: number | null
          whatsapp_enabled?: boolean | null
          whatsapp_frequency?: string
          whatsapp_morning_time?: string | null
          whatsapp_reminder_time?: string | null
        }
        Relationships: []
      }
      omer_counts: {
        Row: {
          counted_at: string
          created_at: string
          day_number: number
          id: string
          user_id: string
          year: number
        }
        Insert: {
          counted_at?: string
          created_at?: string
          day_number: number
          id?: string
          user_id: string
          year?: number
        }
        Update: {
          counted_at?: string
          created_at?: string
          day_number?: number
          id?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          city: string
          created_at: string
          id: string
          is_primary: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shabbat_invitations: {
        Row: {
          address: string | null
          candle_lighting: string | null
          created_at: string
          havdalah: string | null
          host_name: string
          id: string
          invite_code: string
          max_guests: number | null
          message: string | null
          shabbat_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          candle_lighting?: string | null
          created_at?: string
          havdalah?: string | null
          host_name?: string
          id?: string
          invite_code?: string
          max_guests?: number | null
          message?: string | null
          shabbat_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          candle_lighting?: string | null
          created_at?: string
          havdalah?: string | null
          host_name?: string
          id?: string
          invite_code?: string
          max_guests?: number | null
          message?: string | null
          shabbat_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shabbat_ratings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          parsha: string | null
          rating: number
          shabbat_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          parsha?: string | null
          rating: number
          shabbat_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          parsha?: string | null
          rating?: number
          shabbat_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shabbat_tasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          is_default: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_default?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_default?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_tasks: {
        Row: {
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string
          created_by_name: string
          group_id: string
          id: string
          is_completed: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by: string
          created_by_name: string
          group_id: string
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string
          group_id?: string
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          added_by: string
          added_by_name: string
          category: string | null
          created_at: string
          group_id: string
          id: string
          is_purchased: boolean | null
          purchased_by_name: string | null
          quantity: string | null
          title: string
          updated_at: string
        }
        Insert: {
          added_by: string
          added_by_name?: string
          category?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_purchased?: boolean | null
          purchased_by_name?: string | null
          quantity?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          added_by_name?: string
          category?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_purchased?: boolean | null
          purchased_by_name?: string | null
          quantity?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_home_settings: {
        Row: {
          created_at: string
          ha_config: Json | null
          hue_config: Json | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ha_config?: Json | null
          hue_config?: Json | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ha_config?: Json | null
          hue_config?: Json | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          channels: Json
          created_at: string
          custom_offsets: Json | null
          id: string
          language: Database["public"]["Enums"]["app_language"]
          location: Json | null
          minhag: string | null
          multiple_locations: Json | null
          observance_level: Database["public"]["Enums"]["observance_level"]
          silent_during_shabbat: boolean
          timezone: string | null
          updated_at: string
          user_id: string
          verified_channels: Json
          zmanim_preset: Database["public"]["Enums"]["zmanim_preset"]
        }
        Insert: {
          channels?: Json
          created_at?: string
          custom_offsets?: Json | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          location?: Json | null
          minhag?: string | null
          multiple_locations?: Json | null
          observance_level?: Database["public"]["Enums"]["observance_level"]
          silent_during_shabbat?: boolean
          timezone?: string | null
          updated_at?: string
          user_id: string
          verified_channels?: Json
          zmanim_preset?: Database["public"]["Enums"]["zmanim_preset"]
        }
        Update: {
          channels?: Json
          created_at?: string
          custom_offsets?: Json | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          location?: Json | null
          minhag?: string | null
          multiple_locations?: Json | null
          observance_level?: Database["public"]["Enums"]["observance_level"]
          silent_during_shabbat?: boolean
          timezone?: string | null
          updated_at?: string
          user_id?: string
          verified_channels?: Json
          zmanim_preset?: Database["public"]["Enums"]["zmanim_preset"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      "זמני שבת וחג": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_family_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      join_family_group_by_code: {
        Args: { p_display_name: string; p_invite_code: string }
        Returns: string
      }
    }
    Enums: {
      app_language: "he" | "en"
      app_role: "admin" | "user"
      observance_level: "religious" | "traditional" | "secular"
      zmanim_preset: "strict" | "standard" | "lenient" | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_language: ["he", "en"],
      app_role: ["admin", "user"],
      observance_level: ["religious", "traditional", "secular"],
      zmanim_preset: ["strict", "standard", "lenient", "custom"],
    },
  },
} as const
