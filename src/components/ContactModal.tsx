import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  CheckCircle2,
  MessageCircle,
  Mail,
  ArrowLeft,
  ArrowRight,
  Shield,
  Award,
  Sparkles,
  Sliders,
  ImagePlus,
  Trash2,
  Upload,
  Palette,
  Layers,
  LayoutGrid,
  Edit3,
  Check,
  ExternalLink,
  Clock,
  Laptop,
  HelpCircle,
  Phone,
  User,
  AlertCircle,
  Zap,
  Database,
  Users,
  Activity,
  BarChart2,
  ShieldCheck,
  Instagram,
  Copy,
  Loader2,
} from 'lucide-react';
import { navigateTo } from '../router';
import type { ProjectItem } from '../data/projects';
import { PLANS_DATA, type PlanId } from './PlanDetailModal';
import { useScrollLock } from '../hooks/useScrollLock';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  NEXAWEB_CONTACT,
  hasOfficialWhatsApp,
  getOfficialWhatsAppUrl,
  getOfficialInstagramUrl,
} from '../config/contact';
import {
  FEATURE_CATALOG,
  SEGMENT_PRESETS,
  findSegmentPreset,
  type UserRoleType,
} from '../data/featureCatalog';

export type ServiceLevelType = PlanId;
export type ModelIntentType = 'exact' | 'inspiration' | 'custom_idea' | null;
export type BriefingStage = 'presentation' | 'briefing' | 'contact' | 'review';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onBackToProject?: () => void;
  serviceLevel?: ServiceLevelType | null;
  briefingType?: string | null;
  selectedProject?: ProjectItem | null;
  initialIntent?: ModelIntentType;
  initialDescription?: string;
  initialStage?: BriefingStage;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURADOR PERSONALIZADO CONSTANTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ESTILOS_VISUAIS = [
  {
    id: 'Moderno',
    name: 'Moderno',
    desc: 'Visual contemporâneo, tipografia marcante e contraste equilibrado',
  },
  {
    id: 'Minimalista',
    name: 'Minimalista',
    desc: 'Espaçamento generoso, foco no conteúdo essencial e sem excessos',
  },
  {
    id: 'Elegante',
    name: 'Elegante',
    desc: 'Linhas finas, tons sóbrios e acabamento estético sofisticado',
  },
  {
    id: 'Luxuoso',
    name: 'Luxuoso',
    desc: 'Paleta nobre, detalhes dourados ou metálicos e alto valor percebido',
  },
  {
    id: 'Criativo',
    name: 'Criativo',
    desc: 'Composições dinâmicas, elementos visuais ousados e identidade única',
  },
];

const SECOES_PERSONALIZADO_DEFAULT = [
  'Início / Destaque',
  'Sobre Nós / História',
  'Serviços / Especialidades',
  'Projetos / Portfólio',
  'Depoimentos de Clientes',
  'Perguntas Frequentes (FAQ)',
  'Contato / Localização',
];

const FUNCIONALIDADES_PERSONALIZADO_DEFAULT = [
  'Botão fixo de WhatsApp',
  'Formulário comercial direto',
  'Galeria de fotos / Trabalhos',
  'Animações suaves de entrada',
  'Efeitos de scroll dinâmicos',
  'Catálogo interativo de itens',
  'Integração com redes sociais',
];

export const SEGMENT_TAILORED_PRESETS: Record<
  string,
  {
    name: string;
    secoes: string[];
    recursos: string[];
  }
