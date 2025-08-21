
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  license_active: boolean;
  license_code?: string;
  license_expires_at?: string | null;
  license_activated_at?: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  budget_count: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  role: string;
  service_orders_vip_enabled?: boolean;
  budget_limit: number;
  budget_warning_enabled: boolean;
  budget_warning_days: number;
  advanced_features_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebugInfo {
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  is_admin: boolean | null;
  license_valid: boolean | null;
  budget_count: number | null;
  timestamp: string | null;
}
