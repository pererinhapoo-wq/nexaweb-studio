/**
 * Configurações Centrais de Contato e Presença Digital da NexaWeb
 * 
 * Regra: Nunca inventar números fictícios ou links falsos de WhatsApp.
 * Enquanto a NexaWeb não tiver um número comercial oficial configurado,
 * o sistema utiliza o Instagram oficial (@nexaw1) e o formulário de briefing
 * como canais principais.
 */

export const NEXAWEB_CONTACT = {
  // Instagram Oficial verificado da NexaWeb
  instagramUrl: 'https://www.instagram.com/nexaw1/',
  instagramHandle: '@nexaw1',

  // WhatsApp Comercial Oficial
  // IMPORTANTE: Deixado vazio propositalmente até a aquisição do chip/número empresarial oficial.
  // Quando estiver disponível, preencher com o formato internacional (ex: '55119XXXXXXXX').
  officialWhatsAppNumber: '',

  // E-mail comercial para contato formal
  commercialEmail: 'contato@nexaweb.com.br',

  // Localização / Atendimento
  operatingHours: 'Segunda a Sexta · 09h às 18h',
  region: 'Brasil · Atendimento 100% Remoto',
};

/**
 * Retorna se a NexaWeb possui WhatsApp comercial oficial configurado.
 */
export function hasOfficialWhatsApp(): boolean {
  return Boolean(
    NEXAWEB_CONTACT.officialWhatsAppNumber &&
    NEXAWEB_CONTACT.officialWhatsAppNumber.trim().length >= 10
  );
}

/**
 * Gera URL do WhatsApp apenas se houver número oficial configurado.
 * Caso contrário, retorna null para evitar links quebrados ou fictícios.
 */
export function getOfficialWhatsAppUrl(message?: string): string | null {
  if (!hasOfficialWhatsApp()) {
    return null;
  }

  const encoded = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${NEXAWEB_CONTACT.officialWhatsAppNumber}${encoded ? `?text=${encoded}` : ''}`;
}

/**
 * Retorna o link direto para o Instagram Oficial.
 */
export function getOfficialInstagramUrl(): string {
  return NEXAWEB_CONTACT.instagramUrl;
}
