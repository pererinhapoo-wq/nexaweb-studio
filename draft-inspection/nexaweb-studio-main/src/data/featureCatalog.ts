export type FeatureComplexity =
  | 'Básica'
  | 'Intermediária'
  | 'Avançada'
  | 'Sistema / Tempo Real';

export type UserRoleType = 'cliente' | 'profissional' | 'administrador';

export interface FeatureItem {
  id: string;
  name: string;
  shortDesc: string;
  complexity: FeatureComplexity;
  compatiblePlans: ('Essencial' | 'Profissional' | 'Personalizado' | 'Premium')[];
  requiresBackend?: boolean;
  requiresAuth?: boolean;
  requiresDatabase?: boolean;
  requiresRealtime?: boolean;
  userRoles?: UserRoleType[];
  additionalModule?: string;
  badge?: string;
  price?: number;
}

export interface StatsDemonstration {
  title: string;
  metrics: { label: string; value: string; detail?: string }[];
  note?: string;
}

export interface AccountRolesDefinition {
  cliente: { label: string; capabilities: string[] };
  profissional: { label: string; capabilities: string[] };
  administrador: { label: string; capabilities: string[] };
}

export interface SegmentPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  defaultStructure: string[];
  standardFeatures: string[]; // Feature IDs
  advancedFeatures: string[]; // Feature IDs
  realtimeFeatures: string[]; // Feature IDs
  statsExample?: StatsDemonstration;
  accountRoles?: AccountRolesDefinition;
  adminDashboardModules?: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CATÁLOGO CENTRAL DE TODAS AS FUNCIONALIDADES NEXAWEB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const FEATURE_CATALOG: Record<string, FeatureItem> = {
  // Extras e Customizações Disponíveis
  'pagina-adicional': {
    id: 'pagina-adicional',
    name: 'Página adicional',
    shortDesc: 'Página exclusiva para detalhamento de serviços, termos ou portfólio',
    complexity: 'Básica',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
    price: 150,
  },
  'formulario-personalizado': {
    id: 'formulario-personalizado',
    name: 'Formulário personalizado',
    shortDesc: 'Campos sob medida, envio condicional e disparo customizado',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
    price: 200,
  },
  'personalizacao-avancada': {
    id: 'personalizacao-avancada',
    name: 'Personalização avançada',
    shortDesc: 'Recursos exclusivos de layout, efeitos avançados e fluxos sob medida',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    price: 300,
  },
  'galeria-fotos-videos': {
    id: 'galeria-fotos-videos',
    name: 'Galeria de fotos e vídeos',
    shortDesc: 'Exibição multimídia em alta resolução com lightbox e vídeos institucionais',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
    price: 150,
  },
  'animacoes-suaves': {
    id: 'animacoes-suaves',
    name: 'Animações suaves',
    shortDesc: 'Transições suaves de entrada, revelação e microinterações de interface',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
    price: 150,
  },
  'efeitos-rolagem': {
    id: 'efeitos-rolagem',
    name: 'Efeitos de rolagem',
    shortDesc: 'Efeitos dinâmicos de scroll, profundidade parallax e revelação gradual',
    complexity: 'Básica',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
    price: 150,
  },
  'reserva-salas': {
    id: 'reserva-salas',
    name: 'Reserva de salas',
    shortDesc: 'Módulo de reserva e disponibilidade para salas e espaços compartilhados',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    price: 300,
  },

  // Comuns & Essenciais (Básicas)
  'whatsapp-btn': {
    id: 'whatsapp-btn',
    name: 'Botão fixo de WhatsApp',
    shortDesc: 'Acesso direto e instantâneo para conversão rápida de clientes',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'form-contato': {
    id: 'form-contato',
    name: 'Formulário comercial direto',
    shortDesc: 'Captação de leads qualificados entregues no WhatsApp e e-mail',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'galeria-fotos': {
    id: 'galeria-fotos',
    name: 'Galeria visual de fotos / trabalhos',
    shortDesc: 'Exibição de imagens em alta definição e lightbox responsivo',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'google-maps': {
    id: 'google-maps',
    name: 'Localização Google Maps interativo',
    shortDesc: 'Mapa integrado com rota guiada para o estabelecimento físico',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'depoimentos': {
    id: 'depoimentos',
    name: 'Depoimentos e avaliações',
    shortDesc: 'Prova social com notas, fotos e comentários reais de clientes',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'redes-sociais': {
    id: 'redes-sociais',
    name: 'Integração com redes sociais',
    shortDesc: 'Links dinâmicos para Instagram, YouTube, LinkedIn e TikTok',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'faq-duvidas': {
    id: 'faq-duvidas',
    name: 'Perguntas Frequentes (FAQ sanfona)',
    shortDesc: 'Respostas para dúvidas recorrentes que quebram objeções de compra',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'grade-horarios': {
    id: 'grade-horarios',
    name: 'Grade de horários e turnos',
    shortDesc: 'Tabela interativa de funcionamento, aulas ou atendimento',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'tabela-precos': {
    id: 'tabela-precos',
    name: 'Tabela de planos e mensalidades',
    shortDesc: 'Comparativo visual de pacotes com destaques de benefícios',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'galeria-videos': {
    id: 'galeria-videos',
    name: 'Exibição de vídeos institucionais',
    shortDesc: 'Vídeos de demonstração e ambientação integrados',
    complexity: 'Básica',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'link-matricula': {
    id: 'link-matricula',
    name: 'Link direto para matrícula / adesão',
    shortDesc: 'Redirecionamento para checkout ou sistema de pagamentos externo',
    complexity: 'Básica',
    compatiblePlans: ['Essencial', 'Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'cardapio-digital': {
    id: 'cardapio-digital',
    name: 'Cardápio digital por categorias',
    shortDesc: 'Menu interativo com fotos, ingredientes, tags e valores',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'agendamento-simples': {
    id: 'agendamento-simples',
    name: 'Módulo de solicitação de agendamento',
    shortDesc: 'Seleção de data, serviço e profissional com disparo automático',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'catalogo-produtos': {
    id: 'catalogo-produtos',
    name: 'Catálogo de produtos com filtros',
    shortDesc: 'Busca por categoria, faixa de preço e características',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'busca-imoveis': {
    id: 'busca-imoveis',
    name: 'Buscador de imóveis com filtros',
    shortDesc: 'Filtros por bairro, dormitórios, valor e tipo de imóvel',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },
  'solicitacao-orcamento': {
    id: 'solicitacao-orcamento',
    name: 'Calculador / Solicitador de orçamento',
    shortDesc: 'Formulário guiado em etapas para especificação de serviço',
    complexity: 'Intermediária',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: false,
  },

  // Funcionalidades Avançadas (Requerem suporte de conta, painel ou banco)
  'area-aluno': {
    id: 'area-aluno',
    name: 'Área exclusiva do aluno / cliente',
    shortDesc: 'Ambiente com login protegido para dados individuais e conteúdos',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    requiresDatabase: true,
    userRoles: ['cliente', 'administrador'],
    additionalModule: 'Módulo de Membros e Autenticação',
  },
  'historico-treinos': {
    id: 'historico-treinos',
    name: 'Histórico de treinos e frequência',
    shortDesc: 'Registro das sessões realizadas, sequência de dias e evolução',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    userRoles: ['cliente', 'profissional'],
    additionalModule: 'Módulo de Frequência e Atividades',
  },
  'estatisticas-progresso': {
    id: 'estatisticas-progresso',
    name: 'Estatísticas de progresso e metas',
    shortDesc: 'Painel com resumos semanais, mensais, horas ativas e objetivos',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    additionalModule: 'Módulo de Métricas e Performance',
  },
  'area-treinador': {
    id: 'area-treinador',
    name: 'Área do treinador / profissional',
    shortDesc: 'Visão dos alunos vinculados, fichas de treino e avaliações',
    complexity: 'Avançada',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    userRoles: ['profissional'],
    additionalModule: 'Módulo de Gestão de Especialistas',
  },
  'painel-administrativo': {
    id: 'painel-administrativo',
    name: 'Painel administrativo (Dashboard)',
    shortDesc: 'Visão executiva com controle de usuários, métricas e relatórios',
    complexity: 'Avançada',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    userRoles: ['administrador'],
    additionalModule: 'Painel de Gestão Completo',
  },
  'conta-cliente': {
    id: 'conta-cliente',
    name: 'Sistema de contas de clientes',
    shortDesc: 'Cadastro, login com senha, perfil, histórico de pedidos e visitas',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    requiresDatabase: true,
    userRoles: ['cliente'],
    additionalModule: 'Módulo de Contas e Perfis',
  },
  'gestao-agenda': {
    id: 'gestao-agenda',
    name: 'Agenda de atendimentos com múltiplos profissionais',
    shortDesc: 'Gestão de horários, bloqueios de folga e confirmações',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    userRoles: ['profissional', 'administrador'],
    additionalModule: 'Módulo de Agenda Operacional',
  },
  'pedido-online': {
    id: 'pedido-online',
    name: 'Pedido online com carrinho de compras',
    shortDesc: 'Seleção de itens, adicionais, observações e checkout de entrega',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    additionalModule: 'Módulo de Pedidos e Delivery',
  },
  'favoritos-busca': {
    id: 'favoritos-busca',
    name: 'Lista de favoritos e histórico salvo',
    shortDesc: 'Permite ao visitante salvar itens e comparar depois',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
  },
  'acompanhamento-veiculo': {
    id: 'acompanhamento-veiculo',
    name: 'Acompanhamento do status do veículo',
    shortDesc: 'Área onde o proprietário confere etapa do reparo e fotos do serviço',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    userRoles: ['cliente', 'profissional'],
    additionalModule: 'Módulo de Ordens de Serviço',
  },
  'reserva-quartos': {
    id: 'reserva-quartos',
    name: 'Sistema de reserva de hospedagem e disponibilidade',
    shortDesc: 'Calendário de datas com cálculo de diárias e hóspedes',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    additionalModule: 'Motor de Reservas e Tarifário',
  },
  'cursos-progresso': {
    id: 'cursos-progresso',
    name: 'Plataforma de aulas com controle de progresso',
    shortDesc: 'Vídeo-aulas, materiais em PDF, marcação de concluído e certificados',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    requiresDatabase: true,
    userRoles: ['cliente', 'profissional', 'administrador'],
    additionalModule: 'LMS / Plataforma EAD',
  },
  'galeria-privada': {
    id: 'galeria-privada',
    name: 'Galeria privada com seleção e aprovação de fotos',
    shortDesc: 'Área protegida por senha para cliente selecionar e aprovar fotos',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    additionalModule: 'Módulo de Entrega e Prova de Fotos',
  },
  'acompanhamento-obras': {
    id: 'acompanhamento-obras',
    name: 'Diário de obras e acompanhamento de projeto',
    shortDesc: 'Cronograma, fotos das etapas, relatórios de medição e documentos',
    complexity: 'Avançada',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    requiresDatabase: true,
    additionalModule: 'Módulo de Engenharia e Obras',
  },
  'conteudo-exclusivo': {
    id: 'conteudo-exclusivo',
    name: 'Área VIP de membros / Conteúdos protegidos',
    shortDesc: 'Acesso restrito para apoiadores, assinantes ou mentorados',
    complexity: 'Avançada',
    compatiblePlans: ['Profissional', 'Personalizado', 'Premium'],
    requiresBackend: true,
    requiresAuth: true,
    additionalModule: 'Módulo de Assinaturas e Comunidade',
  },

  // ⚡ SISTEMA / FUNCIONALIDADES EM TEMPO REAL
  // (Identificadas com ⚡ e estruturadas para arquitetura real-time)
  'rt-ocupacao-academia': {
    id: 'rt-ocupacao-academia',
    name: '⚡ Ocupação e fluxo da academia em tempo real',
    shortDesc: 'Indicador ao vivo de pessoas treinando agora e capacidade disponível',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
    additionalModule: 'Módulo IoT / Catraca / WebSocket',
  },
  'rt-equipamentos': {
    id: 'rt-equipamentos',
    name: '⚡ Disponibilidade de equipamentos em uso',
    shortDesc: 'Status de máquinas em uso, horário de início e previsão de liberação',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-fila-espera-barbearia': {
    id: 'rt-fila-espera-barbearia',
    name: '⚡ Fila de espera ao vivo e tempo estimado',
    shortDesc: 'Quantas pessoas estão na fila agora, barbeiros atendendo e cadeiras vagas',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
    additionalModule: 'Painel de Fila / TV / Celular',
  },
  'rt-mesas-restaurante': {
    id: 'rt-mesas-restaurante',
    name: '⚡ Ocupação de mesas e status de pedidos',
    shortDesc: 'Mesas livres/ocupadas, fila presencial e status ao vivo (cozinha/pronto)',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
    additionalModule: 'KDS Cozinha & Salão',
  },
  'rt-status-imovel': {
    id: 'rt-status-imovel',
    name: '⚡ Status ao vivo do imóvel (Disponível/Reservado/Vendido)',
    shortDesc: 'Atualização instantânea de reservas, horários de visitação e corretores livres',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-status-oficina': {
    id: 'rt-status-oficina',
    name: '⚡ Etapa da manutenção do veículo em tempo real',
    shortDesc: 'Atualização ao vivo: Recebido → Avaliação → Manutenção → Concluído',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-quartos-hotel': {
    id: 'rt-quartos-hotel',
    name: '⚡ Disponibilidade instantânea e status de governança',
    shortDesc: 'Quartos livres, ocupados, em limpeza e liberados em tempo real',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-estoque-ecommerce': {
    id: 'rt-estoque-ecommerce',
    name: '⚡ Estoque sincronizado e status da entrega ao vivo',
    shortDesc: 'Baixa de estoque instantânea e rastreio de preparação do pedido em tempo real',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-aulas-aovivo': {
    id: 'rt-aulas-aovivo',
    name: '⚡ Aulas acontecendo agora e presença em tempo real',
    shortDesc: 'Notificação de aula ao vivo iniciada, vagas restantes e check-in instantâneo',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-checkin-eventos': {
    id: 'rt-checkin-eventos',
    name: '⚡ Check-in ao vivo de participantes e vagas restantes',
    shortDesc: 'Controle de lotação em tempo real e validação instantânea de ingressos',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
  'rt-progresso-obras': {
    id: 'rt-progresso-obras',
    name: '⚡ Atualizações e status da obra em tempo real',
    shortDesc: 'Feed ao vivo de evolução da obra, liberação de etapas e medições aprovadas',
    complexity: 'Sistema / Tempo Real',
    compatiblePlans: ['Personalizado', 'Premium'],
    requiresBackend: true,
    requiresDatabase: true,
    requiresRealtime: true,
    badge: 'Tempo Real',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESETS DETALHADOS POR SEGMENTO (Prontos para Escala)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SEGMENT_PRESETS: Record<string, SegmentPreset> = {
  academia: {
    id: 'academia',
    name: 'Academia / Fitness / Crossfit',
    badge: 'Fitness & Saúde',
    description:
      'Soluções completas para academias, estúdios de pilates, boxes de crossfit e personal trainers.',
    defaultStructure: [
      'Início / Destaque',
      'Sobre Nós / Metodologia',
      'Modalidades & Aulas',
      'Professores & Equipe',
      'Grade de Horários',
      'Planos & Mensalidades',
      'Galeria do Espaço',
      'Depoimentos de Alunos',
      'Perguntas Frequentes (FAQ)',
      'Localização & Google Maps',
      'Contato & Matrícula',
    ],
    standardFeatures: [
      'whatsapp-btn',
      'form-contato',
      'grade-horarios',
      'tabela-precos',
      'galeria-fotos',
      'galeria-videos',
      'google-maps',
      'depoimentos',
      'redes-sociais',
      'link-matricula',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'area-aluno',
      'historico-treinos',
      'estatisticas-progresso',
      'area-treinador',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-ocupacao-academia',
      'rt-equipamentos',
    ],
    statsExample: {
      title: 'Exemplo de Métricas Demonstrativas do Aluno:',
      metrics: [
        { label: 'Frequência Semanal', value: '4 dias treinados', detail: 'Meta: 4/5 dias' },
        { label: 'Volume no Mês', value: '16 treinos concluídos', detail: '14h20 de atividade' },
        { label: 'Consistência', value: '3 semanas consecutivas', detail: 'Ritmo excelente' },
        { label: 'Próxima Aula Agendada', value: 'Quinta-feira às 18:00', detail: 'Cross Training' },
      ],
      note: 'Painel demonstrativo preparado para integração com banco de dados e autenticação.',
    },
    accountRoles: {
      cliente: {
        label: 'Aluno',
        capabilities: ['Cadastro e login seguro', 'Perfil com dados físicos', 'Histórico e registro de presença', 'Próximos treinos e metas'],
      },
      profissional: {
        label: 'Treinador / Instrutor',
        capabilities: ['Login com credencial técnica', 'Agenda de aulas e turnos', 'Consulta de alunos matriculados', 'Lançamento de fichas'],
      },
      administrador: {
        label: 'Gestor da Academia',
        capabilities: ['Dashboard geral de matrículas', 'Ocupação da unidade em tempo real', 'Relatórios financeiros e operacionais', 'Controle de acessos'],
      },
    },
    adminDashboardModules: [
      'Resumo de matriculados ativos',
      'Fluxo de presença por horário',
      'Planos mais procurados',
      'Novos interessados captados pelo site',
    ],
  },

  barbearia: {
    id: 'barbearia',
    name: 'Barbearia / Salão / Estética',
    badge: 'Beleza & Estilo',
    description:
      'Projetado para barbearias premium, salões de beleza, estúdios de tatuagem e clínicas estéticas.',
    defaultStructure: [
      'Início com Identidade Forte',
      'Sobre a Barbearia / Conceito',
      'Lista de Serviços & Procedimentos',
      'Profissionais & Especialistas',
      'Valores & Pacotes',
      'Galeria de Cortes & Trabalhos',
      'Depoimentos de Clientes',
      'FAQ',
      'Localização & Mapa',
      'Contato & Agendamento',
    ],
    standardFeatures: [
      'whatsapp-btn',
      'agendamento-simples',
      'form-contato',
      'galeria-fotos',
      'redes-sociais',
      'google-maps',
      'depoimentos',
      'tabela-precos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'conta-cliente',
      'gestao-agenda',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-fila-espera-barbearia',
    ],
    statsExample: {
      title: 'Métricas Operacionais Demonstrativas:',
      metrics: [
        { label: 'Cortes no Mês', value: '184 atendimentos', detail: 'Média de 8/dia por cadeira' },
        { label: 'Tempo Médio', value: '38 minutos', detail: 'Por atendimento' },
        { label: 'Retenção de Clientes', value: '82%', detail: 'Clientes recorrentes' },
        { label: 'Avaliação Média', value: '4.9 ★★★★★', detail: 'Baseado em 140 avaliações' },
      ],
      note: 'Dados operacionais sincronizáveis via sistema de agendamento.',
    },
    accountRoles: {
      cliente: {
        label: 'Cliente',
        capabilities: ['Histórico de cortes e profissionais favoritos', 'Agendamentos futuros', 'Lembretes automáticos via WhatsApp'],
      },
      profissional: {
        label: 'Barbeiro / Esteticista',
        capabilities: ['Agenda pessoal do dia', 'Status: Disponível / Em atendimento', 'Comissão e atendimentos realizados'],
      },
      administrador: {
        label: 'Proprietário',
        capabilities: ['Visão completa de faturamento', 'Controle da fila ao vivo', 'Configuração de serviços e horários'],
      },
    },
    adminDashboardModules: [
      'Fila de espera presencial',
      'Faturamento diário e mensal',
      'Ocupação de cadeiras por turno',
      'Avaliações recebidas',
    ],
  },

  restaurante: {
    id: 'restaurante',
    name: 'Restaurante / Gastronomia / Bar',
    badge: 'Alimentos & Bebidas',
    description:
      'Experiências digitais apetitosas para restaurantes, hamburguerias, cafeterias, bistrôs e pizzarias.',
    defaultStructure: [
      'Início com Fotos Impactantes',
      'Cardápio Digital Completo',
      'Categorias (Entradas, Principais, Bebidas)',
      'História & Experiência Gastronômica',
      'Galeria de Pratos & Ambiente',
      'Horários de Funcionamento',
      'Localização & Estacionamento',
      'Reserva de Mesas & Contato',
    ],
    standardFeatures: [
      'cardapio-digital',
      'whatsapp-btn',
      'form-contato',
      'google-maps',
      'redes-sociais',
      'galeria-fotos',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'pedido-online',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-mesas-restaurante',
    ],
    statsExample: {
      title: 'Métricas de Restaurante Demonstrativas:',
      metrics: [
        { label: 'Mesas Ocupadas Agora', value: '14 de 18 mesas', detail: 'Ocupação de 77%' },
        { label: 'Tempo de Espera', value: '~15 minutos', detail: 'Fila de 3 grupos' },
        { label: 'Prato Mais Pedido', value: 'Bife Ancho Premium', detail: '42 pedidos hoje' },
        { label: 'Tempo Médio Cozinha', value: '22 minutos', detail: 'Do pedido à mesa' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Cliente',
        capabilities: ['Cardápio salvo', 'Histórico de pedidos delivery', 'Reserva antecipada de mesa'],
      },
      profissional: {
        label: 'Garçom / Cozinha',
        capabilities: ['Visualização de mesas', 'Status de preparo (Cozinha KDS)', 'Confirmação de entrega'],
      },
      administrador: {
        label: 'Gerente / Chef',
        capabilities: ['Edição de cardápio e preços', 'Controle de mesas ao vivo', 'Relatório de vendas e pratos'],
      },
    },
    adminDashboardModules: [
      'Status das mesas do salão',
      'Pedidos em andamento na cozinha',
      'Ticket médio por mesa',
      'Reservas confirmadas para hoje',
    ],
  },

  imobiliaria: {
    id: 'imobiliaria',
    name: 'Imobiliária / Corretores / Lançamentos',
    badge: 'Mercado Imobiliário',
    description:
      'Catálogo de alta conversão para imobiliárias, corretores autônomos e incorporadoras.',
    defaultStructure: [
      'Início com Busca Rápida',
      'Imóveis em Destaque',
      'Lançamentos & Oportunidades',
      'Sobre a Imobiliária / Credibilidade',
      'Nossos Corretores / Especialistas',
      'Guia de Bairros & Localização',
      'Depoimentos de Compradores',
      'Simulador / Contato para Visitas',
    ],
    standardFeatures: [
      'busca-imoveis',
      'galeria-fotos',
      'whatsapp-btn',
      'form-contato',
      'google-maps',
      'redes-sociais',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'favoritos-busca',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-status-imovel',
    ],
    statsExample: {
      title: 'Métricas Imobiliárias Demonstrativas:',
      metrics: [
        { label: 'Carteira Ativa', value: '142 imóveis disponíveis', detail: 'Venda e Locação' },
        { label: 'Visitas Agendadas', value: '18 esta semana', detail: '6 corretores atuando' },
        { label: 'Tempo Médio Venda', value: '45 dias', detail: 'Para imóveis exclusivos' },
        { label: 'Imóveis Reservados', value: '7 em negociação', detail: 'Atualizado hoje' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Interessado / Comprador',
        capabilities: ['Lista de imóveis favoritos', 'Alertas de novos imóveis no perfil', 'Solicitação de agendamento de visita'],
      },
      profissional: {
        label: 'Corretor de Imóveis',
        capabilities: ['Gestão de leads atribuídos', 'Agenda de visitas com clientes', 'Status de negociações em andamento'],
      },
      administrador: {
        label: 'Diretor / Gestor Imobiliário',
        capabilities: ['Cadastro e aprovação de imóveis', 'Distribuição de leads entre corretores', 'Métricas de VGV e comissões'],
      },
    },
    adminDashboardModules: [
      'Total de captações e vendas no mês',
      'Imóveis mais visualizados',
      'Desempenho por corretor',
      'Leads aguardando primeiro contato',
    ],
  },

  automotivo: {
    id: 'automotivo',
    name: 'Oficina / Automotivo / Centro Automotivo',
    badge: 'Mecânica & Auto',
    description:
      'Presença profissional para oficinas mecânicas, auto centers, funilarias e estéticas automotivas.',
    defaultStructure: [
      'Início com Serviços Principais',
      'Serviços Mecânicos & Diagnósticos',
      'Sobre a Oficina / Tecnologia & Garantia',
      'Equipe Mecânica Especializada',
      'Galeria de Instalações & Ferramentas',
      'Marcas & Montadoras Atendidas',
      'Localização & Fácil Acesso',
      'Solicitar Orçamento / Agendamento',
    ],
    standardFeatures: [
      'solicitacao-orcamento',
      'whatsapp-btn',
      'agendamento-simples',
      'form-contato',
      'google-maps',
      'galeria-fotos',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'acompanhamento-veiculo',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-status-oficina',
    ],
    statsExample: {
      title: 'Métricas da Oficina Demonstrativas:',
      metrics: [
        { label: 'Veículos no Pátio', value: '8 em serviço agora', detail: 'Capacidade para 12' },
        { label: 'Tempo de Diagnóstico', value: 'Em até 3 horas', detail: 'Scanner computadorizado' },
        { label: 'Serviços Concluídos', value: '94 este mês', detail: 'Garantia de 90 dias' },
        { label: 'Avaliação de Clientes', value: '4.9 ★ (Google)', detail: '180 opiniões' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Proprietário do Veículo',
        capabilities: ['Cadastro do veículo (placa, modelo, ano)', 'Acompanhamento do status do conserto', 'Aprovação de orçamentos pelo site'],
      },
      profissional: {
        label: 'Mecânico / Consultor',
        capabilities: ['Atualização de etapa da OS', 'Upload de fotos de peças desgastadas', 'Registro de peças trocadas'],
      },
      administrador: {
        label: 'Gestor da Oficina',
        capabilities: ['Visão de boxes ocupados', 'Orçamentos pendentes de aprovação', 'Faturamento de serviços e peças'],
      },
    },
    adminDashboardModules: [
      'Ordens de serviço em andamento',
      'Veículos prontos para retirada',
      'Peças aguardando chegada',
      'Faturamento semanal',
    ],
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel / Pousada / Hospedagem',
    badge: 'Hospitalidade & Turismo',
    description:
      'Sites imersivos para pousadas charmosas, hotéis boutique, resorts e chalés de serra.',
    defaultStructure: [
      'Início com Imagens Cinematográficas',
      'Acomodações & Suítes',
      'Experiências & Lazer (Piscina, Gastronomia)',
      'Sobre a Pousada / Natureza & Paz',
      'Galeria de Fotos',
      'Localização & Como Chegar',
      'Depoimentos de Hóspedes',
      'Tarifário & Reservas Diretas',
    ],
    standardFeatures: [
      'galeria-fotos',
      'galeria-videos',
      'whatsapp-btn',
      'form-contato',
      'google-maps',
      'tabela-precos',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'reserva-quartos',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-quartos-hotel',
    ],
    statsExample: {
      title: 'Métricas de Hospedagem Demonstrativas:',
      metrics: [
        { label: 'Taxa de Ocupação', value: '88% no final de semana', detail: '14 de 16 chalés' },
        { label: 'Diária Média', value: 'R$ 480', detail: 'Com café da manhã incluso' },
        { label: 'Check-ins Hoje', value: '6 chegadas previstas', detail: 'A partir das 14h' },
        { label: 'Satisfação', value: '9.6 no Booking / Google', detail: 'Avaliação excelente' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Hóspede',
        capabilities: ['Visualização da reserva confirmada', 'Solicitação antecipada de berço ou vinho', 'Check-in web antecipado'],
      },
      profissional: {
        label: 'Recepção / Governança',
        capabilities: ['Controle de quartos limpos/em limpeza', 'Lista de check-in e check-out do dia', 'Lançamento de consumos'],
      },
      administrador: {
        label: 'Administrador do Hotel',
        capabilities: ['Calendário de tarifas e temporadas', 'Relatório de faturamento e ocupação', 'Bloqueio de datas'],
      },
    },
    adminDashboardModules: [
      'Mapa de ocupação de quartos',
      'Entradas e saídas de hóspedes do dia',
      'Tarifas por temporada',
      'Reservas diretas vs comissões',
    ],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'Loja / E-commerce / Varejo',
    badge: 'Comércio Eletrônico',
    description:
      'Catálogo de produtos com conversão otimizada para vestuário, eletrônicos, cosméticos e varejo.',
    defaultStructure: [
      'Início com Banners Promocionais',
      'Categorias em Destaque',
      'Lançamentos & Mais Vendidos',
      'Sobre a Marca / Missão',
      'Garantia & Frete Rápido',
      'Depoimentos & Unboxing',
      'Perguntas Frequentes de Envio',
      'Newsletter & Rodapé Comercial',
    ],
    standardFeatures: [
      'catalogo-produtos',
      'whatsapp-btn',
      'form-contato',
      'redes-sociais',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'pedido-online',
      'conta-cliente',
      'favoritos-busca',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-estoque-ecommerce',
    ],
    statsExample: {
      title: 'Métricas de Varejo Demonstrativas:',
      metrics: [
        { label: 'Itens em Catálogo', value: '320 produtos ativos', detail: '12 categorias' },
        { label: 'Taxa de Conversão', value: '2.8%', detail: 'Acima da média de mercado' },
        { label: 'Ticket Médio', value: 'R$ 185', detail: '2.4 itens por pedido' },
        { label: 'Tempo de Envio', value: 'Em até 24h úteis', detail: 'Envio rápido' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Comprador',
        capabilities: ['Carrinho salvo e lista de desejos', 'Histórico e rastreio de entregas', 'Gestão de endereços salvos'],
      },
      profissional: {
        label: 'Expedição / Estoquista',
        capabilities: ['Separação de pedidos pagos', 'Impressão de etiquetas de envio', 'Atualização de código de rastreamento'],
      },
      administrador: {
        label: 'Lojista',
        capabilities: ['Gestão de catálogo e estoque', 'Relatório de vendas e ticket médio', 'Criação de cupons promocionais'],
      },
    },
    adminDashboardModules: [
      'Pedidos recentes aguardando envio',
      'Alerta de estoque baixo',
      'Faturamento diário e mensal',
      'Produtos mais vendidos',
    ],
  },

  educacao: {
    id: 'educacao',
    name: 'Educação / Cursos / Treinamentos',
    badge: 'Ensino & Treinamentos',
    description:
      'Soluções didáticas para infoprodutores, escolas particulares, cursos profissionalizantes e mentorias.',
    defaultStructure: [
      'Início com Proposta de Valor do Curso',
      'Grade Curricular & Módulos',
      'Sobre o Professor / Autoridade',
      'Depoimentos & Casos de Sucesso de Alunos',
      'Certificados & Reconhecimento',
      'Valores & Condições de Matrícula',
      'Garantia Incondicional',
      'FAQ & Contato de Suporte',
    ],
    standardFeatures: [
      'link-matricula',
      'galeria-videos',
      'whatsapp-btn',
      'form-contato',
      'depoimentos',
      'tabela-precos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'cursos-progresso',
      'area-aluno',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-aulas-aovivo',
    ],
    statsExample: {
      title: 'Métricas Educacionais Demonstrativas:',
      metrics: [
        { label: 'Alunos Formados', value: '+1.400 certificados', detail: 'Em 18 estados' },
        { label: 'Taxa de Conclusão', value: '78%', detail: 'Alto engajamento' },
        { label: 'Avaliação dos Alunos', value: '9.8 / 10', detail: 'Satisfação comprovada' },
        { label: 'Aulas Disponíveis', value: '64 aulas em HD', detail: 'Acesso por 1 ano' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Estudante / Aluno',
        capabilities: ['Assistir aulas e download de PDFs', 'Controle de progresso por módulo', 'Emissão automática de certificado'],
      },
      profissional: {
        label: 'Professor / Tutor',
        capabilities: ['Upload de novos módulos e aulas', 'Resposta a dúvidas nos comentários', 'Acompanhamento do índice de conclusão'],
      },
      administrador: {
        label: 'Diretor Acadêmico',
        capabilities: ['Gestão de matrículas e acessos', 'Controle financeiro de inscrições', 'Estatísticas de retenção de alunos'],
      },
    },
    adminDashboardModules: [
      'Novas matrículas do mês',
      'Progresso geral da turma',
      'Dúvidas de alunos pendentes',
      'Emissões de certificados',
    ],
  },

  fotografia: {
    id: 'fotografia',
    name: 'Fotografia / Vídeo / Audiovisual',
    badge: 'Artes Visuais',
    description:
      'Portfólio de estética refinada para fotógrafos de casamento, moda, ensaios e produtoras de vídeo.',
    defaultStructure: [
      'Início com Galeria de Destaque',
      'Sobre o Fotógrafo / Olhar & Essência',
      'Portfólios por Categoria (Casamentos, Ensaios)',
      'Pacotes & Como Funciona a Sessão',
      'Depoimentos & Momentos Emocionantes',
      'Perguntas Frequentes sobre Ensaio',
      'Contato Direto & Agendamento de Data',
    ],
    standardFeatures: [
      'galeria-fotos',
      'galeria-videos',
      'whatsapp-btn',
      'form-contato',
      'redes-sociais',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'galeria-privada',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [],
    statsExample: {
      title: 'Métricas de Produção Demonstrativas:',
      metrics: [
        { label: 'Ensaios Realizados', value: '380 sessões entregues', detail: 'Em 6 anos' },
        { label: 'Fotos Tratadas', value: '+45.000 imagens', detail: 'Color grading autoral' },
        { label: 'Tempo Médio Entrega', value: '15 dias corridos', detail: 'Galeria online' },
        { label: 'Casamentos Marcados', value: '18 datas no ano', detail: 'Agenda selecionada' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Cliente / Noivos',
        capabilities: ['Acesso à galeria restrita por senha', 'Favoritar e selecionar fotos para o álbum', 'Download das fotos em alta resolução'],
      },
      profissional: {
        label: 'Fotógrafo / Editor',
        capabilities: ['Criação de novas galerias de clientes', 'Visualização das fotos escolhidas', 'Aprovação de layout do álbum'],
      },
      administrador: {
        label: 'Gestor do Estúdio',
        capabilities: ['Controle de datas na agenda', 'Contratos assinados e pagamentos', 'Arquivamento de backups'],
      },
    },
    adminDashboardModules: [
      'Sessões agendadas no mês',
      'Galerias aguardando seleção do cliente',
      'Álbuns em fase de diagramação',
      'Contratos fechados',
    ],
  },

  eventos: {
    id: 'eventos',
    name: 'Eventos / Festas / Congressos',
    badge: 'Produção de Eventos',
    description:
      'Páginas de alto impacto para congressos, conferências, festivais, casamentos e cerimoniais.',
    defaultStructure: [
      'Início com Data, Local e Chamada de Inscrição',
      'Programação Oficial & Palestrantes',
      'Sobre o Evento / Edições Anteriores',
      'Localização & Hospedagem Próxima',
      'Lotes de Ingressos & Inscrições',
      'Patrocinadores & Apoiadores',
      'FAQ do Participante',
      'Contato da Organização',
    ],
    standardFeatures: [
      'link-matricula',
      'grade-horarios',
      'galeria-fotos',
      'galeria-videos',
      'whatsapp-btn',
      'google-maps',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-checkin-eventos',
    ],
    statsExample: {
      title: 'Métricas do Evento Demonstrativas:',
      metrics: [
        { label: 'Ingressos Emitidos', value: '840 de 1.000 vagas', detail: '84% das vagas' },
        { label: 'Lote Atual', value: '2º Lote disponível', detail: 'Vira em 3 dias' },
        { label: 'Palestrantes Confirmados', value: '14 especialistas', detail: '2 palcos simultâneos' },
        { label: 'Check-in ao Vivo', value: 'Pronto para portaria', detail: 'Leitura QR Code' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Participante',
        capabilities: ['Ingresso digital no celular (QR Code)', 'Programação personalizada de palestras', 'Certificado pós-evento'],
      },
      profissional: {
        label: 'Equipe de Recepção / Credenciamento',
        capabilities: ['Validação rápida de ingressos na portaria', 'Registro de presença instantâneo', 'Entrega de crachás'],
      },
      administrador: {
        label: 'Organizador do Evento',
        capabilities: ['Monitoramento de lotação em tempo real', 'Relatório de vendas por lote e canal', 'Comunicação em massa com inscritos'],
      },
    },
    adminDashboardModules: [
      'Lotação ao vivo do local',
      'Vendas por lote de ingresso',
      'Check-ins realizados por portaria',
      'Faturamento total do evento',
    ],
  },

  engenharia: {
    id: 'engenharia',
    name: 'Engenharia / Arquitetura / Construção',
    badge: 'Arquitetura & Projetos',
    description:
      'Portfólios estruturados para construtoras, escritórios de arquitetura, engenheiros civis e reformas.',
    defaultStructure: [
      'Início com Obras Realizadas',
      'Nossos Serviços & Especialidades',
      'Projetos Concluídos & Em Andamento',
      'Sobre o Escritório / Equipe Técnica',
      'Metodologia & Certificações de Qualidade',
      'Depoimentos de Contratantes',
      'Solicitar Orçamento / Estudo Técnico',
      'Contato & Endereço',
    ],
    standardFeatures: [
      'galeria-fotos',
      'solicitacao-orcamento',
      'whatsapp-btn',
      'form-contato',
      'google-maps',
      'depoimentos',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'acompanhamento-obras',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [
      'rt-progresso-obras',
    ],
    statsExample: {
      title: 'Métricas Construtivas Demonstrativas:',
      metrics: [
        { label: 'Metros Construídos', value: '+35.000 m²', detail: 'Em 42 empreendimentos' },
        { label: 'Obras em Execução', value: '6 projetos ativos', detail: 'Cronograma 100% no prazo' },
        { label: 'Equipe Técnica', value: '18 engenheiros e arquitetos', detail: 'CREA e CAU ativos' },
        { label: 'Satisfação Pós-Obra', value: '98%', detail: 'Garantia estrutural' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Proprietário / Contratante',
        capabilities: ['Acesso ao diário da obra com fotos semanais', 'Documentos, plantas e memoriais descritivos', 'Acompanhamento do cronograma financeiro'],
      },
      profissional: {
        label: 'Engenheiro Residente',
        capabilities: ['Lançamento de relatórios diários de obra', 'Upload de fotos do canteiro', 'Medições de empreiteiros'],
      },
      administrador: {
        label: 'Diretoria de Obras',
        capabilities: ['Controle global de cronogramas e custos', 'Aprovação de medições e aditivos', 'Relatórios executivos'],
      },
    },
    adminDashboardModules: [
      'Percentual concluído por obra',
      'Relatórios semanais pendentes',
      'Orçamentos técnicos em elaboração',
      'Índice de conformidade do canteiro',
    ],
  },

  criador: {
    id: 'criador',
    name: 'Criador de Conteúdo / Influenciador',
    badge: 'Criadores & Mídia',
    description:
      'Hub central para criadores de conteúdo, YouTubers, podcasters e autoridades digitais.',
    defaultStructure: [
      'Início com Apresentação do Criador',
      'Últimos Conteúdos & Vídeos',
      'Redes Sociais & Canais Oficiais',
      'Projetos, Cursos & E-books',
      'Mídia Kit para Marcas & Patrocínios',
      'Depoimentos & Comunidade',
      'Newsletter VIP',
      'Contato Comercial & Assessoria',
    ],
    standardFeatures: [
      'redes-sociais',
      'galeria-videos',
      'whatsapp-btn',
      'form-contato',
      'link-matricula',
      'faq-duvidas',
    ],
    advancedFeatures: [
      'conteudo-exclusivo',
      'conta-cliente',
      'painel-administrativo',
    ],
    realtimeFeatures: [],
    statsExample: {
      title: 'Métricas de Audiência Demonstrativas:',
      metrics: [
        { label: 'Seguidores Totais', value: '450 mil seguidores', detail: 'Canais somados' },
        { label: 'Visualizações / Mês', value: '1.8 milhão de views', detail: 'Engajamento de 6.4%' },
        { label: 'Newsletter VIP', value: '18.500 inscritos', detail: 'Taxa de abertura de 38%' },
        { label: 'Parcerias Realizadas', value: '+40 marcas atendidas', detail: 'Mídia Kit atualizado' },
      ],
    },
    accountRoles: {
      cliente: {
        label: 'Membro / Fã VIP',
        capabilities: ['Acesso a materiais e podcasts exclusivos', 'Descontos em produtos oficiais', 'Canal direto para sugestões de pauta'],
      },
      profissional: {
        label: 'Assessor / Editor',
        capabilities: ['Atualização de links e banners', 'Gestão de propostas comerciais de marcas', 'Envio de comunicados'],
      },
      administrador: {
        label: 'Criador de Conteúdo',
        capabilities: ['Estatísticas de cliques nos links', 'Base de e-mails da newsletter', 'Controle de parcerias ativas'],
      },
    },
    adminDashboardModules: [
      'Cliques nos links oficiais',
      'Novos inscritos na newsletter',
      'Propostas comerciais recebidas',
      'Mídia kit visualizado',
    ],
  },

  // Outros Segmentos adicionais preparados para o catálogo
  prestador: {
    id: 'prestador',
    name: 'Prestador de Serviço / Autônomo',
    badge: 'Serviços Especializados',
    description: 'Para eletricistas, encanadores, técnicos de ar-condicionado e prestadores locais.',
    defaultStructure: ['Início', 'Serviços', 'Diferenciais', 'Galeria', 'Depoimentos', 'Contato'],
    standardFeatures: ['whatsapp-btn', 'form-contato', 'google-maps', 'depoimentos', 'faq-duvidas'],
    advancedFeatures: ['conta-cliente', 'painel-administrativo'],
    realtimeFeatures: [],
  },

  clinica: {
    id: 'clinica',
    name: 'Clínica Médica / Odontologia / Saúde',
    badge: 'Saúde & Cuidados',
    description: 'Para médicos, dentistas, psicólogos, fisioterapeutas e laboratórios.',
    defaultStructure: ['Início', 'Especialidades', 'Corpo Clínico', 'Instalações', 'Convênios', 'Contato'],
    standardFeatures: ['whatsapp-btn', 'agendamento-simples', 'google-maps', 'faq-duvidas'],
    advancedFeatures: ['conta-cliente', 'gestao-agenda', 'painel-administrativo'],
    realtimeFeatures: [],
  },

  petshop: {
    id: 'petshop',
    name: 'Pet Shop / Veterinário / Banho & Tosa',
    badge: 'Mundo Pet',
    description: 'Para clínicas veterinárias, hotéis para cães e banho & tosa.',
    defaultStructure: ['Início', 'Serviços Pet', 'Produtos', 'Estrutura', 'Depoimentos', 'Localização', 'Contato'],
    standardFeatures: ['whatsapp-btn', 'agendamento-simples', 'catalogo-produtos', 'google-maps'],
    advancedFeatures: ['conta-cliente', 'painel-administrativo'],
    realtimeFeatures: [],
  },

  advocacia: {
    id: 'advocacia',
    name: 'Advocacia / Escritório Jurídico',
    badge: 'Jurídico & Consultoria',
    description: 'Para advogados associados, consultorias empresariais e áreas especializadas do direito.',
    defaultStructure: ['Início', 'Áreas de Atuação', 'Sócios & Advogados', 'Artigos & Notícias', 'Contato Sigiloso'],
    standardFeatures: ['whatsapp-btn', 'form-contato', 'google-maps', 'faq-duvidas'],
    advancedFeatures: ['conta-cliente', 'painel-administrativo'],
    realtimeFeatures: [],
  },

  contabilidade: {
    id: 'contabilidade',
    name: 'Contabilidade / Finanças / B2B',
    badge: 'Gestão Financeira',
    description: 'Para escritórios de contabilidade, auditoria e assessoria tributária.',
    defaultStructure: ['Início', 'Serviços Contábeis', 'Abertura de Empresa', 'Segmentos Atendidos', 'Contato'],
    standardFeatures: ['solicitacao-orcamento', 'whatsapp-btn', 'form-contato', 'faq-duvidas'],
    advancedFeatures: ['conta-cliente', 'painel-administrativo'],
    realtimeFeatures: [],
  },

  empresa: {
    id: 'empresa',
    name: 'Empresa B2B / Institucional',
    badge: 'Corporativo',
    description: 'Para indústrias, distribuidoras e empresas que atendem clientes corporativos.',
    defaultStructure: ['Início', 'Sobre a Empresa', 'Soluções B2B', 'Casos de Sucesso', 'Contato Comercial'],
    standardFeatures: ['solicitacao-orcamento', 'whatsapp-btn', 'form-contato', 'galeria-fotos'],
    advancedFeatures: ['painel-administrativo'],
    realtimeFeatures: [],
  },
};

// Helper: busca preset por ID ou texto
export function findSegmentPreset(query?: string | null): SegmentPreset {
  if (!query) return SEGMENT_PRESETS['academia'];
  const normalized = query.toLowerCase().trim();

  for (const [key, preset] of Object.entries(SEGMENT_PRESETS)) {
    if (key === normalized) return preset;
    if (preset.name.toLowerCase().includes(normalized)) return preset;
    if (normalized.includes(key)) return preset;
  }

  // Common keyword matches
  if (normalized.includes('fit') || normalized.includes('cross') || normalized.includes('trein')) return SEGMENT_PRESETS['academia'];
  if (normalized.includes('barb') || normalized.includes('salao') || normalized.includes('cabel') || normalized.includes('estet')) return SEGMENT_PRESETS['barbearia'];
  if (normalized.includes('rest') || normalized.includes('comid') || normalized.includes('gastro') || normalized.includes('pizz') || normalized.includes('hamb')) return SEGMENT_PRESETS['restaurante'];
  if (normalized.includes('imob') || normalized.includes('corret') || normalized.includes('imove')) return SEGMENT_PRESETS['imobiliaria'];
  if (normalized.includes('mecan') || normalized.includes('auto') || normalized.includes('oficin') || normalized.includes('carro')) return SEGMENT_PRESETS['automotivo'];
  if (normalized.includes('hotel') || normalized.includes('pousad') || normalized.includes('chale')) return SEGMENT_PRESETS['hotel'];
  if (normalized.includes('loja') || normalized.includes('e-comm') || normalized.includes('comerc') || normalized.includes('vend')) return SEGMENT_PRESETS['ecommerce'];
  if (normalized.includes('curso') || normalized.includes('educ') || normalized.includes('escola') || normalized.includes('aula')) return SEGMENT_PRESETS['educacao'];
  if (normalized.includes('foto') || normalized.includes('vide') || normalized.includes('audio')) return SEGMENT_PRESETS['fotografia'];
  if (normalized.includes('event') || normalized.includes('fest') || normalized.includes('show')) return SEGMENT_PRESETS['eventos'];
  if (normalized.includes('arq') || normalized.includes('eng') || normalized.includes('obra')) return SEGMENT_PRESETS['engenharia'];
  if (normalized.includes('criad') || normalized.includes('influ') || normalized.includes('conteud')) return SEGMENT_PRESETS['criador'];
  if (normalized.includes('medic') || normalized.includes('odont') || normalized.includes('saud') || normalized.includes('clinic')) return SEGMENT_PRESETS['clinica'];
  if (normalized.includes('pet') || normalized.includes('vet') || normalized.includes('cachorr')) return SEGMENT_PRESETS['petshop'];
  if (normalized.includes('advoc') || normalized.includes('jurid') || normalized.includes('lei')) return SEGMENT_PRESETS['advocacia'];
  if (normalized.includes('contab') || normalized.includes('fisc') || normalized.includes('tribut')) return SEGMENT_PRESETS['contabilidade'];

  return SEGMENT_PRESETS['empresa'];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TABELA DE PREÇOS BASE DOS PLANOS NO CONFIGURADOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const PLAN_BASE_PRICES: Record<string, number> = {
  Essencial: 1000,
  Profissional: 1700,
  Personalizado: 2800,
  Premium: 4500,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TABELA DE PREÇOS DOS EXTRAS E FUNCIONALIDADES ADICIONAIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const OPTION_PRICES: Record<string, number> = {
  // Exemplos explícitos do briefing / configurador
  'pagina-adicional': 150,
  'Página adicional': 150,
  'formulario-personalizado': 200,
  'Formulário personalizado': 200,
  'personalizacao-avancada': 300,
  'Personalização avançada': 300,

  // Funcionalidades comerciais / intermediárias
  'solicitacao-orcamento': 200,
  'Calculador / Solicitador de orçamento': 200,
  'cardapio-digital': 200,
  'Cardápio digital por categorias': 200,
  'Cardápio digital': 200,
  'agendamento-simples': 200,
  'Agendamento simples': 200,
  'Módulo de solicitação de agendamento': 200,
  'Sistema de reserva de mesas': 200,
  'catalogo-produtos': 200,
  'Catálogo de produtos': 200,
  'Catálogo de produtos com filtros': 200,
  'Catálogo interativo de itens': 200,
  'busca-imoveis': 200,
  'Busca de imóveis': 200,
  'Buscador de imóveis com filtros': 200,
  'Busca e filtros avançados de imóveis': 200,
  'favoritos-busca': 200,
  'Favoritos de busca': 200,
  'Lista de favoritos e histórico salvo': 200,
  'Lista de favoritos e imóveis salvos': 200,
  'galeria-videos': 150,
  'Exibição de vídeos institucionais': 150,
  'Galeria técnica de projetos executados': 150,
  'galeria-fotos': 150,
  'galeria-fotos-videos': 150,
  'Galeria de fotos e vídeos': 150,
  'Galeria de fotos / Trabalhos': 150,
  'Galeria visual de fotos / trabalhos': 150,
  'animacoes-suaves': 150,
  'Animações suaves': 150,
  'Animações suaves de entrada': 150,
  'efeitos-scroll': 150,
  'efeitos-rolagem': 150,
  'Efeitos de rolagem': 150,
  'Efeitos de scroll dinâmicos': 150,

  // Módulos avançados de sistema (R$ 300)
  'area-aluno': 300,
  'Área de alunos': 300,
  'Área exclusiva do aluno / cliente': 300,
  'Área do aluno com login': 300,
  'historico-treinos': 300,
  'Histórico de treinos e estatísticas': 300,
  'Histórico de treinos e frequência': 300,
  'Resultados e histórico de treinos': 300,
  'estatisticas-progresso': 300,
  'Estatísticas de progresso e metas': 300,
  'area-treinador': 300,
  'Área de treinadores': 300,
  'Área do treinador / profissional': 300,
  'painel-administrativo': 300,
  'Painel administrativo': 300,
  'Painel administrativo (Dashboard)': 300,
  'conta-cliente': 300,
  'Conta de cliente': 300,
  'Sistema de contas de clientes': 300,
  'gestao-agenda': 300,
  'Gestão de agendamentos': 300,
  'Agenda de atendimentos com múltiplos profissionais': 300,
  'pedido-online': 300,
  'Pedidos online': 300,
  'Pedido online com carrinho de compras': 300,
  'Pedidos online com carrinho': 300,
  'acompanhamento-veiculo': 300,
  'Rastreamento de veículos': 300,
  'Acompanhamento do status do veículo': 300,
  'reserva-salas': 300,
  'Reserva de salas': 300,
  'reserva-quartos': 300,
  'Sistema de reserva de hospedagem e disponibilidade': 300,
  'cursos-progresso': 300,
  'Cursos online': 300,
  'Plataforma de aulas com controle de progresso': 300,
  'galeria-privada': 300,
  'Galeria privada': 300,
  'Galeria privada com seleção e aprovação de fotos': 300,
  'acompanhamento-obras': 300,
  'Acompanhamento de obras': 300,
  'Diário de obras e acompanhamento de projeto': 300,
  'Diário de obras e relatórios técnicos': 300,
  'conteudo-exclusivo': 300,
  'Conteúdo exclusivo': 300,
  'Área VIP de membros / Conteúdos protegidos': 300,

  // Funcionalidades em tempo real (⚡ = R$ 300)
  'rt-ocupacao-academia': 300,
  'Ocupação da academia em tempo real': 300,
  '⚡ Ocupação e fluxo da academia em tempo real': 300,
  'rt-equipamentos': 300,
  'Status dos equipamentos em tempo real': 300,
  '⚡ Disponibilidade de equipamentos em uso': 300,
  'rt-fila-espera-barbearia': 300,
  'Fila da barbearia em tempo real': 300,
  '⚡ Fila de espera ao vivo e tempo estimado': 300,
  'rt-mesas-restaurante': 300,
  'Mesas do restaurante em tempo real': 300,
  '⚡ Ocupação de mesas e status de pedidos': 300,
  '⚡ Ocupação de mesas e status em tempo real': 300,
  'rt-status-imovel': 300,
  'Status de imóveis em tempo real': 300,
  '⚡ Status ao vivo do imóvel (Disponível/Reservado/Vendido)': 300,
  'rt-status-oficina': 300,
  'Status de serviços de oficina em tempo real': 300,
  '⚡ Etapa da manutenção do veículo em tempo real': 300,
  'rt-quartos-hotel': 300,
  'Disponibilidade de quartos de hotel em tempo real': 300,
  '⚡ Disponibilidade instantânea e status de governança': 300,
  'rt-estoque-ecommerce': 300,
  'Estoque de loja em tempo real': 300,
  '⚡ Estoque sincronizado e status da entrega ao vivo': 300,
  'rt-aulas-aovivo': 300,
  'Aulas ao vivo': 300,
  '⚡ Aulas acontecendo agora e presença em tempo real': 300,
  'rt-checkin-eventos': 300,
  'Check-in de eventos': 300,
  '⚡ Check-in ao vivo de participantes e vagas restantes': 300,
  'rt-progresso-obras': 300,
  'Progresso de obras em tempo real': 300,
  '⚡ Atualizações e status da obra em tempo real': 300,
};

// Helper universal de precificação de opções do configurador
export function getOptionPrice(item: string): number {
  if (!item) return 0;
  if (typeof OPTION_PRICES[item] === 'number') {
    return OPTION_PRICES[item];
  }
  const clean = item.replace(/^\+\s*/, '').trim();
  if (typeof OPTION_PRICES[clean] === 'number') {
    return OPTION_PRICES[clean];
  }
  const feat = FEATURE_CATALOG[item] || FEATURE_CATALOG[clean];
  if (feat?.price !== undefined) {
    return feat.price;
  }
  for (const f of Object.values(FEATURE_CATALOG)) {
    if (
      f.name.toLowerCase() === item.toLowerCase() ||
      f.id.toLowerCase() === item.toLowerCase() ||
      f.name.toLowerCase() === clean.toLowerCase() ||
      f.id.toLowerCase() === clean.toLowerCase()
    ) {
      return f.price ?? 0;
    }
  }
  return 0;
}

export function getCanonicalOptionId(item: string): string {
  if (!item) return '';
  const clean = item.replace(/^\+\s*/, '').trim();
  if (FEATURE_CATALOG[item]) return FEATURE_CATALOG[item].id;
  if (FEATURE_CATALOG[clean]) return FEATURE_CATALOG[clean].id;
  for (const f of Object.values(FEATURE_CATALOG)) {
    if (
      f.name.toLowerCase() === item.toLowerCase() ||
      f.id.toLowerCase() === item.toLowerCase() ||
      f.name.toLowerCase() === clean.toLowerCase() ||
      f.id.toLowerCase() === clean.toLowerCase()
    ) {
      return f.id;
    }
  }
  return clean.toLowerCase();
}

