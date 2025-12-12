export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      histories: {
        Row: {
          action_type: Database["public"]["Enums"]["history_action_type"]
          created_at: string
          from_owner_id: string
          from_owner_type: Database["public"]["Enums"]["owner_type"]
          id: string
          is_recall: boolean
          recall_reason: string | null
          shipment_batch_id: string | null
          to_owner_id: string
          to_owner_type: Database["public"]["Enums"]["owner_type"]
          virtual_code_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["history_action_type"]
          created_at?: string
          from_owner_id: string
          from_owner_type: Database["public"]["Enums"]["owner_type"]
          id?: string
          is_recall?: boolean
          recall_reason?: string | null
          shipment_batch_id?: string | null
          to_owner_id: string
          to_owner_type: Database["public"]["Enums"]["owner_type"]
          virtual_code_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["history_action_type"]
          created_at?: string
          from_owner_id?: string
          from_owner_type?: Database["public"]["Enums"]["owner_type"]
          id?: string
          is_recall?: boolean
          recall_reason?: string | null
          shipment_batch_id?: string | null
          to_owner_id?: string
          to_owner_type?: Database["public"]["Enums"]["owner_type"]
          virtual_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "histories_shipment_batch_id_fkey"
            columns: ["shipment_batch_id"]
            isOneToOne: false
            referencedRelation: "shipment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "histories_virtual_code_id_fkey"
            columns: ["virtual_code_id"]
            isOneToOne: false
            referencedRelation: "virtual_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          created_at: string
          expiry_date: string
          id: string
          lot_number: string
          manufacture_date: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          expiry_date: string
          id?: string
          lot_number: string
          manufacture_date: string
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: string
          lot_number?: string
          manufacture_date?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer_settings: {
        Row: {
          created_at: string
          expiry_months: number
          id: string
          lot_date_format: string
          lot_model_digits: number
          lot_prefix: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_months?: number
          id?: string
          lot_date_format?: string
          lot_model_digits?: number
          lot_prefix?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_months?: number
          id?: string
          lot_date_format?: string
          lot_model_digits?: number
          lot_prefix?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_sent: boolean
          patient_phone: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_sent?: boolean
          patient_phone: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_sent?: boolean
          patient_phone?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_messages_patient_phone_fkey"
            columns: ["patient_phone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["phone_number"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          auth_user_id: string | null
          business_license_file: string
          business_number: string
          created_at: string
          email: string
          id: string
          name: string
          representative_contact: string
          representative_name: string
          status: Database["public"]["Enums"]["organization_status"]
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
        }
        Insert: {
          address: string
          auth_user_id?: string | null
          business_license_file: string
          business_number: string
          created_at?: string
          email: string
          id?: string
          name: string
          representative_contact: string
          representative_name: string
          status?: Database["public"]["Enums"]["organization_status"]
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Update: {
          address?: string
          auth_user_id?: string | null
          business_license_file?: string
          business_number?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          representative_contact?: string
          representative_name?: string
          status?: Database["public"]["Enums"]["organization_status"]
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          phone_number: string
        }
        Update: {
          created_at?: string
          phone_number?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          model_name: string
          name: string
          organization_id: string
          udi_di: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          model_name: string
          name: string
          organization_id: string
          udi_di: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          model_name?: string
          name?: string
          organization_id?: string
          udi_di?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_batches: {
        Row: {
          created_at: string
          from_organization_id: string
          id: string
          is_recalled: boolean
          recall_date: string | null
          recall_reason: string | null
          shipment_date: string
          to_organization_id: string
          to_organization_type: Database["public"]["Enums"]["organization_type"]
        }
        Insert: {
          created_at?: string
          from_organization_id: string
          id?: string
          is_recalled?: boolean
          recall_date?: string | null
          recall_reason?: string | null
          shipment_date?: string
          to_organization_id: string
          to_organization_type: Database["public"]["Enums"]["organization_type"]
        }
        Update: {
          created_at?: string
          from_organization_id?: string
          id?: string
          is_recalled?: boolean
          recall_date?: string | null
          recall_reason?: string | null
          shipment_date?: string
          to_organization_id?: string
          to_organization_type?: Database["public"]["Enums"]["organization_type"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_batches_from_organization_id_fkey"
            columns: ["from_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_batches_to_organization_id_fkey"
            columns: ["to_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_details: {
        Row: {
          id: string
          shipment_batch_id: string
          virtual_code_id: string
        }
        Insert: {
          id?: string
          shipment_batch_id: string
          virtual_code_id: string
        }
        Update: {
          id?: string
          shipment_batch_id?: string
          virtual_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_details_shipment_batch_id_fkey"
            columns: ["shipment_batch_id"]
            isOneToOne: false
            referencedRelation: "shipment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_details_virtual_code_id_fkey"
            columns: ["virtual_code_id"]
            isOneToOne: false
            referencedRelation: "virtual_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_details: {
        Row: {
          id: string
          treatment_id: string
          virtual_code_id: string
        }
        Insert: {
          id?: string
          treatment_id: string
          virtual_code_id: string
        }
        Update: {
          id?: string
          treatment_id?: string
          virtual_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_details_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatment_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_details_virtual_code_id_fkey"
            columns: ["virtual_code_id"]
            isOneToOne: false
            referencedRelation: "virtual_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_records: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          patient_phone: string
          treatment_date: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          patient_phone: string
          treatment_date: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          patient_phone?: string
          treatment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_records_patient_phone_fkey"
            columns: ["patient_phone"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["phone_number"]
          },
        ]
      }
      virtual_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          lot_id: string
          owner_id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          status: Database["public"]["Enums"]["virtual_code_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          lot_id: string
          owner_id: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          status?: Database["public"]["Enums"]["virtual_code_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          lot_id?: string
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          status?: Database["public"]["Enums"]["virtual_code_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_codes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_quantity_to_lot: {
        Args: { p_additional_quantity: number; p_lot_id: string }
        Returns: number
      }
      count_unique_patients: {
        Args: { p_hospital_id: string }
        Returns: number
      }
      create_shipment_atomic:
        | {
            Args: {
              p_from_org_id: string
              p_items: Json
              p_to_org_id: string
              p_to_org_type: Database["public"]["Enums"]["organization_type"]
            }
            Returns: {
              error_code: string
              error_message: string
              shipment_batch_id: string
              total_quantity: number
            }[]
          }
        | {
            Args: {
              p_items: Json
              p_to_org_id: string
              p_to_org_type: Database["public"]["Enums"]["organization_type"]
            }
            Returns: {
              error_code: string
              error_message: string
              shipment_batch_id: string
              total_quantity: number
            }[]
          }
      create_treatment_atomic:
        | {
            Args: {
              p_hospital_id: string
              p_items: Json
              p_patient_phone: string
              p_treatment_date: string
            }
            Returns: {
              error_code: string
              error_message: string
              total_quantity: number
              treatment_id: string
            }[]
          }
        | {
            Args: {
              p_items: Json
              p_patient_phone: string
              p_treatment_date: string
            }
            Returns: {
              error_code: string
              error_message: string
              total_quantity: number
              treatment_id: string
            }[]
          }
      generate_lot_number: {
        Args: {
          p_manufacture_date?: string
          p_manufacturer_id: string
          p_model_name: string
        }
        Returns: string
      }
      generate_virtual_code: { Args: never; Returns: string }
      get_admin_event_summary: {
        Args: {
          p_action_types?: string[]
          p_end_date?: string
          p_include_recalled?: boolean
          p_limit?: number
          p_lot_number?: string
          p_offset?: number
          p_organization_id?: string
          p_product_id?: string
          p_start_date?: string
        }
        Returns: {
          action_type: string
          event_time: string
          from_owner_id: string
          from_owner_type: string
          group_key: string
          is_recall: boolean
          lot_summaries: Json
          recall_reason: string
          sample_code_ids: string[]
          to_owner_id: string
          to_owner_type: string
          total_quantity: number
        }[]
      }
      get_admin_event_summary_count: {
        Args: {
          p_action_types?: string[]
          p_end_date?: string
          p_include_recalled?: boolean
          p_lot_number?: string
          p_organization_id?: string
          p_product_id?: string
          p_start_date?: string
        }
        Returns: number
      }
      get_history_summary: {
        Args: {
          p_action_types?: string[]
          p_end_date?: string
          p_is_recall?: boolean
          p_limit?: number
          p_offset?: number
          p_organization_id: string
          p_start_date?: string
        }
        Returns: {
          action_type: string
          created_at: string
          from_owner_id: string
          from_owner_type: string
          group_key: string
          is_recall: boolean
          product_summaries: Json
          recall_reason: string
          to_owner_id: string
          to_owner_type: string
          total_quantity: number
        }[]
      }
      get_history_summary_count: {
        Args: {
          p_action_types?: string[]
          p_end_date?: string
          p_is_recall?: boolean
          p_organization_id: string
          p_start_date?: string
        }
        Returns: number
      }
      get_inventory_by_lot: {
        Args: { p_owner_id: string; p_product_id: string }
        Returns: {
          expiry_date: string
          lot_id: string
          lot_number: string
          manufacture_date: string
          quantity: number
        }[]
      }
      get_inventory_count: {
        Args: { p_owner_id: string; p_product_id: string }
        Returns: number
      }
      get_inventory_summary: {
        Args: { p_owner_id: string }
        Returns: {
          product_id: string
          product_name: string
          quantity: number
        }[]
      }
      get_notification_stats: {
        Args: { p_organization_id?: string }
        Returns: {
          auth_count: number
          pending_count: number
          recall_count: number
          sent_count: number
          total_count: number
        }[]
      }
      get_or_create_patient: {
        Args: { p_phone_number: string }
        Returns: string
      }
      get_organization_code_counts: {
        Args: { p_org_ids: string[] }
        Returns: {
          code_count: number
          org_id: string
        }[]
      }
      get_organization_names: {
        Args: { p_org_ids: string[] }
        Returns: {
          org_id: string
          org_name: string
        }[]
      }
      get_received_shipment_history: {
        Args: { p_org_id: string; p_page?: number; p_page_size?: number }
        Returns: {
          batch_id: string
          from_org_id: string
          from_org_name: string
          is_recalled: boolean
          recall_reason: string
          shipment_date: string
          total_count: number
        }[]
      }
      get_shipment_batch_summaries: {
        Args: { p_batch_ids: string[] }
        Returns: {
          batch_id: string
          lot_id: string
          lot_number: string
          product_id: string
          product_name: string
          quantity: number
        }[]
      }
      get_treatment_summaries: {
        Args: { p_treatment_ids: string[] }
        Returns: {
          lot_id: string
          lot_number: string
          product_id: string
          product_name: string
          quantity: number
          treatment_id: string
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_organization_type: {
        Args: never
        Returns: Database["public"]["Enums"]["organization_type"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_recall_allowed: {
        Args: { p_shipment_batch_id: string }
        Returns: boolean
      }
      normalize_phone_number: { Args: { phone: string }; Returns: string }
      recall_shipment_atomic:
        | {
            Args: {
              p_from_org_id: string
              p_reason: string
              p_shipment_batch_id: string
            }
            Returns: {
              error_code: string
              error_message: string
              recalled_count: number
              success: boolean
            }[]
          }
        | {
            Args: { p_reason: string; p_shipment_batch_id: string }
            Returns: {
              error_code: string
              error_message: string
              recalled_count: number
              success: boolean
            }[]
          }
      recall_treatment_atomic:
        | {
            Args: {
              p_hospital_id: string
              p_reason: string
              p_treatment_id: string
            }
            Returns: {
              error_code: string
              error_message: string
              recalled_count: number
              success: boolean
            }[]
          }
        | {
            Args: { p_reason: string; p_treatment_id: string }
            Returns: {
              error_code: string
              error_message: string
              recalled_count: number
              success: boolean
            }[]
          }
      select_fifo_codes: {
        Args: {
          p_lot_id?: string
          p_owner_id: string
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          virtual_code_id: string
        }[]
      }
      upsert_lot: {
        Args: {
          p_expiry_date: string
          p_lot_number: string
          p_manufacture_date: string
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          is_new: boolean
          lot_id: string
          lot_number: string
          total_quantity: number
        }[]
      }
      user_is_lot_manufacturer: { Args: { lot_uuid: string }; Returns: boolean }
      user_owns_codes_in_lot: { Args: { lot_uuid: string }; Returns: boolean }
      validate_business_number: { Args: { bn: string }; Returns: boolean }
    }
    Enums: {
      history_action_type:
        | "PRODUCED"
        | "SHIPPED"
        | "RECEIVED"
        | "TREATED"
        | "RECALLED"
        | "DISPOSED"
      notification_type: "CERTIFICATION" | "RECALL"
      organization_status:
        | "PENDING_APPROVAL"
        | "ACTIVE"
        | "INACTIVE"
        | "DELETED"
      organization_type: "MANUFACTURER" | "DISTRIBUTOR" | "HOSPITAL" | "ADMIN"
      owner_type: "ORGANIZATION" | "PATIENT"
      virtual_code_status: "IN_STOCK" | "USED" | "DISPOSED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      history_action_type: [
        "PRODUCED",
        "SHIPPED",
        "RECEIVED",
        "TREATED",
        "RECALLED",
        "DISPOSED",
      ],
      notification_type: ["CERTIFICATION", "RECALL"],
      organization_status: [
        "PENDING_APPROVAL",
        "ACTIVE",
        "INACTIVE",
        "DELETED",
      ],
      organization_type: ["MANUFACTURER", "DISTRIBUTOR", "HOSPITAL", "ADMIN"],
      owner_type: ["ORGANIZATION", "PATIENT"],
      virtual_code_status: ["IN_STOCK", "USED", "DISPOSED"],
    },
  },
} as const

