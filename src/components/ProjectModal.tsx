import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  Shield,
  CheckCircle2,
  Monitor,
  Smartphone,
  Globe,
  ArrowRight,
} from 'lucide-react';
import type { ProjectItem } from '../data/projects';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onOpenBriefing?: (briefingType?: string | null) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onOpenBriefing,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (project) {
      setViewMode('desktop');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [project]);

  if (!project) return null;

  const isPremium = project.tier === 'Premium';
  const isProfissional = project.tier === 'Profissional';

  const tierLabel = isPremium
    ? 'PREMIUM'
    : isProfissional
      ? 'PROFISSIONAL'
      : 'ESSENCIAL';

  const tierClass = isPremium
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    : isProfissional
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      : 'bg-blue-500/10 text-blue-300 border-blue-500/20';

  const handleBriefing = () => {
    onClose();

    if (onOpenBriefing) {
      onOpenBriefing(project.briefingType || project.clientIndustry || null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Visão geral do projeto ${project.name}`}
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl text-neutral-100">
        {/* HEADER */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider ${tierClass}`}
            >
              {tierLabel}
            </span>

            <h2 className="mt-1 text-xl sm:text-2xl font-bold font-display text-white truncate">
              {project.name}
            </h2>

            <p className="text-xs text-neutral-500 mt-0.5">
              {project.category}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* PREVIEW */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-semibold text-neutral-200">
                  Prévia do projeto
                </span>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'desktop'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
                  Desktop
                </button>

                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'mobile'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 inline mr-1.5" />
                  Mobile
                </button>
              </div>
            </div>

            <div
              className={`mx-auto overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all ${
                viewMode === 'mobile'
                  ? 'max-w-[390px]'
                  : 'w-full'
              }`}
            >
              {project.url && project.url !== '#' ? (
                <iframe
                  src={project.url}
                  title={`Prévia de ${project.name}`}
                  className={`w-full border-0 ${
                    viewMode === 'mobile'
                      ? 'h-[620px]'
                      : 'h-[520px] sm:h-[600px]'
                  }`}
                  loading="lazy"
                />
              ) : project.fallbackImage ? (
                <img
                  src={project.fallbackImage}
                  alt={project.name}
                  className="w-full h-[520px] object-cover"
                />
              ) : (
                <div className="h-[320px] sm:h-[420px] flex items-center justify-center">
                  <div className="text-center px-6">
                    <Globe className="w-10 h-10 mx-auto text-neutral-700 mb-3" />
                    <p className="text-sm text-neutral-500">
                      Prévia não disponível para este projeto.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* INFORMAÇÕES PRINCIPAIS */}
          <section className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div>
                <p className="text-sm leading-7 text-neutral-400">
                  {project.description}
                </p>
              </div>

              {/* DESTAQUES */}
              {project.highlights?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      Destaques da solução NexaWeb
                    </h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {project.highlights.map((highlight, index) => (
                      <div
                        key={`${highlight}-${index}`}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span className="text-xs leading-5 text-neutral-300">
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
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">
                      Estrutura que pode fazer parte do site
                    </h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {project.structure.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-900/70 border border-neutral-800"
                      >
                        <span className="w-5 h-5 shrink-0 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300">
                          {index + 1}
                        </span>

                        <span className="text-xs text-neutral-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PLANOS */}
              {project.plans && project.plans.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      Possibilidades de projeto
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {project.plans.map((plan) => (
                      <div
                        key={plan.name}
                        className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-white">
                            {plan.name}
                          </h4>

                          {plan.price && (
                            <span className="text-xs font-semibold text-amber-300">
                              {plan.price}
                            </span>
                          )}
                        </div>

                        <p className="text-xs leading-5 text-neutral-400">
                          {plan.text}
                        </p>

                        {plan.time && (
                          <p className="mt-3 text-[11px] text-neutral-500">
                            {plan.time}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="lg:border-l lg:border-neutral-800 lg:pl-6">
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-300">
                    Projeto demonstrativo
                  </span>
                </div>

                <p className="text-xs text-neutral-500 break-all leading-5">
                  {project.url && project.url !== '#'
                    ? project.url
                    : 'Endereço do projeto não disponível'}
                </p>

                {project.url && project.url !== '#' && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver projeto
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleBriefing}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition-all"
                >
                  Quero este tipo de site
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="mt-5 pt-5 border-t border-neutral-800">
                  <p className="text-[11px] leading-5 text-neutral-500">
                    O modelo apresentado é uma referência. A estrutura final
                    pode ser adaptada de acordo com o seu negócio e briefing.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
};
