const PIECE_TYPES = {
    I: {
        name: '高僵',
        shape: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0],
        ],
        color: '#6b8e5a',
        glow: '#a4c639',
        inner: '#3d5a2e',
        symbol: 'tall',
    },
    O: {
        name: '头',
        shape: [
            [1,1],
            [1,1],
        ],
        color: '#9eaf8b',
        glow: '#c5d5a8',
        inner: '#5a6b4a',
        symbol: 'head',
    },
    T: {
        name: '躯',
        shape: [
            [0,1,0],
            [1,1,1],
            [0,0,0],
        ],
        color: '#556b3f',
        glow: '#7a9a4e',
        inner: '#2d3a1f',
        symbol: 'torso',
    },
    S: {
        name: '臂',
        shape: [
            [0,1,1],
            [1,1,0],
            [0,0,0],
        ],
        color: '#718a50',
        glow: '#9ab86a',
        inner: '#4a5e30',
        symbol: 'armR',
    },
    Z: {
        name: '影臂',
        shape: [
            [1,1,0],
            [0,1,1],
            [0,0,0],
        ],
        color: '#5a7040',
        glow: '#7d9a55',
        inner: '#334020',
        symbol: 'armL',
    },
    J: {
        name: '腿',
        shape: [
            [1,0,0],
            [1,1,1],
            [0,0,0],
        ],
        color: '#6d5c3d',
        glow: '#9e8a5a',
        inner: '#3d3020',
        symbol: 'legR',
    },
    L: {
        name: '影腿',
        shape: [
            [0,0,1],
            [1,1,1],
            [0,0,0],
        ],
        color: '#5a4a30',
        glow: '#8a7048',
        inner: '#302818',
        symbol: 'legL',
    },
};

const PIECE_NAMES = Object.keys(PIECE_TYPES);

const SYMBOL_DRAW = {
    tall: (ctx, x, y, s) => {
        // Two glowing red eyes
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(x + s*0.65, y + s*0.35, s*0.08, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s*0.65, y + s*0.6, s*0.08, 0, Math.PI*2);
        ctx.fill();
    },
    head: (ctx, x, y, s) => {
        // Zombie face with glowing eyes and open mouth
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(x + s*0.35, y + s*0.35, s*0.1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s*0.65, y + s*0.35, s*0.1, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x + s*0.35, y + s*0.35, s*0.04, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s*0.65, y + s*0.35, s*0.04, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.ellipse(x + s*0.5, y + s*0.7, s*0.2, s*0.1, 0, 0, Math.PI*2);
        ctx.fill();
    },
    torso: (ctx, x, y, s) => {
        // Ribcage bones
        ctx.strokeStyle = '#ccc8b0';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + s*0.25, y + s*0.3 + i*s*0.15);
            ctx.lineTo(x + s*0.75, y + s*0.3 + i*s*0.15);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x + s*0.5, y + s*0.2);
        ctx.lineTo(x + s*0.5, y + s*0.8);
        ctx.stroke();
    },
    armR: (ctx, x, y, s) => {
        ctx.strokeStyle = '#bbb090';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + s*0.3, y + s*0.4);
        ctx.lineTo(x + s*0.7, y + s*0.7);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + s*0.7, y + s*0.7);
            ctx.lineTo(x + s*0.75 + i*s*0.06, y + s*0.85);
            ctx.stroke();
        }
    },
    armL: (ctx, x, y, s) => {
        ctx.strokeStyle = '#aaa080';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + s*0.7, y + s*0.4);
        ctx.lineTo(x + s*0.3, y + s*0.7);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + s*0.3, y + s*0.7);
            ctx.lineTo(x + s*0.2 + i*s*0.06, y + s*0.85);
            ctx.stroke();
        }
    },
    legR: (ctx, x, y, s) => {
        ctx.fillStyle = '#ccc8b0';
        ctx.fillRect(x + s*0.35, y + s*0.25, s*0.3, s*0.5);
        ctx.fillStyle = '#332211';
        ctx.fillRect(x + s*0.35, y + s*0.75, s*0.3, s*0.15);
    },
    legL: (ctx, x, y, s) => {
        ctx.fillStyle = '#bbb8a0';
        ctx.fillRect(x + s*0.35, y + s*0.25, s*0.3, s*0.5);
        ctx.fillStyle = '#222211';
        ctx.fillRect(x + s*0.35, y + s*0.75, s*0.3, s*0.15);
    },
};

class PieceGenerator {
    constructor() {
        this.bag = [];
    }

    next() {
        if (this.bag.length === 0) {
            this.bag = [...PIECE_NAMES];
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        return this.bag.pop();
    }

    reset() {
        this.bag = [];
    }
}
