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
  Sliders,
} from 'lucide-react';

export type ServiceLevelType =
  | 'Essencial'
  | 'Profissional'
  | 'Personalizado';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLevel?: ServiceLevelType | null;
  briefingType?: string | null;
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
    description:
      'Agora vamos reunir os detalhes que serão usados para montar o site da sua barbearia.',
    fields: [
      { label: 'Nome do negócio/projeto', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição da barbearia', type: 'textarea' },
      { label: 'Serviços', type: 'textarea' },
      { label: 'Cortes', type: 'textarea' },
      { label: 'Barba', type: 'textarea' },
      { label: 'Combos', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Barbeiros/profissionais', type: 'textarea' },
      { label: 'Fotos', type: 'textarea' },
      { label: 'Logo' },
      { label: 'Outras redes sociais' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Academia: {
    title: 'Academia',
    description:
      'Agora vamos reunir as informações necessárias para apresentar sua academia de forma clara e profissional.',
    fields: [
      { label: 'Nome da academia', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição da academia', type: 'textarea' },
      { label: 'Modalidades e atividades', type: 'textarea' },
      { label: 'Planos', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Profissionais/instrutores', type: 'textarea' },
      { label: 'Estrutura e equipamentos', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Restaurante: {
    title: 'Restaurante',
    description:
      'Agora vamos reunir os detalhes que serão usados para apresentar seu restaurante e seus principais produtos.',
    fields: [
      { label: 'Nome do restaurante', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição do restaurante', type: 'textarea' },
      { label: 'Cardápio', type: 'textarea' },
      { label: 'Pratos principais', type: 'textarea' },
      { label: 'Bebidas', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Delivery e pedidos' },
      { label: 'Formas de pagamento' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Loja: {
    title: 'Loja',
    description:
      'Agora vamos reunir as informações necessárias para estruturar a apresentação da sua loja.',
    fields: [
      { label: 'Nome da loja', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Descrição da loja', type: 'textarea' },
      { label: 'Produtos', type: 'textarea' },
      { label: 'Categorias de produtos', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Formas de pagamento' },
      { label: 'Entrega ou retirada' },
      { label: 'Link da loja', type: 'url' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Outras redes sociais' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Imobiliária: {
    title: 'Imobiliária',
    description:
      'Agora vamos reunir os dados necessários para apresentar seus imóveis e sua empresa.',
    fields: [
      { label: 'Nome da imobiliária', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Descrição da imobiliária', type: 'textarea' },
      { label: 'Tipos de imóveis', type: 'textarea' },
      { label: 'Imóveis disponíveis', type: 'textarea' },
      { label: 'Localizações atendidas', type: 'textarea' },
      { label: 'Faixa de preços', type: 'textarea' },
      { label: 'Corretores/profissionais', type: 'textarea' },
      { label: 'Fotos dos imóveis' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Salão: {
    title: 'Salão',
    description:
      'Agora vamos reunir os detalhes necessários para apresentar seu salão e seus serviços.',
    fields: [
      { label: 'Nome do salão', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição do salão', type: 'textarea' },
      { label: 'Serviços', type: 'textarea' },
      { label: 'Cabelo', type: 'textarea' },
      { label: 'Unhas', type: 'textarea' },
      { label: 'Estética', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Profissionais', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  'Prestador de Serviço': {
    title: 'Prestador de Serviço',
    description:
      'Agora vamos reunir as informações necessárias para apresentar seus serviços e facilitar o contato com seus clientes.',
    fields: [
      { label: 'Nome do negócio/projeto', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Área de atuação' },
      { label: 'Descrição do serviço', type: 'textarea' },
      { label: 'Serviços oferecidos', type: 'textarea' },
      { label: 'Região de atendimento' },
      { label: 'Preços ou orçamento', type: 'textarea' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Fotos ou trabalhos realizados' },
      { label: 'Logo' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  'Influenciador Digital': {
    title: 'Influenciador Digital',
    description:
      'Agora vamos reunir as informações que serão usadas para apresentar seu trabalho, conteúdo e canais.',
    fields: [
      { label: 'Nome ou nome artístico', required: true },
      { label: 'Responsável' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefone', type: 'tel' },
      { label: 'Instagram' },
      { label: 'YouTube' },
      { label: 'TikTok' },
      { label: 'Outras redes sociais' },
      { label: 'Descrição do perfil', type: 'textarea' },
      { label: 'Nicho/conteúdo', type: 'textarea' },
      { label: 'Projetos e trabalhos', type: 'textarea' },
      { label: 'Marcas/parcerias', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo ou identidade visual' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  'Criador de Conteúdo': {
    title: 'Criador de Conteúdo',
    description:
      'Agora vamos reunir as informações necessárias para apresentar seu conteúdo e seus principais canais.',
    fields: [
      { label: 'Nome ou nome do projeto', required: true },
      { label: 'Responsável' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefone', type: 'tel' },
      { label: 'Descrição do projeto', type: 'textarea' },
      { label: 'Tipo de conteúdo', type: 'textarea' },
      { label: 'Plataformas utilizadas', type: 'textarea' },
      { label: 'Instagram' },
      { label: 'YouTube' },
      { label: 'TikTok' },
      { label: 'Outras redes sociais' },
      { label: 'Projetos/trabalhos', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Engenharia: {
    title: 'Engenharia',
    description:
      'Agora vamos reunir os detalhes necessários para apresentar sua empresa, projetos e serviços de engenharia.',
    fields: [
      { label: 'Nome da empresa', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Descrição da empresa', type: 'textarea' },
      { label: 'Serviços de engenharia', type: 'textarea' },
      { label: 'Projetos realizados', type: 'textarea' },
      { label: 'Áreas de atuação', type: 'textarea' },
      { label: 'Equipe/profissionais', type: 'textarea' },
      { label: 'Certificações', type: 'textarea' },
      { label: 'Fotos de projetos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Clínica: {
    title: 'Clínica',
    description:
      'Agora vamos reunir as informações necessárias para apresentar sua clínica, profissionais e serviços.',
    fields: [
      { label: 'Nome da clínica', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição da clínica', type: 'textarea' },
      { label: 'Especialidades', type: 'textarea' },
      { label: 'Serviços', type: 'textarea' },
      { label: 'Profissionais', type: 'textarea' },
      { label: 'Convênios', type: 'textarea' },
      { label: 'Preços/informações de atendimento', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Arquitetura: {
    title: 'Arquitetura',
    description:
      'Agora vamos reunir os detalhes necessários para apresentar seu escritório e seus projetos.',
    fields: [
      { label: 'Nome do escritório', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Descrição do escritório', type: 'textarea' },
      { label: 'Serviços', type: 'textarea' },
      { label: 'Projetos realizados', type: 'textarea' },
      { label: 'Tipos de projetos', type: 'textarea' },
      { label: 'Equipe', type: 'textarea' },
      { label: 'Fotos dos projetos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Tecnologia: {
    title: 'Tecnologia',
    description:
      'Agora vamos reunir as informações necessárias para apresentar sua empresa, produto ou solução tecnológica.',
    fields: [
      { label: 'Nome da empresa/projeto', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Site atual', type: 'url' },
      { label: 'Redes sociais' },
      { label: 'Descrição da empresa/produto', type: 'textarea' },
      { label: 'Produto ou solução', type: 'textarea' },
      { label: 'Serviços', type: 'textarea' },
      { label: 'Funcionalidades principais', type: 'textarea' },
      { label: 'Público-alvo', type: 'textarea' },
      { label: 'Projetos/trabalhos', type: 'textarea' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },

  Academia: {
    title: 'Academia',
    description:
      'Agora vamos reunir as informações necessárias para apresentar sua academia de forma clara e profissional.',
    fields: [
      { label: 'Nome da academia', required: true },
      { label: 'Responsável' },
      { label: 'Telefone', type: 'tel' },
      { label: 'E-mail', type: 'email' },
      { label: 'Instagram ou outra rede social' },
      { label: 'Endereço' },
      { label: 'Horário de funcionamento' },
      { label: 'Descrição da academia', type: 'textarea' },
      { label: 'Modalidades e atividades', type: 'textarea' },
      { label: 'Planos', type: 'textarea' },
      { label: 'Preços', type: 'textarea' },
      { label: 'Profissionais/instrutores', type: 'textarea' },
      { label: 'Estrutura e equipamentos', type: 'textarea' },
      { label: 'Fotos' },
      { label: 'Logo' },
      { label: 'Diferenciais', type: 'textarea' },
      { label: 'Link da localização', type: 'url' },
      { label: 'Outras informações', type: 'textarea' },
    ],
  },
};

const DEFAULT_BRIEFING: BriefingConfig = {
  title: 'Projeto personalizado',
  description:
    'Agora vamos reunir as informações disponíveis para entender seu projeto e suas necessidades.',
  fields: [
    { label: 'Nome do negócio/projeto', required: true },
    { label: 'Responsável' },
    { label: 'Telefone', type: 'tel' },
    { label: 'E-mail', type: 'email' },
    { label: 'Instagram ou outra rede social' },
    { label: 'Descrição do projeto', type: 'textarea' },
    { label: 'Objetivos do site', type: 'textarea' },
    { label: 'Serviços ou produtos', type: 'textarea' },
    { label: 'Público-alvo', type: 'textarea' },
    { label: 'Referências de sites' },
    { label: 'Funcionalidades desejadas', type: 'textarea' },
    { label: 'Fotos' },
    { label: 'Logo' },
    { label: 'Diferenciais', type: 'textarea' },
    { label: 'Outras informações', type: 'textarea' },
  ],
};

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  serviceLevel = null,
  briefingType = null,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const briefing = useMemo(() => {
    if (!briefingType) return DEFAULT_BRIEFING;

    const normalized = briefingType.trim().toLowerCase();

    const key = Object.keys(BRIEFINGS).find(
      (item) => item.toLowerCase() === normalized
    );

    return key ? BRIEFINGS[key] : DEFAULT_BRIEFING;
  }, [briefingType]);

  useEffect(() => {
    if (!isOpen) return;

    setSubmitted(false);
    setStep(0);
    setFormData({});
    setMessage(
      briefingType
        ? `Olá! Gostaria de solicitar o briefing para um site de ${briefing.title}.`
        : serviceLevel
          ? `Olá! Gostaria de solicitar o desenvolvimento do meu site no nível ${serviceLevel}.`
          : 'Olá! Gostaria de um projeto com a NexaWeb.'
    );
  }, [isOpen, briefingType, serviceLevel, briefing.title]);

  if (!isOpen) return null;

  const totalSteps = briefing.fields.length + 1;
  const isLastStep = step === totalSteps - 1;
  const currentField = briefing.fields[step];

  const updateField = (label: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();

    if (currentField?.required && !formData[currentField.label]?.trim()) {
      return;
    }

    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2800);
  };

  const encodedWhatsAppMessage = encodeURIComponent(
    [
      briefingType
        ? `Olá, gostaria de solicitar o briefing de ${briefing.title} com a NexaWeb.`
        : serviceLevel
          ? `Olá, gostaria de solicitar o briefing do site nível ${serviceLevel} com a NexaWeb.`
          : 'Olá, gostaria de um projeto com a NexaWeb.',
      '',
      ...Object.entries(formData)
        .filter(([, value]) => value.trim())
        .map(([key, value]) => `${key}: ${value}`),
      '',
      `Mensagem: ${message}`,
    ].join('\n')
  );

  const field = currentField;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl text-neutral-100">
        {/* HEADER */}
        <div className="shrink-0 flex items-center gap-3 px-5 sm:px-7 py-4 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-xl">
          <button
            type="button"
            onClick={handleBack}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-colors"
            aria-label="Voltar para a etapa anterior"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold font-display text-white truncate">
                {briefing.title}
              </h3>

              {serviceLevel === 'Essencial' && (
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Essencial
                </span>
              )}

              {serviceLevel === 'Profissional' && (
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Profissional
                </span>
              )}

              {serviceLevel === 'Personalizado' && (
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Sob Medida
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 mt-0.5 truncate">
              {briefing.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS */}
        <div className="shrink-0 px-5 sm:px-7 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-neutral-500">
              Etapa {step + 1} de {totalSteps}
            </span>

            <span className="text-[11px] text-neutral-500">
              {Math.round(((step + 1) / totalSteps) * 100)}%
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
              style={{
                width: `${((step + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* CONTENT */}
        {submitted ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Briefing recebido
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Obrigado pelas informações. A NexaWeb poderá analisar os
                detalhes do seu projeto.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5">
              {step === 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Informações iniciais do projeto
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Preencha as informações disponíveis. Os dados
                        específicos de cada tipo de site já estão organizados
                        neste briefing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLastStep ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">
                      Outras informações ou observações
                    </label>

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={7}
                      className="w-full resize-none rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                      placeholder="Digite outras informações importantes para o projeto..."
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800">
                    <div className="flex items-start gap-3">
                      <Award className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />

                      <p className="text-xs leading-5 text-neutral-500">
                        Revise as informações preenchidas antes de enviar o
                        briefing.
                      </p>
                    </div>
                  </div>
                </div>
              ) : field ? (
                <div className="space-y-3">
                  <label
                    htmlFor="briefing-field"
                    className="block text-sm font-semibold text-white"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-amber-400 ml-1">*</span>
                    )}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id="briefing-field"
                      value={formData[field.label] || ''}
                      onChange={(e) =>
                        updateField(field.label, e.target.value)
                      }
                      rows={7}
                      className="w-full resize-y min-h-[150px] rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                      placeholder={field.placeholder || 'Digite aqui...'}
                      autoFocus
                    />
                  ) : (
                    <input
                      id="briefing-field"
                      type={field.type || 'text'}
                      value={formData[field.label] || ''}
                      onChange={(e) =>
                        updateField(field.label, e.target.value)
                      }
                      className="w-full h-12 rounded-2xl bg-neutral-950 border border-neutral-800 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                      placeholder={field.placeholder || 'Digite aqui...'}
                      required={field.required}
                      autoFocus
                    />
                  )}

                  {field.required && !formData[field.label]?.trim() && (
                    <p className="text-[11px] text-neutral-600">
                      Este campo é necessário para continuar.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* FOOTER */}
            <div className="shrink-0 border-t border-neutral-800 bg-neutral-900/95 backdrop-blur-xl px-5 sm:px-7 py-4">
              <div className="flex items-center gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    aria-label="Etapa anterior"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-11 shrink-0" />
                )}

                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      !!field?.required &&
                      !formData[field.label]?.trim()
                    }
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-sm transition-all"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Briefing
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] text-neutral-500">
                <a
                  href={`https://wa.me/5511999999999?text=${encodedWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp Direto
                </a>

                <span className="hidden sm:block text-neutral-700">
                  •
                </span>

                <a
                  href="mailto:contato@nexaweb.com.br"
                  className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  contato@nexaweb.com.br
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
