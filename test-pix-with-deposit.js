import axios from 'axios';

const BASE_URL = 'https://checkout-microservice.vercel.app';

async function testPixWithDeposit() {
  console.log('\n🧪 Testing PIX payment with deposit card authorization...\n');
  
  const testBookingId = 'TEST-PIX-DEPOSIT-' + Date.now();
  
  try {
    // Step 1: Create checkout session
    console.log('1️⃣  Creating checkout session...');
    const createResponse = await axios.post(`${BASE_URL}/api/public/generate-checkout`, {
      booking_id: testBookingId,
      booking_data: {
        id: testBookingId,
        house_name: 'Casa Teste',
        guest_name: 'Test Guest',
        guest_email: 'test@example.com',
        guest_document: '12345678909',
        guest_phone: '11999999999',
        check_in: '2026-03-01',
        check_out: '2026-03-05',
        total_price: 1500,
        guest_count: 2
      },
      stay_amount: 1500,
      deposit_amount: 1000
    });
    
    const token = createResponse.data.token;
    console.log('✅ Session created!');
    console.log('   Token:', token);
    
    // Step 2: Process PIX payment WITH deposit card
    console.log('\n2️⃣  Processing payment:');
    console.log('   - Stay payment: PIX');
    console.log('   - Deposit: Credit Card (pre-authorization)');
    
    const paymentPayload = {
      token: token,
      bookingId: testBookingId,
      paymentData: {
        stayMethod: 'PIX',
        depositCardData: {
          holderName: 'Test User',
          cardNumber: '4111 1111 1111 1111',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          // Use PagBank test encrypted card for sandbox
          encryptedCard: 'DUMMY_ENCRYPTED_CARD_FOR_TEST'
        }
      }
    };
    
    console.log('\n   Sending payment request...');
    const paymentResponse = await axios.post(
      `${BASE_URL}/api/checkout/process`,
      paymentPayload
    );
    
    const result = paymentResponse.data;
    
    console.log('\n✅ PAYMENT PROCESSED!\n');
    console.log('Response Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Stay Status: ${result.stayStatus}`);
    console.log(`Deposit Status: ${result.depositStatus}`);
    
    if (result.stayAmount) {
      console.log(`Stay Amount: R$ ${(result.stayAmount / 100).toFixed(2)}`);
    }
    
    if (result.depositAmount) {
      console.log(`Deposit Amount: R$ ${(result.depositAmount / 100).toFixed(2)}`);
    }
    
    if (result.depositChargeId) {
      console.log(`Deposit Charge ID: ${result.depositChargeId}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.pix) {
      console.log('\n📱 PIX QR Code Generated:');
      console.log(`QR Code Image: ${result.pix.qrCodeImage}`);
      console.log(`Expires: ${result.pix.expirationDate}`);
    }
    
    // Verify the response includes deposit information
    if (result.depositStatus && result.depositAmount) {
      console.log('\n✅ SUCCESS! API returns deposit information');
      console.log('   Frontend will show deposit confirmation message before PIX QR code');
    } else {
      console.log('\n⚠️  WARNING: API did not return deposit information');
      console.log('   depositStatus:', result.depositStatus);
      console.log('   depositAmount:', result.depositAmount);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPixWithDeposit();
