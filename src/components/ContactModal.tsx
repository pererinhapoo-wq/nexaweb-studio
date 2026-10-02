import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import type { ProjectItem } from '../data/projects';

export type ServiceLevelType =
  | 'Essencial'
  | 'Profissional'
  | 'Personalizado'
  | 'Premium';

export type ModelIntentType = 'exact' | 'inspiration' | 'custom_idea' | null;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  serviceLevel?: ServiceLevelType | null;
  briefingType?: string | null;
  selectedProject?: ProjectItem | null;
  initialIntent?: ModelIntentType;
  initialDescription?: string;
}

type FieldConfig = {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'url';
  required?: boolean;
};

type BriefingConfig = {
  title: string;
  description: string;
  fields: FieldConfig[];
};

const BRIEFINGS: Record<string, BriefingConfig> = {
  Barbearia: {
    title: 'Barbearia',
    description: 'Reunindo os detalhes que serão usados para montar o site da sua barbearia.',
    fields: [
      { label: 'Nome do negócio/projeto', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço e horário' },
      { label: 'Descrição da barbearia', type: 'textarea' },
      { label: 'Serviços e preços', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Academia: {
    title: 'Academia',
    description: 'Informações para apresentar sua academia de forma clara e profissional.',
    fields: [
      { label: 'Nome da academia', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço e horário' },
      { label: 'Modalidades e planos', type: 'textarea' },
      { label: 'Estrutura e equipamentos', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Restaurante: {
    title: 'Restaurante',
    description: 'Detalhes para apresentar seu restaurante, pratos e formas de atendimento.',
    fields: [
      { label: 'Nome do restaurante', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço e horário' },
      { label: 'Cardápio e pratos principais', type: 'textarea' },
      { label: 'Delivery e formas de pagamento', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Loja: {
    title: 'Loja / E-commerce',
    description: 'Informações necessárias para estruturar a apresentação da sua loja.',
    fields: [
      { label: 'Nome da loja', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço ou atuação online' },
      { label: 'Produtos e categorias', type: 'textarea' },
      { label: 'Formas de pagamento e entrega', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Imobiliária: {
    title: 'Imobiliária',
    description: 'Dados necessários para apresentar seus imóveis e sua empresa.',
    fields: [
      { label: 'Nome da imobiliária', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Tipos de imóveis e regiões', type: 'textarea' },
      { label: 'Fotos dos imóveis e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Salão: {
    title: 'Salão de Beleza',
    description: 'Detalhes necessários para apresentar seu salão e seus serviços.',
    fields: [
      { label: 'Nome do salão', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço e horário' },
      { label: 'Serviços e preços', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  'Prestador de Serviço': {
    title: 'Prestador de Serviço',
    description: 'Apresentar seus serviços e facilitar o contato com seus clientes.',
    fields: [
      { label: 'Nome do negócio/profissional', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Área de atuação e serviços', type: 'textarea' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Fotos de trabalhos e logo' },
    ],
  },
  'Criador de Conteúdo': {
    title: 'Criador de Conteúdo / Influenciador',
    description: 'Reunir seus conteúdos, redes sociais e principais links.',
    fields: [
      { label: 'Nome ou nome artístico', required: true },
      { label: 'Responsável' },
      { label: 'Telefone / WhatsApp', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Redes sociais (Instagram, YouTube, TikTok)', type: 'textarea' },
      { label: 'Nicho e tipo de conteúdo', type: 'textarea' },
      { label: 'Projetos e trabalhos', type: 'textarea' },
      { label: 'Fotos e logo' },
    ],
  },
  Engenharia: {
    title: 'Engenharia',
    description: 'Apresentar sua empresa, projetos e serviços de engenharia.',
    fields: [
      { label: 'Nome da empresa', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Serviços e áreas de atuação', type: 'textarea' },
      { label: 'Projetos realizados', type: 'textarea' },
      { label: 'Fotos de projetos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Clínica: {
    title: 'Clínica / Saúde',
    description: 'Apresentar sua clínica, profissionais, especialidades e atendimento.',
    fields: [
      { label: 'Nome da clínica', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Especialidades e serviços', type: 'textarea' },
      { label: 'Profissionais e atendimento', type: 'textarea' },
      { label: 'Fotos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Arquitetura: {
    title: 'Arquitetura',
    description: 'Apresentar seu escritório e portfólio de projetos.',
    fields: [
      { label: 'Nome do escritório', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Serviços e tipos de projetos', type: 'textarea' },
      { label: 'Fotos de projetos e logo' },
      { label: 'Diferenciais', type: 'textarea' },
    ],
  },
  Tecnologia: {
    title: 'Tecnologia',
    description: 'Apresentar sua empresa, produto ou solução tecnológica.',
    fields: [
      { label: 'Nome da empresa/projeto', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel', required: true },
      { label: 'E-mail', type: 'email' },
      { label: 'Site atual (se houver)', type: 'url' },
      { label: 'Soluções e funcionalidades', type: 'textarea' },
      { label: 'Público-alvo', type: 'textarea' },
      { label: 'Logo e identidade' },
    ],
  },
};

const DEFAULT_STANDARD_BRIEFING: BriefingConfig = {
  title: 'Briefing do Projeto',
  description: 'Preencha as informações essenciais para o desenvolvimento do seu site.',
  fields: [
    { label: 'Nome do negócio/projeto', required: true },
    { label: 'Responsável' },
    { label: 'Telefone / WhatsApp', type: 'tel', required: true },
    { label: 'E-mail', type: 'email' },
    { label: 'Instagram ou site de referência' },
    { label: 'Descrição do projeto e serviços', type: 'textarea' },
    { label: 'Diferenciais do negócio', type: 'textarea' },
    { label: 'Fotos ou Logo' },
  ],
};

const ESTILOS_PERSONALIZADO = [
  'Moderno',
  'Minimalista',
  'Elegante',
  'Luxuoso',
  'Criativo',
];

const SECOES_PERSONALIZADO = [
  'Início',
  'Sobre',
  'Serviços',
  'Projetos/Portfólio',
  'Depoimentos',
  'FAQ',
  'Contato',
];

const FUNCIONALIDADES_PERSONALIZADO = [
  'WhatsApp',
  'Formulário',
  'Galeria',
  'Animações',
  'Efeitos de scroll',
  'Área personalizada',
  'Outro',
];

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onBack,
  serviceLevel = null,
  briefingType = null,
  selectedProject = null,
  initialIntent = null,
  initialDescription = '',
}) => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RULES OF HOOKS: All 22 hooks declared at top unconditionally
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [submitted, setSubmitted] = useState(false);
  const [modalStage, setModalStage] = useState<'intent_choice' | 'briefing_form' | 'review_summary'>('briefing_form');
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  // Commercial intent: exact, inspiration, custom_idea
  const [modelIntent, setModelIntent] = useState<ModelIntentType>(initialIntent);
  const [activePlan, setActivePlan] = useState<ServiceLevelType>(serviceLevel || (selectedProject?.tier as ServiceLevelType) || 'Essencial');

  // Personalizado specific states
  const [selectedEstilos, setSelectedEstilos] = useState<string[]>(['Moderno']);
  const [selectedSecoes, setSelectedSecoes] = useState<string[]>([
    'Início',
    'Sobre',
    'Serviços',
    'Contato',
  ]);
  const [selectedFuncionalidades, setSelectedFuncionalidades] = useState<string[]>([
    'WhatsApp',
    'Formulário',
  ]);
  const [colorPreference, setColorPreference] = useState<'custom' | 'suggest'>('suggest');
  const [customColorsText, setCustomColorsText] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [customDescription, setCustomDescription] = useState(initialDescription || '');

  // Common contact inputs
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Hook 20: standardBriefing useMemo
  const standardBriefing = useMemo(() => {
    const typeToLook = briefingType || selectedProject?.briefingType || selectedProject?.clientIndustry;
    if (!typeToLook) return DEFAULT_STANDARD_BRIEFING;
    const normalized = typeToLook.trim().toLowerCase();
    const key = Object.keys(BRIEFINGS).find(
      (item) => item.toLowerCase() === normalized
    );
    return key ? BRIEFINGS[key] : DEFAULT_STANDARD_BRIEFING;
  }, [briefingType, selectedProject]);

  // Hook 21: tierBadgeInfo useMemo
  const tierBadgeInfo = useMemo(() => {
    if (activePlan === 'Premium') {
      return {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        label: 'Plano Premium',
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    if (activePlan === 'Profissional') {
      return {
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        label: 'Plano Profissional',
        icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
      };
    }
    if (activePlan === 'Personalizado') {
      return {
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        label: 'Plano Personalizado',
        icon: <Sliders className="w-3.5 h-3.5 text-purple-400" />,
      };
    }
    return {
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      label: 'Plano Essencial',
      icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
    };
  }, [activePlan]);

  // Hook 22: useEffect initialization
  useEffect(() => {
    if (!isOpen) return;

    setSubmitted(false);
    setStep(0);
    setFormData({});
    setPhotoFiles([]);
    setUploadingPhotos(false);
    setUploadError('');

    // Determine initial stage
    if (selectedProject && !initialIntent) {
      setModalStage('intent_choice');
      setModelIntent(null);
    } else {
      setModalStage('briefing_form');
      setModelIntent(initialIntent || (selectedProject ? 'exact' : 'custom_idea'));
    }

    if (serviceLevel) {
      setActivePlan(serviceLevel);
    } else if (selectedProject?.tier) {
      setActivePlan(selectedProject.tier as ServiceLevelType);
    } else {
      setActivePlan('Essencial');
    }

    if (initialDescription) {
      setCustomDescription(initialDescription);
    }

    // Pre-populate sections from project structure if available
    if (selectedProject?.structure && selectedProject.structure.length > 0) {
      const matchedSecoes = SECOES_PERSONALIZADO.filter((sec) =>
        selectedProject.structure?.some((item) =>
          item.toLowerCase().includes(sec.toLowerCase())
        )
      );
      if (matchedSecoes.length > 0) {
        setSelectedSecoes(matchedSecoes);
      }
    }

    const defaultMsg = selectedProject
      ? `Olá! Gostaria de um site com base no modelo "${selectedProject.name}" da NexaWeb.`
      : serviceLevel
      ? `Olá! Gostaria de solicitar o desenvolvimento do meu site no plano ${serviceLevel}.`
      : 'Olá! Gostaria de iniciar meu site com a NexaWeb.';

    setMessage(defaultMsg);
  }, [isOpen, briefingType, serviceLevel, selectedProject, initialIntent, initialDescription]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helper functions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const toggleSelection = (
    list: string[],
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      if (list.length > 1) {
        setter(list.filter((i) => i !== item));
      }
    } else {
      setter([...list, item]);
    }
  };

  const handlePhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    setPhotoFiles((prev) => [...prev, ...imageFiles]);
    setUploadError('');
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!photoFiles.length) return [];
    setUploadingPhotos(true);
    setUploadError('');

    try {
      const uploadedUrls: string[] = [];
      for (const file of photoFiles) {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', file);

        const response = await fetch('/api/upload-briefing', {
          method: 'POST',
          body: formDataToUpload,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Não foi possível enviar uma das fotos.');
        }

        const data = await response.json();
        if (data?.url) {
          uploadedUrls.push(data.url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.warn('Upload fotos warning:', error);
      return [];
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Build full payload for WhatsApp and submission
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push('🌟 *BRIEFING OFICIAL — NEXAWEB*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`💼 *Plano Selecionado:* ${activePlan}`);

    if (selectedProject) {
      lines.push(`🎯 *Modelo de Referência:* ${selectedProject.name} (${selectedProject.tier})`);
      if (modelIntent === 'exact') {
        lines.push('📌 *Abordagem:* Quero exatamente este formato');
      } else if (modelIntent === 'inspiration') {
        lines.push('📌 *Abordagem:* Usar este modelo como inspiração e modificar');
      } else {
        lines.push('📌 *Abordagem:* Projeto sob medida com ideia própria');
      }
    } else {
      lines.push('📌 *Abordagem:* Projeto sob medida com ideia própria');
    }

    if (clientName) lines.push(`👤 *Nome/Projeto:* ${clientName}`);
    if (clientPhone) lines.push(`📱 *Telefone/WhatsApp:* ${clientPhone}`);
    if (clientEmail) lines.push(`✉️ *E-mail:* ${clientEmail}`);
    lines.push('');

    // If Personalizado or Inspiration, format configuration
    if (activePlan === 'Personalizado' || modelIntent === 'inspiration' || modelIntent === 'custom_idea') {
      lines.push(`🎨 *Estilo:* ${selectedEstilos.join(', ')}`);
      lines.push(`📑 *Seções:* ${selectedSecoes.join(', ')}`);
      lines.push(`⚡ *Funcionalidades:* ${selectedFuncionalidades.join(', ')}`);
      lines.push(
        `🎨 *Cores:* ${
          colorPreference === 'custom'
            ? `Cores indicadas: ${customColorsText || 'A combinar'}`
            : 'Quero que a NexaWeb sugira a melhor paleta'
        }`
      );
      if (referenceUrl) lines.push(`🔗 *Referência Visual:* ${referenceUrl}`);
      if (customDescription) {
        lines.push(`📝 *Visão do Cliente:* ${customDescription}`);
      }
    } else {
      // Standard form fields
      Object.entries(formData).forEach(([k, v]) => {
        if (v?.trim()) lines.push(`• *${k}:* ${v.trim()}`);
      });
      if (message) {
        lines.push(`💬 *Mensagem:* ${message}`);
      }
    }

    lines.push('');
    lines.push('Aguardando contato da equipe NexaWeb!');
    return encodeURIComponent(lines.join('\n'));
  };

  const encodedWhatsAppMessage = buildWhatsAppMessage();

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (photoFiles.length > 0) {
      await uploadPhotos();
    }

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 3000);
  };

  const updateField = (label: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  // Determine if using configurable view vs standard steps
  const isConfigurableView =
    activePlan === 'Personalizado' ||
    modelIntent === 'inspiration' ||
    modelIntent === 'custom_idea';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUARD: Only returns null right before JSX, after all hooks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100">
        {/* MODAL HEADER */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-2.5">
            {modalStage !== 'intent_choice' && selectedProject && (
              <button
                type="button"
                onClick={() => setModalStage('intent_choice')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                aria-label="Voltar para opções de formato"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tierBadgeInfo.badge}`}
                >
                  {tierBadgeInfo.icon}
                  <span>{tierBadgeInfo.label}</span>
                </span>

                {selectedProject && (
                  <span className="text-[11px] text-neutral-400 truncate max-w-[150px] sm:max-w-[200px]">
                    · {selectedProject.name}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold font-display text-white mt-0.5">
                {modalStage === 'intent_choice'
                  ? 'Você quer este formato ou deseja personalizá-lo?'
                  : modalStage === 'review_summary'
                  ? 'Resumo do Projeto Antes do Envio'
                  : isConfigurableView
                  ? 'Briefing Configurável'
                  : `Briefing ${activePlan}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        {submitted ? (
          /* SUCCESS STATE */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex items-center justify-center text-center">
            <div className="max-w-sm space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Briefing Enviado com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Recebemos suas preferências para o plano{' '}
                <strong className="text-white">{activePlan}</strong>. Nossa equipe entrará em contato para os próximos passos.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/5511999999999?text=${encodedWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Agilizar atendimento no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        ) : modalStage === 'intent_choice' && selectedProject ? (
          /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             ETAPA REQUISITO 6: "Você quer este formato ou deseja personalizá-lo?"
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300">
              <span className="font-semibold text-white">Modelo selecionado: </span>
              <strong className="text-amber-400">{selectedProject.name}</strong> ({selectedProject.category} · {selectedProject.tier})
            </div>

            <div className="space-y-3 pt-1">
              {/* Opção 1: Quero este formato */}
              <button
                type="button"
                onClick={() => {
                  setModelIntent('exact');
                  setActivePlan(selectedProject.tier as ServiceLevelType);
                  setModalStage('briefing_form');
                }}
                className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-blue-400/60 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        Quero este formato
                      </p>
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                        Mais Rápido
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Manter {selectedProject.name} como referência principal. O site seguirá esta estrutura e estilo com os dados e fotos do seu negócio.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" />
                </div>
              </button>

              {/* Opção 2: Quero usar como inspiração e modificar */}
              <button
                type="button"
                onClick={() => {
                  setModelIntent('inspiration');
                  setActivePlan('Personalizado');
                  setModalStage('briefing_form');
                }}
                className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-purple-400/60 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        Quero usar como inspiração e modificar
                      </p>
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                        Flexível
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Usar {selectedProject.name} como ponto de partida, com liberdade para alterar estilo, seções, cores e adicionar funcionalidades.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 shrink-0 mt-1 transition-colors" />
                </div>
              </button>

              {/* Opção 3: Tenho uma ideia própria / Quero algo totalmente diferente */}
              <button
                type="button"
                onClick={() => {
                  setModelIntent('custom_idea');
                  setActivePlan('Personalizado');
                  setModalStage('briefing_form');
                }}
                className="w-full text-left p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-950 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        Tenho uma ideia própria / Quero algo diferente
                      </p>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                        Sob Medida
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Descreva livremente como imagina seu site, sem ficar preso a este modelo. Criaremos um projeto exclusivo para você.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        ) : modalStage === 'review_summary' ? (
          /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             ETAPA REQUISITO 15: RESUMO ANTES DO ENVIO COM "EDITAR" E "ENVIAR"
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300">
                Confira o resumo do seu briefing antes de finalizar. Você pode editar qualquer informação se desejar.
              </div>

              {/* Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3.5 text-xs text-neutral-300">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                    Plano Escolhido
                  </span>
                  <span className="font-bold text-white bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-700">
                    {activePlan}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                    Referência / Ponto de Partida
                  </span>
                  <span className="font-medium text-white">
                    {selectedProject
                      ? modelIntent === 'exact'
                        ? `${selectedProject.name} (Formato exato)`
                        : modelIntent === 'inspiration'
                        ? `${selectedProject.name} (Como inspiração)`
                        : 'Ideia Própria Sob Medida'
                      : 'Projeto Personalizado'}
                  </span>
                </div>

                {isConfigurableView && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                        Estilo Visual
                      </span>
                      <span className="font-medium text-white">
                        {selectedEstilos.join(', ')}
                      </span>
                    </div>

                    <div className="pb-2 border-b border-neutral-800">
                      <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                        Seções Solicitadas
                      </span>
                      <span className="font-medium text-white">
                        {selectedSecoes.join(', ')}
                      </span>
                    </div>

                    <div className="pb-2 border-b border-neutral-800">
                      <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                        Funcionalidades
                      </span>
                      <span className="font-medium text-white">
                        {selectedFuncionalidades.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                        Cores
                      </span>
                      <span className="font-medium text-white">
                        {colorPreference === 'custom'
                          ? customColorsText || 'Cores indicadas pelo cliente'
                          : 'NexaWeb sugere paleta ideal'}
                      </span>
                    </div>

                    {referenceUrl && (
                      <div className="pb-2 border-b border-neutral-800">
                        <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                          Site / Referência Visual
                        </span>
                        <span className="font-mono text-[11px] text-amber-300 break-all">
                          {referenceUrl}
                        </span>
                      </div>
                    )}

                    {customDescription && (
                      <div className="pb-2 border-b border-neutral-800">
                        <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                          Visão do Cliente
                        </span>
                        <p className="text-xs text-neutral-200 leading-relaxed italic bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                          "{customDescription}"
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Contact info recap */}
                <div className="pt-1 space-y-1">
                  <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider block">
                    Dados de Contato
                  </span>
                  <div className="text-white font-medium">
                    {clientName || 'Cliente NexaWeb'} {clientPhone ? `· ${clientPhone}` : ''}
                  </div>
                  {clientEmail && (
                    <div className="text-neutral-400 text-[11px]">{clientEmail}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions: EDITAR & ENVIAR BRIEFING */}
            <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalStage('briefing_form')}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Editar Informações</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={uploadingPhotos}
                className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {uploadingPhotos ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    <span>Enviando fotos...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar e Enviar Briefing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : isConfigurableView ? (
          /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             CONFIGURADOR (PERSONALIZADO / INSPIRAÇÃO / IDEIA PRÓPRIA)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setModalStage('review_summary');
            }}
            className="flex-1 min-h-0 flex flex-col justify-between"
          >
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Plan Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Plano Selecionado
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                  {(['Essencial', 'Personalizado', 'Profissional', 'Premium'] as ServiceLevelType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePlan(p)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all truncate ${
                        activePlan === p
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. ESTILO */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>1. Estilo Visual</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ESTILOS_PERSONALIZADO.map((estilo) => {
                    const isSelected = selectedEstilos.includes(estilo);
                    return (
                      <button
                        key={estilo}
                        type="button"
                        onClick={() => toggleSelection(selectedEstilos, estilo, setSelectedEstilos)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm border border-purple-400'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        {estilo}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SEÇÕES */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>2. Seções do Site</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SECOES_PERSONALIZADO.map((secao) => {
                    const isSelected = selectedSecoes.includes(secao);
                    return (
                      <button
                        key={secao}
                        type="button"
                        onClick={() => toggleSelection(selectedSecoes, secao, setSelectedSecoes)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 font-semibold'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {secao}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. FUNCIONALIDADES */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Funcionalidades</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FUNCIONALIDADES_PERSONALIZADO.map((func) => {
                    const isSelected = selectedFuncionalidades.includes(func);
                    return (
                      <button
                        key={func}
                        type="button"
                        onClick={() => toggleSelection(selectedFuncionalidades, func, setSelectedFuncionalidades)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 font-semibold'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {func}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. CORES */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  4. Cores do Projeto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorPreference('custom')}
                    className={`p-2.5 rounded-xl text-xs text-left transition-all ${
                      colorPreference === 'custom'
                        ? 'bg-purple-950/60 border border-purple-400 text-white font-semibold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Quero escolher as cores
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorPreference('suggest')}
                    className={`p-2.5 rounded-xl text-xs text-left transition-all ${
                      colorPreference === 'suggest'
                        ? 'bg-purple-950/60 border border-purple-400 text-white font-semibold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    NexaWeb sugere paleta
                  </button>
                </div>

                {colorPreference === 'custom' && (
                  <input
                    type="text"
                    placeholder="Ex: Tons de dourado, preto fosco e cinza chumbo..."
                    value={customColorsText}
                    onChange={(e) => setCustomColorsText(e.target.value)}
                    className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors"
                  />
                )}
              </div>

              {/* 5. REFERÊNCIA */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  5. Site ou Referência Visual (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com ou link de referência..."
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              {/* 6. DESCRIÇÃO LIVRE / IDEIA PRÓPRIA */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  6. Como você imagina o seu site?
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva seu projeto livremente (ex: objetivo principal, público-alvo, detalhes dos serviços)..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors resize-none"
                />
              </div>

              {/* 7. DADOS DE CONTATO */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  7. Informações de Contato
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Seu nome ou nome da empresa *"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp com DDD *"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <input
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>

            {/* Advance to Review Summary */}
            <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between gap-3">
              <a
                href={`https://wa.me/5511999999999?text=${encodedWhatsAppMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Direto</span>
              </a>

              <button
                type="submit"
                disabled={!clientName.trim() || !clientPhone.trim()}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Avançar para Resumo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             STANDARD STEP-BY-STEP FLOW (Com avanço para Resumo)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setModalStage('review_summary');
            }}
            className="flex-1 min-h-0 flex flex-col justify-between"
          >
            {/* Step progress */}
            <div className="shrink-0 px-5 pt-3">
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-neutral-500">
                <span>
                  Etapa {step + 1} de {standardBriefing.fields.length + 1}
                </span>
                <span>
                  {Math.round(((step + 1) / (standardBriefing.fields.length + 1)) * 100)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${((step + 1) / (standardBriefing.fields.length + 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4">
              {step === standardBriefing.fields.length ? (
                /* Last step before review */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">
                      Outras informações ou observações para o seu site
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                      placeholder="Alguma cor preferida, referência ou detalhe que você gostaria de incluir?"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clique em 'Ver Resumo' para conferir os dados antes do envio.</span>
                  </div>
                </div>
              ) : standardBriefing.fields[step] ? (
                <div className="space-y-3">
                  <label
                    htmlFor="briefing-field-standard"
                    className="block text-xs sm:text-sm font-semibold text-white"
                  >
                    {standardBriefing.fields[step].label}
                    {standardBriefing.fields[step].required && (
                      <span className="text-amber-400 ml-1">*</span>
                    )}
                  </label>

                  {standardBriefing.fields[step].label.toLowerCase().includes('foto') ? (
                    <div className="space-y-3">
                      <label
                        htmlFor="briefing-photos-std"
                        className="flex flex-col items-center justify-center min-h-[130px] rounded-2xl bg-neutral-950 border border-dashed border-neutral-700 hover:border-amber-400/50 transition-colors cursor-pointer px-4 py-4 text-center"
                      >
                        <ImagePlus className="w-6 h-6 text-amber-400 mb-2" />
                        <span className="text-xs font-semibold text-white">
                          Selecionar fotos ou logo
                        </span>
                        <span className="mt-1 text-[11px] text-neutral-500">
                          (Opcional: também pode ser enviado pelo WhatsApp)
                        </span>
                        <input
                          id="briefing-photos-std"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoSelection}
                          className="hidden"
                        />
                      </label>

                      {photoFiles.length > 0 && (
                        <div className="space-y-2">
                          {photoFiles.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs"
                            >
                              <span className="truncate max-w-[200px] text-neutral-300">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="text-neutral-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : standardBriefing.fields[step].type === 'textarea' ? (
                    <textarea
                      id="briefing-field-standard"
                      value={formData[standardBriefing.fields[step].label] || ''}
                      onChange={(e) => updateField(standardBriefing.fields[step].label, e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                      placeholder={standardBriefing.fields[step].placeholder || 'Digite aqui...'}
                      autoFocus
                    />
                  ) : (
                    <input
                      id="briefing-field-standard"
                      type={standardBriefing.fields[step].type || 'text'}
                      value={formData[standardBriefing.fields[step].label] || ''}
                      onChange={(e) => {
                        updateField(standardBriefing.fields[step].label, e.target.value);
                        if (standardBriefing.fields[step].label.toLowerCase().includes('nome')) {
                          setClientName(e.target.value);
                        }
                        if (standardBriefing.fields[step].label.toLowerCase().includes('telefone')) {
                          setClientPhone(e.target.value);
                        }
                        if (standardBriefing.fields[step].label.toLowerCase().includes('mail')) {
                          setClientEmail(e.target.value);
                        }
                      }}
                      className="w-full h-11 rounded-2xl bg-neutral-950 border border-neutral-800 px-4 text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400 transition-all"
                      placeholder={standardBriefing.fields[step].placeholder || 'Digite aqui...'}
                      required={standardBriefing.fields[step].required}
                      autoFocus
                    />
                  )}
                </div>
              ) : null}
            </div>

            {/* Step navigation */}
            <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                  aria-label="Voltar etapa"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10" />
              )}

              {step < standardBriefing.fields.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const current = standardBriefing.fields[step];
                    if (current?.required && !formData[current.label]?.trim()) {
                      return;
                    }
                    setStep((prev) => prev + 1);
                  }}
                  disabled={
                    !!standardBriefing.fields[step]?.required &&
                    !formData[standardBriefing.fields[step].label]?.trim()
                  }
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs sm:text-sm transition-all"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/20"
                >
                  <span>Ver Resumo do Briefing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
