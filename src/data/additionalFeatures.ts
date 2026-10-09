export type AdditionalFeatureTier = '150' | '200' | '300' | 'scope';

export interface CommercialFeature {
  id: string;
  name: string;
  categoryLabel: string;
  priceBRL: number | null; // null represents "Sujeito à avaliação técnica de escopo"
  priceFormatted: string; // 'R$ 150', 'R$ 200', 'R$ 300' or 'Sujeito à avaliação técnica de escopo'
  unit: string; // 'por recurso' or 'sob avaliação'
  tier: AdditionalFeatureTier;
  compatiblePlans: ('Essencial' | 'Profissional' | 'Personalizado' | 'Premium')[];
  description: string;
  isRealtime?: boolean;
}

export const COMMERCIAL_RULES = [
  {
    icon: 'ShieldCheck',
    title: 'Não Cobrança Duplicada',
    description:
      'Uma funcionalidade já incluída no plano escolhido não é cobrada separadamente.',
  },
  {
    icon: 'Cpu',
    title: 'Compatibilidade Técnica',
    description:
      'Nem todos os recursos são compatíveis com todos os planos; recursos avançados e em tempo real exigem infraestrutura compatível.',
  },
  {
    icon: 'DollarSign',
    title: 'Preços Oficiais em Reais (BRL)',
    description:
      'Valores comerciais transparentes e confirmados por recurso adicional contratado.',
  },
  {
    icon: 'FileSpreadsheet',
    title: 'Escopos Complexos Sob Avaliação',
    description:
      'Para funcionalidades complexas ou integrações sem preço tabelado: “Sujeito à avaliação técnica de escopo”.',
  },
];

