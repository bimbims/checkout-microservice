import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Booking, PaymentData } from '../types';
import bookingReaderService from '../services/booking-reader';
import BookingSummary from '../components/BookingSummary';
import PaymentForm from '../components/PaymentForm';
import Alert from '../components/Alert';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import { getBrazilianDate } from '../utils/timezone';

export default function CheckoutPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false); // New processing state
  const [pixData, setPixData] = useState<any>(null); // Store PIX QR code data
  const [depositStatus, setDepositStatus] = useState<string | null>(null); // Store deposit authorization status
  const [depositAmount, setDepositAmount] = useState<number>(0); // Store deposit amount
  const [stayAmount, setStayAmount] = useState<number>(0); // Store stay amount
  const [booking, setBooking] = useState<Booking | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Validate token and load booking
  useEffect(() => {
    async function loadCheckout() {
      if (!token) {
        navigate('/404');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Validate checkout session
        const response = await fetch(`/api/checkout/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Sessão de checkout inválida ou expirada');
        }

        const sessionData = await response.json();
        
        // Use cached booking data if available, otherwise fetch from main system
        let bookingData: Booking | null;
        if (sessionData.booking_data) {
          // Use cached booking data from checkout session (for testing/standalone mode)
          bookingData = sessionData.booking_data;
        } else {
          // Fetch from main reservation system (production integration)
          bookingData = await bookingReaderService.getBooking(sessionData.booking_id);
        }
        
        if (!bookingData) {
          throw new Error('Dados da reserva não encontrados');
        }
        
        setBooking(bookingData);
        setSessionValid(true);

        // Set amounts from session (deposit_amount is stored in CENTS, convert to REAIS for display)
        setStayAmount(sessionData.stay_amount || bookingData.total_price || 0);
        setDepositAmount((sessionData.deposit_amount || 100000) / 100);

        // Calculate time remaining
        const expiresAt = new Date(sessionData.expires_at);
        updateTimeRemaining(expiresAt);

        // Update time remaining every minute
        const interval = setInterval(() => {
          updateTimeRemaining(expiresAt);
        }, 60000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('Error loading checkout:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar checkout');
        setSessionValid(false);
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [token, navigate]);

  function updateTimeRemaining(expiresAt: Date) {
    const now = getBrazilianDate();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expirado');
      setSessionValid(false);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeRemaining(`${hours}h ${minutes}min`);
  }

  async function handlePaymentSubmit(paymentData: PaymentData) {
    if (!token || !booking) return;

    setProcessing(true); // Start processing
    setError(null);
    
    try {

      const response = await fetch(`/api/checkout/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          bookingId: booking.id,
          paymentData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[CheckoutPage] Payment failed with status:', response.status);
        console.error('[CheckoutPage] Error data:', data);
        console.error('[CheckoutPage] Full error object:', JSON.stringify(data, null, 2));
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      const result = await response.json();
      
      if (result.success) {
        // Store deposit information
        if (result.depositStatus) {
          setDepositStatus(result.depositStatus);
        }
        if (result.depositAmount) {
          setDepositAmount(result.depositAmount);
        }
        if (result.stayAmount) {
          setStayAmount(result.stayAmount);
        }
        
        // If PIX payment, show QR code
        if (result.pix) {
          setPixData(result.pix);
        }
        setSuccess(true);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.message || 'Pagamento não foi processado');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setProcessing(false); // End processing
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-ibira-green font-serif text-lg">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="text-center mb-8">
            <Logo size="lg" />
          </div>
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Este link de checkout pode ter expirado ou já foi utilizado.
            </p>
            <p className="text-gray-600">
              Entre em contato com o Ibirahill para obter um novo link de pagamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    // Show PIX QR code if payment is PIX
    if (pixData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
          <div className="max-w-2xl mx-auto pt-20">
            <div className="text-center mb-8">
              <Logo size="lg" />
            </div>
            
            {/* Deposit Authorization Success - Show this BEFORE the PIX QR code */}
            {depositStatus === 'AUTHORIZED' && depositAmount > 0 && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-green-800 text-center mb-2">
                  ✓ Caução Autorizada com Sucesso!
                </h3>
                <p className="text-green-700 text-center mb-2">
                  <strong>R$ {(depositAmount / 100).toFixed(2)}</strong> foram pré-autorizados no seu cartão
                </p>
                <p className="text-sm text-green-600 text-center">
                  Este valor será liberado automaticamente após o checkout, caso não haja danos.
                </p>
              </div>
            )}
            
            {/* Now continue with PIX payment */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h3 className="text-2xl font-serif font-bold mb-4 text-ibira-green text-center">
                {depositStatus === 'AUTHORIZED' ? 'Agora, pague a estadia com PIX' : 'Pagamento PIX'}
              </h3>
              
              {/* Stay Amount - Show prominently */}
              <div className="bg-ibira-green/10 border-2 border-ibira-green rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 text-center mb-1">Valor da Estadia</p>
                <p className="text-3xl font-bold text-ibira-green text-center">
                  R$ {stayAmount > 0 ? (stayAmount / 100).toFixed(2) : booking?.total_price?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <p className="text-center text-gray-600 mb-6">
                Escaneie o QR Code abaixo para finalizar sua reserva
              </p>
              
              {/* QR Code Image */}
              {pixData.qrCodeImage && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={pixData.qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-64 h-64 border-4 border-ibira-green rounded-lg"
                  />
                </div>
              )}
              
              {/* PIX Copy & Paste */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2 text-center font-medium">
                  Ou copie o código PIX:
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={pixData.qrCode}
                    readOnly
                    className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-lg pr-24 font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.qrCode);
                      alert('Código PIX copiado!');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-ibira-green text-white rounded-md hover:bg-ibira-green/90 text-sm font-medium"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Expiration Warning */}
              {pixData.expirationDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800 text-center">
                    ⏱️ Este código expira em 30 minutos
                  </p>
                  <p className="text-xs text-yellow-700 text-center mt-1">
                    Expira: {new Date(pixData.expirationDate).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 border-t pt-6">
                <h4 className="font-semibold text-ibira-green mb-3">Como pagar:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção Pix</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    ✓ Após o pagamento, você receberá a confirmação por email
                  </p>
                </div>
              </div>
            </div>
            
            {/* Booking Info */}
            {booking && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-sm text-gray-500">
                <p>Código da Reserva: <strong>{booking.id}</strong></p>
                <p>Casa: <strong>{booking.house_name}</strong></p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Show success message for credit card payments
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="text-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <h3 className="text-2xl font-serif font-bold mb-2 text-green-700">Pagamento Confirmado!</h3>
            <p className="text-base text-gray-700">
              Sua reserva foi confirmada com sucesso. Você receberá um email com todos os detalhes.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 text-green-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-serif font-bold text-ibira-green mb-2">
              Obrigado pela sua reserva!
            </h4>
            <p className="text-gray-600 mb-4">
              Estamos ansiosos para recebê-lo no Ibirahill.
            </p>
            {booking && (
              <div className="text-sm text-gray-500 border-t pt-4 mt-4">
                <p>Código da Reserva: <strong>{booking.id}</strong></p>
                <p>Casa: <strong>{booking.house_name}</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="lg" />
          <h1 className="text-4xl font-serif font-bold text-ibira-green mt-6 mb-2">
            Finalizar Pagamento
          </h1>
          <p className="text-gray-600">
            Complete o pagamento para confirmar sua reserva
          </p>
          {timeRemaining && (
            <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
              ⏱️ Este link expira em: <strong>{timeRemaining}</strong>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" onClose={() => setError(null)} className="mb-8">
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {booking && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Booking Summary */}
            <div>
              <BookingSummary
                booking={booking}
                stayAmount={stayAmount || booking.total_price}
                depositAmount={depositAmount}
                totalAmount={(stayAmount || booking.total_price) + depositAmount}
              />
            </div>

            {/* Right Column - Payment Form */}
            <div>
              <PaymentForm
                stayAmount={stayAmount || booking.total_price}
                depositAmount={depositAmount}
                onSubmit={handlePaymentSubmit}
                isProcessing={processing}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Pagamento seguro processado via PagBank | Todos os dados são criptografados
          </p>
          <p className="mt-2">
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:contato@ibirahill.com.br" className="text-ibira-green hover:underline">
              contato@ibirahill.com.br
            </a>
          </p>
        </div>
      </div>
      
      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-4 text-center">
            <div className="mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-ibira-green mb-3">
              Processando Pagamento
            </h3>
            <p className="text-gray-600 mb-4">
              Estamos validando seus dados e processando a transação de forma segura com o PagBank.
            </p>
            <p className="text-sm text-gray-500">
              Por favor, não atualize ou feche esta página.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Conexão segura
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
