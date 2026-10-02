export type ProjectTier = 'Essencial' | 'Profissional' | 'Premium';

export interface ProjectPlan {
  name: 'Essencial' | 'Profissional' | 'Personalizado';
  price: string;
  text: string;
  time: string;
}

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

  // Informações utilizadas no modal "Visão Geral"
  structure?: string[];
  plans?: ProjectPlan[];

  // Nome utilizado para abrir o briefing específico
  briefingType?: string;
}

const CREATOR_PLANS: ProjectPlan[] = [
  {
    name: 'Essencial',
    price: 'R$ 1.000',
    text: 'Apresentação do criador, redes sociais, conteúdos, links importantes, contato e publicação.',
    time: 'Prazo: 3–5 dias',
  },
  {
    name: 'Profissional',
    price: 'R$ 1.700',
    text: 'Tudo do Essencial + estrutura mais completa, destaques, novas seções, links personalizados e mais recursos para o criador.',
    time: 'Prazo: 5–8 dias',
  },
  {
    name: 'Personalizado',
    price: 'A partir de R$ 2.800',
    text: 'Estrutura sob medida para projetos com identidade própria, integrações, recursos especiais e necessidades específicas.',
    time: 'Prazo: conforme projeto',
  },
];

const DEFAULT_PLANS: ProjectPlan[] = [
  {
    name: 'Essencial',
    price: '',
    text: 'Estrutura profissional para apresentar o negócio, seus serviços e principais informações.',
    time: '',
  },
  {
    name: 'Profissional',
    price: '',
    text: 'Estrutura mais completa, com novas seções, recursos e personalizações para o negócio.',
    time: '',
  },
  {
    name: 'Personalizado',
    price: '',
    text: 'Projeto sob medida de acordo com as necessidades específicas do negócio.',
    time: '',
  },
];

