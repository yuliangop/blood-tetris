const PIECE_TYPES = {
    I: {
        name: '骨',
        shape: [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0],
        ],
        color: '#d4c8b0',
        glow: '#ffe8c0',
        inner: '#b8a88a',
        symbol: 'bone',
    },
    O: {
        name: '眼',
        shape: [
            [1,1],
            [1,1],
        ],
        color: '#9b30ff',
        glow: '#cc66ff',
        inner: '#6a10cc',
        symbol: 'eye',
    },
    T: {
        name: '印',
        shape: [
            [0,1,0],
            [1,1,1],
            [0,0,0],
        ],
        color: '#cc0044',
        glow: '#ff2266',
        inner: '#880022',
        symbol: 'rune',
    },
    S: {
        name: '血',
        shape: [
            [0,1,1],
            [1,1,0],
            [0,0,0],
        ],
        color: '#dd1111',
        glow: '#ff4444',
        inner: '#990000',
        symbol: 'blood',
    },
    Z: {
        name: '影',
        shape: [
            [1,1,0],
            [0,1,1],
            [0,0,0],
        ],
        color: '#662288',
        glow: '#9944cc',
        inner: '#331155',
        symbol: 'shadow',
    },
    J: {
        name: '牙',
        shape: [
            [1,0,0],
            [1,1,1],
            [0,0,0],
        ],
        color: '#ff3355',
        glow: '#ff6688',
        inner: '#aa1122',
        symbol: 'fang',
    },
    L: {
        name: '爪',
        shape: [
            [0,0,1],
            [1,1,1],
            [0,0,0],
        ],
        color: '#ff5511',
        glow: '#ff8855',
        inner: '#aa3300',
        symbol: 'claw',
    },
};

const PIECE_NAMES = Object.keys(PIECE_TYPES);

// Each piece type has a unique inner pattern drawn in its cells
const SYMBOL_DRAW = {
    bone: (ctx, x, y, s) => {
        ctx.fillStyle = '#b8a88a';
        ctx.fillRect(x + s*0.3, y + s*0.4, s*0.4, s*0.2);
        ctx.fillRect(x + s*0.4, y + s*0.25, s*0.2, s*0.5);
    },
    eye: (ctx, x, y, s) => {
        ctx.fillStyle = '#1a0022';
        ctx.beginPath();
        ctx.ellipse(x + s*0.5, y + s*0.45, s*0.25, s*0.35, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.ellipse(x + s*0.5, y + s*0.42, s*0.1, s*0.12, 0, 0, Math.PI*2);
        ctx.fill();
    },
    rune: (ctx, x, y, s) => {
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + s*0.5, y + s*0.2);
        ctx.lineTo(x + s*0.5, y + s*0.8);
        ctx.moveTo(x + s*0.3, y + s*0.4);
        ctx.lineTo(x + s*0.7, y + s*0.4);
        ctx.stroke();
    },
    blood: (ctx, x, y, s) => {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + s*0.5, y + s*0.5, s*0.15, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s*0.5, y + s*0.6, s*0.1, 0, Math.PI);
        ctx.fill();
    },
    shadow: (ctx, x, y, s) => {
        ctx.fillStyle = 'rgba(200,150,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(x + s*0.5, y + s*0.15);
        ctx.lineTo(x + s*0.8, y + s*0.85);
        ctx.lineTo(x + s*0.2, y + s*0.85);
        ctx.fill();
    },
    fang: (ctx, x, y, s) => {
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.moveTo(x + s*0.5, y + s*0.2);
        ctx.lineTo(x + s*0.65, y + s*0.85);
        ctx.lineTo(x + s*0.35, y + s*0.85);
        ctx.fill();
    },
    claw: (ctx, x, y, s) => {
        ctx.strokeStyle = '#ffaa66';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + s*0.5, y + s*0.4, s*0.3, Math.PI*0.3, Math.PI*0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s*0.5, y + s*0.6);
        ctx.lineTo(x + s*0.35, y + s*0.85);
        ctx.moveTo(x + s*0.5, y + s*0.6);
        ctx.lineTo(x + s*0.65, y + s*0.85);
        ctx.stroke();
    },
};

class PieceGenerator {
    constructor() {
        this.bag = [];
    }

    next() {
        if (this.bag.length === 0) {
            this.bag = [...PIECE_NAMES];
            // Fisher-Yates shuffle
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