> = {
  academia: {
    name: 'Academia / Fitness',
    secoes: [
      'Modalidades & Aulas',
      'Grade de Horários',
      'Professores & Instrutores',
      'Planos & Mensalidades',
      'Área do Aluno (Login & Perfil)',
      'Agendamento de Treinos',
      'Presença & Frequência',
      'Resultados & Metas',
      'Próximos Treinos',
      'Localização & Contato',
    ],
    recursos: [
      'Área do aluno com login',
      'Agendamento de aulas',
      'Registro de presença',
      'Resultados e histórico de treinos',
      'Próximos treinos e notificações',
      '⚡ Ocupação e fluxo da academia em tempo real',
      '⚡ Disponibilidade de equipamentos em uso',
      'Botão fixo de WhatsApp',
      'Tabela de planos e mensalidades',
    ],
  },
  restaurante: {
    name: 'Restaurante / Gastronomia',
    secoes: [
      'Cardápio Digital Completo',
      'Categorias de Pratos e Bebidas',
      'Reserva de Mesas Online',
      'Pedidos Online & Delivery',
      'Status do Pedido ao Vivo',
      'Horários de Funcionamento',
      'Localização & Estacionamento',
      'Contato',
    ],
    recursos: [
      'Cardápio digital por categorias',
      'Sistema de reserva de mesas',
      'Pedidos online com carrinho',
      'Status do pedido ao vivo',
      '⚡ Ocupação de mesas e status em tempo real',
      'Botão fixo de WhatsApp',
      'Localização com rota no Google Maps',
    ],
  },
  imobiliaria: {
    name: 'Imobiliária / Corretores',
    secoes: [
      'Catálogo de Imóveis (Venda & Locação)',
      'Busca & Filtros Avançados',
      'Perfil de Corretores & Especialistas',
      'Agendamento de Visitas Presenciais',
      'Lista de Favoritos & Histórico',
      'Disponibilidade dos Imóveis',
      'Guia de Bairros & Localização',
      'Contato',
    ],
    recursos: [
      'Busca e filtros avançados de imóveis',
      'Lista de favoritos e imóveis salvos',
      'Agendamento de visitas com corretores',
      '⚡ Status ao vivo do imóvel (Disponível/Reservado/Vendido)',
      'Botão fixo de WhatsApp',
      'Localização Google Maps integrado',
    ],
  },
  engenharia: {
    name: 'Engenharia / Construção',
    secoes: [
      'Serviços & Especialidades de Engenharia',
      'Projetos Concluídos & Em Andamento',
      'Diário de Obras & Cronograma',
      'Portfólio Técnico de Engenharia',
      'Equipe de Engenheiros & Técnicos',
      'Solicitação de Orçamento / Estudo Técnico',
      'Certificações de Qualidade & Normas Técnicas',
      'Contato & Endereço',
    ],
    recursos: [
      'Galeria técnica de projetos executados',
      'Diário de obras e relatórios técnicos',
      'Formulário para solicitação de orçamento',
      'Apresentação de certificações e equipe',
      '⚡ Atualizações e status da obra em tempo real',
      'Botão fixo de WhatsApp',
    ],
  },
};

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onBackToProject,
  serviceLevel,
  briefingType,
  selectedProject,
  initialIntent,
  initialDescription,
  initialStage,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Hook 1: useScrollLock
  useScrollLock(isOpen);

  // Hook 1b: useModalA11y
  useModalA11y({
    isOpen,
    onClose,
    containerRef: modalRef,
  });

  // Hook 2: submitted
  const [submitted, setSubmitted] = useState(false);

  // Hook 2b: isSubmitting (previne envios duplicados)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook 2c: copiedSummary
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Hook 2d: portalAccessToken & isNavigatingPortal (Acesso direto à Área do Cliente)
  const [portalAccessToken, setPortalAccessToken] = useState<string | null>(null);
  const [isNavigatingPortal, setIsNavigatingPortal] = useState(false);

  // Hook 3: stage (presentation -> briefing -> contact -> review)
  const [stage, setStage] = useState<BriefingStage>(initialStage || 'presentation');

  // Hook 4: activePlan
  const [activePlan, setActivePlan] = useState<ServiceLevelType>(
    serviceLevel || (selectedProject?.tier as ServiceLevelType) || 'Essencial'
  );

  // Hook 5: modelIntent
  const [modelIntent, setModelIntent] = useState<ModelIntentType>(initialIntent ?? null);

  // Hook 6: selectedEstilos (for Personalizado & Profissional/Premium)
  const [selectedEstilos, setSelectedEstilos] = useState<string[]>([]);

  // Hook 7: selectedSecoes
  const [selectedSecoes, setSelectedSecoes] = useState<string[]>([]);

  // Hook 8: selectedFuncionalidades
  const [selectedFuncionalidades, setSelectedFuncionalidades] = useState<string[]>([]);

  // Hook 9: colorPreference
  const [colorPreference, setColorPreference] = useState<'custom' | 'suggest' | null>(null);

  // Hook 10: customColorsText
  const [customColorsText, setCustomColorsText] = useState('');

  // Hook 11: referenceUrl
  const [referenceUrl, setReferenceUrl] = useState('');

  // Hook 12: customDescription
  const [customDescription, setCustomDescription] = useState(initialDescription || '');

  // Hook 13: businessName
  const [businessName, setBusinessName] = useState('');

  // Hook 14: businessSegment
  const [businessSegment, setBusinessSegment] = useState('');

  // Hook 15: businessServices
  const [businessServices, setBusinessServices] = useState('');

  // Hook 16: clientName
  const [clientName, setClientName] = useState('');

  // Hook 17: clientPhone
  const [clientPhone, setClientPhone] = useState('');

  // Hook 18: clientEmail
  const [clientEmail, setClientEmail] = useState('');

  // Hook 19: clientNotes
  const [clientNotes, setClientNotes] = useState('');

  // Hook 20: photoFiles
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Hook 21: uploadingPhotos
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Hook 22: uploadError
  const [uploadError, setUploadError] = useState('');

  // Hook 22b: uploadedPhotoUrls & uploadStatus
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'fallback' | 'error'
  >('idle');

  // Hook 23: validationErrors
  const [validationErrors, setValidationErrors] = useState<{
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
  }>({});

  // Hook 24: selectedPresetId (for Profissional & Premium segment-specific briefing)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Hook 25: selectedAdvancedFeatures
  const [selectedAdvancedFeatures, setSelectedAdvancedFeatures] = useState<string[]>([]);

  // Hook 26: selectedRealtimeFeatures
  const [selectedRealtimeFeatures, setSelectedRealtimeFeatures] = useState<string[]>([]);

  // Hook 27: selectedAccountRoles
  const [selectedAccountRoles, setSelectedAccountRoles] = useState<UserRoleType[]>([]);

  // Hook 28: currentPreset
  const currentPreset = useMemo(() => {
    return findSegmentPreset(businessSegment || selectedPresetId);
  }, [businessSegment, selectedPresetId]);

  // Hook 28b: customSegmentOptions tailored for Personalizado plan (Academia, Restaurante, Imobiliaria, Engenharia, etc.)
  const customSegmentOptions = useMemo(() => {
    const key = (businessSegment || selectedPresetId || '').toLowerCase().trim();
    if (!key) {
      return {
        name: 'Geral / Sob Medida',
        secoes: SECOES_PERSONALIZADO_DEFAULT,
        recursos: FUNCIONALIDADES_PERSONALIZADO_DEFAULT,
      };
    }
    if (key.includes('fit') || key.includes('acad') || key.includes('cross')) {
      return SEGMENT_TAILORED_PRESETS['academia'];
    }
    if (
      key.includes('rest') ||
      key.includes('gastro') ||
      key.includes('comid') ||
      key.includes('pizz') ||
      key.includes('hamb')
    ) {
      return SEGMENT_TAILORED_PRESETS['restaurante'];
    }
    if (key.includes('imob') || key.includes('corret') || key.includes('imove')) {
      return SEGMENT_TAILORED_PRESETS['imobiliaria'];
    }
    if (key.includes('eng') || key.includes('obra') || key.includes('constr')) {
      return SEGMENT_TAILORED_PRESETS['engenharia'];
    }

    const preset = findSegmentPreset(key);
    return {
      name: preset.name,
      secoes: preset.defaultStructure.length > 0 ? preset.defaultStructure : SECOES_PERSONALIZADO_DEFAULT,
      recursos: [
        ...preset.standardFeatures.map((f) => FEATURE_CATALOG[f]?.name || f),
        ...preset.realtimeFeatures.map((f) => FEATURE_CATALOG[f]?.name || f),
      ],
    };
  }, [businessSegment, selectedPresetId]);

  // Hook 29: planData
  const planData = useMemo(() => {
    return PLANS_DATA[activePlan];
  }, [activePlan]);

  // Hook 30: theme
  const theme = useMemo(() => {
    switch (activePlan) {
      case 'Essencial':
        return {
          name: 'Essencial',
          badge: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
          border: 'border-blue-500/30',
          borderHover: 'hover:border-blue-500/50',
          borderActive: 'border-blue-500 bg-blue-500/10 text-blue-200',
          button:
            'bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 hover:brightness-105 text-neutral-950 font-bold shadow-lg shadow-blue-500/20',
          buttonSubtle: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30',
          text: 'text-blue-400',
          lightText: 'text-blue-300',
          bgSubtle: 'bg-blue-950/30',
          stepActive: 'bg-blue-500 text-neutral-950',
          stepLine: 'bg-blue-500',
          icon: <Shield className="w-4 h-4 text-blue-400" />,
          glow: 'rgba(59, 130, 246, 0.15)',
        };
      case 'Personalizado':
        return {
          name: 'Personalizado',
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          border: 'border-purple-500/30',
          borderHover: 'hover:border-purple-500/50',
          borderActive: 'border-purple-500 bg-purple-500/10 text-purple-200',
          button:
            'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:brightness-105 text-neutral-950 font-bold shadow-lg shadow-purple-500/20',
          buttonSubtle:
            'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30',
          text: 'text-purple-400',
          lightText: 'text-purple-300',
          bgSubtle: 'bg-purple-950/30',
          stepActive: 'bg-purple-500 text-neutral-950',
          stepLine: 'bg-purple-500',
          icon: <Sliders className="w-4 h-4 text-purple-400" />,
          glow: 'rgba(168, 85, 247, 0.15)',
        };
      case 'Profissional':
        return {
          name: 'Profissional',
          badge: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
          border: 'border-orange-500/30',
          borderHover: 'hover:border-orange-500/50',
          borderActive: 'border-orange-500 bg-orange-500/10 text-orange-200',
          button:
            'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:brightness-105 text-neutral-950 font-bold shadow-lg shadow-orange-500/20',
          buttonSubtle:
            'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30',
          text: 'text-orange-400',
          lightText: 'text-orange-300',
          bgSubtle: 'bg-orange-950/30',
          stepActive: 'bg-orange-500 text-neutral-950',
          stepLine: 'bg-orange-500',
          icon: <Award className="w-4 h-4 text-orange-400" />,
          glow: 'rgba(249, 115, 22, 0.15)',
        };
      case 'Premium':
      default:
        return {
          name: 'Premium',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          border: 'border-amber-500/30',
          borderHover: 'hover:border-amber-500/50',
          borderActive: 'border-amber-500 bg-amber-500/10 text-amber-200',
          button:
            'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 text-neutral-950 font-bold shadow-lg shadow-amber-400/20',
          buttonSubtle:
            'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30',
          text: 'text-amber-400',
          lightText: 'text-amber-300',
          bgSubtle: 'bg-amber-950/30',
          stepActive: 'bg-amber-400 text-neutral-950',
          stepLine: 'bg-amber-400',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          glow: 'rgba(245, 158, 11, 0.15)',
        };
    }
  }, [activePlan]);

  // Hook 26: rawBriefingSummary
  const rawBriefingSummary = useMemo(() => {
    const lines: string[] = [];
    lines.push('🌟 *BRIEFING OFICIAL — NEXAWEB*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`💼 *Plano Escolhido:* ${activePlan}`);
    lines.push(`💰 *Investimento:* ${planData.price}`);
    lines.push(`⏱️ *Prazo Estimado:* ${planData.turnaroundTime}`);

    if (selectedProject) {
      lines.push(`🎯 *Modelo de Referência:* ${selectedProject.name} (${selectedProject.tier})`);
      if (modelIntent === 'exact') {
        lines.push('📌 *Abordagem:* Quero exatamente este formato');
      } else if (modelIntent === 'inspiration') {
        lines.push('📌 *Abordagem:* Usar como inspiração para personalizar');
      }
    }

    if (businessName) lines.push(`🏢 *Nome do Negócio:* ${businessName}`);
    if (businessSegment) lines.push(`🏷️ *Segmento:* ${businessSegment}`);
    if (clientName) lines.push(`👤 *Responsável:* ${clientName}`);
    if (clientPhone) lines.push(`📱 *WhatsApp:* ${clientPhone}`);
    if (clientEmail) lines.push(`✉️ *E-mail:* ${clientEmail}`);
    lines.push('');

    // Specific plan custom details
    if (activePlan === 'Personalizado') {
      if (selectedEstilos.length > 0) lines.push(`🎨 *Estilo:* ${selectedEstilos.join(', ')}`);
      if (selectedSecoes.length > 0) lines.push(`📑 *Seções:* ${selectedSecoes.join(', ')}`);
      if (selectedFuncionalidades.length > 0) lines.push(`⚡ *Funcionalidades:* ${selectedFuncionalidades.join(', ')}`);
      if (colorPreference === 'custom') {
        lines.push(`🎨 *Cores:* ${customColorsText || 'Cores indicadas pelo cliente'}`);
      } else if (colorPreference === 'suggest') {
        lines.push('🎨 *Cores:* Quero que a NexaWeb sugira a melhor paleta');
      }
      if (referenceUrl) lines.push(`🔗 *Referência Visual:* ${referenceUrl}`);
      if (customDescription) lines.push(`📝 *Visão do Cliente:* ${customDescription}`);
    } else if (activePlan === 'Essencial') {
      if (businessServices) lines.push(`📋 *Serviços Principais:* ${businessServices}`);
      if (colorPreference === 'custom') {
        lines.push(`🎨 *Cores:* ${customColorsText || 'Cores indicadas pelo cliente'}`);
      } else if (colorPreference === 'suggest') {
        lines.push('🎨 *Cores:* Sugerida pela NexaWeb');
      }
    } else if (activePlan === 'Profissional' || activePlan === 'Premium') {
      lines.push(`👑 *Nível:* Plano ${activePlan}`);
      if (selectedPresetId) lines.push(`🏢 *Segmento Alvo:* ${currentPreset.name}`);
      if (selectedSecoes.length > 0) lines.push(`📑 *Estrutura Selecionada:* ${selectedSecoes.join(', ')}`);
      if (selectedFuncionalidades.length > 0) {
        const featNames = selectedFuncionalidades.map((id) => FEATURE_CATALOG[id]?.name || id);
        lines.push(`✨ *Funcionalidades:* ${featNames.join(', ')}`);
      }
      if (selectedAdvancedFeatures.length > 0) {
        const advNames = selectedAdvancedFeatures.map((id) => FEATURE_CATALOG[id]?.name || id);
        lines.push(`🚀 *Módulos Avançados:* ${advNames.join(', ')}`);
      }
      if (selectedRealtimeFeatures.length > 0) {
        const rtNames = selectedRealtimeFeatures.map((id) => FEATURE_CATALOG[id]?.name || id);
        lines.push(`⚡ *Recursos em Tempo Real:* ${rtNames.join(', ')}`);
      }
      if (selectedAccountRoles.length > 0) {
        lines.push(`👥 *Níveis de Acesso:* ${selectedAccountRoles.join(', ')}`);
      }
      if (referenceUrl) lines.push(`🔗 *Inspirações/Referências:* ${referenceUrl}`);
      if (customDescription) lines.push(`📝 *Visão do Projeto:* ${customDescription}`);
    }

    if (photoFiles.length > 0) {
      lines.push(`📎 *Arquivos Selecionados:* ${photoFiles.length} foto(s)/logo`);
    }

    if (clientNotes) lines.push(`💬 *Observações:* ${clientNotes}`);

    lines.push('');
    lines.push('Aguardando contato da equipe NexaWeb!');
    return lines.join('\n');
  }, [
    activePlan,
    planData,
    selectedProject,
    modelIntent,
    businessName,
    businessSegment,
    businessServices,
    clientName,
    clientPhone,
    clientEmail,
    clientNotes,
    selectedEstilos,
    selectedSecoes,
    selectedFuncionalidades,
    colorPreference,
    customColorsText,
    referenceUrl,
    customDescription,
    currentPreset,
    selectedAdvancedFeatures,
    selectedRealtimeFeatures,
    selectedAccountRoles,
    photoFiles.length,
  ]);

  // Hook 26b: encodedWhatsAppMessage
  const encodedWhatsAppMessage = useMemo(() => {
    return encodeURIComponent(rawBriefingSummary);
  }, [rawBriefingSummary]);

  const handleCopySummary = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawBriefingSummary);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = rawBriefingSummary;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (e) {
      console.warn('Copy summary notice:', e);
    }
  };

  // Hook 32: useEffect initialization
  useEffect(() => {
    if (!isOpen) return;

    setSubmitted(false);
    setIsSubmitting(false);
    setStage(initialStage || 'presentation'); // Start with Presentation unless opened explicitly from plan detail
    setValidationErrors({});
    setPhotoFiles([]);
    setUploadingPhotos(false);
    setUploadError('');
    setColorPreference(null);
    setCustomColorsText('');

    const targetPlan =
      serviceLevel || (selectedProject?.tier as ServiceLevelType) || 'Essencial';
    setActivePlan(targetPlan);
    setModelIntent(initialIntent || (selectedProject ? 'exact' : 'custom_idea'));

    if (initialDescription) {
      setCustomDescription(initialDescription);
    } else {
      setCustomDescription('');
    }

    const isInspiration = initialIntent === 'inspiration';

    if (isInspiration && selectedProject) {
      // ENTRADA POR INSPIRAÇÃO: estado inicial baseado na demonstração escolhida
      setBusinessSegment(selectedProject.category);
      const matchedPreset = findSegmentPreset(
        selectedProject.category || selectedProject.briefingType || briefingType || 'academia'
      );
      setSelectedPresetId(matchedPreset.id);

      if (selectedProject.structure && selectedProject.structure.length > 0) {
        setSelectedSecoes(selectedProject.structure.slice(0, 8));
      } else {
        setSelectedSecoes(matchedPreset.defaultStructure.slice(0, 6));
      }
      setSelectedFuncionalidades(matchedPreset.standardFeatures.slice(0, 5));
      setSelectedAdvancedFeatures(matchedPreset.advancedFeatures.slice(0, 2));
      setSelectedRealtimeFeatures([]);
      setSelectedAccountRoles(['cliente']);
      setSelectedEstilos([]);
    } else {
      // ENTRADA DIRETA / FORMATO: estado inicial neutro sem perguntas marcadas automaticamente!
      setBusinessSegment(selectedProject?.category || briefingType || '');
      setSelectedPresetId(
        selectedProject
          ? findSegmentPreset(selectedProject.category || selectedProject.briefingType).id
          : briefingType
          ? findSegmentPreset(briefingType).id
          : ''
      );
      setSelectedSecoes([]);
      setSelectedFuncionalidades([]);
      setSelectedAdvancedFeatures([]);
      setSelectedRealtimeFeatures([]);
      setSelectedAccountRoles([]);
      setSelectedEstilos([]);
    }
  }, [isOpen, serviceLevel, selectedProject, initialIntent, initialDescription, briefingType, initialStage]);

  // Helper actions
  const handleSelectPreset = (presetKey: string) => {
    setSelectedPresetId(presetKey);
    const preset = SEGMENT_PRESETS[presetKey];
    if (preset) {
      setBusinessSegment(preset.name.split('/')[0].trim());
    }
  };

  const handleSelectPersonalizadoSegment = (segmentKey: string) => {
    setSelectedPresetId(segmentKey);
    const tailored = SEGMENT_TAILORED_PRESETS[segmentKey];
    if (tailored) {
      setBusinessSegment(tailored.name.split('/')[0].trim());
    } else {
      const preset = findSegmentPreset(segmentKey);
      setBusinessSegment(preset.name.split('/')[0].trim());
    }
  };

  const toggleSelection = (
    list: string[],
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const toggleFeature = (
    list: string[],
    id: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(id)) {
      setter(list.filter((item) => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const toggleRole = (role: UserRoleType) => {
    if (selectedAccountRoles.includes(role)) {
      setSelectedAccountRoles(selectedAccountRoles.filter((r) => r !== role));
    } else {
      setSelectedAccountRoles([...selectedAccountRoles, role]);
    }
  };

  const handleStepBack = () => {
    if (stage === 'review') {
      setStage('contact');
    } else if (stage === 'contact') {
      setStage('briefing');
    } else if (stage === 'briefing') {
      setStage('presentation');
    }
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setPhotoFiles((prev) => [...prev, ...files].slice(0, 6));
    setUploadError('');
    setUploadStatus('idle');
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError('');
    setUploadStatus('idle');
  };

  const uploadPhotos = async (targetProjectId?: string): Promise<string[]> => {
    if (!photoFiles.length) return [];
    if (!targetProjectId) {
      console.warn('Upload de fotos cancelado: targetProjectId ausente.');
      return [];
    }
    setUploadingPhotos(true);
    setUploadError('');

    try {
      const uploadedPaths: string[] = [];
      for (const file of photoFiles) {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', file);
        formDataToUpload.append('projectId', targetProjectId);

        const response = await fetch(
          `/api/upload-briefing?projectId=${encodeURIComponent(targetProjectId)}`,
          {
            method: 'POST',
            body: formDataToUpload,
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Armazenamento em nuvem temporariamente indisponível.');
        }

        const data = await response.json();
        if (data?.pathname) {
          uploadedPaths.push(data.pathname);
        } else if (data?.url) {
          uploadedPaths.push(data.url);
        }
      }
      setUploadedPhotoUrls(uploadedPaths);
      setUploadStatus('success');
      return uploadedPaths;
    } catch (error: any) {
      console.warn('Upload fotos status notice:', error?.message);
      // Honest, transparent feedback: do not crash the flow, inform client clearly
      setUploadStatus('fallback');
      setUploadError(
        'Armazenamento em nuvem indisponível. As imagens foram associadas ao seu pedido e você poderá enviá-las diretamente após o envio.'
      );
      return [];
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleValidateContact = (): boolean => {
    const errors: { clientName?: string; clientPhone?: string; clientEmail?: string } = {};

    if (!clientName.trim()) {
      errors.clientName = 'Por favor, informe seu nome ou da sua empresa.';
    }

    if (!clientPhone.trim()) {
      errors.clientPhone = 'Por favor, informe seu WhatsApp com DDD.';
    } else if (clientPhone.replace(/\D/g, '').length < 10) {
      errors.clientPhone = 'Informe um número válido com DDD (ex: 11 99999-9999).';
    }

    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      errors.clientEmail = 'Informe um endereço de e-mail válido.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    // 1. Criação prioritária do briefing e projeto no Supabase para obter o projectId determinístico
    let createdProjectId: string | null = null;
    try {
      const supabaseResponse = await fetch('/api/create-briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName.trim() || 'Cliente NexaWeb',
          businessName: businessName.trim() || 'Nova Empresa',
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          clientNotes: clientNotes.trim(),
          plan: activePlan,
          briefingSummary: rawBriefingSummary,
        }),
      });

      if (supabaseResponse.ok) {
        const supabaseData = await supabaseResponse.json().catch(() => null);
        if (supabaseData?.projectId) {
          createdProjectId = supabaseData.projectId;
        }
        if (supabaseData?.accessToken) {
          setPortalAccessToken(supabaseData.accessToken);
        }
      } else {
        const errorData = await supabaseResponse.json().catch(() => null);
        console.warn(
          'Supabase briefing notice:',
          errorData?.error || supabaseResponse.status
        );
      }
    } catch (supabaseErr: any) {
      console.warn(
        'Supabase briefing dispatch notice:',
        supabaseErr?.message || 'rede'
      );
    }

    // 2. Upload determinístico dos arquivos associados ao projectId gerado
    let uploadedPaths: string[] = [];
    if (photoFiles.length > 0 && createdProjectId) {
      uploadedPaths = await uploadPhotos(createdProjectId);
    }

    // 3. Envio seguro e centralizado para o Forminit (sem interromper o cliente se houver falha de rede)
    try {
      const forminitEndpoint =
        NEXAWEB_CONTACT.forminitEndpoint || 'https://forminit.com/f/mzismx0n5tn';

      const forminitData = new FormData();

      // Identificação do cliente e blocos oficiais do Forminit
      const cleanClientName = clientName.trim() || 'Cliente NexaWeb';
      forminitData.append('fi-sender-fullName', cleanClientName);
      forminitData.append('name', cleanClientName);

      if (clientEmail.trim()) {
        forminitData.append('fi-sender-email', clientEmail.trim());
        forminitData.append('email', clientEmail.trim());
      }

      if (clientPhone.trim()) {
        forminitData.append('fi-sender-phone', clientPhone.trim());
        forminitData.append('phone', clientPhone.trim());
      }

      // Dados estruturados do negócio e projeto
      if (businessName.trim()) {
        forminitData.append('empresa', businessName.trim());
      }

      if (businessSegment.trim()) {
        forminitData.append('segmento', businessSegment.trim());
      }

      if (businessServices.trim()) {
        forminitData.append('servicos_principais', businessServices.trim());
      }

      forminitData.append('plano', activePlan);
      forminitData.append('investimento', planData.price);
      forminitData.append('prazo_estimado', planData.turnaroundTime);

      if (selectedProject) {
        forminitData.append('modelo_referencia', selectedProject.name);
        forminitData.append('intencao_modelo', modelIntent || 'custom_idea');
      }

      if (selectedEstilos.length > 0) {
        forminitData.append('estilos_visuais', selectedEstilos.join(', '));
      }

      if (selectedSecoes.length > 0) {
        forminitData.append('secoes_selecionadas', selectedSecoes.join(', '));
      }

      if (selectedFuncionalidades.length > 0) {
        const featNames = selectedFuncionalidades.map((id) => FEATURE_CATALOG[id]?.name || id);
        forminitData.append('funcionalidades', featNames.join(', '));
      }

      if (selectedAdvancedFeatures.length > 0) {
        const advNames = selectedAdvancedFeatures.map((id) => FEATURE_CATALOG[id]?.name || id);
        forminitData.append('modulos_avancados', advNames.join(', '));
      }

      if (selectedRealtimeFeatures.length > 0) {
        const rtNames = selectedRealtimeFeatures.map((id) => FEATURE_CATALOG[id]?.name || id);
        forminitData.append('recursos_tempo_real', rtNames.join(', '));
      }

      if (selectedAccountRoles.length > 0) {
        forminitData.append('niveis_acesso', selectedAccountRoles.join(', '));
      }

      if (colorPreference || customColorsText) {
        forminitData.append('preferencia_cores', customColorsText || colorPreference || '');
      }

      if (referenceUrl.trim()) {
        forminitData.append('links_referencia', referenceUrl.trim());
      }

      if (customDescription.trim()) {
        forminitData.append('visao_projeto', customDescription.trim());
      }

      if (clientNotes.trim()) {
        forminitData.append('observacoes', clientNotes.trim());
      }

      // Resumo formatado consolidado
      forminitData.append('resumo_completo', rawBriefingSummary);

      // Arquivos e imagens anexadas (suporte nativo do Forminit para uploads)
      if (photoFiles.length > 0) {
        photoFiles.forEach((file) => {
          forminitData.append('fi-file-anexos', file);
          forminitData.append('files', file);
        });
      }

      const response = await fetch(forminitEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: forminitData,
      });

      if (!response.ok) {
        console.warn('Forminit submit response status notice:', response.status);
      }
    } catch (forminitErr: any) {
      // Registro seguro de diagnóstico sem vazar dados pessoais nem interromper o usuário
      console.warn('Forminit dispatch notice:', forminitErr?.message || 'rede');
    }

    // 4. Preservação estrita do salvamento local para funcionamento contínuo do Admin
    try {
      // Save submitted briefing to local storage so NexaWeb Admin can view and manage it
      const savedBriefingsStr = localStorage.getItem('nexaweb_admin_briefings');
      const existingBriefings = savedBriefingsStr ? JSON.parse(savedBriefingsStr) : [];
      const newIdNumber = String(existingBriefings.length + 1).padStart(3, '0');
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newBriefing = {
        id: `BRF-${now.getFullYear()}-${newIdNumber}`,
        projectId: createdProjectId || null,
        clientName: clientName.trim() || 'Cliente NexaWeb',
        businessName: businessName.trim() || 'Nova Empresa',
        businessSegment: businessSegment.trim() || (selectedProject ? selectedProject.category : 'Geral'),
        plan: activePlan,
        date: formattedDate,
        status: 'Novo',
        clientPhone: clientPhone.trim() || 'Não informado',
        clientEmail: clientEmail.trim() || 'Não informado',
        notes: [
          clientNotes.trim(),
          customDescription.trim() ? `Visão do projeto: ${customDescription.trim()}` : '',
          referenceUrl.trim() ? `Referência: ${referenceUrl.trim()}` : '',
        ].filter(Boolean).join(' | '),
        selectedFeatures: [
          ...selectedSecoes.slice(0, 4),
          ...selectedFuncionalidades.slice(0, 4),
        ],
        referenceModel: selectedProject ? selectedProject.name : undefined,
        estimatedPrice: planData.price,
        filesCount: photoFiles.length,
        files: uploadedPaths,
      };

      const updated = [newBriefing, ...existingBriefings];
      localStorage.setItem('nexaweb_admin_briefings', JSON.stringify(updated));
    } catch (err) {
      console.warn('Storage briefing notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    setSubmitted(true);
  };

  const handleAccessPortal = async () => {
    if (isNavigatingPortal) return;
    setIsNavigatingPortal(true);
    let authenticated = false;
    try {
      if (portalAccessToken) {
        // Valida o token gerado via api/portal-auth para estabelecer
        // com segurança a sessão HTTP-only HMAC (nexaweb_client_session)
        const authRes = await fetch('/api/portal-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ token: portalAccessToken }),
        });
        if (authRes.ok) {
          authenticated = true;
        }
      }
    } catch (err) {
      console.warn('Auto-auth portal notice:', err);
    } finally {
      setIsNavigatingPortal(false);
      onClose();
      if (authenticated) {
        navigateTo('/portal');
      } else if (portalAccessToken) {
        navigateTo(`/portal?token=${encodeURIComponent(portalAccessToken)}`);
      } else {
        navigateTo('/portal');
      }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUARD: Only returns null right before JSX, after all hooks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Briefing e Apresentação do Plano ${activePlan}`}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-xl max-h-[90vh] max-h-[90dvh] flex flex-col bg-neutral-900 border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-100 outline-none ${theme.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MODAL HEADER (Pinned / Fixed Top)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-neutral-800 bg-neutral-950/95 z-20">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-1">
              {onBackToProject && (
                <button
                  type="button"
                  onClick={onBackToProject}
                  className="w-8 h-8 min-w-[32px] flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors shrink-0 border border-neutral-700/60"
                  aria-label="Voltar para detalhes da demonstração"
                  title="Voltar para detalhes da demonstração"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${theme.badge}`}
                  >
                    {theme.icon}
                    <span>Plano {activePlan}</span>
                  </span>

                  <span className="text-[11px] sm:text-xs font-extrabold text-neutral-200 shrink-0 whitespace-nowrap">
                    {planData.price}
                  </span>
                </div>

                <h3 className="text-xs sm:text-base font-bold font-display text-white mt-0.5 truncate">
                  {stage === 'presentation'
                    ? `Apresentação · Plano ${activePlan}`
                    : stage === 'briefing'
                    ? `Personalização · Plano ${activePlan}`
                    : stage === 'contact'
                    ? 'Informações de Contato'
                    : 'Confira seu Projeto Antes do Envio'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              PROGRESS INDICATOR (4 Steps)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {!submitted && (
            <div className="pt-3 flex items-center justify-between gap-1 text-[11px] font-semibold border-t border-neutral-800/80 mt-2.5">
              {[
                { id: 'presentation', num: '01', label: 'Plano' },
                { id: 'briefing', num: '02', label: 'Personalização' },
                { id: 'contact', num: '03', label: 'Contato' },
                { id: 'review', num: '04', label: 'Resumo' },
              ].map((stepItem, idx) => {
                const isActive = stage === stepItem.id;
                const isPassed =
                  (stepItem.id === 'presentation' && stage !== 'presentation') ||
                  (stepItem.id === 'briefing' &&
                    (stage === 'contact' || stage === 'review')) ||
                  (stepItem.id === 'contact' && stage === 'review');

                return (
                  <div
                    key={stepItem.id}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? theme.text
                        : isPassed
                        ? 'text-neutral-300'
                        : 'text-neutral-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive
                          ? theme.stepActive
                          : isPassed
                          ? 'bg-neutral-800 text-neutral-300'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : stepItem.num}
                    </span>
                    <span className="hidden sm:inline">{stepItem.label}</span>
                    {idx < 3 && (
                      <span className="mx-1 text-neutral-700 hidden sm:inline">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MODAL BODY (Scrollable Central Content with overscroll-contain)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4.5 sm:px-6 py-4.5 sm:py-6 space-y-4.5 sm:space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {submitted ? (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                TELA DE SUCESSO & WHATSAPP
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="py-8 text-center space-y-5 animate-fadeIn">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${theme.badge} border`}
              >
                <CheckCircle2 className={`w-8 h-8 ${theme.text}`} />
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                <h4 className="text-xl sm:text-2xl font-bold font-display text-white">
                  Briefing Recebido com Sucesso!
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Registramos o briefing do seu projeto no{' '}
                  <strong className={theme.text}>Plano {activePlan}</strong>. Nossa equipe
                  analisará os detalhes e entrará em contato em breve.
                </p>

                {/* Acompanhamento do Desenvolvimento pela Área do Cliente */}
                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-left space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Acompanhamento do Projeto</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Você poderá acompanhar o desenvolvimento do seu site pela Área do Cliente, incluindo etapas, atualizações, solicitações e o andamento do projeto.
                  </p>
                </div>

                <p className="text-xs text-neutral-400">
                  {hasOfficialWhatsApp()
                    ? 'Para agilizar ainda mais o início do seu site, você também pode enviar os detalhes diretamente pelo WhatsApp:'
                    : 'Acompanhe as atualizações da NexaWeb pelo Instagram oficial ou copie o resumo abaixo para seus registros:'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto flex-wrap">
                {/* Botão Principal: Acessar Área do Cliente */}
                <button
                  type="button"
                  onClick={handleAccessPortal}
                  disabled={isNavigatingPortal}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                >
                  {isNavigatingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Acessando Área do Cliente...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Acessar Área do Cliente</span>
                    </>
                  )}
                </button>

                {hasOfficialWhatsApp() ? (
                  <a
                    href={getOfficialWhatsAppUrl(rawBriefingSummary) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar pelo WhatsApp</span>
                  </a>
                ) : (
                  <a
                    href={getOfficialInstagramUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram Oficial @nexaw1</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full sm:w-auto min-h-[46px] px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Resumo Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copiar Resumo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[46px] px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : stage === 'presentation' ? (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ETAPA 1: APRESENTAÇÃO DO PLANO (Obrigatória nos 4 planos)
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="space-y-5 animate-fadeIn">
              {/* Plan Switcher Pills */}
              <div className="p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-neutral-950 border border-neutral-800/90 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none overscroll-x-contain sm:justify-between touch-pan-x">
                {(['Essencial', 'Personalizado', 'Profissional', 'Premium'] as PlanId[]).map(
                  (planTab) => {
                    const isTabActive = activePlan === planTab;
                    return (
                      <button
                        key={planTab}
                        type="button"
                        onClick={() => setActivePlan(planTab)}
                        className={`shrink-0 sm:shrink sm:flex-1 min-h-[34px] sm:min-h-[38px] py-1.5 px-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                          isTabActive
                            ? `${theme.badge} shadow-sm border font-extrabold`
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                        }`}
                      >
                        <span>{planTab}</span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Selected Model Reference Banner (if came from a real project) */}
              {selectedProject && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        Modelo de Referência
                      </span>
                      <p className="text-xs font-bold text-white truncate">
                        {selectedProject.name} ({selectedProject.category})
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 shrink-0">
                    Plano {selectedProject.tier}
                  </span>
                </div>
              )}

              {/* Price & Delivery Time Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Investimento Oficial
                  </span>
                  <div className="font-extrabold font-display text-white leading-tight">
                    {planData.price.includes('A partir de') ? (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
                        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          A partir de
                        </span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-white whitespace-nowrap">
                          {planData.price.replace('A partir de', '').trim()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-white whitespace-nowrap">
                        {planData.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{planData.tagline}</p>
                </div>

                <div className="sm:text-right space-y-1 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex sm:justify-end items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Prazo de Entrega</span>
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-neutral-200">
                    {planData.turnaroundTime}
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Visão Geral do Plano
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {planData.description}
                </p>
              </div>

              {/* Target Audience */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Este plano é ideal para:</span>
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {planData.targetAudience}
                </p>
              </div>

              {/* Inclusions */}
              <div className="space-y-2 sm:space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  O que está incluído no {planData.name}:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {planData.inclusions.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 sm:p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70"
                    >
                      <Check className={`w-3.5 h-3.5 ${theme.text} shrink-0 mt-0.5`} />
                      <span className="text-xs text-neutral-300 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Differentials */}
              <div className="space-y-2 sm:space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Diferenciais:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {planData.differentials.map((diff, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 sm:p-2 rounded-xl bg-neutral-950/40 border border-neutral-800/50 text-xs text-neutral-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{diff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom breathing space before pinned footer */}
              <div className="h-2 sm:h-0" aria-hidden="true" />
            </div>
          ) : stage === 'briefing' ? (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ETAPA 2: PERSONALIZAÇÃO & ESTRUTURA (Adaptada ao Plano)
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="space-y-5 animate-fadeIn">
              {/* Common Business Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Informações Básicas do Projeto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Nome do Negócio ou Projeto *
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Barbearia VIP / Dra. Ana"
                      className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Ramo de Atuação / Segmento
                    </label>
                    <input
                      type="text"
                      value={businessSegment}
                      onChange={(e) => setBusinessSegment(e.target.value)}
                      placeholder="Ex: Gastronomia, Saúde, Fitness"
                      className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SPECIFIC PLAN CUSTOMIZATION */}
              {activePlan === 'Personalizado' ? (
                /* PERSONALIZADO RICH CONFIGURATOR (Preserved 100% & Enhanced with Segment Presets) */
                <div className="space-y-5">
                  {/* Seletor de Segmento de Atuação */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        1. Segmento de Atuação do Projeto:
                      </label>
                      <span className="text-[11px] font-mono text-purple-300 font-semibold">
                        {selectedPresetId ? customSegmentOptions.name : 'Selecione uma opção'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { key: 'academia', label: 'Academia' },
                        { key: 'restaurante', label: 'Restaurante' },
                        { key: 'imobiliaria', label: 'Imobiliária' },
                        { key: 'engenharia', label: 'Engenharia' },
                        { key: 'barbearia', label: 'Barbearia' },
                        { key: 'ecommerce', label: 'Loja' },
                        { key: 'clinica', label: 'Clínica' },
                        { key: 'criador', label: 'Criador' },
                        { key: 'hotel', label: 'Hotel/Pousada' },
                        { key: 'empresa', label: 'Empresa B2B' },
                      ].map((item) => {
                        const isSelected = Boolean(
                          selectedPresetId &&
                          (selectedPresetId === item.key ||
                            (businessSegment &&
                              businessSegment.toLowerCase().includes(item.label.toLowerCase())))
                        );

                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleSelectPersonalizadoSegment(item.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
                                : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estilo Visual */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      2. Escolha o Estilo Visual do Site:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ESTILOS_VISUAIS.map((estilo) => {
                        const isSelected = selectedEstilos.includes(estilo.id);
                        return (
                          <button
                            key={estilo.id}
                            type="button"
                            onClick={() =>
                              toggleSelection(selectedEstilos, estilo.id, setSelectedEstilos)
                            }
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                                : 'border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white">
                                {estilo.name}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              {estilo.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seções Específicas do Segmento */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        3. Seções Desejadas no Site:
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        Opções para {customSegmentOptions.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customSegmentOptions.secoes.map((sec) => {
                        const isSelected = selectedSecoes.includes(sec);
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() =>
                              toggleSelection(selectedSecoes, sec, setSelectedSecoes)
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                                : 'border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="truncate pr-1">{sec}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Funcionalidades e Recursos Específicos do Segmento */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        4. Recursos & Funcionalidades Especiais:
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        Para {customSegmentOptions.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customSegmentOptions.recursos.map((func) => {
                        const isSelected = selectedFuncionalidades.includes(func);
                        const isRealtime = func.includes('⚡') || func.includes('tempo real');

                        return (
                          <button
                            key={func}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                selectedFuncionalidades,
                                func,
                                setSelectedFuncionalidades
                              )
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                                : isRealtime
                                ? 'border-amber-500/30 bg-amber-500/5 text-neutral-300 hover:border-amber-500/50'
                                : 'border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="truncate pr-1">{func}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      5. Paleta de Cores:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setColorPreference('suggest')}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          colorPreference === 'suggest'
                            ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <div className="font-bold text-white mb-0.5">
                          NexaWeb sugere paleta ideal
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Nossos designers criam a harmonia perfeita para seu nicho
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setColorPreference('custom')}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          colorPreference === 'custom'
                            ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <div className="font-bold text-white mb-0.5">
                          Quero escolher as cores
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Indique tons principais (ex: preto e dourado, azul e branco)
                        </p>
                      </button>
                    </div>

                    {colorPreference === 'custom' && (
                      <input
                        type="text"
                        value={customColorsText}
                        onChange={(e) => setCustomColorsText(e.target.value)}
                        placeholder="Ex: Preto fosco, detalhes em dourado e cinza chumbo"
                        className="w-full h-10 mt-2 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-all"
                      />
                    )}
                  </div>

                  {/* Referência e Descrição */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Link de Referência ou Inspiração (opcional)
                      </label>
                      <input
                        type="url"
                        value={referenceUrl}
                        onChange={(e) => setReferenceUrl(e.target.value)}
                        placeholder="https://exemplo.com.br ou @perfil"
                        className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Como você imagina seu site? (visão livre)
                      </label>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                        placeholder="Conte detalhes sobre o que gostaria de ver no site..."
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : activePlan === 'Essencial' ? (
                /* ESSENCIAL BRIEFING (Azul) */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Serviços ou Produtos Principais a Apresentar
                    </label>
                    <textarea
                      value={businessServices}
                      onChange={(e) => setBusinessServices(e.target.value)}
                      rows={3}
                      placeholder="Ex: Corte de cabelo, Barba terapia, Tratamentos capilares..."
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-400 transition-all resize-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Estrutura Essencial Inclusa:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>Início com Destaque</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>Sobre o Negócio / Equipe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>Serviços e Valores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>Contato & WhatsApp Fixo</span>
                      </div>
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-300">
                      Preferência de Cores
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setColorPreference('suggest')}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          colorPreference === 'suggest'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <span className="font-bold text-white block">Sugerida pela NexaWeb</span>
                        <span className="text-[10px] text-neutral-400">Harmonia visual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setColorPreference('custom')}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          colorPreference === 'custom'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <span className="font-bold text-white block">Cores da minha marca</span>
                        <span className="text-[10px] text-neutral-400">Tons específicos</span>
                      </button>
                    </div>

                    {colorPreference === 'custom' && (
                      <input
                        type="text"
                        value={customColorsText}
                        onChange={(e) => setCustomColorsText(e.target.value)}
                        placeholder="Ex: Azul marinho e cinza claro"
                        className="w-full h-10 mt-1.5 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-blue-400 transition-all"
                      />
                    )}
                  </div>
                </div>
              ) : activePlan === 'Profissional' || activePlan === 'Premium' ? (
                /* PROFISSIONAL & PREMIUM: SEGMENT PRESETS & FEATURE CATALOG DRIVEN BRIEFING */
                <div className="space-y-5">
                  {/* Premium Atmosphere Banner if Premium */}
                  {activePlan === 'Premium' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Experiência Máxima de Alto Padrão (Plano Premium)</span>
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Design sob medida de alto prestígio, interfaces sob demanda, suporte a múltiplos perfis e alta conversão.
                      </p>
                    </div>
                  )}

                  {/* 1. SELETOR DE SEGMENTO DE ATUAÇÃO */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        1. Selecione o Segmento de Atuação:
                      </label>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {selectedPresetId ? currentPreset.badge : 'Selecione uma opção'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                      {Object.values(SEGMENT_PRESETS).map((preset) => {
                        const isSelected = Boolean(
                          selectedPresetId &&
                          (selectedPresetId === preset.id ||
                            (businessSegment &&
                              businessSegment.toLowerCase().includes(preset.id)))
                        );
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? `${theme.badge} shadow-sm border font-bold`
                                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            <span className="text-xs truncate block text-white font-medium">
                              {preset.name.split('/')[0].trim()}
                            </span>
                            <span className="text-[10px] text-neutral-500 truncate block mt-0.5">
                              {preset.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-neutral-400 italic">
                      {selectedPresetId ? (
                        <>
                          As seções e funcionalidades abaixo são adaptadas especificamente para{' '}
                          <strong>{currentPreset.name}</strong>.
                        </>
                      ) : (
                        <>
                          Selecione o segmento do seu negócio para carregar as opções recomendadas.
                        </>
                      )}
                    </p>
                  </div>

                  {/* 2. ESTRUTURA RECOMENDADA PARA O SEGMENTO */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      2. Estrutura de Páginas & Seções{selectedPresetId ? ` (${currentPreset.name})` : ''}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentPreset.defaultStructure.map((sec) => {
                        const isSelected = selectedSecoes.includes(sec);
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => toggleSelection(selectedSecoes, sec, setSelectedSecoes)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? `${theme.borderActive} shadow-sm font-semibold`
                                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span>{sec}</span>
                            {isSelected ? (
                              <Check className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. FUNCIONALIDADES ESPECÍFICAS DO SEGMENTO */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      3. Funcionalidades Comerciais Disponíveis:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentPreset.standardFeatures.map((featId) => {
                        const feat = FEATURE_CATALOG[featId];
                        if (!feat) return null;
                        const isSelected = selectedFuncionalidades.includes(featId);
                        return (
                          <button
                            key={featId}
                            type="button"
                            onClick={() => toggleFeature(selectedFuncionalidades, featId, setSelectedFuncionalidades)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? `${theme.borderActive} shadow-sm font-semibold`
                                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div>
                              <span className="text-white font-medium block">{feat.name}</span>
                              <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                                {feat.shortDesc}
                              </span>
                            </div>
                            {isSelected ? (
                              <Check className={`w-3.5 h-3.5 ${theme.text} shrink-0 mt-0.5`} />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. MÓDULOS AVANÇADOS DE SISTEMA (CONTAS E PAINÉIS) */}
                  {currentPreset.advancedFeatures && currentPreset.advancedFeatures.length > 0 && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/90">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-neutral-400" />
                          <span>4. Módulos Avançados de Sistema (Opcional):</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono">
                          Arquitetura Pronta
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Estrutura preparada para expansão com banco de dados, relatórios e permissões.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {currentPreset.advancedFeatures.map((featId) => {
                          const feat = FEATURE_CATALOG[featId];
                          if (!feat) return null;
                          const isSelected = selectedAdvancedFeatures.includes(featId);
                          return (
                            <button
                              key={featId}
                              type="button"
                              onClick={() => toggleFeature(selectedAdvancedFeatures, featId, setSelectedAdvancedFeatures)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                                isSelected
                                  ? `${theme.borderActive} font-semibold shadow-sm`
                                  : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-medium">{feat.name}</span>
                                </div>
                                <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                                  {feat.shortDesc}
                                </span>
                              </div>
                              {isSelected ? (
                                <Check className={`w-3.5 h-3.5 ${theme.text} shrink-0 mt-0.5`} />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. ⚡ FUNCIONALIDADES EM TEMPO REAL */}
                  {currentPreset.realtimeFeatures && currentPreset.realtimeFeatures.length > 0 && (
                    <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-950 border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ Funcionalidades em Tempo Real</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                          Tempo Real
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed">
                        <strong className="text-amber-200">💡 Arquitetura de Sistema:</strong>{' '}
                        <span>Site → API / Backend → Banco de Dados → Atualização em Tempo Real → Site / Painel.</span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Recursos preparados para sincronização instantânea de status e dados operacionais.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {currentPreset.realtimeFeatures.map((featId) => {
                          const feat = FEATURE_CATALOG[featId];
                          if (!feat) return null;
                          const isSelected = selectedRealtimeFeatures.includes(featId);
                          return (
                            <button
                              key={featId}
                              type="button"
                              onClick={() => toggleFeature(selectedRealtimeFeatures, featId, setSelectedRealtimeFeatures)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-500/15 text-amber-100 font-semibold shadow-sm'
                                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <div>
                                <span className="text-white font-medium block">{feat.name}</span>
                                <span className="text-[10px] text-neutral-400 block leading-tight mt-0.5">
                                  {feat.shortDesc}
                                </span>
                              </div>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-md border border-neutral-700 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. PERFIS DE ACESSO & SISTEMA DE CONTAS */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>6. Níveis de Acesso e Contas Necessárias:</span>
                    </span>
                    <p className="text-[11px] text-neutral-400">
                      Indique quais perfis farão login no sistema do seu projeto:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          id: 'cliente' as UserRoleType,
                          title: 'CLIENTE / ALUNO',
                          desc: 'Cadastro, login, perfil e dados pessoais',
                        },
                        {
                          id: 'profissional' as UserRoleType,
                          title: 'PROFISSIONAL',
                          desc: 'Agenda, atendimentos e atividades',
                        },
                        {
                          id: 'administrador' as UserRoleType,
                          title: 'ADMINISTRADOR',
                          desc: 'Painel executivo, relatórios e controle geral',
                        },
                      ].map((role) => {
                        const isSelected = selectedAccountRoles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRole(role.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                              isSelected
                                ? `${theme.borderActive} font-semibold shadow-sm`
                                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white text-[11px]">{role.title}</span>
                              {isSelected ? (
                                <Check className={`w-3 h-3 ${theme.text}`} />
                              ) : (
                                <span className="w-3 h-3 rounded border border-neutral-700" />
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 leading-tight">
                              {role.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7. PREVIEW DEMONSTRATIVO DE MÉTRICAS & DASHBOARD */}
                  {currentPreset.statsExample && (
                    <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{currentPreset.statsExample.title}</span>
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase font-mono">
                          Demonstração Visual
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {currentPreset.statsExample.metrics.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between"
                          >
                            <span className="text-[10px] text-neutral-400 font-medium truncate">
                              {m.label}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white mt-1">
                              {m.value}
                            </span>
                            {m.detail && (
                              <span className="text-[9px] text-neutral-500 mt-0.5 truncate">
                                {m.detail}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Referência e Descrição Adicional */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Links de Referência ou Inspirações (opcional)
                      </label>
                      <input
                        type="url"
                        value={referenceUrl}
                        onChange={(e) => setReferenceUrl(e.target.value)}
                        placeholder="https://exemplo.com.br ou @perfil"
                        className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Detalhes Estratégicos ou Visão do Projeto
                      </label>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                        placeholder={`Conte mais sobre as necessidades do seu projeto para ${currentPreset.name}...`}
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback general briefing */
                null
              )}

              {/* Upload de Fotos / Logo (Preservado para todos) */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Fotos e Logotipo (opcional)</span>
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    {photoFiles.length} de 6 adicionados
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-neutral-950/60">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUploadChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-5 h-5 mx-auto text-neutral-500 mb-1" />
                  <p className="text-xs font-medium text-neutral-300">
                    Toque para adicionar fotos do espaço, equipe ou logotipo
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    PNG, JPG ou WEBP até 10MB
                  </p>
                </div>

                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {photoFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px]"
                      >
                        <span className="truncate max-w-[100px] text-neutral-300">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadingPhotos && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando e preparando imagens...</span>
                  </p>
                )}

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-start gap-1.5 mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Fotos enviadas para a nuvem com sucesso.</span>
                  </div>
                )}
              </div>
            </div>
          ) : stage === 'contact' ? (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ETAPA 3: INFORMAÇÕES DE CONTATO
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Contato do Responsável
                </span>
                <p className="text-xs text-neutral-300">
                  Informe seus dados para entrarmos em contato com a prévia do projeto.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Seu Nome ou Nome da Empresa *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (validationErrors.clientName) {
                        setValidationErrors((prev) => ({ ...prev, clientName: undefined }));
                      }
                    }}
                    placeholder="Como podemos te chamar?"
                    className={`w-full h-10 rounded-xl bg-neutral-950 border pl-9 pr-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition-all ${
                      validationErrors.clientName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-800 focus:border-amber-400'
                    }`}
                  />
                </div>
                {validationErrors.clientName && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.clientName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  WhatsApp com DDD (para envio da prévia) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(e.target.value);
                      if (validationErrors.clientPhone) {
                        setValidationErrors((prev) => ({ ...prev, clientPhone: undefined }));
                      }
                    }}
                    placeholder="(11) 99999-9999"
                    className={`w-full h-10 rounded-xl bg-neutral-950 border pl-9 pr-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition-all ${
                      validationErrors.clientPhone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-800 focus:border-amber-400'
                    }`}
                  />
                </div>
                {validationErrors.clientPhone && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.clientPhone}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  E-mail (opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value);
                      if (validationErrors.clientEmail) {
                        setValidationErrors((prev) => ({ ...prev, clientEmail: undefined }));
                      }
                    }}
                    placeholder="seuemail@empresa.com"
                    className={`w-full h-10 rounded-xl bg-neutral-950 border pl-9 pr-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition-all ${
                      validationErrors.clientEmail
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-800 focus:border-amber-400'
                    }`}
                  />
                </div>
                {validationErrors.clientEmail && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.clientEmail}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Observações ou Detalhes Específicos
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={2}
                  placeholder="Alguma informação importante sobre horário de contato ou prazos?"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ETAPA 4: RESUMO ANTES DO ENVIO ("Confira seu projeto")
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Revisão Final
                </span>
                <h4 className="text-sm font-bold text-white">
                  Confira os detalhes antes de enviar
                </h4>
                <p className="text-xs text-neutral-400">
                  Verifique se está tudo correto ou use os botões de edição para ajustar.
                </p>
              </div>

              {/* Resumo Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                {/* Plano e Preço */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Plano Selecionado
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}
                      >
                        {theme.icon}
                        <span>Plano {activePlan}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Investimento
                    </span>
                    <div className="text-sm sm:text-base font-extrabold text-white">
                      {planData.price}
                    </div>
                  </div>
                </div>

                {/* Negócio & Contato */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-medium">Nome / Empresa:</span>
                    <span className="text-white font-semibold">{clientName || businessName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-medium">WhatsApp:</span>
                    <span className="text-white font-semibold">{clientPhone}</span>
                  </div>
                  {clientEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">E-mail:</span>
                      <span className="text-white font-semibold">{clientEmail}</span>
                    </div>
                  )}
                  {businessSegment && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">Segmento:</span>
                      <span className="text-white font-semibold">{businessSegment}</span>
                    </div>
                  )}
                </div>

                {/* Personalização Resumo */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 text-xs">
                  {(activePlan === 'Profissional' || activePlan === 'Premium') && (
                    <>
                      {selectedPresetId && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 font-medium">Segmento Alvo:</span>
                          <span className="text-white font-semibold">
                            {currentPreset.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">Estrutura:</span>
                        <span className="text-neutral-300 font-medium truncate max-w-[220px]">
                          {selectedSecoes.length > 0
                            ? `${selectedSecoes.length} seções selecionadas`
                            : 'A definir com a equipe'}
                        </span>
                      </div>
                      {selectedAdvancedFeatures.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 font-medium">Módulos Avançados:</span>
                          <span className="text-purple-300 font-semibold truncate max-w-[200px]">
                            {selectedAdvancedFeatures.length} selecionado(s)
                          </span>
                        </div>
                      )}
                      {selectedRealtimeFeatures.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-medium">⚡ Tempo Real:</span>
                          <span className="text-amber-300 font-semibold truncate max-w-[200px]">
                            {selectedRealtimeFeatures.length} recurso(s)
                          </span>
                        </div>
                      )}
                      {selectedAccountRoles.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 font-medium">Perfis de Acesso:</span>
                          <span className="text-blue-300 font-semibold">
                            {selectedAccountRoles.map((r) => r.toUpperCase()).join(', ')}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {activePlan === 'Personalizado' && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">Estilo / Atmosfera:</span>
                      <span className="text-white font-semibold">
                        {selectedEstilos.length > 0 ? selectedEstilos.join(', ') : 'A definir'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-medium">Cores:</span>
                    <span className="text-white font-semibold">
                      {colorPreference === 'custom'
                        ? customColorsText || 'Cores personalizadas'
                        : colorPreference === 'suggest'
                        ? 'Sugerida pela NexaWeb'
                        : 'A definir'}
                    </span>
                  </div>
                  {selectedProject && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">Modelo Base:</span>
                      <span className="text-amber-300 font-semibold truncate max-w-[200px]">
                        {selectedProject.name}
                      </span>
                    </div>
                  )}
                  {photoFiles.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">Fotos / Logo:</span>
                      <span className="text-amber-300 font-semibold text-xs flex items-center gap-1">
                        <span>{photoFiles.length} arquivo(s)</span>
                        {uploadStatus === 'success' && (
                          <span className="text-emerald-400 font-normal">(nuvem)</span>
                        )}
                        {uploadStatus === 'fallback' && (
                          <span className="text-amber-400 font-normal">(local)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('briefing')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar personalização</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStage('contact')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar contato</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MODAL FOOTER (Pinned / Fixed Bottom)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {!submitted && (
          <div className="shrink-0 px-4.5 sm:px-6 py-3.5 sm:py-4 border-t border-neutral-800 bg-neutral-950/95 flex items-center justify-between gap-2.5 sm:gap-3 z-20">
            {stage === 'presentation' ? (
              <button
                type="button"
                onClick={() => setStage('briefing')}
                className={`w-full sm:w-auto sm:ml-auto min-h-[44px] px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 ${theme.button}`}
              >
                <span>Escolher este plano ({activePlan})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : stage === 'briefing' ? (
              <>
                <button
                  type="button"
                  onClick={handleStepBack}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors inline-flex items-center justify-center shrink-0 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStage('contact')}
                  className={`flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 ${theme.button}`}
                >
                  <span>Continuar para contato</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : stage === 'contact' ? (
              <>
                <button
                  type="button"
                  onClick={handleStepBack}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors inline-flex items-center justify-center shrink-0 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (handleValidateContact()) {
                      setStage('review');
                    }
                  }}
                  className={`flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 ${theme.button}`}
                >
                  <span>Ver Resumo do Briefing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Review stage */
              <>
                <button
                  type="button"
                  onClick={handleStepBack}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors inline-flex items-center justify-center shrink-0 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={uploadingPhotos || isSubmitting}
                  className={`flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 ${theme.button}`}
                >
                  {isSubmitting ? (
                    <span>Enviando briefing...</span>
                  ) : uploadingPhotos ? (
                    <span>Enviando fotos...</span>
                  ) : (
                    <>
                      <span>Enviar briefing</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
