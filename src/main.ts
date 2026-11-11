import './style.css';
import { SuperpowerShootoutGame } from './game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #game-canvas element');
  }
  const game = new SuperpowerShootoutGame(canvas);
  game.start();
});
