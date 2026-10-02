import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Layers,
  FileText,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Filter,
  Lock,
  Eye,
  Sliders,
  Sparkles,
  Award,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Building,
  Download,
  Plus,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import {
  ALL_PROJECTS,
  TOTAL_PROJECTS_COUNT,
  PUBLISHED_PROJECTS_COUNT,
  CONCEPT_PROJECTS_COUNT,
  isProjectPublished,
  type ProjectItem,
} from '../data/projects';
import { NEXAWEB_CONTACT } from '../config/contact';

export type BriefingStatus =
  | 'Novo'
  | 'Em análise'
  | 'Em desenvolvimento'
  | 'Aguardando cliente'
  | 'Concluído';

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

// Exemplos iniciais realistas para o painel operacional da agência
const INITIAL_BRIEFINGS: AdminBriefingItem[] = [
  {
    id: 'BRF-2026-001',
    clientName: 'Rodrigo Medeiros',
    businessName: 'IronFit Studio',
    businessSegment: 'Academia / Fitness',
    plan: 'Premium',
    date: '2026-10-01 14:32',
    status: 'Em análise',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'rodrigo@ironfit.com.br',
    notes: 'Precisa de agendamento de aulas experimentais e área para instrutores.',
    selectedFeatures: ['Área do Aluno', 'Grade de Aulas', 'Botão WhatsApp', 'Vídeos em Destaque'],
    referenceModel: 'Academia Premium',
    estimatedPrice: 'A partir de R$ 4.500',
    filesCount: 3,
  },
  {
    id: 'BRF-2026-002',
    clientName: 'Carla Silveira',
    businessName: 'Silveira & Associados',
    businessSegment: 'Prestador de Serviço',
    plan: 'Profissional',
    date: '2026-10-01 11:15',
    status: 'Novo',
    clientPhone: '(21) 99123-8877',
    clientEmail: 'contato@silveiraadv.com.br',
    notes: 'Escritório de consultoria jurídica e compliance empresarial.',
    selectedFeatures: ['Formulário Comercial', 'Depoimentos', 'FAQ', 'Google Maps'],
    referenceModel: 'Prestador de Serviço',
    estimatedPrice: 'R$ 1.700',
    filesCount: 1,
  },
  {
    id: 'BRF-2026-003',
    clientName: 'Marcos Vinicius',
    businessName: 'Fogão de Lenha Bistrô',
    businessSegment: 'Restaurante',
    plan: 'Personalizado',
    date: '2026-09-30 18:40',
    status: 'Em desenvolvimento',
    clientPhone: '(31) 98844-5566',
    clientEmail: 'marcos@fogaodelenha.com.br',
    notes: 'Cardápio interativo por QR Code e integração direta com WhatsApp para encomendas.',
    selectedFeatures: ['Cardápio Digital', 'Categorias de Pratos', 'Horários de Funcionamento'],
    referenceModel: 'Restaurante — Sabor & Brasa',
    estimatedPrice: 'A partir de R$ 2.800',
    filesCount: 4,
  },
  {
    id: 'BRF-2026-004',
    clientName: 'Felipe Alencar',
    businessName: 'Alencar Imóveis Prime',
    businessSegment: 'Imobiliária',
    plan: 'Premium',
    date: '2026-09-29 09:20',
    status: 'Aguardando cliente',
    clientPhone: '(41) 97711-2233',
    clientEmail: 'felipe@alencarprime.com.br',
    notes: 'Apresentação de coberturas e imóveis de alto padrão em Curitiba.',
    selectedFeatures: ['Catálogo de Imóveis', 'Filtros Avançados', 'Agendamento de Visitas'],
    referenceModel: 'Imobiliária Premium',
    estimatedPrice: 'A partir de R$ 4.500',
    filesCount: 6,
  },
];

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'briefings' | 'demos' | 'projects' | 'security'>('overview');
  const [briefings, setBriefings] = useState<AdminBriefingItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexaweb_admin_briefings');
      return saved ? JSON.parse(saved) : INITIAL_BRIEFINGS;
    } catch {
      return INITIAL_BRIEFINGS;
    }
  });

  const [selectedBriefing, setSelectedBriefing] = useState<AdminBriefingItem | null>(null);
  const [briefingFilter, setBriefingFilter] = useState<string>('todos');
  const [briefingSearch, setBriefingSearch] = useState<string>('');
  const [isNewBriefingModalOpen, setIsNewBriefingModalOpen] = useState<boolean>(false);
  const [demoFilter, setDemoFilter] = useState<'todos' | 'publicados' | 'conceito'>('todos');
  const [demoSearch, setDemoSearch] = useState<string>('');

  // Form state for creating a manual briefing inside the admin
  const [newForm, setNewForm] = useState({
    clientName: '',
    businessName: '',
    businessSegment: '',
    plan: 'Essencial' as 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium',
    clientPhone: '',
    clientEmail: '',
    notes: '',
    estimatedPrice: 'R$ 690',
  });

  // Synchronize localStorage updates automatically
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('nexaweb_admin_briefings');
        if (saved) setBriefings(JSON.parse(saved));
      } catch (e) {
        console.warn('Storage sync notice:', e);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleUpdateStatus = (id: string, newStatus: BriefingStatus) => {
    const updated = briefings.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
    setBriefings(updated);
    if (selectedBriefing && selectedBriefing.id === id) {
      setSelectedBriefing({ ...selectedBriefing, status: newStatus });
    }
    try {
      localStorage.setItem('nexaweb_admin_briefings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage notice:', e);
    }
  };

  const handleDeleteBriefing = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este briefing do painel?')) return;
    const updated = briefings.filter((b) => b.id !== id);
    setBriefings(updated);
    if (selectedBriefing?.id === id) {
      setSelectedBriefing(null);
    }
    try {
      localStorage.setItem('nexaweb_admin_briefings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Delete storage notice:', e);
    }
  };

  const handleExportBriefings = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(briefings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexaweb-briefings-${new Date().toISOString().split('T')[0]}.json`);
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
      clientName: newForm.clientName.trim() || 'Lead NexaWeb',
      businessName: newForm.businessName.trim() || 'Novo Negócio',
      businessSegment: newForm.businessSegment.trim() || 'Comercial',
      plan: newForm.plan,
      date: formattedDate,
      status: 'Novo',
      clientPhone: newForm.clientPhone.trim() || 'Não informado',
      clientEmail: newForm.clientEmail.trim() || 'Não informado',
      notes: newForm.notes.trim() || undefined,
      estimatedPrice: newForm.estimatedPrice || (newForm.plan === 'Essencial' ? 'R$ 690' : newForm.plan === 'Profissional' ? 'R$ 1.700' : 'Sob consulta'),
      filesCount: 0,
    };

    const updated = [item, ...briefings];
    setBriefings(updated);
    try {
      localStorage.setItem('nexaweb_admin_briefings', JSON.stringify(updated));
    } catch (err) {
      console.warn('Storage save notice:', err);
    }

    setIsNewBriefingModalOpen(false);
    setNewForm({
      clientName: '',
      businessName: '',
      businessSegment: '',
      plan: 'Essencial',
      clientPhone: '',
      clientEmail: '',
      notes: '',
      estimatedPrice: 'R$ 690',
    });
  };

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

  const filteredDemos = useMemo(() => {
    return ALL_PROJECTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(demoSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(demoSearch.toLowerCase()) ||
        p.tier.toLowerCase().includes(demoSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (demoFilter === 'publicados') return isProjectPublished(p);
      if (demoFilter === 'conceito') return !isProjectPublished(p);
      return true;
    });
  }, [demoFilter, demoSearch]);

  const statusColor = (st: BriefingStatus) => {
    switch (st) {
      case 'Novo':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Em análise':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Em desenvolvimento':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Aguardando cliente':
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
      case 'Concluído':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="shrink-0 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
              title="Voltar ao site público"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-neutral-950 text-sm">
                N
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base">NexaWeb</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    PAINEL INTERNO
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block">Gestão Operacional de Briefings e Demonstrações</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ambiente Protegido</span>
            </span>

            <button
              type="button"
              onClick={onBackToSite}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            >
              Ver Site Público
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral', icon: <Layers className="w-4 h-4" /> },
            {
              id: 'briefings',
              label: `Briefings (${briefings.length})`,
              icon: <FileText className="w-4 h-4" />,
            },
            {
              id: 'demos',
              label: `Demonstrações (${TOTAL_PROJECTS_COUNT})`,
              icon: <Globe className="w-4 h-4" />,
            },
            { id: 'projects', label: 'Projetos em Produção', icon: <Users className="w-4 h-4" /> },
            { id: 'security', label: 'Segurança & Backend', icon: <Shield className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Briefings Recebidos</span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {briefings.length}
                </div>
                <span className="text-[11px] text-purple-300 font-medium">
                  {briefings.filter((b) => b.status === 'Novo').length} novos para triagem
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Demonstrações Reais</span>
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">
                  {PUBLISHED_PROJECTS_COUNT}
                </div>
                <span className="text-[11px] text-neutral-400">
                  Sites 100% no ar e navegáveis
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Projetos em Homologação</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-amber-400">
                  {CONCEPT_PROJECTS_COUNT}
                </div>
                <span className="text-[11px] text-neutral-400">
                  Modelos conceituais de portfólio
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Total de Portfólio</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {TOTAL_PROJECTS_COUNT}
                </div>
                <span className="text-[11px] text-blue-300">
                  12 Essencial · 3 Profissional · 7 Premium
                </span>
              </div>
            </div>

            {/* Quick Briefings Table Preview */}
            <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Solicitações Recentes de Briefing
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Últimos briefings submetidos pelo formulário comercial
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('briefings')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Ver todos ({briefings.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-neutral-800/80">
                {briefings.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedBriefing(item);
                      setActiveTab('briefings');
                    }}
                    className="p-4 sm:p-5 hover:bg-neutral-800/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500">{item.id}</span>
                        <h4 className="text-sm font-bold text-white">{item.clientName}</h4>
                        <span className="text-xs text-neutral-400">· {item.businessName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        <span className="text-neutral-300 font-medium">{item.businessSegment}</span>
                        <span>·</span>
                        <span className="text-amber-300">Plano {item.plan}</span>
                        <span>·</span>
                        <span className="text-neutral-500">{item.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GERENCIAMENTO DE BRIEFINGS */}
        {activeTab === 'briefings' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Action Bar: Search, Filters & Action Buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={briefingSearch}
                    onChange={(e) => setBriefingSearch(e.target.value)}
                    placeholder="Buscar por cliente, empresa ou telefone..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBriefings}
                    className="h-9 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    title="Exportar todos os briefings em formato JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Exportar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewBriefingModalOpen(true)}
                    className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/15"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Briefing</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {(['todos', 'Novo', 'Em análise', 'Em desenvolvimento', 'Aguardando cliente', 'Concluído'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setBriefingFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
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
                  {filteredBriefings.length} briefing(s) encontrado(s)
                </span>
              </div>
            </div>

            {/* Briefings List */}
            <div className="grid grid-cols-1 gap-3">
              {filteredBriefings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                  <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-300">Nenhum briefing encontrado</p>
                  <p className="text-xs text-neutral-500">
                    Ajuste os filtros ou cadastre um novo briefing manualmente.
                  </p>
                </div>
              ) : (
                filteredBriefings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-amber-400">{item.id}</span>
                        <h4 className="text-base font-bold text-white">{item.clientName}</h4>
                        <span className="text-xs text-neutral-400">({item.businessName})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                        <span className="inline-flex items-center gap-1 text-neutral-300">
                          <Building className="w-3.5 h-3.5 text-neutral-500" />
                          {item.businessSegment}
                        </span>
                        <span>·</span>
                        <span className="text-white font-semibold">Plano {item.plan}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-500" />
                          {item.clientPhone}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {item.date}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-neutral-400 italic bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80 max-w-2xl">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions & Status Dropdown */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                      {item.clientPhone && item.clientPhone !== 'Não informado' && (
                        <a
                          href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá ${item.clientName}, tudo bem? Aqui é da equipe NexaWeb referente ao seu briefing para a ${item.businessName}!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          title="Abrir WhatsApp com cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as BriefingStatus)}
                        className="h-8 px-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-200 outline-none focus:border-amber-400"
                      >
                        <option value="Novo">Novo</option>
                        <option value="Em análise">Em análise</option>
                        <option value="Em desenvolvimento">Em desenvolvimento</option>
                        <option value="Aguardando cliente">Aguardando cliente</option>
                        <option value="Concluído">Concluído</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setSelectedBriefing(item)}
                        className="h-8 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBriefing(item.id)}
                        className="h-8 w-8 rounded-xl bg-neutral-950 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 border border-neutral-800 flex items-center justify-center transition-colors"
                        title="Excluir briefing"
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

        {/* TAB 3: GERENCIAMENTO DE DEMONSTRAÇÕES (22 PROJETOS) */}
        {activeTab === 'demos' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Search and publication filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={demoSearch}
                    onChange={(e) => setDemoSearch(e.target.value)}
                    placeholder="Buscar demonstração..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDemoFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg ${demoFilter === 'todos' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'}`}
                  >
                    Todos ({TOTAL_PROJECTS_COUNT})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoFilter('publicados')}
                    className={`px-2.5 py-1 rounded-lg ${demoFilter === 'publicados' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400'}`}
                  >
                    No Ar ({PUBLISHED_PROJECTS_COUNT})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoFilter('conceito')}
                    className={`px-2.5 py-1 rounded-lg ${demoFilter === 'conceito' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400'}`}
                  >
                    Homologação ({CONCEPT_PROJECTS_COUNT})
                  </button>
                </div>
              </div>

              <span className="text-xs text-neutral-500">
                Visualizando {filteredDemos.length} projetos
              </span>
            </div>

            {/* Demos Table */}
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950/80 text-[11px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5 pl-5">Projeto</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Plano</th>
                      <th className="p-3.5">Status de Publicação</th>
                      <th className="p-3.5">URL Cadastrada</th>
                      <th className="p-3.5 pr-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredDemos.map((project) => {
                      const published = isProjectPublished(project);
                      return (
                        <tr key={project.id} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="p-3.5 pl-5 font-semibold text-white">
                            {project.name}
                          </td>
                          <td className="p-3.5 text-neutral-400">{project.category}</td>
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
                          <td className="p-3.5">
                            {published ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Publicado no Ar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                Em Homologação
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-neutral-400 truncate max-w-xs">
                            {published ? (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 truncate"
                              >
                                <span className="truncate">{project.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-neutral-500 italic">Sem URL (Conceito)</span>
                            )}
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            {published ? (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium inline-flex items-center gap-1"
                              >
                                <span>Testar</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-neutral-500">Pronto p/ deploy</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROJETOS EM PRODUÇÃO */}
        {activeTab === 'projects' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <h3 className="text-base font-bold font-display text-white">
                Controle de Projetos & Clientes
              </h3>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                Estrutura de acompanhamento da linha de produção da agência. Cada projeto aprovado migra do briefing para esta esteira operacional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Etapa 01 · Triagem & Wireframe
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Validação de conteúdo, paleta de cores e seleção de componentes estruturais conforme o briefing.
                </p>
                <div className="text-xs text-neutral-500 font-mono">2 projetos em andamento</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Etapa 02 · Desenvolvimento & Responsivo
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Construção da interface limpa, otimização de imagens, scripts leves e testes de viewport mobile.
                </p>
                <div className="text-xs text-neutral-500 font-mono">1 projeto em andamento</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Etapa 03 · Homologação & Publicação
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Configuração de domínio próprio, certificado SSL, testes de formulário e entrega ao cliente.
                </p>
                <div className="text-xs text-neutral-500 font-mono">1 projeto aguardando aprovação final</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SEGURANÇA & ARQUITETURA */}
        {activeTab === 'security' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  Diretrizes de Segurança & Backend da NexaWeb
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Este painel interno foi desenvolvido seguindo os mais altos padrões de segurança de frontend moderno:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Zero Credenciais Hardcoded
                  </span>
                  <p className="text-xs text-neutral-400">
                    Nenhuma senha, token ou chave sensível (como BLOB_READ_WRITE_TOKEN) está exposta no bundle frontend.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Preparado para Auth Real
                  </span>
                  <p className="text-xs text-neutral-400">
                    A estrutura de rotas e componentes está pronta para acoplar autenticação serverless (NextAuth, Supabase ou Firebase Auth).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Armazenamento de Fotos Seguro
                  </span>
                  <p className="text-xs text-neutral-400">
                    O endpoint de upload (/api/upload-briefing) opera com Vercel Blob quando a variável de ambiente está configurada.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp Oficial Centralizado
                  </span>
                  <p className="text-xs text-neutral-400">
                    Centralizado em <code>src/config/contact.ts</code> sem números fictícios em produção.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Briefing Detail Modal / Drawer */}
      {selectedBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {selectedBriefing.id}
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  {selectedBriefing.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBriefing(null)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">EMPRESA / PROJETO</span>
                  <span className="font-semibold text-white">{selectedBriefing.businessName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">SEGMENTO</span>
                  <span className="font-semibold text-white">{selectedBriefing.businessSegment}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">PLANO ESCOLHIDO</span>
                  <span className="font-semibold text-amber-300">Plano {selectedBriefing.plan}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">INVESTIMENTO ESTIMADO</span>
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
                      <span>Chamar no WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
                  <span className="font-mono text-neutral-300">{selectedBriefing.clientEmail}</span>
                  {selectedBriefing.clientEmail && selectedBriefing.clientEmail !== 'Não informado' && (
                    <a
                      href={`mailto:${selectedBriefing.clientEmail}?subject=${encodeURIComponent(
                        `NexaWeb - Proposta de Site para ${selectedBriefing.businessName}`
                      )}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Enviar E-mail</span>
                    </a>
                  )}
                </div>
              </div>

              {selectedBriefing.selectedFeatures && (
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-neutral-500 block text-[10px]">RECURSOS INDICADOS</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedBriefing.selectedFeatures.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] text-neutral-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedBriefing.notes && (
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-neutral-500 block text-[10px]">OBSERVAÇÕES DO CLIENTE</span>
                  <p className="text-neutral-300 italic">{selectedBriefing.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500">Alterar Status:</span>
                <select
                  value={selectedBriefing.status}
                  onChange={(e) => handleUpdateStatus(selectedBriefing.id, e.target.value as BriefingStatus)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white outline-none focus:border-amber-400"
                >
                  <option value="Novo">Novo</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Em desenvolvimento">Em desenvolvimento</option>
                  <option value="Aguardando cliente">Aguardando cliente</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteBriefing(selectedBriefing.id)}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBriefing(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Briefing Creation Modal */}
      {isNewBriefingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Cadastrar Novo Briefing / Lead
                </h3>
                <p className="text-xs text-neutral-400">
                  Adicione solicitações recebidas por WhatsApp, telefone ou reuniões
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBriefingModalOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
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
                    value={newForm.clientName}
                    onChange={(e) => setNewForm({ ...newForm, clientName: e.target.value })}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Nome da Empresa / Projeto *</label>
                  <input
                    type="text"
                    required
                    value={newForm.businessName}
                    onChange={(e) => setNewForm({ ...newForm, businessName: e.target.value })}
                    placeholder="Ex: Mendes Advocacia"
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Segmento de Atuação</label>
                  <input
                    type="text"
                    value={newForm.businessSegment}
                    onChange={(e) => setNewForm({ ...newForm, businessSegment: e.target.value })}
                    placeholder="Ex: Advocacia / Consultoria"
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Plano</label>
                  <select
                    value={newForm.plan}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      const price = p === 'Essencial' ? 'R$ 690' : p === 'Profissional' ? 'R$ 1.700' : p === 'Personalizado' ? 'A partir de R$ 2.500' : 'A partir de R$ 4.500';
                      setNewForm({ ...newForm, plan: p, estimatedPrice: price });
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400"
                  >
                    <option value="Essencial">Essencial (R$ 690)</option>
                    <option value="Profissional">Profissional (R$ 1.700)</option>
                    <option value="Personalizado">Personalizado (Sob Medida)</option>
                    <option value="Premium">Premium (Projetos de Alto Padrão)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={newForm.clientPhone}
                    onChange={(e) => setNewForm({ ...newForm, clientPhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">E-mail</label>
                  <input
                    type="email"
                    value={newForm.clientEmail}
                    onChange={(e) => setNewForm({ ...newForm, clientEmail: e.target.value })}
                    placeholder="cliente@empresa.com.br"
                    className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Observações / Detalhes do Pedido</label>
                <textarea
                  rows={3}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Descreva particularidades do site, funcionalidades desejadas, prazos..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBriefingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20"
                >
                  Salvar Briefing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
