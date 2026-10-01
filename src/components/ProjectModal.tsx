import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Sparkles, Shield, CheckCircle2, Monitor, Smartphone, Globe } from 'lucide-react';
import type { ProjectItem } from '../data/projects';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showLiveIframe, setShowLiveIframe] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const isPremium = project.tier === 'Premium';
  const isProfissional = project.tier === 'Profissional';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/85 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col text-neutral-100">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Premium
              </span>
            )}
            {isProfissional && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
                Profissional
              </span>
            )}
            {!isPremium && !isProfissional && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <Shield className="w-3.5 h-3.5" />
                Essencial
              </span>
            )}
            <span className="text-sm text-neutral-400 font-medium hidden sm:inline">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
          {/* Visual Container */}
          <div className="flex justify-center w-full">
            <div
              className={`transition-all duration-300 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl relative ${
                deviceMode === 'desktop' ? 'w-full aspect-[16/10]' : 'w-[340px] aspect-[9/16]'
              }`}
            >
              {/* Browser mockup bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300 bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800 max-w-[280px] truncate">
                  <Globe className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{project.url}</span>
                </div>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors text-[11px] font-medium flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Nova aba</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Live iframe or Screenshot preview */}
              {showLiveIframe ? (
                <iframe
                  src={project.url}
                  title={`Demonstração do site ${project.name}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="relative w-full h-full group">
                  <img
                    src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(project.url)}?w=1200&h=750`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = project.fallbackImage;
                    }}
                    alt={project.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6">
                    <p className={`text-sm font-medium ${isPremium ? 'text-amber-300' : 'text-blue-300'}`}>
                      {project.tagline}
                    </p>
                    <h4 className="text-2xl font-bold text-white font-display">{project.name}</h4>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
            <div className="lg:col-span-2 space-y-4">
              <h3 id="modal-title" className="text-3xl font-bold font-display text-white">
                {project.name}
              </h3>
              <p className="text-neutral-300 text-base leading-relaxed">{project.description}</p>

              <div className="space-y-3 pt-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  Destaques da Solução NexaWeb
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-sm text-neutral-200"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isPremium
                            ? 'text-amber-400'
                            : isProfissional
                            ? 'text-emerald-400'
                            : 'text-blue-400'
                        }`}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar CTA */}
            <div className="flex flex-col justify-between p-6 rounded-2xl bg-neutral-950 border border-neutral-800 gap-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Endereço Oficial do Projeto
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Site desenvolvido e hospedado em infraestrutura de alta velocidade pela NexaWeb.
                </p>
                <div className="text-xs text-neutral-300 font-mono bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 break-all">
                  {project.url}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowLiveIframe(!showLiveIframe)}
                  className="w-full py-2.5 px-4 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                >
                  {showLiveIframe ? 'Ver Captura Visual' : 'Testar Navegação Interativa'}
                </button>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg transition-all ${
                    isPremium
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-amber-500/20'
                      : isProfissional
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-neutral-950 shadow-blue-500/20'
                  }`}
                >
                  <span>Ver projeto</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
