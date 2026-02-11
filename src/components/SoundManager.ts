/**
 * VOID_WEAVER // AUDIO_MODULE
 * SYNTH: OSCILLATOR_MATRIX
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.2;
    this.gain.connect(this.ctx.destination);
  }

  private osc(f: number, type: OscillatorType, d: number, slide?: number) {
    if (!this.ctx || !this.gain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, this.ctx.currentTime + d);
    g.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
    o.connect(g); g.connect(this.gain);
    o.start(); o.stop(this.ctx.currentTime + d);
  }

  jump() { this.osc(300, 'square', 0.1, 600); } // Rising zap
  doubleJump() { this.osc(600, 'sawtooth', 0.15, 900); } // High zap
  score() { this.osc(1200, 'sine', 0.05); } // Ping
  
  crash() {
    if (!this.ctx || !this.gain) return;
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource();
    s.buffer = b;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    s.connect(g); g.connect(this.gain);
    s.start();
  }
}