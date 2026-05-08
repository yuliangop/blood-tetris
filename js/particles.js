class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1;
        this.decay = 0.01 + Math.random() * 0.03;

        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2;

        if (type === 'blood') {
            this.size = 2 + Math.random() * 4;
            this.color = Math.random() < 0.5 ? '#cc0000' : '#8b0000';
            this.vy -= 3;
        } else if (type === 'spark') {
            this.size = 1 + Math.random() * 2;
            this.color = Math.random() < 0.5 ? '#ff4444' : '#ffaa00';
            this.vx *= 2;
            this.vy *= 2;
            this.decay = 0.02 + Math.random() * 0.04;
        } else if (type === 'bone') {
            this.size = 1 + Math.random() * 2;
            this.color = '#c4b5a0';
            this.vy -= 2;
        } else if (type === 'dark') {
            this.size = 0.5 + Math.random() * 1.5;
            this.color = '#220000';
            this.vy = -0.5 - Math.random();
            this.vx *= 0.3;
            this.decay = 0.003 + Math.random() * 0.005;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.type !== 'dark') {
            this.vy += 0.15; // gravity
        }
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.ambientParticles = [];
    }

    emit(x, y, count, type) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    emitLineClear(rowY, boardWidth, boardX, cellSize) {
        // Blood sprays upward from the cleared line
        const y = rowY + cellSize / 2;
        const count = Math.floor(boardWidth / cellSize) * 3;
        for (let i = 0; i < count; i++) {
            const x = boardX + Math.random() * boardWidth;
            this.particles.push(new Particle(x, y, 'blood'));
        }
        // Sparks
        for (let i = 0; i < count / 2; i++) {
            const x = boardX + Math.random() * boardWidth;
            this.particles.push(new Particle(x, y, 'spark'));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });

        // Ambient dark particles (always floating up in background)
        if (this.ambientParticles.length < 15 && Math.random() < 0.3) {
            this.ambientParticles.push(new Particle(
                Math.random() * 800, 700,
                'dark'
            ));
        }
        this.ambientParticles = this.ambientParticles.filter(p => {
            p.update();
            return !p.isDead() && p.y > -50;
        });
    }

    draw(ctx) {
        // Draw ambient particles first (behind everything)
        this.ambientParticles.forEach(p => p.draw(ctx));
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
        this.ambientParticles = [];
    }
}
