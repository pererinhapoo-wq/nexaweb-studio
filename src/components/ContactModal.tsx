import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageCircle, Mail, Shield, Award, Sliders } from 'lucide-react';

export type ServiceLevelType = 'Essencial' | 'Profissional' | 'Personalizado';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLevel?: ServiceLevelType | null;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  serviceLevel = null,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<ServiceLevelType | null>(serviceLevel);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    segment: 'Academia',
    message: '',
  });

  useEffect(() => {
    setCurrentLevel(serviceLevel);
    if (serviceLevel) {
      setFormData((prev) => ({
        ...prev,
        message: prev.message || `Olá! Gostaria de solicitar o desenvolvimento do meu site no nível ${serviceLevel}.`,
      }));
    }
  }, [serviceLevel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2800);
  };

  const encodedWhatsAppMessage = encodeURIComponent(
    currentLevel
      ? `Olá, gostaria de solicitar o briefing do site nível ${currentLevel} com a NexaWeb.`
      : 'Olá, gostaria de um projeto com a NexaWeb.'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-display text-white">
                {currentLevel ? `Briefing: Nível ${currentLevel}` : 'Fale com a NexaWeb'}
              </h3>
              {currentLevel === 'Essencial' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Essencial
                </span>
              )}
              {currentLevel === 'Profissional' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Profissional
                </span>
              )}
              {currentLevel === 'Personalizado' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Sob Medida
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {currentLevel
                ? `Preencha as informações para iniciar o briefing do seu site ${currentLevel}`
                : 'Desenvolva um projeto exclusivo para sua empresa'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Solicitação enviada com sucesso!</h4>
            <p className="text-sm text-neutral-400 max-w-xs">
              A equipe da NexaWeb entrará em contato em breve para apresentar a melhor solução para o seu negócio.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Seu Nome ou Empresa
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Carlos Silva / Studio Fit"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                E-mail de Contato
              </label>
              <input
                required
                type="email"
                placeholder="seu.email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Segmento de Interesse
              </label>
              <select
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="Academia">Academia / Fitness</option>
                <option value="Criador de Conteúdo">Criador de Conteúdo / Influencer</option>
                <option value="Engenharia">Engenharia / Construção</option>
                <option value="Imobiliária">Imobiliária / Alto Padrão</option>
                <option value="Loja">Loja / E-commerce</option>
                <option value="Clínica">Clínica / Saúde</option>
                <option value="Restaurante">Restaurante / Gastronomia</option>
                <option value="Arquitetura">Arquitetura</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Outro">Outro segmento sob medida</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Mensagem ou Briefing do Projeto
              </label>
              <textarea
                rows={3}
                placeholder="Conte-nos os objetivos e detalhes do seu site..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Briefing</span>
              </button>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs text-neutral-400">
                <a
                  href={`https://wa.me/5511999999999?text=${encodedWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Direto</span>
                </a>
                <span className="text-neutral-700">·</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>contato@nexaweb.com.br</span>
                </span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
