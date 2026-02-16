import axios from 'axios';

// Test PagBank API directly to understand the response structure
const PAGBANK_API_URL = 'https://sandbox.api.pagseguro.com';
const PAGBANK_API_TOKEN = '41488533-30d8-4048-8e8c-1804c8f700c856b6e1014a3fa5600d3041cf0a802d5f52cc-d90b-42b4-89ae-555ddc78f29c';

async function testPagBankPIX() {
  console.log('\n🧪 Testing PagBank PIX API directly...\n');
  
  try {
    console.log('Creating PIX order...');
    
    const response = await axios.post(
      `${PAGBANK_API_URL}/orders`,
      {
        reference_id: `TEST-PIX-${Date.now()}`,
        customer: {
          name: 'Test Customer',
          email: `pix-test-${Date.now()}@sandbox.test`,
          tax_id: '12345678909'
        },
        items: [{
          reference_id: `item-test`,
          name: `Test PIX Payment`,
          quantity: 1,
          unit_amount: 150000 // R$ 1500.00 in cents
        }],
        qr_codes: [{
          amount: {
            value: 150000
          },
          expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${PAGBANK_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('\n✅ PIX Order Created Successfully!');
    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 QR Codes Data:');
    if (response.data.qr_codes && response.data.qr_codes.length > 0) {
      console.log('QR Code found:', response.data.qr_codes[0]);
      console.log('QR Code Text:', response.data.qr_codes[0].text?.substring(0, 50) + '...');
      console.log('QR Code Links:', response.data.qr_codes[0].links);
    } else {
      console.log('⚠️  No QR code data in response!');
      console.log('Response keys:', Object.keys(response.data));
    }
    
  } catch (error) {
    console.log('\n❌ API Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testPagBankPIX();
