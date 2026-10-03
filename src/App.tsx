import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Shield,
  Award,
  ArrowUpRight,
  Search,
  Zap,
  Sliders,
  HelpCircle,
  TrendingUp,
  Laptop,
  CheckCircle2,
  Layers,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { checkIsAdminRoute, navigateTo, subscribeToRoute } from './router';
import {
  ESSENCIAL_PROJECTS,
  PROFISSIONAL_PROJECTS,
  PREMIUM_PROJECTS,
  ALL_PROJECTS,
  type ProjectItem,
} from './data/projects';
import { ProjectCard } from './components/ProjectCard';
import { ProjectCarouselSection } from './components/ProjectCarouselSection';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import type {
  ServiceLevelType,
  ModelIntentType,
  BriefingStage,
} from './components/ContactModal';
import { ShowcaseBanner } from './components/ShowcaseBanner';
import { PlansSection } from './components/PlansSection';
import { SegmentsShowcase } from './components/SegmentsShowcase';
import type { PlanId } from './components/PlanDetailModal';
import { AdminLogin } from './components/AdminLogin';

// Code-split heavy modals and administration views so they do not load on first paint
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const ContactModal = React.lazy(() =>
  import('./components/ContactModal').then((m) => ({ default: m.ContactModal }))
);
const ProjectModal = React.lazy(() =>
  import('./components/ProjectModal').then((m) => ({ default: m.ProjectModal }))
);
const PlanAdvisorModal = React.lazy(() =>
  import('./components/PlanAdvisorModal').then((m) => ({ default: m.PlanAdvisorModal }))
);
const StartProjectModal = React.lazy(() =>
  import('./components/StartProjectModal').then((m) => ({ default: m.StartProjectModal }))
);

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return checkIsAdminRoute();
  });

  // Estado de autorização administrativa validado exclusivamente pelo servidor
  const [adminAuthStatus, setAdminAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated'
  >('checking');

  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'todos' | 'essencial' | 'profissional' | 'personalizado' | 'premium'
  >('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  // Synchronize admin route changes across direct URL, refresh, pushState, popstate & hash
  React.useEffect(() => {
    const unsubscribe = subscribeToRoute((isAdmin) => {
      setIsAdminView(isAdmin);
    });
    return unsubscribe;
  }, []);

  // Validação estrita da sessão administrativa no servidor via /api/admin-session
  React.useEffect(() => {
    if (!isAdminView) return;

    let isMounted = true;
    setAdminAuthStatus('checking');

    fetch('/api/admin-session', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.authenticated === true) {
          setAdminAuthStatus('authenticated');
        } else {
          setAdminAuthStatus('unauthenticated');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAdminAuthStatus('unauthenticated');
      });

    return () => {
      isMounted = false;
    };
  }, [isAdminView]);

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin-logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
    } catch (e) {
      console.error('Erro ao efetuar logout:', e);
    } finally {
      setAdminAuthStatus('unauthenticated');
    }
  };

  // Intercept any click to /admin, #admin or internal hash navigation globally
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      // 1. Rota /admin e #admin (intacta e prioritária)
      if (href === '/admin' || href === '/admin/' || href === '#admin') {
        e.preventDefault();
        navigateTo('/admin');
        return;
      }

      // 2. Navegação por âncoras internas (#planos, #como-funciona, #projetos-essencial, etc.)
      if (href.startsWith('#') && href.length > 1 && !href.startsWith('#admin')) {
        const targetId = href.slice(1);
        e.preventDefault();

        const cleanHash = () => {
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        };

        if (targetId === 'inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          cleanHash();
          return;
        }

        // Se o destino for uma seção de projetos filtrada, assegura que a categoria seja exibida
        if (targetId === 'projetos-essencial') {
          setActiveCategoryTab((prev) => (prev === 'essencial' || prev === 'todos' ? prev : 'todos'));
        } else if (targetId === 'projetos-profissional') {
          setActiveCategoryTab((prev) => (prev === 'profissional' || prev === 'todos' ? prev : 'todos'));
        } else if (targetId === 'projetos-premium') {
          setActiveCategoryTab((prev) => (prev === 'premium' || prev === 'todos' ? prev : 'todos'));
        }

        requestAnimationFrame(() => {
          const el =
            document.getElementById(targetId) ||
            (targetId === 'como-funciona' ? document.getElementById('diferenciais') : null);

          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
          cleanHash();
        });
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Limpa fragmento (#) da URL mantendo a rolagem para a seção correspondente
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash !== '#admin' && hash !== '#/admin' && !hash.startsWith('#admin/')) {
      const targetId = hash.replace(/^#/, '');

      if (targetId === 'projetos-essencial') {
        setActiveCategoryTab('todos');
      } else if (targetId === 'projetos-profissional') {
        setActiveCategoryTab('todos');
      } else if (targetId === 'projetos-premium') {
        setActiveCategoryTab('todos');
      }

      requestAnimationFrame(() => {
        const el =
          document.getElementById(targetId) ||
          (targetId === 'como-funciona' ? document.getElementById('diferenciais') : null);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });

      // Remove o hash da barra de endereços imediatamente sem recarregar a página
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Commercial modal & flow states
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [selectedServiceLevel, setSelectedServiceLevel] = useState<ServiceLevelType | null>(null);
  const [selectedBriefingType, setSelectedBriefingType] = useState<string | null>(null);
  const [selectedProjectForBriefing, setSelectedProjectForBriefing] = useState<ProjectItem | null>(null);
  const [selectedInitialIntent, setSelectedInitialIntent] = useState<ModelIntentType>(null);
  const [selectedInitialDescription, setSelectedInitialDescription] = useState<string>('');
  const [originProjectForModal, setOriginProjectForModal] = useState<ProjectItem | null>(null);

  // Auxiliary modals
  const [advisorModalOpen, setAdvisorModalOpen] = useState<boolean>(false);
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);
  const [modalInitialStage, setModalInitialStage] = useState<BriefingStage>('presentation');

  // Handle mobile and browser back navigation seamlessly
  React.useEffect(() => {
    const handlePopState = () => {
      if (activeProject) {
        setActiveProject(null);
        setOriginProjectForModal(null);
      } else if (contactModalOpen) {
        if (originProjectForModal) {
          setContactModalOpen(false);
          setActiveProject(originProjectForModal);
          setOriginProjectForModal(null);
        } else {
          setContactModalOpen(false);
        }
      } else if (advisorModalOpen) {
        setAdvisorModalOpen(false);
      } else if (startModalOpen) {
        setStartModalOpen(false);
      } else if (activeCategoryTab !== 'todos') {
        setActiveCategoryTab('todos');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeProject, contactModalOpen, originProjectForModal, advisorModalOpen, startModalOpen, activeCategoryTab]);

  // Opens briefing modal with specified plan or briefing category
  const handleOpenBriefing = (level: ServiceLevelType | string | null = null) => {
    const validLevels: ServiceLevelType[] = [
      'Essencial',
      'Profissional',
      'Personalizado',
      'Premium',
    ];

    setOriginProjectForModal(null);
    setSelectedProjectForBriefing(null);
    setSelectedInitialIntent('custom_idea');
    setSelectedInitialDescription('');

    if (level && validLevels.includes(level as ServiceLevelType)) {
      setSelectedServiceLevel(level as ServiceLevelType);
      setSelectedBriefingType(null);
    } else if (level) {
      setSelectedServiceLevel('Personalizado');
      setSelectedBriefingType(level);
    } else {
      setSelectedServiceLevel('Essencial');
      setSelectedBriefingType(null);
    }

    setModalInitialStage('presentation');
    setContactModalOpen(true);
  };

  // Called when user selects a plan from PlansSection or PlanDetailModal
  const handleSelectPlan = (planId: PlanId, startAtBriefing = false) => {
    setOriginProjectForModal(null);
    setSelectedProjectForBriefing(null);
    setSelectedServiceLevel(planId);
    setSelectedBriefingType(null);
    setSelectedInitialIntent(planId === 'Personalizado' ? 'custom_idea' : 'exact');
    setSelectedInitialDescription('');
    setModalInitialStage(startAtBriefing ? 'briefing' : 'presentation');
    setContactModalOpen(true);
  };

  // Called when user clicks "Quero um site deste formato" on any project card or modal
  const handleSelectFormat = (project: ProjectItem) => {
    setOriginProjectForModal(null);
    setSelectedProjectForBriefing(project);
    setSelectedServiceLevel(project.tier as ServiceLevelType);
    setSelectedBriefingType(project.briefingType || project.clientIndustry || null);
    setSelectedInitialIntent(null); // will trigger intent choice step ("Quero este formato / Usar como inspiração / Ideia própria")
    setSelectedInitialDescription('');
    setModalInitialStage('presentation');
    setContactModalOpen(true);
  };

  // Called when user starts a custom project from Segments or Hero
  const handleStartCustomIdea = (segmentName?: string) => {
    setOriginProjectForModal(null);
    setSelectedProjectForBriefing(null);
    setSelectedServiceLevel('Personalizado');
    setSelectedBriefingType(segmentName || null);
    setSelectedInitialIntent('custom_idea');
    setSelectedInitialDescription(
      segmentName ? `Gostaria de um site para o segmento de ${segmentName}. ` : ''
    );
    setModalInitialStage('presentation');
    setContactModalOpen(true);
  };

  // Called when user wants to use a project as inspiration
  const handleUseAsInspiration = (project: ProjectItem) => {
    setOriginProjectForModal(project);
    setSelectedProjectForBriefing(project);
    setSelectedServiceLevel('Personalizado');
    setSelectedBriefingType(project.briefingType || project.clientIndustry || null);
    setSelectedInitialIntent('inspiration');
    setSelectedInitialDescription(
      `Gostaria de usar o projeto "${project.name}" (${project.category}) como inspiração para o meu site.`
    );
    setModalInitialStage('presentation');
    setContactModalOpen(true);
  };

  // Filtered Essencial projects
  const filteredEssencial = useMemo(() => {
    return ESSENCIAL_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered Profissional projects
  const filteredProfissional = useMemo(() => {
    return PROFISSIONAL_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered Premium projects
  const filteredPremium = useMemo(() => {
    return PREMIUM_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  if (isAdminView) {
    if (adminAuthStatus === 'checking') {
      return (
        <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center text-neutral-400 gap-3">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">
            Verificando autorização...
          </span>
        </div>
      );
    }

    if (adminAuthStatus === 'unauthenticated') {
      return (
        <AdminLogin
          onSuccess={() => {
            setAdminAuthStatus('authenticated');
          }}
          onBackToSite={() => {
            navigateTo('/');
          }}
        />
      );
    }

    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#08090C] flex items-center justify-center text-neutral-400 text-xs">
            Carregando painel...
          </div>
        }
      >
        <AdminDashboard
          onBackToSite={() => {
            navigateTo('/');
          }}
          onLogout={handleAdminLogout}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col font-sans selection:bg-amber-400/20 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        onOpenContact={handleOpenBriefing}
        onOpenAdvisor={() => setAdvisorModalOpen(true)}
        onStartProject={() => setStartModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Subtle, GPU-friendly background lights (pure CSS gradients, zero layout shift) */}
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.07) 0%, transparent 45%),
              radial-gradient(circle at 10% 35%, rgba(16, 185, 129, 0.04) 0%, transparent 35%),
              radial-gradient(circle at 90% 65%, rgba(245, 158, 11, 0.04) 0%, transparent 35%)
            `,
          }}
        />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. HERO SECTION & APRESENTAÇÃO
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative z-10 pt-8 sm:pt-12 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-3.5">
            {/* Tag Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-semibold tracking-wider uppercase text-neutral-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Portfólio Oficial NexaWeb · 22 Demonstrações no Ar</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-white font-display leading-[1.25] sm:leading-[1.18] max-w-3xl mx-auto">
              Sites Profissionais nos Planos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300 font-bold">
                Essencial
              </span>
              ,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 font-bold">
                Personalizado
              </span>
              ,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">
                Profissional
              </span>{' '}
              e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400 font-bold">
                Premium
              </span>
            </h1>

            {/* Subtitles */}
            <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Criação de sites profissionais para empresas, negócios e profissionais autônomos. Conheça as demonstrações publicadas pela NexaWeb e solicite um projeto sob medida para o seu segmento.
            </p>

            <p className="text-[11px] sm:text-xs text-neutral-400 max-w-xl mx-auto">
              Exemplos reais desenvolvidos com design moderno, alta velocidade, total adaptação para celulares e integração com seus canais de atendimento.
            </p>

            {/* Hero Main Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              {/* Primary "Criar meu site" button */}
              <button
                type="button"
                onClick={() => setStartModalOpen(true)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Criar meu site</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#planos"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
                  if (typeof window !== 'undefined' && window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <span>Conhecer os 4 Planos</span>
              </a>

              <button
                type="button"
                onClick={() => setAdvisorModalOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-neutral-400 hover:text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Me ajude a escolher</span>
              </button>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              2. BANNER / SHOWCASE AUTOMÁTICO
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div id="showcase" className="mt-7 sm:mt-10 scroll-mt-20">
            <ShowcaseBanner
              onSelectProject={(proj) => handleSelectFormat(proj)}
              onExplorePlans={() => {
                const element = document.getElementById('planos');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. FLUXO CENTRAL: ESCOLHA DE PLANOS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <PlansSection onSelectPlan={handleSelectPlan} />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. APRESENTAÇÃO DE SEGMENTOS & POSSIBILIDADES (Visualização Própria por Categoria)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <SegmentsShowcase
          onSelectFormat={handleSelectFormat}
          onPreviewProject={(proj) => setActiveProject(proj)}
          onUseAsInspiration={handleUseAsInspiration}
          onStartCustomProject={(segmentName) => {
            handleStartCustomIdea(segmentName);
          }}
        />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. CATÁLOGO / SHOWCASE DE DEMONSTRAÇÕES (22 PROJETOS REAIS)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="modelos"
          className="relative z-10 pt-6 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-800/60 scroll-mt-18"
        >
          {/* Header & Filter / Search Bar */}
          <div className="mb-6 space-y-3.5">
            <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Vitrine Oficial de Amostras
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white">
                  Demonstrações Reais no Ar
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                  Cada amostra funciona como referência visual do que entregamos. Você pode escolher exatamente o mesmo formato ou utilizá-lo como inspiração.
                </p>
              </div>

              {/* Live Search Input */}
              <div className="relative min-w-[220px] sm:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por segmento ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                />
              </div>
            </div>

            {/* Category Segmented Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('todos')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap inline-flex items-center justify-center ${
                  activeCategoryTab === 'todos'
                    ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                Todas as Amostras ({ALL_PROJECTS.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('essencial')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                  activeCategoryTab === 'essencial'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>Essencial ({ESSENCIAL_PROJECTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('personalizado')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                  activeCategoryTab === 'personalizado'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-300" />
                <span>Personalizado (Sob Medida)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('profissional')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                  activeCategoryTab === 'profissional'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-300" />
                <span>Profissional ({PROFISSIONAL_PROJECTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('premium')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                  activeCategoryTab === 'premium'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Premium ({PREMIUM_PROJECTS.length})</span>
              </button>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              PROJETOS ESSENCIAL (12 CARDS)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {(activeCategoryTab === 'todos' || activeCategoryTab === 'essencial') && (
            <div id="projetos-essencial" className="mb-10 sm:mb-12 scroll-mt-20">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  {activeCategoryTab !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => setActiveCategoryTab('todos')}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors mr-1"
                      title="Voltar para todas as amostras"
                      aria-label="Voltar para todas as amostras"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Amostras Essencial
                  </h3>
                  <span className="text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2 py-0.2 rounded-full font-bold">
                    12 Sites no Ar
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('Essencial')}
                  className="min-h-[44px] text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                >
                  <span>Ver plano Essencial</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ProjectCarouselSection
                projects={filteredEssencial}
                emptyMessage={`Nenhum projeto encontrado para "${searchQuery}".`}
                onPreview={(proj) => setActiveProject(proj)}
                onSelectFormat={handleSelectFormat}
                onSelectPlan={handleSelectPlan}
                onUseAsInspiration={handleUseAsInspiration}
              />
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              SOLUÇÃO PERSONALIZADA (SOB MEDIDA)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {(activeCategoryTab === 'todos' || activeCategoryTab === 'personalizado') && (
            <div id="personalizado" className="mb-10 sm:mb-12 scroll-mt-20">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/25 border border-purple-500/30 p-5 sm:p-7 lg:p-8 shadow-xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center gap-2">
                      {activeCategoryTab !== 'todos' && (
                        <button
                          type="button"
                          onClick={() => setActiveCategoryTab('todos')}
                          className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors mr-1 flex items-center justify-center"
                          title="Voltar para todas as amostras"
                          aria-label="Voltar para todas as amostras"
                        >
                          <ArrowLeft className="w-4 h-4 text-amber-400" />
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        <Sliders className="w-3 h-3" />
                        <span>Solução Sob Medida</span>
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-white">
                      Projeto Personalizado
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                      Um site criado sob medida para o seu negócio, com estilo visual configurável (Moderno, Minimalista, Elegante, Luxuoso ou Criativo), seções sob medida e recursos pensados especificamente para suas metas.
                    </p>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartCustomIdea()}
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:brightness-105 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                      >
                        <span>Abrir configurador sob medida</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-2">
                    <div className="text-[11px] uppercase font-bold tracking-wider text-purple-400">
                      O que você escolhe no briefing:
                    </div>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Estilo: Moderno, Minimalista, Elegante, Luxuoso ou Criativo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Seções: Início, Sobre, Serviços, Portfólio, Depoimentos, FAQ</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Funcionalidades: WhatsApp, Formulário, Galeria, Efeitos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Cores sugeridas ou paleta própria</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Referência de sites e descrição livre</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              PROJETOS PROFISSIONAL (3 CARDS)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {(activeCategoryTab === 'todos' || activeCategoryTab === 'profissional') && (
            <div id="projetos-profissional" className="mb-10 sm:mb-12 scroll-mt-20">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  {activeCategoryTab !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => setActiveCategoryTab('todos')}
                      className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors mr-1 flex items-center justify-center"
                      title="Voltar para todas as amostras"
                      aria-label="Voltar para todas as amostras"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Amostras Profissional
                  </h3>
                  <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                    3 Sites no Ar
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('Profissional')}
                  className="min-h-[44px] text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                >
                  <span>Ver plano Profissional</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ProjectCarouselSection
                projects={filteredProfissional}
                emptyMessage={`Nenhum projeto encontrado para "${searchQuery}".`}
                onPreview={(proj) => setActiveProject(proj)}
                onSelectFormat={handleSelectFormat}
                onSelectPlan={handleSelectPlan}
                onUseAsInspiration={handleUseAsInspiration}
              />
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              PROJETOS PREMIUM (7 CARDS)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {(activeCategoryTab === 'todos' || activeCategoryTab === 'premium') && (
            <div id="projetos-premium" className="mb-6 scroll-mt-20">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  {activeCategoryTab !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => setActiveCategoryTab('todos')}
                      className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors mr-1 flex items-center justify-center"
                      title="Voltar para todas as amostras"
                      aria-label="Voltar para todas as amostras"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Amostras Premium
                  </h3>
                  <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-full font-bold">
                    7 Sites Alto Padrão
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('Premium')}
                  className="min-h-[44px] text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  <span>Ver plano Premium</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ProjectCarouselSection
                projects={filteredPremium}
                emptyMessage={`Nenhum projeto encontrado para "${searchQuery}".`}
                onPreview={(proj) => setActiveProject(proj)}
                onSelectFormat={handleSelectFormat}
                onSelectPlan={handleSelectPlan}
                onUseAsInspiration={handleUseAsInspiration}
              />
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. DIFERENCIAIS TÉCNICOS & CONFIABILIDADE
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="diferenciais"
          className="relative z-10 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-800/60"
        >
          <div className="max-w-2xl mx-auto text-center space-y-2 mb-7">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
              Excelência Técnica
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Por que a NexaWeb é a escolha certa?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Desenvolvimento e criação de sites profissionais com design responsivo de alto nível, velocidade de carregamento e foco na conversão do seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Design Sob Medida</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Cada site respeita as características do segmento, com identidade marcante e foco em autoridade.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Velocidade e Estabilidade</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Carregamento ultra-rápido garantido por infraestrutura moderna em nuvem e imagens otimizadas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Conversão e Resultados</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hierarquia clara, chamadas estratégicas e canais diretos no WhatsApp para converter visitantes em clientes.
              </p>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. FINAL ACTION CALLOUT
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative z-10 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 p-6 sm:p-9 text-center space-y-3.5 shadow-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white">
              Pronto para ter um site como esses?
            </h2>
            <p className="text-neutral-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Descubra qual plano — Essencial, Personalizado, Profissional ou Premium — melhor atende ao seu momento e comece hoje mesmo.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStartModalOpen(true)}
                className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Criar meu site</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAdvisorModalOpen(true)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs sm:text-sm font-semibold border border-neutral-700 transition-colors"
              >
                Me ajude a escolher o plano
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Project Inspector Modal */}
      {activeProject && (
        <React.Suspense fallback={null}>
          <ProjectModal
            project={activeProject}
            onClose={() => {
              setActiveProject(null);
              setOriginProjectForModal(null);
            }}
            onOpenBriefing={handleOpenBriefing}
            onSelectPlan={handleSelectPlan}
            onSelectFormat={(proj) => {
              setOriginProjectForModal(proj);
              setActiveProject(null);
              handleSelectFormat(proj);
            }}
            onUseAsInspiration={(proj) => {
              setOriginProjectForModal(proj);
              setActiveProject(null);
              handleUseAsInspiration(proj);
            }}
          />
        </React.Suspense>
      )}

      {/* Centralized Briefing & Commercial Flow Modal */}
      {contactModalOpen && (
        <React.Suspense fallback={null}>
          <ContactModal
            isOpen={contactModalOpen}
            onClose={() => {
              setContactModalOpen(false);
              setSelectedServiceLevel(null);
              setSelectedBriefingType(null);
              setSelectedProjectForBriefing(null);
              setSelectedInitialIntent(null);
              setSelectedInitialDescription('');
              setActiveProject(null);
              setOriginProjectForModal(null);
            }}
            onBack={() => {
              if (originProjectForModal) {
                setContactModalOpen(false);
                setActiveProject(originProjectForModal);
                setOriginProjectForModal(null);
              } else {
                setContactModalOpen(false);
                setSelectedProjectForBriefing(null);
                setSelectedInitialIntent(null);
                setSelectedInitialDescription('');
              }
            }}
            onBackToProject={
              originProjectForModal
                ? () => {
                    setContactModalOpen(false);
                    setActiveProject(originProjectForModal);
                    setOriginProjectForModal(null);
                  }
                : undefined
            }
            serviceLevel={selectedServiceLevel}
            briefingType={selectedBriefingType}
            selectedProject={selectedProjectForBriefing}
            initialIntent={selectedInitialIntent}
            initialDescription={selectedInitialDescription}
            initialStage={modalInitialStage}
          />
        </React.Suspense>
      )}

      {/* Plan Advisor Wizard Modal */}
      {advisorModalOpen && (
        <React.Suspense fallback={null}>
          <PlanAdvisorModal
            isOpen={advisorModalOpen}
            onClose={() => setAdvisorModalOpen(false)}
            onSelectPlan={handleSelectPlan}
          />
        </React.Suspense>
      )}

      {/* Start Project ("Criar meu site") Modal */}
      {startModalOpen && (
        <React.Suspense fallback={null}>
          <StartProjectModal
            isOpen={startModalOpen}
            onClose={() => setStartModalOpen(false)}
            onChooseSample={() => {
              const element = document.getElementById('modelos');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            onChooseCustomIdea={() => {
              handleStartCustomIdea();
            }}
            onChoosePlanDirectly={() => {
              const element = document.getElementById('planos');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}
