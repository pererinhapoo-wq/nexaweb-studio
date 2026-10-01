export type ProjectTier = 'Essencial' | 'Profissional' | 'Premium';

export interface ProjectItem {
  id: string;
  name: string;
  category: string;
  tier: ProjectTier;
  url: string;
  description: string;
  fallbackImage: string;
  tagline: string;
  highlights: string[];
  clientIndustry: string;
  accentColor: string;
}

// ━━━━━━━━━━━━━━━━━━━━
// 🟦 PROJETOS ESSENCIAL (12 Projetos)
// ━━━━━━━━━━━━━━━━━━━━
export const ESSENCIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'influenciador-digital',
    name: 'Influenciador Digital',
    category: 'Influência Digital & Conteúdo',
    tier: 'Essencial',
    url: 'https://influenciado-digital.vercel.app/',
    description:
      'Página otimizada para influenciadores digitais apresentarem seus canais, números de alcance, marcas parceiras e canal direto de assessoria e publicidade.',
    fallbackImage:
      'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Presença e autoridade para criadores de impacto',
    highlights: ['Media Kit Dinâmico', 'Links Rápidos', 'Design Responsivo'],
    clientIndustry: 'Influência Digital',
    accentColor: 'from-blue-600/20 to-sky-500/10',
  },
  {
    id: 'criador-de-conteudo',
    name: 'Criador de Conteúdo',
    category: 'Mídia & Produção Digital',
    tier: 'Essencial',
    url: 'https://criador-de-conte-do-essencial.vercel.app/',
    description:
      'Site com foco em criadores autônomos, podcasts e streamers, estruturado para centralizar episódios, redes sociais e captação de apoiadores.',
    fallbackImage:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Centralização de conteúdos e canais de streaming',
    highlights: ['Vitrine de Episódios', 'Integração de Redes', 'Acesso Mobile Ágil'],
    clientIndustry: 'Mídia & Entretenimento',
    accentColor: 'from-indigo-600/20 to-blue-500/10',
  },
  {
    id: 'prestador-de-servico',
    name: 'Prestador de Serviço',
    category: 'Serviços Profissionais',
    tier: 'Essencial',
    url: 'https://nexaweb-prestador.vercel.app/',
    description:
      'Solução digital direta e profissional para consultores, técnicos e prestadores autônomos apresentarem seus serviços com botão para orçamento no WhatsApp.',
    fallbackImage:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Apresentação clara de serviços e captação de leads',
    highlights: ['Chamada para WhatsApp', 'Tabela de Serviços', 'Depoimentos de Clientes'],
    clientIndustry: 'Serviços & Negócios',
    accentColor: 'from-cyan-600/20 to-blue-500/10',
  },
  {
    id: 'imobiliaria-essencial',
    name: 'Imobiliária',
    category: 'Mercado Imobiliário',
    tier: 'Essencial',
    url: 'https://nexaweb-imobiliaria.vercel.app/',
    description:
      'Portal imobiliário eficiente com listagem de imóveis para venda e locação, fotos destacadas, localização e formulário direto de contato com corretor.',
    fallbackImage:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Vitrine imobiliária com foco em conversão rápida',
    highlights: ['Catálogo de Imóveis', 'Filtro por Tipo', 'Contato com Corretores'],
    clientIndustry: 'Mercado Imobiliário',
    accentColor: 'from-emerald-600/20 to-blue-500/10',
  },
  {
    id: 'loja-essencial',
    name: 'Loja',
    category: 'E-commerce & Varejo',
    tier: 'Essencial',
    url: 'https://nexaweb-loja.vercel.app/',
    description:
      'Vitrine virtual moderna para comércio varejista com exibição limpa de produtos, categorias organizadas e navegação pensada para dispositivos móveis.',
    fallbackImage:
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Vendas e catálogo intuitivo para o varejo',
    highlights: ['Catálogo Dinâmico', 'Galeria de Produtos', 'Checkout Prático'],
    clientIndustry: 'Varejo & Moda',
    accentColor: 'from-sky-600/20 to-teal-500/10',
  },
  {
    id: 'restaurante-sabor-brasa',
    name: 'Restaurante — Sabor & Brasa',
    category: 'Gastronomia & Churrascaria',
    tier: 'Essencial',
    url: 'https://grok-workspace-puce.vercel.app/',
    description:
      'Site convidativo para churrascarias e casas de carnes com destaque para os cortes especiais, ambiente rústico sofisticado e facilidade para reservas.',
    fallbackImage:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Tradição do fogo e cortes selecionados na web',
    highlights: ['Cardápio de Carnes', 'Horários & Endereço', 'Botão de Reserva'],
    clientIndustry: 'Gastronomia & Churrasco',
    accentColor: 'from-amber-600/20 to-red-500/10',
  },
  {
    id: 'restaurante-essencial',
    name: 'Restaurante',
    category: 'Gastronomia & Culinária',
    tier: 'Essencial',
    url: 'https://restaurante-origem.vercel.app/',
    description:
      'Experiência digital agradável para bistrôs e restaurantes com menu digital completo, proposta culinária da casa e mapa de localização interativo.',
    fallbackImage:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Menu interativo e aconchego para seus clientes',
    highlights: ['Menu Digital Ilustrado', 'História da Casa', 'Localização Fácil'],
    clientIndustry: 'Gastronomia & Restaurantes',
    accentColor: 'from-orange-600/20 to-amber-500/10',
  },
  {
    id: 'academia-essencial',
    name: 'Academia',
    category: 'Fitness & Bem-Estar',
    tier: 'Essencial',
    url: 'https://nexaweb-academia.vercel.app/',
    description:
      'Página energética para academias e estúdios esportivos, apresentando modalidades de treino, estrutura de musculação e planos mensais acessíveis.',
    fallbackImage:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Energia, treinos e captação de novos alunos',
    highlights: ['Grade de Aulas', 'Planos de Adesão', 'Formulário de Matrícula'],
    clientIndustry: 'Fitness & Treinamento',
    accentColor: 'from-blue-600/20 to-emerald-500/10',
  },
  {
    id: 'kings-barber',
    name: "King's Barber",
    category: 'Barbearia & Estilo Masculino',
    tier: 'Essencial',
    url: 'https://kings-barber-two.vercel.app/',
    description:
      'Site com visual autêntico e moderno para barbearias, com tabela de serviços de corte e barba, profissionais da equipe e agendamento prático.',
    fallbackImage:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Cortes clássicos e modernos com presença marcante',
    highlights: ['Tabela de Cortes', 'Agendamento Direto', 'Galeria de Estilos'],
    clientIndustry: 'Barbearia & Beleza',
    accentColor: 'from-slate-600/20 to-blue-500/10',
  },
  {
    id: 'nexaweb-portfolio',
    name: 'NexaWeb Portfolio',
    category: 'Portfólio Institucional',
    tier: 'Essencial',
    url: 'https://nexaweb-portfolio-lake.vercel.app/',
    description:
      'Vitrine institucional desenvolvida para agências e estúdios criativos apresentarem seus trabalhos, metodologias de desenvolvimento e cases de sucesso.',
    fallbackImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Demonstração de competência e projetos entregues',
    highlights: ['Apresentação Institucional', 'Metodologia Ágil', 'Contato Comercial'],
    clientIndustry: 'Agência & Design Web',
    accentColor: 'from-blue-600/20 to-purple-500/10',
  },
  {
    id: 'salao',
    name: 'Salão',
    category: 'Salão de Beleza & Estética',
    tier: 'Essencial',
    url: 'https://nexaweb-salao1.vercel.app/',
    description:
      'Website delicado e refinado para salões de cabeleireiro e estética, destacando tratamentos capilares, transformações visuais e agendamento online.',
    fallbackImage:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Beleza, autocuidado e sofisticação para o seu espaço',
    highlights: ['Tratamentos Capilares', 'Galeria Antes & Depois', 'Agendamento Ágil'],
    clientIndustry: 'Beleza & Cuidados Pessoais',
    accentColor: 'from-pink-600/20 to-blue-500/10',
  },
  {
    id: 'projeto-grok-workspace',
    name: 'Projeto Grok Workspace',
    category: 'Plataforma Digital & Workspace',
    tier: 'Essencial',
    url: 'https://grok-workspace-1-three-alpha.vercel.app/',
    description:
      'Ambiente digital colaborativo com arquitetura limpa, navegação simplificada e recursos visuais para equipes e projetos produtivos na nuvem.',
    fallbackImage:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Espaço funcional para trabalho e colaboração digital',
    highlights: ['Interface Produtiva', 'Layout Modular', 'Performance Rápida'],
    clientIndustry: 'Tecnologia & Produtividade',
    accentColor: 'from-cyan-600/20 to-slate-500/10',
  },
];

