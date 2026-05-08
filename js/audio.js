class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initOnInteraction();
    }

    initOnInteraction() {
        const handler = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('keydown', handler, { once: true });
    }

    ensureCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    play(type) {
        if (!this.enabled) return;
        const ctx = this.ensureCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch (type) {
            case 'move':
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, t);
                gain.gain.setValueAtTime(0.06, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.start(t);
                osc.stop(t + 0.05);
                break;

            case 'rotate':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.linearRampToValueAtTime(600, t + 0.08);
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'drop':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'clear':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.setValueAtTime(1000, t + 0.05);
                osc.frequency.setValueAtTime(1200, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.setValueAtTime(0.1, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.start(t);
                osc.stop(t + 0.25);
                break;

            case 'tetris':
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.setValueAtTime(900, t + 0.06);
                osc.frequency.setValueAtTime(1200, t + 0.12);
                osc.frequency.setValueAtTime(1600, t + 0.18);
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(80, t);
                osc2.frequency.exponentialRampToValueAtTime(30, t + 0.3);
                gain2.gain.setValueAtTime(0.08, t);
                gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.start(t);
                osc.stop(t + 0.35);
                osc2.start(t);
                osc2.stop(t + 0.35);
                break;

            case 'gameover':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 1.5);
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
                osc.start(t);
                osc.stop(t + 1.5);
                break;

            case 'levelup':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, t);
                osc.frequency.setValueAtTime(500, t + 0.08);
                osc.frequency.setValueAtTime(700, t + 0.16);
                osc.frequency.setValueAtTime(1000, t + 0.24);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.start(t);
                osc.stop(t + 0.35);
                break;
        }
    }
}

const audio = new AudioEngine();
