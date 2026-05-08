class AudioEngine {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.initOnInteraction();
    }

    initOnInteraction() {
        const handler = () => {
            // Preload all sounds on first interaction
            if (Object.keys(this.sounds).length === 0) {
                this.preload('move', 'sounds/move.wav');
                this.preload('rotate', 'sounds/rotate.wav');
                this.preload('drop', 'sounds/drop.wav');
                this.preload('clear', 'sounds/clear.wav');
                this.preload('tetris', 'sounds/tetris.wav');
                this.preload('gameover', 'sounds/gameover.wav');
                this.preload('levelup', 'sounds/levelup.wav');
                this.preload('ghost', 'sounds/ghost.wav');
            }
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('keydown', handler, { once: true });
    }

    preload(name, src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        this.sounds[name] = audio;
    }

    play(type) {
        if (!this.enabled) return;
        const sound = this.sounds[type];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
}

const audio = new AudioEngine();