// ━━━━━━━━━━━━━━━━━━━━
// 🟩 PROJETOS PROFISSIONAL (3 Projetos)
// ━━━━━━━━━━━━━━━━━━━━
export const PROFISSIONAL_PROJECTS: ProjectItem[] = [
  {
    id: 'nova-arq',
    name: 'NOVA ARQ',
    category: 'Arquitetura',
    tier: 'Profissional',
    url: 'https://nexaweb-nova-arq-1.vercel.app/',
    description:
      'Site profissional para escritório de arquitetura contemporânea, com apresentação sofisticada de projetos, serviços e processo.',
    fallbackImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Apresentação sofisticada de projetos, serviços e processo',
    highlights: ['Portfólio Contemporâneo', 'Serviços Especializados', 'Processo Metodológico'],
    clientIndustry: 'Arquitetura',
    accentColor: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'lumiere',
    name: 'LUMIÈRE',
    category: 'Estética e Bem-estar',
    tier: 'Profissional',
    url: 'https://nexaweb-lumiere.vercel.app/',
    description:
      'Site profissional para clínica de estética e bem-estar, com visual elegante, apresentação de tratamentos e foco em experiência e atendimento.',
    fallbackImage:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Visual elegante, apresentação de tratamentos e foco em experiência',
    highlights: ['Tratamentos Exclusivos', 'Experiência & Atendimento', 'Agendamento Direto'],
    clientIndustry: 'Estética e Bem-estar',
    accentColor: 'from-teal-500/20 to-emerald-500/10',
  },
  {
    id: 'vertex-digital',
    name: 'VERTEX DIGITAL',
    category: 'Tecnologia',
    tier: 'Profissional',
    url: 'https://nexaweb-vertex-digital.vercel.app/',
    description:
      'Site profissional para empresa de tecnologia, com apresentação de soluções digitais, cases, processo e serviços.',
    fallbackImage:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Apresentação de soluções digitais, cases, processo e serviços',
    highlights: ['Soluções Digitais', 'Cases de Sucesso', 'Processo & Serviços'],
    clientIndustry: 'Tecnologia',
    accentColor: 'from-emerald-600/20 to-cyan-500/10',
  },
];

