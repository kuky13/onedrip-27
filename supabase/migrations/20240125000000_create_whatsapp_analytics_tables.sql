-- Migration: Create WhatsApp Analytics Tables
-- Description: Creates tables for tracking WhatsApp conversions and sales analytics
-- Date: 2024-01-25

-- Create whatsapp_conversions table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_price DECIMAL(10,2) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_phone TEXT,
    click_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversion_timestamp TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'clicked' CHECK (status IN ('clicked', 'converted', 'abandoned')),
    whatsapp_message TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_sales table
CREATE TABLE IF NOT EXISTS public.whatsapp_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversion_id UUID REFERENCES public.whatsapp_conversions(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_phone TEXT NOT NULL,
    customer_name TEXT,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT DEFAULT 'whatsapp_negotiation',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    sales_rep TEXT,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    contract_sent BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    service_started BOOLEAN DEFAULT FALSE,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_plan_id ON public.whatsapp_conversions(plan_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_user_id ON public.whatsapp_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_status ON public.whatsapp_conversions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_click_timestamp ON public.whatsapp_conversions(click_timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_conversion_timestamp ON public.whatsapp_conversions(conversion_timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversions_session_id ON public.whatsapp_conversions(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_conversion_id ON public.whatsapp_sales(conversion_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_plan_id ON public.whatsapp_sales(plan_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_user_id ON public.whatsapp_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_sale_date ON public.whatsapp_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_payment_status ON public.whatsapp_sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sales_sales_rep ON public.whatsapp_sales(sales_rep);

-- Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_conversions
-- Allow authenticated users to read their own conversions
CREATE POLICY "Users can view their own conversions" ON public.whatsapp_conversions
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own conversions
CREATE POLICY "Users can insert their own conversions" ON public.whatsapp_conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to update their own conversions
CREATE POLICY "Users can update their own conversions" ON public.whatsapp_conversions
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all conversions (for admin/analytics)
CREATE POLICY "Service role can manage all conversions" ON public.whatsapp_conversions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for whatsapp_sales
-- Allow authenticated users to read their own sales
CREATE POLICY "Users can view their own sales" ON public.whatsapp_sales
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own sales
CREATE POLICY "Users can insert their own sales" ON public.whatsapp_sales
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to update their own sales
CREATE POLICY "Users can update their own sales" ON public.whatsapp_sales
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all sales (for admin/analytics)
CREATE POLICY "Service role can manage all sales" ON public.whatsapp_sales
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_conversions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_sales TO authenticated;
GRANT SELECT ON public.whatsapp_conversions TO anon;
GRANT SELECT ON public.whatsapp_sales TO anon;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_whatsapp_conversions_updated_at
    BEFORE UPDATE ON public.whatsapp_conversions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_whatsapp_sales_updated_at
    BEFORE UPDATE ON public.whatsapp_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create views for analytics
CREATE OR REPLACE VIEW public.whatsapp_conversion_stats AS
SELECT 
    plan_id,
    plan_name,
    COUNT(*) as total_clicks,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
    ROUND(
        (COUNT(CASE WHEN status = 'converted' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as conversion_rate,
    AVG(plan_price) as avg_plan_price,
    DATE_TRUNC('day', click_timestamp) as date
FROM public.whatsapp_conversions
GROUP BY plan_id, plan_name, DATE_TRUNC('day', click_timestamp)
ORDER BY date DESC, total_clicks DESC;

CREATE OR REPLACE VIEW public.whatsapp_sales_summary AS
SELECT 
    plan_id,
    plan_name,
    COUNT(*) as total_sales,
    SUM(final_price) as total_revenue,
    AVG(final_price) as avg_sale_value,
    AVG(discount_percentage) as avg_discount,
    COUNT(CASE WHEN payment_status = 'confirmed' THEN 1 END) as confirmed_sales,
    COUNT(CASE WHEN contract_signed = true THEN 1 END) as signed_contracts,
    AVG(customer_satisfaction) as avg_satisfaction,
    DATE_TRUNC('day', sale_date) as date
FROM public.whatsapp_sales
GROUP BY plan_id, plan_name, DATE_TRUNC('day', sale_date)
ORDER BY date DESC, total_revenue DESC;

-- Grant permissions on views
GRANT SELECT ON public.whatsapp_conversion_stats TO authenticated, anon;
GRANT SELECT ON public.whatsapp_sales_summary TO authenticated, anon;