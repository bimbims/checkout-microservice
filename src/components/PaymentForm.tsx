import React, { useState } from 'react';
import { CreditCard, Loader2, QrCode } from 'lucide-react';
import Alert from './Alert';
import { PagBankService } from '../services/pagbank';
import type { PaymentData } from '../types';

type PaymentMethod = 'PIX' | 'CREDIT_CARD';

interface PaymentFormProps {
  stayAmount: number;
  depositAmount: number;
  onSubmit: (data: PaymentData) => Promise<void>;
  isProcessing: boolean;
}



const PaymentForm: React.FC<PaymentFormProps> = ({
  stayAmount,
  depositAmount,
  onSubmit,
  isProcessing,
}) => {
  const [stayMethod, setStayMethod] = useState<PaymentMethod>('PIX');
  const [formData, setFormData] = useState({
    // Stay payment card (if credit card selected)
    stayHolderName: '',
    stayCardNumber: '',
    stayExpiryMonth: '',
    stayExpiryYear: '',
    stayCvv: '',
    // Deposit card (always required)
    depositHolderName: '',
    depositCardNumber: '',
    depositExpiryMonth: '',
    depositExpiryYear: '',
    depositCvv: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  const handleChange = (field: string, value: string) => {
    if (field.includes('CardNumber')) {
      value = formatCardNumber(value.replace(/\D/g, '').substring(0, 16));
    } else if (field.includes('Cvv')) {
      value = value.replace(/\D/g, '').substring(0, 3);
    } else if (field.includes('Month')) {
      value = value.replace(/\D/g, '').substring(0, 2);
    } else if (field.includes('Year')) {
      value = value.replace(/\D/g, '').substring(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEncrypting(true);

    try {
      console.log('[PaymentForm] Starting card encryption...');
      console.log('[PaymentForm] Deposit card data:', {
        number: formData.depositCardNumber.replace(/\s/g, '').length,
        month: formData.depositExpiryMonth,
        year: formData.depositExpiryYear
      });
      
      // Encrypt deposit card (always required)
      const depositEncrypted = await PagBankService.encryptCard(
        formData.depositCardNumber.replace(/\s/g, ''),
        formData.depositExpiryMonth,
        formData.depositExpiryYear,
        formData.depositHolderName
      );
      
      console.log('[PaymentForm] Deposit card encrypted:', depositEncrypted ? 'SUCCESS' : 'FAILED');
      
      const paymentData: PaymentData = {
        stayMethod,
        depositCardData: {
          holderName: formData.depositHolderName,
          cardNumber: formData.depositCardNumber,
          expiryMonth: formData.depositExpiryMonth,
          expiryYear: formData.depositExpiryYear,
          cvv: formData.depositCvv,
          encryptedCard: depositEncrypted,
        },
      };

      console.log('[PaymentForm] Payment data prepared:', {
        stayMethod,
        hasDepositEncrypted: !!paymentData.depositCardData.encryptedCard
      });

      // If paying stay with credit card, encrypt that too
      if (stayMethod === 'CREDIT_CARD') {
        const stayEncrypted = await PagBankService.encryptCard(
          formData.stayCardNumber.replace(/\s/g, ''),
          formData.stayExpiryMonth,
          formData.stayExpiryYear,
          formData.stayHolderName
        );

        paymentData.stayCardData = {
          holderName: formData.stayHolderName,
          cardNumber: formData.stayCardNumber,
          expiryMonth: formData.stayExpiryMonth,
          expiryYear: formData.stayExpiryYear,
          cvv: formData.stayCvv,
          encryptedCard: stayEncrypted,
        };
      }

      setIsEncrypting(false);
      await onSubmit(paymentData);
    } catch (err: any) {
      console.error('[PaymentForm] Payment error:', err);
      console.error('[PaymentForm] Error response:', err.response?.data);
      console.error('[PaymentForm] Full error object:', JSON.stringify(err.response?.data, null, 2));
      setIsEncrypting(false);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    }
  };

  const isFormValid = () => {
    const depositValid =
      formData.depositHolderName &&
      formData.depositCardNumber.replace(/\s/g, '').length === 16 &&
      formData.depositExpiryMonth &&
      formData.depositExpiryYear &&
      formData.depositCvv.length === 3;

    if (stayMethod === 'PIX') {
      return depositValid;
    }

    return (
      depositValid &&
      formData.stayHolderName &&
      formData.stayCardNumber.replace(/\s/g, '').length === 16 &&
      formData.stayExpiryMonth &&
      formData.stayExpiryYear &&
      formData.stayCvv.length === 3
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* STAY PAYMENT METHOD */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl text-ibira-green">
          1. Pagamento da Estadia
        </h3>
        <p className="text-sm text-ibira-green/60">
          Escolha a forma de pagamento para o valor de{' '}
          <strong>
            {stayAmount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </strong>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setStayMethod('PIX')}
            className={`p-4 border-2 rounded transition-all ${
              stayMethod === 'PIX'
                ? 'border-ibira-green bg-ibira-green/5'
                : 'border-ibira-border hover:border-ibira-green/30'
            }`}
          >
            <QrCode
              size={24}
              className={stayMethod === 'PIX' ? 'text-ibira-green' : 'text-ibira-green/40'}
            />
            <p className="mt-2 font-medium text-sm text-ibira-green">PIX</p>
          </button>

          <button
            type="button"
            onClick={() => setStayMethod('CREDIT_CARD')}
            className={`p-4 border-2 rounded transition-all ${
              stayMethod === 'CREDIT_CARD'
                ? 'border-ibira-green bg-ibira-green/5'
                : 'border-ibira-border hover:border-ibira-green/30'
            }`}
          >
            <CreditCard
              size={24}
              className={
                stayMethod === 'CREDIT_CARD' ? 'text-ibira-green' : 'text-ibira-green/40'
              }
            />
            <p className="mt-2 font-medium text-sm text-ibira-green">Cartão de Crédito</p>
          </button>
        </div>

        {stayMethod === 'CREDIT_CARD' && (
          <div className="mt-6 space-y-4 p-6 bg-white border border-ibira-border animate-fade-in">
            <h4 className="text-sm font-semibold text-ibira-green uppercase tracking-wide">
              Dados do Cartão de Crédito (Estadia)
            </h4>

            <div>
              <label className="block text-sm text-ibira-green/70 mb-1">
                Nome no Cartão
              </label>
              <input
                type="text"
                value={formData.stayHolderName}
                onChange={(e) => handleChange('stayHolderName', e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none"
                required={stayMethod === 'CREDIT_CARD'}
              />
            </div>

            <div>
              <label className="block text-sm text-ibira-green/70 mb-1">
                Número do Cartão
              </label>
              <input
                type="text"
                value={formData.stayCardNumber}
                onChange={(e) => handleChange('stayCardNumber', e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none font-mono"
                required={stayMethod === 'CREDIT_CARD'}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-ibira-green/70 mb-1">Mês</label>
                <input
                  type="text"
                  value={formData.stayExpiryMonth}
                  onChange={(e) => handleChange('stayExpiryMonth', e.target.value)}
                  placeholder="MM"
                  className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                  required={stayMethod === 'CREDIT_CARD'}
                />
              </div>
              <div>
                <label className="block text-sm text-ibira-green/70 mb-1">Ano</label>
                <input
                  type="text"
                  value={formData.stayExpiryYear}
                  onChange={(e) => handleChange('stayExpiryYear', e.target.value)}
                  placeholder="AAAA"
                  className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                  required={stayMethod === 'CREDIT_CARD'}
                />
              </div>
              <div>
                <label className="block text-sm text-ibira-green/70 mb-1">CVV</label>
                <input
                  type="text"
                  value={formData.stayCvv}
                  onChange={(e) => handleChange('stayCvv', e.target.value)}
                  placeholder="123"
                  className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                  required={stayMethod === 'CREDIT_CARD'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEPOSIT PREAUTHORIZATION */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl text-ibira-green">
          2. Caução (Pré-Autorização)
        </h3>
        <p className="text-sm text-ibira-green/60">
          Será feita uma pré-autorização de{' '}
          <strong>
            {depositAmount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </strong>{' '}
          no seu cartão de crédito, sem cobrança imediata.
        </p>

        <div className="p-6 bg-white border border-ibira-border space-y-4">
          <h4 className="text-sm font-semibold text-ibira-green uppercase tracking-wide">
            Dados do Cartão de Crédito (Caução)
          </h4>

          <div>
            <label className="block text-sm text-ibira-green/70 mb-1">
              Nome no Cartão
            </label>
            <input
              type="text"
              value={formData.depositHolderName}
              onChange={(e) => handleChange('depositHolderName', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-ibira-green/70 mb-1">
              Número do Cartão
            </label>
            <input
              type="text"
              value={formData.depositCardNumber}
              onChange={(e) => handleChange('depositCardNumber', e.target.value)}
              placeholder="0000 0000 0000 0000"
              className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-ibira-green/70 mb-1">Mês</label>
              <input
                type="text"
                value={formData.depositExpiryMonth}
                onChange={(e) => handleChange('depositExpiryMonth', e.target.value)}
                placeholder="MM"
                className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ibira-green/70 mb-1">Ano</label>
              <input
                type="text"
                value={formData.depositExpiryYear}
                onChange={(e) => handleChange('depositExpiryYear', e.target.value)}
                placeholder="AAAA"
                className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ibira-green/70 mb-1">CVV</label>
              <input
                type="text"
                value={formData.depositCvv}
                onChange={(e) => handleChange('depositCvv', e.target.value)}
                placeholder="123"
                className="w-full px-4 py-3 border border-ibira-border-dark focus:border-ibira-green focus:ring-1 focus:ring-ibira-green outline-none text-center"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={!isFormValid() || isProcessing || isEncrypting}
        className="w-full py-5 bg-ibira-green text-white font-bold tracking-widest uppercase hover:bg-black transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isProcessing || isEncrypting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {isEncrypting ? 'Criptografando dados...' : 'Processando pagamento...'}
          </>
        ) : (
          'Finalizar Pagamento'
        )}
      </button>

      <p className="text-xs text-center text-ibira-green/60">
        Seus dados de pagamento são criptografados e processados de forma segura pelo
        PagBank.
      </p>
    </form>
  );
};

export default PaymentForm;
