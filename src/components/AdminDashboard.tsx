import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  FileText,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Lock,
  LogOut,
  Eye,
  Sparkles,
  Award,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Building,
  Download,
  Upload,
  Plus,
  Trash2,
  MessageCircle,
  MessageSquare,
  Settings,
  Rocket,
  Image as ImageIcon,
  Edit,
  Save,
  X,
  Shield,
  Laptop,
  AlertCircle,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import {
  ALL_PROJECTS,
  TOTAL_PROJECTS_COUNT,
  PUBLISHED_PROJECTS_COUNT,
  CONCEPT_PROJECTS_COUNT,
  isProjectPublished,
  type ProjectItem,
} from '../data/projects';
import {
  getProjectOverrides,
  saveProjectOverride,
  removeProjectOverride,
  type ProjectOverride,
} from '../data/projectOverrides';
import { NEXAWEB_CONTACT } from '../config/contact';

// Status oficiais de briefing conforme especificação
export type BriefingStatus =
  | 'Novo'
  | 'Em análise'
  | 'Em andamento'
  | 'Concluído'
  | 'Cancelado';

export interface AdminBriefingItem {
  id: string;
  clientName: string;
  businessName: string;
  businessSegment: string;
  plan: 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium';
  date: string;
  status: BriefingStatus;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
  selectedFeatures?: string[];
  referenceModel?: string;
  estimatedPrice: string;
  filesCount: number;
}

export interface AdminClientRequestItem {
  id: string;
  projectId: string | null;
  projectName: string;
  clientName: string;
  clientBusinessName: string | null;
  clientEmail: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | 'Novo'
  | 'Planejamento'
  | 'Em desenvolvimento'
  | 'Em revisão'
  | 'Publicado'
  | 'Entregue';

export interface AdminProjectItem {
  id: string;
  clientName: string;
  projectName: string;
  plan: 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium';
  status: ProjectStatus;
  url?: string;
  notes?: string;
  date: string;
  stagingUrl?: string;
  progressPercent?: number;
  currentStage?: string;
  headlineMessage?: string;
  clientId?: string;
  clientBusinessName?: string;
  clientEmail?: string;
  clientPhone?: string;
  estimatedDeliveryDate?: string;
}

interface AdminDashboardProps {
  onBackToSite: () => void;
  onLogout?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'briefings'
  | 'requests'
  | 'clients'
  | 'projects'
  | 'demos'
  | 'published'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToSite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Briefings persistidos reais (inicia vazio se não houver dados reais no storage)
  const [briefings, setBriefings] = useState<AdminBriefingItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('nexaweb_admin_briefings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Projetos persistidos reais (inicia vazio se não houver dados reais no storage)
  const [projects, setProjects] = useState<AdminProjectItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('nexaweb_admin_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customizações de Demos / Amostras (URLs reais, imagens manuais e status)
  const [overrides, setOverrides] = useState<Record<string, ProjectOverride>>(() =>
    getProjectOverrides()
  );

  // Estados de Modais & Seleção
  const [selectedBriefing, setSelectedBriefing] = useState<AdminBriefingItem | null>(null);
  const [isNewBriefingModalOpen, setIsNewBriefingModalOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [editingDemo, setEditingDemo] = useState<ProjectItem | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estados do Gerenciamento da Área do Cliente
  const [portalProject, setPortalProject] = useState<AdminProjectItem | null>(null);
  const [portalCustomId, setPortalCustomId] = useState<string>('');
  const [portalAccessStatus, setPortalAccessStatus] = useState<any>(null);
  const [isLoadingAccessStatus, setIsLoadingAccessStatus] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [generatedRawToken, setGeneratedRawToken] = useState<string | null>(null);
  const [portalProgress, setPortalProgress] = useState<number>(0);
  const [portalStage, setPortalStage] = useState<string>('Briefing');
  const [portalHeadline, setPortalHeadline] = useState<string>('');
  const [portalStagingUrl, setPortalStagingUrl] = useState<string>('');
  const [portalProductionUrl, setPortalProductionUrl] = useState<string>('');
  const [portalStatus, setPortalStatus] = useState<string>('Planejamento');
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const PORTAL_STAGES = [
    'Briefing',
    'Análise',
    'Planejamento',
    'Desenvolvimento',
    'Revisão',
    'Publicação',
    'Entrega',
  ];

  // Filtros e Pesquisas
  const [briefingFilter, setBriefingFilter] = useState<string>('todos');
  const [briefingSearch, setBriefingSearch] = useState<string>('');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [demoSearch, setDemoSearch] = useState<string>('');
  const [demoTierFilter, setDemoTierFilter] = useState<string>('todos');
  const [demoStatusFilter, setDemoStatusFilter] = useState<'todos' | 'publicados' | 'conceito'>('todos');

  // Formulário de novo briefing manual
  const [newBriefingForm, setNewBriefingForm] = useState({
    clientName: '',
    businessName: '',
    businessSegment: '',
    plan: 'Essencial' as 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium',
    clientPhone: '',
    clientEmail: '',
    notes: '',
    estimatedPrice: 'R$ 1.000',
  });

  // Formulário de novo projeto manual
  const [newProjectForm, setNewProjectForm] = useState({
    clientName: '',
    projectName: '',
    plan: 'Essencial' as 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium',
    status: 'Planejamento' as ProjectStatus,
    url: '',
    notes: '',
  });

  // Formulário de edição de demonstração
  const [demoEditForm, setDemoEditForm] = useState<{
    manualImageUrl: string;
    customUrl: string;
    isPublished: boolean;
    notes: string;
  }>({
    manualImageUrl: '',
    customUrl: '',
    isPublished: false,
    notes: '',
  });

  // Sincronização entre abas e eventos do storage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const savedB = localStorage.getItem('nexaweb_admin_briefings');
        if (savedB) setBriefings(JSON.parse(savedB));

        const savedP = localStorage.getItem('nexaweb_admin_projects');
        if (savedP) setProjects(JSON.parse(savedP));

        setOverrides(getProjectOverrides());
      } catch (e) {
        console.warn('Sincronização de armazenamento:', e);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('nexaweb:overrides-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nexaweb:overrides-updated', handleStorage);
    };
  }, []);

  // Persistir Briefings
  const persistBriefings = (updated: AdminBriefingItem[]) => {
    setBriefings(updated);
    try {
      localStorage.setItem('nexaweb_admin_briefings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar briefings:', e);
    }
  };

  // Persistir Projetos
  const persistProjects = (updated: AdminProjectItem[]) => {
    setProjects(updated);
    try {
      localStorage.setItem('nexaweb_admin_projects', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar projetos:', e);
    }
  };

  // Carregar projetos reais do Supabase via /api/admin-projects
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);

  // Solicitações reais dos clientes via /api/admin-client-requests
  const [clientRequests, setClientRequests] = useState<AdminClientRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [requestSearch, setRequestSearch] = useState<string>('');
  const [requestCategoryFilter, setRequestCategoryFilter] = useState<string>('todos');

  const loadRemoteRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch('/api/admin-client-requests', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        console.error('[NexaWeb] Erro ao carregar solicitações:', {
          status: res.status,
          message: errorData?.error || errorData?.message || 'Erro desconhecido',
        });

        return;
      }

