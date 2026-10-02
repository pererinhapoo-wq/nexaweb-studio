import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Globe, Sparkles } from 'lucide-react';
import type { ProjectItem } from '../data/projects';

// Global cache across mounts for instant load and error memory
const imageStatusCache = new Map<string, 'loaded' | 'error'>();

interface ProjectCardImageProps {
  project: ProjectItem;
  className?: string;
  priority?: boolean;
}

export const ProjectCardImage: React.FC<ProjectCardImageProps> = ({
  project,
  className = '',
  priority = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(priority);

  const isRealUrl = Boolean(
    project.url &&
    project.url !== '#' &&
    (project.url.startsWith('http://') || project.url.startsWith('https://'))
  );

  // Automated capture URL from project.url (WordPress mshots - free, fast, no API key needed)
  const primaryCaptureUrl = useMemo(() => {
    if (!isRealUrl) return '';
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(project.url)}?w=800&h=500`;
  }, [project.url, isRealUrl]);

  // Secondary automated capture URL fallback if WordPress mshots is unavailable
  const secondaryCaptureUrl = useMemo(() => {
    if (!isRealUrl) return '';
    return `https://api.microlink.io?url=${encodeURIComponent(project.url)}&screenshot=true&meta=false&embed=screenshot.url`;
  }, [project.url, isRealUrl]);

  // Determine initial attempt source
  const [attemptSource, setAttemptSource] = useState<'primary' | 'secondary' | 'fallback' | 'placeholder'>(() => {
    if (!isRealUrl) return 'placeholder';
    const cached = imageStatusCache.get(project.url);
    if (cached === 'error') {
      return project.fallbackImage ? 'fallback' : 'placeholder';
    }
    return 'primary';
  });

  const [imageLoaded, setImageLoaded] = useState<boolean>(() => {
    return isRealUrl && imageStatusCache.get(project.url) === 'loaded';
  });

  // Extract clean hostname safely for the simulated browser bar
  const displayHostname = useMemo(() => {
    if (!isRealUrl) return 'nexaweb.com.br';
    try {
      return new URL(project.url).hostname.replace(/^www\./, '');
    } catch {
      return 'nexaweb.com.br';
    }
  }, [project.url, isRealUrl]);

  // IntersectionObserver for lazy loading images only when near viewport
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '120px 0px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Current image source to load
  const activeImageSrc = useMemo(() => {
    if (attemptSource === 'primary') return primaryCaptureUrl;
    if (attemptSource === 'secondary') return secondaryCaptureUrl;
    if (attemptSource === 'fallback' && project.fallbackImage) return project.fallbackImage;
    return '';
  }, [attemptSource, primaryCaptureUrl, secondaryCaptureUrl, project.fallbackImage]);

  const handleImageError = () => {
    if (attemptSource === 'primary') {
      // Try secondary screenshot capture
      setAttemptSource('secondary');
    } else if (attemptSource === 'secondary') {
      // Try manual fallback if exists, otherwise placeholder
      if (project.fallbackImage && project.fallbackImage.trim() !== '') {
        setAttemptSource('fallback');
      } else {
        imageStatusCache.set(project.url, 'error');
        setAttemptSource('placeholder');
      }
    } else if (attemptSource === 'fallback') {
      imageStatusCache.set(project.url, 'error');
      setAttemptSource('placeholder');
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (isRealUrl) {
      imageStatusCache.set(project.url, 'loaded');
    }
  };

  const tierAccent =
    project.tier === 'Premium'
      ? {
          text: 'text-amber-400',
          bg: 'from-amber-500/20 via-neutral-900 to-neutral-950',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        }
      : project.tier === 'Profissional'
      ? {
          text: 'text-emerald-400',
          bg: 'from-emerald-500/20 via-neutral-900 to-neutral-950',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        }
      : {
          text: 'text-blue-400',
          bg: 'from-blue-500/20 via-neutral-900 to-neutral-950',
          badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#0a0c10] select-none ${className}`}
    >
      {/* Simulated browser chrome header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-red-500/80 transition-colors" />
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-amber-500/80 transition-colors" />
          <span className="w-2 h-2 rounded-full bg-neutral-700/80 group-hover:bg-emerald-500/80 transition-colors" />
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800/80 text-[10px] font-mono text-neutral-400 max-w-[180px] sm:max-w-[220px] truncate">
          <Globe className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
          <span className="truncate">{displayHostname}</span>
        </div>

        <span className={`text-[9px] font-bold tracking-wider uppercase ${tierAccent.text}`}>
          {project.tier}
        </span>
      </div>

      {/* Main image presentation or elegant placeholder */}
      {attemptSource !== 'placeholder' && activeImageSrc && isInView ? (
        <div className="w-full h-full pt-7 pb-0.5 relative flex items-center justify-center">
          <img
            key={activeImageSrc}
            src={activeImageSrc}
            alt={`Captura da demonstração ${project.name} - NexaWeb`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-contain object-top bg-[#08090C] transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Skeleton while image is loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 pt-7 flex flex-col items-center justify-center bg-neutral-900/95 animate-pulse">
              <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-amber-400 animate-spin mb-2" />
              <span className="text-[11px] font-mono text-neutral-500">
                Gerando captura ao vivo...
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Fallback placeholder: Domain-tailored clean layout, never shows broken image */
        <div
          className={`w-full h-full pt-8 p-4 flex flex-col justify-between bg-gradient-to-br ${tierAccent.bg}`}
        >
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
              {project.category}
            </span>
            <h4 className="text-base sm:text-lg font-bold font-display text-white">
              {project.name}
            </h4>
            <p className="text-xs text-neutral-400 line-clamp-2">
              {project.tagline || project.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${tierAccent.text}`} />
              <span className="text-[11px] font-medium text-neutral-300">
                Demonstração NexaWeb
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              100% Responsivo
            </span>
          </div>
        </div>
      )}

      {/* Subtle bottom gradient shadow for contrast */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />
    </div>
  );
};
