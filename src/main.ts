import './style.css';
import { SuperpowerShootoutGame } from './game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }
  const game = new SuperpowerShootoutGame(canvas);
  game.start();

  // Request fullscreen and orientation lock on first interaction
  const requestAutoFullscreen = async () => {
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
          } catch (_) {}
        }
      }
    } catch (_) {
      // Browser security may require direct user gesture
    }
  };

  window.addEventListener('pointerdown', requestAutoFullscreen, { once: true });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) {
        requestAutoFullscreen();
      } else {
        document.exitFullscreen?.();
      }
    }
  });
});