export const ESSENCIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'influenciador',
    name: 'Influenciador Digital',
    category: 'Criador de Conteúdo',
    tier: 'Essencial',
    url: 'https://influenciado-digital.vercel.app/',
    description:
      'Site profissional para influenciadores e criadores que desejam reunir sua apresentação, conteúdos, redes sociais e principais links em um único lugar.',
    fallbackImage: '',
    tagline: 'Sua presença digital em um só lugar.',
    highlights: [
      'Apresentação profissional',
      'Redes sociais',
      'Conteúdos e destaques',
      'Links importantes',
      'Contato',
    ],
    clientIndustry: 'Criador de Conteúdo',
    accentColor: 'blue',
    briefingType: 'Criador de Conteúdo',
    structure: [
      'Apresentação do criador',
      'Sobre o criador',
      'Redes sociais',
      'Conteúdos e destaques',
      'Links importantes',
      'Contato',
    ],
    plans: CREATOR_PLANS,
  },

  {
    id: 'criador-conteudo',
    name: 'Criador de Conteúdo',
    category: 'Criador de Conteúdo',
    tier: 'Essencial',
    url: 'https://criador-de-conte-do-essencial.vercel.app/',
    description:
      'Modelo profissional para criadores de conteúdo apresentarem seu trabalho, redes sociais, conteúdos e links importantes.',
    fallbackImage: '',
    tagline: 'Apresente seu conteúdo de forma profissional.',
    highlights: [
      'Perfil do criador',
      'Redes sociais',
      'Conteúdos',
      'Links personalizados',
      'Contato',
    ],
    clientIndustry: 'Criador de Conteúdo',
    accentColor: 'blue',
    briefingType: 'Criador de Conteúdo',
    structure: [
      'Apresentação do criador',
      'Sobre',
      'Redes sociais',
      'Conteúdos',
      'Links importantes',
      'Contato',
    ],
    plans: CREATOR_PLANS,
  },

  {
    id: 'prestador-servico',
    name: 'Prestador de Serviço',
    category: 'Prestador de Serviço',
    tier: 'Essencial',
    url: 'https://nexaweb-prestador.vercel.app/',
    description:
      'Site profissional para apresentar serviços, diferenciais, informações de contato e facilitar a conexão com clientes.',
    fallbackImage: '',
    tagline: 'Apresente seus serviços com profissionalismo.',
    highlights: [
      'Apresentação profissional',
      'Serviços',
      'Diferenciais',
      'Informações de contato',
      'Chamada para ação',
    ],
    clientIndustry: 'Prestador de Serviço',
    accentColor: 'blue',
    briefingType: 'Prestador de Serviço',
    structure: [
      'Apresentação',
      'Sobre o profissional',
      'Serviços',
      'Diferenciais',
      'Contato',
      'Chamada para ação',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'imobiliaria',
    name: 'Imobiliária',
    category: 'Imobiliária',
    tier: 'Essencial',
    url: 'https://nexaweb-imobiliaria.vercel.app/',
    description:
      'Site profissional para imobiliárias apresentarem seus imóveis, serviços e formas de contato.',
    fallbackImage: '',
    tagline: 'Uma presença digital profissional para sua imobiliária.',
    highlights: [
      'Apresentação da imobiliária',
      'Imóveis',
      'Informações dos imóveis',
      'Contato',
      'Atendimento',
    ],
    clientIndustry: 'Imobiliária',
    accentColor: 'blue',
    briefingType: 'Imobiliária',
    structure: [
      'Apresentação da imobiliária',
      'Imóveis',
      'Detalhes dos imóveis',
      'Sobre a empresa',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'loja',
    name: 'Loja',
    category: 'Loja / E-commerce',
    tier: 'Essencial',
    url: 'https://nexaweb-loja.vercel.app/',
    description:
      'Modelo profissional para lojas apresentarem seus produtos, informações e canais de atendimento.',
    fallbackImage: '',
    tagline: 'Sua loja apresentada de forma profissional.',
    highlights: [
      'Apresentação da loja',
      'Produtos',
      'Categorias',
      'Informações',
      'Contato',
    ],
    clientIndustry: 'Loja',
    accentColor: 'blue',
    briefingType: 'Loja',
    structure: [
      'Apresentação da loja',
      'Produtos',
      'Categorias',
      'Destaques',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'restaurante-sabor-brasa',
    name: 'Restaurante — Sabor & Brasa',
    category: 'Restaurante',
    tier: 'Essencial',
    url: 'https://grok-workspace-puce.vercel.app/',
    description:
      'Modelo de site para restaurante com apresentação do estabelecimento, cardápio, informações e contato.',
    fallbackImage: '',
    tagline: 'Seu restaurante apresentado de forma profissional.',
    highlights: [
      'Apresentação',
      'Cardápio',
      'Destaques',
      'Informações',
      'Contato',
    ],
    clientIndustry: 'Restaurante',
    accentColor: 'blue',
    briefingType: 'Restaurante',
    structure: [
      'Apresentação do restaurante',
      'Cardápio',
      'Pratos em destaque',
      'Sobre',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'restaurante',
    name: 'Restaurante',
    category: 'Restaurante',
    tier: 'Essencial',
    url: '',
    description:
      'Site profissional para restaurantes apresentarem seu espaço, cardápio, pratos e canais de contato.',
    fallbackImage: '',
    tagline: 'Transforme sua presença digital em uma experiência.',
    highlights: [
      'Apresentação',
      'Cardápio',
      'Pratos',
      'Informações',
      'Contato',
    ],
    clientIndustry: 'Restaurante',
    accentColor: 'blue',
    briefingType: 'Restaurante',
    structure: [
      'Apresentação',
      'Cardápio',
      'Pratos em destaque',
      'Sobre o restaurante',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'academia',
    name: 'Academia',
    category: 'Academia / Fitness',
    tier: 'Essencial',
    url: 'https://nexaweb-academia.vercel.app/',
    description:
      'Modelo profissional para academias apresentarem seus espaços, serviços, modalidades e informações.',
    fallbackImage: '',
    tagline: 'Uma presença digital forte para sua academia.',
    highlights: [
      'Apresentação da academia',
      'Modalidades',
      'Estrutura',
      'Informações',
      'Contato',
    ],
    clientIndustry: 'Academia',
    accentColor: 'blue',
    briefingType: 'Academia',
    structure: [
      'Apresentação da academia',
      'Modalidades',
      'Estrutura',
      'Benefícios',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'kings-barber',
    name: 'King’s Barber',
    category: 'Barbearia',
    tier: 'Essencial',
    url: 'https://kings-barber-two.vercel.app/',
    description:
      'Modelo profissional para barbearias apresentarem seus serviços, ambiente, diferenciais e formas de contato.',
    fallbackImage: '',
    tagline: 'Sua barbearia com presença digital profissional.',
    highlights: [
      'Apresentação',
      'Serviços',
      'Ambiente',
      'Diferenciais',
      'Contato',
    ],
    clientIndustry: 'Barbearia',
    accentColor: 'blue',
    briefingType: 'Barbearia',
    structure: [
      'Apresentação da barbearia',
      'Serviços',
      'Preços',
      'Ambiente',
      'Diferenciais',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'nexaweb-portfolio',
    name: 'NexaWeb Portfolio',
    category: 'Portfólio',
    tier: 'Essencial',
    url: 'https://nexaweb-portfolio-lake.vercel.app/',
    description:
      'Modelo de portfólio profissional para apresentar projetos, trabalhos e informações de forma organizada.',
    fallbackImage: '',
    tagline: 'Mostre seu trabalho com uma apresentação profissional.',
    highlights: [
      'Apresentação',
      'Projetos',
      'Trabalhos',
      'Sobre',
      'Contato',
    ],
    clientIndustry: 'Portfólio',
    accentColor: 'blue',
    briefingType: 'Portfólio',
    structure: [
      'Apresentação',
      'Sobre',
      'Projetos',
      'Trabalhos em destaque',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'salao',
    name: 'Salão',
    category: 'Salão de Beleza',
    tier: 'Essencial',
    url: 'https://nexaweb-salao1.vercel.app/',
    description:
      'Modelo profissional para salões apresentarem seus serviços, ambiente, profissionais e informações.',
    fallbackImage: '',
    tagline: 'Uma presença digital elegante para seu salão.',
    highlights: [
      'Apresentação',
      'Serviços',
      'Profissionais',
      'Ambiente',
      'Contato',
    ],
    clientIndustry: 'Salão',
    accentColor: 'blue',
    briefingType: 'Salão',
    structure: [
      'Apresentação do salão',
      'Serviços',
      'Profissionais',
      'Galeria',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'grok-workspace',
    name: 'Projeto Grok Workspace',
    category: 'Tecnologia',
    tier: 'Essencial',
    url: '',
    description:
      'Projeto demonstrativo desenvolvido para explorar uma experiência digital moderna.',
    fallbackImage: '',
    tagline: 'Experiência digital moderna.',
    highlights: [
      'Interface moderna',
      'Experiência responsiva',
      'Apresentação',
      'Navegação',
    ],
    clientIndustry: 'Tecnologia',
    accentColor: 'blue',
    briefingType: 'Tecnologia',
    structure: [
      'Apresentação',
      'Recursos',
      'Destaques',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },
];

export const PROFISSIONAL_PROJECTS: ProjectItem[] = [
  {
    id: 'nova-arq',
    name: 'NOVA ARQ',
    category: 'Arquitetura',
    tier: 'Profissional',
    url: '',
    description:
      'Projeto profissional desenvolvido para uma apresentação mais completa e sofisticada de serviços de arquitetura.',
    fallbackImage: '',
    tagline: 'Arquitetura apresentada com identidade.',
    highlights: [
      'Apresentação profissional',
      'Projetos',
      'Serviços',
      'Portfólio',
      'Contato',
    ],
    clientIndustry: 'Arquitetura',
    accentColor: 'emerald',
    briefingType: 'Arquitetura',
    structure: [
      'Apresentação',
      'Sobre o escritório',
      'Projetos',
      'Serviços',
      'Portfólio',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'lumiere',
    name: 'LUMIÈRE',
    category: 'Clínica / Saúde',
    tier: 'Profissional',
    url: '',
    description:
      'Projeto profissional para uma apresentação elegante de serviços, informações e atendimento.',
    fallbackImage: '',
    tagline: 'Uma experiência digital elegante.',
    highlights: [
      'Apresentação',
      'Serviços',
      'Especialidades',
      'Informações',
      'Contato',
    ],
    clientIndustry: 'Clínica',
    accentColor: 'emerald',
    briefingType: 'Clínica',
    structure: [
      'Apresentação da clínica',
      'Especialidades',
      'Serviços',
      'Profissionais',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'vertex-digital',
    name: 'VERTEX DIGITAL',
    category: 'Tecnologia',
    tier: 'Profissional',
    url: '',
    description:
      'Projeto profissional para empresas de tecnologia que precisam apresentar soluções e serviços de forma clara.',
    fallbackImage: '',
    tagline: 'Tecnologia com presença digital profissional.',
    highlights: [
      'Apresentação',
      'Soluções',
      'Serviços',
      'Diferenciais',
      'Contato',
    ],
    clientIndustry: 'Tecnologia',
    accentColor: 'emerald',
    briefingType: 'Tecnologia',
    structure: [
      'Apresentação',
      'Soluções',
      'Serviços',
      'Diferenciais',
      'Sobre a empresa',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },
];

export const PREMIUM_PROJECTS: ProjectItem[] = [
  {
    id: 'academia-premium',
    name: 'Academia Premium',
    category: 'Academia / Fitness',
    tier: 'Premium',
    url: 'https://academia-premium-beryl.vercel.app/',
    description:
      'Projeto premium desenvolvido para demonstrar uma experiência mais completa para academias.',
    fallbackImage: '',
    tagline: 'Experiência premium para sua academia.',
    highlights: [
      'Experiência visual premium',
      'Apresentação completa',
      'Modalidades',
      'Estrutura',
      'Contato',
    ],
    clientIndustry: 'Academia',
    accentColor: 'amber',
    briefingType: 'Academia',
    structure: [
      'Apresentação',
      'Modalidades',
      'Estrutura',
      'Planos',
      'Benefícios',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'engenharia-premium',
    name: 'Engenharia Premium',
    category: 'Engenharia / Construção',
    tier: 'Premium',
    url: 'https://engenharia-premium.vercel.app/',
    description:
      'Projeto premium para empresas de engenharia e construção apresentarem seus serviços e projetos.',
    fallbackImage: '',
    tagline: 'Engenharia apresentada com autoridade.',
    highlights: [
      'Apresentação premium',
      'Projetos',
      'Serviços',
      'Experiência profissional',
      'Contato',
    ],
    clientIndustry: 'Engenharia',
    accentColor: 'amber',
    briefingType: 'Engenharia',
    structure: [
      'Apresentação',
      'Serviços',
      'Projetos',
      'Diferenciais',
      'Sobre a empresa',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'imobiliaria-premium',
    name: 'Imobiliária Premium',
    category: 'Imobiliária',
    tier: 'Premium',
    url: 'https://imobili-ria-premium.vercel.app/',
    description:
      'Projeto premium para apresentar imóveis e serviços imobiliários com uma experiência mais sofisticada.',
    fallbackImage: '',
    tagline: 'Imóveis apresentados em alto padrão.',
    highlights: [
      'Apresentação premium',
      'Imóveis',
      'Detalhes',
      'Localização',
      'Contato',
    ],
    clientIndustry: 'Imobiliária',
    accentColor: 'amber',
    briefingType: 'Imobiliária',
    structure: [
      'Apresentação',
      'Imóveis em destaque',
      'Detalhes dos imóveis',
      'Localização',
      'Sobre a empresa',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'loja-premium',
    name: 'Loja Premium',
    category: 'Loja / E-commerce',
    tier: 'Premium',
    url: 'https://loja-premium.vercel.app/',
    description:
      'Projeto premium desenvolvido para apresentar uma loja com experiência visual mais completa.',
    fallbackImage: '',
    tagline: 'Uma experiência premium para sua loja.',
    highlights: [
      'Experiência premium',
      'Produtos',
      'Categorias',
      'Destaques',
      'Contato',
    ],
    clientIndustry: 'Loja',
    accentColor: 'amber',
    briefingType: 'Loja',
    structure: [
      'Apresentação',
      'Produtos',
      'Categorias',
      'Destaques',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'clinica-premium',
    name: 'Clínica Premium',
    category: 'Clínica / Saúde',
    tier: 'Premium',
    url: 'https://grok-workspace-1-three-alpha.vercel.app/',
    description:
      'Projeto premium para clínicas apresentarem serviços, especialidades e atendimento.',
    fallbackImage: '',
    tagline: 'Uma experiência premium para sua clínica.',
    highlights: [
      'Apresentação premium',
      'Especialidades',
      'Serviços',
      'Profissionais',
      'Contato',
    ],
    clientIndustry: 'Clínica',
    accentColor: 'amber',
    briefingType: 'Clínica',
    structure: [
      'Apresentação',
      'Especialidades',
      'Serviços',
      'Profissionais',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'restaurante-premium',
    name: 'Restaurante Premium',
    category: 'Restaurante',
    tier: 'Premium',
    url: '',
    description:
      'Projeto premium para restaurantes apresentarem sua experiência, cardápio e identidade.',
    fallbackImage: '',
    tagline: 'Uma experiência premium para seu restaurante.',
    highlights: [
      'Experiência premium',
      'Cardápio',
      'Pratos',
      'Ambiente',
      'Contato',
    ],
    clientIndustry: 'Restaurante',
    accentColor: 'amber',
    briefingType: 'Restaurante',
    structure: [
      'Apresentação',
      'Cardápio',
      'Pratos em destaque',
      'Ambiente',
      'Informações',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },

  {
    id: 'kings-barber-premium',
    name: 'King’s Barber Premium',
    category: 'Barbearia',
    tier: 'Premium',
    url: '',
    description:
      'Projeto premium para barbearias apresentarem seus serviços, ambiente e identidade de forma sofisticada.',
    fallbackImage: '',
    tagline: 'Uma experiência premium para sua barbearia.',
    highlights: [
      'Experiência premium',
      'Serviços',
      'Ambiente',
      'Diferenciais',
      'Contato',
    ],
    clientIndustry: 'Barbearia',
    accentColor: 'amber',
    briefingType: 'Barbearia',
    structure: [
      'Apresentação',
      'Serviços',
      'Ambiente',
      'Diferenciais',
      'Galeria',
      'Contato',
    ],
    plans: DEFAULT_PLANS,
  },
];

export const ALL_PROJECTS: ProjectItem[] = [
  ...ESSENCIAL_PROJECTS,
  ...PROFISSIONAL_PROJECTS,
  ...PREMIUM_PROJECTS,
];

/**
 * Verifica com precisão se o projeto possui uma demonstração real publicada na web
 */
export function isProjectPublished(project: ProjectItem): boolean {
  return Boolean(
    project.url &&
    project.url !== '#' &&
    (project.url.startsWith('http://') || project.url.startsWith('https://'))
  );
}

/**
 * Contadores oficiais reais do portfólio da NexaWeb
 */
export const TOTAL_PROJECTS_COUNT = ALL_PROJECTS.length; // 22 projetos
export const PUBLISHED_PROJECTS_COUNT = ALL_PROJECTS.filter(isProjectPublished).length; // 15 sites reais no ar
export const CONCEPT_PROJECTS_COUNT = TOTAL_PROJECTS_COUNT - PUBLISHED_PROJECTS_COUNT; // 7 projetos em homologação

