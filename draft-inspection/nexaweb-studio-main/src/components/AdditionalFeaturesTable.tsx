import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  Cpu,
  Coins,
  FileText,
  Zap,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import type { PlanId } from '../data/plans';
import {
  ADDITIONAL_FEATURES_LIST,
  COMMERCIAL_RULES,
  type CommercialFeature,
  type AdditionalFeatureTier,
} from '../data/additionalFeatures';

interface AdditionalFeaturesTableProps {
  onSelectPlan: (planId: PlanId, startAtBriefing?: boolean) => void;
}

export const AdditionalFeaturesTable: React.FC<AdditionalFeaturesTableProps> = ({
  onSelectPlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<AdditionalFeatureTier | 'all'>('all');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<PlanId | 'all'>('all');

  // Filter features
  const filteredFeatures = useMemo(() => {
    return ADDITIONAL_FEATURES_LIST.filter((feat) => {
      // Tier filter
      if (selectedTier !== 'all' && feat.tier !== selectedTier) {
        return false;
      }

      // Plan compatibility filter
      if (selectedPlanFilter !== 'all' && !feat.compatiblePlans.includes(selectedPlanFilter)) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = feat.name.toLowerCase().includes(query);
        const matchesDesc = feat.description.toLowerCase().includes(query);
        const matchesCat = feat.categoryLabel.toLowerCase().includes(query);
        const matchesPrice = feat.priceFormatted.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCat || matchesPrice;
      }

      return true;
    });
  }, [selectedTier, selectedPlanFilter, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = ADDITIONAL_FEATURES_LIST.length;
    const tier150 = ADDITIONAL_FEATURES_LIST.filter((f) => f.tier === '150').length;
    const tier200 = ADDITIONAL_FEATURES_LIST.filter((f) => f.tier === '200').length;
    const tier300 = ADDITIONAL_FEATURES_LIST.filter((f) => f.tier === '300').length;
    const tierScope = ADDITIONAL_FEATURES_LIST.filter((f) => f.tier === 'scope').length;
    return { total, tier150, tier200, tier300, tierScope };
  }, []);

  const getPlanBadgeClass = (plan: PlanId) => {
    switch (plan) {
      case 'Essencial':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Profissional':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'Personalizado':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Premium':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const getPriceBadgeClass = (tier: AdditionalFeatureTier) => {
    switch (tier) {
      case '150':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case '200':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case '300':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'scope':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
  };

  const handleActionClick = (feature: CommercialFeature) => {
    // Recommend the most accessible compatible plan or default to Personalizado
    const recommendedPlan: PlanId =
      feature.compatiblePlans.includes('Profissional')
        ? 'Profissional'
        : feature.compatiblePlans.includes('Personalizado')
        ? 'Personalizado'
        : feature.compatiblePlans.includes('Premium')
        ? 'Premium'
        : 'Essencial';

    onSelectPlan(recommendedPlan, true);
  };

  return (
    <div id="funcionalidades-adicionais" className="mt-14 sm:mt-20 scroll-mt-24">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tabela Comercial de Adicionais</span>
        </div>

        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
          Funcionalidades Adicionais & Opcionais
        </h3>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl mx-auto">
          Personalize e amplie o escopo do seu site com recursos modulares transparentes. Valores comerciais oficiais em Reais (BRL), sem custos ocultos.
        </p>
      </div>

      {/* Commercial Rules Banner */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg">
        <div className="flex items-center gap-2 mb-3.5">
          <Info className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
            Regras Comerciais Importantes
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Sem Cobrança Dupla</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Não cobramos separadamente recursos que já estejam incluídos no plano contratado.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Compatibilidade Técnica</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Nem todos os recursos são compatíveis com todos os planos; respeitamos a infraestrutura necessária.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Coins className="w-4 h-4 shrink-0" />
              <span>Valores Transparentes (BRL)</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Tabela comercial oficial com preços confirmados em reais para cada funcionalidade.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Escopos Complexos</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Para integrações ou sistemas sem preço tabelado: exibido “Sujeito à avaliação técnica de escopo”.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 mb-6">
        {/* Tier Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTier === 'all'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            Todos os Adicionais ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTier('150')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTier === '150'
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-300 hover:border-emerald-500/40'
            }`}
          >
            R$ 150 por recurso ({counts.tier150})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTier('200')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTier === '200'
                ? 'bg-sky-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-sky-300 hover:border-sky-500/40'
            }`}
          >
            R$ 200 por recurso ({counts.tier200})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTier('300')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTier === '300'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-amber-500/40'
            }`}
          >
            R$ 300 por recurso ({counts.tier300})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTier('scope')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTier === 'scope'
                ? 'bg-purple-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:border-purple-500/40'
            }`}
          >
            Avaliação Técnica ({counts.tierScope})
          </button>
        </div>

        {/* Search Input & Plan Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar funcionalidade por nome, segmento ou valor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400/50 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1 shrink-0 px-1">
              <Filter className="w-3 h-3" />
              <span>Plano:</span>
            </span>
            {(['all', 'Essencial', 'Profissional', 'Personalizado', 'Premium'] as const).map(
              (p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlanFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border ${
                    selectedPlanFilter === p
                      ? 'bg-neutral-800 text-white border-neutral-700'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  {p === 'all' ? 'Todos' : p}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Results Count & Empty State */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 space-y-2">
          <p className="text-sm font-semibold text-neutral-300">
            Nenhuma funcionalidade encontrada com os filtros atuais.
          </p>
          <p className="text-xs text-neutral-500">
            Tente buscar outro termo ou limpar os filtros de preço e compatibilidade.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedTier('all');
              setSelectedPlanFilter('all');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-amber-300 font-semibold"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (md:block) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-4">Funcionalidade Adicional</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Planos Compatíveis</th>
                    <th className="py-3.5 px-4 text-right">Valor Comercial</th>
                    <th className="py-3.5 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70 text-xs">
                  {filteredFeatures.map((feat) => {
                    const priceBadge = getPriceBadgeClass(feat.tier);

                    return (
                      <tr
                        key={feat.id}
                        className="hover:bg-neutral-800/40 transition-colors group"
                      >
                        {/* Name & Description */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {feat.isRealtime && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>Tempo Real</span>
                                </span>
                              )}
                              <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                {feat.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              {feat.description}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[11px] text-neutral-400 font-medium">
                            {feat.categoryLabel}
                          </span>
                        </td>

                        {/* Compatible Plans */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {feat.compatiblePlans.map((plan) => (
                              <span
                                key={plan}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPlanBadgeClass(
                                  plan
                                )}`}
                              >
                                {plan}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex flex-col items-end">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${priceBadge}`}
                            >
                              {feat.priceFormatted}
                            </span>
                            <span className="text-[10px] text-neutral-500 mt-0.5">
                              {feat.unit}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleActionClick(feat)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
                          >
                            <span>Solicitar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredFeatures.map((feat) => {
              const priceBadge = getPriceBadgeClass(feat.tier);

              return (
                <div
                  key={feat.id}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md space-y-3"
                >
                  {/* Top Bar: Name & Price */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {feat.isRealtime && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            <span>Tempo Real</span>
                          </span>
                        )}
                        <span className="text-xs font-semibold text-neutral-400">
                          {feat.categoryLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                        {feat.name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${priceBadge}`}
                      >
                        {feat.priceFormatted}
                      </span>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {feat.unit}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-300/90 leading-relaxed">
                    {feat.description}
                  </p>

                  {/* Compatibility & Action */}
                  <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                        Compatível com:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {feat.compatiblePlans.map((plan) => (
                          <span
                            key={plan}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getPlanBadgeClass(
                              plan
                            )}`}
                          >
                            {plan}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleActionClick(feat)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <span>Solicitar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Reassurance Footer */}
      <div className="mt-6 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Precisa de um pacote com múltiplos adicionais ou escopo sob medida?
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelectPlan('Personalizado', true)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
        >
          Solicitar briefing para projeto personalizado &rarr;
        </button>
      </div>
    </div>
  );
};
