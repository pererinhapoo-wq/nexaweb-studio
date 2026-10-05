import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dumbbell,
  Scissors,
  UtensilsCrossed,
  Building2,
  HardHat,
  ShoppingBag,
  Sparkles,
  Briefcase,
  UserCheck,
  Layers,
  HeartHandshake,
  Hotel,
  GraduationCap,
  Car,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  Check,
  Layout,
  Database,
  Activity,
  Clock,
  ShieldCheck,
  BarChart3,
  Users,
  Cpu,
  Sliders,
  Zap,
} from 'lucide-react';
import { ALL_PROJECTS, type ProjectItem } from '../data/projects';
import { ProjectCard } from './ProjectCard';
import { ProjectCarouselSection } from './ProjectCarouselSection';
import {
  FEATURE_CATALOG,
  findSegmentPreset,
  type SegmentPreset,
  type FeatureItem,
} from '../data/featureCatalog';

export interface SegmentsShowcaseProps {
  onSelectFormat?: (project: ProjectItem) => void;
  onPreviewProject?: (project: ProjectItem) => void;
  onUseAsInspiration?: (project: ProjectItem) => void;
  onStartCustomProject?: (segmentName?: string) => void;
  selectedSegmentId?: string | null;
  onSelectSegment?: (segmentId: string | null) => void;
}

export interface SegmentItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  hasDemo: boolean;
  accent: 'blue' | 'purple' | 'emerald' | 'amber';
}

const SEGMENT_PROJECT_IDS: Record<string, string[]> = {
  academia: ['academia', 'academia-premium'],
  barbearia: ['kings-barber', 'kings-barber-premium'],
  restaurante: ['restaurante-sabor-brasa', 'restaurante', 'restaurante-premium'],
  imobiliaria: ['imobiliaria', 'imobiliaria-premium'],
  engenharia: ['engenharia-premium'],
  loja: ['loja', 'loja-premium'],
  'criador-conteudo': ['influenciador', 'criador-conteudo'],
  clinica: ['lumiere', 'clinica-premium'],
  arquitetura: ['nova-arq'],
  salao: ['salao'],
  'profissional-autonomo': ['prestador-servico'],
  empresa: ['vertex-digital', 'grok-workspace'],
  petshop: ['auravet-petshop'],
  'hotel-pousada': [],
  educacao: [],
  automotivo: [],
  'landing-pages': [],
};