export const ADDITIONAL_FEATURES_LIST: CommercialFeature[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // R$ 150 POR RECURSO (Visual & Páginas)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'pagina-adicional',
    name: 'Página adicional',
    categoryLabel: 'Estrutura & Conteúdo',
    priceBRL: 150,
    priceFormatted: 'R$ 150',
    unit: 'por recurso',
    tier: '150',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Página exclusiva para detalhamento de serviços, institucional da empresa, equipe, termos ou portfólio dedicado.',
  },
  {
    id: 'galeria-fotos-videos',
    name: 'Galeria de fotos e vídeos',
    categoryLabel: 'Mídia & Portfólio',
    priceBRL: 150,
    priceFormatted: 'R$ 150',
    unit: 'por recurso',
    tier: '150',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    description:
      'Exibição multimídia em alta resolução com visualizador lightbox e integração para vídeos institucionais.',
  },
  {
    id: 'animacoes-suaves',
    name: 'Animações suaves',
    categoryLabel: 'Experiência Visual',
    priceBRL: 150,
    priceFormatted: 'R$ 150',
    unit: 'por recurso',
    tier: '150',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    description:
      'Transições refinadas de entrada, revelação suave de elementos e microinterações elegantes de interface.',
  },
  {
    id: 'efeitos-rolagem',
    name: 'Efeitos de rolagem',
    categoryLabel: 'Experiência Visual',
    priceBRL: 150,
    priceFormatted: 'R$ 150',
    unit: 'por recurso',
    tier: '150',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Efeitos dinâmicos de scroll, profundidade parallax e revelação progressiva ao deslizar pela página.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // R$ 200 POR RECURSO (Formulários & Módulos Comerciais)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'formulario-personalizado',
    name: 'Formulário personalizado',
    categoryLabel: 'Captação & Contato',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Campos sob medida com validações específicas e disparo direto para canais de atendimento ou e-mail.',
  },
  {
    id: 'solicitacao-orcamento',
    name: 'Solicitação de orçamento',
    categoryLabel: 'Captação & Contato',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Formulário guiado em etapas para detalhamento do serviço desejado e qualificação prévia de leads.',
  },
  {
    id: 'cardapio-digital',
    name: 'Cardápio digital',
    categoryLabel: 'Catálogo & Gastronomia',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Menu digital organizado por categorias, com fotos, descrições, tags, variações e valores dos pratos.',
  },
  {
    id: 'agendamento-simples',
    name: 'Agendamento simples',
    categoryLabel: 'Atendimento & Horários',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Módulo direto para escolha de serviço, data e horário com confirmação automática pelo WhatsApp.',
  },
  {
    id: 'catalogo-produtos',
    name: 'Catálogo de produtos',
    categoryLabel: 'Catálogo & Vendas',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Vitrine digital de produtos com filtros por categoria, especificações técnicas e botão direto de compra.',
  },
  {
    id: 'busca-imoveis',
    name: 'Busca de imóveis',
    categoryLabel: 'Imobiliário & Filtros',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Buscador direcionado com filtros por localização, número de dormitórios, faixa de valor e tipo de imóvel.',
  },
  {
    id: 'favoritos-busca',
    name: 'Favoritos de busca',
    categoryLabel: 'Interação & Conversão',
    priceBRL: 200,
    priceFormatted: 'R$ 200',
    unit: 'por recurso',
    tier: '200',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Permite aos visitantes salvarem itens ou imóveis favoritos na sessão para comparar e consultar mais tarde.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // R$ 300 POR RECURSO (Sistemas, Gestão & Tempo Real ⚡)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'personalizacao-avancada',
    name: 'Personalização avançada',
    categoryLabel: 'Sistemas & Sob Medida',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Desenvolvimento de seções autorais, fluxos de navegação exclusivos e regras de negócio personalizadas.',
  },
  {
    id: 'area-aluno',
    name: 'Área de alunos',
    categoryLabel: 'Portal & Autenticação',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Ambiente protegido por login com acesso a materiais didáticos, cronograma de aulas e dados individuais.',
  },
  {
    id: 'historico-treinos',
    name: 'Histórico de treinos e estatísticas',
    categoryLabel: 'Fitness & Métricas',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Registro das sessões executadas, sequência de frequência semanal, métricas de evolução e metas físicas.',
  },
  {
    id: 'area-treinador',
    name: 'Área de treinadores',
    categoryLabel: 'Portal & Especialistas',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Painel técnico exclusivo para treinadores acompanharem alunos vinculados, fichas técnicas e evolução.',
  },
  {
    id: 'painel-administrativo',
    name: 'Painel administrativo',
    categoryLabel: 'Gestão & Dashboard',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Dashboard central com métricas do negócio, controle de usuários, relatórios e gestão de cadastros.',
  },
  {
    id: 'conta-cliente',
    name: 'Conta de cliente',
    categoryLabel: 'Portal & Autenticação',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Sistema de cadastro e login com senha, perfil do usuário, histórico de pedidos e dados salvos.',
  },
  {
    id: 'gestao-agenda',
    name: 'Gestão de agendamentos',
    categoryLabel: 'Atendimento & Horários',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Controle operacional de horários com múltiplos profissionais, bloqueio de turnos e status de atendimento.',
  },
  {
    id: 'pedido-online',
    name: 'Pedidos online',
    categoryLabel: 'E-commerce & Checkout',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Fluxo completo com carrinho de compras, opções de adicionais, observações e checkout de entrega.',
  },
  {
    id: 'acompanhamento-veiculo',
    name: 'Rastreamento de veículos',
    categoryLabel: 'Automotivo & Serviços',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Área onde o proprietário confere o andamento do reparo automotivo com fotos e etapas do serviço.',
  },
  {
    id: 'reserva-salas',
    name: 'Reserva de salas',
    categoryLabel: 'Espaços & Calendário',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Sistema de agendamento e disponibilidade para salas de reunião, consultórios ou espaços compartilhados.',
  },
  {
    id: 'cursos-progresso',
    name: 'Cursos online',
    categoryLabel: 'EAD & Educação',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Plataforma de aulas com módulos, controle de progresso das aulas assistidas e materiais complementares.',
  },
  {
    id: 'galeria-privada',
    name: 'Galeria privada',
    categoryLabel: 'Mídia & Proteção',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Área protegida por senha para o cliente visualizar, selecionar, favoritar e aprovar fotos e materiais.',
  },
  {
    id: 'acompanhamento-obras',
    name: 'Acompanhamento de obras',
    categoryLabel: 'Engenharia & Projetos',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Diário digital de obras com fotos dos avanços, medições técnicas, cronograma físico e documentos.',
  },
  {
    id: 'conteudo-exclusivo',
    name: 'Conteúdo exclusivo',
    categoryLabel: 'Membros & VIP',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    description:
      'Área VIP de membros com conteúdos protegidos e restritos para assinantes, apoiadores ou mentorados.',
  },
  {
    id: 'rt-ocupacao-academia',
    name: 'Ocupação da academia em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Indicador ao vivo de lotação do espaço físico e fluxo de alunos treinando no momento.',
  },
  {
    id: 'rt-equipamentos',
    name: 'Status dos equipamentos em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Status de máquinas em uso, horário de início da sessão e estimativa de liberação no salão de treino.',
  },
  {
    id: 'rt-fila-espera-barbearia',
    name: 'Fila da barbearia em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Fila de espera ao vivo com quantidade de clientes aguardando, cadeiras ativas e tempo estimado.',
  },
  {
    id: 'rt-mesas-restaurante',
    name: 'Mesas do restaurante em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Ocupação de mesas do salão em tempo real e status de preparação dos pedidos na cozinha.',
  },
  {
    id: 'rt-status-imovel',
    name: 'Status de imóveis em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Atualização instantânea do status do imóvel (Disponível, Em Negociação, Reservado ou Vendido).',
  },
  {
    id: 'rt-status-oficina',
    name: 'Status de serviços de oficina em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Atualização ao vivo da etapa de manutenção do veículo (Recebido → Diagnóstico → Execução → Concluído).',
  },
  {
    id: 'rt-quartos-hotel',
    name: 'Disponibilidade de quartos de hotel em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Quartos livres, ocupados, em governança ou liberados atualizados com sincronização instantânea.',
  },
  {
    id: 'rt-estoque-ecommerce',
    name: 'Estoque de loja em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Baixa imediata de estoque e rastreamento de preparação do pedido atualizados ao vivo.',
  },
  {
    id: 'rt-aulas-aovivo',
    name: 'Aulas ao vivo',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Notificação ao vivo de aulas iniciadas, vagas restantes e registro de presença em tempo real.',
  },
  {
    id: 'rt-checkin-eventos',
    name: 'Check-in de eventos',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Controle presencial de lotação em tempo real e validação instantânea de ingressos e participantes.',
  },
  {
    id: 'rt-progresso-obras',
    name: 'Progresso de obras em tempo real',
    categoryLabel: 'Sistema em Tempo Real',
    priceBRL: 300,
    priceFormatted: 'R$ 300',
    unit: 'por recurso',
    tier: '300',
    compatiblePlans: ['Personalizado', 'Premium'],
    isRealtime: true,
    description:
      'Feed ao vivo de evolução física da obra, liberação de etapas e medições aprovadas.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INTEGRAÇÕES COMPLEXAS (Sujeito à avaliação técnica de escopo)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'integracao-erp-legado',
    name: 'Integração com ERP / CRM legado',
    categoryLabel: 'Integração Corporativa',
    priceBRL: null,
    priceFormatted: 'Sujeito à avaliação técnica de escopo',
    unit: 'sob avaliação',
    tier: 'scope',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Sincronização bidirecional de dados com sistemas internos de gestão, banco legado ou ERP específico.',
  },
  {
    id: 'gateway-split-pagamento',
    name: 'Gateway de pagamento customizado & Split',
    categoryLabel: 'Integração Corporativa',
    priceBRL: null,
    priceFormatted: 'Sujeito à avaliação técnica de escopo',
    unit: 'sob avaliação',
    tier: 'scope',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Fluxos avançados de pagamento com divisão de recebíveis (split), emissão fiscal automática ou adquirente dedicado.',
  },
  {
    id: 'api-corporativa-dedicada',
    name: 'APIs corporativas e arquitetura dedicada',
    categoryLabel: 'Integração Corporativa',
    priceBRL: null,
    priceFormatted: 'Sujeito à avaliação técnica de escopo',
    unit: 'sob avaliação',
    tier: 'scope',
    compatiblePlans: ['Personalizado', 'Premium'],
    description:
      'Desenvolvimento de conectores proprietários, microserviços específicos, SSO corporativo e alta concorrência.',
  },
];
