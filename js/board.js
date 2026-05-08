class GameBoard {
    constructor(renderer, particles, audio, storage) {
        this.renderer = renderer;
        this.particles = particles;
        this.audio = audio;
        this.storage = storage;
        this.rows = 20;
        this.cols = 10;
        this.board = [];
        this.generator = new PieceGenerator();
        this.reset();
    }

    reset() {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.generator.reset();
        this.dropTimer = 0;
        this.lockDelay = 0;
        this.lockDelayMax = 30;
        this.lockMoves = 0;
        this.lockMovesMax = 15;
        this.combo = -1;
        this.flashTimer = 0;
        this.clearingLines = false;
        this.linesToClear = [];
    }

    getDropInterval() {
        // Starts at 800ms, gets faster with level
        return Math.max(50, 800 - (this.level - 1) * 55);
    }

    spawnPiece() {
        if (this.nextPiece === null) {
            this.nextPiece = new ActivePiece(this.generator.next());
        }
        const type = this.nextPiece.type;
        this.nextPiece = new ActivePiece(this.generator.next());

        this.currentPiece = new ActivePiece(type);
        this.canHold = true;
        this.lockDelay = 0;
        this.lockMoves = 0;

        // Check if spawn position is valid
        if (!this.isValidPosition(this.currentPiece)) {
            this.gameOver = true;
            return false;
        }
        return true;
    }

    isValidPosition(piece) {
        const shape = this.getShapeForRotation(piece);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = piece.row + r;
                    const boardCol = piece.col + c;
                    // Out of bounds horizontally or below the board
                    if (boardCol < 0 || boardCol >= this.cols || boardRow >= this.rows) {
                        return false;
                    }
                    // Allow cells above the board (negative row) — they just aren't checked for collision
                    if (boardRow >= 0 && this.board[boardRow][boardCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    getGhostRow() {
        if (!this.currentPiece) return null;
        let ghost = { ...this.currentPiece, row: this.currentPiece.row };
        while (this.isValidPosition({ ...ghost, row: ghost.row + 1 })) {
            ghost.row++;
        }
        return ghost.row;
    }

    lockPiece() {
        const piece = this.currentPiece;
        const shape = piece.getShape();
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = piece.row + r;
                    const boardCol = piece.col + c;
                    if (boardRow >= 0 && boardRow < this.rows &&
                        boardCol >= 0 && boardCol < this.cols) {
                        this.board[boardRow][boardCol] = piece.type;
                    }
                }
            }
        }

        // Game over if any locked cell is still above the visible area
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] && piece.row + r < 0) {
                    this.gameOver = true;
                    return;
                }
            }
        }

        this.checkLines();
        this.audio.play('drop');
    }

    checkLines() {
        const fullRows = [];
        for (let row = 0; row < this.rows; row++) {
            if (this.board[row].every(cell => cell !== null)) {
                fullRows.push(row);
            }
        }

        if (fullRows.length === 0) {
            this.combo = -1;
            this.spawnPiece();
            return;
        }

        this.combo++;
        this.linesToClear = fullRows;
        this.clearingLines = true;

        // Emit particles for each cleared row
        const cellSize = this.renderer.cellSize;
        fullRows.forEach(row => {
            this.particles.emitLineClear(
                row * cellSize,
                this.cols * cellSize,
                0,
                cellSize
            );
        });

        // Add line clear animations
        this.renderer.addLineClearAnims(fullRows);

        // Scoring
        const basePoints = [0, 100, 300, 500, 800];
        const linesCleared = fullRows.length;
        this.score += basePoints[linesCleared] * this.level;
        this.lines += linesCleared;

        // Screen shake for Tetris
        if (linesCleared === 4) {
            this.renderer.screenShake(8);
            this.audio.play('tetris');
        } else {
            this.audio.play('clear');
        }

        // Add combo bonus
        if (this.combo > 0) {
            this.score += 50 * this.combo * this.level;
        }

        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.audio.play('levelup');
        }

        // Score popup
        if (this.currentPiece) {
            const popupTexts = { 1: '血祭', 2: '双杀', 3: '三杀', 4: '湮灭!' };
            this.renderer.addScorePopup(
                popupTexts[linesCleared],
                Math.floor(this.cols / 2),
                fullRows[Math.floor(fullRows.length / 2)]
            );
        }

        // Delay line removal for animation
        setTimeout(() => {
            this.removeLines(fullRows);
            this.clearingLines = false;
            this.linesToClear = [];
            this.spawnPiece();
        }, linesCleared === 4 ? 400 : 250);
    }

    removeLines(rows) {
        // Remove from bottom to top for correct indices
        const sorted = [...rows].sort((a, b) => b - a);
        for (const row of sorted) {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.cols).fill(null));
        }
    }

    moveLeft() {
        if (!this.currentPiece || this.gameOver || this.paused || this.clearingLines) return;
        const test = { ...this.currentPiece, col: this.currentPiece.col - 1 };
        if (this.isValidPosition(test)) {
            this.currentPiece.col = test.col;
            this.audio.play('move');
            this.resetLockIfOnGround();
        }
    }

    moveRight() {
        if (!this.currentPiece || this.gameOver || this.paused || this.clearingLines) return;
        const test = { ...this.currentPiece, col: this.currentPiece.col + 1 };
        if (this.isValidPosition(test)) {
            this.currentPiece.col = test.col;
            this.audio.play('move');
            this.resetLockIfOnGround();
        }
    }

    softDrop() {
        if (!this.currentPiece || this.gameOver || this.paused || this.clearingLines) return;
        const test = { ...this.currentPiece, row: this.currentPiece.row + 1 };
        if (this.isValidPosition(test)) {
            this.currentPiece.row = test.row;
            this.score += 1;
        }
    }

    hardDrop() {
        if (!this.currentPiece || this.gameOver || this.paused || this.clearingLines) return;
        const ghostRow = this.getGhostRow();
        if (ghostRow !== null) {
            const distance = ghostRow - this.currentPiece.row;
            this.score += distance * 2;
            this.currentPiece.row = ghostRow;
            this.lockPiece();
        }
    }

    rotate(dir = 1) {
        if (!this.currentPiece || this.gameOver || this.paused || this.clearingLines) return;
        const piece = this.currentPiece;
        const shape = piece.getShape();
        const n = shape.length;

        // Rotate matrix
        const rotated = Array.from({ length: n }, () => Array(n).fill(0));
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (dir === 1) {
                    rotated[c][n - 1 - r] = shape[r][c];
                } else {
                    rotated[n - 1 - c][r] = shape[r][c];
                }
            }
        }

        // SRS wall kicks - try offsets
        const kicks = [
            { col: 0, row: 0 },
            { col: 1, row: 0 },
            { col: -1, row: 0 },
            { col: 0, row: -1 },
            { col: 2, row: 0 },
            { col: -2, row: 0 },
            { col: 0, row: -2 },
        ];

        const testPiece = { ...piece, rotation: (piece.rotation + dir + 4) % 4 };
        const origShape = piece.getShape();

        for (const kick of kicks) {
            testPiece.col = piece.col + kick.col;
            testPiece.row = piece.row - kick.row;
            const testShape = this.getShapeForRotation(testPiece);
            if (this.isValidPositionWithShape(testPiece, rotated)) {
                piece.rotation = testPiece.rotation;
                piece.col = testPiece.col;
                piece.row = testPiece.row;
                this.audio.play('rotate');
                this.resetLockIfOnGround();
                return;
            }
        }
    }

    getShapeForRotation(piece) {
        // Build shape from rotation index
        const origShape = PIECE_TYPES[piece.type].shape;
        let shape = origShape.map(r => [...r]);
        for (let i = 0; i < piece.rotation; i++) {
            const n = shape.length;
            const next = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    next[c][n - 1 - r] = shape[r][c];
                }
            }
            shape = next;
        }
        return shape;
    }

    isValidPositionWithShape(piece, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = piece.row + r;
                    const boardCol = piece.col + c;
                    if (boardCol < 0 || boardCol >= this.cols || boardRow >= this.rows) {
                        return false;
                    }
                    if (boardRow >= 0 && this.board[boardRow][boardCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    resetLockIfOnGround() {
        if (!this.isValidPosition({ ...this.currentPiece, row: this.currentPiece.row + 1 })) {
            if (this.lockMoves < this.lockMovesMax) {
                this.lockMoves++;
                this.lockDelay = 0;
            }
        }
    }

    holdCurrentPiece() {
        if (!this.currentPiece || !this.canHold || this.gameOver || this.paused || this.clearingLines) return;

        const type = this.currentPiece.type;
        if (this.holdPiece) {
            const holdType = this.holdPiece;
            this.holdPiece = type;
            this.currentPiece = new ActivePiece(holdType);
        } else {
            this.holdPiece = type;
            this.spawnPiece();
        }
        this.canHold = false;
        this.renderer.renderHold(this.holdPiece);
    }

    update() {
        if (this.gameOver || this.paused || this.clearingLines) return;

        if (!this.currentPiece) {
            this.spawnPiece();
            this.dropTimer = 0;
            return;
        }

        this.dropTimer++;

        const interval = this.getDropInterval();
        const framesPerDrop = Math.floor(interval / 16.67);

        if (this.dropTimer >= framesPerDrop) {
            this.dropTimer = 0;
            const test = { ...this.currentPiece, row: this.currentPiece.row + 1 };
            if (this.isValidPosition(test)) {
                this.currentPiece.row = test.row;
                this.lockDelay = 0;
            } else {
                this.lockDelay++;
                if (this.lockDelay >= this.lockDelayMax) {
                    this.lockPiece();
                    this.lockDelay = 0;
                }
            }
        }
    }

    render() {
        this.renderer.renderFrame(
            this.board,
            this.currentPiece,
            this.getGhostRow(),
            this.particles,
            this.holdPiece,
            this.nextPiece ? this.nextPiece.type : null,
        );
    }

    renderPreviews() {
        this.renderer.renderHold(this.holdPiece);
        this.renderer.renderNext(this.nextPiece ? this.nextPiece.type : null);
    }
}

class ActivePiece {
    constructor(type) {
        this.type = type;
        this.rotation = 0;
        const shape = PIECE_TYPES[type].shape;
        this.col = Math.floor((10 - shape[0].length) / 2);
        this.row = -1;
    }

    getShape() {
        let shape = PIECE_TYPES[this.type].shape.map(r => [...r]);
        for (let i = 0; i < this.rotation; i++) {
            const n = shape.length;
            const next = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    next[c][n - 1 - r] = shape[r][c];
                }
            }
            shape = next;
        }
        return shape;
    }
}
