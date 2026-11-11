import { Afterimage, BannerPopup, PixelParticle, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

export class PixelVFXManager {
  public particles: PixelParticle[] = [];
  public afterimages: Afterimage[] = [];
  public shockwaves: Array<{ x: number; y: number; r: number; maxR: number; color: string; life: number; maxLife: number }> = [];
  public banner: BannerPopup | null = null;
  public shakeTime = 0;
  public shakeIntensity = 0;
  public flashTimer = 0;
  public flashColor = '#ffffff';
  public speedLinesTimer = 0;
  public speedLinesColor = '#facc15';
  public scorchMarks: Array<{ x: number; y: number; life: number }> = [];

  public resetRound(): void {
    this.particles = [];
    this.afterimages = [];
    this.shockwaves = [];
    this.scorchMarks = [];
    this.speedLinesTimer = 0;
  }

  public triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  public triggerFlash(color: string, duration = 0.12): void {
    this.flashColor = color;
    this.flashTimer = duration;
  }

  public triggerSpeedLines(color: string, duration = 0.5): void {
    this.speedLinesColor = color;
    this.speedLinesTimer = duration;
  }

  public showBanner(title: string, subtitle: string, color: string, strokeColor = '#0f172a', duration = 1.45): void {
    this.banner = {
      title,
      subtitle,
      color,
      strokeColor,
      timer: 0,
      duration,
    };
  }

  public spawnShockwave(x: number, y: number, maxR: number, color: string, duration = 0.28): void {
    this.shockwaves.push({ x, y, r: 3, maxR, color, life: duration, maxLife: duration });
  }

  public spawnBurst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    speedMin: number,
    speedMax: number,
    sizeMax = 4,
    gravity = 90
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      const life = 0.25 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 1 + Math.floor(Math.random() * sizeMax),
        color: colors[Math.floor(Math.random() * colors.length)],
        life,
        maxLife: life,
        gravity,
        dither: Math.random() > 0.5,
      });
    }
  }

  public spawnAuraParticles(x: number, y: number, colors: string[]): void {
    for (let i = 0; i < 2; i++) {
      const ox = (Math.random() - 0.5) * 34;
      const oy = (Math.random() - 0.5) * 20;
      const life = 0.25 + Math.random() * 0.25;
      this.particles.push({
        x: x + ox,
        y: y + 12 + oy,
        vx: (Math.random() - 0.5) * 14,
        vy: -38 - Math.random() * 45,
        size: 2 + Math.floor(Math.random() * 2),
        color: colors[Math.floor(Math.random() * colors.length)],
        life,
        maxLife: life,
        gravity: -20,
      });
    }
  }

  public spawnFlameTrail(x: number, y: number, groundY: number): void {
    const flameColors = ['#fef08a', '#facc15', '#f97316', '#ef4444', '#7f1d1d'];
    for (let i = 0; i < 4; i++) {
      const life = 0.16 + Math.random() * 0.2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 30,
        vy: -15 - Math.random() * 35,
        size: 2 + Math.floor(Math.random() * 3),
        color: flameColors[Math.floor(Math.random() * flameColors.length)],
        life,
        maxLife: life,
        gravity: -35,
      });
    }
    if (Math.random() < 0.55) {
      this.scorchMarks.push({ x, y: groundY, life: 1.8 });
    }
  }

  public spawnConfetti(): void {
    const colors = ['#facc15', '#38bdf8', '#f43f5e', '#4ade80', '#c084fc', '#ffffff'];
    for (let i = 0; i < 65; i++) {
      const life = 1.1 + Math.random() * 0.9;
      this.particles.push({
        x: 90 + Math.random() * 300,
        y: 35 + Math.random() * 55,
        vx: (Math.random() - 0.5) * 150,
        vy: -60 - Math.random() * 90,
        size: 2 + Math.floor(Math.random() * 3),
        color: colors[Math.floor(Math.random() * colors.length)],
        life,
        maxLife: life,
        gravity: 115,
      });
    }
  }

  public addAfterimage(x: number, y: number, scale: number, color: string, type: 'ball' | 'keeper'): void {
    this.afterimages.push({
      x,
      y,
      scale,
      color,
      life: 0.18,
      maxLife: 0.18,
      type,
    });
  }

  public update(dt: number): void {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime === 0) this.shakeIntensity = 0;
    }

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    if (this.speedLinesTimer > 0) {
      this.speedLinesTimer = Math.max(0, this.speedLinesTimer - dt);
    }

    if (this.banner) {
      this.banner.timer += dt;
      if (this.banner.timer >= this.banner.duration) {
        this.banner = null;
      }
    }

    for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
      this.scorchMarks[i].life -= dt;
      if (this.scorchMarks[i].life <= 0) this.scorchMarks.splice(i, 1);
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].life -= dt;
      if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const t = 1 - sw.life / sw.maxLife;
      sw.r = 3 + (sw.maxR - 3) * t;
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  public getShakeOffset(): [number, number] {
    if (this.shakeTime <= 0) return [0, 0];
    const ox = Math.round((Math.random() - 0.5) * 2 * this.shakeIntensity);
    const oy = Math.round((Math.random() - 0.5) * 2 * this.shakeIntensity);
    return [ox, oy];
  }

  public renderGroundScorch(ctx: CanvasRenderingContext2D): void {
    for (const s of this.scorchMarks) {
      const alpha = Math.min(1, s.life);
      ctx.fillStyle = `rgba(15, 23, 42, ${0.55 * alpha})`;
      ctx.fillRect(Math.round(s.x - 5), Math.round(s.y - 1), 10, 3);
      ctx.fillStyle = `rgba(249, 115, 22, ${0.65 * alpha})`;
      ctx.fillRect(Math.round(s.x - 3), Math.round(s.y), 6, 1);
    }
  }

  public renderBlackHole(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
    const cx = Math.round(x);
    const cy = Math.round(y);
    // Swirling pixel vortex rings
    const radii = [26, 20, 14, 9];
    const cols = ['rgba(168,85,247,0.35)', 'rgba(192,132,252,0.55)', '#7e22ce', '#020617'];
    radii.forEach((r, idx) => {
      ctx.fillStyle = cols[idx];
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2 + time * (idx % 2 === 0 ? 6 : -8);
        const pxX = Math.round(cx + Math.cos(ang) * r);
        const pxY = Math.round(cy + Math.sin(ang) * r * 0.75);
        ctx.fillRect(pxX - 2, pxY - 2, 4, 4);
      }
    });
    ctx.fillStyle = '#020617';
    ctx.fillRect(cx - 7, cy - 6, 14, 12);
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(cx - 8, cy - 1, 2, 2);
    ctx.fillRect(cx + 6, cy - 1, 2, 2);
  }

  public renderChronoClock(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number): void {
    const cx = Math.round(x);
    const cy = Math.round(y);
    const r = 18;
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * r) - 1, Math.round(cy + Math.sin(ang) * r) - 1, 2, 2);
    }
    // Clock hand ticking fast
    const handAng = -Math.PI / 2 + progress * Math.PI * 4;
    for (let d = 0; d < 14; d += 2) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(Math.round(cx + Math.cos(handAng) * d), Math.round(cy + Math.sin(handAng) * d), 2, 2);
    }
  }

  public renderWorldEffects(ctx: CanvasRenderingContext2D): void {
    // Pixel Afterimages
    for (const ai of this.afterimages) {
      const alpha = (ai.life / ai.maxLife) * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ai.color;
      const sz = Math.round(14 * ai.scale);
      if (ai.type === 'ball') {
        ctx.fillRect(Math.round(ai.x - sz / 2), Math.round(ai.y - sz / 2), sz, sz);
      } else {
        ctx.fillRect(Math.round(ai.x - 14), Math.round(ai.y - 18), 28, 36);
      }
      ctx.restore();
    }

    // Pixel Shockwaves (stepped octagon/circle dots)
    for (const sw of this.shockwaves) {
      ctx.fillStyle = sw.color;
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        if (sw.life < sw.maxLife * 0.4 && i % 2 === 1) continue; // pixel dither fade
        const ang = (i / steps) * Math.PI * 2;
        const pxX = Math.round(sw.x + Math.cos(ang) * sw.r);
        const pxY = Math.round(sw.y + Math.sin(ang) * sw.r);
        ctx.fillRect(pxX - 1, pxY - 1, 2, 2);
      }
    }

    // Pixel Particles
    for (const p of this.particles) {
      if (p.dither && p.life < p.maxLife * 0.35 && Math.floor(p.life * 60) % 2 === 0) {
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }

  public renderScreenOverlays(ctx: CanvasRenderingContext2D, time: number): void {
    // Anime Speed Lines along screen borders
    if (this.speedLinesTimer > 0) {
      ctx.fillStyle = this.speedLinesColor;
      for (let i = 0; i < 22; i++) {
        const y = ((i * 29 + Math.floor(time * 900)) % VIRTUAL_HEIGHT);
        const len = 24 + ((i * 19) % 48);
        if (i % 2 === 0) {
          ctx.fillRect(0, y, len, 2);
        } else {
          ctx.fillRect(VIRTUAL_WIDTH - len, y, len, 2);
        }
      }
    }

    // Impact Flash
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, this.flashTimer * 5);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      ctx.restore();
    }

    // Comic Action Popup Banner
    if (this.banner) {
      const b = this.banner;
      const t = b.timer / b.duration;
      const slide = t < 0.12 ? (t / 0.12) : t > 0.86 ? (1 - t) / 0.14 : 1;
      const bannerY = Math.round(88 - (1 - slide) * 18);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, slide));

      // Diagonal-feel comic stripe bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.fillRect(0, bannerY - 18, VIRTUAL_WIDTH, 42);
      ctx.fillStyle = b.color;
      ctx.fillRect(0, bannerY - 18, VIRTUAL_WIDTH, 3);
      ctx.fillRect(0, bannerY + 21, VIRTUAL_WIDTH, 3);

      // Bold arcade title
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 22px "Press Start 2P", "Galmuri11", "DungGeunMo", monospace';
      ctx.lineWidth = 5;
      ctx.strokeStyle = b.strokeColor;
      ctx.strokeText(b.title, VIRTUAL_WIDTH / 2, bannerY - 1);
      ctx.fillStyle = b.color;
      ctx.fillText(b.title, VIRTUAL_WIDTH / 2, bannerY - 1);

      if (b.subtitle) {
        ctx.font = '700 9.5px "Galmuri11", "DungGeunMo", monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(b.subtitle, VIRTUAL_WIDTH / 2, bannerY + 15);
      }

      ctx.restore();
    }
  }
}
