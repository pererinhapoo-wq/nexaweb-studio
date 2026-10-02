import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Globe, Sparkles, Monitor } from 'lucide-react';
import type { ProjectItem } from '../data/projects';
import { getManualImageForProject } from '../data/projectOverrides';

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
  const [manualOverride, setManualOverride] = useState<string | null>(() =>
    getManualImageForProject(project.id)
  );

  // Listen to manual image updates from Admin in real-time
  useEffect(() => {
    const handleUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<{ projectId?: string }>;
      if (!customEvent?.detail?.projectId || customEvent.detail.projectId === project.id) {
        setManualOverride(getManualImageForProject(project.id));
      }
    };

    window.addEventListener('nexaweb:overrides-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nexaweb:overrides-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [project.id]);

  const effectiveManualImage = manualOverride || project.fallbackImage || '';

  const isRealUrl = Boolean(
    project.url &&
    project.url !== '#' &&
    (project.url.startsWith('http://') || project.url.startsWith('https://'))
  );

  // Automated capture URL from project.url (WordPress mshots - responsive tailored resolution)
  const primaryCaptureUrl = useMemo(() => {
    if (!isRealUrl) return '';
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(project.url)}?w=600&h=375`;
  }, [project.url, isRealUrl]);

  // Secondary automated capture URL fallback if WordPress mshots is unavailable
  const secondaryCaptureUrl = useMemo(() => {
    if (!isRealUrl) return '';
    return `https://api.microlink.io?url=${encodeURIComponent(project.url)}&screenshot=true&meta=false&embed=screenshot.url`;
  }, [project.url, isRealUrl]);

  // Determine initial attempt source based on:
  // 1. Automatic capture (if real URL)
  // 2. Manual image
  // 3. Clean placeholder
  const [attemptSource, setAttemptSource] = useState<'primary' | 'secondary' | 'manual' | 'placeholder'>(() => {
    if (isRealUrl) {
      const cached = imageStatusCache.get(project.url);
      if (cached === 'error') {
        return effectiveManualImage ? 'manual' : 'placeholder';
      }
      return 'primary';
    }
    if (effectiveManualImage) return 'manual';
    return 'placeholder';
  });

  // Re-evaluate attempt source if manualOverride changes
  useEffect(() => {
    if (effectiveManualImage && (!isRealUrl || attemptSource === 'placeholder')) {
      setAttemptSource('manual');
    }
  }, [effectiveManualImage, isRealUrl]);

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
    if (attemptSource === 'manual' && effectiveManualImage) return effectiveManualImage;
    return '';
  }, [attemptSource, primaryCaptureUrl, secondaryCaptureUrl, effectiveManualImage]);

  const handleImageError = () => {
    if (attemptSource === 'primary') {
      // Try secondary screenshot capture
      setAttemptSource('secondary');
    } else if (attemptSource === 'secondary') {
      // Try manual image if exists, otherwise clean placeholder
      if (effectiveManualImage && effectiveManualImage.trim() !== '') {
        setAttemptSource('manual');
      } else {
        if (project.url) imageStatusCache.set(project.url, 'error');
        setAttemptSource('placeholder');
      }
    } else if (attemptSource === 'manual') {
      if (project.url) imageStatusCache.set(project.url, 'error');
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
          bg: 'from-amber-500/15 via-neutral-900 to-neutral-950',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        }
      : project.tier === 'Profissional'
      ? {
          text: 'text-emerald-400',
          bg: 'from-emerald-500/15 via-neutral-900 to-neutral-950',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        }
      : {
          text: 'text-blue-400',
          bg: 'from-blue-500/15 via-neutral-900 to-neutral-950',
          badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#090b0e] select-none ${className}`}
    >
      {/* Main image presentation or elegant placeholder without overlapping text */}
      {attemptSource !== 'placeholder' && activeImageSrc && isInView ? (
        <div className="w-full h-full relative flex items-center justify-center bg-[#07080a]">
          <img
            key={activeImageSrc}
            src={activeImageSrc}
            alt={`Captura da demonstração ${project.name} - NexaWeb`}
            width={600}
            height={375}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Skeleton while image is loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95 animate-pulse">
              <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-amber-400 animate-spin mb-2" />
              <span className="text-[11px] font-mono text-neutral-500">
                Carregando demonstração...
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Fallback placeholder: Clean, sophisticated presentation with ZERO text collision */
        <div
          className={`w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br ${tierAccent.bg}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-neutral-900/90 border border-neutral-800/90 flex items-center justify-center shadow-inner mb-2">
            <Monitor className={`w-5 h-5 ${tierAccent.text}`} />
          </div>
          <span className="text-xs font-semibold text-neutral-200 tracking-wide font-display">
            Modelo Conceitual
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
            Pronto para personalização
          </span>
        </div>
      )}
    </div>
  );
};
