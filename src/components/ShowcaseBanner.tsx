import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Shield,
  Award,
  Globe,
  Monitor,
} from 'lucide-react';
import { ALL_PROJECTS, type ProjectItem } from '../data/projects';

interface ShowcaseBannerProps {
  onSelectProject?: (project: ProjectItem) => void;
  onExplorePlans?: (tier?: string) => void;
}

// Curated highlights for the automatic showcase banner
const SHOWCASE_IDS = [
  'academia-premium',
  'imobiliaria-premium',
  'engenharia-premium',
  'loja-premium',
  'kings-barber',
  'restaurante-sabor-brasa',
  'influenciador',
  'clinica-premium',
];

export const ShowcaseBanner: React.FC<ShowcaseBannerProps> = ({
  onSelectProject,
  onExplorePlans,
}) => {
  const showcaseProjects = useMemo(() => {
    return SHOWCASE_IDS.map((id) =>
      ALL_PROJECTS.find((p) => p.id === id)
    ).filter((p): p is ProjectItem => !!p);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentProject = showcaseProjects[currentIndex] || showcaseProjects[0];
  const nextIndex = (currentIndex + 1) % showcaseProjects.length;
  const nextProject = showcaseProjects[nextIndex];

  const getScreenshotUrl = (url: string) => {
    if (!url || url === '#' || !url.startsWith('http')) return '';
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=900&h=560`;
  };

  const currentScreenshot = useMemo(
    () => getScreenshotUrl(currentProject.url),
    [currentProject.url]
  );
  const nextScreenshot = useMemo(
    () => getScreenshotUrl(nextProject.url),
    [nextProject.url]
  );

  // Preload NEXT image only (avoids loading all simultaneously)
  useEffect(() => {
    if (nextScreenshot) {
      const img = new Image();
      img.src = nextScreenshot;
    }
  }, [nextScreenshot]);

  // Handle slide step
  const handleNext = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % showcaseProjects.length);
  }, [showcaseProjects.length]);

  const handlePrev = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) =>
      prev === 0 ? showcaseProjects.length - 1 : prev - 1
    );
  }, [showcaseProjects.length]);

  // Auto transition every 4.5 seconds if not paused
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  const tierBadge = useMemo(() => {
    if (currentProject.tier === 'Premium') {
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        text: 'Nível Premium',
      };
    }
    if (currentProject.tier === 'Profissional') {
      return {
        icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        text: 'Nível Profissional',
      };
    }
    return {
      icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      text: 'Nível Essencial',
    };
  }, [currentProject.tier]);

  const cleanDomain = useMemo(() => {
    try {
      return new URL(currentProject.url).hostname.replace(/^www\./, '');
    } catch {
      return 'nexaweb.com.br';
    }
  }, [currentProject.url]);

  return (
    <div
      className="relative w-full rounded-2xl sm:rounded-3xl bg-neutral-900/85 border border-neutral-800/90 overflow-hidden shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top subtle highlight banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-neutral-800/80 bg-neutral-950/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-neutral-300">
            Showcase de Projetos Publicados
          </span>
          <span className="text-neutral-500 hidden sm:inline">·</span>
          <span className="text-neutral-400 hidden sm:inline">
            Demonstrações reais no ar
          </span>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5">
          {showcaseProjects.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setImageLoaded(false);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-amber-400'
                  : 'w-2 bg-neutral-700 hover:bg-neutral-500'
              }`}
              aria-label={`Ver slide ${p.name}`}
            />
          ))}
        </div>
      </div>

      {/* Main Showcase Stage */}
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Project Info & Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${tierBadge.badge}`}
            >
              {tierBadge.icon}
              <span>{tierBadge.text}</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              {currentProject.category}
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              {currentProject.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-amber-300/90">
              {currentProject.tagline || 'Presença digital profissional e responsiva.'}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300/90 leading-relaxed line-clamp-3">
            {currentProject.description}
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentProject.highlights.slice(0, 3).map((h) => (
              <span
                key={h}
                className="text-[11px] text-neutral-300 bg-neutral-950/70 border border-neutral-800 rounded-lg px-2.5 py-1"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {currentProject.url && currentProject.url !== '#' && (
              <a
                href={currentProject.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/15 active:scale-[0.98] transition-all"
              >
                <span>Ver projeto ao vivo</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (onExplorePlans) {
                  onExplorePlans(currentProject.tier);
                } else if (onSelectProject) {
                  onSelectProject(currentProject);
                }
              }}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs sm:text-sm font-semibold transition-colors active:scale-[0.98]"
            >
              <span>Escolher plano</span>
            </button>
          </div>

          {/* Slide Navigation arrows & quick index */}
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Projeto {currentIndex + 1} de {showcaseProjects.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Projeto anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Próximo projeto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Device Mockup Frame with Live Capture */}
        <div className="lg:col-span-7">
          <div className="relative mx-auto max-w-2xl rounded-2xl bg-neutral-950 border-2 border-neutral-700/80 shadow-2xl p-2 sm:p-3">
            {/* Laptop Chrome Bar */}
            <div className="flex items-center justify-between pb-2 px-2 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 max-w-[240px] truncate">
                <Globe className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate">{cleanDomain}</span>
              </div>

              <div className="flex items-center gap-1 text-neutral-500">
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </div>
            </div>

            {/* Screen Content */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-neutral-900 mt-2">
              {currentScreenshot ? (
                <>
                  <img
                    key={currentProject.id}
                    src={currentScreenshot}
                    alt={`Prévia do projeto ${currentProject.name}`}
                    loading="eager"
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover object-top transition-opacity duration-500 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900">
                      <div className="w-7 h-7 rounded-full border-2 border-neutral-700 border-t-amber-400 animate-spin mb-2" />
                      <span className="text-xs font-mono text-neutral-500">
                        Carregando {currentProject.name}...
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                  <Sparkles className="w-8 h-8 text-amber-400 mb-2" />
                  <h4 className="text-lg font-bold text-white font-display">
                    {currentProject.name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    {currentProject.description}
                  </p>
                </div>
              )}

              {/* Click to open full preview directly */}
              {currentProject.url && currentProject.url !== '#' && (
                <a
                  href={currentProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-950/85 hover:bg-neutral-900 text-white border border-neutral-700/80 text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  <span>Abrir demonstração</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Laptop Stand Base / subtle lip */}
            <div className="mt-2 mx-auto w-24 h-1 rounded-full bg-neutral-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
