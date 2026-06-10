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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_key_request_logs: {
        Row: {
          api_key_id: string
          client_id: string
          created_at: string
          device_id: string | null
          device_name: string | null
          endpoint_path: string
          id: string
          ip_address: string | null
          request_method: string
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          client_id: string
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          endpoint_path: string
          id?: string
          ip_address?: string | null
          request_method?: string
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          client_id?: string
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          endpoint_path?: string
          id?: string
          ip_address?: string | null
          request_method?: string
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          client_id: string
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number
          status: Database["public"]["Enums"]["api_key_status"]
          usage_count: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number
          status?: Database["public"]["Enums"]["api_key_status"]
          usage_count?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number
          status?: Database["public"]["Enums"]["api_key_status"]
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_campaigns: {
        Row: {
          client_id: string
          created_at: string
          failed_count: number
          id: string
          message_template: string
          name: string
          scheduled_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["campaign_status"]
          total_count: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          failed_count?: number
          id?: string
          message_template: string
          name: string
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_count?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          failed_count?: number
          id?: string
          message_template?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          monthly_quota: number
          name: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_quota?: number
          name: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_quota?: number
          name?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_logs: {
        Row: {
          created_at: string
          device_id: string
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          device_id: string
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          device_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "device_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          android_version: string | null
          app_version: string | null
          battery_level: number | null
          client_id: string | null
          created_at: string
          device_name: string
          device_token: string
          id: string
          internet_type: string | null
          ip_address: string | null
          last_seen: string | null
          phone_number: string | null
          signal_strength: number | null
          sim_operator: string | null
          sim_slot: number | null
          status: Database["public"]["Enums"]["device_status"]
          total_sms_failed: number
          total_sms_sent: number
          updated_at: string
        }
        Insert: {
          android_version?: string | null
          app_version?: string | null
          battery_level?: number | null
          client_id?: string | null
          created_at?: string
          device_name: string
          device_token: string
          id?: string
          internet_type?: string | null
          ip_address?: string | null
          last_seen?: string | null
          phone_number?: string | null
          signal_strength?: number | null
          sim_operator?: string | null
          sim_slot?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          total_sms_failed?: number
          total_sms_sent?: number
          updated_at?: string
        }
        Update: {
          android_version?: string | null
          app_version?: string | null
          battery_level?: number | null
          client_id?: string | null
          created_at?: string
          device_name?: string
          device_token?: string
          id?: string
          internet_type?: string | null
          ip_address?: string | null
          last_seen?: string | null
          phone_number?: string | null
          signal_strength?: number | null
          sim_operator?: string | null
          sim_slot?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          total_sms_failed?: number
          total_sms_sent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message_id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message_id: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          client_id: string
          created_at: string
          delivered_at: string | null
          device_id: string | null
          encoding: string
          error_message: string | null
          external_reference: string | null
          failed_at: string | null
          id: string
          max_retries: number
          message: string
          parts_count: number
          priority: number
          processing_at: string | null
          provider_response: Json | null
          recipient: string
          retry_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delivered_at?: string | null
          device_id?: string | null
          encoding?: string
          error_message?: string | null
          external_reference?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number
          message: string
          parts_count?: number
          priority?: number
          processing_at?: string | null
          provider_response?: Json | null
          recipient: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delivered_at?: string | null
          device_id?: string | null
          encoding?: string
          error_message?: string | null
          external_reference?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number
          message?: string
          parts_count?: number
          priority?: number
          processing_at?: string | null
          provider_response?: Json | null
          recipient?: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          delivered_at: string | null
          duration_ms: number | null
          event_type: string
          id: string
          message_id: string | null
          payload: Json
          request_body: Json | null
          request_headers: Json
          request_signature: string | null
          response_body: string | null
          response_headers: Json
          response_status: number | null
          succeeded: boolean
          target_url: string | null
          webhook_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          message_id?: string | null
          payload: Json
          request_body?: Json | null
          request_headers?: Json
          request_signature?: string | null
          response_body?: string | null
          response_headers?: Json
          response_status?: number | null
          succeeded?: boolean
          target_url?: string | null
          webhook_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          message_id?: string | null
          payload?: Json
          request_body?: Json | null
          request_headers?: Json
          request_signature?: string | null
          response_body?: string | null
          response_headers?: Json
          response_status?: number | null
          succeeded?: boolean
          target_url?: string | null
          webhook_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          events: string[]
          failure_count: number
          id: string
          last_status: number | null
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          last_status?: number | null
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          last_status?: number | null
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      api_key_status: "active" | "revoked"
      app_role: "super_admin" | "admin" | "client_user"
      campaign_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      device_status: "online" | "offline" | "sending" | "inactive" | "disabled"
      message_status:
        | "queued"
        | "processing"
        | "sent"
        | "delivered"
        | "failed"
        | "cancelled"
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
      api_key_status: ["active", "revoked"],
      app_role: ["super_admin", "admin", "client_user"],
      campaign_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      device_status: ["online", "offline", "sending", "inactive", "disabled"],
      message_status: [
        "queued",
        "processing",
        "sent",
        "delivered",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
