import React from 'react';
import { ArrowUpRight, Shield, Sparkles, Award, Sliders, CheckCircle2, Instagram } from 'lucide-react';
import { ESSENCIAL_PROJECTS, PROFISSIONAL_PROJECTS, PREMIUM_PROJECTS } from '../data/projects';
import { NEXAWEB_CONTACT } from '../config/contact';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-display font-extrabold text-neutral-950 text-sm">
                N
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                NexaWeb
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              Desenvolvimento de sites profissionais para diferentes segmentos. 22 projetos no portfólio oficial (15 demonstrações reais no ar nas categorias Essencial, Personalizado, Profissional e Premium).
            </p>

            {/* Official Instagram Channel */}
            <div className="pt-1">
              <a
                href={NEXAWEB_CONTACT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-purple-500/25 text-xs font-semibold text-neutral-200 hover:text-white transition-all hover:scale-[1.02]"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram Oficial @nexaw1</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-500" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 text-blue-400">
                <Shield className="w-3 h-3" />
                12 Essencial
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-purple-400">
                <Sliders className="w-3 h-3" />
                Personalizado
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Award className="w-3 h-3" />
                3 Profissional
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3 h-3" />
                7 Premium
              </span>
            </div>
          </div>

          {/* Essencial Projects Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Essencial</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              {ESSENCIAL_PROJECTS.slice(0, 5).map((p) => (
                <li key={p.id}>
                  {p.url && p.url !== '#' ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-300 transition-colors inline-flex items-center gap-1 group truncate max-w-full"
                    >
                      <span className="truncate">{p.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-blue-400 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-neutral-500 truncate block">{p.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Profissional & Personalizado */}
          <div className="space-y-2.5">
            <h3 className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Profissional</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              {PROFISSIONAL_PROJECTS.map((p) => (
                <li key={p.id}>
                  {p.url && p.url !== '#' ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-300 transition-colors inline-flex items-center gap-1 group truncate max-w-full"
                    >
                      <span className="truncate">{p.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-emerald-400 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-neutral-500 truncate block">{p.name}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <a
                href="#personalizado"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('personalizado')?.scrollIntoView({ behavior: 'smooth' });
                  if (typeof window !== 'undefined' && window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1.5 py-1.5 min-h-[40px]"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Plano Personalizado</span>
              </a>
            </div>
          </div>

          {/* Premium Projects Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              {PREMIUM_PROJECTS.slice(0, 5).map((p) => (
                <li key={p.id}>
                  {p.url && p.url !== '#' ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 group truncate max-w-full"
                    >
                      <span className="truncate">{p.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-neutral-500 truncate block">{p.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} NexaWeb. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2 text-emerald-400/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Plataformas Seguras & Otimizadas</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
