// ============================================================================
// NEON STATION // ARCADE OS - TETRIS · SNAKE · TURBO RACER 2D
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const gameTitleEl = document.getElementById('gameTitle');
const gameDescEl = document.getElementById('gameDesc');
const scoreValueEl = document.getElementById('scoreValue');
const highScoreValueEl = document.getElementById('highScoreValue');
const metaLabel1El = document.getElementById('metaLabel1');
const metaValue1El = document.getElementById('metaValue1');
const metaLabel2El = document.getElementById('metaLabel2');
const metaValue2El = document.getElementById('metaValue2');

const tetrisExtrasEl = document.getElementById('tetrisExtras');
const snakeExtrasEl = document.getElementById('snakeExtras');
const racerExtrasEl = document.getElementById('racerExtras');
const snakeWallsToggle = document.getElementById('snakeWallsToggle');

const nitroPercentEl = document.getElementById('nitroPercent');
const nitroBarEl = document.getElementById('nitroBar');
const shieldPercentEl = document.getElementById('shieldPercent');
const shieldBarEl = document.getElementById('shieldBar');

const startPauseBtn = document.getElementById('startPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const canvasOverlay = document.getElementById('canvasOverlay');
const overlayBadge = document.getElementById('overlayBadge');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const overlayActionBtn = document.getElementById('overlayActionBtn');
const controlsListEl = document.getElementById('controlsList');

const bestTetrisEl = document.getElementById('bestTetris');
const bestSnakeEl = document.getElementById('bestSnake');
const bestRacerEl = document.getElementById('bestRacer');
const soundToggleBtn = document.getElementById('soundToggle');
const soundIconEl = document.getElementById('soundIcon');

// ============================================================================
// SINTETIZADOR DE SONIDO RETRO (Web Audio API)
// ============================================================================
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tone(freq, type = 'square', duration = 0.08, vol = 0.12, slideTo = null) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  move() { this.tone(240, 'triangle', 0.04, 0.08); }
  rotate() { this.tone(380, 'sine', 0.07, 0.12, 520); }
  drop() { this.tone(160, 'square', 0.09, 0.14, 75); }
  clear() {
    this.tone(440, 'square', 0.08, 0.12);
    setTimeout(() => this.tone(554, 'square', 0.08, 0.12), 60);
    setTimeout(() => this.tone(659, 'square', 0.12, 0.14), 120);
    setTimeout(() => this.tone(880, 'square', 0.2, 0.15), 180);
  }
  eat() { this.tone(520, 'sine', 0.09, 0.14, 780); }
  bonus() {
    this.tone(587, 'triangle', 0.08, 0.15);
    setTimeout(() => this.tone(880, 'triangle', 0.16, 0.16), 70);
  }
  crash() { this.tone(120, 'sawtooth', 0.28, 0.2, 40); }
  gameOver() {
    this.tone(300, 'sawtooth', 0.18, 0.15, 220);
    setTimeout(() => this.tone(210, 'sawtooth', 0.35, 0.16, 95), 180);
  }
}

const sfx = new SoundFX();

soundToggleBtn.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  soundIconEl.textContent = sfx.enabled ? '🔊' : '🔇';
  soundToggleBtn.querySelector('.btn-label').textContent = sfx.enabled ? 'SFX ON' : 'SFX OFF';
});

// ============================================================================
// GESTIÓN DE RÉCORDS Y CONFIGURACIÓN DE JUEGOS
// ============================================================================
const STORAGE_KEYS = {
  tetris: 'neon_arcade_best_tetris',
  snake: 'neon_arcade_best_snake',
  racer: 'neon_arcade_best_racer'
};

function getHighScore(gameKey) {
  return parseInt(localStorage.getItem(STORAGE_KEYS[gameKey]) || '0', 10);
}

function setHighScore(gameKey, score) {
  const current = getHighScore(gameKey);
  if (score > current) {
    localStorage.setItem(STORAGE_KEYS[gameKey], String(score));
  }
  updateLeaderboardUI();
}

function updateLeaderboardUI() {
  bestTetrisEl.textContent = getHighScore('tetris').toLocaleString();
  bestSnakeEl.textContent = getHighScore('snake').toLocaleString();
  bestRacerEl.textContent = getHighScore('racer').toLocaleString();
}

