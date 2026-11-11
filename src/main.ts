import './style.css';
import { SuperpowerShootoutGame } from './game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }
  const game = new SuperpowerShootoutGame(canvas);
  game.start();

  // Fullscreen button handler
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if ((root as any).webkitRequestFullscreen) {
          await (root as any).webkitRequestFullscreen();
        }
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (_) {
            // Screen orientation lock might not be supported or permitted
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  fullscreenBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
      toggleFullscreen();
    }
  });
});
