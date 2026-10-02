import React from 'react';
import { ArrowUpRight, Sparkles, Shield, Award, ExternalLink, Eye, ArrowRight } from 'lucide-react';
import type { ProjectItem } from '../data/projects';
import { ProjectCardImage } from './ProjectCardImage';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  onPreview: (project: ProjectItem) => void;
  onSelectFormat?: (project: ProjectItem) => void;
  onSelectPlan?: (tier: ProjectItem['tier']) => void;
  onUseAsInspiration?: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  onPreview,
  onSelectFormat,
  onUseAsInspiration,
}) => {
  const isPremium = project.tier === 'Premium';
  const isProfissional = project.tier === 'Profissional';

  // Card theme styling
  const cardBorderClass = isPremium
    ? 'border-neutral-800/80 hover:border-amber-500/40 hover:shadow-amber-500/10'
    : isProfissional
    ? 'border-neutral-800/80 hover:border-emerald-500/40 hover:shadow-emerald-500/10'
    : 'border-neutral-800/80 hover:border-blue-500/40 hover:shadow-blue-500/10';

  const categoryColorClass = isPremium
    ? 'text-amber-400'
    : isProfissional
    ? 'text-emerald-400'
    : 'text-blue-400';

  const buttonGradientClass = isPremium
    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 shadow-md shadow-amber-400/15 hover:brightness-105'
    : isProfissional
    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/15 hover:brightness-105'
    : 'bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 text-neutral-950 shadow-md shadow-blue-500/15 hover:brightness-105';

  const isRealUrl = project.url && project.url !== '#' && project.url.startsWith('http');

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-neutral-900/90 border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 ${cardBorderClass}`}
      aria-label={`Projeto ${project.name} - ${project.tier} NexaWeb`}
    >
      <div>
        {/* Cover / Image Showcase */}
        <div className="relative aspect-[16/10] w-full">
          <ProjectCardImage project={project} className="w-full h-full" priority={index < 3} />

          {/* Tier badge indicator */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-neutral-950/90 text-amber-300 border border-amber-500/40 shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Premium</span>
              </span>
            )}
            {isProfissional && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-neutral-950/90 text-emerald-300 border border-emerald-500/40 shadow-md">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Profissional</span>
              </span>
            )}
            {!isPremium && !isProfissional && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-neutral-950/90 text-blue-300 border border-blue-500/40 shadow-md">
                <Shield className="w-3 h-3 text-blue-400" />
                <span>Essencial</span>
              </span>
            )}
          </div>

          {/* Quick detail preview button */}
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-950/85 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700/60 shadow-sm transition-colors"
              title="Ver detalhes do projeto"
            >
              <Eye className="w-3 h-3" />
              <span>Visão Geral</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
          {/* Category & Index */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] tracking-wider uppercase font-semibold">
            <span className={categoryColorClass}>{project.category}</span>
            <span className="text-neutral-500 font-mono text-[9px] sm:text-[10px]">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Project Name */}
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-white font-display line-clamp-1 transition-colors group-hover:text-amber-200">
            {project.name}
          </h3>

          {/* Description */}
          <p className="text-neutral-300/85 text-[11px] sm:text-xs leading-relaxed line-clamp-2">
            {project.description}
          </p>

          {/* Feature Highlights */}
          <div className="pt-0.5 flex flex-wrap gap-1 sm:gap-1.5">
            {project.highlights.slice(0, 3).map((feat) => (
              <span
                key={feat}
                className="text-[10px] sm:text-[11px] text-neutral-300 bg-neutral-950/70 border border-neutral-800/80 rounded-md px-1.5 sm:px-2 py-0.5"
              >
                {feat}
              </span>
            ))}
            {project.highlights.length > 3 && (
              <span className="text-[9px] sm:text-[10px] text-neutral-400 self-center">
                +{project.highlights.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer with "Quero um site deste formato", "Ver site no ar" and "Usar como inspiração" */}
      <div className="p-3.5 sm:p-5 pt-0 flex flex-col gap-1.5 sm:gap-2 border-t border-neutral-800/60 mt-1 sm:mt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
          {/* Main Commercial Action: Quero um site deste formato */}
          <button
            type="button"
            onClick={() => {
              if (onSelectFormat) {
                onSelectFormat(project);
              } else {
                onPreview(project);
              }
            }}
            className={`flex-1 min-h-[42px] sm:min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-[0.98] ${buttonGradientClass}`}
          >
            <span>Quero um site deste formato</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Secondary: Ver site no ar */}
          {isRealUrl ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
              title="Abrir demonstração no ar"
            >
              <span>Ver site no ar</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="min-h-[38px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
            >
              <span>Detalhes</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>

        {onUseAsInspiration && (
          <button
            type="button"
            onClick={() => onUseAsInspiration(project)}
            className="w-full min-h-[34px] sm:min-h-[36px] py-1 sm:py-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-[10px] sm:text-[11px] font-semibold text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Usar este projeto como inspiração</span>
          </button>
        )}
      </div>
    </article>
  );
};
