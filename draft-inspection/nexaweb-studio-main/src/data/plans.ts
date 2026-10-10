export type PlanId = 'Essencial' | 'Personalizado' | 'Profissional' | 'Premium';

export interface PlanDetailData {
  id: PlanId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  price: string;
  targetAudience: string;
  turnaroundTime: string;
  accentColor: 'blue' | 'purple' | 'orange' | 'amber';
  inclusions: string[];
  differentials: string[];
}

export const PLANS_DATA: Record<PlanId, PlanDetailData> = {
  Essencial: {
    id: 'Essencial',
    name: 'Essencial',
    badge: 'Nível 01 · Presença Essencial',
    price: 'R$ 1.000',
    tagline: 'O essencial para colocar seu negócio na internet com profissionalismo',
    description:
      'Ideal para quem precisa de um site moderno, rápido e direto ao ponto. Uma solução sólida com excelente custo-benefício e entrega ágil.',
    targetAudience:
      'Profissionais autônomos, prestadores de serviços, pequenos negócios e criadores que desejam uma presença digital confiável.',
    turnaroundTime: '3 a 5 dias úteis',
    accentColor: 'blue',
    inclusions: [
      'Apresentação completa do negócio, serviços e diferenciais',
      'Estrutura essencial: Início, Sobre, Serviços, Informações e Contato',
      'Botão fixo e integração direta com WhatsApp para atendimento rápido',
      'Links para redes sociais e principais canais da marca',
      'Layout 100% responsivo para smartphones, tablets e computadores',
      'Otimização básica para Google (título, descrição e meta tags SEO)',
      'Hospedagem em nuvem de alta velocidade e certificado SSL de segurança',
      'Processo de aprovação antes da publicação definitiva',
    ],
    differentials: [
      'Entrega rápida e objetiva (3–5 dias)',
      'Investimento acessível e transparente',
      'Design limpo e sem poluição visual',
      'Fácil navegação para seus clientes',
    ],
  },

  Personalizado: {
    id: 'Personalizado',
    name: 'Personalizado',
    badge: 'Sob Medida · Exclusivo',
    price: 'a partir de R$ 2.800',
    tagline: 'Um projeto sob medida criado de acordo com as necessidades do seu negócio',
    description:
      'Liberdade total de configuração. Você escolhe o estilo visual, as seções necessárias, as funcionalidades desejadas e como imagina o site.',
    targetAudience:
      'Empresas ou profissionais que desejam um projeto único, com identidade própria, recursos específicos ou seções não convencionais.',
    turnaroundTime: 'Definido conforme o escopo do projeto',
    accentColor: 'purple',
    inclusions: [
      'Design exclusivo pensado para a identidade e posicionamento do negócio',
      'Estilo visual configurável: Moderno, Minimalista, Elegante, Luxuoso ou Criativo',
      'Seções sob medida: Início, Sobre, Serviços, Portfólio, Depoimentos, FAQ, etc.',
      'Funcionalidades personalizadas: WhatsApp avançado, Animações, Galeria, Scroll effects',
      'Escolha de paleta de cores personalizada ou sugestão da equipe NexaWeb',
      'Inclusão de referência de site ou modelo desejado pelo cliente',
      'Briefing interativo e configurável para detalhar cada etapa',
      'Acompanhamento e suporte durante todo o desenvolvimento',
    ],
    differentials: [
      'Sem templates genéricos: feito sob medida',
      'Flexibilidade total na escolha de seções e recursos',
      'Adaptação exata ao fluxo de atendimento do seu cliente',
      'Suporte consultivo para definir a melhor estrutura',
    ],
  },

  Profissional: {
    id: 'Profissional',
    name: 'Profissional',
    badge: 'Nível 02 · Autoridade e Conversão',
    price: 'R$ 1.700',
    tagline: 'Mais recursos e autoridade para fortalecer sua marca no mercado',
    description:
      'Uma solução robusta com maior aprofundamento de conteúdo, múltiplos blocos de autoridade e estratégia voltada para captação de clientes.',
    targetAudience:
      'Empresas estabelecidas, escritórios, consultorias, clínicas e comércios que precisam de uma presença digital com autoridade.',
    turnaroundTime: '5 a 8 dias úteis',
    accentColor: 'orange',
    inclusions: [
      'Estrutura aprofundada com páginas ou seções detalhadas para cada serviço',
      'Destaques interativos, cards explicativos e tabela comparativa',
      'Seções estratégicas: Diferenciais, Sobre a Equipe, Depoimentos de clientes e FAQ',
      'Chamadas para ação (CTAs) estrategicamente posicionadas para conversão',
      'Otimização de velocidade de carregamento (Core Web Vitals)',
      'Integração avançada com WhatsApp, e-mail e formulário de contato',
      'Adaptação visual detalhada para diferentes tamanhos de tela',
      'Aprovação prévia com ajustes antes do lançamento oficial',
    ],
    differentials: [
      'Maior transmissão de autoridade e credibilidade',
      'Mais espaço para explicar serviços e processos complexos',
      'Depoimentos e prova social organizados',
      'Excelente equilíbrio entre sofisticação e conversão',
    ],
  },

  Premium: {
    id: 'Premium',
    name: 'Premium',
    badge: 'Nível 03 · Alto Padrão',
    price: 'a partir de R$ 4.500',
    tagline: 'A experiência máxima de sofisticação visual, tecnologia e exclusividade',
    description:
      'Desenvolvido para marcas que desejam impressionar e se destacar no mercado de alto padrão com um site impecável, imersivo e de alto valor percebido.',
    targetAudience:
      'Marcas de alto padrão, clínicas de estética, imobiliárias de luxo, engenharia de prestígio, restaurantes refinados e academias boutique.',
    turnaroundTime: 'Conforme escopo com acompanhamento prioritário',
    accentColor: 'amber',
    inclusions: [
      'Direção de arte exclusiva com acabamento visual de alto padrão',
      'Microinterações refinadas, transições suaves e atmosfera visual imersiva',
      'Apresentação de alto impacto para portfólios, imóveis, cardápios ou tratamentos',
      'Copywriting e hierarquia visual voltados para marcas de prestígio',
      'Carregamento instantâneo com máxima fidelidade estética',
      'Integração completa com canais de atendimento VIP',
      'Revisão minuciosa de responsividade em smartphones e telas grandes',
      'Atendimento prioritário na etapa de briefing, aprovação e suporte',
    ],
    differentials: [
      'Impacto visual inesquecível para visitantes exigentes',
      'Posicionamento de mercado no topo do seu segmento',
      'Atenção obsessiva aos detalhes de design e fluidez',
      'Acompanhamento VIP durante todo o processo',
    ],
  },
};
