import React, { useState } from 'react';
import {
  Shield,
  Sliders,
  Award,
  Sparkles,
  Check,
  ArrowRight,
  Info,
  HelpCircle,
  Eye,
} from 'lucide-react';
import type { PlanId } from './PlanDetailModal';
import { PlanDetailModal, PLANS_DATA } from './PlanDetailModal';
import { PlanAdvisorModal } from './PlanAdvisorModal';

interface PlansSectionProps {
  onSelectPlan: (planId: PlanId) => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ onSelectPlan }) => {
  const [detailModalPlan, setDetailModalPlan] = useState<PlanId | null>(null);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);

  const plans: PlanId[] = ['Essencial', 'Personalizado', 'Profissional', 'Premium'];

  return (
    <section
      id="planos"
      className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Planos Oficiais NexaWeb</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight">
          Escolha o Plano Ideal
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-neutral-300/90 leading-relaxed max-w-2xl mx-auto">
          Veja o que está incluído em cada plano antes de escolher. Você preenche um briefing centralizado e nós cuidamos de todo o desenvolvimento.
        </p>

        {/* Guided Assistant Prompt */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setAdvisorModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-amber-300 hover:text-amber-200 text-xs font-semibold shadow-sm transition-all hover:border-amber-400/40 active:scale-[0.98]"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Ainda não sabe qual escolher? Me ajude a escolher</span>
          </button>
        </div>
      </div>

      {/* 4 Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
        {plans.map((planId) => {
          const plan = PLANS_DATA[planId];
          const isEssencial = planId === 'Essencial';
          const isPersonalizado = planId === 'Personalizado';
          const isProfissional = planId === 'Profissional';
          const isPremium = planId === 'Premium';

          const cardTheme = isPremium
            ? {
                border: 'border-neutral-800 hover:border-amber-500/50',
                badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                btn: 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 hover:from-amber-300 hover:to-amber-400 shadow-amber-400/15',
                icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                accentText: 'text-amber-400',
              }
            : isProfissional
            ? {
                border: 'border-neutral-800 hover:border-emerald-500/50',
                badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                btn: 'bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 hover:from-emerald-300 hover:to-teal-200 shadow-emerald-500/15',
                icon: <Award className="w-4 h-4 text-emerald-400" />,
                accentText: 'text-emerald-400',
              }
            : isPersonalizado
            ? {
                border: 'border-neutral-800 hover:border-purple-500/50',
                badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                btn: 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 text-neutral-950 hover:brightness-105 shadow-purple-500/15',
                icon: <Sliders className="w-4 h-4 text-purple-400" />,
                accentText: 'text-purple-400',
              }
            : {
                border: 'border-neutral-800 hover:border-blue-500/50',
                badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                btn: 'bg-gradient-to-r from-blue-500 to-sky-400 text-neutral-950 hover:from-blue-400 hover:to-sky-300 shadow-blue-500/15',
                icon: <Shield className="w-4 h-4 text-blue-400" />,
                accentText: 'text-blue-400',
              };

          return (
            <div
              key={planId}
              className={`flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-neutral-900/90 border p-5 sm:p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${cardTheme.border}`}
            >
              <div className="space-y-4">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cardTheme.badge}`}
                  >
                    {cardTheme.icon}
                    <span>{plan.badge}</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {plan.turnaroundTime.split(' ')[0]} {plan.turnaroundTime.split(' ')[1] || ''}
                  </span>
                </div>

                {/* Plan Name & Tagline */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400 leading-relaxed line-clamp-2">
                    {plan.tagline}
                  </p>
                </div>

                {/* Inclusions Snippet */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    O que inclui:
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-300">
                    {plan.inclusions.slice(0, 4).map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cardTheme.accentText}`} />
                        <span className="line-clamp-2">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 space-y-2 mt-4 border-t border-neutral-800/80">
                {/* View Details Button ("Ver o que está incluído") */}
                <button
                  type="button"
                  onClick={() => setDetailModalPlan(planId)}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ver o que está incluído</span>
                </button>

                {/* Choose Plan Button */}
                <button
                  type="button"
                  onClick={() => onSelectPlan(planId)}
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${cardTheme.btn}`}
                >
                  <span>Escolher {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Details Modal */}
      <PlanDetailModal
        planId={detailModalPlan}
        onClose={() => setDetailModalPlan(null)}
        onSelectPlan={(id) => {
          setDetailModalPlan(null);
          onSelectPlan(id);
        }}
      />

      {/* Guided Advisor Modal */}
      <PlanAdvisorModal
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
        onSelectPlan={(id) => {
          setAdvisorModalOpen(false);
          onSelectPlan(id);
        }}
      />
    </section>
  );
};
