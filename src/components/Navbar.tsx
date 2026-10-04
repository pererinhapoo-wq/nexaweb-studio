import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, ArrowUpRight, Sparkles, HelpCircle } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

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

  // Strictly lock background page scroll when mobile drawer is open
  useScrollLock(mobileMenuOpen);

  // Keyboard Escape listener for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

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

    const cleanHashUrl = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    if (targetId === 'inicio') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          cleanHashUrl();
        });
      });
      return;
    }
    // Let scroll unlock settle, then smoothly navigate to the target section
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el =
          document.getElementById(targetId) ||
          (targetId === 'como-funciona' ? document.getElementById('diferenciais') : null);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
        cleanHashUrl();
      });
    });
  };


  const handleStart = () => {
    setMobileMenuOpen(false);
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
              onClick={(e) => handleNavClick(e, 'inicio')}
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
              onClick={(e) => handleNavClick(e, 'planos')}
              className="text-white hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>Planos</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400/10 text-amber-300 border border-amber-400/20">
                4 opções
              </span>
            </a>

            <a
              href="#showcase"
              onClick={(e) => handleNavClick(e, 'showcase')}
              className="hover:text-neutral-100 transition-colors"
            >
              Showcase
            </a>

            <a
              href="#segmentos"
              onClick={(e) => handleNavClick(e, 'segmentos')}
              className="hover:text-neutral-100 transition-colors"
            >
              Segmentos
            </a>

            <a
              href="#modelos"
              onClick={(e) => handleNavClick(e, 'modelos')}
              className="hover:text-neutral-100 transition-colors flex items-center gap-1"
            >
              <span>Amostras</span>
              <span className="text-[10px] text-amber-400 font-mono">(22)</span>
            </a>

            <a
              href="#personalizado"
              onClick={(e) => handleNavClick(e, 'personalizado')}
              className="hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <span>Personalizado</span>
            </a>

            <a
              href="/portal"
              className="hover:text-neutral-100 transition-colors"
            >
              Área do Cliente
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
              className="sm:hidden min-h-[44px] px-3.5 py-2 rounded-lg bg-amber-400 text-neutral-950 text-xs font-bold shadow-sm inline-flex items-center justify-center"
            >
              Criar site
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
              aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer & Backdrop (Opens from the RIGHT, slides RIGHT-to-LEFT) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
              mobileMenuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
            }`}
            aria-hidden={!mobileMenuOpen}
            inert={!mobileMenuOpen ? true : undefined}
          >
            {/* Backdrop that dims the rest of the page and prevents touchmove on background */}
            <div
              className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                mobileMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={() => setMobileMenuOpen(false)}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              aria-hidden="true"
            />

            {/* Right Drawer Panel (opens from right, slides right-to-left, closes returning to right) */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu lateral de navegação"
              className={`fixed inset-y-0 right-0 w-[86vw] max-w-[320px] bg-neutral-950 border-l border-neutral-800 flex flex-col justify-between p-5 overflow-y-auto overscroll-contain shadow-2xl transition-transform duration-300 ease-in-out transform ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              onTouchMove={(e) => {
                e.stopPropagation();
              }}
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-neutral-900 p-[1px]">
                      <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center font-display font-extrabold text-amber-400 text-sm">
                        N
                      </div>
                    </div>
                    <span className="font-display font-bold text-lg text-white">NexaWeb</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                    aria-label="Fechar menu"
                  >
                    <X className="w-5 h-5 text-amber-400" />
                  </button>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col gap-2 pt-4 text-sm font-medium text-neutral-300">
                  <a
                    href="#inicio"
                    onClick={(e) => handleNavClick(e, 'inicio')}
                    className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-200 hover:text-white transition-colors text-xs font-semibold"
                  >
                    <span>🏠 Início</span>
                  </a>

                  <a
                    href="#planos"
                    onClick={(e) => handleNavClick(e, 'planos')}
                    className="text-white flex items-center justify-between p-3 min-h-[44px] rounded-xl bg-neutral-900/90 border border-neutral-800 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Ver os 4 Planos</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">Oficial</span>
                  </a>

                  <a
                    href="#como-funciona"
                    onClick={(e) => handleNavClick(e, 'como-funciona')}
                    className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    <span>📖 Como funciona</span>
                  </a>

                  <a
                    href="#showcase"
                    onClick={(e) => handleNavClick(e, 'showcase')}
                    className="min-h-[44px] flex items-center px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    Showcase Automático
                  </a>

                  <a
                    href="#segmentos"
                    onClick={(e) => handleNavClick(e, 'segmentos')}
                    className="min-h-[44px] flex items-center px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    Tipos de Sites & Segmentos
                  </a>

                  <a
                    href="#modelos"
                    onClick={(e) => handleNavClick(e, 'modelos')}
                    className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-200 transition-colors text-xs font-semibold"
                  >
                    <span>Amostras no Ar</span>
                    <span className="text-xs text-amber-400 font-bold font-mono">22 sites</span>
                  </a>

                  <a
                    href="#personalizado"
                    onClick={(e) => handleNavClick(e, 'personalizado')}
                    className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-200 transition-colors text-xs font-semibold"
                  >
                    <span>Plano Personalizado</span>
                    <span className="text-xs text-purple-400 font-bold">Sob Medida</span>
                  </a>

                  <a
                    href="#diferenciais"
                    onClick={(e) => handleNavClick(e, 'diferenciais')}
                    className="min-h-[44px] flex items-center px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors text-xs"
                  >
                    Diferenciais NexaWeb
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenContact(null);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-amber-300 transition-colors text-xs font-semibold text-left"
                  >
                    <span>📩 Contato</span>
                  </button>

                  <a
                    href="https://www.instagram.com/nexaw1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-900 text-pink-400/90 hover:text-pink-300 transition-colors text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span>📸 Instagram</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500" />
                  </a>

                  <a
                    href="/portal"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    <span>🔐 Área do Cliente</span>
                  </a>
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 space-y-2 border-t border-neutral-800/80">
                {onOpenAdvisor && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdvisor();
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Me ajude a escolher o plano</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-400/15"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Criar meu site</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
