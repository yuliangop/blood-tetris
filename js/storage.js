class ScoreStorage {
    constructor() {
        this.key = 'bloodTetris_highScores';
        this.maxEntries = 10;
    }

    getScores() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    addScore(score, level, lines) {
        const scores = this.getScores();
        const entry = {
            score,
            level,
            lines,
            date: new Date().toISOString().split('T')[0],
        };
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, this.maxEntries);
        try {
            localStorage.setItem(this.key, JSON.stringify(trimmed));
        } catch {
            // storage full, ignore
        }
        return {
            rank: trimmed.findIndex(s => s.score === score && s.date === entry.date) + 1,
            isNewRecord: trimmed[0].score === score,
            scores: trimmed,
        };
    }

    getBestScore() {
        const scores = this.getScores();
        return scores.length > 0 ? scores[0].score : 0;
    }

    renderHistory(element) {
        const scores = this.getScores();
        if (scores.length === 0) {
            element.innerHTML = '<div class="history-item" style="color:#3a2020">等待献祭...</div>';
            return;
        }
        element.innerHTML = scores.slice(0, 7).map((s, i) => {
            const rankClass = i < 3 ? ` rank-${i + 1}` : '';
            return `<div class="history-item${rankClass}">
                <span>#${i + 1}</span>
                <span>${s.score.toLocaleString()}</span>
            </div>`;
        }).join('');
    }
}

const storage = new ScoreStorage();
