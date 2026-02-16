import axios from 'axios';

const BASE_URL = 'https://checkout-microservice.vercel.app';

async function testCreditCardPayment() {
  console.log('\n🧪 Testing Credit Card payment with deposit...\n');
  
  const testBookingId = 'TEST-CARD-' + Date.now();
  
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
    console.log('✅ Session created!');
    console.log('   Token:', token);
    
    // Step 2: Process Credit Card payment with deposit card
    console.log('\n2️⃣  Processing payment:');
    console.log('   - Stay payment: CREDIT CARD');
    console.log('   - Deposit: Credit Card (pre-authorization)');
    
    const paymentPayload = {
      token: token,
      bookingId: testBookingId,
      paymentData: {
        stayMethod: 'CREDIT_CARD',
        stayCardData: {
          holderName: 'Test User Stay',
          cardNumber: '4111 1111 1111 1111',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '123',
          encryptedCard: 'DUMMY_ENCRYPTED_CARD_STAY'
        },
        depositCardData: {
          holderName: 'Test User Deposit',
          cardNumber: '5555 5555 5555 4444',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '456',
          encryptedCard: 'DUMMY_ENCRYPTED_CARD_DEPOSIT'
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
    console.log(`Success: ${result.success}`);
    console.log(`Stay Status: ${result.stayStatus}`);
    console.log(`Stay Charge ID: ${result.stayChargeId}`);
    console.log(`Deposit Status: ${result.depositStatus}`);
    console.log(`Deposit Charge ID: ${result.depositChargeId || 'NULL'}`);
    
    if (result.stayAmount) {
      console.log(`Stay Amount: R$ ${(result.stayAmount / 100).toFixed(2)}`);
    }
    
    if (result.depositAmount) {
      console.log(`Deposit Amount: R$ ${(result.depositAmount / 100).toFixed(2)}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check if deposit was saved
    console.log('\n3️⃣  Checking admin panel...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for database
    
    const adminResponse = await axios.get(`${BASE_URL}/api/admin/deposits`);
    console.log(`\nDeposits in admin: ${adminResponse.data.count}`);
    
    if (adminResponse.data.count > 0) {
      console.log('\n✅ SUCCESS! Deposit appears in admin panel');
      console.log('\nLatest deposits:');
      adminResponse.data.deposits.slice(0, 3).forEach((deposit, i) => {
        console.log(`\n${i + 1}. Booking: ${deposit.booking_id}`);
        console.log(`   Status: ${deposit.status}`);
        console.log(`   Amount: R$ ${(deposit.amount / 100).toFixed(2)}`);
        console.log(`   Charge ID: ${deposit.charge_id || 'NULL'}`);
      });
    } else {
      console.log('\n⚠️  WARNING: No deposits in admin panel!');
      console.log('   Deposit was processed but not appearing in admin');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreditCardPayment();