// ━━━━━━━━━━━━━━━━━━━━
// 🟨 PROJETOS PREMIUM (7 Projetos)
// ━━━━━━━━━━━━━━━━━━━━
export const PREMIUM_PROJECTS: ProjectItem[] = [
  {
    id: 'academia-premium',
    name: 'Academia Premium',
    category: 'Fitness & Alta Performance',
    tier: 'Premium',
    url: 'https://academia-premium-beryl.vercel.app/',
    description:
      'Plataforma de alta sofisticação para rede fitness de luxo. Apresenta infraestrutura de ponta, grade de modalidades dinâmicas, planos de membros e matrícula digital.',
    fallbackImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Experiência fitness de alto impacto visual e tecnológico',
    highlights: ['Grade Interativa de Treinos', 'Conversão de Membros', 'Design Imersivo Dark'],
    clientIndustry: 'Fitness & Bem-Estar',
    accentColor: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'engenharia-premium',
    name: 'Engenharia Premium',
    category: 'Engenharia & Construção Civil',
    tier: 'Premium',
    url: 'https://engenharia-premium.vercel.app/',
    description:
      'Portal institucional corporativo para empresa de engenharia e grandes obras estruturais. Destaca acervo técnico, certificações de qualidade e solicitação de orçamentos executivos.',
    fallbackImage:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Solidez, precisão e autoridade em grandes empreendimentos',
    highlights: ['Portfólio de Obras Civis', 'Certificações Técnicas', 'Solicitação de Proposta'],
    clientIndustry: 'Engenharia & Infraestrutura',
    accentColor: 'from-amber-500/20 to-yellow-500/10',
  },
  {
    id: 'imobiliaria-premium',
    name: 'Imobiliária Premium',
    category: 'Mercado Imobiliário de Luxo',
    tier: 'Premium',
    url: 'https://imobili-ria-premium.vercel.app/',
    description:
      'Vitrine imobiliária exclusiva para propriedades de alto padrão e condomínios de luxo. Desenvolvida com navegação fluida, busca inteligente e agendamento de visitas privativas.',
    fallbackImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Arquitetura e exclusividade em cada metro quadrado',
    highlights: ['Busca Imobiliária Avançada', 'Galerias em Alta Resolução', 'Agendamento Direto'],
    clientIndustry: 'Mercado Imobiliário',
    accentColor: 'from-amber-500/20 to-emerald-500/10',
  },
  {
    id: 'loja-premium',
    name: 'Loja Premium',
    category: 'E-commerce & Varejo Exclusivo',
    tier: 'Premium',
    url: 'https://loja-premium-delta.vercel.app/',
    description:
      'Loja virtual de alto padrão projetada para marcas requintadas. Experiência de compra fluida, vitrine de produtos minimalista, catálogo responsivo e foco em ticket médio.',
    fallbackImage:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Varejo digital com estética minimalista e conversão máxima',
    highlights: ['Catálogo Fluido de Produtos', 'Foco em Vendas & Ticket Alto', 'Checkout Otimizado'],
    clientIndustry: 'E-commerce & Moda',
    accentColor: 'from-amber-500/20 to-rose-500/10',
  },
  {
    id: 'clinica-premium',
    name: 'Clínica Premium',
    category: 'Saúde & Medicina Especializada',
    tier: 'Premium',
    url: 'https://cl-nica-premium-1.vercel.app/',
    description:
      'Presença digital humanizada para clínica médica e estética de alta credibilidade. Apresentação detalhada do corpo clínico, especialidades médicas e agendamento facilitado.',
    fallbackImage:
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Credibilidade médica e acolhimento com padrão internacional',
    highlights: ['Especialidades Médicas', 'Apresentação do Corpo Clínico', 'Agendamento Prático'],
    clientIndustry: 'Saúde & Cuidados Médicos',
    accentColor: 'from-amber-500/20 to-cyan-500/10',
  },
  {
    id: 'restaurante-premium',
    name: 'Restaurante Premium',
    category: 'Gastronomia & Alta Culinária',
    tier: 'Premium',
    url: 'https://restaurante-premium-delta.vercel.app/',
    description:
      'Experiência digital gastronômica que traduz o requinte autoral do restaurante. Cardápio sensorial ilustrado em alta resolução, carta de vinhos selecionados e reservas online.',
    fallbackImage:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Alta gastronomia com estética sensorial e reservas online',
    highlights: ['Cardápio Sensorial Interativo', 'Reserva de Mesas', 'Carta de Vinhos'],
    clientIndustry: 'Gastronomia & Hospitalidade',
    accentColor: 'from-amber-500/20 to-yellow-600/10',
  },
  {
    id: 'kings-barber-premium',
    name: "King's Barber Premium",
    category: 'Barbearia Premium & Estilo',
    tier: 'Premium',
    url: 'https://king-s-barber-2-liard.vercel.app/',
    description:
      'Ambiente digital refinado para barbearia de alto conceito e atendimento exclusivo. Destaca tratamentos masculinos personalizados, lounge bar e agendamento com barbeiros masters.',
    fallbackImage:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85',
    tagline: 'Barbearia executiva com experiência premium para clientes',
    highlights: ['Serviços Exclusivos', 'Agendamento com Mestres Barbeiros', 'Espaço Lounge'],
    clientIndustry: 'Barbearia & Estilo',
    accentColor: 'from-amber-500/20 to-stone-500/10',
  },
];

export const ALL_PROJECTS: ProjectItem[] = [
  ...ESSENCIAL_PROJECTS,
  ...PROFISSIONAL_PROJECTS,
  ...PREMIUM_PROJECTS,
];