      const data = await res.json();
      if (data?.success && Array.isArray(data.requests)) {
        setClientRequests(data.requests);
      }
    } catch (e) {
      console.warn('Notice: erro ao carregar solicitações do cliente:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadRemoteProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch('/api/admin-projects', {
        method: 'GET',
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.projects)) {
          const remoteFormatted: AdminProjectItem[] = data.projects.map((rp: any) => ({
            id: rp.id, // UUID real do Supabase
            clientName: rp.clientName,
            projectName: rp.projectName,
            plan: rp.plan || 'Essencial',
            status: (rp.status || 'Planejamento') as ProjectStatus,
            url: rp.productionUrl || undefined,
            stagingUrl: rp.stagingUrl || undefined,
            date: rp.createdAt ? rp.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            progressPercent: rp.progressPercent,
            currentStage: rp.currentStage,
            headlineMessage: rp.headlineMessage,
            clientId: rp.clientId || undefined,
            clientBusinessName: rp.clientBusinessName || undefined,
            clientEmail: rp.clientEmail || undefined,
            clientPhone: rp.clientPhone || undefined,
            estimatedDeliveryDate: rp.estimatedDeliveryDate || undefined,
          }));

          // Preserva projetos manuais antigos salvos em localStorage que não estejam no Supabase
          const savedPStr = localStorage.getItem('nexaweb_admin_projects');
          let localList: AdminProjectItem[] = [];
          if (savedPStr) {
            try {
              localList = JSON.parse(savedPStr);
            } catch {
              localList = [];
            }
          }
          const remoteIds = new Set(remoteFormatted.map((p) => p.id));
          const localOnly = localList.filter((lp) => !remoteIds.has(lp.id));

          const merged = [...remoteFormatted, ...localOnly];
          setProjects(merged);
          try {
            localStorage.setItem('nexaweb_admin_projects', JSON.stringify(merged));
          } catch (e) {
            console.warn('Erro ao atualizar cache local de projetos:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Notice: carregamento de projetos via API em fallback local:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadRemoteProjects();
    loadRemoteRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'projects') {
      loadRemoteProjects();
    }
    if (activeTab === 'requests') {
      loadRemoteRequests();
    }
  }, [activeTab]);

  // Ações de Briefings
  const handleUpdateBriefingStatus = (id: string, newStatus: BriefingStatus) => {
    const updated = briefings.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
    persistBriefings(updated);
    if (selectedBriefing && selectedBriefing.id === id) {
      setSelectedBriefing({ ...selectedBriefing, status: newStatus });
    }
  };

  const handleDeleteBriefing = (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este briefing do painel?')) return;
    const updated = briefings.filter((b) => b.id !== id);
    persistBriefings(updated);
    if (selectedBriefing?.id === id) {
      setSelectedBriefing(null);
    }
  };

  const handleExportBriefings = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(briefings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `nexaweb-briefings-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCreateManualBriefing = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newId = `BRF-${now.getFullYear()}-${String(briefings.length + 1).padStart(3, '0')}`;

    const item: AdminBriefingItem = {
      id: newId,
      clientName: newBriefingForm.clientName.trim(),
      businessName: newBriefingForm.businessName.trim(),
      businessSegment: newBriefingForm.businessSegment.trim() || 'Geral',
      plan: newBriefingForm.plan,
      date: formattedDate,
      status: 'Novo',
      clientPhone: newBriefingForm.clientPhone.trim() || 'Não informado',
      clientEmail: newBriefingForm.clientEmail.trim() || 'Não informado',
      notes: newBriefingForm.notes.trim() || undefined,
      estimatedPrice: newBriefingForm.estimatedPrice,
      filesCount: 0,
    };

    persistBriefings([item, ...briefings]);
    setIsNewBriefingModalOpen(false);
    setNewBriefingForm({
      clientName: '',
      businessName: '',
      businessSegment: '',
      plan: 'Essencial',
      clientPhone: '',
      clientEmail: '',
      notes: '',
      estimatedPrice: 'R$ 1.000',
    });
  };

  // Ações de Projetos
  const handleUpdateProjectStatus = (id: string, newStatus: ProjectStatus) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    persistProjects(updated);
  };

  const handleDeleteProject = (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este projeto da esteira?')) return;
    const updated = projects.filter((p) => p.id !== id);
    persistProjects(updated);
  };

  const handleCreateManualProject = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const newId = `PRJ-${now.getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`;

    const item: AdminProjectItem = {
      id: newId,
      clientName: newProjectForm.clientName.trim(),
      projectName: newProjectForm.projectName.trim(),
      plan: newProjectForm.plan,
      status: newProjectForm.status,
      url: newProjectForm.url.trim() || undefined,
      notes: newProjectForm.notes.trim() || undefined,
      date: formattedDate,
    };

    persistProjects([item, ...projects]);
    setIsNewProjectModalOpen(false);
    setNewProjectForm({
      clientName: '',
      projectName: '',
      plan: 'Essencial',
      status: 'Planejamento',
      url: '',
      notes: '',
    });
  };

  // Funções da Área do Cliente (Portal)
  const fetchAccessStatus = async (projectId: string) => {
    if (!projectId?.trim()) return;
    setIsLoadingAccessStatus(true);
    try {
      const res = await fetch('/api/admin-client-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ projectId: projectId.trim(), action: 'status' }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setPortalAccessStatus(data.status);
      } else {
        setPortalAccessStatus(null);
      }
    } catch (err) {
      console.error('Erro ao consultar status de acesso:', err);
      setPortalAccessStatus(null);
    } finally {
      setIsLoadingAccessStatus(false);
    }
  };

  const handleOpenPortalModal = (project: AdminProjectItem) => {
    setPortalProject(project);
    setPortalCustomId(project.id);
    setGeneratedRawToken(null);
    setActionFeedback(null);
    setCopiedToken(false);
    setCopiedLink(false);

    setPortalProgress(project.progressPercent ?? 0);
    setPortalStage(project.currentStage || 'Briefing');
    setPortalHeadline(project.headlineMessage || '');
    setPortalStagingUrl(project.stagingUrl || '');
    setPortalProductionUrl(project.url || '');
    setPortalStatus(project.status);

    fetchAccessStatus(project.id);
  };

  const handleClosePortalModal = () => {
    setPortalProject(null);
    setGeneratedRawToken(null); // Limpa da memória imediatamente
    setPortalAccessStatus(null);
    setActionFeedback(null);
  };

  const handleAccessAction = async (action: 'generate' | 'regenerate' | 'revoke') => {
    if (!portalCustomId.trim()) {
      setActionFeedback({ type: 'error', message: 'ID do projeto é obrigatório.' });
      return;
    }

    if (action === 'revoke' && !window.confirm('Tem certeza de que deseja revogar o acesso do cliente a este projeto?')) {
      return;
    }

    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin-client-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ projectId: portalCustomId.trim(), action }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        if (action === 'revoke') {
          setGeneratedRawToken(null);
          setActionFeedback({ type: 'success', message: 'Acesso revogado com sucesso.' });
        } else {
          setGeneratedRawToken(data.token);
          setActionFeedback({
            type: 'success',
            message: action === 'generate' ? 'Nova chave de acesso gerada com sucesso!' : 'Acesso regenerado! A chave anterior foi invalidada.',
          });
        }
        await fetchAccessStatus(portalCustomId.trim());
      } else {
        setActionFeedback({ type: 'error', message: data?.error || 'Erro ao processar ação de acesso.' });
      }
    } catch {
      setActionFeedback({ type: 'error', message: 'Erro na conexão com o servidor.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveProjectManage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalCustomId.trim()) {
      setActionFeedback({ type: 'error', message: 'ID do projeto é obrigatório.' });
      return;
    }

    setIsSavingProject(true);
    setActionFeedback(null);

    try {
      const res = await fetch('/api/admin-project-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          projectId: portalCustomId.trim(),
          progressPercent: Number(portalProgress),
          currentStage: portalStage,
          headlineMessage: portalHeadline,
          stagingUrl: portalStagingUrl.trim() || null,
          productionUrl: portalProductionUrl.trim() || null,
          status: portalStatus,
          newUpdate: portalHeadline.trim()
            ? {
                title: `Atualização: ${portalStage}`,
                message: portalHeadline.trim(),
                stage: portalStage,
                progressSnapshot: Number(portalProgress),
                visibleToClient: true,
              }
            : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setActionFeedback({ type: 'success', message: 'Dados do projeto atualizados com sucesso no portal!' });

        if (portalProject) {
          const updated = projects.map((p) =>
            p.id === portalProject.id
              ? {
                  ...p,
                  status: portalStatus as ProjectStatus,
                  url: portalProductionUrl.trim() || undefined,
                  stagingUrl: portalStagingUrl.trim() || undefined,
                  progressPercent: Number(portalProgress),
                  currentStage: portalStage,
                  headlineMessage: portalHeadline,
                }
              : p
          );
          persistProjects(updated);
        }
      } else {
        setActionFeedback({ type: 'error', message: data?.error || 'Erro ao salvar alterações no projeto.' });
      }
    } catch {
      setActionFeedback({ type: 'error', message: 'Falha na conexão ao salvar projeto.' });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleCopyToken = () => {
    if (!generatedRawToken) return;
    navigator.clipboard.writeText(generatedRawToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleCopyLink = () => {
    if (!generatedRawToken) return;
    const fullLink = `${window.location.origin}/portal?token=${encodeURIComponent(generatedRawToken)}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Ações de Demos & Imagens
  const handleOpenDemoEditor = (project: ProjectItem) => {
    const currentOverride = overrides[project.id] || {};
    setEditingDemo(project);
    setUploadError(null);
    setDemoEditForm({
      manualImageUrl: currentOverride.manualImage || project.fallbackImage || '',
      customUrl: currentOverride.customUrl || project.url || '',
      isPublished:
        currentOverride.isPublished !== undefined
          ? currentOverride.isPublished
          : isProjectPublished(project),
      notes: currentOverride.notes || '',
    });
  };

  const handleSaveDemoOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDemo) return;

    saveProjectOverride(editingDemo.id, {
      manualImage: demoEditForm.manualImageUrl.trim() || undefined,
      customUrl: demoEditForm.customUrl.trim() || undefined,
      isPublished: demoEditForm.isPublished,
      notes: demoEditForm.notes.trim() || undefined,
    });

    setOverrides(getProjectOverrides());
    setEditingDemo(null);
  };

