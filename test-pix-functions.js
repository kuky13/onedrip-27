/**
 * Script de teste para as Edge Functions do PIX
 * Execute com: node test-pix-functions.js
 */

const SUPABASE_PROJECT_URL = 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naGpseXBkbm1xZWNhYXZla3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTI3NTcsImV4cCI6MjA2MTUyODc1N30.aor71Dj3pcEa7N82vGdW5MlciiNnl1ISqAimEyPbbJY';

// Função para testar a criação de pagamento PIX
async function testPixPayment() {
  console.log('🧪 Testando criação de pagamento PIX...');
  
  try {
    const response = await fetch(`${SUPABASE_PROJECT_URL}/pix-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        planType: 'monthly',
        isVip: false,
        userEmail: 'teste@exemplo.com'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Pagamento PIX criado com sucesso!');
      console.log('📄 Dados:', {
        preference_id: data.preference_id,
        external_reference: data.external_reference,
        amount: data.amount,
        plan_name: data.plan_name
      });
      return data.external_reference;
    } else {
      console.log('❌ Erro ao criar pagamento:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
    return null;
  }
}

// Função para testar consulta de status
async function testPixStatus(externalReference) {
  if (!externalReference) {
    console.log('⏭️ Pulando teste de status (sem external_reference)');
    return;
  }

  console.log('\n🧪 Testando consulta de status...');
  
  try {
    const response = await fetch(`${SUPABASE_PROJECT_URL}/pix-status?external_reference=${externalReference}`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Status consultado com sucesso!');
      console.log('📄 Status:', {
        payment_id: data.payment_id,
        status: data.status,
        external_reference: data.external_reference,
        amount: data.amount
      });
    } else {
      console.log('❌ Erro ao consultar status:', data);
    }
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
  }
}

// Função para testar webhook (simulação)
async function testWebhookValidation() {
  console.log('\n🧪 Testando validação de webhook...');
  
  try {
    // Teste com dados inválidos (deve falhar)
    const response = await fetch(`${SUPABASE_PROJECT_URL}/pix-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://api.mercadopago.com',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        type: 'test',
        data: { id: 'test-123' }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook processado (teste):', data.message);
    } else {
      console.log('❌ Erro no webhook:', data);
    }
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
  }
}

// Função para testar CORS
async function testCorsHeaders() {
  console.log('\n🧪 Testando headers CORS...');
  
  try {
    const response = await fetch(`${SUPABASE_PROJECT_URL}/pix-payment`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsHeaders = response.headers.get('Access-Control-Allow-Headers');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    console.log('✅ Headers CORS:');
    console.log('  - Origin:', corsOrigin);
    console.log('  - Headers:', corsHeaders);
    console.log('  - Methods:', corsMethods);
    console.log('  - Security Headers:', {
      'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
      'X-Frame-Options': response.headers.get('X-Frame-Options'),
      'X-XSS-Protection': response.headers.get('X-XSS-Protection')
    });
  } catch (error) {
    console.log('❌ Erro ao testar CORS:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes das Edge Functions PIX\n');
  console.log('🌐 URL Base:', SUPABASE_PROJECT_URL);
  console.log('=' .repeat(50));
  
  // Teste CORS primeiro
  await testCorsHeaders();
  
  // Teste criação de pagamento
  const externalReference = await testPixPayment();
  
  // Aguardar um pouco antes de consultar status
  if (externalReference) {
    console.log('\n⏳ Aguardando 2 segundos antes de consultar status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Teste consulta de status
  await testPixStatus(externalReference);
  
  // Teste webhook
  await testWebhookValidation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Verificar logs no painel do Supabase');
  console.log('2. Configurar webhook no Mercado Pago');
  console.log('3. Testar pagamento real no ambiente de sandbox');
  console.log('4. Fazer deploy das Edge Functions para produção');
}

// Executar testes automaticamente
runAllTests().catch(console.error);

export {
  testPixPayment,
  testPixStatus,
  testWebhookValidation,
  testCorsHeaders,
  runAllTests
};