import './style.css';
import { SuperpowerShootoutGame } from './game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLButtonElement | null;
  const btnAspect = document.getElementById('btn-aspect') as HTMLButtonElement | null;

  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }
  const game = new SuperpowerShootoutGame(canvas);
  game.start();

  // 1. Mobile Default: Automatically activate wide-fill (no black bars on phone screens!)
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
  if (isMobile && canvasWrapper) {
    canvasWrapper.classList.add('wide-fill');
    if (btnAspect) btnAspect.textContent = '[비율: 꽉채움]';
  }

  // 2. Aspect Ratio Toggle (16:9 Fit vs Mobile Wide Fill)
  if (btnAspect && canvasWrapper) {
    btnAspect.addEventListener('click', (e) => {
      e.stopPropagation();
      const isWide = canvasWrapper.classList.toggle('wide-fill');
      btnAspect.textContent = isWide ? '[비율: 꽉채움]' : '[비율: 16:9]';
    });
  }

  // 3. Fullscreen & Hide Address Bar Logic
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if ((root as any).webkitRequestFullscreen) {
          await (root as any).webkitRequestFullscreen();
        } else if ((root as any).msRequestFullscreen) {
          await (root as any).msRequestFullscreen();
        }

        // Lock landscape orientation on mobile devices
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (_) {}
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (_) {
      // Browser permissions fallback
    }

    // Scroll to hide address bar on iOS Safari / Android Chrome
    window.scrollTo(0, 1);
    updateFullscreenButton();
  };

  const updateFullscreenButton = () => {
    if (!btnFullscreen) return;
    const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    btnFullscreen.textContent = isFs ? '[창모드]' : '[전체화면]';
  };

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
    });
  }

  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

  // Auto-fullscreen & address bar hide on first touch/interaction
  const requestAutoFullscreen = () => {
    window.scrollTo(0, 1);
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      toggleFullscreen();
    }
  };

  window.addEventListener('pointerdown', requestAutoFullscreen, { once: true });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
      toggleFullscreen();
    }
  });
});
