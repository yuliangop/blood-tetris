class ZombieTetris {
    constructor() {
        this.renderer = new Renderer(
            document.getElementById('gameCanvas'),
            document.getElementById('holdCanvas'),
            document.getElementById('nextCanvas')
        );
        this.particles = new ParticleSystem();
        this.board = new GameBoard(this.renderer, this.particles, audio, storage);
        this.lastTime = 0;
        this.animId = null;

        this.setupInput();
        this.setupUI();
        this.renderPreviews();
        this.updateUI();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (this.board.gameOver) {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.restart();
                }
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.board.moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.board.moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.board.softDrop();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.board.rotate(1);
                    break;
                case ' ':
                    e.preventDefault();
                    this.board.hardDrop();
                    break;
                case 'c':
                case 'C':
                    e.preventDefault();
                    this.board.holdCurrentPiece();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'z':
                case 'Z':
                    e.preventDefault();
                    this.board.rotate(-1);
                    break;
            }
        });
    }

    setupUI() {
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());

        // Render history
        storage.renderHistory(document.getElementById('historyList'));
    }

    togglePause() {
        if (this.board.gameOver) return;
        this.board.paused = !this.board.paused;
        document.getElementById('pauseOverlay').classList.toggle('active', this.board.paused);
    }

    restart() {
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        document.getElementById('gameOverOverlay').classList.remove('active');
        document.getElementById('pauseOverlay').classList.remove('active');
        document.getElementById('newRecord').classList.remove('show');
        this.particles.clear();
        this.board.reset();
        this.renderPreviews();
        this.updateUI();
        this.lastTime = 0;
        this.run();
    }

    gameOver() {
        const overlay = document.getElementById('gameOverOverlay');
        document.getElementById('finalScore').textContent = this.board.score.toLocaleString();

        const result = storage.addScore(this.board.score, this.board.level, this.board.lines);
        const newRecordEl = document.getElementById('newRecord');
        if (result.isNewRecord) {
            newRecordEl.classList.add('show');
        } else {
            newRecordEl.classList.remove('show');
        }

        overlay.classList.add('active');
        storage.renderHistory(document.getElementById('historyList'));
        audio.play('gameover');

        // Fog particles effect
        this.spawnFogParticles();
    }

    spawnFogParticles() {
        const container = document.getElementById('fogParticles');
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const drop = document.createElement('div');
                drop.className = 'fog-drop';
                drop.style.left = Math.random() * 100 + '%';
                drop.style.animationDuration = (3 + Math.random() * 5) + 's';
                drop.style.width = (40 + Math.random() * 80) + 'px';
                container.appendChild(drop);
                setTimeout(() => drop.remove(), 6000);
            }, i * 250);
        }
    }

    renderPreviews() {
        this.board.renderPreviews();
    }

    updateUI() {
        document.getElementById('score').textContent = this.board.score.toLocaleString();
        document.getElementById('level').textContent = this.board.level;
        document.getElementById('lines').textContent = this.board.lines;
    }

    run() {
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            const delta = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (!this.board.gameOver && !this.board.paused) {
                this.board.update();
                this.board.render();
                this.renderPreviews();
                this.updateUI();
            }

            if (this.board.gameOver) {
                this.board.render();
                this.gameOver();
                // Continue rendering for particles
                this.particles.update();
                // Still render one more frame with particles
                this.board.renderer.renderFrame(
                    this.board.board,
                    null,
                    null,
                    this.particles,
                    this.board.holdPiece,
                    null
                );
                // Don't loop the full game update, just let it stay on game over
                this.animId = requestAnimationFrame(() => this.renderIdle());
                return;
            }

            this.animId = requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    renderIdle() {
        // Idle render for game over state (keeps particles animating)
        this.particles.update();
        this.board.renderer.renderFrame(
            this.board.board,
            null,
            null,
            this.particles,
            this.board.holdPiece,
            null
        );
        this.animId = requestAnimationFrame(() => this.renderIdle());
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new ZombieTetris();
    game.run();
});
