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
      air_cargo_clients: {
        Row: {
          client_name: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      air_cargo_consignments: {
        Row: {
          consignment_name: string
          consignment_number: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          consignment_name: string
          consignment_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          consignment_name?: string
          consignment_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      air_cargo_shipments: {
        Row: {
          account_code: string | null
          chargeable_weight_kg: number | null
          client_id: string
          consignment_id: string | null
          created_at: string
          created_by: string | null
          date_received: string
          dead_weight_kg: number | null
          destination: string | null
          dims_notes: string | null
          height_cm: number | null
          id: string
          invoice_no: string | null
          length_cm: number | null
          packed_in: string | null
          pieces: number | null
          remarks: string | null
          status: string
          updated_at: string
          updated_by: string | null
          volumetric_weight_kg: number | null
          volumetric_weight_locked: boolean | null
          width_cm: number | null
        }
        Insert: {
          account_code?: string | null
          chargeable_weight_kg?: number | null
          client_id: string
          consignment_id?: string | null
          created_at?: string
          created_by?: string | null
          date_received?: string
          dead_weight_kg?: number | null
          destination?: string | null
          dims_notes?: string | null
          height_cm?: number | null
          id?: string
          invoice_no?: string | null
          length_cm?: number | null
          packed_in?: string | null
          pieces?: number | null
          remarks?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          volumetric_weight_kg?: number | null
          volumetric_weight_locked?: boolean | null
          width_cm?: number | null
        }
        Update: {
          account_code?: string | null
          chargeable_weight_kg?: number | null
          client_id?: string
          consignment_id?: string | null
          created_at?: string
          created_by?: string | null
          date_received?: string
          dead_weight_kg?: number | null
          destination?: string | null
          dims_notes?: string | null
          height_cm?: number | null
          id?: string
          invoice_no?: string | null
          length_cm?: number | null
          packed_in?: string | null
          pieces?: number | null
          remarks?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          volumetric_weight_kg?: number | null
          volumetric_weight_locked?: boolean | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "air_cargo_shipments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "air_cargo_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "air_cargo_shipments_consignment_id_fkey"
            columns: ["consignment_id"]
            isOneToOne: false
            referencedRelation: "air_cargo_consignments"
            referencedColumns: ["id"]
          },
        ]
      }
      buy_request_items: {
        Row: {
          buy_request_id: string
          color: string | null
          created_at: string
          id: string
          price: number | null
          product_name: string
          product_url: string | null
          quantity: number
          size: string | null
          store_name: string | null
          updated_at: string
        }
        Insert: {
          buy_request_id: string
          color?: string | null
          created_at?: string
          id?: string
          price?: number | null
          product_name: string
          product_url?: string | null
          quantity?: number
          size?: string | null
          store_name?: string | null
          updated_at?: string
        }
        Update: {
          buy_request_id?: string
          color?: string | null
          created_at?: string
          id?: string
          price?: number | null
          product_name?: string
          product_url?: string | null
          quantity?: number
          size?: string | null
          store_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buy_request_items_buy_request_id_fkey"
            columns: ["buy_request_id"]
            isOneToOne: false
            referencedRelation: "buy_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      buy_requests: {
        Row: {
          admin_notes: string | null
          color: string | null
          country_of_purchase: string
          created_at: string
          delivery_deadline: string | null
          id: string
          notes: string | null
          product_name: string
          product_price: number | null
          product_url: string | null
          quantity: number
          screenshot_url: string | null
          size: string | null
          status: string
          status_updated_at: string | null
          status_updated_by: string | null
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          color?: string | null
          country_of_purchase: string
          created_at?: string
          delivery_deadline?: string | null
          id?: string
          notes?: string | null
          product_name: string
          product_price?: number | null
          product_url?: string | null
          quantity?: number
          screenshot_url?: string | null
          size?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          color?: string | null
          country_of_purchase?: string
          created_at?: string
          delivery_deadline?: string | null
          id?: string
          notes?: string | null
          product_name?: string
          product_price?: number | null
          product_url?: string | null
          quantity?: number
          screenshot_url?: string | null
          size?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buy_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          order_type: string
          reference_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_type: string
          reference_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_type?: string
          reference_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_tracker: {
        Row: {
          amount: number | null
          client_id: string
          created_at: string
          created_by: string | null
          dod: string | null
          dop: string | null
          from_region: Database["public"]["Enums"]["purchase_region"]
          id: string
          invoice_date: string
          invoice_no: string | null
          item_description: string
          purchased_by: string | null
          qty: number
          remarks: string | null
          source_link: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          store_name: string | null
          store_order_no: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          dod?: string | null
          dop?: string | null
          from_region: Database["public"]["Enums"]["purchase_region"]
          id?: string
          invoice_date: string
          invoice_no?: string | null
          item_description: string
          purchased_by?: string | null
          qty?: number
          remarks?: string | null
          source_link?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          store_name?: string | null
          store_order_no?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          dod?: string | null
          dop?: string | null
          from_region?: Database["public"]["Enums"]["purchase_region"]
          id?: string
          invoice_date?: string
          invoice_no?: string | null
          item_description?: string
          purchased_by?: string | null
          qty?: number
          remarks?: string | null
          source_link?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          store_name?: string | null
          store_order_no?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_tracker_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "air_cargo_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_tracker_audit: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          purchase_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          purchase_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_tracker_audit_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchase_tracker"
            referencedColumns: ["id"]
          },
        ]
      }
      self_purchases: {
        Row: {
          admin_notes: string | null
          courier: string
          created_at: string
          description: string
          estimated_value: number | null
          id: string
          invoice_url: string | null
          notes: string | null
          product_type: string | null
          quantity: number
          status: string
          status_updated_at: string | null
          status_updated_by: string | null
          store_name: string
          tracking_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          courier: string
          created_at?: string
          description: string
          estimated_value?: number | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          product_type?: string | null
          quantity?: number
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          store_name: string
          tracking_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          courier?: string
          created_at?: string
          description?: string
          estimated_value?: number | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          product_type?: string | null
          quantity?: number
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          store_name?: string
          tracking_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          address: string
          country: string
          created_at: string
          id: string
          instructions: string | null
          reference_code: string
        }
        Insert: {
          address: string
          country: string
          created_at?: string
          id?: string
          instructions?: string | null
          reference_code: string
        }
        Update: {
          address?: string
          country?: string
          created_at?: string
          id?: string
          instructions?: string | null
          reference_code?: string
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
      user_shipping_addresses: {
        Row: {
          address_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          address_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          address_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shipping_addresses_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: { _reference_id: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      purchase_region: "UK" | "US" | "UAE" | "CN" | "EU" | "AU"
      purchase_status:
        | "PENDING"
        | "ORDERED"
        | "RECEIVED"
        | "IN_TRANSIT"
        | "READY"
        | "DELIVERED"
        | "CANCELLED"
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
      app_role: ["admin", "user"],
      purchase_region: ["UK", "US", "UAE", "CN", "EU", "AU"],
      purchase_status: [
        "PENDING",
        "ORDERED",
        "RECEIVED",
        "IN_TRANSIT",
        "READY",
        "DELIVERED",
        "CANCELLED",
      ],
    },
  },
} as const
