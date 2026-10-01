import React from 'react';
import { ArrowUpRight, Sparkles, Shield, Award, ExternalLink, Eye } from 'lucide-react';
import type { ProjectItem } from '../data/projects';
import { ProjectCardImage } from './ProjectCardImage';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  onPreview: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onPreview }) => {
  const isPremium = project.tier === 'Premium';
  const isProfissional = project.tier === 'Profissional';

  // Determine border & glow styling
  const cardBorderClass = isPremium
    ? 'border-neutral-800/90 hover:border-amber-500/50 hover:shadow-amber-500/10'
    : isProfissional
    ? 'border-neutral-800/90 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
    : 'border-neutral-800/90 hover:border-blue-500/50 hover:shadow-blue-500/10';

  const categoryColorClass = isPremium
    ? 'text-amber-400/80'
    : isProfissional
    ? 'text-emerald-400/80'
    : 'text-blue-400/80';

  const titleHoverClass = isPremium
    ? 'group-hover:text-amber-200'
    : isProfissional
    ? 'group-hover:text-emerald-200'
    : 'group-hover:text-blue-200';

  const buttonGradientClass = isPremium
    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 shadow-amber-400/10 hover:shadow-amber-400/25 hover:brightness-105'
    : isProfissional
    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-neutral-950 shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:brightness-105'
    : 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-neutral-950 shadow-blue-500/10 hover:shadow-blue-500/25 hover:brightness-105';

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-3xl bg-neutral-900/85 backdrop-blur-xl border transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl ${cardBorderClass}`}
      aria-label={`Projeto ${project.name} - ${project.tier} NexaWeb`}
    >
      {/* Background ambient lighting on hover */}
      <div
        className={`absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-br ${project.accentColor} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
      />

      <div>
        {/* Visual Cover / Image Showcase */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
          <ProjectCardImage project={project} className="w-full h-full" />

          {/* Tier Identification Tag (Essencial, Profissional or Premium) */}
          <div className="absolute bottom-4 left-4 z-10">
            {isPremium && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-neutral-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg shadow-black/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>Premium</span>
              </div>
            )}
            {isProfissional && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-neutral-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg shadow-black/60">
                <Award className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                <span>Profissional</span>
              </div>
            )}
            {!isPremium && !isProfissional && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-neutral-950/90 text-blue-300 border border-blue-500/40 backdrop-blur-md shadow-lg shadow-black/60">
                <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                <span>Essencial</span>
              </div>
            )}
          </div>

          {/* Quick detail preview button on top corner */}
          <div className="absolute bottom-4 right-4 z-10">
            <button
              type="button"
              onClick={() => onPreview(project)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-950/80 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700/60 backdrop-blur-md transition-colors"
              title="Ver detalhes do projeto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detalhes</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 lg:p-8 flex flex-col gap-3.5">
          {/* Category & Counter */}
          <div className="flex items-center justify-between text-xs tracking-wider uppercase font-semibold text-neutral-400">
            <span className={categoryColorClass}>
              {project.category}
            </span>
            <span className="text-neutral-500 font-mono text-[11px]">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Project Name */}
          <h3
            className={`text-xl sm:text-2xl font-bold tracking-tight text-white font-display transition-colors ${titleHoverClass}`}
          >
            {project.name}
          </h3>

          {/* Brief Description */}
          <p className="text-neutral-300/90 text-sm leading-relaxed line-clamp-3">
            {project.description}
          </p>

          {/* Feature Highlights */}
          <div className="pt-2 flex flex-wrap gap-2">
            {project.highlights.map((feat) => (
              <span
                key={feat}
                className="text-xs text-neutral-300 bg-neutral-950/60 border border-neutral-800 rounded-lg px-2.5 py-1"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Actions Footer with prominent "Ver projeto" button */}
      <div className="p-6 sm:p-7 lg:p-8 pt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-neutral-800/60 mt-4">
        {/* Exact "Ver projeto" Button requested by user */}
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-[0.98] ${buttonGradientClass}`}
        >
          <span>Ver projeto</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        {/* Secondary Detail Inspector Button */}
        <button
          type="button"
          onClick={() => onPreview(project)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          <span>Visão Geral</span>
        </button>
      </div>
    </article>
  );
};
