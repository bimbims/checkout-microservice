import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Voltar para o Painel
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-2">Gerencie as configurações globais do sistema de reservas</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Deposit Amount Setting */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Valor do Depósito de Caução</h2>
          <p className="text-gray-600 mb-6">
            Este valor será usado em todo o sistema: emails, página de checkout, processamento de pagamentos e painel administrativo.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Depósito (R$)
              </label>
              <div className="flex gap-4 items-start">
                <input
                  type="number"
                  id="depositAmount"
                  step="0.01"
                  min="50"
                  max="50000"
                  value={depositAmountReais}
                  onChange={(e) => setDepositAmountReais(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000.00"
                />
                <button
                  onClick={handleSaveDepositAmount}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Valor mínimo: R$ 50,00 | Valor máximo: R$ 50.000,00
              </p>
            </div>

            {/* Preview */}
            {depositAmountReais && !isNaN(parseFloat(depositAmountReais)) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Preview</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(Math.round(parseFloat(depositAmountReais) * 100))}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Este valor será exibido para os clientes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* All Settings Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Todas as Configurações</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atualizado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settings.map((setting) => (
                  <tr key={setting.key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setting.key}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {setting.key === 'deposit_amount' ? (
                        <span className="font-semibold text-blue-600">
                          {setting.value.display || formatCurrency(setting.value.amount || 0)}
                        </span>
                      ) : (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {JSON.stringify(setting.value)}
                        </code>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {setting.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(setting.updated_at).toLocaleString('pt-BR')}
                      {setting.updated_by && (
                        <div className="text-xs text-gray-400">por {setting.updated_by}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
