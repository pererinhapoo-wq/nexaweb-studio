import React, { useState, Suspense, lazy } from 'react';
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
import type { PlanId } from '../data/plans';
import { PLANS_DATA } from '../data/plans';

const PlanDetailModal = lazy(() =>
  import('./PlanDetailModal').then((m) => ({ default: m.PlanDetailModal }))
);
const PlanAdvisorModal = lazy(() =>
  import('./PlanAdvisorModal').then((m) => ({ default: m.PlanAdvisorModal }))
);

interface PlansSectionProps {
  onSelectPlan: (planId: PlanId, startAtBriefing?: boolean) => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ onSelectPlan }) => {
  const [detailModalPlan, setDetailModalPlan] = useState<PlanId | null>(null);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);

  const plans: PlanId[] = ['Essencial', 'Personalizado', 'Profissional', 'Premium'];

  return (
    <section
      id="planos"
      className="relative z-10 py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Planos Oficiais NexaWeb</span>
        </div>

        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
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
                border: 'border-neutral-800 hover:border-orange-500/50',
                badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
                btn: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 text-neutral-950 hover:brightness-105 shadow-orange-500/15',
                icon: <Award className="w-4 h-4 text-orange-400" />,
                accentText: 'text-orange-400',
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
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <span className="text-xs sm:text-sm font-extrabold text-neutral-200">
                      {plan.price}
                    </span>
                  </div>
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

                {/* Choose Plan Button - Direct action to choose plan */}
                <button
                  type="button"
                  onClick={() => onSelectPlan(planId)}
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${cardTheme.btn}`}
                >
                  <span>Escolher Plano {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Details Presentation Modal */}
      {detailModalPlan && (
        <Suspense fallback={null}>
          <PlanDetailModal
            planId={detailModalPlan}
            onClose={() => setDetailModalPlan(null)}
            onSelectPlan={(id) => {
              setDetailModalPlan(null);
              onSelectPlan(id, true);
            }}
          />
        </Suspense>
      )}

      {/* Guided Advisor Modal */}
      {advisorModalOpen && (
        <Suspense fallback={null}>
          <PlanAdvisorModal
            isOpen={advisorModalOpen}
            onClose={() => setAdvisorModalOpen(false)}
            onSelectPlan={(id) => {
              setAdvisorModalOpen(false);
              onSelectPlan(id);
            }}
          />
        </Suspense>
      )}
    </section>
  );
};
