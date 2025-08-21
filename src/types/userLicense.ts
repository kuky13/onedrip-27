// TypeScript types for Enhanced User License Management System

export interface EnhancedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  user_metadata: any; // Changed from Record<string, unknown> to any for compatibility
  license_count: number;
  active_licenses: number;
  total_license_value: number;
  last_license_activity: string | null;
}

export interface UserLicenseAnalytics {
  id: string;
  user_id: string;
  user_email: string;
  license_id: string | null;
  action_type: string; // Changed to string for broader compatibility
  action_date: string;
  performed_by: string | null;
  performer_email: string | null;
  metadata: any; // Changed from Record<string, unknown> to any for compatibility
}

export interface BulkOperation {
  id: string;
  operation_type: 'bulk_create' | 'bulk_renew' | 'bulk_suspend' | 'bulk_delete';
  user_ids: string[];
  license_data: any; // Changed from Record<string, unknown> to any for compatibility
  performed_by: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: any; // Changed to any for compatibility with Json type
  created_at: string;
  completed_at: string | null;
}

export interface BulkOperationResults {
  success_count: number;
  error_count: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
}

export interface LicenseStatistics {
  total_users: number;
  users_with_licenses: number;
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  suspended_licenses: number;
  licenses_created_today: number;
  licenses_expiring_soon: number;
  expiring_this_month?: number;
  new_this_month?: number;
  renewed_this_month?: number;
  revenue_this_month?: number;
  average_license_duration?: number;
  top_license_types?: Array<{ type: string; count: number }>;
  monthly_trends?: Array<{ month: string; count: number }>;
}

export interface LicenseStatisticsFilters {
  date_range?: {
    start: string;
    end: string;
  };
  license_type?: string;
}

export interface License {
  id: string;
  user_id: string;
  type: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
  licenses: License[];
  license_analytics: UserLicenseAnalytics[];
}

// Filter and sorting types
export interface UserListFilters {
  search?: string;
  license_status?: 'active' | 'inactive' | 'expired' | null;
  date_range?: {
    start: string;
    end: string;
  };
  license_type?: string;
}

export interface UserListSorting {
  sort_by: 'email' | 'created_at' | 'license_count' | 'last_sign_in_at';
  sort_order: 'asc' | 'desc';
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

// Bulk operation request types
export interface BulkLicenseCreateRequest {
  user_ids: string[];
  license_data: {
    type: string;
    duration_months?: number;
    metadata?: Record<string, unknown>;
  };
}

export interface BulkLicenseRenewRequest {
  user_ids: string[];
  extension_months: number;
}

export interface BulkLicenseSuspendRequest {
  user_ids: string[];
  reason?: string;
}

export interface BulkLicenseDeleteRequest {
  user_ids: string[];
  reason?: string;
}

// Analytics types
export interface AnalyticsDateRange {
  start_date: string;
  end_date: string;
}

export interface LicenseAnalyticsData {
  daily_stats: Array<{
    date: string;
    created: number;
    renewed: number;
    suspended: number;
    deleted: number;
  }>;
  user_distribution: Array<{
    license_type: string;
    count: number;
    percentage: number;
  }>;
  revenue_data: Array<{
    month: string;
    revenue: number;
    license_count: number;
  }>;
}

// Component props types
export interface UserListProps {
  filters?: UserListFilters;
  sorting?: UserListSorting;
  pagination?: PaginationParams;
  onUserSelect?: (user: EnhancedUser) => void;
  onBulkAction?: (action: string, userIds: string[]) => void;
}

export interface UserProfileProps {
  userId: string;
  onLicenseAction?: (action: string, licenseId?: string) => void;
  onClose?: () => void;
}

export interface BulkOperationsProps {
  selectedUsers: EnhancedUser[];
  onOperationComplete?: (operation: BulkOperation) => void;
  onClose?: () => void;
}

export interface DashboardProps {
  dateRange?: AnalyticsDateRange;
  refreshInterval?: number;
}

export interface UnifiedDashboardProps {
  onNavigate?: (view: string) => void;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Hook return types
export interface UseEnhancedUsersReturn {
  users: EnhancedUser[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: () => void;
  loadMore: () => void;
}

export interface UseLicenseAnalyticsReturn {
  analytics: UserLicenseAnalytics[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseBulkOperationsReturn {
  operations: BulkOperation[];
  loading: boolean;
  error: string | null;
  createOperation: (type: string, userIds: string[], data?: Record<string, unknown>) => Promise<string>;
  getOperationStatus: (operationId: string) => BulkOperation | null;
}

export interface UseLicenseStatisticsReturn {
  statistics: LicenseStatistics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Form types
export interface LicenseFormData {
  type: string;
  duration_months: number;
  auto_renew: boolean;
  metadata: Record<string, unknown>;
}

export interface BulkOperationFormData {
  operation_type: 'bulk_create' | 'bulk_renew' | 'bulk_suspend' | 'bulk_delete';
  user_ids: string[];
  license_data?: LicenseFormData;
  reason?: string;
}

// Event types
export interface UserLicenseEvent {
  type: 'user_selected' | 'license_created' | 'license_updated' | 'bulk_operation_completed';
  payload: unknown;
  timestamp: string;
}

// Configuration types
export interface UserLicenseConfig {
  license_types: Array<{
    id: string;
    name: string;
    description: string;
    default_duration_months: number;
    price: number;
  }>;
  bulk_operation_limits: {
    max_users_per_operation: number;
    max_concurrent_operations: number;
  };
  analytics_settings: {
    default_date_range_days: number;
    refresh_interval_seconds: number;
  };
}