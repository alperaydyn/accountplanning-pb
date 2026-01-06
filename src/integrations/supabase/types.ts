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
      actions: {
        Row: {
          action_response: string | null
          completed_date: string | null
          created_at: string
          customer_id: string
          description: string | null
          estimated_action_time: number | null
          explanation: string | null
          id: string
          name: string
          planned_date: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          product_id: string
          status: Database["public"]["Enums"]["action_status"]
          target_value: number | null
          time_to_ready: number
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string
        }
        Insert: {
          action_response?: string | null
          completed_date?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          estimated_action_time?: number | null
          explanation?: string | null
          id?: string
          name: string
          planned_date?: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          product_id: string
          status?: Database["public"]["Enums"]["action_status"]
          target_value?: number | null
          time_to_ready?: number
          type: Database["public"]["Enums"]["action_type"]
          updated_at?: string
        }
        Update: {
          action_response?: string | null
          completed_date?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          estimated_action_time?: number | null
          explanation?: string | null
          id?: string
          name?: string
          planned_date?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          product_id?: string
          status?: Database["public"]["Enums"]["action_status"]
          target_value?: number | null
          time_to_ready?: number
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
            foreignKeyName: "actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          customer_id: string
          external_data?: number | null
          id?: string
          product_id: string
          threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          customer_id?: string
          external_data?: number | null
          id?: string
          product_id?: string
          threshold?: number
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
          id: string
          is_external: boolean
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
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
      action_type: "model_based" | "ad_hoc"
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
        | "TL Nakdi Kredi"
        | "TL Gayrinakdi Kredi"
        | "YP Nakdi Kredi"
        | "YP Gayrinakdi Kredi"
        | "TL Vadeli"
        | "TL Vadesiz"
        | "YP Vadeli"
        | "YP Vadesiz"
        | "TL Yatırım Fonu"
        | "YP Yatırım Fonu"
        | "Ticari Kart"
        | "Üye İşyeri"
        | "Maaş"
        | "Sigorta-Hayat"
        | "Sigorta-Elementer"
        | "Sigorta-BES"
        | "Faktoring"
        | "Leasing"
        | "Ödeme Çeki"
        | "Tahsil Çeki"
        | "DTS"
        | "Garantili Ödeme"
        | "Garanti Filo Kiralama"
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
      action_type: ["model_based", "ad_hoc"],
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
        "TL Nakdi Kredi",
        "TL Gayrinakdi Kredi",
        "YP Nakdi Kredi",
        "YP Gayrinakdi Kredi",
        "TL Vadeli",
        "TL Vadesiz",
        "YP Vadeli",
        "YP Vadesiz",
        "TL Yatırım Fonu",
        "YP Yatırım Fonu",
        "Ticari Kart",
        "Üye İşyeri",
        "Maaş",
        "Sigorta-Hayat",
        "Sigorta-Elementer",
        "Sigorta-BES",
        "Faktoring",
        "Leasing",
        "Ödeme Çeki",
        "Tahsil Çeki",
        "DTS",
        "Garantili Ödeme",
        "Garanti Filo Kiralama",
      ],
    },
  },
} as const
