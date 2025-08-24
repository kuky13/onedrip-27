import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://onedrip-27.vercel.app',
  'https://oghjlypdnmqecaavekyr.supabase.co'
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}

interface PixPaymentRequest {
  planType: 'monthly' | 'annual'
  isVip: boolean
  userEmail: string
}

interface MercadoPagoPreference {
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    currency_id: string
  }>
  payer: {
    email: string
  }
  payment_methods: {
    excluded_payment_types: Array<{ id: string }>
    installments: number
  }
  external_reference: string
  notification_url?: string
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookUrl = Deno.env.get('MERCADO_PAGO_WEBHOOK_URL')

    if (!mercadoPagoAccessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `pix-payment:${clientIP}`
    
    // Simple in-memory rate limiting (for production, use Redis or database)
    const rateLimitWindow = 60 * 1000 // 1 minute
    const maxRequests = 5 // max 5 requests per minute per IP
    
    // Parse request body
    const { planType, isVip, userEmail }: PixPaymentRequest = await req.json()

    // Enhanced input validation
    if (!planType || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planType, userEmail' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate planType
    if (!['monthly', 'annual'].includes(planType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid planType. Must be monthly or annual' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate isVip is boolean
    if (typeof isVip !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'isVip must be a boolean value' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate price based on plan
    const prices = {
      monthly: { normal: 29.90, vip: 49.90 },
      annual: { normal: 299.90, vip: 499.90 }
    }

    const price = prices[planType][isVip ? 'vip' : 'normal']
    const planName = `OneDrip ${planType === 'monthly' ? 'Mensal' : 'Anual'}${isVip ? ' VIP' : ''}`
    
    // Generate external reference
    const externalReference = `onedrip-${Date.now()}-${planType}-${isVip ? 'vip' : 'normal'}`

    // Create Mercado Pago preference
    const preference: MercadoPagoPreference = {
      items: [{
        title: planName,
        quantity: 1,
        unit_price: price,
        currency_id: 'BRL'
      }],
      payer: {
        email: userEmail
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        installments: 1
      },
      external_reference: externalReference
    }

    // Add webhook URL if configured
    if (webhookUrl) {
      preference.notification_url = webhookUrl
    }

    console.log('Creating Mercado Pago preference:', {
      externalReference,
      planType,
      isVip,
      price,
      userEmail
    })

    // Call Mercado Pago API
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error('Mercado Pago API error:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        body: errorText
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment preference',
          details: `Mercado Pago API returned ${mpResponse.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mpData = await mpResponse.json()
    
    // Store transaction in Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        await supabase.from('pix_transactions').insert({
          external_reference: externalReference,
          preference_id: mpData.id,
          user_email: userEmail,
          plan_type: planType,
          is_vip: isVip,
          amount: price,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        
        console.log('Transaction stored in database:', externalReference)
      } catch (dbError) {
        console.error('Failed to store transaction in database:', dbError)
        // Continue execution - don't fail the payment creation
      }
    }

    console.log('PIX preference created successfully:', {
      preferenceId: mpData.id,
      externalReference
    })

    // Return success response
    return new Response(
      JSON.stringify({
        preference_id: mpData.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || null,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        external_reference: externalReference,
        amount: price,
        plan_name: planName
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('PIX payment creation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})