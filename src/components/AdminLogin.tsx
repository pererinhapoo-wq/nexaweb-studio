import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onBackToSite,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.authenticated) {
        onSuccess();
        return;
      }

      if (response.status === 503 || data?.error?.includes('não configurada')) {
        setErrorMessage('Autenticação administrativa não configurada.');
      } else if (response.status === 401) {
        setErrorMessage('Senha incorreta.');
      } else {
        setErrorMessage(
          data?.error || 'Não foi possível verificar a autenticação.'
        );
      }
    } catch {
      setErrorMessage('Não foi possível verificar a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col justify-between font-sans selection:bg-amber-400/20 selection:text-amber-200">
      {/* Barra superior minimalista */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o site</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-neutral-950 text-xs">
            N
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-white">
            NexaWeb
          </span>
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl bg-neutral-900/90 border border-neutral-800 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-400/5">
              <Lock className="w-6 h-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Área Administrativa
            </h1>

            <p className="text-xs sm:text-sm text-neutral-400">
              Acesso privado do proprietário.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-neutral-300"
              >
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={loading}
                placeholder="Digite sua senha de acesso"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-md shadow-amber-400/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onBackToSite}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors py-1"
            >
              Voltar para o site
            </button>
          </div>
        </div>
      </main>

      {/* Rodapé discreto */}
      <footer className="p-4 text-center text-[11px] text-neutral-600">
        NexaWeb • Acesso seguro com criptografia serverless
      </footer>
    </div>
  );
};
