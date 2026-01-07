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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_template_fields: {
        Row: {
          action_template_id: string
          created_at: string
          display_order: number
          field_name: string
          field_options: string[] | null
          field_type: string
          id: string
          is_required: boolean
        }
        Insert: {
          action_template_id: string
          created_at?: string
          display_order?: number
          field_name: string
          field_options?: string[] | null
          field_type: string
          id?: string
          is_required?: boolean
        }
        Update: {
          action_template_id?: string
          created_at?: string
          display_order?: number
          field_name?: string
          field_options?: string[] | null
          field_type?: string
          id?: string
          is_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "action_template_fields_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "action_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      action_templates: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          product_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          product_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      action_updates: {
        Row: {
          action_id: string
          created_at: string
          created_by: string | null
          id: string
          new_date: string | null
          new_owner_id: string | null
          new_owner_type: string | null
          new_status: Database["public"]["Enums"]["action_status"] | null
          new_value: number | null
          notes: string | null
          previous_date: string | null
          previous_owner_id: string | null
          previous_owner_type: string | null
          previous_status: Database["public"]["Enums"]["action_status"] | null
          previous_value: number | null
          response_text: string | null
          update_type: string
        }
        Insert: {
          action_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_date?: string | null
          new_owner_id?: string | null
          new_owner_type?: string | null
          new_status?: Database["public"]["Enums"]["action_status"] | null
          new_value?: number | null
          notes?: string | null
          previous_date?: string | null
          previous_owner_id?: string | null
          previous_owner_type?: string | null
          previous_status?: Database["public"]["Enums"]["action_status"] | null
          previous_value?: number | null
          response_text?: string | null
          update_type: string
        }
        Update: {
          action_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_date?: string | null
          new_owner_id?: string | null
          new_owner_type?: string | null
          new_status?: Database["public"]["Enums"]["action_status"] | null
          new_value?: number | null
          notes?: string | null
          previous_date?: string | null
          previous_owner_id?: string | null
          previous_owner_type?: string | null
          previous_status?: Database["public"]["Enums"]["action_status"] | null
          previous_value?: number | null
          response_text?: string | null
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_updates_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          action_target_date: string
          created_at: string
          creation_reason: string | null
          creator_name: string
          current_owner_id: string | null
          current_owner_type: string | null
          current_planned_date: string | null
          current_status: Database["public"]["Enums"]["action_status"]
          current_value: number | null
          customer_hints: string | null
          customer_id: string
          description: string | null
          id: string
          is_recursive: boolean
          name: string
          next_recurrence_date: string | null
          parent_action_id: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          product_id: string
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          source_data_date: string
          target_value: number | null
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string
        }
        Insert: {
          action_target_date: string
          created_at?: string
          creation_reason?: string | null
          creator_name: string
          current_owner_id?: string | null
          current_owner_type?: string | null
          current_planned_date?: string | null
          current_status?: Database["public"]["Enums"]["action_status"]
          current_value?: number | null
          customer_hints?: string | null
          customer_id: string
          description?: string | null
          id?: string
          is_recursive?: boolean
          name: string
          next_recurrence_date?: string | null
          parent_action_id?: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          product_id: string
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          source_data_date: string
          target_value?: number | null
          type: Database["public"]["Enums"]["action_type"]
          updated_at?: string
        }
        Update: {
          action_target_date?: string
          created_at?: string
          creation_reason?: string | null
          creator_name?: string
          current_owner_id?: string | null
          current_owner_type?: string | null
          current_planned_date?: string | null
          current_status?: Database["public"]["Enums"]["action_status"]
          current_value?: number | null
          customer_hints?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          is_recursive?: boolean
          name?: string
          next_recurrence_date?: string | null
          parent_action_id?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          product_id?: string
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          source_data_date?: string
          target_value?: number | null
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_parent_action_id_fkey"
            columns: ["parent_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          customer_mapping: Json | null
          id: string
          role: string
          session_id: string
          usage: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          customer_mapping?: Json | null
          id?: string
          role: string
          session_id: string
          usage?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          customer_mapping?: Json | null
          id?: string
          role?: string
          session_id?: string
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          portfolio_manager_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_manager_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_manager_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_portfolio_manager_id_fkey"
            columns: ["portfolio_manager_id"]
            isOneToOne: false
            referencedRelation: "portfolio_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          insights: Json
          model_name: string
          portfolio_manager_id: string
          record_date: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          insights?: Json
          model_name?: string
          portfolio_manager_id: string
          record_date?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          insights?: Json
          model_name?: string
          portfolio_manager_id?: string
          record_date?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      customer_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          portfolio_manager_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          portfolio_manager_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          portfolio_manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_groups_portfolio_manager_id_fkey"
            columns: ["portfolio_manager_id"]
            isOneToOne: false
            referencedRelation: "portfolio_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_products: {
        Row: {
          created_at: string
          current_value: number
          customer_id: string
          external_data: number | null
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          customer_id: string
          external_data?: number | null
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          customer_id?: string
          external_data?: number | null
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_products_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          last_activity_date: string | null
          name: string
          portfolio_manager_id: string
          principality_score: number | null
          sector: Database["public"]["Enums"]["customer_sector"]
          segment: Database["public"]["Enums"]["customer_segment"]
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_activity_date?: string | null
          name: string
          portfolio_manager_id: string
          principality_score?: number | null
          sector: Database["public"]["Enums"]["customer_sector"]
          segment: Database["public"]["Enums"]["customer_segment"]
          status: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_activity_date?: string | null
          name?: string
          portfolio_manager_id?: string
          principality_score?: number | null
          sector?: Database["public"]["Enums"]["customer_sector"]
          segment?: Database["public"]["Enums"]["customer_segment"]
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_portfolio_manager_id_fkey"
            columns: ["portfolio_manager_id"]
            isOneToOne: false
            referencedRelation: "portfolio_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_managers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          portfolio_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          portfolio_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          portfolio_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_targets: {
        Row: {
          created_at: string
          flow_count: number
          flow_count_delta_mtd: number
          flow_count_delta_ytd: number
          flow_count_tar: number
          flow_count_target: number
          flow_volume: number
          flow_volume_delta_mtd: number
          flow_volume_delta_ytd: number
          flow_volume_tar: number
          flow_volume_target: number
          id: string
          measure_date: string
          portfolio_manager_id: string
          product_id: string
          record_date: string
          stock_count: number
          stock_count_delta_mtd: number
          stock_count_delta_ytd: number
          stock_count_tar: number
          stock_count_target: number
          stock_volume: number
          stock_volume_delta_mtd: number
          stock_volume_delta_ytd: number
          stock_volume_tar: number
          stock_volume_target: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          flow_count?: number
          flow_count_delta_mtd?: number
          flow_count_delta_ytd?: number
          flow_count_tar?: number
          flow_count_target?: number
          flow_volume?: number
          flow_volume_delta_mtd?: number
          flow_volume_delta_ytd?: number
          flow_volume_tar?: number
          flow_volume_target?: number
          id?: string
          measure_date?: string
          portfolio_manager_id: string
          product_id: string
          record_date: string
          stock_count?: number
          stock_count_delta_mtd?: number
          stock_count_delta_ytd?: number
          stock_count_tar?: number
          stock_count_target?: number
          stock_volume?: number
          stock_volume_delta_mtd?: number
          stock_volume_delta_ytd?: number
          stock_volume_tar?: number
          stock_volume_target?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          flow_count?: number
          flow_count_delta_mtd?: number
          flow_count_delta_ytd?: number
          flow_count_tar?: number
          flow_count_target?: number
          flow_volume?: number
          flow_volume_delta_mtd?: number
          flow_volume_delta_ytd?: number
          flow_volume_tar?: number
          flow_volume_target?: number
          id?: string
          measure_date?: string
          portfolio_manager_id?: string
          product_id?: string
          record_date?: string
          stock_count?: number
          stock_count_delta_mtd?: number
          stock_count_delta_ytd?: number
          stock_count_tar?: number
          stock_count_target?: number
          stock_volume?: number
          stock_volume_delta_mtd?: number
          stock_volume_delta_ytd?: number
          stock_volume_tar?: number
          stock_volume_target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_targets_portfolio_manager_id_fkey"
            columns: ["portfolio_manager_id"]
            isOneToOne: false
            referencedRelation: "portfolio_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_thresholds: {
        Row: {
          calculation_date: string
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          sector: Database["public"]["Enums"]["customer_sector"]
          segment: Database["public"]["Enums"]["customer_segment"]
          threshold_value: number
          updated_at: string
          version_num: number
        }
        Insert: {
          calculation_date?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          sector: Database["public"]["Enums"]["customer_sector"]
          segment: Database["public"]["Enums"]["customer_segment"]
          threshold_value?: number
          updated_at?: string
          version_num?: number
        }
        Update: {
          calculation_date?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          sector?: Database["public"]["Enums"]["customer_sector"]
          segment?: Database["public"]["Enums"]["customer_segment"]
          threshold_value?: number
          updated_at?: string
          version_num?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_external: boolean
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_external?: boolean
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_external?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_portfolio_manager_id: { Args: { _user_id: string }; Returns: string }
      user_owns_customer: { Args: { _customer_id: string }; Returns: boolean }
    }
    Enums: {
      action_priority: "high" | "medium" | "low"
      action_status:
        | "Beklemede"
        | "Planlandı"
        | "Tamamlandı"
        | "Ertelendi"
        | "İlgilenmiyor"
        | "Uygun Değil"
      action_type: "model_based" | "ad_hoc" | "rm_action" | "recursive"
      customer_sector:
        | "Turizm"
        | "Ulaşım"
        | "Perakende"
        | "Gayrimenkul"
        | "Tarım Hayvancılık"
        | "Sağlık"
        | "Enerji"
      customer_segment: "MİKRO" | "Kİ" | "OBİ" | "TİCARİ"
      customer_status:
        | "Yeni Müşteri"
        | "Aktif"
        | "Target"
        | "Strong Target"
        | "Ana Banka"
      product_category:
        | "Kredi"
        | "Kaynak"
        | "Ödeme"
        | "Tahsilat"
        | "Sigorta"
        | "İştirak"
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
      action_priority: ["high", "medium", "low"],
      action_status: [
        "Beklemede",
        "Planlandı",
        "Tamamlandı",
        "Ertelendi",
        "İlgilenmiyor",
        "Uygun Değil",
      ],
      action_type: ["model_based", "ad_hoc", "rm_action", "recursive"],
      customer_sector: [
        "Turizm",
        "Ulaşım",
        "Perakende",
        "Gayrimenkul",
        "Tarım Hayvancılık",
        "Sağlık",
        "Enerji",
      ],
      customer_segment: ["MİKRO", "Kİ", "OBİ", "TİCARİ"],
      customer_status: [
        "Yeni Müşteri",
        "Aktif",
        "Target",
        "Strong Target",
        "Ana Banka",
      ],
      product_category: [
        "Kredi",
        "Kaynak",
        "Ödeme",
        "Tahsilat",
        "Sigorta",
        "İştirak",
      ],
    },
  },
} as const
