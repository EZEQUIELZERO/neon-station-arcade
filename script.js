// ============================================================================
// SALA DE JUEGOS DE EZEQUIEL // TETRIS XL · TETRIS INFECTED · SNAKE · TURBO 2D
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const gameThemeDot = document.getElementById('gameThemeDot');
const gameTitleEl = document.getElementById('gameTitle');
const gameDescEl = document.getElementById('gameDesc');
const scoreValueEl = document.getElementById('scoreValue');
const highScoreValueEl = document.getElementById('highScoreValue');
const metaLabel1El = document.getElementById('metaLabel1');
const metaValue1El = document.getElementById('metaValue1');
const metaLabel2El = document.getElementById('metaLabel2');
const metaValue2El = document.getElementById('metaValue2');

// HUD superior del escenario
const stageContainer = document.getElementById('stageContainer');
const canvasFrame = document.getElementById('canvasFrame');
const hudScoreEl = document.getElementById('hudScore');
const hudMetaLabelEl = document.getElementById('hudMetaLabel');
const hudMetaValEl = document.getElementById('hudMetaVal');
const hudPauseBtn = document.getElementById('hudPauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const tetrisExtrasEl = document.getElementById('tetrisExtras');
const tetrisWideToggle = document.getElementById('tetrisWideToggle');
const tetrisColsLabel = document.getElementById('tetrisColsLabel');
const infectedLegendEl = document.getElementById('infectedLegend');
const snakeExtrasEl = document.getElementById('snakeExtras');
const racerExtrasEl = document.getElementById('racerExtras');
const snakeWallsToggle = document.getElementById('snakeWallsToggle');

const nitroPercentEl = document.getElementById('nitroPercent');
const nitroBarEl = document.getElementById('nitroBar');
const shieldPercentEl = document.getElementById('shieldPercent');
const shieldBarEl = document.getElementById('shieldBar');

const startPauseBtn = document.getElementById('startPauseBtn');
const dedicatedPauseBtn = document.getElementById('dedicatedPauseBtn');
const mobilePauseBtn = document.getElementById('mobilePauseBtn');
const restartBtn = document.getElementById('restartBtn');
const canvasOverlay = document.getElementById('canvasOverlay');
const overlayBadge = document.getElementById('overlayBadge');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const overlayActionBtn = document.getElementById('overlayActionBtn');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');
const controlsListEl = document.getElementById('controlsList');
const leaderboardContainer = document.getElementById('leaderboardContainer');

const soundToggleBtn = document.getElementById('soundToggle');
const soundIconEl = document.getElementById('soundIcon');

// Elementos del Modal de Bienvenida y Perfil
const welcomeModal = document.getElementById('welcomeModal');
const playerForm = document.getElementById('playerForm');
const usernameInput = document.getElementById('usernameInput');
const usernameError = document.getElementById('usernameError');
const avatarFileInput = document.getElementById('avatarFileInput');
const modalAvatarPreview = document.getElementById('modalAvatarPreview');
const presetAvatarBtns = document.querySelectorAll('.preset-avatar-btn');
const editProfileBtn = document.getElementById('editProfileBtn');
const headerAvatar = document.getElementById('headerAvatar');
const headerUsername = document.getElementById('headerUsername');

// Zonas visuales de toque en pantalla
const tzTop = document.querySelector('.tz-top');
const tzBottom = document.querySelector('.tz-bottom');
const tzLeft = document.querySelector('.tz-left');
const tzRight = document.querySelector('.tz-right');

// ============================================================================
// GESTIÓN DE PERFIL DE USUARIO Y FOTO DE PERFIL
// ============================================================================
const PROFILE_STORAGE_KEY = 'ezequiel_arcade_player_profile_v1';

function createEmojiAvatarDataUrl(emoji, bgColor = '#101836') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const cctx = c.getContext('2d');

  const grad = cctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, '#182b19');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, 128, 128);

  cctx.strokeStyle = '#00f0ff';
  cctx.lineWidth = 6;
  cctx.strokeRect(3, 3, 122, 122);

  cctx.font = '68px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  cctx.textAlign = 'center';
  cctx.textBaseline = 'middle';
  cctx.fillText(emoji, 64, 70);
  return c.toDataURL('image/png');
}

const DEFAULT_AVATAR = createEmojiAvatarDataUrl('🤖');

let currentPlayer = {
  name: 'Jugador',
  avatar: DEFAULT_AVATAR
};

let pendingAvatarDataUrl = DEFAULT_AVATAR;

function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        currentPlayer.name = parsed.name;
        currentPlayer.avatar = parsed.avatar || DEFAULT_AVATAR;
        pendingAvatarDataUrl = currentPlayer.avatar;
        usernameInput.value = currentPlayer.name;
      }
    }
  } catch (e) {
    // Ignorar errores de localStorage
  }
  modalAvatarPreview.src = pendingAvatarDataUrl;
  syncHeaderProfileUI();
}

function saveProfile(name, avatar) {
  currentPlayer = {
    name: name.trim(),
    avatar: avatar || DEFAULT_AVATAR
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentPlayer));
  } catch (e) {
    // Fallback
  }
  syncHeaderProfileUI();
  updateLeaderboardUI();
}

