export class AudioEngine {
    private ctx: AudioContext;
    private masterGain: GainNode;

    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.2;
        this.masterGain.connect(this.ctx.destination);
    }

    private playTone(freq: number, type: OscillatorType, dur: number, ramp: number = 0.01) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(ramp, this.ctx.currentTime + dur);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    playJump() { this.playTone(400, 'square', 0.1, 800); }
    playCrash() { this.playTone(100, 'sawtooth', 0.5, 10); }
    playScore() { this.playTone(880, 'sine', 0.05, 880); }
    playSelect() { this.playTone(600, 'triangle', 0.08, 900); }
    playStart() { this.playTone(300, 'sawtooth', 0.3, 1200); }

    // ===== POWER-UP SYSTEM FEATURE START =====
    playPowerUp() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            g.gain.setValueAtTime(0.18, now + i * 0.06);
            g.gain.linearRampToValueAtTime(0, now + i * 0.06 + 0.12);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.12);
        });
    }

    playShieldBreak() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        g.gain.setValueAtTime(0.25, now);
        g.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playBoost() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        g.gain.setValueAtTime(0.2, now);
        g.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    // ===== POWER-UP SYSTEM FEATURE END =====
}