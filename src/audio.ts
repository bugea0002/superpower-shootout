export class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  public muted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmPlaying = false;
  private suddenDeathMode = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBgm();
    } else if (this.bgmPlaying) {
      this.startBgm(this.suddenDeathMode);
    }
    return this.muted;
  }

  public playUiSelect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(780, now + 0.045);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSkillToggle(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 660, 880, 1174];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      gain.gain.setValueAtTime(0.11, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.1);
    });
  }

  public playWhistle(long = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = long ? 0.55 : 0.26;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2750, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, now);
    lfoGain.gain.setValueAtTime(110, now);

    lfo.connect(lfoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.setValueAtTime(0.13, now + dur - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain).connect(ctx.destination);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  public playKick(isSuper: boolean, perfect: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Punchy low thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isSuper ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(perfect ? 210 : 165, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + (isSuper ? 0.28 : 0.16));

    gain.gain.setValueAtTime(isSuper ? 0.32 : 0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSuper ? 0.3 : 0.18));
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);

    // Leather snap noise
    this.playNoiseBurst(isSuper ? 0.22 : 0.09, isSuper ? 1400 : 900, isSuper ? 0.22 : 0.14);

    if (isSuper) {
      const sweep = ctx.createOscillator();
      const sGain = ctx.createGain();
      sweep.type = 'square';
      sweep.frequency.setValueAtTime(220, now);
      sweep.frequency.exponentialRampToValueAtTime(1120, now + 0.24);
      sGain.gain.setValueAtTime(0.12, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      sweep.connect(sGain).connect(ctx.destination);
      sweep.start(now);
      sweep.stop(now + 0.27);
    }
  }

  public playSkillEffect(type: string): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'chrono') {
      // Time-stop downward pitch drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.42);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } else if (type === 'blink') {
      // Teleport zip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1950, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'curve' || type === 'blackhole') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.18);
      osc.frequency.linearRampToValueAtTime(240, now + 0.34);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.37);
    } else if (type === 'icewall' || type === 'titan') {
      this.playNoiseBurst(0.18, 2200, 0.15);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(type === 'icewall' ? 1280 : 140, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'icewall' ? 560 : 75, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    }
  }

  public playGoalSwishAndCheer(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Net swish
    this.playNoiseBurst(0.28, 1900, 0.18);

    // Crowd roar + triumphant fanfare
    this.playNoiseBurst(0.95, 750, 0.14);

    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + 0.06 + i * 0.085;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 3 ? 0.45 : 0.16));
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  public playSaveImpact(isSuper: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isSuper ? 300 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.22);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    this.playNoiseBurst(0.15, 1100, 0.18);

    // Heroic save chord
    const notes = [392, 587.33, 784];
    notes.forEach((f, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, now + 0.05 + idx * 0.04);
      g.gain.setValueAtTime(0.11, now + 0.05 + idx * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(now + 0.05 + idx * 0.04);
      o.stop(now + 0.36);
    });
  }

  public playPostHit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Metallic ping!
    [980, 1490, 2210].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.14 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.44);
    });
  }

  public playMissSigh(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.linearRampToValueAtTime(165, now + 0.38);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playTauntFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Funky bouncy arcade taunt chime
    const notes = [523.25, 659.25, 783.99, 1046.5, 880];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + idx * 0.07;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  private playNoiseBurst(duration: number, filterFreq: number, volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }

  public startBgm(suddenDeath = false): void {
    this.bgmPlaying = true;
    this.suddenDeathMode = suddenDeath;
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.muted) return;

    const stepMs = suddenDeath ? 125 : 155;
    const bassLine = suddenDeath
      ? [110, 110, 130.81, 146.83, 110, 164.81, 155.56, 146.83]
      : [98, 98, 116.54, 130.81, 98, 146.83, 130.81, 116.54];
    const leadLine = [
      392, 0, 466.16, 523.25, 0, 587.33, 523.25, 466.16,
      392, 0, 587.33, 659.25, 0, 587.33, 523.25, 440,
    ];

    this.bgmTimer = window.setInterval(() => {
      if (this.muted) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      const bassFreq = bassLine[this.bgmStep % bassLine.length];
      const leadFreq = leadLine[this.bgmStep % leadLine.length];

      // Chiptune bass pulse
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassFreq, now);
      bGain.gain.setValueAtTime(0.045, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      bOsc.connect(bGain).connect(ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + 0.12);

      if (leadFreq > 0) {
        const lOsc = ctx.createOscillator();
        const lGain = ctx.createGain();
        lOsc.type = 'square';
        lOsc.frequency.setValueAtTime(leadFreq, now);
        lGain.gain.setValueAtTime(0.022, now);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        lOsc.connect(lGain).connect(ctx.destination);
        lOsc.start(now);
        lOsc.stop(now + 0.11);
      }

      this.bgmStep++;
    }, stepMs);
  }

  public stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}
