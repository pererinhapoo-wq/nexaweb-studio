import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Layout,
  Lightbulb,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';

interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseSample: () => void;
  onChooseCustomIdea: () => void;
  onChoosePlanDirectly: () => void;
}

export const StartProjectModal: React.FC<StartProjectModalProps> = ({
  isOpen,
  onClose,
  onChooseSample,
  onChooseCustomIdea,
  onChoosePlanDirectly,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);
  useModalA11y({
    isOpen,
    onClose,
    containerRef: modalRef,
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                Como você deseja começar seu site?
              </h3>
              <p className="text-[11px] text-neutral-400">
                Selecione o ponto de partida ideal para o seu projeto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Starting Options */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* Option 1: Choose from existing samples */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChooseSample();
            }}
            className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Layout className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                      Escolher a partir de uma amostra
                    </p>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.2 rounded">
                      22 no ar
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Navegue por nossas demonstrações reais e escolha um formato pronto para adaptar com sua marca.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 shrink-0 mt-1 transition-colors" />
            </div>
          </button>

          {/* Option 2: Custom Idea */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChooseCustomIdea();
            }}
            className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-purple-400/50 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                      Tenho uma ideia própria / Projeto sob medida
                    </p>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 px-2 py-0.2 rounded">
                      Exclusivo
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Descreva livremente o que imagina (estilo, seções, cores e recursos) sem ficar preso a um modelo.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 shrink-0 mt-1 transition-colors" />
            </div>
          </button>

          {/* Option 3: Choose Plan directly */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChoosePlanDirectly();
            }}
            className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                      Escolher direto um dos 4 Planos
                    </p>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.2 rounded">
                      Comercial
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Compare Essencial, Personalizado, Profissional e Premium e veja o que está incluído.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-1 transition-colors" />
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