export const SEGMENTS: SegmentItem[] = [
  {
    id: 'academia',
    name: 'Academia / Fitness',
    description: 'Apresentação de modalidades, estrutura, planos e equipe de instrutores.',
    icon: <Dumbbell className="w-4 h-4" />,
    hasDemo: true,
    accent: 'amber',
  },
  {
    id: 'barbearia',
    name: 'Barbearia',
    description: 'Serviços, ambiente, equipe de barbeiros, fotos e agendamento via WhatsApp.',
    icon: <Scissors className="w-4 h-4" />,
    hasDemo: true,
    accent: 'blue',
  },
  {
    id: 'restaurante',
    name: 'Restaurante / Gastronomia',
    description: 'Cardápio digital, pratos principais, espaço físico, delivery e reservas.',
    icon: <UtensilsCrossed className="w-4 h-4" />,
    hasDemo: true,
    accent: 'blue',
  },
  {
    id: 'imobiliaria',
    name: 'Imobiliária',
    description: 'Apresentação de imóveis, lançamentos, corretores e canais de atendimento.',
    icon: <Building2 className="w-4 h-4" />,
    hasDemo: true,
    accent: 'amber',
  },
  {
    id: 'engenharia',
    name: 'Engenharia / Construção',
    description: 'Projetos executados, áreas de atuação, certificações e autoridade técnica.',
    icon: <HardHat className="w-4 h-4" />,
    hasDemo: true,
    accent: 'amber',
  },
  {
    id: 'loja',
    name: 'Loja / E-commerce',
    description: 'Catálogo de produtos, categorias, formas de pagamento e compra rápida.',
    icon: <ShoppingBag className="w-4 h-4" />,
    hasDemo: true,
    accent: 'amber',
  },
  {
    id: 'criador-conteudo',
    name: 'Criador de Conteúdo',
    description: 'Perfil profissional, redes sociais, trabalhos, parcerias e mídia kit.',
    icon: <Sparkles className="w-4 h-4" />,
    hasDemo: true,
    accent: 'blue',
  },
  {
    id: 'clinica',
    name: 'Clínica / Saúde',
    description: 'Especialidades médicas, tratamentos, corpo clínico e contato de agendamento.',
    icon: <HeartHandshake className="w-4 h-4" />,
    hasDemo: true,
    accent: 'amber',
  },
  {
    id: 'arquitetura',
    name: 'Arquitetura / Design',
    description: 'Portfólio de projetos residenciais e corporativos, conceito e contato.',
    icon: <Layers className="w-4 h-4" />,
    hasDemo: true,
    accent: 'emerald',
  },
  {
    id: 'salao',
    name: 'Salão / Estética',
    description: 'Serviços de cabelo, unhas, estética, antes/depois e atendimento.',
    icon: <Scissors className="w-4 h-4" />,
    hasDemo: true,
    accent: 'blue',
  },
  {
    id: 'profissional-autonomo',
    name: 'Profissional / Autônomo',
    description: 'Consultores, advogados, contadores e prestadores com foco em conversão.',
    icon: <UserCheck className="w-4 h-4" />,
    hasDemo: true,
    accent: 'blue',
  },
  {
    id: 'empresa',
    name: 'Empresa / B2B',
    description: 'Apresentação corporativa, soluções empresariais e canal comercial direto.',
    icon: <Briefcase className="w-4 h-4" />,
    hasDemo: true,
    accent: 'emerald',
  },
  {
    id: 'petshop',
    name: 'Pet Shop / Veterinária',
    description: 'Clínica veterinária, banho & tosa, medicina integrativa e boutique de cuidados.',
    icon: <Sparkles className="w-4 h-4" />,
    hasDemo: true,
    accent: 'emerald',
  },
  {
    id: 'hotel-pousada',
    name: 'Hotel / Pousada',
    description: 'Acomodações, fotos do espaço, localização, atrativos e reservas diretas.',
    icon: <Hotel className="w-4 h-4" />,
    hasDemo: false,
    accent: 'purple',
  },
  {
    id: 'educacao',
    name: 'Educação / Cursos',
    description: 'Cursos, mentorias, professores, metodologia e inscrições facilitadas.',
    icon: <GraduationCap className="w-4 h-4" />,
    hasDemo: false,
    accent: 'purple',
  },
  {
    id: 'automotivo',
    name: 'Automotivo / Veículos',
    description: 'Estoque de veículos, estética automotiva, oficinas e orçamentos rápidos.',
    icon: <Car className="w-4 h-4" />,
    hasDemo: false,
    accent: 'purple',
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages de Alta Conversão',
    description: 'Páginas focadas em um único objetivo: captação de leads ou vendas diretas.',
    icon: <ArrowUpRight className="w-4 h-4" />,
    hasDemo: false,
    accent: 'purple',
  },
];

interface SegmentFeaturesExplorerProps {
  preset: SegmentPreset;
  segmentName: string;
  onStartCustomProject?: (segmentName?: string) => void;
}

