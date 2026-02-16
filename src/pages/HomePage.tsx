import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { CreditCard, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="lg" />
          <h1 className="text-4xl font-serif font-bold text-ibira-green mt-8 mb-4">
            Sistema de Checkout Seguro
          </h1>
          <p className="text-gray-600 text-lg">
            Pagamento e gestão de cauções para reservas Ibirahill
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ibira-green/10 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-ibira-green" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">
              Pagamento Seguro
            </h3>
            <p className="text-gray-600 text-sm">
              PIX ou Cartão de Crédito via PagBank
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ibira-green/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-ibira-green" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">
              Caução Inteligente
            </h3>
            <p className="text-gray-600 text-sm">
              Pré-autorização de R$ 1.000 sem débito imediato
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ibira-green/10 rounded-full mb-4">
              <Clock className="w-8 h-8 text-ibira-green" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">
              Link Temporário
            </h3>
            <p className="text-gray-600 text-sm">
              Checkout válido por 12 horas após aprovação
            </p>
          </div>
        </div>

        {/* Access Panels */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">
              Tem um link de checkout?
            </h2>
            <p className="text-gray-600 mb-6">
              Se você recebeu um link de pagamento da Ibirahill por email, clique nele para acessar o checkout da sua reserva.
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
              <strong>Formato:</strong> checkout-microservice.vercel.app/checkout/CHK-...
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">
              Acesso Administrativo
            </h2>
            <p className="text-gray-600 mb-6">
              Gerenciar cauções e visualizar status de pagamentos.
            </p>
            <Link
              to="/admin"
              className="block w-full bg-ibira-green text-white text-center py-3 rounded-lg hover:bg-ibira-green/90 transition-colors font-semibold"
            >
              Acessar Painel Admin
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p>
            © 2026 Ibirahill | Pagamentos processados via{' '}
            <a href="https://pagseguro.uol.com.br" target="_blank" rel="noopener noreferrer" className="text-ibira-green hover:underline">
              PagBank
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