const GAME_META = {
  tetris: {
    title: 'TETRIS // CYBER BLOCKS',
    desc: 'Encaja los tetrominós, usa la pieza en reserva y encadena líneas para multiplicar tu puntuación.',
    meta1: 'NIVEL',
    meta2: 'LÍNEAS',
    controls: [
      ['← → / A D', 'Mover pieza'],
      ['↑ / W', 'Rotar pieza'],
      ['↓ / S', 'Caída suave (+1 pt)'],
      ['ESPACIO', 'Caída instantánea'],
      ['C / SHIFT', 'Guardar pieza en reserva'],
      ['P', 'Pausar / Reanudar']
    ]
  },
  snake: {
    title: 'SNAKE // NEON VIPER',
    desc: 'Recoge manzanas cibernéticas y estrellas doradas antes de que se agote su tiempo sin morder tu propia cola.',
    meta1: 'VELOCIDAD',
    meta2: 'LONGITUD',
    controls: [
      ['← ↑ ↓ →', 'Cambiar dirección'],
      ['W A S D', 'Control alternativo'],
      ['ESPACIO', 'Turbo sprint temporal'],
      ['P', 'Pausar / Reanudar']
    ]
  },
  racer: {
    title: 'TURBO 2D // HIGHWAY DRIFT',
    desc: 'Esquiva el tráfico a toda velocidad, realiza adelantamientos al límite, recoge monedas y activa el Nitro Boost.',
    meta1: 'VELOCIDAD',
    meta2: 'DISTANCIA',
    controls: [
      ['← → / A D', 'Cambiar de carril / Girar'],
      ['↑ ↓ / W S', 'Acelerar / Frenar'],
      ['ESPACIO / SHIFT', 'Activar NITRO BOOST'],
      ['P', 'Pausar / Reanudar']
    ]
  }
};

// ============================================================================
// JUEGO 1: TETRIS (CYBER BLOCKS)
// ============================================================================
class TetrisGame {
  constructor() {
    this.cols = 10;
    this.rows = 20;
    this.cellSize = 30;
    this.offsetX = 60;
    this.offsetY = 20;

    this.shapes = {
      I: { matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f0ff' },
      O: { matrix: [[1,1],[1,1]], color: '#ffbe0b' },
      T: { matrix: [[0,1,0],[1,1,1],[0,0,0]], color: '#b5179e' },
      S: { matrix: [[0,1,1],[1,1,0],[0,0,0]], color: '#00f59b' },
      Z: { matrix: [[1,1,0],[0,1,1],[0,0,0]], color: '#ff2a85' },
      J: { matrix: [[1,0,0],[1,1,1],[0,0,0]], color: '#3a86ff' },
      L: { matrix: [[0,0,1],[1,1,1],[0,0,0]], color: '#fb5607' }
    };

    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.bag = [];
    this.holdKey = null;
    this.canHold = true;
    this.dropCounter = 0;
    this.dropInterval = 850;
    this.particles = [];
    this.gameOver = false;

    this.nextKey = this.drawFromBag();
    this.spawnPiece();
    this.drawMiniCanvases();
    this.syncUI();
  }

  drawFromBag() {
    if (this.bag.length === 0) {
      this.bag = Object.keys(this.shapes);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  spawnPiece(forcedKey = null) {
    const key = forcedKey || this.nextKey;
    if (!forcedKey) {
      this.nextKey = this.drawFromBag();
    }
    const def = this.shapes[key];
    this.piece = {
      key,
      matrix: def.matrix.map(r => [...r]),
      color: def.color,
      x: Math.floor((this.cols - def.matrix[0].length) / 2),
      y: 0
    };
    this.canHold = true;
    this.drawMiniCanvases();

    if (this.collide(this.piece.matrix, this.piece.x, this.piece.y)) {
      this.gameOver = true;
      sfx.gameOver();
      triggerGameOver(this.score);
    }
  }

  holdPiece() {
    if (!this.canHold || this.gameOver) return;
    sfx.rotate();
    const currentKey = this.piece.key;
    if (!this.holdKey) {
      this.holdKey = currentKey;
      this.spawnPiece();
    } else {
      const swapKey = this.holdKey;
      this.holdKey = currentKey;
      this.spawnPiece(swapKey);
    }
    this.canHold = false;
    this.drawMiniCanvases();
  }

  collide(matrix, px, py) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const nx = px + c;
        const ny = py + r;
        if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
        if (ny >= 0 && this.grid[ny][nx]) return true;
      }
    }
    return false;
  }

  rotateMatrix(matrix) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  rotate() {
    const rotated = this.rotateMatrix(this.piece.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
      if (!this.collide(rotated, this.piece.x + offset, this.piece.y)) {
        this.piece.matrix = rotated;
        this.piece.x += offset;
        sfx.rotate();
        return;
      }
    }
  }

  move(dir) {
    if (!this.collide(this.piece.matrix, this.piece.x + dir, this.piece.y)) {
      this.piece.x += dir;
      sfx.move();
    }
  }

