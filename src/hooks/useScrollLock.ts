import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let unlockTimeoutId: number | null = null;
let originalBodyStyles: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
  paddingRight: string;
} | null = null;
let originalHtmlOverflow = '';

function getEffectiveScrollY(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

  // If body is already fixed, read from document.body.style.top
  if (document.body.style.position === 'fixed' && document.body.style.top) {
    const parsedTop = Math.abs(parseInt(document.body.style.top, 10));
    if (!isNaN(parsedTop) && parsedTop > 0) {
      return parsedTop;
    }
  }

  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

// Intercept gestures outside scrollable containers to strictly isolate background scroll on mobile and desktop
function preventGestureIfLocked(e: TouchEvent | WheelEvent) {
  let target = e.target as HTMLElement | null;
  while (target && target !== document.body && target !== document.documentElement) {
    const overflowY = window.getComputedStyle(target).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      // Element is an active scroll container (e.g. drawer or modal body)
      return;
    }
    target = target.parentElement;
  }
  // Target is on background/backdrop/static element -> prevent movement
  if (e.cancelable) {
    e.preventDefault();
  }
}

export function lockScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // If an unlock was scheduled from a previous modal closing, cancel it!
  // This keeps the page lock seamless across modal transitions.
  if (unlockTimeoutId !== null) {
    cancelAnimationFrame(unlockTimeoutId);
    unlockTimeoutId = null;
  }

  lockCount++;

  if (lockCount === 1) {
    // ALWAYS record the exact actual current scroll position
    savedScrollY = getEffectiveScrollY();

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (!originalBodyStyles) {
      originalBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      };
      originalHtmlOverflow = document.documentElement.style.overflow;
    }

    // Apply strict body and html lock
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    // Prevent visual shift on desktop scrollbar disappearance
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Add active touchmove and wheel blockers for backdrop and background elements
    window.addEventListener('touchmove', preventGestureIfLocked, { passive: false });
    window.addEventListener('wheel', preventGestureIfLocked, { passive: false });
  }
}

export function unlockScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount > 0) {
    lockCount--;
  }

  if (lockCount === 0) {
    // Remove active gesture blockers
    window.removeEventListener('touchmove', preventGestureIfLocked);
    window.removeEventListener('wheel', preventGestureIfLocked);

    // Debounce the unlock by one animation frame to allow another modal to mount without unlocking/flickering
    if (unlockTimeoutId !== null) {
      cancelAnimationFrame(unlockTimeoutId);
    }

    unlockTimeoutId = requestAnimationFrame(() => {
      unlockTimeoutId = null;
      if (lockCount > 0) return; // Re-locked in the meantime

      if (originalBodyStyles) {
        const prevHtmlScrollBehavior =
          document.documentElement.style.scrollBehavior;
        const prevBodyScrollBehavior = document.body.style.scrollBehavior;

        // Temporarily disable smooth scroll behavior for instant accurate scroll restoration
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';

        document.documentElement.style.overflow = originalHtmlOverflow || '';
        document.body.style.position = originalBodyStyles.position || '';
        document.body.style.top = originalBodyStyles.top || '';
        document.body.style.left = originalBodyStyles.left || '';
        document.body.style.right = originalBodyStyles.right || '';
        document.body.style.width = originalBodyStyles.width || '';
        document.body.style.overflow = originalBodyStyles.overflow || '';
        document.body.style.paddingRight = originalBodyStyles.paddingRight || '';
        originalBodyStyles = null;

        // Restore scroll position instantly without jumping to top
        const targetScrollY = savedScrollY;

        // Explicitly reset savedScrollY so future modal openings never inherit stale values
        savedScrollY = 0;

        window.scrollTo(0, targetScrollY);
        document.documentElement.scrollTop = targetScrollY;
        document.body.scrollTop = targetScrollY;

        // Re-enable original scroll behavior after layout has settled
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = prevHtmlScrollBehavior;
          document.body.style.scrollBehavior = prevBodyScrollBehavior;
        });
      }
    });
  }
}

export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}

