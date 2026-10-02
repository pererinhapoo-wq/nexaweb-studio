import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectItem } from '../data/projects';
import { ProjectCard } from './ProjectCard';

interface ProjectCarouselSectionProps {
  projects: ProjectItem[];
  emptyMessage?: string;
  onPreview: (project: ProjectItem) => void;
  onSelectFormat?: (project: ProjectItem) => void;
  onSelectPlan?: (tier: ProjectItem['tier']) => void;
  onUseAsInspiration?: (project: ProjectItem) => void;
}

export const ProjectCarouselSection: React.FC<ProjectCarouselSectionProps> = ({
  projects,
  emptyMessage = 'Nenhum projeto encontrado.',
  onPreview,
  onSelectFormat,
  onSelectPlan,
  onUseAsInspiration,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Monitor horizontal scroll position on mobile to update current indicator
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 14 // width + gap
      : 300;
    const newIndex = Math.round(el.scrollLeft / cardWidth);
    if (newIndex !== activeMobileIndex && newIndex >= 0 && newIndex < projects.length) {
      setActiveMobileIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 14
      : 300;
    el.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveMobileIndex(index);
  };

  if (projects.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
        {emptyMessage}
      </div>
    );
  }

  const isSingle = projects.length === 1;

  return (
    <div className="relative">
      {/* 
        Responsive Container:
        - Mobile: Horizontal scroll carousel with scroll-snap and peek
        - Tablet/Desktop (sm+): Regular clean multi-column grid
      */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`${
          isSingle
            ? 'flex justify-center sm:grid sm:grid-cols-2 lg:grid-cols-3'
            : 'flex sm:grid sm:grid-cols-2 lg:grid-cols-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory scrollbar-none px-4 -mx-4 sm:px-0 sm:mx-0'
        } gap-3.5 sm:gap-5`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={`${
              isSingle
                ? 'w-full max-w-[340px] sm:max-w-none'
                : 'w-[84vw] max-w-[325px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink'
            } flex flex-col`}
          >
            <ProjectCard
              project={project}
              index={index}
              onPreview={onPreview}
              onSelectFormat={onSelectFormat}
              onSelectPlan={onSelectPlan}
              onUseAsInspiration={onUseAsInspiration}
            />
          </div>
        ))}
      </div>

      {/* Mobile-only Carousel Navigation Controls */}
      {projects.length > 1 && (
        <div className="flex sm:hidden items-center justify-between pt-2 px-1 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-300">
              {activeMobileIndex + 1} de {projects.length}
            </span>
            <span className="text-[10px] text-neutral-500">· Deslize para o lado</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(0, activeMobileIndex - 1))}
              disabled={activeMobileIndex === 0}
              className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 disabled:opacity-30 disabled:pointer-events-none active:bg-neutral-800"
              aria-label="Projeto anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(projects.length - 1, activeMobileIndex + 1))}
              disabled={activeMobileIndex === projects.length - 1}
              className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 disabled:opacity-30 disabled:pointer-events-none active:bg-neutral-800"
              aria-label="Próximo projeto"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