  softDrop() {
    if (!this.collide(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      this.score += 1;
      this.dropCounter = 0;
      this.syncUI();
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    let cellsDropped = 0;
    while (!this.collide(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      cellsDropped++;
    }
    this.score += cellsDropped * 2;
    sfx.drop();
    this.lockPiece();
  }

  getGhostY() {
    let gy = this.piece.y;
    while (!this.collide(this.piece.matrix, this.piece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  lockPiece() {
    const { matrix, x, y, color } = this.piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] && y + r >= 0) {
          this.grid[y + r][x + c] = color;
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
    this.syncUI();
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== null)) {
        // Crear partículas en la fila eliminada
        for (let c = 0; c < this.cols; c++) {
          const color = this.grid[r][c];
          for (let i = 0; i < 4; i++) {
            this.particles.push({
              x: this.offsetX + c * this.cellSize + 15,
              y: this.offsetY + r * this.cellSize + 15,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6 - 1.5,
              size: Math.random() * 5 + 3,
              color,
              alpha: 1
            });
          }
        }
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(null));
        cleared++;
        r++;
      }
    }

    if (cleared > 0) {
      sfx.clear();
      const linePoints = [0, 100, 300, 500, 800];
      this.score += (linePoints[cleared] || 1000) * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(110, 850 - (this.level - 1) * 68);
    }
  }

  handleKeyDown(code) {
    if (this.gameOver) return;
    if (code === 'ArrowLeft' || code === 'KeyA') this.move(-1);
    else if (code === 'ArrowRight' || code === 'KeyD') this.move(1);
    else if (code === 'ArrowUp' || code === 'KeyW') this.rotate();
    else if (code === 'ArrowDown' || code === 'KeyS') this.softDrop();
    else if (code === 'Space') this.hardDrop();
    else if (code === 'KeyC' || code === 'ShiftLeft' || code === 'ShiftRight') this.holdPiece();
  }

  update(dt) {
    if (this.gameOver) return;
    this.dropCounter += dt;
    if (this.dropCounter >= this.dropInterval) {
      this.dropCounter = 0;
      if (!this.collide(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
      } else {
        this.lockPiece();
      }
    }

    // Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  drawBlock(context, x, y, size, color, alpha = 1, isGhost = false) {
    context.save();
    context.globalAlpha = alpha;
    if (isGhost) {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x + 2, y + 2, size - 4, size - 4);
      context.fillStyle = color;
      context.globalAlpha = 0.16;
      context.fillRect(x + 2, y + 2, size - 4, size - 4);
    } else {
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 8;
      context.fillRect(x + 1, y + 1, size - 2, size - 2);

      // Brillo interior biselado
      context.shadowBlur = 0;
      context.fillStyle = 'rgba(255, 255, 255, 0.28)';
      context.fillRect(x + 3, y + 3, size - 6, 4);
      context.fillRect(x + 3, y + 3, 4, size - 6);
    }
    context.restore();
  }

  drawMiniCanvases() {
    this.renderMini(nextCtx, nextCanvas, this.nextKey);
    this.renderMini(holdCtx, holdCanvas, this.holdKey);
  }

  renderMini(context, cnv, key) {
    context.clearRect(0, 0, cnv.width, cnv.height);
    if (!key) return;
    const { matrix, color } = this.shapes[key];
    const size = 20;
    const totalW = matrix[0].length * size;
    const totalH = matrix.length * size;
    const startX = (cnv.width - totalW) / 2;
    const startY = (cnv.height - totalH) / 2;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          this.drawBlock(context, startX + c * size, startY + r * size, size, color);
        }
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boardW = this.cols * this.cellSize;
    const boardH = this.rows * this.cellSize;

    // Marco exterior del tablero Tetris
    ctx.save();
    ctx.fillStyle = '#080c1e';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);
    ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, boardW + 4, boardH + 4);

    // Rejilla interna sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let c = 1; c < this.cols; c++) {
      const x = this.offsetX + c * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + boardH);
      ctx.stroke();
    }
    for (let r = 1; r < this.rows; r++) {
      const y = this.offsetY + r * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + boardW, y);
      ctx.stroke();
    }
    ctx.restore();

    // Celdas fijadas
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          this.drawBlock(
            ctx,
            this.offsetX + c * this.cellSize,
            this.offsetY + r * this.cellSize,
            this.cellSize,
            this.grid[r][c]
          );
        }
      }
    }

    // Pieza fantasma y pieza actual
    if (this.piece && !this.gameOver) {
      const ghostY = this.getGhostY();
      const { matrix, x, y, color } = this.piece;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            // Sombra fantasma
            this.drawBlock(
              ctx,
              this.offsetX + (x + c) * this.cellSize,
              this.offsetY + (ghostY + r) * this.cellSize,
              this.cellSize,
              color,
              1,
              true
            );
            // Bloque activo
            this.drawBlock(
              ctx,
              this.offsetX + (x + c) * this.cellSize,
              this.offsetY + (y + r) * this.cellSize,
              this.cellSize,
              color
            );
          }
        }
      }
    }

    // Partículas de explosión de línea
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }
  }

  syncUI() {
    setHighScore('tetris', this.score);
    scoreValueEl.textContent = this.score.toLocaleString();
    highScoreValueEl.textContent = getHighScore('tetris').toLocaleString();
    metaValue1El.textContent = this.level;
    metaValue2El.textContent = this.lines;
  }
}

// ============================================================================
// JUEGO 2: SNAKE (NEON VIPER)
// ============================================================================
class SnakeGame {
  constructor() {
    this.cols = 20;
    this.rows = 30;
    this.cellSize = 20;
    this.offsetX = 10;
    this.offsetY = 20;
    this.reset();
  }

