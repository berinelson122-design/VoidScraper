export class SoundManager {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor() {
    // Initialize Web Audio API
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Volume 30%
    this.masterGain.connect(this.ctx.destination);
  }

  playJump() {
    this.playTone(400, 'square', 0.1, 600); // Rising pitch (Jump)
  }

  playDoubleJump() {
    this.playTone(600, 'sawtooth', 0.1, 800); // Higher pitch (Boost)
  }

  playScore() {
    this.playTone(1000, 'sine', 0.05, 1000); // High ping (Coin)
  }

  playCrash() {
    // Noise burst logic for crash
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  private playTone(freq: number, type: OscillatorType, duration: number, endFreq?: number) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}