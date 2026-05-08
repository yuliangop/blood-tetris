class Renderer {
    constructor(gameCanvas, holdCanvas, nextCanvas) {
        this.canvas = gameCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.holdCanvas = holdCanvas;
        this.holdCtx = holdCanvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');

        this.cellSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.boardWidth = this.cols * this.cellSize;
        this.boardHeight = this.rows * this.cellSize;

        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;

        this.animFrame = 0;
        this.lineClearAnim = []; // { row, progress, delay }
        this.scorePopups = [];
    }

    getBoardX() { return 0; }
    getBoardY() { return 0; }

    drawBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = '#060804';
        ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

        // Grid lines — graveyard earth tones
        ctx.strokeStyle = 'rgba(40,50,20,0.4)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.boardHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.boardWidth, y * this.cellSize);
            ctx.stroke();
        }

        // Subtle green glow at bottom (graveyard mist)
        const gradient = ctx.createLinearGradient(0, this.boardHeight - 40, 0, this.boardHeight);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(74,107,42,0.06)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, this.boardHeight - 40, this.boardWidth, 40);
    }

    drawCell(ctx, col, row, color, glowColor, innerColor, alpha = 1) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const s = this.cellSize;
        const padding = 1;

        ctx.globalAlpha = alpha;

        // Outer glow
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
        }

        // Main cell with gradient
        const grad = ctx.createLinearGradient(x, y, x, y + s);
        grad.addColorStop(0, glowColor || color);
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, innerColor || color);
        ctx.fillStyle = grad;
        ctx.fillRect(x + padding, y + padding, s - padding * 2, s - padding * 2);

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + padding + 2, y + padding, s - padding * 2 - 4, s * 0.4);

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + padding, y + padding, s - padding * 2, s - padding * 2);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    drawBoard(board) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = board[row][col];
                if (cell) {
                    const piece = PIECE_TYPES[cell];
                    this.drawCell(
                        this.ctx, col, row,
                        piece.color, piece.glow, piece.inner
                    );
                    // Draw symbol
                    SYMBOL_DRAW[piece.symbol](
                        this.ctx,
                        col * this.cellSize,
                        row * this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }

    drawGhostPiece(piece, ghostRow) {
        if (!piece || ghostRow === null) return;
        const p = PIECE_TYPES[piece.type];
        const shape = piece.getShape();

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = ghostRow + r;
                    const boardCol = piece.col + c;
                    if (boardRow >= 0 && boardRow < this.rows &&
                        boardCol >= 0 && boardCol < this.cols) {
                        const x = boardCol * this.cellSize;
                        const y = boardRow * this.cellSize;
                        const s = this.cellSize;
                        this.ctx.globalAlpha = 0.2;
                        this.ctx.strokeStyle = p.glow;
                        this.ctx.lineWidth = 1.5;
                        this.ctx.setLineDash([3, 3]);
                        this.ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
                        this.ctx.setLineDash([]);
                        this.ctx.globalAlpha = 1;
                    }
                }
            }
        }
    }

    drawActivePiece(piece) {
        if (!piece) return;
        const p = PIECE_TYPES[piece.type];
        const shape = piece.getShape();

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = piece.row + r;
                    const boardCol = piece.col + c;
                    if (boardRow >= 0 && boardRow < this.rows &&
                        boardCol >= 0 && boardCol < this.cols) {
                        this.drawCell(
                            this.ctx, boardCol, boardRow,
                            p.color, p.glow, p.inner
                        );
                        SYMBOL_DRAW[p.symbol](
                            this.ctx,
                            boardCol * this.cellSize,
                            boardRow * this.cellSize,
                            this.cellSize
                        );
                    }
                }
            }
        }
    }

    drawLineClearAnim() {
        for (const anim of this.lineClearAnim) {
            const progress = anim.progress;
            const y = anim.row * this.cellSize;
            const s = this.cellSize;

            // Flash white then fade to toxic green
            if (progress < 0.3) {
                const alpha = progress / 0.3;
                this.ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
                this.ctx.fillRect(0, y, this.boardWidth, s);
            } else if (progress < 0.7) {
                const alpha = 1 - (progress - 0.3) / 0.4;
                this.ctx.fillStyle = `rgba(120,180,40,${alpha * 0.7})`;
                this.ctx.fillRect(0, y, this.boardWidth, s);
            }
        }
    }

    drawScorePopups() {
        for (const popup of this.scorePopups) {
            const alpha = Math.max(0, 1 - popup.age / popup.maxAge);
            const yOffset = -popup.age * 1.5;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = 'bold 16px "MedievalSharp", "Noto Sans SC"';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(
                popup.text,
                popup.x * this.cellSize + this.cellSize / 2,
                popup.y * this.cellSize + yOffset
            );
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
            this.ctx.textAlign = 'start';
        }
    }

    addScorePopup(text, col, row) {
        this.scorePopups.push({
            text, x: col, y: row,
            age: 0, maxAge: 60,
        });
    }

    updateScorePopups() {
        this.scorePopups = this.scorePopups.filter(p => {
            p.age++;
            return p.age < p.maxAge;
        });
    }

    updateLineClearAnims() {
        const completed = [];
        this.lineClearAnim.forEach((anim, i) => {
            anim.progress += 0.04;
            anim.delay--;
            if (anim.delay > 0) anim.progress = 0;
            if (anim.progress >= 1) completed.push(i);
        });
        // Remove completed in reverse order
        for (let i = completed.length - 1; i >= 0; i--) {
            this.lineClearAnim.splice(completed[i], 1);
        }
    }

    addLineClearAnims(rows) {
        rows.forEach((row, i) => {
            this.lineClearAnim.push({ row, progress: 0, delay: i * 6 });
        });
    }

    drawPreviewPiece(ctx, type, canvasW, canvasH) {
        if (!type || !PIECE_TYPES[type]) return;

        const p = PIECE_TYPES[type];
        const shape = p.shape;
        const cellPreviewSize = 22;

        // Calculate bounds of the shape
        let minR = shape.length, maxR = 0, minC = shape[0].length, maxC = 0;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                    minC = Math.min(minC, c);
                    maxC = Math.max(maxC, c);
                }
            }
        }

        const pieceW = (maxC - minC + 1) * cellPreviewSize;
        const pieceH = (maxR - minR + 1) * cellPreviewSize;
        const offsetX = (canvasW - pieceW) / 2;
        const offsetY = (canvasH - pieceH) / 2;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (shape[r][c]) {
                    const x = offsetX + (c - minC) * cellPreviewSize;
                    const y = offsetY + (r - minR) * cellPreviewSize;
                    const s = cellPreviewSize;

                    const grad = ctx.createLinearGradient(x, y, x, y + s);
                    grad.addColorStop(0, p.glow);
                    grad.addColorStop(0.4, p.color);
                    grad.addColorStop(1, p.inner);
                    ctx.fillStyle = grad;
                    ctx.shadowColor = p.glow;
                    ctx.shadowBlur = 5;
                    ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;

                    // Inner highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.06)';
                    ctx.fillRect(x + 3, y + 1, s - 6, s * 0.3);

                    SYMBOL_DRAW[p.symbol](ctx, x, y, s);
                }
            }
        }
    }

    drawHold() {
        const ctx = this.holdCtx;
        const w = this.holdCanvas.width;
        const h = this.holdCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(5,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);
    }

    renderHold(type) {
        this.drawHold();
        if (type) {
            this.drawPreviewPiece(this.holdCtx, type, 120, 100);
        }
    }

    drawNext() {
        const ctx = this.nextCtx;
        const w = this.nextCanvas.width;
        const h = this.nextCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(5,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);
    }

    renderNext(type) {
        this.drawNext();
        if (type) {
            this.drawPreviewPiece(this.nextCtx, type, 120, 100);
        }
    }

    renderFrame(board, activePiece, ghostRow, particles, holdType, nextType) {
        this.animFrame++;
        this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

        this.drawBackground();

        // Ambient dark particles behind board
        particles.draw(this.ctx);

        this.drawBoard(board);
        this.drawGhostPiece(activePiece, ghostRow);
        this.drawActivePiece(activePiece);
        this.drawLineClearAnim();
        this.drawScorePopups();

        this.updateLineClearAnims();
        this.updateScorePopups();
        particles.update();
    }

    screenShake(intensity) {
        // Apply a CSS transform shake to the canvas wrapper
        const wrapper = this.canvas.parentElement;
        const duration = 300;
        const startTime = performance.now();

        const shake = (time) => {
            const elapsed = time - startTime;
            if (elapsed >= duration) {
                wrapper.style.transform = '';
                return;
            }
            const decay = 1 - elapsed / duration;
            const x = (Math.random() - 0.5) * intensity * decay;
            const y = (Math.random() - 0.5) * intensity * decay;
            wrapper.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };
        requestAnimationFrame(shake);
    }
}