  /**
   * Upload de imagem utilizando a rota /api/upload-briefing existente no projeto
   * com fallback transparente para Data-URL caso a API esteja operando em modo offline.
   * 
   * NOTA DE ARQUITETURA (Requisito 9):
   * O upload manual é persistido localmente e através da rota /api/upload-briefing.
   * Para armazenamento corporativo permanente em produção com sincronização entre múltiplos
   * administradores em dispositivos remotos, deve ser configurado um bucket de cloud storage
   * (ex: AWS S3, Cloudflare R2 ou Firebase Storage).
   */
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-briefing', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.url) {
          setDemoEditForm((prev) => ({ ...prev, manualImageUrl: data.url }));
          setIsUploadingImage(false);
          return;
        }
      }

      // Fallback para Data-URL em caso de ausência de backend de storage dedicado
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setDemoEditForm((prev) => ({ ...prev, manualImageUrl: dataUrl }));
        }
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setUploadError('Erro ao carregar o arquivo localmente.');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      // Leitura em buffer local se a chamada de rede falhar
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setDemoEditForm((prev) => ({ ...prev, manualImageUrl: dataUrl }));
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDemoOverride = (projectId: string) => {
    if (!window.confirm('Restaurar imagem e dados originais desta demonstração?')) return;
    removeProjectOverride(projectId);
    setOverrides(getProjectOverrides());
    setEditingDemo(null);
  };

  // Briefings filtrados
  const filteredBriefings = useMemo(() => {
    return briefings.filter((b) => {
      if (briefingFilter !== 'todos' && b.status !== briefingFilter) return false;
      if (!briefingSearch.trim()) return true;
      const q = briefingSearch.toLowerCase();
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.businessName.toLowerCase().includes(q) ||
        b.businessSegment.toLowerCase().includes(q) ||
        b.clientPhone.includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [briefings, briefingFilter, briefingSearch]);

  // Solicitações filtradas dos clientes
  const filteredClientRequests = useMemo(() => {
    return clientRequests.filter((r) => {
      if (requestCategoryFilter !== 'todos' && r.category !== requestCategoryFilter) return false;
      if (!requestSearch.trim()) return true;
      const q = requestSearch.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        (r.clientBusinessName && r.clientBusinessName.toLowerCase().includes(q))
      );
    });
  }, [clientRequests, requestCategoryFilter, requestSearch]);

  // Clientes reais consolidados dos briefings e projetos (SEM DADOS INVENTADOS)
  const derivedClients = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        contactPhone: string;
        contactEmail: string;
        businessName: string;
        projectsCount: number;
        firstDate: string;
        status: string;
      }
    >();

    briefings.forEach((b) => {
      const key = b.clientName.trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          name: b.clientName,
          contactPhone: b.clientPhone,
          contactEmail: b.clientEmail,
          businessName: b.businessName,
          projectsCount: 1,
          firstDate: b.date,
          status: b.status === 'Concluído' ? 'Ativo' : 'Em atendimento',
        });
      } else {
        const item = map.get(key)!;
        item.projectsCount += 1;
        if (b.status === 'Concluído') item.status = 'Ativo';
      }
    });

    projects.forEach((p) => {
      const key = p.clientName.trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          name: p.clientName,
          contactPhone: 'Cadastrado no projeto',
          contactEmail: 'Ver briefing',
          businessName: p.projectName,
          projectsCount: 1,
          firstDate: p.date,
          status: p.status === 'Publicado' || p.status === 'Entregue' ? 'Ativo' : 'Em produção',
        });
      }
    });

    return Array.from(map.values()).filter((c) => {
      if (!clientSearch.trim()) return true;
      const q = clientSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        c.contactPhone.includes(q) ||
        c.contactEmail.toLowerCase().includes(q)
      );
    });
  }, [briefings, projects, clientSearch]);

  // Projetos filtrados
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!projectSearch.trim()) return true;
      const q = projectSearch.toLowerCase();
      return (
        p.clientName.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.plan.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    });
  }, [projects, projectSearch]);

  // Demos filtradas
  const filteredDemos = useMemo(() => {
    return ALL_PROJECTS.filter((p) => {
      const override = overrides[p.id];
      const effectiveUrl = override?.customUrl || p.url;
      const published =
        override?.isPublished !== undefined
          ? override.isPublished
          : Boolean(effectiveUrl && effectiveUrl.startsWith('http'));

      const matchesSearch =
        p.name.toLowerCase().includes(demoSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(demoSearch.toLowerCase()) ||
        p.tier.toLowerCase().includes(demoSearch.toLowerCase());

      if (!matchesSearch) return false;
      if (demoTierFilter !== 'todos' && p.tier !== demoTierFilter) return false;
      if (demoStatusFilter === 'publicados' && !published) return false;
      if (demoStatusFilter === 'conceito' && published) return false;
      return true;
    });
  }, [demoSearch, demoTierFilter, demoStatusFilter, overrides]);

  // Demonstrações reais no ar
  const publishedSites = useMemo(() => {
    return ALL_PROJECTS.map((p) => {
      const override = overrides[p.id];
      const effectiveUrl = override?.customUrl || p.url;
      const isLive = Boolean(effectiveUrl && effectiveUrl !== '#' && effectiveUrl.startsWith('http'));
      return {
        ...p,
        effectiveUrl,
        isLive,
      };
    }).filter((p) => p.isLive);
  }, [overrides]);

  const statusColor = (st: BriefingStatus) => {
    switch (st) {
      case 'Novo':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Em análise':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Em andamento':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Concluído':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Cancelado':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
    }
  };

  const projectStatusColor = (st: ProjectStatus) => {
    switch (st) {
      case 'Novo':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Planejamento':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Em desenvolvimento':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Em revisão':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Publicado':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Entregue':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col font-sans">
      {/* Cabeçalho do Painel Administrativo */}
      <header className="shrink-0 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToSite}
              className="p-2 min-h-[40px] min-w-[40px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors flex items-center justify-center shrink-0"
              title="Voltar ao site público"
              aria-label="Voltar ao site público"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-neutral-950 text-sm shrink-0">
                N
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base truncate">NexaWeb</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                    ADMIN
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 hidden sm:block truncate">
                  Gestão Operacional da NexaWeb
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToSite}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            >
              Ver Site Público
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-500/10 text-xs font-semibold text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-500/30 transition-colors inline-flex items-center gap-1.5"
                title="Sair do painel administrativo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Espaço de Trabalho do Admin */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Navegação entre Módulos (Menu Interno do Admin) */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-800 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: '📊' },
            { id: 'briefings' as AdminTab, label: `Briefings (${briefings.length})`, icon: '📋' },
            { id: 'requests' as AdminTab, label: `Solicitações (${clientRequests.length})`, icon: '💬' },
            { id: 'clients' as AdminTab, label: `Clientes (${derivedClients.length})`, icon: '👥' },
            { id: 'projects' as AdminTab, label: `Projetos (${projects.length})`, icon: '🌐' },
            { id: 'demos' as AdminTab, label: `Demos / Amostras (${TOTAL_PROJECTS_COUNT})`, icon: '🖼️' },
            { id: 'published' as AdminTab, label: `Sites publicados (${publishedSites.length})`, icon: '🚀' },
            { id: 'settings' as AdminTab, label: 'Configurações', icon: '⚙️' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700 font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. TAB: DASHBOARD
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Cards com Dados Reais Existentes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Briefings Registrados</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {briefings.length}
                </div>
                <span className="text-[11px] text-blue-400 block font-medium">
                  {briefings.filter((b) => b.status === 'Novo').length} novos para triagem
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Solicitações de Clientes</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-cyan-400">
                  {clientRequests.length}
                </div>
                <span className="text-[11px] text-cyan-300 block font-medium">
                  {clientRequests.filter((r) => r.status === 'Novo').length} novas em aberto
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Projetos em Produção</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-purple-400">
                  {projects.length}
                </div>
                <span className="text-[11px] text-neutral-500 block">Linha de desenvolvimento</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Clientes Consolidados</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">
                  {derivedClients.length}
                </div>
                <span className="text-[11px] text-neutral-500 block">Derivados dos registros</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Demonstrações</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {TOTAL_PROJECTS_COUNT}
                </div>
                <span className="text-[11px] text-neutral-500 block">Catálogo cadastrado</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Sites Publicados no Ar</span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">
                  {publishedSites.length}
                </div>
                <span className="text-[11px] text-neutral-500 block">Demonstrações ao vivo</span>
              </div>
            </div>

            {/* Atividades e Listagens Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Briefings Recentes */}
              <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-display">
                      Briefings Recentes
                    </h3>
                    <p className="text-xs text-neutral-400">Entradas via formulário da NexaWeb</p>
                  </div>
                  {briefings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('briefings')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Ver todos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {briefings.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-300">
                      Nenhum briefing registrado ainda.
                    </p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Quando um cliente enviar o formulário comercial do site, o registro aparecerá aqui automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/80">
                    {briefings.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBriefing(b);
                          setActiveTab('briefings');
                        }}
                        className="p-3.5 sm:p-4 hover:bg-neutral-800/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-mono text-neutral-500">{b.id}</span>
                            <span className="text-sm font-semibold text-white truncate">{b.clientName}</span>
                            <span className="text-xs text-neutral-400 truncate">· {b.businessName}</span>
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            {b.businessSegment} · Plano {b.plan} · {b.date}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projetos Recentes */}
              <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-display">
                      Projetos em Andamento
                    </h3>
                    <p className="text-xs text-neutral-400">Linha de desenvolvimento</p>
                  </div>
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Ver todos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Laptop className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-300">
                      Nenhum projeto em andamento.
                    </p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Projetos aprovados podem ser cadastrados na aba &quot;Projetos&quot; para controle da esteira operacional.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/80">
                    {projects.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 sm:p-4 hover:bg-neutral-800/40 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-mono text-neutral-500">{p.id}</span>
                            <span className="text-sm font-semibold text-white truncate">{p.projectName}</span>
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            Cliente: {p.clientName} · Plano {p.plan}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${projectStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. TAB: BRIEFINGS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'briefings' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Barra de Ações e Filtros */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={briefingSearch}
                    onChange={(e) => setBriefingSearch(e.target.value)}
                    placeholder="Buscar por cliente, empresa ou telefone..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {briefings.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportBriefings}
                      className="min-h-[40px] px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      title="Exportar todos os briefings em formato JSON"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Exportar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsNewBriefingModalOpen(true)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/15"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Briefing</span>
                  </button>
                </div>
              </div>

              {/* Filtros por Status */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {(['todos', 'Novo', 'Em análise', 'Em andamento', 'Concluído', 'Cancelado'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setBriefingFilter(st)}
                        className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                          briefingFilter === st
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
                <span className="text-xs text-neutral-500">
                  {filteredBriefings.length} briefing(s)
                </span>
              </div>
            </div>

            {/* Listagem Responsiva (Mobile Cards + Desktop View) */}
            <div className="space-y-3">
              {filteredBriefings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                  <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">Nenhum briefing registrado ainda.</p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Os briefings submetidos através do formulário oficial do site (integrado ao Forminit) aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                filteredBriefings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-amber-400">{item.id}</span>
                        <h4 className="text-base font-bold text-white truncate">{item.clientName}</h4>
                        <span className="text-xs text-neutral-400">({item.businessName})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-400">
                        <span className="text-neutral-300 font-medium">Segmento: {item.businessSegment}</span>
                        <span>·</span>
                        <span className="text-amber-300 font-medium">Plano {item.plan}</span>
                        {item.referenceModel && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">Ref: {item.referenceModel}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="text-neutral-500">{item.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateBriefingStatus(item.id, e.target.value as BriefingStatus)}
                        className="min-h-[38px] px-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-200 outline-none focus:border-amber-400"
                        aria-label="Alterar status do briefing"
                      >
                        <option value="Novo">Novo</option>
                        <option value="Em análise">Em análise</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setSelectedBriefing(item)}
                        className="min-h-[38px] px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBriefing(item.id)}
                        className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-950 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 border border-neutral-800 flex items-center justify-center transition-colors"
                        title="Excluir briefing"
                        aria-label="Excluir briefing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB: SOLICITAÇÕES DOS CLIENTES (client_requests)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'requests' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Barra de Ações e Filtros */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    placeholder="Buscar por projeto, cliente, título ou descrição..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRemoteRequests}
                    disabled={isLoadingRequests}
                    className="min-h-[40px] px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>

              {/* Filtros por Categoria */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {(['todos', 'Ajuste de Design', 'Troca de Conteúdo', 'Dúvida', 'Correção', 'Outro', 'Briefing'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setRequestCategoryFilter(cat)}
                        className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          requestCategoryFilter === cat
                            ? 'bg-cyan-500 text-neutral-950 font-bold'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
                <span className="text-xs text-neutral-500">
                  {filteredClientRequests.length} solicitação(ões)
                </span>
              </div>
            </div>

            {/* Listagem Responsiva de Solicitações */}
            <div className="space-y-3">
              {isLoadingRequests && clientRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">Carregando solicitações...</p>
                </div>
              ) : filteredClientRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                  <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">Nenhuma solicitação encontrada.</p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    As solicitações criadas pelos clientes através da Área do Cliente aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                filteredClientRequests.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{item.projectName}</span>
                          <span className="text-neutral-600 text-xs">•</span>
                          <span className="text-xs text-neutral-400 font-medium">
                            {item.clientName}
                            {item.clientBusinessName ? ` (${item.clientBusinessName})` : ''}
                          </span>
                        </div>
                        {item.clientEmail && (
                          <span className="text-[11px] text-neutral-500 font-mono block">
                            {item.clientEmail}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                          Prioridade: {item.priority}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          {item.status}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono pl-1">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : 'Data não disponível'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <h4 className="text-sm font-semibold text-neutral-200">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {item.adminReply && (
                      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 space-y-1">
                        <span className="font-semibold text-cyan-400 block text-[11px]">
                          Resposta NexaWeb ({item.repliedAt ? new Date(item.repliedAt).toLocaleString('pt-BR') : 'Enviada'}):
                        </span>
                        <p className="leading-relaxed">{item.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. TAB: CLIENTES
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'clients' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar por cliente, empresa ou telefone..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                />
              </div>

              <span className="text-xs text-neutral-500">
                {derivedClients.length} cliente(s) real(is) consolidado(s)
              </span>
            </div>

            {derivedClients.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-neutral-300">Nenhum cliente registrado ainda.</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Os clientes são consolidados automaticamente a partir dos briefings recebidos ou cadastrados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mobile Cards View */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {derivedClients.map((client, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{client.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {client.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300">{client.businessName}</div>
                      <div className="text-xs text-neutral-400 font-mono space-y-0.5">
                        <div>{client.contactPhone}</div>
                        <div>{client.contactEmail}</div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-500">
                        <span>{client.projectsCount} registro(s)</span>
                        <span>{client.firstDate}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-neutral-950/80 text-[11px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="p-3.5 pl-5">Nome do Cliente</th>
                          <th className="p-3.5">Empresa / Negócio</th>
                          <th className="p-3.5">Contato</th>
                          <th className="p-3.5">Registros</th>
                          <th className="p-3.5">Data de Entrada</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {derivedClients.map((client, idx) => (
                          <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-3.5 pl-5 font-semibold text-white">{client.name}</td>
                            <td className="p-3.5 text-neutral-300">{client.businessName}</td>
                            <td className="p-3.5 font-mono text-neutral-400">
                              <div>{client.contactPhone}</div>
                              <div className="text-[11px] text-neutral-500">{client.contactEmail}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                                {client.projectsCount} registro(s)
                              </span>
                            </td>
                            <td className="p-3.5 text-neutral-500">{client.firstDate}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                {client.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. TAB: PROJETOS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'projects' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Buscar projeto por cliente ou nome..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadRemoteProjects}
                  disabled={isLoadingProjects}
                  className="min-h-[40px] px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Sincronizar projetos do banco de dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProjects ? 'animate-spin text-cyan-400' : ''}`} />
                  <span className="hidden sm:inline">Sincronizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="min-h-[40px] px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Projeto</span>
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                <Laptop className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm font-semibold text-neutral-300">Nenhum projeto cadastrado ainda.</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Clique em &quot;Novo Projeto&quot; para cadastrar um projeto aprovado na linha de desenvolvimento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mobile Cards View */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {filteredProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{p.projectName}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{p.id}</span>
                      </div>
                      <div className="text-xs text-neutral-300">Cliente: {p.clientName}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                          Plano {p.plan}
                        </span>
                        <select
                          value={p.status}
                          onChange={(e) => handleUpdateProjectStatus(p.id, e.target.value as ProjectStatus)}
                          className={`h-8 px-2 rounded-lg text-xs font-semibold outline-none border ${projectStatusColor(p.status)} bg-neutral-950`}
                          aria-label="Alterar status do projeto"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Planejamento">Planejamento</option>
                          <option value="Em desenvolvimento">Em desenvolvimento</option>
                          <option value="Em revisão">Em revisão</option>
                          <option value="Publicado">Publicado</option>
                          <option value="Entregue">Entregue</option>
                        </select>
                      </div>
                      {p.url && (
                        <div className="text-[11px] font-mono text-blue-400 truncate">
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {p.url}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-500">
                        <span>Data: {p.date}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPortalModal(p)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-400 hover:text-cyan-300 border border-cyan-800/80 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Key className="w-3 h-3" />
                            <span>Área do Cliente</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-neutral-950/80 text-[11px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="p-3.5 pl-5">Projeto</th>
                          <th className="p-3.5">Cliente</th>
                          <th className="p-3.5">Plano</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">URL de Produção</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5 pr-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {filteredProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-3.5 pl-5 font-semibold text-white">
                              <div>{p.projectName}</div>
                              <div className="text-[10px] font-mono text-neutral-500">{p.id}</div>
                            </td>
                            <td className="p-3.5 text-neutral-300">{p.clientName}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                                {p.plan}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={p.status}
                                onChange={(e) => handleUpdateProjectStatus(p.id, e.target.value as ProjectStatus)}
                                className={`h-8 px-2 rounded-lg text-xs font-semibold outline-none border ${projectStatusColor(p.status)} bg-neutral-950`}
                                aria-label="Alterar status do projeto"
                              >
                                <option value="Novo">Novo</option>
                                <option value="Planejamento">Planejamento</option>
                                <option value="Em desenvolvimento">Em desenvolvimento</option>
                                <option value="Em revisão">Em revisão</option>
                                <option value="Publicado">Publicado</option>
                                <option value="Entregue">Entregue</option>
                              </select>
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {p.url ? (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                >
                                  <span className="truncate max-w-[180px]">{p.url}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-neutral-500 italic">Em desenvolvimento</span>
                              )}
                            </td>
                            <td className="p-3.5 text-neutral-500">{p.date}</td>
                            <td className="p-3.5 pr-5 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPortalModal(p)}
                                  className="h-8 px-2.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 hover:text-cyan-200 border border-cyan-800/70 inline-flex items-center gap-1.5 transition-colors font-medium text-[11px]"
                                  title="Gerenciar Área do Cliente"
                                >
                                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Área do Cliente</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="h-8 w-8 rounded-lg bg-neutral-950 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 border border-neutral-800 inline-flex items-center justify-center transition-colors"
                                  title="Remover projeto"
                                  aria-label="Remover projeto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. TAB: DEMOS / AMOSTRAS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'demos' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header info com documentação da ordem de prioridade de imagem */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-bold font-display text-white">
                  Gerenciamento de Demonstrações & Imagens ({TOTAL_PROJECTS_COUNT} Demos)
                </h3>
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  Prioridade: 1. Manual do Admin · 2. Captura Automática · 3. Fallback
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Cada demonstração possui 3 níveis de resolução de imagem. Se houver imagem manual definida pelo Admin, ela é exibida como prioridade máxima. Se não houver, o sistema busca a captura automática em tempo real. Se ambas falharem, o fallback visual elegante é mantido sem quebrar a interface.
              </p>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={demoSearch}
                    onChange={(e) => setDemoSearch(e.target.value)}
                    placeholder="Buscar demo..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDemoStatusFilter('todos')}
                    className={`min-h-[34px] px-2.5 rounded-lg ${demoStatusFilter === 'todos' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'}`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoStatusFilter('publicados')}
                    className={`min-h-[34px] px-2.5 rounded-lg ${demoStatusFilter === 'publicados' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400'}`}
                  >
                    No Ar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoStatusFilter('conceito')}
                    className={`min-h-[34px] px-2.5 rounded-lg ${demoStatusFilter === 'conceito' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400'}`}
                  >
                    Homologação
                  </button>
                </div>

                <select
                  value={demoTierFilter}
                  onChange={(e) => setDemoTierFilter(e.target.value)}
                  className="h-10 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 outline-none"
                  aria-label="Filtrar por plano"
                >
                  <option value="todos">Todos os Planos</option>
                  <option value="Essencial">Essencial</option>
                  <option value="Profissional">Profissional</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <span className="text-xs text-neutral-500">
                {filteredDemos.length} de {TOTAL_PROJECTS_COUNT} demonstrações
              </span>
            </div>

            {/* Tabela de Demonstrações (Mobile Cards + Desktop Table) */}
            <div className="space-y-3">
              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {filteredDemos.map((project) => {
                  const override = overrides[project.id];
                  const effectiveUrl = override?.customUrl || project.url;
                  const hasManualImage = Boolean(override?.manualImage);
                  const isLive = Boolean(effectiveUrl && effectiveUrl !== '#' && effectiveUrl.startsWith('http'));

                  return (
                    <div key={project.id} className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{project.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            project.tier === 'Premium'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : project.tier === 'Profissional'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {project.tier}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400">{project.category}</div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {hasManualImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <ImageIcon className="w-3 h-3" />
                            Imagem Manual (Prioridade 1)
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-3 h-3" />
                            Captura Automática (Prioridade 2)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                            Fallback Visual (Prioridade 3)
                          </span>
                        )}
                      </div>
                      {effectiveUrl && isLive && (
                        <div className="text-[11px] font-mono text-blue-400 truncate">
                          <a href={effectiveUrl} target="_blank" rel="noopener noreferrer">
                            {effectiveUrl}
                          </a>
                        </div>
                      )}
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenDemoEditor(project)}
                          className="min-h-[38px] px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gerenciar Imagem & Dados</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-950/80 text-[11px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800">
                      <tr>
                        <th className="p-3.5 pl-5">Demonstração</th>
                        <th className="p-3.5">Plano</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Resolução de Imagem</th>
                        <th className="p-3.5">URL Cadastrada</th>
                        <th className="p-3.5">Publicação</th>
                        <th className="p-3.5 pr-5 text-right">Administrar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {filteredDemos.map((project, idx) => {
                        const override = overrides[project.id];
                        const effectiveUrl = override?.customUrl || project.url;
                        const hasManualImage = Boolean(override?.manualImage);
                        const isLive = Boolean(effectiveUrl && effectiveUrl !== '#' && effectiveUrl.startsWith('http'));

                        return (
                          <tr key={project.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{project.name}</span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  #{String(idx + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-500 truncate max-w-[200px]">
                                {project.tagline}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  project.tier === 'Premium'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : project.tier === 'Profissional'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {project.tier}
                              </span>
                            </td>
                            <td className="p-3.5 text-neutral-400">{project.category}</td>
                            <td className="p-3.5">
                              {hasManualImage ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <ImageIcon className="w-3 h-3" />
                                  1. Manual (Admin)
                                </span>
                              ) : isLive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <Sparkles className="w-3 h-3" />
                                  2. Captura Auto
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                  3. Fallback Visual
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {isLive ? (
                                <a
                                  href={effectiveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                >
                                  <span className="truncate max-w-[180px]">{effectiveUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-neutral-500 italic">Sem URL (Conceito)</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {isLive ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Publicada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Em Homologação
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 pr-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenDemoEditor(project)}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors"
                              >
                                <Edit className="w-3 h-3 text-amber-400" />
                                <span>Gerenciar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. TAB: SITES PUBLICADOS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'published' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm sm:text-base font-bold font-display text-white">
                  Sites Publicados no Ar ({publishedSites.length} Demonstrações Ativas)
                </h3>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  100% no ar e navegáveis
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Todas as demonstrações reais com URL de produção ativa na internet (incluindo os 3 projetos Profissional: NOVA ARQ, LUMIÈRE e VERTEX DIGITAL). O botão &quot;Ver site no ar&quot; abre a URL real em nova aba sem simulação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedSites.map((site) => (
                <div
                  key={site.id}
                  className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          site.tier === 'Premium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : site.tier === 'Profissional'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {site.tier}
                      </span>
                      <span className="text-[10px] text-neutral-400">{site.category}</span>
                    </div>

                    <h4 className="text-base font-bold text-white font-display">{site.name}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2">{site.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <div className="text-[11px] font-mono text-neutral-400 truncate">
                      {site.effectiveUrl}
                    </div>

                    <a
                      href={site.effectiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[40px] py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Ver site no ar</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. TAB: CONFIGURAÇÕES
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'settings' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Informações da Agência */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Settings className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  Configurações Operacionais da NexaWeb
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Agência</span>
                  <div className="text-sm font-bold text-white">NexaWeb Desenvolvimento</div>
                  <span className="text-xs text-neutral-400">Sites Essencial, Profissional & Premium</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Contato Oficial</span>
                  <div className="text-sm font-bold text-white">{NEXAWEB_CONTACT.commercialEmail}</div>
                  <span className="text-xs text-neutral-400">{NEXAWEB_CONTACT.operatingHours}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Instagram Oficial</span>
                  <div className="text-sm font-bold text-white">@nexaw1</div>
                  <a
                    href="https://www.instagram.com/nexaw1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-pink-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>instagram.com/nexaw1/</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Armazenamento & Transparência Técnica */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
              <h4 className="text-sm sm:text-base font-bold font-display text-white">
                Armazenamento de Dados & Backup
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Os briefings enviados pelo Forminit, projetos cadastrados e customizações de demonstrações são persistidos no navegador.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-xs text-neutral-400 block">Briefings Salvos</span>
                  <span className="text-lg font-bold text-white">{briefings.length} registros</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-xs text-neutral-400 block">Projetos em Produção</span>
                  <span className="text-lg font-bold text-white">{projects.length} registros</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-xs text-neutral-400 block">Customizações de Demos</span>
                  <span className="text-lg font-bold text-white">
                    {Object.keys(overrides).length} customizações
                  </span>
                </div>
              </div>

              {briefings.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportBriefings}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Backup dos Briefings (JSON)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Requisitos 14 e 15: Transparência de Segurança */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Shield className="w-4 h-4" />
                <h4 className="text-sm sm:text-base font-bold font-display text-white">
                  Aviso de Arquitetura & Segurança da Rota /admin
                </h4>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Este painel interno foi estruturado exclusivamente para administração operacional da NexaWeb.
                Em conformidade com os requisitos de segurança:
              </p>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-5 leading-relaxed">
                <li>Nenhuma senha, token ou chave sensível está exposta no bundle frontend.</li>
                <li>Não há simulação de autenticação fake nem telas de login fictícias.</li>
                <li>
                  Para publicação em produção aberta a múltiplos colaboradores remotos, o acesso à rota{' '}
                  <code className="text-amber-300">/admin</code> deve ser restrito através de autenticação server-side real (OAuth2 com Google Workspace, Firebase Auth ou proxy reverso seguro).
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL: VISUALIZAR BRIEFING DETALHADO
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="min-w-0 pr-3">
                <span className="text-xs font-mono font-bold text-amber-400">{selectedBriefing.id}</span>
                <h3 className="text-base sm:text-lg font-bold font-display text-white truncate">
                  {selectedBriefing.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBriefing(null)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center shrink-0"
                aria-label="Fechar detalhes"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">EMPRESA / PROJETO</span>
                  <span className="font-semibold text-white">{selectedBriefing.businessName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">SEGMENTO</span>
                  <span className="font-semibold text-white">{selectedBriefing.businessSegment}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">PLANO ESCOLHIDO</span>
                  <span className="font-semibold text-amber-300">Plano {selectedBriefing.plan}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">VALOR ESTIMADO</span>
                  <span className="font-semibold text-white">{selectedBriefing.estimatedPrice}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-neutral-500 block text-[10px]">CONTATOS DO CLIENTE</span>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-white">{selectedBriefing.clientPhone}</span>
                  {selectedBriefing.clientPhone && selectedBriefing.clientPhone !== 'Não informado' && (
                    <a
                      href={`https://wa.me/55${selectedBriefing.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${selectedBriefing.clientName}, tudo bem? Aqui é da equipe NexaWeb referente ao seu briefing para a ${selectedBriefing.businessName}!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
                  <span className="font-mono text-neutral-300 truncate">{selectedBriefing.clientEmail}</span>
                  {selectedBriefing.clientEmail && selectedBriefing.clientEmail !== 'Não informado' && (
                    <a
                      href={`mailto:${selectedBriefing.clientEmail}?subject=${encodeURIComponent(
                        `NexaWeb - Proposta de Site para ${selectedBriefing.businessName}`
                      )}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>E-mail</span>
                    </a>
                  )}
                </div>
              </div>

              {selectedBriefing.referenceModel && (
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">REFERÊNCIA ESCOLHIDA</span>
                  <span className="font-semibold text-white">{selectedBriefing.referenceModel}</span>
                </div>
              )}

              {selectedBriefing.notes && (
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-neutral-500 block text-[10px]">DESCRIÇÃO / OBSERVAÇÕES</span>
                  <p className="text-neutral-300 italic">{selectedBriefing.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <span className="text-neutral-400 font-semibold">Alterar Status:</span>
                <select
                  value={selectedBriefing.status}
                  onChange={(e) => handleUpdateBriefingStatus(selectedBriefing.id, e.target.value as BriefingStatus)}
                  className="min-h-[38px] px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white outline-none focus:border-amber-400"
                  aria-label="Status do briefing"
                >
                  <option value="Novo">Novo</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => handleDeleteBriefing(selectedBriefing.id)}
                className="min-h-[40px] px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBriefing(null)}
                className="min-h-[40px] px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL: CADASTRAR NOVO BRIEFING
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isNewBriefingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  Cadastrar Novo Briefing
                </h3>
                <p className="text-xs text-neutral-400">
                  Adicione solicitações recebidas por WhatsApp ou reuniões
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBriefingModalOpen(false)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center shrink-0"
                aria-label="Fechar cadastro de briefing"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBriefing} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newBriefingForm.clientName}
                    onChange={(e) => setNewBriefingForm({ ...newBriefingForm, clientName: e.target.value })}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Empresa / Negócio *</label>
                  <input
                    type="text"
                    required
                    value={newBriefingForm.businessName}
                    onChange={(e) => setNewBriefingForm({ ...newBriefingForm, businessName: e.target.value })}
                    placeholder="Ex: Mendes Consultoria"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Segmento</label>
                  <input
                    type="text"
                    value={newBriefingForm.businessSegment}
                    onChange={(e) => setNewBriefingForm({ ...newBriefingForm, businessSegment: e.target.value })}
                    placeholder="Ex: Consultoria / Saúde"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Plano</label>
                  <select
                    value={newBriefingForm.plan}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      const price =
                        p === 'Essencial'
                          ? 'R$ 1.000'
                          : p === 'Profissional'
                          ? 'R$ 1.700'
                          : p === 'Personalizado'
                          ? 'A partir de R$ 2.800'
                          : 'A partir de R$ 4.500';
                      setNewBriefingForm({ ...newBriefingForm, plan: p, estimatedPrice: price });
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400"
                    aria-label="Selecionar plano"
                  >
                    <option value="Essencial">Essencial (R$ 1.000)</option>
                    <option value="Profissional">Profissional (R$ 1.700)</option>
                    <option value="Personalizado">Personalizado (A partir de R$ 2.800)</option>
                    <option value="Premium">Premium (A partir de R$ 4.500)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={newBriefingForm.clientPhone}
                    onChange={(e) => setNewBriefingForm({ ...newBriefingForm, clientPhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">E-mail</label>
                  <input
                    type="email"
                    value={newBriefingForm.clientEmail}
                    onChange={(e) => setNewBriefingForm({ ...newBriefingForm, clientEmail: e.target.value })}
                    placeholder="cliente@empresa.com.br"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Descrição / Observações</label>
                <textarea
                  rows={3}
                  value={newBriefingForm.notes}
                  onChange={(e) => setNewBriefingForm({ ...newBriefingForm, notes: e.target.value })}
                  placeholder="Detalhes específicos para este briefing..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBriefingModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20"
                >
                  Salvar Briefing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL: CADASTRAR NOVO PROJETO
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  Cadastrar Novo Projeto
                </h3>
                <p className="text-xs text-neutral-400">
                  Adicione um projeto aprovado à esteira operacional
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center shrink-0"
                aria-label="Fechar cadastro de projeto"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualProject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.clientName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, clientName: e.target.value })}
                    placeholder="Ex: Dr. Roberto Guimarães"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Nome do Projeto *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.projectName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, projectName: e.target.value })}
                    placeholder="Ex: Portal Guimarães Web"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Plano Contratado</label>
                  <select
                    value={newProjectForm.plan}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, plan: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400"
                    aria-label="Plano do projeto"
                  >
                    <option value="Essencial">Essencial (R$ 1.000)</option>
                    <option value="Profissional">Profissional (R$ 1.700)</option>
                    <option value="Personalizado">Personalizado (A partir de R$ 2.800)</option>
                    <option value="Premium">Premium (A partir de R$ 4.500)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Status Inicial</label>
                  <select
                    value={newProjectForm.status}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, status: e.target.value as ProjectStatus })}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400"
                    aria-label="Status do projeto"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em desenvolvimento">Em desenvolvimento</option>
                    <option value="Em revisão">Em revisão</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">URL de Produção / Prévia (opcional)</label>
                <input
                  type="url"
                  value={newProjectForm.url}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, url: e.target.value })}
                  placeholder="https://exemplo.vercel.app"
                  className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Observações do Projeto</label>
                <textarea
                  rows={2}
                  value={newProjectForm.notes}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, notes: e.target.value })}
                  placeholder="Escopo, prazos, observações..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL: GERENCIAMENTO DA ÁREA DO CLIENTE
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {portalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl text-neutral-200 max-h-[92vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>Área do Cliente & Acompanhamento</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  {portalProject.projectName}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cliente: <span className="text-white font-medium">{portalProject.clientName}</span> · Plano {portalProject.plan}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePortalModal}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                aria-label="Fechar gerenciamento da área do cliente"
              >
                ✕
              </button>
            </div>

            {/* Feedback de Ação */}
            {actionFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-red-950/40 border-red-800/60 text-red-200'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
            )}

            {/* SEÇÃO 1: SEGURANÇA E CHAVE DE ACESSO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Controle de Acesso do Cliente
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">ID no Banco:</span>
                  <input
                    type="text"
                    value={portalCustomId}
                    onChange={(e) => setPortalCustomId(e.target.value)}
                    placeholder="UUID ou ID do projeto..."
                    className="h-8 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white font-mono placeholder:text-neutral-600 focus:border-cyan-400 outline-none w-48"
                  />
                  <button
                    type="button"
                    onClick={() => fetchAccessStatus(portalCustomId)}
                    disabled={isLoadingAccessStatus}
                    className="h-8 w-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 flex items-center justify-center transition-colors"
                    title="Recarregar status de acesso"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccessStatus ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Status do Token */}
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-neutral-400 mb-1">Status da Credencial:</div>
                  <div className="flex items-center gap-2">
                    {isLoadingAccessStatus ? (
                      <span className="text-neutral-400">Consultando...</span>
                    ) : portalAccessStatus?.active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Chave Ativa
                      </span>
                    ) : portalAccessStatus?.exists ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold">
                        Acesso Revogado / Expirado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[11px] font-bold">
                        Nenhuma Chave Gerada
                      </span>
                    )}

                    {portalAccessStatus?.last_used_at && (
                      <span className="text-[11px] text-neutral-500">
                        · Último login: {new Date(portalAccessStatus.last_used_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação do Acesso */}
                <div className="flex flex-wrap items-center gap-2">
                  {!portalAccessStatus?.active ? (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleAccessAction('generate')}
                      className="min-h-[34px] px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Gerar Acesso</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAccessAction('regenerate')}
                        className="min-h-[34px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                        title="Invalida a chave atual e cria uma nova"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerar Acesso</span>
                      </button>
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAccessAction('revoke')}
                        className="min-h-[34px] px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-bold text-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Revogar Acesso</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chave Recém-Gerada (Exibição Única e Temporária na Memória) */}
              {generatedRawToken && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/50 to-neutral-950 border border-cyan-500/40 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Chave de Acesso Exclusiva Gerada!
                    </span>
                    <span className="text-[10px] text-cyan-400/80 uppercase font-mono">
                      Exibição Temporária
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Copie a chave ou o link completo abaixo para enviar ao cliente. Por segurança, o token bruto não é salvo em texto puro e não será exibido após fechar esta janela.
                  </p>

                  {/* Token Box */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase">Token Bruto:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedRawToken}
                        className="w-full h-9 px-3 rounded-lg bg-neutral-900 border border-cyan-800/60 text-cyan-300 font-mono text-xs select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="h-9 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-neutral-950" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken ? 'Copiado!' : 'Copiar Token'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Link Completo Box */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase">Link Direto para o Cliente:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/portal?token=${generatedRawToken}` : ''}
                        className="w-full h-9 px-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-mono text-xs select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="h-9 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: DADOS DO PROJETO NO PORTAL (ETAPA, PROGRESSO, RECADO, LINKS) */}
            <form onSubmit={handleSaveProjectManage} className="space-y-4 text-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider pt-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Atualização de Progresso & Homologação</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Etapa Atual */}
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Etapa Atual do Projeto *</label>
                  <select
                    value={portalStage}
                    onChange={(e) => setPortalStage(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-cyan-400 font-medium"
                    aria-label="Etapa do projeto"
                  >
                    {PORTAL_STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Interno */}
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Status Operacional</label>
                  <select
                    value={portalStatus}
                    onChange={(e) => setPortalStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-cyan-400 font-medium"
                    aria-label="Status operacional"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em desenvolvimento">Em desenvolvimento</option>
                    <option value="Em revisão">Em revisão</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
              </div>

              {/* Progresso com Slider e Input Numérico */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold">Progresso Geral (% Concluído)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={portalProgress}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setPortalProgress(val);
                      }}
                      className="w-16 h-8 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-300 font-bold text-center text-xs outline-none focus:border-cyan-400"
                    />
                    <span className="text-cyan-400 font-bold">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={portalProgress}
                  onChange={(e) => setPortalProgress(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${portalProgress}%` }}
                  />
                </div>
              </div>

              {/* Mensagem em Destaque ao Cliente */}
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-medium">
                  Mensagem / Recado em Destaque (Visível no Portal do Cliente)
                </label>
                <textarea
                  rows={2}
                  value={portalHeadline}
                  onChange={(e) => setPortalHeadline(e.target.value)}
                  placeholder="Ex: Layout e estrutura validados. Iniciando configuração de formulários e hospedagem..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-cyan-400 resize-none leading-relaxed"
                />
              </div>

              {/* URLs de Homologação e Produção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">URL de Testes (Homologação / Staging)</label>
                  <input
                    type="url"
                    value={portalStagingUrl}
                    onChange={(e) => setPortalStagingUrl(e.target.value)}
                    placeholder="https://preview.nexaweb.com.br/cliente"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">URL de Produção (Site Oficial no Ar)</label>
                  <input
                    type="url"
                    value={portalProductionUrl}
                    onChange={(e) => setPortalProductionUrl(e.target.value)}
                    placeholder="https://www.cliente.com.br"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Solicitações Abertas pelo Cliente neste Projeto */}
              {(() => {
                const projectReqs = clientRequests.filter((r) => r.projectId === portalCustomId);
                return (
                  <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        Solicitações do Cliente neste Projeto
                      </span>
                      <span className="text-[11px] text-cyan-400 font-bold">
                        {projectReqs.length} {projectReqs.length === 1 ? 'solicitação' : 'solicitações'}
                      </span>
                    </div>

                    {projectReqs.length === 0 ? (
                      <p className="text-[11px] text-neutral-500 italic">
                        Nenhuma solicitação enviada pelo cliente deste projeto até o momento.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {projectReqs.map((pr) => (
                          <div
                            key={pr.id}
                            className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-semibold text-white">{pr.title}</span>
                              <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                  {pr.category}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                                  {pr.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-neutral-400 line-clamp-2 leading-relaxed">
                              {pr.description}
                            </p>
                            <span className="text-[10px] text-neutral-500 block">
                              {pr.createdAt ? new Date(pr.createdAt).toLocaleString('pt-BR') : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClosePortalModal}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSavingProject ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-neutral-950" />
                      <span>Salvar Alterações no Projeto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                  {editingDemo.tier} · {editingDemo.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display text-white truncate">
                  Gerenciar Demo: {editingDemo.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDemo(null)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center shrink-0"
                aria-label="Fechar editor de demo"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDemoOverride} className="space-y-4 text-xs">
              {/* URL Real Publicada */}
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold flex items-center justify-between">
                  <span>URL Real Publicada (Site no Ar)</span>
                  <span className="text-[10px] text-neutral-500">Alimenta capturas automáticas</span>
                </label>
                <input
                  type="url"
                  value={demoEditForm.customUrl}
                  onChange={(e) => setDemoEditForm({ ...demoEditForm, customUrl: e.target.value })}
                  placeholder="https://nexaweb-exemplo.vercel.app/"
                  className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 font-mono text-[11px]"
                />
              </div>

              {/* Gerenciador de Imagem Manual (Prioridade 1) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Imagem Manual do Admin (Prioridade Máxima)</span>
                  </label>
                  {demoEditForm.manualImageUrl && (
                    <button
                      type="button"
                      onClick={() => setDemoEditForm({ ...demoEditForm, manualImageUrl: '' })}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Remover imagem manual
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Quando preenchida, esta imagem substitui a captura automática no card e no modal público.
                </p>

                <input
                  type="text"
                  value={demoEditForm.manualImageUrl}
                  onChange={(e) => setDemoEditForm({ ...demoEditForm, manualImageUrl: e.target.value })}
                  placeholder="Insira a URL direta da imagem (https://...)"
                  className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 text-[11px]"
                />

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <label className="cursor-pointer min-h-[38px] px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 inline-flex items-center gap-1.5 transition-colors">
                    {isUploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>{isUploadingImage ? 'Enviando imagem...' : 'Carregar Imagem do Dispositivo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Via API /api/upload-briefing
                  </span>
                </div>

                {uploadError && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1 pt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {demoEditForm.manualImageUrl && (
                  <div className="mt-2 aspect-[16/10] max-h-36 rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                    <img
                      src={demoEditForm.manualImageUrl}
                      alt="Prévia da imagem manual"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
              </div>

              {/* Status de Publicação */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="text-white font-semibold block text-xs">Publicar esta demonstração no ar</span>
                  <span className="text-[10px] text-neutral-500">
                    Habilita o botão &quot;Ver site no ar&quot; no card e modal
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={demoEditForm.isPublished}
                  onChange={(e) => setDemoEditForm({ ...demoEditForm, isPublished: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  aria-label="Publicar demonstração"
                />
              </div>

              {/* Observações da Demo */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Notas internas sobre a demo</label>
                <input
                  type="text"
                  value={demoEditForm.notes}
                  onChange={(e) => setDemoEditForm({ ...demoEditForm, notes: e.target.value })}
                  placeholder="Ex: Atualizar textos de apresentação na próxima versão"
                  className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleResetDemoOverride(editingDemo.id)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                >
                  Restaurar Padrão
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDemo(null)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
