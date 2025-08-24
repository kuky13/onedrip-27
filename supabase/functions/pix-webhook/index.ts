import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

// Allowed origins for CORS - webhook should be more restrictive
const allowedOrigins = [
  'https://api.mercadopago.com',
  'https://www.mercadopago.com',
  'http://localhost:5173', // for testing
  'https://onedrip-27.vercel.app'
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://api.mercadopago.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
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

interface WebhookPayload {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  application_id: number
  user_id: number
  version: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Extract timestamp and signature from header
    const parts = signature.split(',')
    let ts = ''
    let v1 = ''
    
    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') ts = value
      if (key === 'v1') v1 = value
    }
    
    if (!ts || !v1) {
      console.error('Invalid signature format')
      return false
    }
    
    // Create the signed payload
    const signedPayload = `id:${JSON.parse(body).data.id};request-id:${JSON.parse(body).id};ts:${ts};`
    
    // Generate HMAC
    const hmac = createHmac('sha256', secret)
    hmac.update(signedPayload)
    const expectedSignature = hmac.digest('hex')
    
    return expectedSignature === v1
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
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
    const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    // Get request body
    const body = await req.text()
    
    // Validate webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('x-signature')
      if (!signature || !validateWebhookSignature(body, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Parse webhook payload
    const webhook: WebhookPayload = JSON.parse(body)
    
    console.log('Received webhook:', {
      type: webhook.type,
      action: webhook.action,
      paymentId: webhook.data.id,
      liveMode: webhook.live_mode
    })

    // Only process payment notifications
    if (webhook.type !== 'payment') {
      console.log('Ignoring non-payment webhook')
      return new Response(
        JSON.stringify({ message: 'Webhook received but not processed (not a payment)' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get payment details from Mercado Pago
    const paymentId = webhook.data.id
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error('Failed to fetch payment details:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        body: errorText
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch payment details',
          details: `Mercado Pago API returned ${mpResponse.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentData = await mpResponse.json()
    
    console.log('Payment details:', {
      id: paymentData.id,
      status: paymentData.status,
      externalReference: paymentData.external_reference,
      amount: paymentData.transaction_amount
    })

    // Update transaction in Supabase if configured
    if (supabaseUrl && supabaseServiceKey && paymentData.external_reference) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const statusMapping = {
          'approved': 'completed',
          'pending': 'pending',
          'in_process': 'pending',
          'rejected': 'failed',
          'cancelled': 'cancelled',
          'refunded': 'refunded'
        }

        const dbStatus = statusMapping[paymentData.status] || 'unknown'
        
        const { data, error } = await supabase
          .from('pix_transactions')
          .update({
            status: dbStatus,
            payment_id: paymentData.id,
            updated_at: new Date().toISOString(),
            mp_status: paymentData.status,
            mp_status_detail: paymentData.status_detail,
            webhook_received_at: new Date().toISOString()
          })
          .eq('external_reference', paymentData.external_reference)
          .select()
        
        if (error) {
          console.error('Failed to update transaction:', error)
        } else {
          console.log('Transaction updated successfully:', {
            externalReference: paymentData.external_reference,
            status: dbStatus,
            updatedRecords: data?.length || 0
          })
        }
        
        // If payment is approved, you could trigger additional actions here
        // like sending confirmation emails, activating subscriptions, etc.
        if (paymentData.status === 'approved') {
          console.log('Payment approved - could trigger subscription activation')
          // TODO: Add subscription activation logic
        }
        
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Don't fail the webhook - Mercado Pago expects 200 response
      }
    }

    // Always return 200 to acknowledge webhook receipt
    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        payment_id: paymentData.id,
        status: paymentData.status 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Return 200 even on error to prevent Mercado Pago from retrying
    // Log the error for debugging but don't fail the webhook
    return new Response(
      JSON.stringify({ 
        message: 'Webhook received but processing failed',
        error: error.message 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})