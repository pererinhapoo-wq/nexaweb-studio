import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  MessageSquare,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Shield,
  Loader2,
  Calendar,
  Plus,
  X,
} from 'lucide-react';
import { ClientPortalLogin } from './ClientPortalLogin';
import type {
  PortalProject,
  PortalClient,
  PortalUpdate,
  PortalRequest,
  PortalReview,
  PortalProjectResponse,
} from '../../types/portal';

interface ClientPortalProps {
  onBackToHome?: () => void;
}

type PortalViewState = 'loading' | 'unauthenticated' | 'loaded' | 'not_found' | 'error';

export const ClientPortal: React.FC<ClientPortalProps> = ({ onBackToHome }) => {
  const [viewState, setViewState] = useState<PortalViewState>('loading');
  const [initialToken, setInitialToken] = useState<string>('');
  const [project, setProject] = useState<PortalProject | null>(null);
  const [client, setClient] = useState<PortalClient | null>(null);
  const [updates, setUpdates] = useState<PortalUpdate[]>([]);
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [reviews, setReviews] = useState<PortalReview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado do Modal de Nova Solicitação do Cliente
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<string>('Ajuste de Design');
  const [requestTitle, setRequestTitle] = useState<string>('');
  const [requestDescription, setRequestDescription] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Captura eventual parâmetro de token na URL ao montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken && urlToken.trim()) {
        setInitialToken(urlToken.trim());
      }
    }
  }, []);

  const loadProjectData = useCallback(async () => {
    setViewState('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/portal-project', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (response.status === 401) {
        setViewState('unauthenticated');
        return;
      }

      if (response.status === 404) {
        setViewState('not_found');
        return;
      }

      const data: PortalProjectResponse = await response.json().catch(() => null);

      if (response.ok && data?.success && data.project) {
        setProject(data.project);
        setClient(data.client || { name: null, business_name: null });
        setUpdates(data.updates || []);
        setRequests(data.requests || []);
        setReviews(data.reviews || []);
        setViewState('loaded');
      } else {
        setErrorMessage(data?.error || 'Não foi possível carregar os dados do seu projeto.');
        setViewState('error');
      }
    } catch {
      setErrorMessage('Erro na comunicação com o servidor. Verifique sua conexão.');
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const handleLogout = () => {
    // Para encerrar visualmente a sessão no cliente e retornar ao login
    setViewState('unauthenticated');
    setProject(null);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = requestTitle.trim();
    const cleanDescription = requestDescription.trim();

    if (!cleanTitle) {
      setRequestError('Por favor, informe o título da solicitação.');
      return;
    }
    if (cleanTitle.length < 3) {
      setRequestError('O título deve ter no mínimo 3 caracteres.');
      return;
    }
    if (!cleanDescription) {
      setRequestError('Por favor, descreva os detalhes da sua solicitação.');
      return;
    }
    if (cleanDescription.length < 5) {
      setRequestError('A descrição deve ter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      const response = await fetch('/api/portal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          category: requestCategory,
          title: cleanTitle,
          description: cleanDescription,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 201 && data?.success && data.request) {
        // Insere a nova solicitação imediatamente no início da lista do cliente
        setRequests((prev) => [data.request, ...prev]);
        setIsNewRequestModalOpen(false);
        setRequestTitle('');
        setRequestDescription('');
        setRequestCategory('Ajuste de Design');
        setRequestError(null);
      } else {
        setRequestError(data?.error || 'Não foi possível enviar a solicitação. Tente novamente.');
      }
    } catch {
      setRequestError('Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 1. Estado de Carregamento
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 px-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">
          Carregando informações do projeto...
        </p>
      </div>
    );
  }

  // 2. Estado Não Autenticado
  if (viewState === 'unauthenticated') {
    return (
      <ClientPortalLogin
        initialToken={initialToken}
        onAuthenticated={() => {
          setInitialToken('');
          loadProjectData();
        }}
        onBackToHome={onBackToHome}
      />
    );
  }

  // 3. Estado Projeto Não Encontrado (404)
  if (viewState === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Projeto Não Encontrado</h2>
          <p className="text-sm text-slate-400 mb-6">
            O projeto associado a esta sessão não foi localizado ou foi arquivado pela equipe NexaWeb.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Trocar de Chave
            </button>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
              >
                Voltar à Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Estado de Erro Genérico
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Falha no Carregamento</h2>
          <p className="text-sm text-slate-400 mb-6">
            {errorMessage || 'Ocorreu um erro ao carregar os dados. Tente novamente em instantes.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadProjectData}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Estado de Sucesso (Projeto Carregado)
  const progressVal = Math.min(Math.max(project?.progress_percent ?? 0, 0), 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-cyan-500 selection:text-black">
      {/* Barra de Navegação do Portal */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                title="Voltar ao site"
                className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                Nexa<span className="text-cyan-400">Web</span>
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                Portal do Cliente
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProjectData}
              title="Atualizar dados"
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 py-1.5 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Banner de Saudação e Status do Projeto */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Projeto Verificado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Olá, {client?.name || 'Cliente'}!
              </h1>
              {client?.business_name && (
                <p className="text-sm font-medium text-slate-400 mt-1">
                  {client.business_name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                Plano {project?.plan || 'Standard'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Status: {project?.status || 'Em Andamento'}
              </span>
              {project?.estimated_delivery_date && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Previsão: {new Date(project.estimated_delivery_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>

          {/* Progresso e Etapa Atual */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Etapa Atual:</span>
                <span className="text-sm font-bold text-white bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700">
                  {project?.current_stage || 'Alinhamento Inicial'}
                </span>
              </div>
              <span className="text-sm font-extrabold text-cyan-400">
                {progressVal}% concluído
              </span>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-full bg-slate-950/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm shadow-cyan-500/50"
                style={{ width: `${progressVal}%` }}
              />
            </div>

            {/* Mensagem em Destaque da Equipe */}
            {project?.headline_message && (
              <div className="mt-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-0.5">
                    Recado da Equipe NexaWeb
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {project.headline_message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Links de Visualização do Site (Staging e Produção) */}
          {(project?.staging_url || project?.production_url) && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap gap-3">
              {project.staging_url && (
                <a
                  href={project.staging_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-all shadow-sm"
                >
                  <span>Ambiente de Testes (Homologação)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {project.production_url && (
                <a
                  href={project.production_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-sm shadow-cyan-500/20"
                >
                  <span>Site Oficial no Ar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                </a>
              )}
            </div>
          )}
        </section>

        {/* Grade com Linha do Tempo e Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1 & 2: Linha do Tempo de Atualizações */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Linha do Tempo do Desenvolvimento
              </h2>
              <span className="text-xs text-slate-500">
                {updates.length} {updates.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {updates.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">Nenhuma atualização publicada ainda</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assim que nossa equipe avançar nas etapas do seu site, você verá os registros aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <h3 className="text-sm font-bold text-white">{upd.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {upd.stage && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {upd.stage}
                          </span>
                        )}
                        <span>{new Date(upd.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {upd.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Coluna 3: Solicitações e Revisões */}
          <div className="space-y-6">
            {/* Solicitações Cadastradas */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  Solicitações e Briefing
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setRequestError(null);
                    setIsNewRequestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Solicitação</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhuma solicitação aberta registrada no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{req.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-3 leading-relaxed">
                        {req.description}
                      </p>
                      {req.admin_reply && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-slate-300 bg-cyan-950/20 p-2 rounded-lg">
                          <span className="font-semibold text-cyan-400 block mb-0.5">Resposta NexaWeb:</span>
                          <span>{req.admin_reply}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Versões de Homologação e Revisões */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Revisões e Homologações
              </h2>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhuma versão enviada para homologação até o momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{rev.version_label}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          {rev.status}
                        </span>
                      </div>
                      {rev.test_url && (
                        <a
                          href={rev.test_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-[11px] pt-1"
                        >
                          <span>Acessar Versão de Teste</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Modal: Formulário de Nova Solicitação */}
      {isNewRequestModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-request-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (!isSubmittingRequest) {
              setIsNewRequestModalOpen(false);
              setRequestError(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 id="new-request-modal-title" className="text-base font-bold text-white">
                  Nova Solicitação
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingRequest) {
                    setIsNewRequestModalOpen(false);
                    setRequestError(null);
                  }
                }}
                disabled={isSubmittingRequest}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{requestError}</p>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="request-category-select" className="text-slate-300 font-semibold block">
                  Categoria
                </label>
                <select
                  id="request-category-select"
                  value={requestCategory}
                  onChange={(e) => setRequestCategory(e.target.value)}
                  disabled={isSubmittingRequest}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="Ajuste de Design">Ajuste de Design</option>
                  <option value="Troca de Conteúdo">Troca de Conteúdo</option>
                  <option value="Dúvida">Dúvida</option>
                  <option value="Correção">Correção</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="request-title-input" className="text-slate-300 font-semibold block">
                  Título da Solicitação
                </label>
                <input
                  id="request-title-input"
                  type="text"
                  maxLength={150}
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="Ex: Ajustar imagens ou texto do banner principal"
                  disabled={isSubmittingRequest}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="request-description-textarea" className="text-slate-300 font-semibold block">
                  Descrição
                </label>
                <textarea
                  id="request-description-textarea"
                  rows={4}
                  maxLength={3000}
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Descreva com detalhes o que precisa ser feito ou alterado..."
                  disabled={isSubmittingRequest}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400 transition-colors resize-none leading-relaxed disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRequestModalOpen(false);
                    setRequestError(null);
                  }}
                  disabled={isSubmittingRequest}
                  className="py-2.5 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRequest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Solicitação</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
