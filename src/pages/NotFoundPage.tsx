import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-6xl font-serif font-bold text-ibira-green mb-4">404</h1>
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            Página não encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            A página que você está procurando não existe ou pode ter sido removida.
          </p>

          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full py-3 px-4 bg-ibira-green text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              Ir para Início
            </Link>
            <a
              href="https://ibirahill.com.br"
              className="block w-full py-3 px-4 border-2 border-ibira-green text-ibira-green font-semibold rounded-lg hover:bg-ibira-green hover:text-white transition-all"
            >
              Voltar ao Site Principal
            </a>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Precisa de ajuda?{' '}
          <a
            href="mailto:contato@ibirahill.com.br"
            className="text-ibira-green hover:underline font-medium"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