  reset() {
    const midX = Math.floor(this.cols / 2);
    const midY = Math.floor(this.rows / 2);
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY }
    ];
    this.dir = { x: 1, y: 0 };
    this.inputQueue = [];
    this.score = 0;
    this.speedLevel = 1;
    this.stepTimer = 0;
    this.baseInterval = 125;
    this.boostActive = false;
    this.bonusFood = null;
    this.particles = [];
    this.gameOver = false;

    this.spawnFood();
    this.syncUI();
  }

  spawnFood() {
    const freeCells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const occupied = this.snake.some(s => s.x === c && s.y === r) ||
          (this.bonusFood && this.bonusFood.x === c && this.bonusFood.y === r);
        if (!occupied) freeCells.push({ x: c, y: r });
      }
    }
    if (freeCells.length > 0) {
      this.food = freeCells[Math.floor(Math.random() * freeCells.length)];
    }

    // 28% de probabilidad de generar una estrella dorada con tiempo limitado
    if (!this.bonusFood && Math.random() < 0.28 && freeCells.length > 1) {
      const pick = freeCells[Math.floor(Math.random() * freeCells.length)];
      if (pick.x !== this.food.x || pick.y !== this.food.y) {
        this.bonusFood = { x: pick.x, y: pick.y, timer: 6000, maxTimer: 6000 };
      }
    }
  }

  handleKeyDown(code) {
    if (this.gameOver) return;
    const lastDir = this.inputQueue.length > 0
      ? this.inputQueue[this.inputQueue.length - 1]
      : this.dir;

    if ((code === 'ArrowUp' || code === 'KeyW') && lastDir.y === 0) {
      this.inputQueue.push({ x: 0, y: -1 });
    } else if ((code === 'ArrowDown' || code === 'KeyS') && lastDir.y === 0) {
      this.inputQueue.push({ x: 0, y: 1 });
    } else if ((code === 'ArrowLeft' || code === 'KeyA') && lastDir.x === 0) {
      this.inputQueue.push({ x: -1, y: 0 });
    } else if ((code === 'ArrowRight' || code === 'KeyD') && lastDir.x === 0) {
      this.inputQueue.push({ x: 1, y: 0 });
    } else if (code === 'Space') {
      this.boostActive = true;
    }
  }

  handleKeyUp(code) {
    if (code === 'Space') {
      this.boostActive = false;
    }
  }

  emitParticles(gx, gy, color) {
    const px = this.offsetX + gx * this.cellSize + this.cellSize / 2;
    const py = this.offsetY + gy * this.cellSize + this.cellSize / 2;
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.8 + 1;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 4 + 2
      });
    }
  }

  update(dt) {
    if (this.gameOver) return;

    if (this.bonusFood) {
      this.bonusFood.timer -= dt;
      if (this.bonusFood.timer <= 0) {
        this.bonusFood = null;
      }
    }

    const currentInterval = this.boostActive
      ? Math.max(48, (this.baseInterval - (this.speedLevel - 1) * 7) * 0.55)
      : Math.max(60, this.baseInterval - (this.speedLevel - 1) * 7);

    this.stepTimer += dt;
    if (this.stepTimer >= currentInterval) {
      this.stepTimer = 0;
      this.step();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  step() {
    if (this.inputQueue.length > 0) {
      this.dir = this.inputQueue.shift();
    }

    let nextX = this.snake[0].x + this.dir.x;
    let nextY = this.snake[0].y + this.dir.y;

    const wallsLethal = snakeWallsToggle.checked;
    if (wallsLethal) {
      if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
        this.die();
        return;
      }
    } else {
      nextX = (nextX + this.cols) % this.cols;
      nextY = (nextY + this.rows) % this.rows;
    }

    // Colisión con el propio cuerpo
    if (this.snake.some((seg, idx) => idx !== this.snake.length - 1 && seg.x === nextX && seg.y === nextY)) {
      this.die();
      return;
    }

    const newHead = { x: nextX, y: nextY };
    this.snake.unshift(newHead);

    if (this.food && nextX === this.food.x && nextY === this.food.y) {
      this.score += 10 + (this.speedLevel - 1) * 2;
      this.speedLevel = Math.min(12, Math.floor(this.snake.length / 4) + 1);
      sfx.eat();
      this.emitParticles(nextX, nextY, '#ff2a85');
      this.spawnFood();
    } else if (this.bonusFood && nextX === this.bonusFood.x && nextY === this.bonusFood.y) {
      this.score += 50;
      sfx.bonus();
      this.emitParticles(nextX, nextY, '#ffbe0b');
      this.bonusFood = null;
    } else {
      this.snake.pop();
    }

    this.syncUI();
  }

  die() {
    this.gameOver = true;
    sfx.gameOver();
    triggerGameOver(this.score);
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const boardW = this.cols * this.cellSize;
    const boardH = this.rows * this.cellSize;

    // Fondo y borde(s)
    ctx.save();
    ctx.fillStyle = '#070b18';
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);

    ctx.strokeStyle = snakeWallsToggle.checked
      ? 'rgba(255, 42, 133, 0.65)'
      : 'rgba(0, 245, 155, 0.45)';
    ctx.lineWidth = 2;
    if (!snakeWallsToggle.checked) ctx.setLineDash([6, 6]);
    ctx.strokeRect(this.offsetX - 1, this.offsetY - 1, boardW + 2, boardH + 2);
    ctx.setLineDash([]);

    // Cuadrícula tenue
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let c = 1; c < this.cols; c++) {
      const x = this.offsetX + c * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + boardH);
      ctx.stroke();
    }
    for (let r = 1; r < this.rows; r++) {
      const y = this.offsetY + r * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + boardW, y);
      ctx.stroke();
    }
    ctx.restore();

    // Dibujar Manzana Neón
    if (this.food) {
      const fx = this.offsetX + this.food.x * this.cellSize + this.cellSize / 2;
      const fy = this.offsetY + this.food.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.fillStyle = '#ff2a85';
      ctx.shadowColor = '#ff2a85';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(fx, fy, this.cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dibujar Estrella Dorada de Bonus
    if (this.bonusFood) {
      const bx = this.offsetX + this.bonusFood.x * this.cellSize + this.cellSize / 2;
      const by = this.offsetY + this.bonusFood.y * this.cellSize + this.cellSize / 2;
      ctx.save();
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowColor = '#ffbe0b';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(bx, by, this.cellSize * 0.46, 0, Math.PI * 2);
      ctx.fill();

      // Barra de tiempo restante sobre el bonus
      const ratio = Math.max(0, this.bonusFood.timer / this.bonusFood.maxTimer);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 10, by - 14, 20, 4);
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(bx - 10, by - 14, 20 * ratio, 4);
      ctx.restore();
    }

    // Dibujar Serpiente
    this.snake.forEach((seg, index) => {
      const sx = this.offsetX + seg.x * this.cellSize;
      const sy = this.offsetY + seg.y * this.cellSize;
      const isHead = index === 0;

      ctx.save();
      const ratio = 1 - (index / Math.max(1, this.snake.length)) * 0.55;
      ctx.fillStyle = isHead ? '#00f59b' : `rgba(0, 240, 255, ${ratio})`;
      if (isHead) {
        ctx.shadowColor = '#00f59b';
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.roundRect(sx + 1.5, sy + 1.5, this.cellSize - 3, this.cellSize - 3, isHead ? 6 : 4);
      ctx.fill();

      // Ojos de la cabeza
      if (isHead) {
        ctx.fillStyle = '#040814';
        const eyeOffsetX = this.dir.x === 0 ? 4 : (this.dir.x > 0 ? 12 : 5);
        const eyeOffsetY = this.dir.y === 0 ? 4 : (this.dir.y > 0 ? 12 : 5);
        ctx.beginPath();
        ctx.arc(sx + eyeOffsetX, sy + eyeOffsetY, 2.2, 0, Math.PI * 2);
        ctx.arc(
          sx + (this.dir.x === 0 ? this.cellSize - 4 : eyeOffsetX),
          sy + (this.dir.y === 0 ? this.cellSize - 4 : eyeOffsetY),
          2.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    });

    // Partículas
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  syncUI() {
    setHighScore('snake', this.score);
    scoreValueEl.textContent = this.score.toLocaleString();
    highScoreValueEl.textContent = getHighScore('snake').toLocaleString();
    metaValue1El.textContent = `${this.speedLevel}x`;
    metaValue2El.textContent = this.snake.length;
  }
}

// ============================================================================
// JUEGO 3: TURBO 2D (HIGHWAY DRIFT)
// ============================================================================
class RacerGame {
  constructor() {
    this.roadLeft = 65;
    this.roadWidth = 290;
    this.roadRight = this.roadLeft + this.roadWidth;
    this.lanes = 4;
    this.laneWidth = this.roadWidth / this.lanes;
    this.reset();
  }

  reset() {
    this.player = {
      x: this.roadLeft + this.laneWidth * 1.5 - 20,
      y: canvas.height - 125,
      w: 40,
      h: 74,
      vx: 0,
      speed: 320,
      baseMaxSpeed: 540,
      shields: 3,
      invulnerableTimer: 0
    };

    this.keys = { left: false, right: false, up: false, down: false, nitro: false };
    this.nitro = 100;
    this.score = 0;
    this.distance = 0;
    this.roadOffset = 0;
    this.spawnTimer = 0;
    this.pickupTimer = 0;
    this.enemies = [];
    this.pickups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.scenery = [];
    this.gameOver = false;

    for (let i = 0; i < 10; i++) {
      this.scenery.push({
        y: i * 70,
        side: i % 2 === 0 ? 'left' : 'right'
      });
    }

    this.syncUI();
  }

  handleKeyDown(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW') this.keys.up = true;
    if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = true;
    if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') this.keys.nitro = true;
  }

  handleKeyUp(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW') this.keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = false;
    if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') this.keys.nitro = false;
  }

  spawnEnemy() {
    const lane = Math.floor(Math.random() * this.lanes);
    const types = [
      { name: 'coupe', w: 38, h: 70, color: '#ff2a85', speed: 210 + Math.random() * 70 },
      { name: 'sedan', w: 40, h: 74, color: '#ffbe0b', speed: 175 + Math.random() * 60 },
      { name: 'truck', w: 44, h: 96, color: '#9d4edd', speed: 140 + Math.random() * 40 }
    ];
    const spec = types[Math.floor(Math.random() * types.length)];
    const x = this.roadLeft + lane * this.laneWidth + (this.laneWidth - spec.w) / 2;

    // Evitar solapamiento inmediato al generar
    const tooClose = this.enemies.some(e => Math.abs(e.y - (-110)) < 130 && Math.abs(e.x - x) < 45);
    if (tooClose) return;

    this.enemies.push({
      x,
      y: -110,
      w: spec.w,
      h: spec.h,
      color: spec.color,
      speed: spec.speed,
      nearMissed: false
    });
  }

  spawnPickup() {
    const lane = Math.floor(Math.random() * this.lanes);
    const isShield = this.player.shields < 3 && Math.random() < 0.25;
    const x = this.roadLeft + lane * this.laneWidth + this.laneWidth / 2;
    this.pickups.push({
      x,
      y: -40,
      r: 13,
      type: isShield ? 'shield' : 'coin'
    });
  }

  addFloatingText(text, x, y, color = '#00f0ff') {
    this.floatingTexts.push({ text, x, y, color, alpha: 1 });
  }

  update(dt) {
    if (this.gameOver) return;
    const sec = dt / 1000;

    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // Control de velocidad y Nitro
    const usingNitro = this.keys.nitro && this.nitro > 1;
    const targetSpeed = usingNitro
      ? 760
      : this.keys.up
        ? this.player.baseMaxSpeed + Math.min(180, this.distance * 4)
        : this.keys.down
          ? 210
          : 390 + Math.min(140, this.distance * 3);

    this.player.speed += (targetSpeed - this.player.speed) * 5 * sec;

    if (usingNitro) {
      this.nitro = Math.max(0, this.nitro - 34 * sec);
      // Llamas azules del escape
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: this.player.x + 10 + Math.random() * 20,
          y: this.player.y + this.player.h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 4 + 3,
          color: Math.random() > 0.4 ? '#00f0ff' : '#3a86ff',
          size: Math.random() * 5 + 3,
          alpha: 0.9
        });
      }
    } else {
      this.nitro = Math.min(100, this.nitro + 11 * sec);
    }

    // Dirección horizontal suave
    const steerSpeed = 295;
    if (this.keys.left) this.player.x -= steerSpeed * sec;
    if (this.keys.right) this.player.x += steerSpeed * sec;
    this.player.x = Math.max(
      this.roadLeft + 6,
      Math.min(this.roadRight - this.player.w - 6, this.player.x)
    );

    // Avance de carretera y puntuación
    this.roadOffset = (this.roadOffset + this.player.speed * sec) % 60;
    this.distance += (this.player.speed * sec) / 120;
    this.score += Math.round((this.player.speed * sec) * (usingNitro ? 0.14 : 0.08));

    // Escenario lateral (farolas / árboles neón)
    for (const item of this.scenery) {
      item.y += this.player.speed * sec;
      if (item.y > canvas.height + 30) {
        item.y = -40;
      }
    }

    // Generación de tráfico y monedas
    this.spawnTimer += dt;
    const spawnInterval = Math.max(420, 980 - this.distance * 10);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    this.pickupTimer += dt;
    if (this.pickupTimer >= 1650) {
      this.pickupTimer = 0;
      this.spawnPickup();
    }

    // Actualizar enemigos y colisiones
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const relSpeed = this.player.speed - e.speed;
      e.y += relSpeed * sec;

      // Detectar adelantamiento al límite (Near Miss)
      if (!e.nearMissed && e.y > this.player.y && e.y - this.player.y < 60) {
        const horizGap = Math.abs((this.player.x + this.player.w / 2) - (e.x + e.w / 2));
        if (horizGap < (this.player.w + e.w) / 2 + 16) {
          e.nearMissed = true;
          this.score += 50;
          this.nitro = Math.min(100, this.nitro + 12);
          sfx.eat();
          this.addFloatingText('¡ROCE +50!', this.player.x, this.player.y - 10, '#00f59b');
        }
      }

      // Colisión AABB
      if (
        this.player.invulnerableTimer <= 0 &&
        this.player.x < e.x + e.w - 4 &&
        this.player.x + this.player.w - 4 > e.x &&
        this.player.y < e.y + e.h - 4 &&
        this.player.y + this.player.h - 4 > e.y
      ) {
        this.player.shields--;
        this.player.invulnerableTimer = 1400;
        this.player.speed = Math.max(180, this.player.speed * 0.55);
        sfx.crash();
        this.emitCrashParticles(this.player.x + 20, this.player.y + 20, '#ff2a85');
        this.addFloatingText('¡IMPACTO!', this.player.x, this.player.y - 12, '#ff2a85');
        this.enemies.splice(i, 1);

        if (this.player.shields <= 0) {
          this.gameOver = true;
          sfx.gameOver();
          triggerGameOver(this.score);
          return;
        }
        continue;
      }

      if (e.y > canvas.height + 140) {
        this.enemies.splice(i, 1);
      }
    }

    // Actualizar coleccionables
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.y += (this.player.speed * 0.75) * sec;

      const cx = this.player.x + this.player.w / 2;
      const cy = this.player.y + this.player.h / 2;
      const dist = Math.hypot(cx - pk.x, cy - pk.y);

      if (dist < pk.r + 24) {
        if (pk.type === 'coin') {
          this.score += 100;
          this.nitro = Math.min(100, this.nitro + 22);
          sfx.bonus();
          this.addFloatingText('+100 ⚡', pk.x - 18, pk.y, '#ffbe0b');
        } else {
          this.player.shields = Math.min(3, this.player.shields + 1);
          sfx.clear();
          this.addFloatingText('ESCUDO +1', pk.x - 24, pk.y, '#00f59b');
        }
        this.pickups.splice(i, 1);
        continue;
      }

      if (pk.y > canvas.height + 50) {
        this.pickups.splice(i, 1);
      }
    }

    // Partículas y textos flotantes
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    this.syncUI();
  }

  emitCrashParticles(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: Math.random() * 5 + 3,
        alpha: 1
      });
    }
  }

  drawCar(x, y, w, h, bodyColor, isPlayer = false) {
    ctx.save();
    // Sombra y resplandor
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = isPlayer ? 16 : 10;

    // Ruedas
    ctx.fillStyle = '#05070f';
    ctx.fillRect(x - 3, y + 10, 4, 15);
    ctx.fillRect(x + w - 1, y + 10, 4, 15);
    ctx.fillRect(x - 3, y + h - 25, 4, 15);
    ctx.fillRect(x + w - 1, y + h - 25, 4, 15);

    // Carrocería principal
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();

    // Parabrisas / cabina
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#091024';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + h * 0.24, w - 12, h * 0.44, 5);
    ctx.fill();

    // Franja deportiva central
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + w / 2 - 2, y + 4, 4, h - 8);

    // Faros delanteros
    ctx.fillStyle = '#e0fbfc';
    ctx.fillRect(x + 5, y + 2, 7, 4);
    ctx.fillRect(x + w - 12, y + 2, 7, 4);
    ctx.restore();
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Césped / arcén oscuro
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Luces decorativas al costado de la autopista
    for (const item of this.scenery) {
      const sx = item.side === 'left' ? 28 : canvas.width - 28;
      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, item.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Asfalto de la autopista
    ctx.fillStyle = '#0d1326';
    ctx.fillRect(this.roadLeft, 0, this.roadWidth, canvas.height);

    // Bordillos animados laterales
    const curbH = 30;
    for (let y = -curbH + (this.roadOffset % (curbH * 2)); y < canvas.height; y += curbH) {
      const isAlt = Math.floor((y - this.roadOffset) / curbH) % 2 === 0;
      ctx.fillStyle = isAlt ? '#ff2a85' : '#00f0ff';
      ctx.fillRect(this.roadLeft - 8, y, 8, curbH);
      ctx.fillRect(this.roadRight, y, 8, curbH);
    }

    // Líneas divisorias de carriles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 3;
    ctx.setLineDash([28, 32]);
    ctx.lineDashOffset = -this.roadOffset;
    for (let l = 1; l < this.lanes; l++) {
      const lx = this.roadLeft + l * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Coleccionables (Monedas y Escudos)
    for (const pk of this.pickups) {
      ctx.save();
      const color = pk.type === 'coin' ? '#ffbe0b' : '#00f59b';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#050814';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pk.type === 'coin' ? '⚡' : '🛡️', pk.x, pk.y + 1);
      ctx.restore();
    }

    // Vehículos de tráfico
    for (const e of this.enemies) {
      this.drawCar(e.x, e.y, e.w, e.h, e.color, false);
    }

    // Partículas (Nitro y choques)
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Vehículo del jugador (parpadea si es invulnerable tras un choque)
    const blink = this.player.invulnerableTimer > 0 && Math.floor(this.player.invulnerableTimer / 90) % 2 === 0;
    if (!blink) {
      this.drawCar(this.player.x, this.player.y, this.player.w, this.player.h, '#00f0ff', true);
    }

    // Textos flotantes de bonificación
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '700 13px Orbitron';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  syncUI() {
    setHighScore('racer', this.score);
    scoreValueEl.textContent = this.score.toLocaleString();
    highScoreValueEl.textContent = getHighScore('racer').toLocaleString();
    const kmh = Math.round(this.player.speed * 0.45);
    metaValue1El.textContent = `${kmh} km/h`;
    metaValue2El.textContent = `${this.distance.toFixed(1)} km`;

    const nitroPct = Math.round(this.nitro);
    nitroPercentEl.textContent = `${nitroPct}%`;
    nitroBarEl.style.width = `${nitroPct}%`;

    shieldPercentEl.textContent = `${this.player.shields} / 3`;
    shieldBarEl.style.width = `${(this.player.shields / 3) * 100}%`;
  }
}

// ============================================================================
// CONTROLADOR PRINCIPAL DEL ARCADE
// ============================================================================
const games = {
  tetris: new TetrisGame(),
  snake: new SnakeGame(),
  racer: new RacerGame()
};

let activeGameKey = 'tetris';
let isRunning = false;
let isPaused = false;
let lastTime = performance.now();

function switchGame(gameKey) {
  activeGameKey = gameKey;
  isRunning = false;
  isPaused = false;

  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.game === gameKey);
  });

  const meta = GAME_META[gameKey];
  gameTitleEl.textContent = meta.title;
  gameDescEl.textContent = meta.desc;
  metaLabel1El.textContent = meta.meta1;
  metaLabel2El.textContent = meta.meta2;

  tetrisExtrasEl.classList.toggle('hidden', gameKey !== 'tetris');
  snakeExtrasEl.classList.toggle('hidden', gameKey !== 'snake');
  racerExtrasEl.classList.toggle('hidden', gameKey !== 'racer');

  controlsListEl.innerHTML = meta.controls
    .map(([k, desc]) => `<li><kbd>${k}</kbd> <span>${desc}</span></li>`)
    .join('');

  games[gameKey].reset();
  games[gameKey].draw();

  showOverlay('LISTO PARA JUGAR', meta.title, 'Pulsa el botón o presiona ENTER para comenzar', 'JUGAR AHORA');
  startPauseBtn.textContent = '▶ INICIAR PARTIDA';
}

