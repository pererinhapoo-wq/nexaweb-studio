import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Award,
  ArrowUpRight,
  ArrowDown,
  Search,
  Laptop,
  Zap,
  TrendingUp,
  Check,
  Sliders,
} from 'lucide-react';
import {
  ESSENCIAL_PROJECTS,
  PROFISSIONAL_PROJECTS,
  PREMIUM_PROJECTS,
  ALL_PROJECTS,
  type ProjectItem,
} from './data/projects';
import { ProjectCard } from './components/ProjectCard';
import { ProjectModal } from './components/ProjectModal';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ContactModal, type ServiceLevelType } from './components/ContactModal';

// Framer Motion entrance animation variants (fade-in + slide-up)
const sectionFadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 45,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

export default function App() {
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'todos' | 'essencial' | 'profissional' | 'personalizado' | 'premium'
  >('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [selectedServiceLevel, setSelectedServiceLevel] = useState<ServiceLevelType | null>(null);

  const handleOpenBriefing = (level: ServiceLevelType | null = null) => {
    setSelectedServiceLevel(level);
    setContactModalOpen(true);
  };

  // Filtered Essencial projects
  const filteredEssencial = useMemo(() => {
    return ESSENCIAL_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered Profissional projects
  const filteredProfissional = useMemo(() => {
    return PROFISSIONAL_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered Premium projects
  const filteredPremium = useMemo(() => {
    return PREMIUM_PROJECTS.filter((proj) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        proj.name.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#08090C] text-neutral-100 flex flex-col font-sans selection:bg-amber-400/20 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar onOpenContact={() => handleOpenBriefing(null)} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Subtle Ambient Background Gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-10 left-1/3 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
          <div className="absolute top-[900px] -left-40 w-[600px] h-[600px] bg-emerald-600/5 blur-[160px] rounded-full" />
          <div className="absolute top-[1800px] -right-40 w-[600px] h-[600px] bg-amber-500/5 blur-[160px] rounded-full" />
        </div>

        {/* Hero Section & Main Title Header */}
        <section className="relative z-10 pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Tag Kicker */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold tracking-widest uppercase text-neutral-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Portfólio Oficial NexaWeb</span>
            </div>

            {/* Exact Required Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
              Projetos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400">
                Essencial
              </span>
              ,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
                Profissional
              </span>{' '}
              e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
                Premium
              </span>
            </h1>

            {/* Exact Required Subtitle */}
            <p className="text-lg sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Conheça alguns dos sites desenvolvidos pela NexaWeb para diferentes tipos de negócios.
            </p>

            <p className="text-sm text-neutral-400 max-w-xl mx-auto">
              Exemplos reais e publicados de plataformas digitais desenvolvidas com design moderno,
              alta performance e total adaptação para computadores e celulares.
            </p>
          </div>

          {/* Quick Category Jump / Navigation Bar & Search */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="p-2 sm:p-3 rounded-2xl bg-neutral-900/85 border border-neutral-800/90 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Category Segmented Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none px-1">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('todos')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeCategoryTab === 'todos'
                      ? 'bg-neutral-100 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  Todos ({ALL_PROJECTS.length})
                </button>

                <a
                  href="#projetos-essencial"
                  onClick={() => setActiveCategoryTab('essencial')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategoryTab === 'essencial'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Essencial (12)</span>
                </a>

                <a
                  href="#projetos-profissional"
                  onClick={() => setActiveCategoryTab('profissional')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategoryTab === 'profissional'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Profissional (3)</span>
                </a>

                <a
                  href="#personalizado"
                  onClick={() => setActiveCategoryTab('personalizado')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategoryTab === 'personalizado'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Personalizado</span>
                </a>

                <a
                  href="#projetos-premium"
                  onClick={() => setActiveCategoryTab('premium')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategoryTab === 'premium'
                      ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Premium (7)</span>
                </a>
              </div>

              {/* Live Search Input */}
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar por projeto ou segmento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            💼 APRESENTAÇÃO DOS 3 NÍVEIS DE SERVIÇO DA NEXAWEB
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="niveis-de-servico"
          className="relative z-10 pt-4 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24"
        >
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Níveis de Contratação NexaWeb</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight">
              Formatos de Serviço
            </h2>
            <p className="text-sm sm:text-base text-neutral-300/90 leading-relaxed">
              Escolha o formato ideal para o momento da sua empresa. Cada nível foi desenvolvido para atender diferentes objetivos de negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8 items-stretch">
            {/* 1. ESSENCIAL */}
            <div className="flex flex-col justify-between rounded-3xl bg-neutral-900/80 border border-neutral-800/90 hover:border-blue-500/50 p-7 sm:p-8 lg:p-9 shadow-xl backdrop-blur-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Essencial
                  </span>
                  <span className="text-xs font-mono text-neutral-500">Nível 01</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold font-display text-white group-hover:text-blue-200 transition-colors">
                    Site profissional para começar
                  </h3>
                  <p className="text-sm text-neutral-300/90 leading-relaxed">
                    O essencial para apresentar seu negócio na internet com uma presença profissional, moderna e objetiva.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="#projetos-essencial"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Ver 12 modelos Essencial no portfólio</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-8 border-t border-neutral-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenBriefing('Essencial')}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 hover:from-blue-400 hover:to-blue-300 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-blue-500/15 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Quero meu site Essencial</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. PROFISSIONAL */}
            <div className="flex flex-col justify-between rounded-3xl bg-neutral-900/80 border border-neutral-800/90 hover:border-emerald-500/50 p-7 sm:p-8 lg:p-9 shadow-xl backdrop-blur-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Profissional
                  </span>
                  <span className="text-xs font-mono text-neutral-500">Nível 02</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold font-display text-white group-hover:text-emerald-200 transition-colors">
                    Mais recursos para o seu negócio
                  </h3>
                  <p className="text-sm text-neutral-300/90 leading-relaxed">
                    Uma solução mais completa, com maior personalização e recursos para fortalecer a presença digital da sua empresa.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="#projetos-profissional"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Ver 3 modelos Profissional no portfólio</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-8 border-t border-neutral-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenBriefing('Profissional')}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/15 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Quero meu site Profissional</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. PERSONALIZADO */}
            <div className="flex flex-col justify-between rounded-3xl bg-neutral-900/80 border border-neutral-800/90 hover:border-purple-500/50 p-7 sm:p-8 lg:p-9 shadow-xl backdrop-blur-xl transition-all duration-300 group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Personalizado
                  </span>
                  <span className="text-xs font-mono text-neutral-500">Nível 03</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold font-display text-white group-hover:text-purple-200 transition-colors">
                    Um projeto feito para você
                  </h3>
                  <p className="text-sm text-neutral-300/90 leading-relaxed">
                    Um site desenvolvido sob medida para as necessidades, objetivos e identidade do seu negócio.
                  </p>
                </div>

                <ul className="space-y-2 pt-1 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Design exclusivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Estrutura personalizada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Funcionalidades sob medida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Experiência pensada para o negócio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Projeto desenvolvido de acordo com as necessidades do cliente</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 border-t border-neutral-800/80 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenBriefing('Personalizado')}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:from-purple-400 hover:to-indigo-300 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-purple-500/15 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Solicitar projeto personalizado</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🟦 CATEGORIA 1: PROJETOS ESSENCIAL (12 Cards)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(activeCategoryTab === 'todos' || activeCategoryTab === 'essencial') && (
          <motion.section
            id="projetos-essencial"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            variants={sectionFadeUpVariants}
            className="relative z-10 pt-10 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24"
          >
            {/* Category Header Banner */}
            <div className="mb-10 sm:mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-neutral-900/60 to-neutral-900/40 border border-blue-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider text-blue-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Categoria Essencial · 12 Projetos</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
                  Projetos Essencial
                </h2>
                <p className="text-sm sm:text-base text-neutral-300/90 max-w-2xl leading-relaxed">
                  Sites desenvolvidos para empresas, criadores e prestadores de serviços que buscam
                  uma presença digital sólida, direta e com excelente custo-benefício.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-5 py-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
                  <div className="text-2xl font-extrabold text-blue-400 font-display">12</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Sites no Ar
                  </div>
                </div>
              </div>
            </div>

            {/* 12 Essencial Cards Grid */}
            {filteredEssencial.length === 0 ? (
              <div className="py-14 text-center space-y-3 bg-neutral-900/30 rounded-3xl border border-neutral-800 p-8">
                <p className="text-neutral-400 text-sm">
                  Nenhum projeto Essencial encontrado para "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors"
                >
                  Limpar pesquisa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
                {filteredEssencial.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onPreview={(proj) => setActiveProject(proj)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🟩 CATEGORIA 2: PROJETOS PROFISSIONAL (3 Cards)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(activeCategoryTab === 'todos' || activeCategoryTab === 'profissional') && (
          <motion.section
            id="projetos-profissional"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionFadeUpVariants}
            className="relative z-10 pt-10 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 border-t border-neutral-800/60"
          >
            {/* Category Header Banner */}
            <div className="mb-10 sm:mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-neutral-900/60 to-neutral-900/40 border border-emerald-500/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  <Award className="w-3.5 h-3.5" />
                  <span>Categoria Profissional · 3 Projetos</span>
                </div>
                {/* Exact Required Title */}
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
                  Projetos Profissional
                </h2>
                {/* Exact Required Subtitle */}
                <p className="text-sm sm:text-base text-neutral-300/90 max-w-2xl leading-relaxed">
                  Sites profissionais desenvolvidos para diferentes tipos de negócios.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-5 py-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
                  <div className="text-2xl font-extrabold text-emerald-400 font-display">03</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Sites no Ar
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Profissional Cards Grid: 3 cards in one row on desktop, stacked vertically on mobile */}
            {filteredProfissional.length === 0 ? (
              <div className="py-14 text-center space-y-3 bg-neutral-900/30 rounded-3xl border border-neutral-800 p-8">
                <p className="text-neutral-400 text-sm">
                  Nenhum projeto Profissional encontrado para "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors"
                >
                  Limpar pesquisa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
                {filteredProfissional.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onPreview={(proj) => setActiveProject(proj)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🟣 NÍVEL: PERSONALIZADO (Solução Sob Medida)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(activeCategoryTab === 'todos' || activeCategoryTab === 'personalizado') && (
          <motion.section
            id="personalizado"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionFadeUpVariants}
            className="relative z-10 pt-10 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 border-t border-neutral-800/60"
          >
            {/* Visual presentation showing Personalizado is a bespoke tailor-made solution, distinct from project catalogs */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/75 to-purple-950/20 border border-purple-500/30 p-8 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-xl">
              {/* Subtle ambient lighting */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left column: Header, Description & CTA */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider text-purple-300">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Solução Sob Medida</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight">
                    Personalizado
                  </h2>

                  <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
                    Um site criado sob medida para o seu negócio, com estrutura, design e funcionalidades pensados de acordo com as suas necessidades.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBriefing('Personalizado')}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:from-purple-400 hover:to-indigo-300 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-purple-500/20 hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                      <span>Solicitar projeto personalizado</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right column: The 5 Items list */}
                <div className="lg:col-span-5 bg-neutral-950/75 border border-neutral-800/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
                  <div className="text-xs uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5 pb-2 border-b border-neutral-800/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Diferenciais do Serviço Sob Medida</span>
                  </div>

                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3 text-sm text-neutral-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Design exclusivo</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Estrutura personalizada</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Funcionalidades sob medida</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Experiência pensada para o negócio</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-neutral-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Projeto desenvolvido de acordo com as necessidades do cliente</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🟨 SEPARAÇÃO VISUAL: PORTFÓLIO / MODELOS PREMIUM (7 Cards)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(activeCategoryTab === 'todos' || activeCategoryTab === 'premium') && (
          <motion.section
            id="projetos-premium"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={sectionFadeUpVariants}
            className="relative z-10 pt-16 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 border-t-2 border-dashed border-amber-500/25"
          >
            {/* Visual Separation Header Banner */}
            <div className="mb-10 sm:mb-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-950/40 via-neutral-900/80 to-neutral-900/60 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portfólio / Modelos de Demonstração</span>
                </div>
                {/* Exact Required Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
                  Conheça nossos projetos Premium
                </h2>
                {/* Exact Required Text */}
                <p className="text-sm sm:text-base text-neutral-300/95 leading-relaxed max-w-2xl">
                  Veja exemplos de sites desenvolvidos pela NexaWeb para diferentes tipos de negócio.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-6 py-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 text-center">
                  <div className="text-3xl font-extrabold text-amber-400 font-display">07</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Modelos de Referência
                  </div>
                </div>
              </div>
            </div>

            {/* 7 Premium Cards Grid */}
            {filteredPremium.length === 0 ? (
              <div className="py-14 text-center space-y-3 bg-neutral-900/30 rounded-3xl border border-neutral-800 p-8">
                <p className="text-neutral-400 text-sm">
                  Nenhum projeto Premium encontrado para "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors"
                >
                  Limpar pesquisa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10">
                {filteredPremium.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onPreview={(proj) => setActiveProject(proj)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* NexaWeb Summary Metric Bar */}
        <section className="relative z-10 border-y border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-display">22</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
                  Total de Projetos
                </div>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  12 Essencial, 3 Profissional e 7 Premium em produção.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-display">
                  12
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-blue-300">
                  Essencial
                </div>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Soluções ágeis com foco em conversão e presença digital.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-display">
                  03
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
                  Profissional
                </div>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Apresentação refinada para arquitetura, estética e tech.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-display">
                  07
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                  Premium
                </div>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Experiências imersivas de alto padrão para marcas de luxo.
                </p>
              </div>

              <div className="space-y-2 col-span-2 lg:col-span-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-display">
                  100%
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
                  Responsivo
                </div>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Navegação perfeita e botões otimizados para toque no celular.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais NexaWeb */}
        <section
          id="diferenciais"
          className="relative z-10 py-24 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Excelência Técnica
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Por que a NexaWeb é a escolha certa?
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Combinamos conhecimento técnico de ponta, estética apurada e estratégias reais de
              conversão para cada tipo de cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Design Sob Medida</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Cada site é construído respeitando as características do segmento, sem layouts
                genéricos.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Velocidade e Estabilidade</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Carregamento ultra-rápido garantido por arquiteturas em nuvem modernas e imagens
                otimizadas.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Conversão e Resultados</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Hierarquia clara, chamadas para ação estratégicas e canais de contato diretos no
                WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 p-8 sm:p-12 lg:p-16 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white">
              Pronto para ter um site como esses?
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Descubra qual categoria — Essencial, Profissional ou Premium — melhor atende aos objetivos e ao
              momento do seu negócio.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenBriefing(null)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Falar com a NexaWeb</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <a
                href="#projetos-essencial"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-sm font-semibold border border-neutral-700 transition-colors"
              >
                Explorar Todos os 22 Projetos
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Project Quick Inspector Modal */}
      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />

      {/* Contact / Proposal Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedServiceLevel(null);
        }}
        serviceLevel={selectedServiceLevel}
      />
    </div>
  );
}
