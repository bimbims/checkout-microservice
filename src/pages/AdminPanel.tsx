import { useEffect, useState } from 'react';
import { DepositHold } from '../types';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lock, Unlock, DollarSign, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [deposits, setDeposits] = useState<DepositHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDeposits();
  }, []);

  async function loadDeposits() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/deposits');
      if (!response.ok) {
        throw new Error('Erro ao carregar depósitos');
      }

      const data = await response.json();
      setDeposits(data.deposits);
    } catch (err) {
      console.error('Error loading deposits:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleRelease(depositId: string) {
    if (!confirm('Deseja liberar esta caução? Esta ação cancelará a pré-autorização.')) {
      return;
    }

    try {
      setProcessingId(depositId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/deposit/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao liberar caução');
      }

      setSuccess('Caução liberada com sucesso!');
      await loadDeposits();
    } catch (err) {
      console.error('Error releasing deposit:', err);
      setError(err instanceof Error ? err.message : 'Erro ao liberar caução');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCapture(depositId: string) {
    // Find the deposit to show current amount
    const deposit = deposits.find(d => d.id === depositId);
    if (!deposit) {
      setError('Depósito não encontrado');
      return;
    }

    const depositAmount = deposit.amount / 100; // Convert cents to BRL
    
    // Ask for capture amount
    const captureAmountInput = prompt(
      `Digite o valor a ser capturado (R$):\n\n` +
      `Valor total da caução: R$ ${depositAmount.toFixed(2)}\n\n` +
      `Exemplos:\n` +
      `- "${depositAmount}" = captura total\n` +
      `- "250" = captura parcial de R$ 250,00\n` +
      `- "0" ou vazio = cancelar`,
      depositAmount.toString()
    );

    if (!captureAmountInput || captureAmountInput.trim() === '0') {
      return; // User cancelled
    }

    const captureAmount = parseFloat(captureAmountInput.replace(',', '.'));

    // Validate amount
    if (isNaN(captureAmount) || captureAmount <= 0) {
      setError('Valor inválido. Digite um número maior que zero.');
      return;
    }

    if (captureAmount > depositAmount) {
      setError(`Valor máximo permitido: R$ ${depositAmount.toFixed(2)}`);
      return;
    }

    // Confirm capture
    const isPartial = captureAmount < depositAmount;
    const confirmMessage = isPartial
      ? `Confirma captura PARCIAL?\n\n` +
        `Valor a cobrar: R$ ${captureAmount.toFixed(2)}\n` +
        `Valor a liberar: R$ ${(depositAmount - captureAmount).toFixed(2)}\n\n` +
        `O valor será cobrado do cartão do cliente.`
      : `Confirma captura TOTAL de R$ ${captureAmount.toFixed(2)}?\n\n` +
        `O valor será cobrado do cartão do cliente.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingId(depositId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/deposit/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          depositId,
          amount: captureAmount, // Send amount in BRL
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao capturar caução');
      }

      const result = await response.json();
      
      if (result.isPartialCapture) {
        setSuccess(
          `Captura parcial realizada!\n` +
          `Capturado: R$ ${result.capturedAmount.toFixed(2)}\n` +
          `O restante (R$ ${result.remainingAmount.toFixed(2)}) ainda está retido.`
        );
      } else {
        setSuccess('Caução capturada integralmente com sucesso!');
      }
      
      await loadDeposits();
    } catch (err) {
      console.error('Error capturing deposit:', err);
      setError(err instanceof Error ? err.message : 'Erro ao capturar caução');
    } finally {
      setProcessingId(null);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      AUTHORIZED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Autorizado' },
      CAPTURED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Capturado' },
      RELEASED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Liberado' },
      EXPIRED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expirado' },
      SKIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Não solicitado' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Falhou' },
    };

    const badge = badges[status] || badges.AUTHORIZED;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-ibira-green font-serif text-lg">Carregando depósitos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibira-beige to-white p-6">
      <div className="max-w-7xl mx-auto py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div>
                <h1 className="text-4xl font-serif font-bold text-ibira-green">
                  Gerenciamento de Cauções
                </h1>
                <p className="text-gray-600 mt-1">
                  Visualize e gerencie as pré-autorizações de caução
                </p>
              </div>
            </div>
            <button
              onClick={loadDeposits}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
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

        {/* Deposits Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {deposits.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Lock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhuma caução encontrada</p>
              <p className="text-sm mt-2">
                As cauções aparecerão aqui após os clientes realizarem o pagamento
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ibira-green text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Reserva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Casa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {deposit.booking_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deposit.house_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          R$ {(deposit.amount / 100).toFixed(2)}
                        </div>
                        {deposit.status === 'CAPTURED' && deposit.captured_amount && (
                          <div className="text-xs text-gray-500 mt-1">
                            Capturado: R$ {(deposit.captured_amount / 100).toFixed(2)}
                            {deposit.captured_amount < deposit.amount && (
                              <span className="text-green-600"> (parcial)</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deposit.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {deposit.created_at 
                            ? format(new Date(deposit.created_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {deposit.status === 'AUTHORIZED' && (
                            <>
                              <button
                                onClick={() => handleRelease(deposit.id)}
                                disabled={processingId === deposit.id}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                              >
                                <Unlock className="w-3 h-3" />
                                Liberar
                              </button>
                              <button
                                onClick={() => handleCapture(deposit.id)}
                                disabled={processingId === deposit.id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                              >
                                <DollarSign className="w-3 h-3" />
                                Capturar
                              </button>
                            </>
                          )}
                          {deposit.status === 'CAPTURED' && (
                            <span className="text-sm text-gray-500 italic">Já capturado</span>
                          )}
                          {deposit.status === 'RELEASED' && (
                            <span className="text-sm text-gray-500 italic">Já liberado</span>
                          )}
                          {deposit.status === 'EXPIRED' && (
                            <span className="text-sm text-red-500 italic">Expirado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-serif font-bold text-blue-900 mb-3">
            ℹ️ Como funciona o gerenciamento de cauções
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Autorizado:</strong> A pré-autorização foi aprovada. O valor está reservado
              no cartão do cliente, mas ainda não foi cobrado.
            </p>
            <p>
              <strong>Liberar:</strong> Cancela a pré-autorização. O valor deixa de estar reservado
              no cartão. Use quando não houver danos.
            </p>
            <p>
              <strong>Capturar:</strong> Efetiva a cobrança do valor reservado. O cliente será
              cobrado. Use apenas se houver danos.
            </p>
            <p className="text-xs mt-4 text-blue-600">
              Importante: Pré-autorizações expiram automaticamente após 5 dias se não forem
              capturadas ou liberadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
