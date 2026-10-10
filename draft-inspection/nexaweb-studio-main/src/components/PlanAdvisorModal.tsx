import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  HelpCircle,
  Shield,
  Sliders,
  Award,
} from 'lucide-react';
import type { PlanId } from './PlanDetailModal';
import { PLANS_DATA } from './PlanDetailModal';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';

interface PlanAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void;
}

interface Question {
  title: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    pointsTo: PlanId;
  }[];
}

const QUESTIONS: Question[] = [
  {
    title: 'Qual é o momento e principal objetivo do seu site?',
    subtitle: 'Selecione a opção que melhor descreve sua necessidade atual.',
    options: [
      {
        label: 'Começar com presença profissional rápida e objetiva',
        description: 'Apresentar meus serviços, endereço, redes sociais e botão de WhatsApp.',
        pointsTo: 'Essencial',
      },
      {
        label: 'Projeto exclusivo sob medida com minhas próprias preferências',
        description: 'Quero escolher o estilo visual, seções e funcionalidades específicas.',
        pointsTo: 'Personalizado',
      },
      {
        label: 'Aumentar a autoridade e captação de clientes do meu negócio',
        description: 'Preciso de um site completo com catálogo, depoimentos, equipe e FAQ.',
        pointsTo: 'Profissional',
      },
      {
        label: 'Posicionamento de alto padrão, prestígio e estética impecável',
        description: 'Meu público é exigente e busco uma experiência visual memorável.',
        pointsTo: 'Premium',
      },
    ],
  },
  {
    title: 'Qual é a sua prioridade em termos de estrutura e prazo?',
    subtitle: 'Isso nos ajuda a alinhar a complexidade ideal para você.',
    options: [
      {
        label: 'Entrega ágil (3 a 5 dias) com investimento direto',
        description: 'Quero algo pronto com rapidez e ótimo custo-benefício.',
        pointsTo: 'Essencial',
      },
      {
        label: 'Total liberdade para definir cada detalhe do site',
        description: 'Não quero ficar preso a formatos pré-definidos.',
        pointsTo: 'Personalizado',
      },
      {
        label: 'Estrutura detalhada com blocos de conversão e credibilidade',
        description: 'Mais seções para explicar meus diferenciais e atrair contatos.',
        pointsTo: 'Profissional',
      },
      {
        label: 'Acabamento visual luxuoso com acompanhamento prioritário',
        description: 'Design refinado no mais alto nível de excelência técnica.',
        pointsTo: 'Premium',
      },
    ],
  },
];

export const PlanAdvisorModal: React.FC<PlanAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<PlanId[]>([]);
  const [recommendedPlan, setRecommendedPlan] = useState<PlanId | null>(null);

  useScrollLock(isOpen);
  useModalA11y({
    isOpen,
    onClose,
    containerRef: modalRef,
  });

  const handleSelectOption = (plan: PlanId) => {
    const nextAnswers = [...answers];
    nextAnswers[currentStep] = plan;
    setAnswers(nextAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate recommendation based on latest selection and previous votes
      const counts: Record<PlanId, number> = {
        Essencial: 0,
        Personalizado: 0,
        Profissional: 0,
        Premium: 0,
      };
      nextAnswers.forEach((ans) => {
        counts[ans] = (counts[ans] || 0) + 1;
      });

      // Find highest score or default to last answer
      let bestPlan: PlanId = plan;
      let maxScore = 0;
      (Object.keys(counts) as PlanId[]).forEach((p) => {
        if (counts[p] > maxScore) {
          maxScore = counts[p];
          bestPlan = p;
        }
      });

      setRecommendedPlan(bestPlan);
      setCurrentStep(QUESTIONS.length); // go to result step
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setRecommendedPlan(null);
  };

  const planInfo = recommendedPlan ? PLANS_DATA[recommendedPlan] : null;

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
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
        className="relative z-10 w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[92vh] max-h-[92dvh] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4 border-b border-neutral-800 bg-neutral-950/80 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                Assistente de Escolha NexaWeb
              </h3>
              <p className="text-[11px] text-neutral-400">
                Responda rápido para descobrir o plano ideal
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

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4.5 py-4 sm:p-7">
          {currentStep < QUESTIONS.length ? (
            <div className="space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
                <span>Pergunta {currentStep + 1} de {QUESTIONS.length}</span>
                <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-bold font-display text-white">
                  {QUESTIONS[currentStep].title}
                </h4>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  {QUESTIONS[currentStep].subtitle}
                </p>
              </div>

              {/* Options list */}
              <div className="space-y-2.5 pt-2">
                {QUESTIONS[currentStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt.pointsTo)}
                    className="w-full text-left p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-950 transition-all duration-200 group active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                          {opt.label}
                        </p>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-400 group-hover:border-amber-400 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : planInfo ? (
            /* Result recommendation */
            <div className="space-y-5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-semibold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recomendação Personalizada</span>
              </div>

              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  Plano Recomendado:{' '}
                  <span className="text-amber-400">{planInfo.name}</span>
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
                  {planInfo.tagline}. Com base nas suas respostas, esta é a opção que melhor atende às suas metas com o melhor custo-benefício.
                </p>
              </div>

              {/* Inclusions summary box */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Destaques incluídos para você:
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
                  {planInfo.inclusions.slice(0, 4).map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlan(planInfo.id);
                    onClose();
                  }}
                  className="w-full sm:flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-400/20 transition-all"
                >
                  <span>Continuar com Plano {planInfo.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Refazer teste
                </button>
              </div>
            </div>
          ) : null}
          {/* Bottom breathing space before pinned footer */}
          <div className="h-2 sm:h-0" aria-hidden="true" />
        </div>

        {/* Footer if on question step */}
        {currentStep > 0 && currentStep < QUESTIONS.length && (
          <div className="shrink-0 z-20 px-4.5 sm:px-7 py-3 sm:py-3.5 border-t border-neutral-800 bg-neutral-950/95 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all inline-flex items-center gap-2 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Pergunta anterior</span>
            </button>
            <span className="text-[11px] text-neutral-500 font-medium">
              Pergunta {currentStep + 1} de {QUESTIONS.length}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
