import React, { useState } from 'react';
import { Globe, ImageOff } from 'lucide-react';
import type { ProjectItem } from '../data/projects';

interface ProjectCardImageProps {
  project: ProjectItem;
  className?: string;
}

export const ProjectCardImage: React.FC<ProjectCardImageProps> = ({ project, className = '' }) => {
  // Primary: Live homepage capture from mshots
  // Secondary fallback: Curated high-res domain photography
  const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(project.url)}?w=1200&h=750`;
  
  const [currentSrc, setCurrentSrc] = useState<string>(screenshotUrl);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const handleError = () => {
    if (!usingFallback) {
      setUsingFallback(true);
      setCurrentSrc(project.fallbackImage);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
      {/* Subtle simulated browser chrome */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3.5 py-2 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-red-500/80 transition-colors" />
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-amber-500/80 transition-colors" />
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-emerald-500/80 transition-colors" />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800/70 text-[10px] font-mono text-neutral-400 max-w-[190px] sm:max-w-[240px] truncate">
          <Globe className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
          <span className="truncate">
  {project.url === '#' ? 'NexaWeb' : new URL(project.url).hostname}
</span>
        </div>

        <span className="text-[10px] font-semibold tracking-wider text-neutral-400">
          {project.tier === 'Premium' && (
            <span className="text-amber-400/90 font-medium">PREMIUM</span>
          )}
          {project.tier === 'Profissional' && (
            <span className="text-emerald-400/90 font-medium">PROFISSIONAL</span>
          )}
          {project.tier === 'Essencial' && (
            <span className="text-blue-400/90 font-medium">ESSENCIAL</span>
          )}
        </span>
      </div>

      {/* Image with seamless fallback */}
      <img
        src={currentSrc}
        alt={`Visual do site ${project.name} - NexaWeb`}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover object-top transition-all duration-700 ease-out group-hover:scale-105 ${
          imageLoaded ? 'opacity-100 brightness-[0.92] group-hover:brightness-100' : 'opacity-0'
        }`}
      />

      {/* Loading placeholder skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
          <div className="text-center p-4 space-y-2">
            <div className="w-8 h-8 rounded-full bg-neutral-800 mx-auto animate-spin border-2 border-neutral-600 border-t-amber-400" />
            <p className="text-xs text-neutral-500 font-mono">Carregando visual...</p>
          </div>
        </div>
      )}

      {/* Gradient vignette for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />
    </div>
  );
};
