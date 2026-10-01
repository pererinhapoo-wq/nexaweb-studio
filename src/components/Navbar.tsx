import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, Sparkles, Shield } from 'lucide-react';

interface NavbarProps {
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-neutral-900 p-[1px] shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all">
                <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
                  <span className="font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 text-lg">
                    N
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white group-hover:text-amber-200 transition-colors">
                    NexaWeb
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-400">
                  Portfólio de Desenvolvimento Web
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <a
              href="#niveis-de-servico"
              className="text-white hover:text-amber-300 transition-colors font-semibold flex items-center gap-1.5"
            >
              <span>Níveis de Serviço</span>
            </a>
            <a
              href="#projetos-essencial"
              className="hover:text-blue-300 transition-colors flex items-center gap-1.5"
            >
              <span>Essencial</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                12
              </span>
            </a>
            <a
              href="#projetos-profissional"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1.5"
            >
              <span>Profissional</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                3
              </span>
            </a>
            <a
              href="#personalizado"
              className="hover:text-purple-300 transition-colors flex items-center gap-1.5"
            >
              <span>Personalizado</span>
            </a>
            <a
              href="#projetos-premium"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
            >
              <span>Projetos Premium</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                7
              </span>
            </a>
            <a
              href="#diferenciais"
              className="hover:text-neutral-100 transition-colors"
            >
              Diferenciais
            </a>
          </nav>

          {/* Action CTA */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs font-semibold tracking-wide transition-all hover:border-amber-500/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Solicitar Orçamento</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-6 py-6 space-y-4">
          <nav className="flex flex-col gap-3 text-base font-medium text-neutral-300">
            <a
              href="#niveis-de-servico"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white flex items-center justify-between p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 font-semibold"
            >
              <span>Níveis de Serviço</span>
              <span className="text-xs text-amber-400 font-bold">3 Opções</span>
            </a>
            <a
              href="#projetos-essencial"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white flex items-center justify-between p-2 rounded-lg bg-neutral-900/60"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Projetos Essencial</span>
              </span>
              <span className="text-xs text-blue-400 font-bold">12 sites</span>
            </a>
            <a
              href="#projetos-profissional"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white flex items-center justify-between p-2 rounded-lg bg-neutral-900/60"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Projetos Profissional</span>
              </span>
              <span className="text-xs text-emerald-400 font-bold">3 sites</span>
            </a>
            <a
              href="#personalizado"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white flex items-center justify-between p-2 rounded-lg bg-neutral-900/60"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Personalizado</span>
              </span>
              <span className="text-xs text-purple-400 font-bold">Sob Medida</span>
            </a>
            <a
              href="#projetos-premium"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white flex items-center justify-between p-2 rounded-lg bg-neutral-900/60"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Projetos Premium</span>
              </span>
              <span className="text-xs text-amber-400 font-bold">7 sites</span>
            </a>
            <a
              href="#diferenciais"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-900"
            >
              Diferenciais NexaWeb
            </a>
          </nav>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2"
            >
              <span>Solicitar Orçamento</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
