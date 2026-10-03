import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ExternalLink,
  Sparkles,
  Shield,
  Award,
  CheckCircle2,
  Monitor,
  Smartphone,
  Globe,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { ProjectItem } from '../data/projects';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onOpenBriefing?: (briefingType?: string | null) => void;
  onSelectPlan?: (tier: ProjectItem['tier']) => void;
  onSelectFormat?: (project: ProjectItem) => void;
  onUseAsInspiration?: (project: ProjectItem) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onOpenBriefing,
  onSelectPlan,
  onSelectFormat,
  onUseAsInspiration,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  useScrollLock(!!project);
  useModalA11y({
    isOpen: !!project,
    onClose,
    containerRef: modalRef,
  });

  useEffect(() => {
    if (project) {
      setViewMode('desktop');
    }
  }, [project]);

  if (!project || typeof document === 'undefined') return null;

  const isPremium = project.tier === 'Premium';
  const isProfissional = project.tier === 'Profissional';

  const tierLabel = isPremium
    ? 'PREMIUM'
    : isProfissional
    ? 'PROFISSIONAL'
    : 'ESSENCIAL';

  const tierClass = isPremium
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    : isProfissional
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    : 'bg-blue-500/10 text-blue-300 border-blue-500/30';

  const handleAction = () => {
    if (onSelectFormat) {
      onSelectFormat(project);
    } else if (onSelectPlan) {
      onSelectPlan(project.tier);
    } else if (onOpenBriefing) {
      onOpenBriefing(project.briefingType || project.clientIndustry || project.tier);
    } else {
      onClose();
    }
  };

  const isRealUrl = project.url && project.url !== '#' && project.url.startsWith('http');

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Visão geral do projeto ${project.name}`}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-5xl max-h-[92vh] max-h-[92dvh] bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl text-neutral-100 flex flex-col overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="shrink-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-7 py-3 sm:py-3.5 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800">
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border shrink-0 ${tierClass}`}
              >
                {tierLabel}
              </span>
              <span className="text-xs text-neutral-400 truncate">
                {project.category}
              </span>
            </div>
            <h2 className="text-base sm:text-2xl font-bold font-display text-white truncate mt-1">
              {project.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[38px] min-w-[38px] p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-7 space-y-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* PREVIEW */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <Monitor className="w-3.5 h-3.5 text-neutral-400" />
                <span>Prévia ao vivo da demonstração</span>
              </div>

              {isRealUrl && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'desktop'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Monitor className="w-3 h-3 inline mr-1" />
                    Desktop
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'mobile'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Smartphone className="w-3 h-3 inline mr-1" />
                    Mobile
                  </button>
                </div>
              )}
            </div>

            <div
              className={`mx-auto overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all ${
                viewMode === 'mobile' ? 'max-w-[360px]' : 'w-full'
              }`}
            >
              {isRealUrl ? (
                <iframe
                  src={project.url}
                  title={`Prévia de ${project.name}`}
                  className={`w-full border-0 ${
                    viewMode === 'mobile'
                      ? 'h-[500px]'
                      : 'h-[360px] sm:h-[480px]'
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="h-[260px] sm:h-[340px] flex items-center justify-center p-6 text-center">
                  <div>
                    <Globe className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                    <p className="text-sm font-semibold text-white">
                      {project.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* INFORMAÇÕES PRINCIPAIS & SIDEBAR */}
          <section className="grid lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Sobre este projeto
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-neutral-300">
                  {project.description}
                </p>
              </div>

              {/* DESTAQUES */}
              {project.highlights?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Destaques da solução</span>
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {project.highlights.map((highlight, index) => (
                      <div
                        key={`${highlight}-${index}`}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <span className="text-xs text-neutral-300">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ESTRUTURA */}
              {project.structure && project.structure.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Estrutura recomendada para este segmento</span>
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {project.structure.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60"
                      >
                        <span className="w-4 h-4 shrink-0 rounded-full bg-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs text-neutral-300 truncate">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR CTA */}
            <aside className="lg:border-l lg:border-neutral-800 lg:pl-6 space-y-4">
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 sm:p-5 space-y-3">
                <div className="text-xs font-semibold text-neutral-300">
                  Pronto para ter um site como este?
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Este modelo faz parte do plano{' '}
                  <strong className="text-white">{project.tier}</strong> da NexaWeb.
                  Você pode escolher exatamente este formato ou personalizá-lo.
                </p>

                {isRealUrl ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition-colors"
                  >
                    <span>Ver site no ar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400">
                    <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span>Projeto conceito de portfólio. Solicite este mesmo padrão para o seu site.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAction}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
                >
                  <span>Quero um site deste formato</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onUseAsInspiration && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseAsInspiration(project);
                    }}
                    className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 text-xs font-semibold border border-purple-500/25 transition-colors active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Usar como inspiração (Sob medida)</span>
                  </button>
                )}
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
