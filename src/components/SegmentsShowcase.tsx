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
} from 'lucide-react';
import { ALL_PROJECTS, type ProjectItem } from '../data/projects';
import { ProjectCard } from './ProjectCard';

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
      className="relative z-10 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 border-t border-neutral-800/60"
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

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight uppercase">
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
              {/* Grid: 2 or 3 columns on desktop, 1 column on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {segmentProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
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
                ))}
              </div>

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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight">
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
