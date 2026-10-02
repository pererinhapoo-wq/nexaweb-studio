import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  ArrowRight,
  Shield,
  Sliders,
  Award,
  Sparkles,
  Clock,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';
import { PLANS_DATA, type PlanId, type PlanDetailData } from '../data/plans';

export type { PlanId, PlanDetailData };
export { PLANS_DATA };

interface PlanDetailModalProps {
  planId: PlanId | null;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  planId,
  onClose,
  onSelectPlan,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(!!planId);
  useModalA11y({
    isOpen: !!planId,
    onClose,
    containerRef: modalRef,
  });

  if (!planId || !PLANS_DATA[planId] || typeof document === 'undefined') return null;

  const plan = PLANS_DATA[planId];

  const colorStyles = {
    blue: {
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      btn: 'bg-gradient-to-r from-blue-500 to-sky-400 text-neutral-950 hover:from-blue-400 hover:to-sky-300 shadow-blue-500/20',
      border: 'border-blue-500/30',
      check: 'text-blue-400',
    },
    purple: {
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      icon: <Sliders className="w-5 h-5 text-purple-400" />,
      btn: 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 text-neutral-950 hover:brightness-105 shadow-purple-500/20',
      border: 'border-purple-500/30',
      check: 'text-purple-400',
    },
    orange: {
      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      icon: <Award className="w-5 h-5 text-orange-400" />,
      btn: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 text-neutral-950 hover:brightness-105 shadow-orange-500/20',
      border: 'border-orange-500/30',
      check: 'text-orange-400',
    },
    amber: {
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      btn: 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 hover:from-amber-300 hover:to-amber-400 shadow-amber-400/20',
      border: 'border-amber-500/30',
      check: 'text-amber-400',
    },
  }[plan.accentColor];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
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
        className={`relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col bg-neutral-900 border rounded-3xl shadow-2xl overflow-hidden text-neutral-100 outline-none ${colorStyles.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed Top */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-neutral-800 bg-neutral-950/95 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              {colorStyles.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Plano {plan.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorStyles.badge}`}
                >
                  {plan.badge}
                </span>
              </div>
              <p className="text-xs text-neutral-400">{plan.tagline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Central Scrollable */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Price & Turnaround Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Investimento
              </span>
              <div className="text-2xl font-bold font-display text-white">
                {plan.price}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>Prazo: {plan.turnaroundTime}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Visão Geral
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {plan.description}
            </p>
          </div>

          {/* Target Audience */}
          <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              <span>Ideal Para</span>
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {plan.targetAudience}
            </p>
          </div>

          {/* Inclusions */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              O que está incluído
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.inclusions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                >
                  <Check className={`w-3.5 h-3.5 ${colorStyles.check} shrink-0 mt-0.5`} />
                  <span className="text-xs text-neutral-300 leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Differentials */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Diferenciais deste plano
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.differentials.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-neutral-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Fixed Bottom */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPlan(plan.id);
            }}
            className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 ${colorStyles.btn}`}
          >
            <span>Escolher este plano ({plan.name})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
