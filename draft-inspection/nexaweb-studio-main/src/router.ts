/**
 * Sistema de roteamento leve e determinístico para a NexaWeb SPA.
 * Gerencia a alternância entre a visualização pública e a rota /admin,
 * com suporte completo a histórico do navegador (pushState/popstate),
 * deep-linking, refresh direto em /admin e compatibilidade entre ambientes.
 */

export interface RouteState {
  isAdmin: boolean;
  isPortal: boolean;
}

type RouteListener = (state: RouteState) => void;

const listeners = new Set<RouteListener>();

export function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname.toLowerCase().trim();
  const hash = window.location.hash.toLowerCase().trim();

  // Remove barras no final para comparação exata (ex: /admin/ -> /admin)
  const cleanPath = pathname.replace(/\/+$/, '');
  const cleanHash = hash.replace(/\/+$/, '');

  // 1. Verificação por caminho real (Pathname)
  if (
    cleanPath === '/admin' ||
    cleanPath === '/admin.html' ||
    cleanPath.startsWith('/admin/')
  ) {
    return true;
  }

  // 2. Verificação por Hash (#admin ou #/admin)
  if (
    cleanHash === '#admin' ||
    cleanHash === '#/admin' ||
    cleanHash.startsWith('#admin/') ||
    cleanHash.startsWith('#/admin/')
  ) {
    return true;
  }

  return false;
}

export function checkIsPortalRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname.toLowerCase().trim();
  const hash = window.location.hash.toLowerCase().trim();

  // Remove barras no final para comparação exata (ex: /portal/ -> /portal)
  const cleanPath = pathname.replace(/\/+$/, '');
  const cleanHash = hash.replace(/\/+$/, '');

  // 1. Verificação por caminho real (Pathname)
  if (
    cleanPath === '/portal' ||
    cleanPath === '/portal.html' ||
    cleanPath.startsWith('/portal/')
  ) {
    return true;
  }

  // 2. Verificação por Hash (#portal ou #/portal)
  if (
    cleanHash === '#portal' ||
    cleanHash === '#/portal' ||
    cleanHash.startsWith('#portal/') ||
    cleanHash.startsWith('#/portal/')
  ) {
    return true;
  }

  return false;
}

/**
 * Navega para uma nova rota programaticamente na SPA
 */
export function navigateTo(url: string, replace = false): void {
  if (typeof window === 'undefined') return;

  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }

  notifyRouteChanged();
}

/**
 * Notifica todos os ouvintes registrados sobre alteração de rota
 */
export function notifyRouteChanged(): void {
  const isAdmin = checkIsAdminRoute();
  const isPortal = checkIsPortalRoute();
  listeners.forEach((listener) => {
    try {
      listener({ isAdmin, isPortal });
    } catch (err) {
      console.error('Erro no listener de rota NexaWeb:', err);
    }
  });

  // Dispara eventos padrão para componentes externos
  window.dispatchEvent(
    new CustomEvent('nexaweb:route-change', { detail: { isAdmin, isPortal } })
  );
}

/**
 * Hook ou subscrição para alterações de rota
 */
export function subscribeToRoute(listener: RouteListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Inicializa escuta global de popstate e hashchange
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    notifyRouteChanged();
  });

  window.addEventListener('hashchange', () => {
    notifyRouteChanged();
  });
}
