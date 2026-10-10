import { useEffect, useRef } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Ref opcional para o elemento container do modal onde o foco deve permanecer.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Hook universal de acessibilidade para modais da NexaWeb:
 * - Fecha via tecla Escape (ESC)
 * - Salva o elemento com foco anterior e restaura ao fechar
 * - Trava o ciclo do Tab dentro do modal para impedir foco em elementos de fundo
 * - Garante que nenhuma operação de tecla afete ou mude a rolagem da página
 */
export function useModalA11y({
  isOpen,
  onClose,
  containerRef,
}: UseModalA11yOptions) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    // 1. Armazena o elemento focado antes de abrir o modal
    if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    // 2. Foco inicial suave no container do modal
    const focusTimer = requestAnimationFrame(() => {
      if (containerRef?.current) {
        // Encontra o primeiro elemento focável ou foca o container
        const focusable = containerRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          containerRef.current.focus?.();
        }
      }
    });

    // 3. Listener de teclado para ESC e foco (Tab trap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Tab trap se houver containerRef
      if (e.key === 'Tab' && containerRef?.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);

      // Restaura o foco para o elemento original sem saltar a página
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        try {
          previousActiveElementRef.current.focus({ preventScroll: true });
        } catch {
          previousActiveElementRef.current.focus();
        }
        previousActiveElementRef.current = null;
      }
    };
  }, [isOpen, onClose, containerRef]);
}
