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
}