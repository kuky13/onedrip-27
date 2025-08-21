/**
 * Edge Function para API de Segurança
 *  - Rate Limiting e Auditoria Server-Side
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityEvent {
  type: string;
  details: Record<string, any>;
  severity?: 'low' | 'medium' | 'high';
  clientId?: string;
}

interface RateLimitRequest {
  identifier: string;
  action: string;
  maxAttempts?: number;
  windowMinutes?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname;

    // Rate Limiting Endpoint
    if (path === '/rate-limit' && req.method === 'POST') {
      const body: RateLimitRequest = await req.json();
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: body.identifier,
        p_action_type: body.action,
        p_max_attempts: body.maxAttempts || 10,
        p_window_minutes: body.windowMinutes || 15
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return new Response(
          JSON.stringify({ error: 'Rate limit check failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security Event Logging
    if (path === '/log-security-event' && req.method === 'POST') {
      const body: SecurityEvent = await req.json();
      
      // Validar entrada
      if (!body.type || typeof body.type !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Event type is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Obter IP do cliente
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

      // Obter User-Agent
      const userAgent = req.headers.get('user-agent') || 'unknown';

      // Enriched event details
      const enrichedDetails = {
        ...body.details,
        ip_address: clientIP,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
        client_id: body.clientId
      };

      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: body.type,
        p_details: enrichedDetails,
        p_severity: body.severity || 'medium'
      });

      if (error) {
        console.error('Security event logging error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to log security event' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security Health Check
    if (path === '/health-check' && req.method === 'GET') {
      const { data, error } = await supabase.rpc('security_health_check');

      if (error) {
        console.error('Health check error:', error);
        return new Response(
          JSON.stringify({ error: 'Health check failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          security_status: data
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security Analytics
    if (path === '/security-analytics' && req.method === 'GET') {
      // Verificar autenticação
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se é admin
      const { data: user } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (!user.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar analytics de segurança
      const [rateLimitStats, securityEvents, loginAttempts] = await Promise.all([
        supabase
          .from('rate_limit_tracking')
          .select('action_type, attempt_count, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('admin_logs')
          .select('action, created_at, details')
          .like('action', 'SECURITY_EVENT:%')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('login_attempts')
          .select('success, failure_reason, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return new Response(
        JSON.stringify({
          rate_limit_stats: rateLimitStats.data || [],
          security_events: securityEvents.data || [],
          login_attempts: loginAttempts.data || [],
          generated_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});