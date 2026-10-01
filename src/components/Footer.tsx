import React from 'react';
import { ArrowUpRight, Shield, Zap, Sparkles, Award } from 'lucide-react';
import { ESSENCIAL_PROJECTS, PROFISSIONAL_PROJECTS, PREMIUM_PROJECTS } from '../data/projects';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-display font-extrabold text-neutral-950 text-base">
                N
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                NexaWeb
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Desenvolvimento de sites e plataformas digitais para diversos nichos de mercado.
              Apresentando 22 projetos reais desenvolvidos para potencializar negócios nas
              categorias Essencial, Profissional e Premium.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1 text-blue-400">
                <Shield className="w-3.5 h-3.5" />
                12 Essencial
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Award className="w-3.5 h-3.5" />
                3 Profissional
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-purple-400">
                <Zap className="w-3.5 h-3.5" />
                Personalizado
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                7 Premium
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                100% Responsivo
              </span>
            </div>
          </div>

          {/* Essencial Projects Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>Projetos Essencial</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {ESSENCIAL_PROJECTS.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{p.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-blue-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Profissional Projects Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Award className="w-3 h-3" />
              <span>Projetos Profissional</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {PROFISSIONAL_PROJECTS.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{p.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Projects Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Projetos Premium</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {PREMIUM_PROJECTS.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{p.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} NexaWeb. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span>Desenvolvido com excelência pela</span>
            <span className="text-neutral-300 font-semibold">NexaWeb</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
