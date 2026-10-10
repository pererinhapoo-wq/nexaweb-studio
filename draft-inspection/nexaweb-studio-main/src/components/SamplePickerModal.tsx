import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Layout,
  Search,
  Sparkles,
  Shield,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { ALL_PROJECTS, type ProjectItem } from '../data/projects';
import { ProjectCardImage } from './ProjectCardImage';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';

interface SamplePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSelectFormat: (project: ProjectItem) => void;
  onPreviewProject?: (project: ProjectItem) => void;
}

export const SamplePickerModal: React.FC<SamplePickerModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSelectFormat,
  onPreviewProject,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'todos' | 'essencial' | 'profissional' | 'premium'
  >('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollLock(isOpen);
  useModalA11y({
    isOpen,
    onClose,
    containerRef: modalRef,
  });

  // Filtered projects based on active category and search query
  const filteredProjects = useMemo(() => {
    return ALL_PROJECTS.filter((proj) => {
      // Category filter
      if (activeCategoryTab !== 'todos') {
        if (proj.tier.toLowerCase() !== activeCategoryTab) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = proj.name.toLowerCase().includes(query);
        const matchesCat = proj.category.toLowerCase().includes(query);
        const matchesDesc = proj.description?.toLowerCase().includes(query);
        const matchesIndustry = proj.clientIndustry?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesDesc && !matchesIndustry) {
          return false;
        }
      }

      return true;
    });
  }, [activeCategoryTab, searchQuery]);

  // Reset current index when category filter or search query changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategoryTab, searchQuery]);

  // Safeguard index within bounds
  useEffect(() => {
    if (filteredProjects.length > 0 && currentIndex >= filteredProjects.length) {
      setCurrentIndex(0);
    }
  }, [filteredProjects.length, currentIndex]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (filteredProjects.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + filteredProjects.length) % filteredProjects.length);
  }, [filteredProjects.length]);

  const handleNext = useCallback(() => {
    if (filteredProjects.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % filteredProjects.length);
  }, [filteredProjects.length]);

  // Pause autoplay temporarily on manual interaction and auto-resume after inactivity
  const pauseAutoplayTemporarily = useCallback(() => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 7000);
  }, []);

  // Automatic slide progression (respects prefers-reduced-motion)
  useEffect(() => {
    if (!isOpen || isPaused || filteredProjects.length <= 1) return;

    // Check system preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredProjects.length);
    }, 4800);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, filteredProjects.length]);

  // Clean resume timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  // Touch swipe gesture handlers (mobile swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    pauseAutoplayTemporarily();
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartXRef.current - touchEndX;
    const deltaY = touchStartYRef.current - touchEndY;

    // Detect horizontal swipe if deltaX is significant and predominantly horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const countEssencial = ALL_PROJECTS.filter((p) => p.tier === 'Essencial').length;
  const countProfissional = ALL_PROJECTS.filter((p) => p.tier === 'Profissional').length;
  const countPremium = ALL_PROJECTS.filter((p) => p.tier === 'Premium').length;

  const currentProject = filteredProjects[currentIndex] || null;

  const isPremium = currentProject?.tier === 'Premium';
  const isProfissional = currentProject?.tier === 'Profissional';
  const isPersonalizado = (currentProject?.tier as string) === 'Personalizado';

  const tierBadge = isPremium
    ? {
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        categoryColor: 'text-amber-400',
        buttonGradient:
          'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 shadow-md shadow-amber-400/20 hover:brightness-105 active:scale-[0.98]',
      }
    : isProfissional
    ? {
        icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        categoryColor: 'text-emerald-400',
        buttonGradient:
          'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20 hover:brightness-105 active:scale-[0.98]',
      }
    : isPersonalizado
    ? {
        icon: <Lightbulb className="w-3.5 h-3.5 text-purple-400" />,
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        categoryColor: 'text-purple-400',
        buttonGradient:
          'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500 text-neutral-950 shadow-md shadow-purple-500/20 hover:brightness-105 active:scale-[0.98]',
      }
    : {
        icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
        badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        categoryColor: 'text-blue-400',
        buttonGradient:
          'bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 text-neutral-950 shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-[0.98]',
      };

  const isRealUrl = Boolean(
    currentProject?.url &&
    currentProject.url !== '#' &&
    (currentProject.url.startsWith('http://') || currentProject.url.startsWith('https://'))
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl lg:max-w-3xl max-h-[92vh] max-h-[92dvh] bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-neutral-800 bg-neutral-950/90 z-20">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Layout className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base font-bold font-display text-white truncate">
                  Escolher a partir de uma Amostra
                </h3>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.2 rounded-full shrink-0 hidden xs:inline-block">
                  {ALL_PROJECTS.length} no ar
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400 truncate mt-0.5">
                Vitrine interativa de demonstrações reais publicadas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0"
            aria-label="Fechar seletor de amostras"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Category Filter Tabs & Segment Search */}
        <div className="shrink-0 px-3 sm:px-6 py-2 sm:py-2.5 border-b border-neutral-800/80 bg-neutral-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Category Filter Tabs: 4-col responsive grid on mobile so all 4 tabs (including Premium) are 100% visible */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x">
            <button
              type="button"
              onClick={() => {
                pauseAutoplayTemporarily();
                setActiveCategoryTab('todos');
              }}
              className={`min-h-[30px] sm:min-h-[32px] px-1 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center ${
                activeCategoryTab === 'todos'
                  ? 'bg-neutral-100 text-neutral-950 shadow-sm font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <span>Todas ({ALL_PROJECTS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                pauseAutoplayTemporarily();
                setActiveCategoryTab('essencial');
              }}
              className={`min-h-[30px] sm:min-h-[32px] px-1 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                activeCategoryTab === 'essencial'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-blue-300 hover:border-neutral-700'
              }`}
            >
              <Shield className="w-3 h-3 text-blue-400 shrink-0 hidden xs:inline-block" />
              <span>Essencial ({countEssencial})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                pauseAutoplayTemporarily();
                setActiveCategoryTab('profissional');
              }}
              className={`min-h-[30px] sm:min-h-[32px] px-1 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                activeCategoryTab === 'profissional'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-300 hover:border-neutral-700'
              }`}
            >
              <Award className="w-3 h-3 text-emerald-400 shrink-0 hidden xs:inline-block" />
              <span>Profissional ({countProfissional})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                pauseAutoplayTemporarily();
                setActiveCategoryTab('premium');
              }}
              className={`min-h-[30px] sm:min-h-[32px] px-1 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                activeCategoryTab === 'premium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-neutral-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0 hidden xs:inline-block" />
              <span>Premium ({countPremium})</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative min-w-[170px] sm:w-56 shrink-0">
            <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por segmento..."
              value={searchQuery}
              onChange={(e) => {
                pauseAutoplayTemporarily();
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-7 pr-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-400/50 transition-colors"
            />
          </div>
        </div>

        {/* Carousel Showcase Body */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentProject ? (
            <div className="w-full flex flex-col space-y-2.5 sm:space-y-4 animate-fadeIn">
              {/* Top Card Navigation Bar: Counter & Previous/Next Buttons */}
              <div className="shrink-0 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-300">
                    {currentIndex + 1} <span className="text-neutral-600">/</span>{' '}
                    {filteredProjects.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      pauseAutoplayTemporarily();
                      handlePrev();
                    }}
                    className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/80 text-neutral-200 hover:text-white transition-all active:scale-[0.96] flex items-center justify-center cursor-pointer shadow-sm"
                    aria-label="Demonstração anterior"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      pauseAutoplayTemporarily();
                      handleNext();
                    }}
                    className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/80 text-neutral-200 hover:text-white transition-all active:scale-[0.96] flex items-center justify-center cursor-pointer shadow-sm"
                    aria-label="Próxima demonstração"
                    title="Próxima"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Featured Showcase Card */}
              <div className="w-full rounded-2xl bg-neutral-950/90 border border-neutral-800/90 overflow-hidden shadow-xl p-3 sm:p-5 flex flex-col space-y-3 sm:space-y-4">
                {/* 1. Imagem / Prévia do Site */}
                <div className="relative w-full aspect-[16/9] max-h-[195px] sm:max-h-[260px] rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 group/image">
                  <ProjectCardImage project={currentProject} priority={true} />

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-sm ${tierBadge.badge}`}
                    >
                      {tierBadge.icon}
                      <span>{currentProject.tier}</span>
                    </span>
                  </div>

                  {isRealUrl && (
                    <div className="absolute bottom-2 right-2 z-10">
                      <a
                        href={currentProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-950/85 hover:bg-neutral-900 border border-neutral-800 text-[10px] font-semibold text-neutral-300 hover:text-white transition-colors backdrop-blur-sm"
                        aria-label={`Abrir demonstração ${currentProject.name} em nova aba`}
                      >
                        <span>Ver site no ar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Informações Principais: Nome e Categoria */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] uppercase font-bold tracking-wider ${tierBadge.categoryColor}`}
                    >
                      {currentProject.category}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-xl font-bold font-display text-white truncate">
                    {currentProject.name}
                  </h4>

                  {currentProject.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {currentProject.description}
                    </p>
                  )}
                </div>

                {/* 3. Destaques principais do modelo (visíveis em telas um pouco maiores) */}
                {currentProject.highlights && currentProject.highlights.length > 0 && (
                  <div className="hidden sm:flex flex-wrap gap-1.5 pt-0.5">
                    {currentProject.highlights.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{item}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* 4. Ações: "Quero um site deste formato" e "Detalhes" */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Botão de conversão principal */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectFormat(currentProject);
                    }}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all inline-flex items-center justify-center gap-2 ${tierBadge.buttonGradient}`}
                  >
                    <span>Quero um site deste formato</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Botão secundário de inspeção/prévia */}
                  <button
                    type="button"
                    onClick={() => {
                      onPreviewProject?.(currentProject);
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-neutral-400" />
                    <span>Detalhes</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 sm:py-16 text-center space-y-3">
              <p className="text-sm font-semibold text-neutral-300">
                Nenhuma demonstração encontrada para &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  pauseAutoplayTemporarily();
                  setSearchQuery('');
                  setActiveCategoryTab('todos');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
              >
                Limpar filtros de busca
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-3.5 sm:px-6 py-2.5 sm:py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <span>
            Exibindo <strong>{currentIndex + 1}</strong> de{' '}
            <strong>{filteredProjects.length}</strong>
          </span>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>← Voltar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
