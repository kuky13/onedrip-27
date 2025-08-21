import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (method) {
      case 'GET':
        // Get user profile with explicit field selection
        const { data: profile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select(`
            id,
            name,
            role,
            is_active,
            budget_limit,
            expiration_date,
            budget_warning_enabled,
            budget_warning_days,
            advanced_features_enabled,
            created_at,
            updated_at
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(profile),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (action !== 'update-profile') {
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await req.json();
        
        // Only allow specific fields to be updated by regular users
        const allowedFields = ['name', 'budget_warning_enabled', 'budget_warning_days'];
        const filteredUpdateData: any = {};
        
        for (const field of allowedFields) {
          if (updateData[field] !== undefined) {
            filteredUpdateData[field] = updateData[field];
          }
        }

        // Check if user is admin for privileged updates
        const { data: currentProfile } = await supabaseClient
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (currentProfile?.role === 'admin') {
          // Admins can update additional fields
          const adminFields = ['role', 'is_active', 'budget_limit', 'expiration_date', 'advanced_features_enabled'];
          for (const field of adminFields) {
            if (updateData[field] !== undefined) {
              filteredUpdateData[field] = updateData[field];
            }
          }
        }

        const { data: updatedProfile, error: updateError } = await supabaseClient
          .from('user_profiles')
          .update(filteredUpdateData)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(updatedProfile),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in manage-user-profile function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});