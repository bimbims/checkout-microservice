import axios from 'axios';

const BASE_URL = 'https://checkout-microservice.vercel.app';
// const BASE_URL = 'http://localhost:3000'; // Use this for local testing

async function testPayment() {
  console.log('\n🧪 Starting payment test...\n');
  
  // Generate consistent booking ID
  const testBookingId = 'TEST-' + Date.now();
  
  try {
    // Step 1: Create checkout session
    console.log('1️⃣  Creating checkout session...');
    console.log('   Booking ID:', testBookingId);
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
    console.log('   URL:', createResponse.data.url);
    
    // Step 2: Process PIX payment
    console.log('\n2️⃣  Processing PIX payment...');
    console.log('   Using booking ID:', testBookingId);
    console.log('   Token:', token);
    
    const paymentPayload = {
      token: token,
      bookingId: testBookingId,
      paymentData: {
        stayMethod: 'PIX'
        // No deposit card for PIX-only test
      }
    };
    
    console.log('   Payload:', JSON.stringify(paymentPayload, null, 2));
    
    // Try NEW endpoint /api/checkout/payment (not cached)
    const paymentResponse = await axios.post(`${BASE_URL}/api/checkout/payment`, paymentPayload);
    
    console.log('\n✅ PAYMENT SUCCESS!');
    console.log('Response:', JSON.stringify(paymentResponse.data, null, 2));
    
    if (paymentResponse.data.pix) {
      console.log('\n📱 PIX QR Code available!');
      console.log('QR Code (first 50 chars):', paymentResponse.data.pix.qrCode?.substring(0, 50) + '...');
      console.log('QR Code Image:', paymentResponse.data.pix.qrCodeImage);
    }
    
    console.log('\n✅ TEST PASSED! PIX payment working correctly.');
    
  } catch (error) {
    console.log('\n❌ PAYMENT FAILED!');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      
      // Check for email error specifically
      if (error.response.data?.pagbankError?.data?.error_messages) {
        const emailError = error.response.data.pagbankError.data.error_messages.find(
          e => e.parameter_name === 'customer.email'
        );
        if (emailError) {
          console.log('\n🔴 EMAIL ERROR DETECTED:', emailError.description);
        }
      }
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run test
testPayment();
