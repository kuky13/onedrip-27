// WhatsApp Sales System Types

// Plan Types
export interface WhatsAppPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  duration: string;
  category: 'basic' | 'premium' | 'enterprise';
  isPopular?: boolean;
  discount?: number;
  whatsappMessage?: string;
}

// WhatsApp Sales Types
export interface WhatsAppSale {
  id: string;
  planId: string;
  planName: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  price: number;
  status: WhatsAppSaleStatus;
  createdAt: Date;
  updatedAt: Date;
  whatsappMessageSent: boolean;
  conversionSource: string;
  notes?: string;
}

export type WhatsAppSaleStatus = 
  | 'pending'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

// Conversion Tracking
export interface WhatsAppConversion {
  id: string;
  planId: string;
  planName: string;
  customerPhone: string;
  clickedAt: Date;
  convertedAt?: Date;
  source: string;
  userAgent?: string;
  referrer?: string;
  conversionValue?: number;
  status: 'clicked' | 'converted' | 'abandoned';
}

// Analytics Types
export interface WhatsAppAnalytics {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  topPerformingPlan: string;
  clicksByPlan: Record<string, number>;
  conversionsByPlan: Record<string, number>;
  revenueByPlan: Record<string, number>;
  dailyStats: DailyStats[];
}

export interface DailyStats {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

// Message Templates
export interface WhatsAppMessageTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'plan_info' | 'welcome' | 'follow_up' | 'confirmation';
  isActive: boolean;
}

// Customer Data
export interface WhatsAppCustomer {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  firstContact: Date;
  lastContact?: Date;
  totalPurchases: number;
  totalSpent: number;
  preferredPlan?: string;
  status: 'lead' | 'customer' | 'inactive';
  notes?: string;
  tags?: string[];
}

// Service Configuration
export interface WhatsAppSalesConfig {
  businessPhone: string;
  businessName: string;
  welcomeMessage: string;
  autoResponseEnabled: boolean;
  trackingEnabled: boolean;
  analyticsRetentionDays: number;
  defaultMessageTemplate: string;
  customDomain?: string;
}

// API Request/Response Types
export interface CreateWhatsAppSaleRequest {
  planId: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  source?: string;
  notes?: string;
}

export interface CreateWhatsAppSaleResponse {
  success: boolean;
  sale?: WhatsAppSale;
  whatsappUrl?: string;
  message?: string;
  error?: string;
}

export interface TrackConversionRequest {
  planId: string;
  customerPhone: string;
  source?: string;
  userAgent?: string;
  referrer?: string;
}

export interface TrackConversionResponse {
  success: boolean;
  conversionId?: string;
  whatsappUrl: string;
  message?: string;
  error?: string;
}

export interface GetAnalyticsRequest {
  startDate?: string;
  endDate?: string;
  planId?: string;
}

export interface GetAnalyticsResponse {
  success: boolean;
  analytics?: WhatsAppAnalytics;
  error?: string;
}

// Component Props Types
export interface WhatsAppCheckoutProps {
  plans: WhatsAppPlan[];
  selectedPlan?: WhatsAppPlan;
  onPlanSelect: (plan: WhatsAppPlan) => void;
  onCheckout: (planId: string, customerData: CustomerData) => void;
  loading?: boolean;
}

export interface WhatsAppPlanCardProps {
  plan: WhatsAppPlan;
  isSelected?: boolean;
  onSelect: (plan: WhatsAppPlan) => void;
  showDiscount?: boolean;
  compact?: boolean;
}

export interface WhatsAppContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WhatsAppPlan;
  onSubmit: (customerData: CustomerData) => void;
  loading?: boolean;
}

export interface CustomerData {
  name?: string;
  phone: string;
  email?: string;
  notes?: string;
}

// Hook Types
export interface UseWhatsAppSalesReturn {
  plans: WhatsAppPlan[];
  loading: boolean;
  error: string | null;
  selectedPlan: WhatsAppPlan | null;
  selectPlan: (plan: WhatsAppPlan) => void;
  createSale: (customerData: CustomerData) => Promise<CreateWhatsAppSaleResponse>;
  trackConversion: (planId: string, phone: string) => Promise<void>;
  getAnalytics: (filters?: GetAnalyticsRequest) => Promise<WhatsAppAnalytics | null>;
}

// Utility Types
export interface WhatsAppUrlParams {
  phone: string;
  message: string;
}

export interface MessageVariables {
  customerName?: string;
  planName: string;
  planPrice: number;
  planFeatures: string[];
  businessName: string;
  discount?: number;
  [key: string]: any;
}

// Error Types
export interface WhatsAppSalesError {
  code: string;
  message: string;
  details?: any;
}

// Export all types for easy importing
export type {
  WhatsAppPlan,
  WhatsAppSale,
  WhatsAppSaleStatus,
  WhatsAppConversion,
  WhatsAppAnalytics,
  DailyStats,
  WhatsAppMessageTemplate,
  WhatsAppCustomer,
  WhatsAppSalesConfig,
  CreateWhatsAppSaleRequest,
  CreateWhatsAppSaleResponse,
  TrackConversionRequest,
  TrackConversionResponse,
  GetAnalyticsRequest,
  GetAnalyticsResponse,
  WhatsAppCheckoutProps,
  WhatsAppPlanCardProps,
  WhatsAppContactModalProps,
  CustomerData,
  UseWhatsAppSalesReturn,
  WhatsAppUrlParams,
  MessageVariables,
  WhatsAppSalesError
};