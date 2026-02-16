import axios from 'axios';

const BASE_URL = 'https://checkout-microservice.vercel.app';

async function generateTestCheckout() {
  console.log('\n🔗 Generating test checkout link...\n');
  
  const testBookingId = 'MANUAL-TEST-' + Date.now();
  
  try {
    const createResponse = await axios.post(`${BASE_URL}/api/public/generate-checkout`, {
      booking_id: testBookingId,
      booking_data: {
        id: testBookingId,
        house_name: 'Casa do Lago',
        guest_name: 'João Silva',
        guest_email: 'teste@example.com',
        guest_document: '12345678909',
        guest_phone: '11999999999',
        check_in: '2026-03-01',
        check_out: '2026-03-05',
        total_price: 1500,
        guest_counts: {
          adults: 2,
          children: 0,
          infants: 0
        }
      },
      stay_amount: 1500,
      deposit_amount: 1000
    });
    
    const token = createResponse.data.token;
    const url = createResponse.data.url;
    
    console.log('✅ Checkout criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 INFORMAÇÕES DO TESTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Booking ID: ${testBookingId}`);
    console.log(`Token: ${token}`);
    console.log(`\n🔗 URL do Checkout:\n${url}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 COMO TESTAR:\n');
    console.log('1. Abra a URL acima no navegador');
    console.log('2. Escolha forma de pagamento:');
    console.log('   - PIX: Não pede cartão de depósito (status: SKIPPED)');
    console.log('   - Cartão: Pede cartão de depósito (status: AUTHORIZED/FAILED)');
    console.log('\n3. Use cartões de teste do PagBank Sandbox:');
    console.log('   ✅ Aprovado: 4111 1111 1111 1111');
    console.log('   ❌ Recusado: 4000 0000 0000 0010');
    console.log('   CVV: qualquer 3 dígitos');
    console.log('   Validade: qualquer data futura');
    console.log('   Nome: qualquer nome');
    console.log('\n4. Após processar o pagamento, verifique:');
    console.log(`   🔍 Admin Panel: ${BASE_URL}/admin`);
    console.log('   O deposit hold deve aparecer lá!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

generateTestCheckout();
