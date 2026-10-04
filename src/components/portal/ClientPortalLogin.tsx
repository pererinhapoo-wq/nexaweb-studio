import React, { useState, useEffect } from 'react';
import { Lock, Key, ArrowRight, AlertCircle, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

interface ClientPortalLoginProps {
  initialToken?: string;
  onAuthenticated: () => void;
  onBackToHome?: () => void;
}

export const ClientPortalLogin: React.FC<ClientPortalLoginProps> = ({
  initialToken = '',
  onAuthenticated,
  onBackToHome,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authenticateWithToken = async (rawToken: string) => {
    const trimmed = rawToken.trim();
    if (!trimmed) {
      setErrorMessage('Por favor, insira o seu código ou chave de acesso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ token: trimmed }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        // Higieniza a URL removendo qualquer parâmetro ?token= do histórico
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, '', '/portal');
        }

        // Limpa o token do estado da memória
        setTokenInput('');

        // Notifica o componente pai para renderizar o portal autenticado
        onAuthenticated();
      } else {
        if (response.status === 400) {
          setErrorMessage(data?.error || 'Token de acesso inválido ou mal formatado.');
        } else if (response.status === 401) {
          setErrorMessage('Chave de acesso inválida, expirada ou revogada pela equipe.');
        } else if (response.status === 503) {
          setErrorMessage('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
        } else {
          setErrorMessage(data?.error || 'Não foi possível validar o acesso. Verifique sua chave.');
        }
      }
    } catch {
      setErrorMessage('Falha na conexão com o servidor. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se o token foi fornecido na inicialização (ex: via query string ?token=), tenta login imediato
  useEffect(() => {
    if (initialToken && initialToken.trim()) {
      authenticateWithToken(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      authenticateWithToken(tokenInput);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Luzes de fundo decorativas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de retorno à Home */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </button>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Cabeçalho do Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-slate-900 to-violet-500/20 border border-cyan-500/30 mb-4 shadow-lg shadow-cyan-950/50">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Área do Cliente <span className="text-cyan-400">NexaWeb</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Acompanhe o status, etapas, solicitações e o andamento do seu projeto.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="client-token" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Chave Privada de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  id="client-token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Cole aqui a chave enviada pela equipe..."
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !tokenInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Validando Chave Segura...</span>
                </>
              ) : (
                <>
                  <span>Acessar Painel do Projeto</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conexão criptografada de ponta a ponta</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Não possui sua chave de acesso? Solicite diretamente ao seu gerente de projeto no WhatsApp oficial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalLogin;