function syncHeaderProfileUI() {
  headerUsername.textContent = currentPlayer.name;
  headerAvatar.src = currentPlayer.avatar || DEFAULT_AVATAR;
}

function isWelcomeModalOpen() {
  return !welcomeModal.classList.contains('hidden');
}

presetAvatarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetAvatarBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    pendingAvatarDataUrl = createEmojiAvatarDataUrl(btn.dataset.avatar);
    modalAvatarPreview.src = pendingAvatarDataUrl;
  });
});

avatarFileInput.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const size = 128;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = size;
      offCanvas.height = size;
      const octx = offCanvas.getContext('2d');

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      octx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

      pendingAvatarDataUrl = offCanvas.toDataURL('image/jpeg', 0.84);
      modalAvatarPreview.src = pendingAvatarDataUrl;
      presetAvatarBtns.forEach(b => b.classList.remove('selected'));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

playerForm.addEventListener('submit', e => {
  e.preventDefault();
  const cleanName = usernameInput.value.trim();
  if (!cleanName) {
    usernameError.classList.remove('hidden');
    usernameInput.focus();
    return;
  }
  usernameError.classList.add('hidden');
  saveProfile(cleanName, pendingAvatarDataUrl);
  welcomeModal.classList.add('hidden');
  sfx.bonus();
});

editProfileBtn.addEventListener('click', () => {
  if (isRunning && !isPaused) {
    togglePauseOnly();
  }
  usernameInput.value = currentPlayer.name;
  pendingAvatarDataUrl = currentPlayer.avatar;
  modalAvatarPreview.src = pendingAvatarDataUrl;
  welcomeModal.classList.remove('hidden');
  setTimeout(() => usernameInput.focus(), 50);
});

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
  explode() {
    this.tone(145, 'sawtooth', 0.22, 0.18, 42);
    setTimeout(() => this.tone(95, 'square', 0.18, 0.15, 35), 70);
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
// SALÓN DE LA FAMA (RÉCORDS CON NOMBRE Y FOTO DE PERFIL)
// ============================================================================
const RECORD_KEYS = {
  tetris: 'neon_arcade_record_tetris_v2',
  infected: 'neon_arcade_record_infected_v1',
  snake: 'neon_arcade_record_snake_v2',
  racer: 'neon_arcade_record_racer_v2'
};

const LEGACY_KEYS = {
  tetris: 'neon_arcade_best_tetris',
  snake: 'neon_arcade_best_snake',
  racer: 'neon_arcade_best_racer'
};

function getRecord(gameKey) {
  try {
    const raw = localStorage.getItem(RECORD_KEYS[gameKey]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.score === 'number') {
        return parsed;
      }
    }
    if (LEGACY_KEYS[gameKey]) {
      const legacy = parseInt(localStorage.getItem(LEGACY_KEYS[gameKey]) || '0', 10);
      if (legacy > 0) {
        return { score: legacy, name: currentPlayer.name, avatar: currentPlayer.avatar };
      }
    }
  } catch (e) {
    // Fallback
  }
  return { score: 0, name: 'Sin récord', avatar: DEFAULT_AVATAR };
}

function getHighScore(gameKey) {
  return getRecord(gameKey).score;
}

