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

  const isRealUrl = Boolean(project.url && project.url !== '#' && project.url.startsWith('http'));

  return (
    <article
      className={`group relative flex flex-col justify-between h-full w-full rounded-2xl sm:rounded-3xl bg-neutral-900/90 border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl ${cardBorderClass}`}
      aria-label={`Projeto ${project.name} - ${project.tier} NexaWeb`}
    >
      <div className="flex flex-col flex-1">
        {/* 1. Header: [badge/categoria] [status] */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-neutral-950/90 border-b border-neutral-800/80 shrink-0">
          <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${categoryColorClass} truncate max-w-[60%]`}>
            {project.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isRealUrl ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
            <span className="text-[10px] sm:text-[11px] font-mono text-neutral-400">
              {isRealUrl ? 'Site no Ar' : 'Demonstração'}
            </span>
            <span className="text-neutral-600 font-mono text-[9px] sm:text-[10px] ml-1">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* 2. Middle: [imagem/captura] */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#08090C]">
          <ProjectCardImage project={project} className="w-full h-full" priority={index < 3} />
        </div>

        {/* 3. Toolbar: [badge do plano] [Visão Geral] */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-neutral-950/80 border-t border-b border-neutral-800/80 shrink-0">
          <div className="flex items-center">
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Premium</span>
              </span>
            )}
            {isProfissional && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Profissional</span>
              </span>
            )}
            {!isPremium && !isProfissional && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <Shield className="w-3 h-3 text-blue-400" />
                <span>Essencial</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPreview(project)}
            className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors shadow-sm"
            title="Ver detalhes do projeto"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Detalhes</span>
          </button>
        </div>

        {/* 4. Content Body - Standardized across all cards */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
          {/* Project Name */}
          <h4 className="text-sm sm:text-base font-bold tracking-tight text-white font-display line-clamp-1 shrink-0 transition-colors group-hover:text-amber-200">
            {project.name}
          </h4>

          {/* Description - Fixed 2-line height so all cards align identically */}
          <p className="text-neutral-300/85 text-[11px] sm:text-xs leading-relaxed line-clamp-2 h-[2.5rem] sm:h-[2.75rem] overflow-hidden shrink-0">
            {project.description}
          </p>

          {/* Feature Highlights - Standardized single row of pills */}
          <div className="flex flex-nowrap gap-1 sm:gap-1.5 h-[26px] overflow-hidden items-center shrink-0">
            {project.highlights.slice(0, 3).map((feat) => (
              <span
                key={feat}
                className="text-[10px] sm:text-[11px] text-neutral-300 bg-neutral-950/70 border border-neutral-800/80 rounded-md px-1.5 sm:px-2 py-0.5 whitespace-nowrap shrink-0 max-w-[140px] truncate"
              >
                {feat}
              </span>
            ))}
            {project.highlights.length > 3 && (
              <span className="text-[9px] sm:text-[10px] text-neutral-400 self-center whitespace-nowrap shrink-0">
                +{project.highlights.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Card Actions Footer with "Quero um site deste formato", "Ver site no ar" and "Usar como inspiração" */}
      <div className="p-3.5 sm:p-4 pt-0 flex flex-col gap-1.5 sm:gap-2 border-t border-neutral-800/60 mt-auto shrink-0">
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
            className={`flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all active:scale-[0.98] ${buttonGradientClass}`}
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
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
              title="Abrir demonstração no ar"
            >
              <span>Ver site no ar</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors active:scale-[0.98]"
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
            className="w-full min-h-[42px] sm:min-h-[38px] py-2 sm:py-1.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-[11px] sm:text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Usar este projeto como inspiração</span>
          </button>
        )}
      </div>
    </article>
  );
};
