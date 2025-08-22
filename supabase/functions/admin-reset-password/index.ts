import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar o cliente Supabase com a chave de serviço para ter privilégios de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      throw new Error('O ID do usuário e a nova senha são obrigatórios.')
    }

    // Primeiro validar via função SQL
    const { data: validation, error: validationError } = await supabaseAdmin.rpc('validate_admin_password_reset', {
      p_user_id: userId,
      p_new_password: newPassword
    })

    if (validationError || !validation.success) {
      throw new Error(validation?.error || validationError?.message || 'Erro na validação')
    }

    // Usar o cliente admin para atualizar a senha do usuário
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) {
      console.error('Erro ao atualizar senha do usuário:', error)
      throw error
    }

    // Log da ação bem-sucedida
    await supabaseAdmin.rpc('log_admin_action', {
      p_target_user_id: userId,
      p_action: 'password_reset_by_admin',
      p_details: { reset_method: 'admin_edge_function', success: true }
    })

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na função de edge:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})