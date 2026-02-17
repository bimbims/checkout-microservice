import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: {
    amount?: number;
    currency?: string;
    display?: string;
  };
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for deposit amount
  const [depositAmountReais, setDepositAmountReais] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.origin}/api/admin/settings`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);

        // Find deposit_amount and populate form
        const depositSetting = data.settings.find((s: SystemSetting) => s.key === 'deposit_amount');
        if (depositSetting && depositSetting.value.amount) {
          // Convert cents to reais for display
          const reais = (depositSetting.value.amount / 100).toFixed(2);
          setDepositAmountReais(reais);
        }
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const handleSaveDepositAmount = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Parse and validate input
      const reais = parseFloat(depositAmountReais);
      if (isNaN(reais) || reais <= 0) {
        setError('Por favor, insira um valor válido maior que zero');
        return;
      }

      if (reais < 50) {
        setError('O valor mínimo do depósito é R$ 50,00');
        return;
      }

      if (reais > 50000) {
        setError('O valor máximo do depósito é R$ 50.000,00');
        return;
      }

      // Convert to cents
      const cents = Math.round(reais * 100);
      const display = formatCurrency(cents);

      const response = await fetch(`${window.location.origin}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'deposit_amount',
          value: {
            amount: cents,
            currency: 'BRL',
            display: display,
          },
          updated_by: 'admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Valor do depósito atualizado com sucesso!');
        fetchSettings(); // Refresh settings
      } else {
        setError(data.error || 'Falha ao atualizar configuração');
      }
    } catch (err) {
      console.error('Error saving setting:', err);
      setError('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-ibira-green font-serif text-lg">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-ibira-green hover:text-ibira-green-dark mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Cauções
          </button>

          <div className="flex items-center gap-4 mb-6">
            <Logo size="md" />
            <div>
              <h1 className="text-4xl font-serif font-bold text-ibira-green">
                Configurações do Sistema
              </h1>
              <p className="text-gray-600 mt-1">
                Configure valores e parâmetros globais
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert type="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert type="success" onClose={() => setSuccess(null)} className="mb-4">
              {success}
            </Alert>
          )}
        </div>

        {/* Deposit Amount Setting */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Valor da Caução
              </h2>
              <p className="text-gray-600 mb-6">
                Defina o valor padrão da pré-autorização de caução. Este valor será usado em 
                todas as novas reservas, aparecerá nos emails e na página de checkout.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <input
                        type="number"
                        id="depositAmount"
                        step="0.01"
                        min="50"
                        max="50000"
                        value={depositAmountReais}
                        onChange={(e) => setDepositAmountReais(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibira-green focus:border-transparent text-lg font-semibold"
                        placeholder="1000.00"
                      />
                    </div>
                    <button
                      onClick={handleSaveDepositAmount}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-ibira-green text-white rounded-lg hover:bg-ibira-green-dark transition-colors disabled:opacity-50 font-semibold"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Mínimo: R$ 50,00 | Máximo: R$ 50.000,00
                  </p>
                </div>

                {/* Current Settings Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    Configuração Atual
                  </h3>
                  {settings
                    .filter(s => s.key === 'deposit_amount')
                    .map(setting => (
                      <div key={setting.key} className="space-y-1 text-sm">
                        <p className="text-blue-800">
                          <strong>Valor:</strong> {formatCurrency(setting.value.amount || 0)}
                        </p>
                        <p className="text-blue-700">
                          <strong>Última atualização:</strong>{' '}
                          {new Date(setting.updated_at).toLocaleString('pt-BR')}
                          {setting.updated_by && ` por ${setting.updated_by}`}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-serif font-bold text-yellow-900 mb-3">
            ⚠️ Importante
          </h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>
              <strong>Este valor será usado automaticamente em:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Emails de confirmação enviados aos clientes</li>
              <li>Página de checkout (valor exibido antes do pagamento)</li>
              <li>Processamento de pagamento (pré-autorização no cartão)</li>
              <li>Links de checkout gerados pelo sistema</li>
            </ul>
            <p className="mt-4">
              <strong>Nota:</strong> Esta alteração afeta apenas novas reservas. Reservas existentes 
              mantém o valor que foi definido no momento da criação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
