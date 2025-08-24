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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get payment ID from URL
    const url = new URL(req.url)
    const paymentId = url.searchParams.get('payment_id')
    const externalReference = url.searchParams.get('external_reference')

    if (!paymentId && !externalReference) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id or external_reference parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
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

    let mpResponse
    let paymentData

    if (paymentId) {
      // Check payment status directly by payment ID
      console.log('Checking payment status for ID:', paymentId)
      
      mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json'
        }
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
            error: 'Failed to check payment status',
            details: `Mercado Pago API returned ${mpResponse.status}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      paymentData = await mpResponse.json()
    } else {
      // Search payments by external reference
      console.log('Searching payments for external reference:', externalReference)
      
      mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${externalReference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json'
        }
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
            error: 'Failed to search payments',
            details: `Mercado Pago API returned ${mpResponse.status}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const searchData = await mpResponse.json()
      
      if (!searchData.results || searchData.results.length === 0) {
        return new Response(
          JSON.stringify({ 
            status: 'pending',
            message: 'No payments found for this reference' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get the most recent payment
      paymentData = searchData.results[0]
    }

    // Update transaction status in Supabase if configured
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
        
        await supabase
          .from('pix_transactions')
          .update({
            status: dbStatus,
            payment_id: paymentData.id,
            updated_at: new Date().toISOString(),
            mp_status: paymentData.status,
            mp_status_detail: paymentData.status_detail
          })
          .eq('external_reference', paymentData.external_reference)
        
        console.log('Transaction status updated in database:', {
          externalReference: paymentData.external_reference,
          status: dbStatus,
          mpStatus: paymentData.status
        })
      } catch (dbError) {
        console.error('Failed to update transaction in database:', dbError)
        // Continue execution - don't fail the status check
      }
    }

    console.log('Payment status checked successfully:', {
      paymentId: paymentData.id,
      status: paymentData.status,
      externalReference: paymentData.external_reference
    })

    // Return payment status
    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        external_reference: paymentData.external_reference,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        date_created: paymentData.date_created,
        date_approved: paymentData.date_approved,
        payer_email: paymentData.payer?.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('PIX status check error:', error)
    
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