const SegmentFeaturesExplorer: React.FC<SegmentFeaturesExplorerProps> = ({
  preset,
  segmentName,
  onStartCustomProject,
}) => {
  const [activeTab, setActiveTab] = useState<
    'features' | 'structure' | 'advanced' | 'realtime' | 'metrics'
  >('features');

  const hasRealtime = preset.realtimeFeatures && preset.realtimeFeatures.length > 0;
  const hasStats = Boolean(preset.statsExample);
  const hasAdvanced =
    (preset.advancedFeatures && preset.advancedFeatures.length > 0) || Boolean(preset.accountRoles);

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-neutral-800 p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Catálogo de Recursos & Arquitetura</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white">
            Estrutura & Recursos Planejados para {segmentName}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Abaixo estão as seções, ferramentas comerciais e módulos técnicos desenhados para este segmento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onStartCustomProject) {
              onStartCustomProject(segmentName);
            }
          }}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-neutral-950 font-bold text-xs shadow-md shadow-amber-400/15 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <span>Personalizar no Briefing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'features'
              ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
              : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Funcionalidades ({preset.standardFeatures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structure')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'structure'
              ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
              : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Estrutura do Site ({preset.defaultStructure.length})</span>
        </button>

        {hasAdvanced && (
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'advanced'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Módulos de Sistema & Contas ({preset.advancedFeatures.length})</span>
          </button>
        )}

        {hasRealtime && (
          <button
            type="button"
            onClick={() => setActiveTab('realtime')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'realtime'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tempo Real ({preset.realtimeFeatures.length})</span>
          </button>
        )}

        {hasStats && (
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas & Desempenho</span>
          </button>
        )}
      </div>

      {/* Tab 1: Standard Features */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {preset.standardFeatures.map((featId) => {
            const feat = FEATURE_CATALOG[featId];
            if (!feat) return null;

            const complexityColor =
              feat.complexity === 'Básica'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : feat.complexity === 'Intermediária'
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                : feat.complexity === 'Avançada'
                ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

            return (
              <div
                key={featId}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${complexityColor}`}
                    >
                      {feat.complexity}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {feat.compatiblePlans[0] || 'Todos os planos'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {feat.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    {feat.shortDesc}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Planos compatíveis:</span>
                  <span className="text-neutral-300 font-medium truncate max-w-[150px]">
                    {feat.compatiblePlans.join(', ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Recommended Site Structure */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {preset.defaultStructure.map((sec, idx) => (
            <div
              key={sec}
              className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                  {sec}
                </span>
                <span className="text-[10px] text-neutral-500 block truncate">
                  Seção planejada para {segmentName}
                </span>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Advanced System & Roles */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* Advanced Features List */}
          {preset.advancedFeatures && preset.advancedFeatures.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Módulos de Sistema & Painéis</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {preset.advancedFeatures.map((featId) => {
                  const feat = FEATURE_CATALOG[featId];
                  if (!feat) return null;
                  return (
                    <div
                      key={featId}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md">
                          Módulo Avançado
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Personalizado / Premium
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">{feat.name}</h5>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {feat.shortDesc}
                      </p>

                      <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap gap-1.5">
                        {feat.requiresAuth && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            Login / Senha
                          </span>
                        )}
                        {feat.requiresDatabase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            Banco de Dados
                          </span>
                        )}
                        {feat.requiresBackend && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            Backend / API
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Roles & Permissions */}
          {preset.accountRoles && (
            <div className="space-y-3 pt-4 border-t border-neutral-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Níveis de Acesso e Perfis (Arquitetura de Contas)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Cliente / Usuário */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{preset.accountRoles.cliente.label}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-neutral-400">
                    {preset.accountRoles.cliente.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Profissional / Operação */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{preset.accountRoles.profissional.label}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-neutral-400">
                    {preset.accountRoles.profissional.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Administrador / Gestão */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{preset.accountRoles.administrador.label}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-neutral-400">
                    {preset.accountRoles.administrador.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Realtime Features */}
      {activeTab === 'realtime' && hasRealtime && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0 animate-pulse text-amber-400" />
            <span>
              Recursos com atualização instantânea para clientes, profissionais e gestão de {segmentName}.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {preset.realtimeFeatures.map((featId) => {
              const feat = FEATURE_CATALOG[featId];
              if (!feat) return null;
              return (
                <div
                  key={featId}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Tempo Real</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">WebSocket / Polling</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{feat.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{feat.shortDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Performance / Metrics Example */}
      {activeTab === 'metrics' && hasStats && preset.statsExample && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
            <div>
              <h4 className="text-sm font-bold text-white">{preset.statsExample.title}</h4>
              <p className="text-[11px] text-neutral-400">
                Modelo visual do painel de controle que seus clientes ou gestores visualizam.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-500 border border-neutral-800 shrink-0">
              Demonstração de Interface
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {preset.statsExample.metrics.map((metric, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-center sm:text-left"
              >
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block">
                  {metric.label}
                </span>
                <span className="text-lg sm:text-2xl font-extrabold font-display text-amber-300 block">
                  {metric.value}
                </span>
                {metric.detail && (
                  <span className="text-[10px] text-neutral-500 block truncate">
                    {metric.detail}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {preset.statsExample.note ||
                'Demonstração da estrutura de dados e métricas projetada para este segmento. Ao integrar com banco de dados real, estas informações são atualizadas dinamicamente para cada usuário.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const SegmentsShowcase: React.FC<SegmentsShowcaseProps> = ({
  onSelectFormat,
  onPreviewProject,
  onUseAsInspiration,
  onStartCustomProject,
  selectedSegmentId: externalSelectedSegmentId,
  onSelectSegment: externalOnSelectSegment,
}) => {
  // Local active segment state (falls back to external prop if passed)
  const [internalSegmentId, setInternalSegmentId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Synchronize when external selection changes
  useEffect(() => {
    if (externalSelectedSegmentId !== undefined) {
      setInternalSegmentId(externalSelectedSegmentId);
    }
  }, [externalSelectedSegmentId]);

  const activeSegmentId =
    externalSelectedSegmentId !== undefined ? externalSelectedSegmentId : internalSegmentId;

  const currentSegment = useMemo(() => {
    if (!activeSegmentId) return null;
    return SEGMENTS.find((s) => s.id === activeSegmentId) || null;
  }, [activeSegmentId]);

  const segmentProjects = useMemo(() => {
    if (!activeSegmentId) return [];
    const targetIds = SEGMENT_PROJECT_IDS[activeSegmentId] || [];
    return ALL_PROJECTS.filter((p) => targetIds.includes(p.id));
  }, [activeSegmentId]);

  const currentPreset = useMemo(() => {
    if (!currentSegment) return null;
    return findSegmentPreset(currentSegment.id);
  }, [currentSegment]);

  const handleSelectSegment = (segmentId: string | null) => {
    setInternalSegmentId(segmentId);
    if (externalOnSelectSegment) {
      externalOnSelectSegment(segmentId);
    }
    // Smooth scroll into section view when entering or exiting
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="segmentos"
      className="relative z-10 py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 border-t border-neutral-800/60"
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CASO 1: VISUALIZAÇÃO DEDICADA DA CATEGORIA ESCOLHIDA
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {currentSegment ? (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Top Return Button and Header */}
          <div className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => handleSelectSegment(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-semibold transition-all hover:border-neutral-700 active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar para tipos de sites</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-800/80">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <div className="w-4 h-4 text-amber-400 flex items-center justify-center">
                    {currentSegment.icon}
                  </div>
                  <span>Segmento Oficial</span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
                  {currentSegment.name}
                </h2>

                <p className="text-xs sm:text-sm text-neutral-300">
                  Modelos e projetos da NexaWeb para este segmento.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {segmentProjects.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>
                      {segmentProjects.length}{' '}
                      {segmentProjects.length === 1
                        ? 'Demonstração publicada'
                        : 'Demonstrações publicadas'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Solução Sob Medida</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Projetos Existentes ou Estado Vazio */}
          {segmentProjects.length > 0 ? (
            <div className="space-y-6">
              {/* Carousel on mobile, multi-column grid on desktop */}
              <ProjectCarouselSection
                projects={segmentProjects}
                onPreview={(proj) => {
                  if (onPreviewProject) {
                    onPreviewProject(proj);
                  }
                }}
                onSelectFormat={(proj) => {
                  if (onSelectFormat) {
                    onSelectFormat(proj);
                  }
                }}
                onUseAsInspiration={(proj) => {
                  if (onUseAsInspiration) {
                    onUseAsInspiration(proj);
                  }
                }}
              />

              {/* Technical Catalog & Features Explorer for this Segment */}
              {currentPreset && (
                <div className="pt-2">
                  <SegmentFeaturesExplorer
                    preset={currentPreset}
                    segmentName={currentSegment.name}
                    onStartCustomProject={onStartCustomProject}
                  />
                </div>
              )}

              {/* Bottom bar inside category view */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    Gostou destes modelos ou quer algo personalizado para seu negócio?
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Podemos adaptar qualquer um dos formatos acima ou construir uma estrutura sob medida.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSegment(null)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white border border-neutral-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ver outras categorias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onStartCustomProject) {
                        onStartCustomProject(currentSegment.name);
                      }
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-105 text-neutral-950 font-bold text-xs shadow-md shadow-purple-500/15 transition-all inline-flex items-center gap-1.5"
                  >
                    <span>Solicitar projeto sob medida</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ESTADO VAZIO PROFISSIONAL (Não é erro, é oportunidade de criação) */
            <div className="space-y-6">
              <div className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 text-center space-y-5 max-w-2xl mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  {currentSegment.icon}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Ainda não temos uma demonstração publicada para este segmento.
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg mx-auto">
                    Mas podemos criar um projeto sob medida para sua empresa.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
                    Desenvolvemos a estrutura visual ideal para {currentSegment.name}, com seções personalizadas, identidade marcante e foco em resultados.
                  </p>
                </div>

                {/* Differential bullets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto py-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Design 100% exclusivo</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Adaptação total para celular</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Integração com WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Briefing guiado e suporte</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onStartCustomProject) {
                        onStartCustomProject(currentSegment.name);
                      }
                    }}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:brightness-105 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Solicitar projeto</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSegment(null)}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para tipos de sites</span>
                  </button>
                </div>
              </div>

              {/* Technical Catalog & Features Explorer for Segments without live demo */}
              {currentPreset && (
                <div className="pt-2 max-w-5xl mx-auto">
                  <SegmentFeaturesExplorer
                    preset={currentPreset}
                    segmentName={currentSegment.name}
                    onStartCustomProject={onStartCustomProject}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CASO 2: LISTA GERAL DE TIPOS DE SITES (16 CATEGORIAS)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Possibilidades de Criação
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              Tipos de Sites que a NexaWeb Desenvolve
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Estruturas planejadas para as necessidades do seu segmento. Se você já tiver um modelo de referência, usaremos como base; se tiver uma ideia própria, desenvolveremos sob medida.
            </p>
          </div>

          {/* Grid of Segments */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {SEGMENTS.map((seg) => {
              const targetProjects = SEGMENT_PROJECT_IDS[seg.id] || [];
              const demoCount = targetProjects.length;

              return (
                <div
                  key={seg.id}
                  onClick={() => handleSelectSegment(seg.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 hover:border-amber-400/50 hover:bg-neutral-900 transition-all flex flex-col justify-between group cursor-pointer active:scale-[0.99]"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSegment(seg.id);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-amber-300 transition-colors">
                        {seg.icon}
                      </div>
                      {seg.hasDemo ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          {demoCount > 1 ? `${demoCount} no ar` : 'Amostra no ar'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800/80">
                          Sob medida
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold font-display text-white group-hover:text-amber-200 transition-colors">
                      {seg.name}
                    </h3>

                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                      {seg.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-neutral-800/60">
                    {seg.hasDemo ? (
                      <div className="w-full py-1.5 px-2 rounded-lg bg-neutral-950 group-hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 group-hover:text-white border border-neutral-800 flex items-center justify-between transition-colors">
                        <span>Ver modelos ({demoCount})</span>
                        <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    ) : (
                      <div className="w-full py-1.5 px-2 rounded-lg bg-purple-950/30 group-hover:bg-purple-900/50 text-[11px] font-semibold text-purple-300 group-hover:text-purple-200 border border-purple-500/25 flex items-center justify-between transition-colors">
                        <span>Sob medida</span>
                        <ArrowUpRight className="w-3 h-3 text-purple-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              NÃO ENCONTROU SEU SEGMENTO?
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="mt-8 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/20 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-amber-400">
                <HelpCircle className="w-4 h-4" />
                <span>Não encontrou seu segmento?</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                Podemos criar um projeto personalizado para o seu negócio.
              </h3>
              <p className="text-xs text-neutral-400 max-w-xl">
                Seja qual for o seu nicho, desenvolvemos a estrutura visual ideal de acordo com seus objetivos, serviços e público-alvo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onStartCustomProject) {
                  onStartCustomProject();
                }
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:brightness-105 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Quero criar um projeto personalizado</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