function showOverlay(badge, title, subtitle, btnText) {
  overlayBadge.textContent = badge;
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  overlayActionBtn.textContent = btnText;
  canvasOverlay.classList.remove('hidden');
}

function hideOverlay() {
  canvasOverlay.classList.add('hidden');
}

function startOrPauseGame() {
  const current = games[activeGameKey];
  if (current.gameOver) {
    current.reset();
    isRunning = true;
    isPaused = false;
    hideOverlay();
    startPauseBtn.textContent = '⏸ PAUSAR';
    return;
  }

  if (!isRunning) {
    isRunning = true;
    isPaused = false;
    hideOverlay();
    startPauseBtn.textContent = '⏸ PAUSAR';
  } else if (!isPaused) {
    isPaused = true;
    showOverlay('JUEGO EN PAUSA', GAME_META[activeGameKey].title, 'Tómate un respiro. Tu partida te espera.', 'REANUDAR');
    startPauseBtn.textContent = '▶ REANUDAR';
  } else {
    isPaused = false;
    hideOverlay();
    startPauseBtn.textContent = '⏸ PAUSAR';
  }
}

function restartActiveGame() {
  const current = games[activeGameKey];
  current.reset();
  isRunning = true;
  isPaused = false;
  hideOverlay();
  startPauseBtn.textContent = '⏸ PAUSAR';
}

