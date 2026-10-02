import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Sparkles, Shield, Award, Sliders, HelpCircle, Layers } from 'lucide-react';

interface NavbarProps {
  onOpenContact: (level?: string | null) => void;
  onOpenAdvisor?: () => void;
  onStartProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenContact,
  onOpenAdvisor,
  onStartProject,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 24;
          if (isScrolled !== lastScrolled) {
            lastScrolled = isScrolled;
            setScrolled(isScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  const handleStart = () => {
    if (onStartProject) {
      onStartProject();
    } else {
      onOpenContact(null);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-lg shadow-black/40'
          : 'bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <a
              href="#inicio"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-neutral-900 p-[1px] shadow-md shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all">
                <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
                  <span className="font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 text-base sm:text-lg">
                    N
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-200 transition-colors">
                    NexaWeb
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <span className="text-[9px] tracking-widest uppercase font-semibold text-neutral-400 hidden xs:inline">
                  Desenvolvimento Web
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-neutral-300">
            <a
              href="#planos"
              className="text-white hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>Planos</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400/10 text-amber-300 border border-amber-400/20">
                4 opções
              </span>
            </a>

            <a
              href="#showcase"
              className="hover:text-neutral-100 transition-colors"
            >
              Showcase
            </a>

            <a
              href="#segmentos"
              className="hover:text-neutral-100 transition-colors"
            >
              Segmentos
            </a>

            <a
              href="#modelos"
              className="hover:text-neutral-100 transition-colors flex items-center gap-1"
            >
              <span>Amostras</span>
              <span className="text-[10px] text-amber-400 font-mono">(22)</span>
            </a>

            <a
              href="#personalizado"
              className="hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <span>Personalizado</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {onOpenAdvisor && (
              <button
                type="button"
                onClick={onOpenAdvisor}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-neutral-300 hover:text-amber-300 text-xs font-semibold transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Me ajude a escolher</span>
              </button>
            )}

            {/* Exact "Criar meu site" button requested in requirement 17 */}
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-400/15 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Criar meu site</span>
            </button>
          </div>

          {/* Mobile menu toggle & quick CTA */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleStart}
              className="sm:hidden px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 text-xs font-bold shadow-sm"
            >
              Criar site
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-800 bg-neutral-950/98 px-5 py-5 space-y-3.5 animate-fadeIn shadow-2xl">
          <nav className="flex flex-col gap-2 text-sm font-medium text-neutral-300">
            <a
              href="#planos"
              onClick={(e) => handleNavClick(e, 'planos')}
              className="text-white flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 font-semibold"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ver os 4 Planos</span>
              </span>
              <span className="text-[11px] text-amber-400 font-bold">Essencial / Personalizado / Prof / Premium</span>
            </a>

            <a
              href="#showcase"
              onClick={(e) => handleNavClick(e, 'showcase')}
              className="p-2 rounded-lg hover:bg-neutral-900 transition-colors text-xs"
            >
              Showcase Automático
            </a>

            <a
              href="#segmentos"
              onClick={(e) => handleNavClick(e, 'segmentos')}
              className="p-2 rounded-lg hover:bg-neutral-900 transition-colors text-xs"
            >
              Tipos de Sites & Segmentos
            </a>

            <a
              href="#modelos"
              onClick={(e) => handleNavClick(e, 'modelos')}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 text-neutral-200 transition-colors text-xs"
            >
              <span>Amostras no Ar</span>
              <span className="text-xs text-amber-400 font-bold">22 sites</span>
            </a>

            <a
              href="#personalizado"
              onClick={(e) => handleNavClick(e, 'personalizado')}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 text-neutral-200 transition-colors text-xs"
            >
              <span>Plano Personalizado</span>
              <span className="text-xs text-purple-400 font-bold">Sob Medida</span>
            </a>

            <a
              href="#diferenciais"
              onClick={(e) => handleNavClick(e, 'diferenciais')}
              className="p-2 rounded-lg hover:bg-neutral-900 text-neutral-400 transition-colors text-xs"
            >
              Diferenciais NexaWeb
            </a>
          </nav>

          <div className="pt-2 space-y-2">
            {onOpenAdvisor && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdvisor();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Me ajude a escolher o plano</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleStart();
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar meu site</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