function setHighScore(gameKey, score) {
  const current = getRecord(gameKey);
  if (score > current.score || (score > 0 && score === current.score && current.name === 'Sin récord')) {
    const updated = {
      score,
      name: currentPlayer.name,
      avatar: currentPlayer.avatar
    };
    try {
      localStorage.setItem(RECORD_KEYS[gameKey], JSON.stringify(updated));
    } catch (e) {
      // Ignorar errores de cuota
    }
  }
  updateLeaderboardUI();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function updateLeaderboardUI() {
  const items = [
    { key: 'tetris', label: '🧱 TETRIS XL' },
    { key: 'infected', label: '☣️ TETRIS INFECTED' },
    { key: 'snake', label: '🐍 SNAKE' },
    { key: 'racer', label: '🏎️ TURBO 2D' }
  ];

  leaderboardContainer.innerHTML = items.map(item => {
    const rec = getRecord(item.key);
    const displayUser = rec.score > 0 ? escapeHtml(rec.name) : 'Vacante';
    const displayAvatar = rec.score > 0 ? (rec.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;
    return `
      <div class="leader-item">
        <div class="leader-left">
          <img src="${displayAvatar}" alt="${displayUser}" class="leader-avatar" />
          <div class="leader-meta">
            <span class="leader-game">${item.label}</span>
            <span class="leader-user">${displayUser}</span>
          </div>
        </div>
        <strong class="leader-score">${rec.score.toLocaleString()}</strong>
      </div>
    `;
  }).join('');
}

function updateHUD(score, metaLabel, metaVal) {
  hudScoreEl.textContent = score.toLocaleString();
  hudMetaLabelEl.textContent = metaLabel;
  hudMetaValEl.textContent = metaVal;
}

const GAME_META = {
  tetris: {
    title: 'TETRIS // MODO ANCHO +50%',
    desc: 'Tablero expandido un 50% más ancho (15 columnas) para estrategias masivas, o cámbialo al clásico de 10 columnas.',
    meta1: 'NIVEL',
    meta2: 'LÍNEAS',
    hudLabel: 'NVL',
    controls: [
      ['← → / Toque Izq-Der', 'Mover pieza'],
      ['↑ / W / Toque Arriba', 'Rotar pieza'],
      ['↓ / S', 'Caída suave (+1 pt)'],
      ['ESPACIO / Toque Abajo', 'Caída rápida instantánea'],
      ['C / SHIFT', 'Guardar pieza en reserva'],
      ['P / Botón PAUSA', 'Pausar / Reanudar']
    ]
  },
  infected: {
    title: 'TETRIS INFECTED // BIO-ZOMBIE',
    desc: '¡Brote Zombie! Los bloques infectados tienen cuenta regresiva (15s a 45s). Completa su línea para ganar puntos extra antes de que exploten, dejen un hueco y te resten puntos.',
    meta1: 'PELIGRO',
    meta2: 'INFECTADOS',
    hudLabel: 'BIO-NVL',
    controls: [
      ['← → / Toque Izq-Der', 'Mover pieza'],
      ['↑ / W / Toque Arriba', 'Rotar pieza'],
      ['ESPACIO / Toque Abajo', 'Caer rápido (Hard Drop)'],
      ['↓ / S', 'Caída suave (+1 pt)'],
      ['C / SHIFT', 'Guardar pieza en reserva'],
      ['P / Botón PAUSA', 'Pausar / Reanudar']
    ]
  },
  snake: {
    title: 'SNAKE // NEON VIPER',
    desc: 'Recoge manzanas cibernéticas y estrellas doradas antes de que se agote su tiempo sin morder tu propia cola.',
    meta1: 'VELOCIDAD',
    meta2: 'LONGITUD',
    hudLabel: 'VEL',
    controls: [
      ['← ↑ ↓ → / Toques', 'Cambiar dirección'],
      ['W A S D', 'Control alternativo'],
      ['ESPACIO', 'Turbo sprint temporal'],
      ['P / Botón PAUSA', 'Pausar / Reanudar']
    ]
  },
  racer: {
    title: 'TURBO 2D // HIGHWAY DRIFT',
    desc: 'Esquiva el tráfico a toda velocidad, realiza adelantamientos al límite, recoge monedas y activa el Nitro Boost.',
    meta1: 'VELOCIDAD',
    meta2: 'DISTANCIA',
    hudLabel: 'KM/H',
    controls: [
      ['← → / Toque Izq-Der', 'Cambiar de carril / Girar'],
      ['↑ / Toque Arriba', 'Acelerar / Nitro'],
      ['↓ / Toque Abajo', 'Frenar'],
      ['ESPACIO / SHIFT', 'Activar NITRO BOOST'],
      ['P / Botón PAUSA', 'Pausar / Reanudar']
    ]
  }
};

// ============================================================================
// JUEGO 1: TETRIS (CON MODO ANCHO +50% DE 15 COLUMNAS)
// ============================================================================
class TetrisGame {
  constructor() {
    this.rows = 20;
    this.cellSize = 30;
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

  applyBoardWidth() {
    const isWide = tetrisWideToggle ? tetrisWideToggle.checked : true;
    this.cols = isWide ? 15 : 10;
    this.offsetX = Math.floor((canvas.width - this.cols * this.cellSize) / 2);

    if (tetrisColsLabel) {
      tetrisColsLabel.textContent = isWide
        ? '15 columnas activas (+50% ancho)'
        : '10 columnas (Modo Clásico)';
    }
  }

  reset() {
    this.applyBoardWidth();
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
        for (let c = 0; c < this.cols; c++) {
          const color = this.grid[r][c];
          for (let i = 0; i < 3; i++) {
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
      const widthBonus = this.cols === 15 ? 1.5 : 1;
      const linePoints = [0, 100, 300, 500, 800];
      this.score += Math.round((linePoints[cleared] || 1000) * this.level * widthBonus);
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

    ctx.save();
    ctx.fillStyle = '#080c1e';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);
    ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, boardW + 4, boardH + 4);

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

    if (this.piece && !this.gameOver) {
      const ghostY = this.getGhostY();
      const { matrix, x, y, color } = this.piece;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            this.drawBlock(
              ctx,
              this.offsetX + (x + c) * this.cellSize,
              this.offsetY + (ghostY + r) * this.cellSize,
              this.cellSize,
              color,
              1,
              true
            );
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
    updateHUD(this.score, 'NVL', this.level);
  }
}

// ============================================================================
// JUEGO 2: TETRIS INFECTED (ESTILO ZOMBIE VERDE CON CUENTA REGRESIVA 15s-45s)
// ============================================================================
class TetrisInfectedGame {
  constructor() {
    this.rows = 20;
    this.cellSize = 30;
    this.offsetY = 20;

    // Paleta de tonos verdes estilo Bio-Zombie / Mutante
    this.shapes = {
      I: { matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#39ff14' },
      O: { matrix: [[1,1],[1,1]], color: '#b5e48c' },
      T: { matrix: [[0,1,0],[1,1,1],[0,0,0]], color: '#52b788' },
      S: { matrix: [[0,1,1],[1,1,0],[0,0,0]], color: '#70e000' },
      Z: { matrix: [[1,1,0],[0,1,1],[0,0,0]], color: '#9ef01a' },
      J: { matrix: [[1,0,0],[1,1,1],[0,0,0]], color: '#2dc653' },
      L: { matrix: [[0,0,1],[1,1,1],[0,0,0]], color: '#aacc00' }
    };

    this.reset();
  }

  applyBoardWidth() {
    const isWide = tetrisWideToggle ? tetrisWideToggle.checked : true;
    this.cols = isWide ? 15 : 10;
    this.offsetX = Math.floor((canvas.width - this.cols * this.cellSize) / 2);
  }

  randomInfectionDurationMs() {
    // Aleatoriamente entre 15 segundos (15000ms) y 45 segundos (45000ms)
    const minSec = 15;
    const maxSec = Math.max(22, 45 - (this.level - 1) * 2);
    const seconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    return seconds * 1000;
  }

  reset() {
    this.applyBoardWidth();
    // Cada celda del grid es null o { color, infected, timerMs, maxTimerMs }
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.survivalTimer = 0;
    this.outbreakTimer = 0;
    this.bag = [];
    this.holdKey = null;
    this.canHold = true;
    this.dropCounter = 0;
    this.dropInterval = 820;
    this.particles = [];
    this.floatingTexts = [];
    this.pulseClock = 0;
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
    const matrix = def.matrix.map(r => [...r]);

    // Elegir si algún bloque de la pieza que cae viene infectado de fábrica
    const infectedMap = matrix.map(r => r.map(() => null));
    const infectChance = Math.min(0.75, 0.35 + (this.level - 1) * 0.06);
    if (Math.random() < infectChance) {
      const coords = [];
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) coords.push([r, c]);
        }
      }
      if (coords.length > 0) {
        const [ir, ic] = coords[Math.floor(Math.random() * coords.length)];
        const dur = this.randomInfectionDurationMs();
        infectedMap[ir][ic] = { timerMs: dur, maxTimerMs: dur };
      }
    }

    this.piece = {
      key,
      matrix,
      infectedMap,
      color: def.color,
      x: Math.floor((this.cols - matrix[0].length) / 2),
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
    const result = Array.from({ length: N }, () => Array(N).fill(null));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  rotate() {
    const rotated = this.rotateMatrix(this.piece.matrix);
    const rotatedInf = this.rotateMatrix(this.piece.infectedMap);
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
      if (!this.collide(rotated, this.piece.x + offset, this.piece.y)) {
        this.piece.matrix = rotated;
        this.piece.infectedMap = rotatedInf;
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
    const { matrix, infectedMap, x, y, color } = this.piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] && y + r >= 0) {
          const inf = infectedMap[r][c];
          this.grid[y + r][x + c] = {
            color,
            infected: Boolean(inf),
            timerMs: inf ? inf.timerMs : 0,
            maxTimerMs: inf ? inf.maxTimerMs : 0
          };
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
    this.syncUI();
  }

  spreadRandomInfection() {
    // Infecta un bloque sano existente del tablero con un temporizador de 15s a 45s
    const healthyCells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.infected) {
          healthyCells.push({ r, c, cell });
        }
      }
    }
    if (healthyCells.length > 0) {
      const pick = healthyCells[Math.floor(Math.random() * healthyCells.length)];
      const dur = this.randomInfectionDurationMs();
      pick.cell.infected = true;
      pick.cell.timerMs = dur;
      pick.cell.maxTimerMs = dur;
      const px = this.offsetX + pick.c * this.cellSize + 15;
      const py = this.offsetY + pick.r * this.cellSize + 15;
      this.addFloatingText(`☣️ ${Math.ceil(dur / 1000)}s`, px - 18, py, '#39ff14');
    }
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, color, alpha: 1 });
  }

  clearLines() {
    let cleared = 0;
    let curedBlocks = 0;

    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== null)) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.grid[r][c];
          if (cell.infected) curedBlocks++;
          for (let i = 0; i < 4; i++) {
            this.particles.push({
              x: this.offsetX + c * this.cellSize + 15,
              y: this.offsetY + r * this.cellSize + 15,
              vx: (Math.random() - 0.5) * 6.5,
              vy: (Math.random() - 0.5) * 6.5 - 1.5,
              size: Math.random() * 5 + 3,
              color: cell.infected ? '#39ff14' : cell.color,
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
      const widthBonus = this.cols === 15 ? 1.5 : 1;
      const linePoints = [0, 120, 350, 600, 950];
      const baseGain = Math.round((linePoints[cleared] || 1100) * this.level * widthBonus);
      const cureBonus = curedBlocks * 250 * this.level;
      this.score += baseGain + cureBonus;
      this.lines += cleared;

      if (curedBlocks > 0) {
        sfx.bonus();
        this.addFloatingText(
          `☣️ ¡CURADO +${cureBonus}!`,
          canvas.width / 2 - 70,
          canvas.height / 2,
          '#39ff14'
        );
      }

      this.recalcDifficulty();
    }
  }

  recalcDifficulty() {
    // La dificultad sube progresivamente por líneas y por tiempo sobrevivido
    const timeLevels = Math.floor(this.survivalTimer / 30000);
    this.level = Math.floor(this.lines / 6) + timeLevels + 1;
    this.dropInterval = Math.max(105, 820 - (this.level - 1) * 62);
  }

  countActiveInfected() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] && this.grid[r][c].infected) count++;
      }
    }
    return count;
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
    this.pulseClock += dt;
    this.survivalTimer += dt;
    this.outbreakTimer += dt;

    // Cada cierto tiempo brota una nueva infección en un bloque fijado
    const outbreakInterval = Math.max(4500, 11500 - (this.level - 1) * 750);
    if (this.outbreakTimer >= outbreakInterval) {
      this.outbreakTimer = 0;
      this.spreadRandomInfection();
      this.recalcDifficulty();
    }

    // Actualizar cuenta regresiva de los bloques infectados en el tablero
    let explodedAny = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell && cell.infected) {
          cell.timerMs -= dt;
          if (cell.timerMs <= 0) {
            // ¡EXPLOTA EL CUADRADITO! Queda hueco y resta puntos
            const px = this.offsetX + c * this.cellSize + 15;
            const py = this.offsetY + r * this.cellSize + 15;
            for (let i = 0; i < 14; i++) {
              this.particles.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                size: Math.random() * 5 + 3,
                color: i % 2 === 0 ? '#39ff14' : '#ffbe0b',
                alpha: 1
              });
            }
            this.grid[r][c] = null; // Queda el hueco en la fila
            const penalty = 150 * this.level;
            this.score = Math.max(0, this.score - penalty);
            this.addFloatingText(`💥 -${penalty} PTS`, px - 32, py, '#ffbe0b');
            explodedAny = true;
          }
        }
      }
    }

    if (explodedAny) {
      sfx.explode();
      this.syncUI();
    }

    // Caída de la pieza actual
    this.dropCounter += dt;
    if (this.dropCounter >= this.dropInterval) {
      this.dropCounter = 0;
      if (!this.collide(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
      } else {
        this.lockPiece();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.0;
      ft.alpha -= 0.022;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  drawZombieBlock(context, x, y, size, color, infectionInfo = null, isGhost = false) {
    context.save();
    if (isGhost) {
      context.strokeStyle = '#39ff14';
      context.lineWidth = 2;
      context.strokeRect(x + 2, y + 2, size - 4, size - 4);
      context.fillStyle = 'rgba(57, 255, 20, 0.14)';
      context.fillRect(x + 2, y + 2, size - 4, size - 4);
      context.restore();
      return;
    }

    context.fillStyle = color;
    context.shadowColor = infectionInfo ? '#39ff14' : color;
    context.shadowBlur = infectionInfo ? 14 : 6;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Bisel tóxico
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(233, 255, 219, 0.28)';
    context.fillRect(x + 3, y + 3, size - 6, 3);

    // Si es un cuadradito infectado, dibujar espora pulsante y cuenta regresiva
    if (infectionInfo) {
      const secLeft = Math.max(1, Math.ceil(infectionInfo.timerMs / 1000));
      const urgent = secLeft <= 6;
      const pulse = 0.5 + 0.5 * Math.sin(this.pulseClock * (urgent ? 0.018 : 0.007));

      // Núcleo oscuro bio-zombie
      context.fillStyle = urgent
        ? `rgba(85, 20, 10, ${0.72 + pulse * 0.25})`
        : `rgba(8, 28, 12, ${0.72 + pulse * 0.2})`;
      context.fillRect(x + 3, y + 3, size - 6, size - 6);

      // Borde radiactivo pulsante
      context.strokeStyle = urgent ? '#ffbe0b' : '#39ff14';
      context.lineWidth = 2;
      context.strokeRect(x + 2, y + 2, size - 4, size - 4);

      // Número de cuenta regresiva
      context.fillStyle = urgent ? '#ffbe0b' : '#39ff14';
      context.font = '900 11px Orbitron';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${secLeft}s`, x + size / 2, y + size / 2 + 1);
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
          this.drawZombieBlock(context, startX + c * size, startY + r * size, size, color);
        }
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boardW = this.cols * this.cellSize;
    const boardH = this.rows * this.cellSize;

    // Fondo estilo laboratorio zombie / pantano radiactivo
    ctx.save();
    ctx.fillStyle = '#061209';
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.55)';
    ctx.lineWidth = 2;
    ctx.fillRect(this.offsetX, this.offsetY, boardW, boardH);
    ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, boardW + 4, boardH + 4);

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.06)';
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

    // Celdas fijadas en el tablero
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell) {
          this.drawZombieBlock(
            ctx,
            this.offsetX + c * this.cellSize,
            this.offsetY + r * this.cellSize,
            this.cellSize,
            cell.color,
            cell.infected ? cell : null,
            false
          );
        }
      }
    }

    // Sombra fantasma y pieza activa
    if (this.piece && !this.gameOver) {
      const ghostY = this.getGhostY();
      const { matrix, infectedMap, x, y, color } = this.piece;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            this.drawZombieBlock(
              ctx,
              this.offsetX + (x + c) * this.cellSize,
              this.offsetY + (ghostY + r) * this.cellSize,
              this.cellSize,
              color,
              null,
              true
            );
            this.drawZombieBlock(
              ctx,
              this.offsetX + (x + c) * this.cellSize,
              this.offsetY + (y + r) * this.cellSize,
              this.cellSize,
              color,
              infectedMap[r][c],
              false
            );
          }
        }
      }
    }

    // Partículas ácidas
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }

    // Textos flotantes de purga o explosión
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 13px Orbitron';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  syncUI() {
    setHighScore('infected', this.score);
    scoreValueEl.textContent = this.score.toLocaleString();
    highScoreValueEl.textContent = getHighScore('infected').toLocaleString();
    metaValue1El.textContent = `NVL ${this.level}`;
    metaValue2El.textContent = `${this.countActiveInfected()} ☣️`;
    updateHUD(this.score, 'BIO-NVL', this.level);
  }
}

// ============================================================================
// JUEGO 3: SNAKE (NEON VIPER)
// ============================================================================
class SnakeGame {
  constructor() {
    this.cols = 22;
    this.rows = 30;
    this.cellSize = 20;
    this.offsetX = Math.floor((canvas.width - this.cols * this.cellSize) / 2);
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

      const ratio = Math.max(0, this.bonusFood.timer / this.bonusFood.maxTimer);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 10, by - 14, 20, 4);
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(bx - 10, by - 14, 20 * ratio, 4);
      ctx.restore();
    }

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
    updateHUD(this.score, 'VEL', `${this.speedLevel}x`);
  }
}

// ============================================================================
// JUEGO 4: TURBO 2D (HIGHWAY DRIFT)
// ============================================================================
class RacerGame {
  constructor() {
    this.roadWidth = 320;
    this.roadLeft = Math.floor((canvas.width - this.roadWidth) / 2);
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

    const steerSpeed = 310;
    if (this.keys.left) this.player.x -= steerSpeed * sec;
    if (this.keys.right) this.player.x += steerSpeed * sec;
    this.player.x = Math.max(
      this.roadLeft + 6,
      Math.min(this.roadRight - this.player.w - 6, this.player.x)
    );

    this.roadOffset = (this.roadOffset + this.player.speed * sec) % 60;
    this.distance += (this.player.speed * sec) / 120;
    this.score += Math.round((this.player.speed * sec) * (usingNitro ? 0.14 : 0.08));

    for (const item of this.scenery) {
      item.y += this.player.speed * sec;
      if (item.y > canvas.height + 30) {
        item.y = -40;
      }
    }

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

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const relSpeed = this.player.speed - e.speed;
      e.y += relSpeed * sec;

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
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = isPlayer ? 16 : 10;

    ctx.fillStyle = '#05070f';
    ctx.fillRect(x - 3, y + 10, 4, 15);
    ctx.fillRect(x + w - 1, y + 10, 4, 15);
    ctx.fillRect(x - 3, y + h - 25, 4, 15);
    ctx.fillRect(x + w - 1, y + h - 25, 4, 15);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#091024';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + h * 0.24, w - 12, h * 0.44, 5);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + w / 2 - 2, y + 4, 4, h - 8);

    ctx.fillStyle = '#e0fbfc';
    ctx.fillRect(x + 5, y + 2, 7, 4);
    ctx.fillRect(x + w - 12, y + 2, 7, 4);
    ctx.restore();
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const item of this.scenery) {
      const sx = item.side === 'left' ? 35 : canvas.width - 35;
      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, item.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#0d1326';
    ctx.fillRect(this.roadLeft, 0, this.roadWidth, canvas.height);

    const curbH = 30;
    for (let y = -curbH + (this.roadOffset % (curbH * 2)); y < canvas.height; y += curbH) {
      const isAlt = Math.floor((y - this.roadOffset) / curbH) % 2 === 0;
      ctx.fillStyle = isAlt ? '#ff2a85' : '#00f0ff';
      ctx.fillRect(this.roadLeft - 8, y, 8, curbH);
      ctx.fillRect(this.roadRight, y, 8, curbH);
    }

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

    for (const e of this.enemies) {
      this.drawCar(e.x, e.y, e.w, e.h, e.color, false);
    }

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

    const blink = this.player.invulnerableTimer > 0 && Math.floor(this.player.invulnerableTimer / 90) % 2 === 0;
    if (!blink) {
      this.drawCar(this.player.x, this.player.y, this.player.w, this.player.h, '#00f0ff', true);
    }

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
    updateHUD(this.score, 'KM/H', kmh);

    const nitroPct = Math.round(this.nitro);
    nitroPercentEl.textContent = `${nitroPct}%`;
    nitroBarEl.style.width = `${nitroPct}%`;

    shieldPercentEl.textContent = `${this.player.shields} / 3`;
    shieldBarEl.style.width = `${(this.player.shields / 3) * 100}%`;
  }
}

// ============================================================================
// CONTROLADOR PRINCIPAL DEL ARCADE Y BOTONES DE PAUSA / PANTALLA COMPLETA
// ============================================================================
const games = {
  tetris: new TetrisGame(),
  infected: new TetrisInfectedGame(),
  snake: new SnakeGame(),
  racer: new RacerGame()
};

let activeGameKey = 'tetris';
let isRunning = false;
let isPaused = false;
let lastTime = performance.now();

function syncPauseButtonsUI() {
  if (!isRunning) {
    startPauseBtn.textContent = '▶ INICIAR PARTIDA';
    dedicatedPauseBtn.textContent = '⏸ PAUSA';
    hudPauseBtn.textContent = '⏸ PAUSA';
    mobilePauseBtn.textContent = '⏸ PAUSA';
  } else if (isPaused) {
    startPauseBtn.textContent = '▶ REANUDAR';
    dedicatedPauseBtn.textContent = '▶ REANUDAR';
    hudPauseBtn.textContent = '▶ REANUDAR';
    mobilePauseBtn.textContent = '▶ REANUDAR';
  } else {
    startPauseBtn.textContent = '⏸ PAUSAR';
    dedicatedPauseBtn.textContent = '⏸ PAUSA';
    hudPauseBtn.textContent = '⏸ PAUSA';
    mobilePauseBtn.textContent = '⏸ PAUSA';
  }
}

if (tetrisWideToggle) {
  tetrisWideToggle.addEventListener('change', () => {
    const isWide = tetrisWideToggle.checked;
    GAME_META.tetris.title = isWide ? 'TETRIS // MODO ANCHO +50%' : 'TETRIS // MODO CLÁSICO';
    if (activeGameKey === 'tetris' || activeGameKey === 'infected') {
      gameTitleEl.textContent = GAME_META[activeGameKey].title;
      isRunning = false;
      isPaused = false;
      games[activeGameKey].reset();
      games[activeGameKey].draw();
      showOverlay('MODO ACTUALIZADO', GAME_META[activeGameKey].title, 'Pulsa el botón o toca la pantalla para comenzar', '▶ JUGAR AHORA', false);
      syncPauseButtonsUI();
    }
  });
}

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

  const isZombie = gameKey === 'infected';
  canvasFrame.classList.toggle('infected-theme', isZombie);
  gameThemeDot.className = isZombie ? 'dot zombie' : 'dot cyan';

  const isAnyTetris = gameKey === 'tetris' || gameKey === 'infected';
  tetrisExtrasEl.classList.toggle('hidden', !isAnyTetris);
  infectedLegendEl.classList.toggle('hidden', !isZombie);
  snakeExtrasEl.classList.toggle('hidden', gameKey !== 'snake');
  racerExtrasEl.classList.toggle('hidden', gameKey !== 'racer');

  controlsListEl.innerHTML = meta.controls
    .map(([k, desc]) => `<li><kbd>${k}</kbd> <span>${desc}</span></li>`)
    .join('');

  games[gameKey].reset();
  games[gameKey].draw();

  showOverlay('LISTO PARA JUGAR', meta.title, 'Pulsa el botón, presiona ENTER o toca la pantalla', '▶ JUGAR AHORA', false);
  syncPauseButtonsUI();
}

function showOverlay(badge, title, subtitle, btnText, showRestart = false) {
  overlayBadge.textContent = badge;
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  overlayActionBtn.textContent = btnText;
  overlayRestartBtn.classList.toggle('hidden', !showRestart);
  canvasOverlay.classList.remove('hidden');
}

function hideOverlay() {
  canvasOverlay.classList.add('hidden');
}

function startOrPauseGame() {
  if (isWelcomeModalOpen()) return;
  const current = games[activeGameKey];
  if (current.gameOver) {
    current.reset();
    isRunning = true;
    isPaused = false;
    hideOverlay();
    syncPauseButtonsUI();
    return;
  }

  if (!isRunning) {
    isRunning = true;
    isPaused = false;
    hideOverlay();
  } else if (!isPaused) {
    isPaused = true;
    showOverlay('JUEGO EN PAUSA', GAME_META[activeGameKey].title, 'Partida en pausa. Puedes reanudar o reiniciar.', '▶ REANUDAR PARTIDA', true);
  } else {
    isPaused = false;
    hideOverlay();
  }
  syncPauseButtonsUI();
}

function togglePauseOnly() {
  if (isWelcomeModalOpen()) return;
  if (!isRunning) {
    startOrPauseGame();
    return;
  }
  isPaused = !isPaused;
  if (isPaused) {
    showOverlay('JUEGO EN PAUSA', GAME_META[activeGameKey].title, 'Partida en pausa. Puedes reanudar o reiniciar.', '▶ REANUDAR PARTIDA', true);
  } else {
    hideOverlay();
  }
  syncPauseButtonsUI();
}

function restartActiveGame() {
  if (isWelcomeModalOpen()) return;
  const current = games[activeGameKey];
  current.reset();
  isRunning = true;
  isPaused = false;
  hideOverlay();
  syncPauseButtonsUI();
}

function triggerGameOver(finalScore) {
  isRunning = false;
  isPaused = false;
  syncPauseButtonsUI();
  startPauseBtn.textContent = '▶ NUEVA PARTIDA';
  showOverlay(
    'FIN DE LA PARTIDA',
    `${currentPlayer.name}: ${finalScore.toLocaleString()} PTS`,
    '¿Listo para superar tu récord en el Salón de la Fama?',
    '▶ JUGAR DE NUEVO',
    false
  );
}

// Modo Pantalla Completa (Nativo + Fallback CSS para móviles)
function toggleFullscreen() {
  const isNativeFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const isPseudoFull = stageContainer.classList.contains('pseudo-fullscreen');

  if (!isNativeFull && !isPseudoFull) {
    if (stageContainer.requestFullscreen) {
      stageContainer.requestFullscreen().catch(() => {
        stageContainer.classList.add('pseudo-fullscreen');
        updateFullscreenBtnUI();
      });
    } else if (stageContainer.webkitRequestFullscreen) {
      stageContainer.webkitRequestFullscreen();
    } else {
      stageContainer.classList.add('pseudo-fullscreen');
    }
  } else {
    if (isNativeFull) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    stageContainer.classList.remove('pseudo-fullscreen');
  }
  setTimeout(updateFullscreenBtnUI, 100);
}

function updateFullscreenBtnUI() {
  const active = Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    stageContainer.classList.contains('pseudo-fullscreen')
  );
  fullscreenBtn.textContent = active ? '✕ SALIR PANTALLA COMPLETA' : '⛶ PANTALLA COMPLETA';
}

document.addEventListener('fullscreenchange', updateFullscreenBtnUI);
document.addEventListener('webkitfullscreenchange', updateFullscreenBtnUI);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Eventos de botones de acción y pausa
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchGame(btn.dataset.game));
});

startPauseBtn.addEventListener('click', startOrPauseGame);
dedicatedPauseBtn.addEventListener('click', togglePauseOnly);
hudPauseBtn.addEventListener('click', togglePauseOnly);
mobilePauseBtn.addEventListener('click', togglePauseOnly);
overlayActionBtn.addEventListener('click', startOrPauseGame);
overlayRestartBtn.addEventListener('click', restartActiveGame);
restartBtn.addEventListener('click', restartActiveGame);

// Eventos de teclado
window.addEventListener('keydown', e => {
  if (isWelcomeModalOpen() || document.activeElement === usernameInput) {
    return;
  }

  const blockedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  if (blockedKeys.includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === 'Enter' && (!isRunning || isPaused)) {
    startOrPauseGame();
    return;
  }

  if (e.code === 'KeyP') {
    togglePauseOnly();
    return;
  }

  if (isRunning && !isPaused) {
    games[activeGameKey].handleKeyDown(e.code);
  }
});

window.addEventListener('keyup', e => {
  if (isWelcomeModalOpen()) return;
  const current = games[activeGameKey];
  if (current.handleKeyUp) {
    current.handleKeyUp(e.code);
  }
});

// ============================================================================
// TOQUES DIRECTOS EN LA PANTALLA (SOBRE EL CANVAS)
// Arriba: Rotar/Arriba | Abajo: Caer Rápido/Abajo | Izquierda: Izq | Derecha: Der
// ============================================================================
let activeCanvasTouchKey = null;

function flashTouchZone(zoneEl) {
  if (!zoneEl) return;
  zoneEl.classList.add('active-flash');
  setTimeout(() => zoneEl.classList.remove('active-flash'), 170);
}

function getScreenZoneAction(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;

  // Zona superior (26% superior): Rotar / Ir arriba
  if (ny < 0.26) {
    flashTouchZone(tzTop);
    return 'ArrowUp';
  }
  // Zona inferior (26% inferior): Caer rápido (Hard Drop en Tetris) / Ir abajo
  if (ny > 0.74) {
    flashTouchZone(tzBottom);
    const isAnyTetris = activeGameKey === 'tetris' || activeGameKey === 'infected';
    return isAnyTetris ? 'Space' : 'ArrowDown';
  }
  // Mitad izquierda vs mitad derecha
  if (nx < 0.5) {
    flashTouchZone(tzLeft);
    return 'ArrowLeft';
  } else {
    flashTouchZone(tzRight);
    return 'ArrowRight';
  }
}

canvas.addEventListener('pointerdown', e => {
  if (isWelcomeModalOpen()) return;
  if (!isRunning || isPaused) return;
  e.preventDefault();

  const key = getScreenZoneAction(e.clientX, e.clientY);
  activeCanvasTouchKey = key;
  games[activeGameKey].handleKeyDown(key);
});

window.addEventListener('pointerup', () => {
  if (activeCanvasTouchKey) {
    const current = games[activeGameKey];
    if (current.handleKeyUp) {
      current.handleKeyUp(activeCanvasTouchKey);
    }
    activeCanvasTouchKey = null;
  }
});

// Controles táctiles de la botonera inferior
document.querySelectorAll('.touch-btn[data-key]').forEach(btn => {
  const key = btn.dataset.key;
  const press = e => {
    e.preventDefault();
    if (isWelcomeModalOpen()) return;
    if (!isRunning || isPaused) {
      startOrPauseGame();
      return;
    }
    games[activeGameKey].handleKeyDown(key);
  };
  const release = e => {
    e.preventDefault();
    if (isWelcomeModalOpen()) return;
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
  if (isRunning && !isPaused && !isWelcomeModalOpen()) {
    current.update(dt);
  }
  current.draw();

  requestAnimationFrame(gameLoop);
}

// Inicialización
loadSavedProfile();
updateLeaderboardUI();
switchGame('tetris');
requestAnimationFrame(gameLoop);