function triggerGameOver(finalScore) {
  isRunning = false;
  isPaused = false;
  startPauseBtn.textContent = '▶ NUEVA PARTIDA';
  showOverlay(
    'FIN DE LA PARTIDA',
    `PUNTUACIÓN: ${finalScore.toLocaleString()}`,
    '¿Listo para superar tu récord en el Salón de la Fama?',
    'JUGAR DE NUEVO'
  );
}

// Eventos de botones y pestañas
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchGame(btn.dataset.game));
});

startPauseBtn.addEventListener('click', startOrPauseGame);
overlayActionBtn.addEventListener('click', startOrPauseGame);
restartBtn.addEventListener('click', restartActiveGame);

// Eventos de teclado
window.addEventListener('keydown', e => {
  const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  if (blockedKeys.includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === 'Enter' && (!isRunning || isPaused)) {
    startOrPauseGame();
    return;
  }

  if (e.code === 'KeyP') {
    if (isRunning) startOrPauseGame();
    return;
  }

  if (isRunning && !isPaused) {
    games[activeGameKey].handleKeyDown(e.code);
  }
});

window.addEventListener('keyup', e => {
  const current = games[activeGameKey];
  if (current.handleKeyUp) {
    current.handleKeyUp(e.code);
  }
});

// Controles táctiles / ratón en pantalla
document.querySelectorAll('.touch-btn').forEach(btn => {
  const key = btn.dataset.key;
  const press = e => {
    e.preventDefault();
    if (!isRunning || isPaused) {
      startOrPauseGame();
      return;
    }
    games[activeGameKey].handleKeyDown(key);
  };
  const release = e => {
    e.preventDefault();
    const current = games[activeGameKey];
    if (current.handleKeyUp) current.handleKeyUp(key);
  };

  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
});

// Bucle principal de animación a 60 FPS
function gameLoop(now) {
  const dt = Math.min(50, now - lastTime);
  lastTime = now;

  const current = games[activeGameKey];
  if (isRunning && !isPaused) {
    current.update(dt);
  }
  current.draw();

  requestAnimationFrame(gameLoop);
}

// Inicialización
updateLeaderboardUI();
switchGame('tetris');
requestAnimationFrame(gameLoop);
