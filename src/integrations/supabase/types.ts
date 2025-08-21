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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_images: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          name: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          name: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          name?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      budget_deletion_audit: {
        Row: {
          budget_data: Json
          budget_id: string
          can_restore: boolean | null
          created_at: string | null
          deleted_by: string
          deletion_reason: string | null
          deletion_type: string
          id: string
          parts_data: Json | null
        }
        Insert: {
          budget_data: Json
          budget_id: string
          can_restore?: boolean | null
          created_at?: string | null
          deleted_by: string
          deletion_reason?: string | null
          deletion_type: string
          id?: string
          parts_data?: Json | null
        }
        Update: {
          budget_data?: Json
          budget_id?: string
          can_restore?: boolean | null
          created_at?: string | null
          deleted_by?: string
          deletion_reason?: string | null
          deletion_type?: string
          id?: string
          parts_data?: Json | null
        }
        Relationships: []
      }
      budget_parts: {
        Row: {
          brand_id: string | null
          budget_id: string
          cash_price: number | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          installment_price: number | null
          name: string
          part_type: string | null
          price: number
          quantity: number
          warranty_months: number | null
        }
        Insert: {
          brand_id?: string | null
          budget_id: string
          cash_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          installment_price?: number | null
          name: string
          part_type?: string | null
          price: number
          quantity?: number
          warranty_months?: number | null
        }
        Update: {
          brand_id?: string | null
          budget_id?: string
          cash_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          installment_price?: number | null
          name?: string
          part_type?: string | null
          price?: number
          quantity?: number
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_parts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_budget_parts_budget_id"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          cash_price: number | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          delivery_confirmed_at: string | null
          delivery_date: string | null
          device_model: string
          device_type: string
          expires_at: string | null
          id: string
          includes_delivery: boolean | null
          includes_screen_protector: boolean | null
          installment_price: number | null
          installments: number | null
          is_delivered: boolean
          is_paid: boolean
          notes: string | null
          owner_id: string
          part_quality: string | null
          part_type: string | null
          payment_condition: string | null
          payment_confirmed_at: string | null
          search_vector: unknown | null
          status: string
          total_price: number
          updated_at: string
          valid_until: string | null
          warranty_months: number | null
          workflow_status: string
        }
        Insert: {
          approved_at?: string | null
          cash_price?: number | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_confirmed_at?: string | null
          delivery_date?: string | null
          device_model: string
          device_type: string
          expires_at?: string | null
          id?: string
          includes_delivery?: boolean | null
          includes_screen_protector?: boolean | null
          installment_price?: number | null
          installments?: number | null
          is_delivered?: boolean
          is_paid?: boolean
          notes?: string | null
          owner_id?: string
          part_quality?: string | null
          part_type?: string | null
          payment_condition?: string | null
          payment_confirmed_at?: string | null
          search_vector?: unknown | null
          status?: string
          total_price: number
          updated_at?: string
          valid_until?: string | null
          warranty_months?: number | null
          workflow_status?: string
        }
        Update: {
          approved_at?: string | null
          cash_price?: number | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_confirmed_at?: string | null
          delivery_date?: string | null
          device_model?: string
          device_type?: string
          expires_at?: string | null
          id?: string
          includes_delivery?: boolean | null
          includes_screen_protector?: boolean | null
          installment_price?: number | null
          installments?: number | null
          is_delivered?: boolean
          is_paid?: boolean
          notes?: string | null
          owner_id?: string
          part_quality?: string | null
          part_type?: string | null
          payment_condition?: string | null
          payment_confirmed_at?: string | null
          search_vector?: unknown | null
          status?: string
          total_price?: number
          updated_at?: string
          valid_until?: string | null
          warranty_months?: number | null
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_default: boolean | null
          is_favorite: boolean | null
          name: string
          notes: string | null
          phone: string
          state: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          is_favorite?: boolean | null
          name: string
          notes?: string | null
          phone: string
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_default?: boolean | null
          is_favorite?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_info: {
        Row: {
          additional_images: string[] | null
          address: string | null
          business_hours: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string | null
          website: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          additional_images?: string[] | null
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id: string
          phone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          additional_images?: string[] | null
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_info_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_share_settings: {
        Row: {
          created_at: string | null
          custom_message: string | null
          id: string
          owner_id: string
          show_address: boolean | null
          show_business_hours: boolean | null
          show_company_name: boolean | null
          show_description: boolean | null
          show_email: boolean | null
          show_logo: boolean | null
          show_phone: boolean | null
          show_special_instructions: boolean | null
          show_warranty_info: boolean | null
          show_welcome_message: boolean | null
          show_whatsapp_button: boolean | null
          special_instructions: string | null
          theme_color: string | null
          updated_at: string | null
          warranty_info: string | null
          welcome_message: string | null
        }
        Insert: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          owner_id: string
          show_address?: boolean | null
          show_business_hours?: boolean | null
          show_company_name?: boolean | null
          show_description?: boolean | null
          show_email?: boolean | null
          show_logo?: boolean | null
          show_phone?: boolean | null
          show_special_instructions?: boolean | null
          show_warranty_info?: boolean | null
          show_welcome_message?: boolean | null
          show_whatsapp_button?: boolean | null
          special_instructions?: string | null
          theme_color?: string | null
          updated_at?: string | null
          warranty_info?: string | null
          welcome_message?: string | null
        }
        Update: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          owner_id?: string
          show_address?: boolean | null
          show_business_hours?: boolean | null
          show_company_name?: boolean | null
          show_description?: boolean | null
          show_email?: boolean | null
          show_logo?: boolean | null
          show_phone?: boolean | null
          show_special_instructions?: boolean | null
          show_warranty_info?: boolean | null
          show_welcome_message?: boolean | null
          show_whatsapp_button?: boolean | null
          special_instructions?: string | null
          theme_color?: string | null
          updated_at?: string | null
          warranty_info?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_share_settings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          boss_bug_damage: number | null
          boss_bug_points: number | null
          boss_bug_spawn_rate: number | null
          boss_bug_timer: number | null
          bug_damage: number | null
          bug_spawn_percentage: number | null
          created_at: string
          hit_sound_enabled: boolean | null
          hit_sound_volume: number | null
          id: string
          speed_bug_spawn_rate: number
          speed_bug_speed_multiplier: number
          updated_at: string
        }
        Insert: {
          boss_bug_damage?: number | null
          boss_bug_points?: number | null
          boss_bug_spawn_rate?: number | null
          boss_bug_timer?: number | null
          bug_damage?: number | null
          bug_spawn_percentage?: number | null
          created_at?: string
          hit_sound_enabled?: boolean | null
          hit_sound_volume?: number | null
          id?: string
          speed_bug_spawn_rate?: number
          speed_bug_speed_multiplier?: number
          updated_at?: string
        }
        Update: {
          boss_bug_damage?: number | null
          boss_bug_points?: number | null
          boss_bug_spawn_rate?: number | null
          boss_bug_timer?: number | null
          bug_damage?: number | null
          bug_spawn_percentage?: number | null
          created_at?: string
          hit_sound_enabled?: boolean | null
          hit_sound_volume?: number | null
          id?: string
          speed_bug_spawn_rate?: number
          speed_bug_speed_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      license_history: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          license_id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          license_id: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          license_id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "license_history_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_validation: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_validation?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_validation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          target_type: string
          target_user_id: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          target_type: string
          target_user_id?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          target_type?: string
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      persistent_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_trusted: boolean
          last_activity: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean
          last_activity?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean
          last_activity?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ranking_invaders: {
        Row: {
          created_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_invaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          action_type: string
          attempt_count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      service_order_attachments: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          service_order_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          service_order_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          service_order_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_attachments_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          payload: Json | null
          service_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          service_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          service_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_events_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_type: string | null
          name: string
          notes: string | null
          quantity: number | null
          service_order_id: string | null
          unit_price: number
          warranty_months: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_type?: string | null
          name: string
          notes?: string | null
          quantity?: number | null
          service_order_id?: string | null
          unit_price: number
          warranty_months?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_type?: string | null
          name?: string
          notes?: string | null
          quantity?: number | null
          service_order_id?: string | null
          unit_price?: number
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          service_order_id: string
          share_token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          service_order_id: string
          share_token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          service_order_id?: string
          share_token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_shares_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          delivery_date: string | null
          device_model: string
          device_type: string
          id: string
          imei_serial: string | null
          is_paid: boolean | null
          labor_cost: number | null
          notes: string | null
          owner_id: string
          parts_cost: number | null
          priority: string | null
          reported_issue: string
          search_vector: unknown | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_date?: string | null
          device_model: string
          device_type: string
          id?: string
          imei_serial?: string | null
          is_paid?: boolean | null
          labor_cost?: number | null
          notes?: string | null
          owner_id?: string
          parts_cost?: number | null
          priority?: string | null
          reported_issue: string
          search_vector?: unknown | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_date?: string | null
          device_model?: string
          device_type?: string
          id?: string
          imei_serial?: string | null
          is_paid?: boolean | null
          labor_cost?: number | null
          notes?: string | null
          owner_id?: string
          parts_cost?: number | null
          priority?: string | null
          reported_issue?: string
          search_vector?: unknown | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_profiles: {
        Row: {
          address: string
          cnpj: string | null
          contact_phone: string
          created_at: string
          id: string
          logo_url: string | null
          shop_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          cnpj?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          logo_url?: string | null
          shop_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          cnpj?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          shop_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          additional_info: string
          benefits_data: Json | null
          benefits_section_subtitle: string | null
          benefits_section_title: string | null
          created_at: string
          cta_button_text: string
          dev_warning_message: string | null
          dev_warning_title: string | null
          faq_data: Json | null
          faq_section_subtitle: string | null
          faq_section_title: string | null
          id: string
          page_subtitle: string
          page_title: string
          payment_url: string
          plan_currency: string
          plan_description: string
          plan_features: Json
          plan_name: string
          plan_period: string
          plan_price: number
          popular_badge_text: string
          show_benefits_section: boolean | null
          show_dev_warning: boolean
          show_faq_section: boolean | null
          show_popular_badge: boolean
          show_support_info: boolean
          show_testimonials_section: boolean | null
          support_text: string
          testimonials_data: Json | null
          testimonials_section_subtitle: string | null
          testimonials_section_title: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          additional_info?: string
          benefits_data?: Json | null
          benefits_section_subtitle?: string | null
          benefits_section_title?: string | null
          created_at?: string
          cta_button_text?: string
          dev_warning_message?: string | null
          dev_warning_title?: string | null
          faq_data?: Json | null
          faq_section_subtitle?: string | null
          faq_section_title?: string | null
          id?: string
          page_subtitle?: string
          page_title?: string
          payment_url?: string
          plan_currency?: string
          plan_description?: string
          plan_features?: Json
          plan_name?: string
          plan_period?: string
          plan_price?: number
          popular_badge_text?: string
          show_benefits_section?: boolean | null
          show_dev_warning?: boolean
          show_faq_section?: boolean | null
          show_popular_badge?: boolean
          show_support_info?: boolean
          show_testimonials_section?: boolean | null
          support_text?: string
          testimonials_data?: Json | null
          testimonials_section_subtitle?: string | null
          testimonials_section_title?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          additional_info?: string
          benefits_data?: Json | null
          benefits_section_subtitle?: string | null
          benefits_section_title?: string | null
          created_at?: string
          cta_button_text?: string
          dev_warning_message?: string | null
          dev_warning_title?: string | null
          faq_data?: Json | null
          faq_section_subtitle?: string | null
          faq_section_title?: string | null
          id?: string
          page_subtitle?: string
          page_title?: string
          payment_url?: string
          plan_currency?: string
          plan_description?: string
          plan_features?: Json
          plan_name?: string
          plan_period?: string
          plan_price?: number
          popular_badge_text?: string
          show_benefits_section?: boolean | null
          show_dev_warning?: boolean
          show_faq_section?: boolean | null
          show_popular_badge?: boolean
          show_support_info?: boolean
          show_testimonials_section?: boolean | null
          support_text?: string
          testimonials_data?: Json | null
          testimonials_section_subtitle?: string | null
          testimonials_section_title?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_activity_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          recorded_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_license_analytics: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          id: string
          license_id: string | null
          metadata: Json | null
          performed_by: string | null
          user_id: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          user_id?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_license_bulk_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          license_data: Json | null
          operation_type: string
          performed_by: string | null
          results: Json | null
          status: string | null
          user_ids: string[]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          license_data?: Json | null
          operation_type: string
          performed_by?: string | null
          results?: Json | null
          status?: string | null
          user_ids: string[]
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          license_data?: Json | null
          operation_type?: string
          performed_by?: string | null
          results?: Json | null
          status?: string | null
          user_ids?: string[]
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          delivery_status: string | null
          id: string
          notification_id: string
          read_at: string | null
          sent_at: string | null
          user_deleted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
          sent_at?: string | null
          user_deleted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
          sent_at?: string | null
          user_deleted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications_read: {
        Row: {
          id: string
          is_deleted: boolean | null
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_deleted?: boolean | null
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_deleted?: boolean | null
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_read_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          advanced_features_enabled: boolean
          budget_limit: number | null
          budget_warning_days: number
          budget_warning_enabled: boolean
          created_at: string
          id: string
          name: string
          role: string | null
          service_orders_vip_enabled: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          advanced_features_enabled?: boolean
          budget_limit?: number | null
          budget_warning_days?: number
          budget_warning_enabled?: boolean
          created_at?: string
          id: string
          name: string
          role?: string | null
          service_orders_vip_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          advanced_features_enabled?: boolean
          budget_limit?: number | null
          budget_warning_days?: number
          budget_warning_enabled?: boolean
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          service_orders_vip_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      warranty_periods: {
        Row: {
          created_at: string
          id: string
          label: string
          months: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          months: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          months?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_license: {
        Args: { license_code: string; p_user_id: string }
        Returns: Json
      }
      activate_license_enhanced: {
        Args: { license_code: string; p_user_id: string }
        Returns: Json
      }
      admin_activate_user_license: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_bulk_activate_licenses: {
        Args: { p_license_ids: string[] }
        Returns: Json
      }
      admin_bulk_deactivate_licenses: {
        Args: { p_license_ids: string[] }
        Returns: Json
      }
      admin_bulk_license_action: {
        Args: {
          p_action: string
          p_license_ids: string[]
          p_notes?: string
          p_value?: boolean
        }
        Returns: number
      }
      admin_bulk_license_operation: {
        Args: {
          p_license_data?: Json
          p_operation_type: string
          p_user_ids: string[]
        }
        Returns: string
      }
      admin_cleanup_all_user_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_create_bulk_licenses: {
        Args: { p_expires_in_days?: number; p_quantity: number }
        Returns: Json
      }
      admin_create_license: {
        Args: { p_expires_at?: string }
        Returns: Json
      }
      admin_create_license_advanced: {
        Args: {
          p_activate_immediately?: boolean
          p_code: string
          p_expires_at?: string
          p_notes?: string
          p_user_id?: string
        }
        Returns: string
      }
      admin_create_multiple_licenses: {
        Args: {
          p_activate_immediately?: boolean
          p_expires_at?: string
          p_notes?: string
          p_quantity: number
        }
        Returns: number
      }
      admin_create_notification: {
        Args: {
          p_expires_at?: string
          p_message: string
          p_target_type: string
          p_target_user_id?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      admin_deactivate_user_license: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_delete_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      admin_delete_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      admin_extend_license: {
        Args: { p_days: number; p_license_id: string; p_notes?: string }
        Returns: string
      }
      admin_get_all_licenses: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          notes: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          budget_count: number
          created_at: string
          email: string
          expiration_date: string
          id: string
          last_sign_in_at: string
          license_active: boolean
          name: string
          role: string
        }[]
      }
      admin_get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_enhanced_users: {
        Args: {
          p_license_status?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
        }
        Returns: {
          active_licenses: number
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_license_activity: string
          last_sign_in_at: string
          license_count: number
          phone: string
          total_license_value: number
          user_metadata: Json
        }[]
      }
      admin_get_license_history: {
        Args: { p_license_id: string }
        Returns: {
          action_type: string
          admin_email: string
          admin_id: string
          admin_name: string
          created_at: string
          id: string
          new_values: Json
          notes: string
          old_values: Json
        }[]
      }
      admin_get_license_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_licenses: number
          expired_licenses: number
          licenses_created_today: number
          licenses_expiring_soon: number
          suspended_licenses: number
          total_licenses: number
          total_users: number
          users_with_licenses: number
        }[]
      }
      admin_get_license_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_licenses: number
          expired_licenses: number
          expiring_soon: number
          inactive_licenses: number
          total_licenses: number
          unassigned_licenses: number
        }[]
      }
      admin_get_licenses_with_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      admin_get_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          admin_name: string
          admin_user_id: string
          created_at: string
          details: Json
          id: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_get_recent_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_user_license_analytics: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          action_date: string
          action_type: string
          id: string
          license_id: string
          metadata: Json
          performed_by: string
          performer_email: string
          user_email: string
          user_id: string
        }[]
      }
      admin_get_user_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_get_user_real_email: {
        Args: { p_user_id: string }
        Returns: string
      }
      admin_get_users_paginated: {
        Args: {
          p_limit?: number
          p_page?: number
          p_role_filter?: string
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status_filter?: string
        }
        Returns: Json
      }
      admin_list_notifications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          message: string
          target_type: string
          target_user_id: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      admin_list_user_notifications: {
        Args: {
          p_limit?: number
          p_notification_id?: string
          p_offset?: number
          p_user_id?: string
        }
        Returns: {
          created_at: string
          delivery_status: string
          id: string
          notification_id: string
          notification_title: string
          notification_type: string
          sent_at: string
          user_email: string
          user_id: string
        }[]
      }
      admin_preview_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_renew_license: {
        Args: { additional_days?: number; license_id: string }
        Returns: Json
      }
      admin_renew_user_license: {
        Args: { p_additional_days: number; p_user_id: string }
        Returns: boolean
      }
      admin_transfer_license: {
        Args: { p_license_id: string; p_new_user_id: string; p_notes?: string }
        Returns: boolean
      }
      admin_update_license: {
        Args: {
          p_code?: string
          p_expires_at?: string
          p_is_active?: boolean
          p_license_id: string
          p_notes?: string
          p_user_id?: string
        }
        Returns: boolean
      }
      admin_update_user: {
        Args:
          | {
              p_expiration_date?: string
              p_is_active?: boolean
              p_name?: string
              p_role?: string
              p_user_id: string
            }
          | { p_name?: string; p_role?: string; p_user_id: string }
        Returns: boolean
      }
      audit_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          recommendations: string
          rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
      can_access_service_order: {
        Args: { service_order_id: string }
        Returns: boolean
      }
      check_budgets_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          orphaned_budgets: number
          total_budgets: number
          valid_budgets: number
        }[]
      }
      check_if_user_is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_shop_profile_exists: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_all_user_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_all_user_data_complete: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_inactive_push_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_deleted_budgets: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_public_data_only: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_active_budgets: {
        Args: { p_user_id: string }
        Returns: number
      }
      count_user_budgets: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_expires_at?: string
          p_message: string
          p_target_type: string
          p_target_user_id?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_service_order: {
        Args: { p_description: string; p_priority?: string; p_title: string }
        Returns: string
      }
      debug_current_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_active: boolean
          is_admin: boolean
          user_email: string
          user_id: string
          user_role: string
        }[]
      }
      debug_get_notifications: {
        Args: Record<PropertyKey, never>
        Returns: {
          expires_at: string
          is_active: boolean
          message: string
          notification_id: string
          target_type: string
          title: string
          type: string
          user_notifications_count: number
        }[]
      }
      debug_token_status: {
        Args: { token_to_check: string }
        Returns: {
          expires_at: string
          found: boolean
          is_active: boolean
          is_expired: boolean
          service_order_id: string
          token_id: string
        }[]
      }
      debug_user_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_service_order: {
        Args: { p_id: string }
        Returns: boolean
      }
      delete_user_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      detect_sql_injection: {
        Args: { input_text: string }
        Returns: boolean
      }
      empty_service_orders_trash: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fix_orphaned_budgets: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_license_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_service_order_share_token: {
        Args: { p_service_order_id: string }
        Returns: {
          expires_at: string
          share_token: string
          share_url: string
        }[]
      }
      get_admin_notifications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          message: string
          target_type: string
          target_user_id: string
          title: string
          total_users_deleted: number
          type: string
          updated_at: string
        }[]
      }
      get_allowed_redirect_domains: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_budgets_with_part_quality: {
        Args: { p_user_id: string }
        Returns: {
          cash_price: number
          client_name: string
          client_phone: string
          created_at: string
          delivery_date: string
          device_model: string
          device_type: string
          expires_at: string
          id: string
          installment_price: number
          is_delivered: boolean
          is_paid: boolean
          issue: string
          part_quality: string
          status: string
          total_price: number
          updated_at: string
          valid_until: string
          workflow_status: string
        }[]
      }
      get_cleanup_preview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_cleanup_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_client_budget_count: {
        Args: { client_id: string }
        Returns: number
      }
      get_company_info: {
        Args: { p_owner_id?: string }
        Returns: {
          address: string
          logo_url: string
          name: string
          whatsapp_phone: string
        }[]
      }
      get_company_info_by_share_token: {
        Args: { p_share_token: string }
        Returns: {
          address: string
          logo_url: string
          name: string
          whatsapp_phone: string
        }[]
      }
      get_deleted_service_orders: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_start_date?: string
        }
        Returns: {
          client_id: string
          created_at: string
          deleted_at: string
          deleted_by: string
          delivery_date: string
          device_model: string
          device_type: string
          id: string
          imei_serial: string
          is_paid: boolean
          labor_cost: number
          notes: string
          owner_id: string
          parts_cost: number
          priority: string
          reported_issue: string
          status: string
          total_count: number
          total_price: number
          updated_at: string
          warranty_months: number
        }[]
      }
      get_enhanced_share_data: {
        Args: { share_token_param: string }
        Returns: Json
      }
      get_expiring_budgets: {
        Args: { p_user_id: string }
        Returns: {
          budget_id: string
          client_name: string
          days_until_expiry: number
          expires_at: string
        }[]
      }
      get_optimized_budgets: {
        Args:
          | {
              p_limit?: number
              p_offset?: number
              p_search_term?: string
              p_status_filter?: string
              p_user_id: string
            }
          | {
              p_limit?: number
              p_offset?: number
              p_search_term?: string
              p_user_id: string
            }
        Returns: {
          cash_price: number
          client_name: string
          client_phone: string
          created_at: string
          delivery_date: string
          device_model: string
          device_type: string
          expires_at: string
          id: string
          installment_price: number
          is_delivered: boolean
          is_paid: boolean
          issue: string
          part_quality: string
          status: string
          total_price: number
          updated_at: string
          valid_until: string
          workflow_status: string
        }[]
      }
      get_secure_user_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_service_order_by_id: {
        Args: { p_id: string }
        Returns: {
          client_id: string
          created_at: string
          delivery_date: string
          device_model: string
          device_type: string
          id: string
          imei_serial: string
          is_paid: boolean
          labor_cost: number
          notes: string
          owner_id: string
          owner_name: string
          parts_cost: number
          priority: string
          reported_issue: string
          status: string
          total_price: number
          updated_at: string
          warranty_months: number
        }[]
      }
      get_service_order_by_share_token: {
        Args: { p_share_token: string }
        Returns: {
          created_at: string
          device_model: string
          device_type: string
          formatted_id: string
          id: string
          reported_issue: string
          status: string
          updated_at: string
        }[]
      }
      get_service_order_details: {
        Args: { p_service_order_id: string }
        Returns: {
          attachments_count: number
          client_address: string
          client_id: string
          client_name: string
          client_phone: string
          created_at: string
          delivery_date: string
          device_model: string
          device_type: string
          events_count: number
          id: string
          imei_serial: string
          is_paid: boolean
          items_count: number
          labor_cost: number
          notes: string
          parts_cost: number
          priority: string
          reported_issue: string
          status: string
          total_price: number
          updated_at: string
          warranty_months: number
        }[]
      }
      get_service_orders: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_start_date?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          owner_id: string
          owner_name: string
          priority: string
          status: string
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      get_service_orders_stats: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: {
          avg_completion_time: unknown
          cancelled_orders: number
          completed_orders: number
          high_priority_orders: number
          in_progress_orders: number
          pending_orders: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_shop_profile: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_top_rankings: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_budget_value: number
          rank_position: number
          total_budgets: number
          total_value: number
          user_id: string
          user_name: string
        }[]
      }
      get_user_notifications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          is_read: boolean
          message: string
          read_at: string
          target_type: string
          target_user_id: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_username_from_email: {
        Args: { email: string }
        Returns: string
      }
      hard_delete_service_order: {
        Args: { service_order_id: string }
        Returns: boolean
      }
      has_reached_budget_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      insert_shop_profile: {
        Args: {
          p_address: string
          p_contact_phone: string
          p_shop_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_domain_allowed: {
        Args: { domain: string }
        Returns: boolean
      }
      is_license_valid: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_license_active: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      log_admin_access: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: undefined
      }
      log_admin_action: {
        Args: { p_action: string; p_details?: Json; p_target_user_id: string }
        Returns: undefined
      }
      log_login_attempt: {
        Args: { p_email: string; p_failure_reason?: string; p_success: boolean }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      manage_persistent_session: {
        Args: {
          p_device_fingerprint: string
          p_device_name?: string
          p_device_type?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      restore_deleted_budget: {
        Args: { p_budget_id: string }
        Returns: Json
      }
      restore_service_order: {
        Args: { service_order_id: string }
        Returns: boolean
      }
      restore_user_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      search_service_orders: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_device_type?: string
          p_limit?: number
          p_offset?: number
          p_priority?: string
          p_search_query?: string
          p_status?: string
        }
        Returns: {
          client_name: string
          client_phone: string
          created_at: string
          delivery_date: string
          device_model: string
          id: string
          priority: string
          search_rank: number
          status: string
          total_price: number
        }[]
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
      send_push_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: boolean
      }
      send_push_to_subscribed_users: {
        Args: {
          p_message: string
          p_notification_id: string
          p_title: string
          p_type?: string
        }
        Returns: number
      }
      set_user_budget_limit: {
        Args: { p_budget_limit: number; p_user_id: string }
        Returns: boolean
      }
      should_maintain_login: {
        Args: { p_device_fingerprint: string }
        Returns: Json
      }
      soft_delete_all_user_budgets: {
        Args: { p_deletion_reason?: string }
        Returns: Json
      }
      soft_delete_budget_with_audit: {
        Args: { p_budget_id: string; p_deletion_reason?: string }
        Returns: Json
      }
      soft_delete_service_order: {
        Args: { service_order_id: string }
        Returns: Json
      }
      test_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_admin_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          result: boolean
          test_name: string
        }[]
      }
      test_admin_with_user: {
        Args: { test_user_id: string }
        Returns: Json
      }
      test_generate_share_token: {
        Args: Record<PropertyKey, never>
        Returns: {
          expires_at: string
          service_order_id: string
          share_token: string
          share_url: string
        }[]
      }
      test_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          result: boolean
          test_name: string
        }[]
      }
      trust_device: {
        Args: { p_device_fingerprint: string }
        Returns: Json
      }
      update_service_order: {
        Args: {
          p_delivery_date?: string
          p_device_model?: string
          p_device_type?: string
          p_id: string
          p_imei_serial?: string
          p_is_paid?: boolean
          p_labor_cost?: number
          p_notes?: string
          p_parts_cost?: number
          p_priority?: string
          p_reported_issue?: string
          p_status?: string
          p_total_price?: number
          p_warranty_months?: number
        }
        Returns: boolean
      }
      update_service_order_status: {
        Args:
          | { new_status: string; service_order_id: string }
          | {
              p_new_status: string
              p_notes?: string
              p_service_order_id: string
            }
        Returns: boolean
      }
      update_shop_profile: {
        Args: {
          p_address: string
          p_contact_phone: string
          p_shop_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_permissions_check: {
        Args: { p_user_id: string }
        Returns: Json
      }
      validate_admin_email_change: {
        Args: { p_new_email: string; p_user_id: string }
        Returns: Json
      }
      validate_admin_password_reset: {
        Args: { p_new_password: string; p_user_id: string }
        Returns: Json
      }
      validate_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
      validate_user_license: {
        Args: { p_user_id: string }
        Returns: Json
      }
      verify_admin_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      payment_status: "succeeded" | "failed" | "pending" | "refunded"
      service_order_priority: "low" | "medium" | "high" | "urgent"
      service_order_status:
        | "opened"
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "delivered"
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
      payment_status: ["succeeded", "failed", "pending", "refunded"],
      service_order_priority: ["low", "medium", "high", "urgent"],
      service_order_status: [
        "opened",
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "delivered",
      ],
    },
  },
} as const
