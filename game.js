// ═══════════════════════════════════════════════════════════════
//  SAVARI GIRI GIRI — Game Engine
//  Kerala Auto-Rickshaw Arcade · Thrissur ⇄ Ernakulam (NH 544)
// ═══════════════════════════════════════════════════════════════

/* ────────────────────────────
   ROAD LAYOUT (drives on LEFT)
   ──────────────────────────── 
   x: -7 ─────── -0.4 | 0.4 ─────── 7
       Player Lanes     Med.   Oncoming Lanes
       Lane1=-5  Lane2=-2.2       Lane1=2.2  Lane2=5
*/

// ─── CONSTANTS ───
const AI_ROAST_URL = '/api/roast'; // Same-origin Vercel function (works in prod and `vercel dev`)

const ROAD = {
  totalWidth: 16,
  halfWidth: 8,
  playerLanes: [-5, -2.2],
  oncomingLanes: [2.2, 5],
  medianX: 0,
  medianWidth: 0.8,
  boundaryLeft: -8.5,
  boundaryRight: 7.5,
  cashLaneX: -3.6,
};

// ─── ZONES (each has day + dusk + night sky for time-based blending) ───
const ZONES = [
  // 0 – Thrissur City  (dawn, ~6–7 AM)
  { name: 'Thrissur City',      subtitle: 'Departing Thrissur',
    fogColor: 0x4a6a8a, skyTop: 0x1a3a6a, skyBot: 0x7a9aaa, groundColor: 0x2a4a2a,
    ambientColor: 0xffddbb, ambientInt: 0.55, fogDensity: 0.010, neonBrightness: 0.0 },
  // 1 – Paliyekkara Toll  (~7:30 AM – morning gold)
  { name: 'Paliyekkara Toll',   subtitle: 'Toll plaza — slow down!',
    fogColor: 0x6a7a5a, skyTop: 0x2a5a8a, skyBot: 0x9abaaa, groundColor: 0x2a4a1a,
    ambientColor: 0xffeecc, ambientInt: 0.65, fogDensity: 0.009, neonBrightness: 0.0 },
  // 2 – Chalakudy & Koratty  (~9 AM – bright day)
  { name: 'Chalakudy & Koratty', subtitle: 'Highway cruising',
    fogColor: 0x8ab0c0, skyTop: 0x4a8acc, skyBot: 0xaad4e8, groundColor: 0x2a5a1a,
    ambientColor: 0xffffff, ambientInt: 0.85, fogDensity: 0.008, neonBrightness: 0.0 },
  // 3 – Angamaly & Aluva  (~11 AM – midday glare)
  { name: 'Angamaly & Aluva',   subtitle: 'Approaching airport',
    fogColor: 0x9abac8, skyTop: 0x5a9ada, skyBot: 0xbadcf0, groundColor: 0x3a5a20,
    ambientColor: 0xffffff, ambientInt: 1.0,  fogDensity: 0.007, neonBrightness: 0.0 },
  // 4 – Kalamassery  (~2 PM – golden afternoon)
  { name: 'Kalamassery',         subtitle: 'Industrial & university area',
    fogColor: 0xd08060, skyTop: 0xb06040, skyBot: 0xffa060, groundColor: 0x4a3a1a,
    ambientColor: 0xffcc88, ambientInt: 0.80, fogDensity: 0.009, neonBrightness: 0.1 },
  // 5 – Ernakulam City  (~5:30 PM – dusk + city lights)
  { name: 'Ernakulam City',      subtitle: 'Destination approach',
    fogColor: 0x201828, skyTop: 0x100820, skyBot: 0x301840, groundColor: 0x0a0a14,
    ambientColor: 0x6688cc, ambientInt: 0.45, fogDensity: 0.013, neonBrightness: 0.8 },
];

// Reverse route zones (Ernakulam -> Thrissur northbound)
const REVERSE_ZONES = [
  // 0 – Ernakulam City  (Morning departure from Kochi)
  { name: 'Ernakulam City',      subtitle: 'Departing Kochi via Edappally',
    fogColor: 0x201828, skyTop: 0x181028, skyBot: 0x382048, groundColor: 0x0e0e18,
    ambientColor: 0x7799dd, ambientInt: 0.55, fogDensity: 0.012, neonBrightness: 0.7 },
  // 1 – Kalamassery
  { name: 'Kalamassery',         subtitle: 'Metro corridor & industrial belt',
    fogColor: 0xd08060, skyTop: 0xb06040, skyBot: 0xffa060, groundColor: 0x4a3a1a,
    ambientColor: 0xffcc88, ambientInt: 0.75, fogDensity: 0.009, neonBrightness: 0.1 },
  // 2 – Angamaly & Aluva
  { name: 'Angamaly & Aluva',   subtitle: 'Periyar river & Airport corridor',
    fogColor: 0x9abac8, skyTop: 0x5a9ada, skyBot: 0xbadcf0, groundColor: 0x3a5a20,
    ambientColor: 0xffffff, ambientInt: 0.95,  fogDensity: 0.007, neonBrightness: 0.0 },
  // 3 – Chalakudy & Koratty
  { name: 'Chalakudy & Koratty', subtitle: 'Lush greenery & cruising highway',
    fogColor: 0x8ab0c0, skyTop: 0x4a8acc, skyBot: 0xaad4e8, groundColor: 0x2a5a1a,
    ambientColor: 0xffffff, ambientInt: 0.85, fogDensity: 0.008, neonBrightness: 0.0 },
  // 4 – Paliyekkara Toll
  { name: 'Paliyekkara Toll',   subtitle: 'Toll plaza northbound — FASTag ready',
    fogColor: 0x6a7a5a, skyTop: 0x2a5a8a, skyBot: 0x9abaaa, groundColor: 0x2a4a1a,
    ambientColor: 0xffeecc, ambientInt: 0.65, fogDensity: 0.009, neonBrightness: 0.0 },
  // 5 – Thrissur City
  { name: 'Thrissur City',      subtitle: 'Cultural capital & Swaraj Round arrival',
    fogColor: 0x4a6a8a, skyTop: 0x1a3a6a, skyBot: 0x7a9aaa, groundColor: 0x2a4a2a,
    ambientColor: 0xffddbb, ambientInt: 0.60, fogDensity: 0.010, neonBrightness: 0.0 },
];

function getActiveZones() {
  return S.route === 'reverse' ? REVERSE_ZONES : ZONES;
}

const ZONE_BOUNDARIES = [600, 1600, 3200, 4400, 5200];

// ─── DAY/NIGHT CONFIG ───
// Game time: starts at 06:00, advances ~4 min of real highway time per zone
// Total journey = ~83 km, ~90 min drive → mapped to game distance
const DAY_START_HOUR = 6.0;    // 6:00 AM
const DAY_END_HOUR   = 18.0;   // 6:00 PM (1 full day cycle over the full journey)
const GAME_DIST_TOTAL = 5800;  // approx total distance units

// ─── GAME STATE ───
const S = {
  started: false,
  over: false,
  score: 0,
  highScore: parseInt(localStorage.getItem('savariHS') || '0'),
  velocity: 0,
  maxVelocity: 0.75,
  braking: 0.04,
  friction: 0.006,
  speed: 0,

  // gear system
  gear: 1,
  maxGear: 4,
  gearAccel: [0, 0.008, 0.005, 0.003, 0.002],
  gearFloor: [0, 0, 0.25, 0.50, 0.75],
  gearCeil: [0, 0.30, 0.55, 0.78, 1.0],
  gearChangeCooldown: 0,
  junctionApproachDist: null,
  curveAmplitudeCurrent: 2.0,
  curveAmplitudeTarget: 2.0,
  gridlockTimeoutId: null,

  playerX: -3.5,
  playerTargetX: -3.5,
  steerSpeed: 0.11,
  baseSteerSpeed: 0.11,

  // flying & physics dynamics
  isFlying: false,
  flyTimer: 0,
  flyDuration: 3.5,
  flyHeight: 6,
  verticalVelocity: 0,
  chassisRoll: 0,
  chassisPitch: 0,
  lastBrakeSoundTime: 0,
  boostMeter: 0,
  boostMax: 100,
  boostReady: false,

  // savari (customer)
  hasCustomer: false,
  customerMultiplier: 2,
  savariSteerPenalty: 0.7, // 30% slower
  autoRent: 250,           // Daily auto rent deficit (starts at -₹250)
  goal: 800,               // Daily income goal
  todayNet: -250,          // Net earnings: fareTotal - autoRent
  currentTripFare: 30,     // Current trip live fare on meter (starts at ₹30 minimum fare)
  tripStartDist: 0,
  tripStartTime: 0,
  activePassenger: {
    name: 'Varghese',
    rating: '4.3 ★',
    dest: 'Boat Jetty · ബോട്ട് ജെട്ടി'
  },

  // gridlock
  gridlockTimer: 0,
  gridlockInterval: 48,  // seconds between gridlocks
  gridlockWarning: false,
  gridlockActive: false,

  // spawning
  obstacleTimer: 0,
  oncomingTimer: 0,
  coinTimer: 0,
  potholeTimer: 0,
  signTimer: 0,
  savariPickupTimer: 0,

  // tracking
  distanceTraveled: 0,
  distanceScore: 0,
  bonusScore: 0,
  fareTotal: 0,
  tripCount: 0,
  topSpeed: 0,
  currentZone: 0,
  gameTimeHour: DAY_START_HOUR,   // in-game hour (6.0 = 6:00 AM)
  route: 'forward',               // 'forward' | 'reverse'

  // object pools
  obstacles: [],
  oncomingVehicles: [],
  coins: [],
  metroPillars: [],
  signals: [],
  roadMarkings: [],
  roadSigns: [],
  buildings: [],
  palms: [],
  potholes: [],
  particles: [],
  pickupZones: [],
  dropoffZones: [],
  gridlockWalls: [],

  // map data
  waypoints: [],
  nextWaypointIndex: 0,
  activeTrafficLight: null,
  activeJunctionAssets: [],
  activeTollBooth: null,
  crossTraffic: [],
  totalJourneyDistance: 0,
};

// ─── DOM REFS ───
const DOM = {
  scoreValue: document.getElementById('hud-net'),
  zoneName: document.getElementById('zone-name'),
  boostInner: document.getElementById('boost-bar-inner'),
  boostReady: document.getElementById('boost-ready'),
  flyingIndicator: document.getElementById('flying-indicator'),
  zoneTransition: document.getElementById('zone-transition'),
  zoneTransTitle: document.getElementById('zone-trans-title'),
  zoneTransSub: document.getElementById('zone-trans-subtitle'),
  startScreen: document.getElementById('start-screen'),
  gameOver: document.getElementById('game-over'),
  gameOverZone: document.getElementById('gameover-zone'),
  gameOverScore: document.getElementById('gameover-score'),
  gameOverHS: document.getElementById('gameover-highscore'),
  speedLines: document.getElementById('speed-lines'),
  gridlockWarn: document.getElementById('gridlock-warning'),
  oncomingWarn: document.getElementById('oncoming-warning'),
  savariStatus: document.getElementById('savari-status'),
  multBadge: document.getElementById('multiplier-badge'),
  // HUD Elements
  hudClock: document.getElementById('hud-clock'),
  hudTimeIcon: document.getElementById('hud-time-icon'),
  minimapZoneLabel: document.getElementById('minimap-zone-label'),
  hudFares: document.getElementById('hud-fares'),
  hudTrips: document.getElementById('hud-trips'),
  hudGoal: document.getElementById('hud-goal'),
  hudNet: document.getElementById('hud-net'),
  hudSub: document.getElementById('hud-sub'),
  hudGoalFill: document.getElementById('hud-goal-fill'),
  // Fare Meter
  meterFlag: document.getElementById('meter-flag'),
  meterFare: document.getElementById('meter-fare'),
  meterKm: document.getElementById('meter-km'),
  meterTime: document.getElementById('meter-time'),
  gearValue: document.getElementById('gear-value'),
  // Speedometer
  speedoNeedle: document.getElementById('speedo-needle-group'),
  speedoArc: document.getElementById('speedo-arc'),
  speedoNum: document.getElementById('speedo-num'),
  speedoStatus: document.getElementById('speedo-road-status'),
  radioStation: document.getElementById('radio-station'),
  // Mounted Smartphone
  rideCard: document.getElementById('ride-card'),
  rideAvatar: document.getElementById('ride-avatar'),
  rideCardAction: document.getElementById('ride-card-action'),
  ridePassengerName: document.getElementById('ride-passenger-name'),
  ridePassengerMeta: document.getElementById('ride-passenger-meta'),
  rideDistance: document.getElementById('ride-distance'),
  rideDestText: document.getElementById('ride-destination-text'),
  journeyLabelStart: document.getElementById('journey-label-start'),
  journeyLabelEnd: document.getElementById('journey-label-end'),
  goDistance: document.getElementById('go-distance'),
  goFares: document.getElementById('go-fares'),
  goTopspeed: document.getElementById('go-topspeed'),
  goTrips: document.getElementById('go-trips'),
};

// ─── HELPER: Format clock from fractional hour ───
function formatClock(hour) {
  const h24 = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 60);
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ─── HELPER: Time-of-day icon ───
function getTimeIcon(hour) {
  const h = hour % 24;
  if (h < 6)  return '🌙';
  if (h < 8)  return '🌅';
  if (h < 17) return '☀️';
  if (h < 19) return '🌇';
  return '🌙';
}

// ─── HELPER: Speedo arc path (SVG arc on 100x100 viewBox) ───
function speedoArcPath(pct) {
  // Arc from ~225° to ~315° (bottom-left to bottom-right going clockwise)
  // Start angle: 225° (220 deg), sweep: 250°
  const startAngle = (225 * Math.PI) / 180;
  const sweepAngle = (250 * Math.PI) / 180;
  const endAngle = startAngle + sweepAngle * Math.min(pct, 0.999);
  const cx = 50, cy = 50, r = 36;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = sweepAngle * pct > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// ═══════════════════════════════════════════
//  SOUND ENGINE (Pure Web Audio API Synthesizer)
// ═══════════════════════════════════════════
const SoundEngine = {
  ctx: null,
  isMuted: false,
  engineSource: null,
  engineGain: null,
  engineFilter: null,
  isEngineRunning: false,
  hasInitialized: false,

  init() {
    if (this.hasInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.hasInitialized = true;
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
    }
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(this.isMuted ? 0.0001 : 0.2, t, 0.05);
    }
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      btn.textContent = this.isMuted ? '🔇' : '🔊';
      btn.classList.toggle('muted', this.isMuted);
    }
    return this.isMuted;
  },

  startEngine() {
    this.resume();
    if (!this.ctx || this.isEngineRunning) return;
    try {
      const t = this.ctx.currentTime;
      const sr = this.ctx.sampleRate;

      // Authentic 2-Stroke Kerala Auto Rickshaw Engine (Single Cylinder Impulse Synth)
      // Multi-stroke loop buffer (~0.36s with 5 rhythmic, slightly irregular 2-stroke pulses)
      // Matches the iconic Bajaj / Piaggio 145cc "putt-putt-putt" / "phat-phat-phat" loping idle
      const bufferLength = Math.floor(sr * 0.360);
      const strokeBuffer = this.ctx.createBuffer(1, bufferLength, sr);
      const data = strokeBuffer.getChannelData(0);

      // Pulse start times in seconds (signature uneven 2-stroke idle timing: pop... pop-pop... pop...)
      const pulseOffsets = [0.000, 0.072, 0.144, 0.218, 0.290];
      const pulseStrengths = [1.0, 0.85, 0.95, 0.80, 0.92];

      for (let i = 0; i < bufferLength; i++) {
        const tBuf = i / sr;
        let sample = 0;

        for (let p = 0; p < pulseOffsets.length; p++) {
          const tP = tBuf - pulseOffsets[p];
          if (tP >= 0 && tP < 0.065) {
            const str = pulseStrengths[p];
            // 1. Initial sharp exhaust port pressure pop (< 1.5ms)
            let pop = 0;
            if (tP < 0.0015) {
              pop = Math.sin((tP / 0.0015) * Math.PI) * 0.95 * str;
            }
            // 2. Hollow Kerala auto muffler expansion cavity resonance (~130-150 Hz with decay)
            const cavity = Math.sin(2 * Math.PI * 138 * tP) * Math.exp(-tP * 75) * 0.72 * str;
            // 3. Deep 2-stroke cylinder volume thump (~52 Hz)
            const thump = Math.sin(2 * Math.PI * 52 * tP) * Math.exp(-tP * 48) * 0.65 * str;
            // 4. Loose air-cooled cylinder fin / tin rattle (< 4ms)
            const rattle = (Math.random() * 2 - 1) * Math.exp(-tP * 550) * 0.18 * str;

            sample += pop + cavity + thump + rattle;
          }
        }
        data[i] = Math.tanh(sample * 1.3) * 0.52;
      }

      // Master engine gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0001, t);
      this.engineGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.0001 : 0.24, t + 0.2);

      // Resonant Kerala auto muffler acoustic lowpass filter
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(270, t);
      this.engineFilter.Q.setValueAtTime(2.2, t);

      // Looping pulse buffer source node
      this.engineSource = this.ctx.createBufferSource();
      this.engineSource.buffer = strokeBuffer;
      this.engineSource.loop = true;
      this.engineSource.playbackRate.setValueAtTime(1.0, t);

      this.engineSource.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineSource.start(t);
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Engine sound error:', e);
    }
  },

  updateEngine(velocity, maxVelocity, isAccelerating) {
    if (!this.isEngineRunning || !this.engineSource || !this.ctx) return;
    try {
      const normSpeed = Math.min(Math.max(velocity / maxVelocity, 0), 1);
      // Playback rate: 1.0 at idle (chug chug) -> 1.70 at top speed (Bajaj 2-stroke purr, never a bike whine!)
      const targetRate = 1.0 + normSpeed * 0.70 + (isAccelerating ? 0.08 : 0);
      // Filter stays in the deep throaty 270Hz - 360Hz range
      const targetCutoff = 270 + normSpeed * 100 + (isAccelerating ? 40 : 0);
      const targetVol = this.isMuted ? 0.0001 : (0.20 + normSpeed * 0.10 + (isAccelerating ? 0.04 : 0));

      const t = this.ctx.currentTime;
      this.engineSource.playbackRate.setTargetAtTime(targetRate, t, 0.08);
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, t, 0.08);
      this.engineGain.gain.setTargetAtTime(targetVol, t, 0.08);
    } catch (e) {}
  },

  playHorn() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Authentic Kerala auto dual-tone horn (440Hz A4 + 554Hz C#5)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, t);
      osc2.frequency.setValueAtTime(554, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(980, t);
      filter.Q.setValueAtTime(2.0, t);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.32);
      osc2.stop(t + 0.32);
    } catch (e) {}
  },

  playBrake() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.frequency.exponentialRampToValueAtTime(950, t + 0.22);
      filter.Q.setValueAtTime(5.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.22);
    } catch (e) {}
  },

  playCoin() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(988, t);
      osc.frequency.setValueAtTime(1318, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  },

  playPickup() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch (e) {}
  },

  playDropoff() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {}
  },

  playBoost() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.5);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.1);
    } catch (e) {}
  },

  playTollBeep() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [
        { freq: 1400, start: 0, dur: 0.06 },
        { freq: 2100, start: 0.08, dur: 0.09 }
      ].forEach(b => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(b.freq, t + b.start);
        gain.gain.setValueAtTime(0.25, t + b.start);
        gain.gain.exponentialRampToValueAtTime(0.001, t + b.start + b.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + b.start);
        osc.stop(t + b.start + b.dur);
      });
    } catch (e) {}
  },

  playCrash() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.5);
      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.4);
    } catch (e) {}
  },

  playLanding() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.16);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  },

  stopEngine() {
    if (this.engineGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(0.0001, t, 0.08);
        setTimeout(() => {
          if (this.engineSource) {
            try { this.engineSource.stop(); this.engineSource.disconnect(); } catch (e) {}
            this.engineSource = null;
          }
          this.isEngineRunning = false;
        }, 100);
      } catch (e) {
        this.isEngineRunning = false;
      }
    }
  }
};

// ═══════════════════════════════════════════
//  THREE.JS SETUP
// ═══════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(ZONES[0].fogColor, ZONES[0].fogDensity);
scene.background = new THREE.Color(ZONES[0].skyTop);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(-3.5, 5.8, 9);
camera.lookAt(-3.5, 1, -12);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
document.body.appendChild(renderer.domElement);

// ─── LIGHTING ───
const ambientLight = new THREE.AmbientLight(ZONES[0].ambientColor, ZONES[0].ambientInt);
scene.add(ambientLight);

// Sun / directional light — starts at dawn angle (low from the east)
const dirLight = new THREE.DirectionalLight(0xffeedd, 0.75);
dirLight.position.set(5, 18, 8);
dirLight.castShadow = true;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.02;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -25;
dirLight.shadow.camera.right = 25;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
scene.add(dirLight);

// Moon / fill light (visible at dusk/night)
const moonLight = new THREE.DirectionalLight(0x6688cc, 0.0);
moonLight.position.set(-10, 20, -15);
scene.add(moonLight);

// Street lights that scroll
const streetLights = [];
for (let i = 0; i < 3; i++) {
  const sl = new THREE.PointLight(0xffaa44, 0.5, 25);
  sl.position.set(i % 2 === 0 ? -ROAD.halfWidth - 2 : ROAD.halfWidth + 2, 7, -15 - i * 20);
  sl.userData.baseX = sl.position.x;
  scene.add(sl);
  streetLights.push(sl);
}

// ═══════════════════════════════════════════
//  WORLD BUILDING
// ═══════════════════════════════════════════

// ── Ground and Road Segments (Dynamic Curvature) ──
for (let z = 10; z > -270; z -= 10) {
  // Ground
  const gGeo = new THREE.PlaneGeometry(120, 10.5);
  const gMat = new THREE.MeshStandardMaterial({ color: 0x0d1a0f, roughness: 0.95 });
  const g = new THREE.Mesh(gGeo, gMat);
  g.rotation.x = -Math.PI / 2;
  g.position.set(0, -0.15, z);
  g.receiveShadow = true;
  g.userData.baseX = 0;
  g.userData.isLongSegment = true;
  scene.add(g);
  S.roadMarkings.push(g);

  // Road
  const rGeo = new THREE.PlaneGeometry(ROAD.totalWidth, 10.5);
  const rMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92, metalness: 0.05 });
  const r = new THREE.Mesh(rGeo, rMat);
  r.rotation.x = -Math.PI / 2;
  r.position.set(0, -0.01, z);
  r.receiveShadow = true;
  r.userData.baseX = 0;
  r.userData.isRoadSegment = true;
  scene.add(r);
  S.roadMarkings.push(r);

  // Grass strips
  const grGeo = new THREE.PlaneGeometry(8, 10.5);
  const grMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.95 });
  
  const gl = new THREE.Mesh(grGeo, grMat);
  gl.rotation.x = -Math.PI / 2;
  gl.position.set(-ROAD.halfWidth - 4, -0.005, z);
  gl.receiveShadow = true;
  gl.userData.baseX = -ROAD.halfWidth - 4;
  gl.userData.isLongSegment = true;
  scene.add(gl);
  S.roadMarkings.push(gl);

  const gr = new THREE.Mesh(grGeo, grMat);
  gr.rotation.x = -Math.PI / 2;
  gr.position.set(ROAD.halfWidth + 4, -0.005, z);
  gr.receiveShadow = true;
  gr.userData.baseX = ROAD.halfWidth + 4;
  gr.userData.isLongSegment = true;
  scene.add(gr);
  S.roadMarkings.push(gr);

  // Edge lines
  const eGeo = new THREE.PlaneGeometry(0.12, 10.5);
  const eMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
  
  const el = new THREE.Mesh(eGeo, eMat);
  el.rotation.x = -Math.PI / 2;
  el.position.set(-ROAD.halfWidth, 0.005, z);
  el.userData.baseX = -ROAD.halfWidth;
  el.userData.isLongSegment = true;
  scene.add(el);
  S.roadMarkings.push(el);

  const er = new THREE.Mesh(eGeo, eMat);
  er.rotation.x = -Math.PI / 2;
  er.position.set(ROAD.halfWidth, 0.005, z);
  er.userData.baseX = ROAD.halfWidth;
  er.userData.isLongSegment = true;
  scene.add(er);
  S.roadMarkings.push(er);
}

// ── Center Road Markings (Clean open asphalt highway matching Reference Screenshots) ──
for (let z = 10; z > -270; z -= 5) {
  const clGeo = new THREE.PlaneGeometry(0.14, 3.2);
  const clMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.9, transparent: true, side: THREE.DoubleSide });
  const cl = new THREE.Mesh(clGeo, clMat);
  cl.rotation.x = -Math.PI / 2;
  cl.position.set(ROAD.medianX, 0.007, z);
  cl.userData.baseX = cl.position.x;
  cl.userData.isLongSegment = true;
  scene.add(cl);
  S.roadMarkings.push(cl);
}

// ── Lane dashes ──
function makeDashes(x, opacity) {
  for (let z = 10; z > -280; z -= 4) {
    const geo = new THREE.PlaneGeometry(0.07, 1.8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity, transparent: true, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.004, z);
    m.userData.baseX = m.position.x;
    m.userData.isLongSegment = true;
    scene.add(m);
    S.roadMarkings.push(m);
  }
}
makeDashes(-3.6, 0.25);   // between player lanes
makeDashes(3.6, 0.20);    // between oncoming lanes

// ── Sidewalk & Alternating Yellow/Black Curb Stones (Kerala PWD style) ──
function makeCurb(x, side) {
  const curbStep = 1.6; // each curb block is 1.6m long
  for (let z = 10; z > -270; z -= curbStep) {
    const isYellow = Math.abs(Math.round(z / curbStep)) % 2 === 0;
    const curbGeo = new THREE.BoxGeometry(0.35, 0.28, curbStep - 0.02);
    const curbMat = new THREE.MeshStandardMaterial({
      color: isYellow ? 0xf5c518 : 0x181818,
      roughness: 0.85
    });
    const block = new THREE.Mesh(curbGeo, curbMat);
    block.position.set(x, 0.14, z);
    block.receiveShadow = true;
    block.userData.baseX = block.position.x;
    block.userData.isLongSegment = true;
    scene.add(block);
    S.roadMarkings.push(block);
  }

  // Sidewalk slab beside the curb
  for (let z = 10; z > -270; z -= 10) {
    const swGeo = new THREE.BoxGeometry(3.0, 0.18, 10.5);
    const swMat = new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 });
    const sw = new THREE.Mesh(swGeo, swMat);
    const swX = x + side * 1.6;
    sw.position.set(swX, 0.08, z);
    sw.receiveShadow = true;
    sw.userData.baseX = sw.position.x;
    sw.userData.isLongSegment = true;
    scene.add(sw);
    S.roadMarkings.push(sw);
  }
}

makeCurb(-ROAD.halfWidth - 0.2, -1);
makeCurb(ROAD.halfWidth + 0.2, 1);

// ── Utility Electricity Poles & Festive Buntings ──
function buildUtilityPolesAndBuntings() {
  const poleSpacing = 28;
  const buntColors = [0xe53935, 0xffeb3b, 0x43a047, 0x1e88e5, 0xffffff];

  for (let z = 10; z > -260; z -= poleSpacing) {
    [-1, 1].forEach(side => {
      const poleGroup = new THREE.Group();
      const px = side * (ROAD.halfWidth + 2.4);

      // Concrete utility pole (grey)
      const poleGeo = new THREE.BoxGeometry(0.24, 7.5, 0.24);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94918a, roughness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      poleGroup.add(pole);

      // Metal crossarm
      const armGeo = new THREE.BoxGeometry(side * 1.8, 0.12, 0.12);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(side * 0.7, 6.8, 0);
      poleGroup.add(arm);

      // Insulators
      [-0.4, 0.4].forEach(ox => {
        const insGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6);
        const insMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
        const ins = new THREE.Mesh(insGeo, insMat);
        ins.position.set(side * (0.7 + ox), 6.95, 0);
        poleGroup.add(ins);
      });

      poleGroup.position.set(px, 0, z);
      poleGroup.userData.baseX = px;
      poleGroup.userData.isLongSegment = true;
      scene.add(poleGroup);
      S.roadMarkings.push(poleGroup);
    });

    // Festive buntings (triangular flags) hanging along the road
    const buntGroup = new THREE.Group();
    const flagCount = 10;
    const startZ = z;
    const endZ = z - poleSpacing;
    const side = -1;
    const bx = side * (ROAD.halfWidth + 2.2);

    for (let f = 0; f < flagCount; f++) {
      const frac = f / flagCount;
      const fz = startZ + frac * (endZ - startZ);
      const sag = Math.sin(frac * Math.PI) * 0.45;
      const fy = 6.4 - sag;

      // Triangular bunting flag
      const flagGeo = new THREE.ConeGeometry(0.18, 0.35, 3);
      const flagMat = new THREE.MeshBasicMaterial({
        color: buntColors[f % buntColors.length],
        side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.rotation.x = Math.PI; // point downward
      flag.position.set(bx, fy, fz);
      buntGroup.add(flag);
    }

    buntGroup.position.set(0, 0, 0);
    buntGroup.userData.baseX = 0;
    buntGroup.userData.isLongSegment = true;
    scene.add(buntGroup);
    S.roadMarkings.push(buntGroup);
  }
}
buildUtilityPolesAndBuntings();

// ── Metro Pillars & Viaduct ──
function buildMetroPillars() {
  for (let z = 10; z > -240; z -= 14) {
    // Median pillars (Ernakulam-style metro on the divider)
    const mGeo = new THREE.BoxGeometry(0.5, 10, 0.5);
    const mMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.7 });
    const mp = new THREE.Mesh(mGeo, mMat);
    mp.position.set(ROAD.medianX, 5, z);
    mp.castShadow = true;
    mp.userData.baseX = mp.position.x;
    scene.add(mp);
    S.metroPillars.push(mp);

    // Left & right pillars
    [-(ROAD.halfWidth + 0.3), ROAD.halfWidth + 0.3].forEach((x, idx) => {
      const pGeo = new THREE.BoxGeometry(0.7, 11, 0.7);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.75 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(x, 5.5, z);
      p.castShadow = true;
      p.userData.baseX = p.position.x;
      scene.add(p);
      S.metroPillars.push(p);

      if (idx === 1) {
        const beamGeo = new THREE.BoxGeometry(ROAD.totalWidth + 2, 0.5, 1.4);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.65 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 11.2, z);
        beam.castShadow = true;
        beam.userData.baseX = beam.position.x;
        scene.add(beam);
        S.metroPillars.push(beam);
      }
    });
  }
}
buildMetroPillars();

// ── 3D Traffic Signals (Kerala Yellow Box Style) ──
function createTrafficSignal(x, z, forceState) {
  const g = new THREE.Group();

  // Pole with striped base
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.0, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.0;
  g.add(pole);

  // Yellow housing box (Kerala traffic signal style)
  const boxGeo = new THREE.BoxGeometry(0.42, 1.15, 0.32);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.5 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(0, 3.4, 0);
  g.add(box);

  // Black backplate border
  const plateGeo = new THREE.BoxGeometry(0.52, 1.25, 0.04);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, 3.4, 0.14);
  g.add(plate);

  // Lights (Red, Yellow, Green) with visor hoods
  g.userData.isTrafficSignal = true;
  g.userData.lightMeshes = [];
  const lightStates = ['green', 'yellow', 'red'];
  const active = forceState || lightStates[Math.floor(Math.random() * 3)];
  const lightColors = { red: 0xff2200, yellow: 0xffaa00, green: 0x22dd44 };

  [3.05, 3.4, 3.75].forEach((y, i) => {
    const stateName = lightStates[i];
    const isLit = stateName === active;
    const lGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const lMat = new THREE.MeshStandardMaterial({
      color: isLit ? lightColors[stateName] : 0x1a1a1a,
      emissive: isLit ? lightColors[stateName] : 0x000000,
      emissiveIntensity: isLit ? 1.4 : 0,
      roughness: 0.2
    });
    const l = new THREE.Mesh(lGeo, lMat);
    l.position.set(0, y, 0.18);
    g.add(l);
    g.userData.lightMeshes.push(l);

    // Visor hood
    const hoodGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.1, 8, 1, false, 0, Math.PI);
    const hoodMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.set(0, y + 0.08, 0.2);
    g.add(hood);
  });

  // Glow for active light
  if (active === 'red' || active === 'green') {
    const glow = new THREE.PointLight(lightColors[active], 0.4, 5);
    glow.position.set(0, 3.4, 0.4);
    g.add(glow);
  }

  g.position.set(x, 0, z);
  return g;
}

for (let z = 5; z > -240; z -= 50 + Math.random() * 30) {
  [-1, 1].forEach(side => {
    const sig = createTrafficSignal(side * (ROAD.halfWidth + 2.5), z);
    sig.userData.baseX = sig.position.x;
    scene.add(sig);
    S.signals.push(sig);
  });
}

// ── Junction Crosswalks ──
const junctionZs = [];
for (let z = -20; z > -240; z -= 60 + Math.random() * 40) junctionZs.push(z);
junctionZs.forEach(jz => {
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true, side: THREE.DoubleSide });
  for (let x = -5; x <= 5; x += 1.2) {
    const geo = new THREE.PlaneGeometry(0.3, 0.8);
    const m = new THREE.Mesh(geo, stripeMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.003, jz);
    m.userData.baseX = m.position.x;
  scene.add(m);
    S.roadMarkings.push(m);
  }
});

// ═══════════════════════════════════════════
//  TOLL BOOTH FACTORY
// ═══════════════════════════════════════════
function createTollBooth(waypointName) {
  const g = new THREE.Group();

  // Support pillars on each side
  [-1, 1].forEach(side => {
    const pillarGeo = new THREE.BoxGeometry(0.6, 5, 0.6);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(side * (ROAD.halfWidth - 1), 2.5, 0);
    pillar.castShadow = true;
    g.add(pillar);
  });

  // Horizontal beam (yellow/black)
  const beamGeo = new THREE.BoxGeometry(ROAD.totalWidth - 2, 0.8, 0.5);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.5, metalness: 0.2 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 5, 0);
  beam.castShadow = true;
  g.add(beam);

  // Black stripes on beam
  for (let s = -5; s <= 5; s += 2) {
    const stripeGeo = new THREE.BoxGeometry(0.5, 0.82, 0.52);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(s, 5, 0);
    g.add(stripe);
  }

  // Barrier arms per lane (lowered position)
  g.userData = { type: 'tollbooth', name: waypointName, barrierArms: [] };
  
  ROAD.playerLanes.forEach((laneX, index) => {
    // The arm pivot
    const armPivot = new THREE.Group();
    armPivot.position.set(laneX - 1.1, 3.5, 0.5); // Pivot on the left side of the lane
    
    const armGeo = new THREE.BoxGeometry(2.2, 0.12, 0.12);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5, emissive: 0xff2200, emissiveIntensity: 0.2 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(1.1, 0, 0); // Offset so pivot is at end
    armPivot.add(arm);
    
    g.add(armPivot);
    g.userData.barrierArms.push(armPivot);

    // If it's the right-most player lane, block it with a static car to force FASTag lane usage
    if (index === 1) {
      const blockedCar = createSmallVehicle(false);
      blockedCar.position.set(laneX, 0, 3);
      g.add(blockedCar);
      
      const cashSignGeo = new THREE.PlaneGeometry(1.2, 0.5);
      const cashSignMat = new THREE.MeshBasicMaterial({ color: 0xcc2222 });
      const cashSign = new THREE.Mesh(cashSignGeo, cashSignMat);
      cashSign.position.set(laneX, 4.5, 0.6);
      g.add(cashSign);
    }
  });

  // Toll booth structure (left side)
  const boothGeo = new THREE.BoxGeometry(2, 2.5, 2);
  const boothMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.7 });
  const booth = new THREE.Mesh(boothGeo, boothMat);
  booth.position.set(-ROAD.halfWidth + 1.5, 1.25, 0);
  booth.castShadow = true;
  g.add(booth);

  // Booth window
  const winGeo = new THREE.PlaneGeometry(0.8, 0.6);
  const winMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, opacity: 0.5, transparent: true });
  const win = new THREE.Mesh(winGeo, winMat);
  win.position.set(-ROAD.halfWidth + 1.5, 1.8, 1.05);
  g.add(win);

  // Booth roof
  const roofGeo = new THREE.BoxGeometry(2.4, 0.15, 2.4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(-ROAD.halfWidth + 1.5, 2.6, 0);
  g.add(roof);

  // FASTag sign (educational)
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a4a1a';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FASTag \u2714', 128, 35);
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('SLOW DOWN', 128, 70);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#88ff88';
  const shortName = (waypointName || 'Toll Plaza').substring(0, 30);
  ctx.fillText(shortName, 128, 100);

  const texture = new THREE.CanvasTexture(canvas);
  const signMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), signMat);
  sign.position.set(0, 6.5, -2);
  g.add(sign);

  // Warning lights (amber flashers)
  [-1, 1].forEach(side => {
    const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(side * 3, 5.5, 0);
    g.add(light);

    const glow = new THREE.PointLight(0xffaa00, 0.3, 8);
    glow.position.set(side * 3, 5.5, 0.5);
    g.add(glow);
  });

  g.userData.type = 'tollbooth';
  g.userData.name = waypointName;
  return g;
}

function createPalm(x, z) {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 7 + Math.random() * 3, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3.5;
  trunk.castShadow = true;
  group.add(trunk);

  // Slight lean
  trunk.rotation.z = (Math.random() - 0.5) * 0.15;
  trunk.rotation.x = (Math.random() - 0.5) * 0.08;

  // Frond cluster (coconut palm top)
  const frondColors = [0x1a6b2a, 0x228B22, 0x2d8c2d, 0x1d7a2d];
  for (let i = 0; i < 7; i++) {
    const fGeo = new THREE.ConeGeometry(0.4, 2.5, 4);
    const fMat = new THREE.MeshStandardMaterial({
      color: frondColors[Math.floor(Math.random() * frondColors.length)],
      roughness: 0.8,
    });
    const frond = new THREE.Mesh(fGeo, fMat);
    const angle = (i / 7) * Math.PI * 2;
    frond.position.set(Math.cos(angle) * 0.8, 7.5 + Math.random() * 0.5, Math.sin(angle) * 0.8);
    frond.rotation.z = Math.cos(angle) * 0.7;
    frond.rotation.x = Math.sin(angle) * 0.7;
    frond.castShadow = true;
    group.add(frond);
  }

  // Coconuts
  for (let i = 0; i < 3; i++) {
    const cGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const cMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8 });
    const coconut = new THREE.Mesh(cGeo, cMat);
    const a = (i / 3) * Math.PI * 2;
    coconut.position.set(Math.cos(a) * 0.25, 7.0, Math.sin(a) * 0.25);
    group.add(coconut);
  }

  group.position.set(x, 0, z);
  group.userData.baseX = group.position.x;
  scene.add(group);
  S.palms.push(group);
  return group;
}

// Place palms along the road
for (let z = 5; z > -240; z -= 10 + Math.random() * 8) {
  if (Math.random() > 0.3) createPalm(-ROAD.halfWidth - 3 - Math.random() * 4, z);
  if (Math.random() > 0.3) createPalm(ROAD.halfWidth + 3 + Math.random() * 4, z);
}

// ── Background Buildings (Authentic Kerala Architecture & Malayalam Shopfronts) ──
function createShopSignTexture(title, sub, bg, tc) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = tc;
  ctx.font = 'bold 36px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Teko", Arial, sans-serif';
  ctx.fillText(sub, 256, 96);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

const KERALA_SHOPS = [
  { title: 'ബേക്കറി & കൂൾ ബാർ', sub: 'BAKERY & COOL BAR', bg: '#4a154b', tc: '#ffd700', awning: 0x6b2d5c },
  { title: 'ചായക്കട & കട്ടൻ', sub: 'MALABAR TEA STALL', bg: '#103a1a', tc: '#66ffaa', awning: 0x1d6630 },
  { title: 'കേരള ലോട്ടറി ഏജൻസി', sub: 'KERALA STATE LOTTERY', bg: '#8b1e2a', tc: '#ffeb3b', awning: 0x9c2432 },
  { title: 'ഹോട്ടൽ മലബാർ', sub: 'MEALS & BIRYANI', bg: '#0b2545', tc: '#ffcc00', awning: 0x134074 }
];

function buildEnvironment() {
  const bldgColors = [0xa4c2a8, 0xeeddc5, 0xe6d7b8, 0xede3b8, 0xdca578, 0xc8c3ba];
  const roofColors = [0xb24d35, 0x9e3b25, 0x8c331c, 0xa3442e];

  for (let z = 5; z > -240; z -= 14 + Math.random() * 8) {
    [-1, 1].forEach((side, sIdx) => {
      const w = 4 + Math.random() * 4;
      const h = 4 + Math.random() * 6;
      const d = 5 + Math.random() * 4;

      // Wall (Pastel Kerala colors)
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: bldgColors[Math.floor(Math.random() * bldgColors.length)],
        roughness: 0.85,
      });
      const bldg = new THREE.Mesh(geo, mat);
      const xPos = side * (ROAD.halfWidth + 6 + Math.random() * 6);
      bldg.position.set(xPos, h / 2, z);
      bldg.receiveShadow = true;
      bldg.userData.baseX = bldg.position.x;
      scene.add(bldg);
      S.buildings.push(bldg);

      // Clay Terracotta Sloped Hip Roof
      const rGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 1.6, 4);
      const rMat = new THREE.MeshStandardMaterial({
        color: roofColors[Math.floor(Math.random() * roofColors.length)],
        roughness: 0.8,
      });
      const roof = new THREE.Mesh(rGeo, rMat);
      roof.position.set(xPos, h + 0.8, z);
      roof.rotation.y = Math.PI / 4;
      roof.userData.baseX = roof.position.x;
      scene.add(roof);
      S.buildings.push(roof);

      // Ground Floor Shopfront Awning & Malayalam Signboard
      const shopDef = KERALA_SHOPS[(Math.abs(Math.round(z / 14)) + sIdx) % KERALA_SHOPS.length];
      const signTex = createShopSignTexture(shopDef.title, shopDef.sub, shopDef.bg, shopDef.tc);

      // Side wall sign (facing the road)
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 0.75),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
      );
      signMesh.position.set(xPos + side * (-w / 2 - 0.05), 2.2, z);
      // Face towards road center
      signMesh.rotation.y = (side === 1 ? -Math.PI / 2 : Math.PI / 2);
      signMesh.userData.baseX = signMesh.position.x;
      scene.add(signMesh);
      S.buildings.push(signMesh);

      // Front-facing sign board on building front facade (faces oncoming driver directly)
      const frontSign = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(w * 0.75, 3.2), 0.75),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
      );
      frontSign.position.set(xPos - side * 0.4, 2.3, z + d / 2 + 0.05);
      frontSign.rotation.y = 0; // faces incoming traffic
      frontSign.userData.baseX = frontSign.position.x;
      scene.add(frontSign);
      S.buildings.push(frontSign);

      // Striped Entrance Awning
      const awnMesh = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(w * 0.8, 3.4), 0.12, 1.1),
        new THREE.MeshStandardMaterial({ color: shopDef.awning, roughness: 0.7 })
      );
      awnMesh.position.set(xPos - side * 0.4, 1.8, z + d / 2 + 0.5);
      awnMesh.rotation.x = 0.22;
      awnMesh.userData.baseX = awnMesh.position.x;
      scene.add(awnMesh);
      S.buildings.push(awnMesh);

      // Upper floor windows
      for (let i = 0; i < 2; i++) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 0.7),
          new THREE.MeshBasicMaterial({ color: 0x334155 })
        );
        win.position.set(xPos + side * (-w / 2 - 0.02), 3.4, z - 1 + i * 2);
        win.rotation.y = (side === 1 ? -Math.PI / 2 : Math.PI / 2);
        win.userData.baseX = win.position.x;
        scene.add(win);
        S.buildings.push(win);
      }
    });
  }
}
buildEnvironment();

// ── Backwater strip (visible in Fort Kochi zone, always present but subtle) ──
const waterGeo = new THREE.PlaneGeometry(30, 400);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x0a3a3a, roughness: 0.3, metalness: 0.4, opacity: 0.6, transparent: true,
});
const waterPlane = new THREE.Mesh(waterGeo, waterMat);
waterPlane.rotation.x = -Math.PI / 2;
waterPlane.position.set(ROAD.halfWidth + 30, -0.3, -140);
scene.add(waterPlane);

// ── NH 544 Overhead Gantry Signs ──
function createGantrySign(leftText, centerText, rightText) {
  const g = new THREE.Group();

  // Support pillars
  [-ROAD.halfWidth - 0.5, ROAD.halfWidth + 0.5].forEach(x => {
    const pilGeo = new THREE.CylinderGeometry(0.18, 0.22, 8.5, 8);
    const pilMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, metalness: 0.3 });
    const pil = new THREE.Mesh(pilGeo, pilMat);
    pil.position.set(x, 4.25, 0);
    pil.castShadow = true;
    g.add(pil);
  });

  // Main sign board (green background like real NH signs)
  const boardW = ROAD.totalWidth + 3;
  const boardH = 1.6;
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Green background
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(0, 0, 1024, 128);
  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 1016, 120);

  // White reflective strips along top & bottom
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(8, 8, 1008, 14);
  ctx.fillRect(8, 106, 1008, 14);

  ctx.textBaseline = 'middle';

  // Left lane destination (through lane or exit)
  if (leftText) {
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const isExit = leftText.includes('EXIT') || leftText.includes('↖') || leftText.includes('SERVICE');
    const arrow = isExit ? '↖ ' : '↑ ';
    const cleanText = leftText.replace(/^[←→↑↖↗]\s*/, '');
    ctx.fillText(arrow + cleanText, 36, 64);
  }

  // Center highway designation
  if (centerText) {
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#ffee88';
    ctx.textAlign = 'center';
    ctx.fillText(centerText, 512, 64);
  }

  // Right lane destination (through highway direction straight ahead)
  if (rightText) {
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    const isExit = rightText.includes('EXIT') || rightText.includes('↗');
    const arrow = isExit ? ' ↗' : ' ↑';
    const cleanText = rightText.replace(/^[←→↑↖↗]\s*/, '').replace(/\s*[←→↑↖↗]$/, '');
    ctx.fillText(cleanText + arrow, 988, 64);
  }

  // NH 544 shield (bottom right)
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#ffee00';
  ctx.textAlign = 'right';
  ctx.fillText('NH 544', 988, 112);

  const tex = new THREE.CanvasTexture(canvas);
  const boardGeo = new THREE.BoxGeometry(boardW, boardH, 0.15);
  const boardMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 8.2, 0);
  g.add(board);

  // Overhead beam
  const beamGeo = new THREE.BoxGeometry(boardW + 0.5, 0.25, 0.25);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 9.2, 0);
  g.add(beam);

  g.userData.isGantry = true;
  return g;
}

// ── Kerala Highway Billboards (Generic fictional cultural ads) ──
const BILLBOARD_ADS = [
  { brand: "CHETTAN'S THATTUKADA", tag: "Pazham Pori & Sulaimani Chaya · 24x7", bg: '#103a1a', tc: '#66ffaa' },
  { brand: 'KASAVU TEXTILES', tag: 'Traditional Handloom Mundu & Sarees', bg: '#8b1e2a', tc: '#ffd700' },
  { brand: 'MALABAR SPICE BAKERY', tag: 'Fresh Banana Chips & Halwa', bg: '#0b203a', tc: '#ffea88' },
  { brand: 'AYURVEDA BHAVAN', tag: 'Herbal Wellness & Traditional Care', bg: '#2a1a3a', tc: '#ffd700' }
];

function createKeralaBillboard(ad) {
  const g = new THREE.Group();

  // White mounting pillars (matching framed roadside poster in Reference Screenshot 2)
  [-1.2, 1.2].forEach(px => {
    const pGeo = new THREE.BoxGeometry(0.18, 4.2, 0.18);
    const pMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(px, 2.1, 0);
    g.add(p);
  });

  // Framed Cinema / Cultural Poster (matching Reference Screenshot 2)
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 340;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 340);

  // Inner poster art background
  ctx.fillStyle = ad.bg;
  ctx.fillRect(16, 16, 480, 308);

  // Border accents
  ctx.strokeStyle = ad.tc;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 464, 292);

  // Brand / Title
  ctx.fillStyle = ad.tc;
  ctx.font = 'bold 36px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ad.brand, 256, 120);

  // Tagline / Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Outfit", Arial, sans-serif';
  ctx.fillText(ad.tag, 256, 190);

  // Small cultural badge
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(156, 235, 200, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Teko", Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('KERALA TOURISM · GOD\'S OWN COUNTRY', 256, 250);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  const boardGeo = new THREE.BoxGeometry(3.2, 2.2, 0.1);
  const boardMat = new THREE.MeshBasicMaterial({ map: tex });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 3.2, 0);
  g.add(board);

  return g;
}

// ── Kerala Milestone (KM Stone) ──
function createKMStone(km) {
  const g = new THREE.Group();

  // White base
  const baseGeo = new THREE.BoxGeometry(0.35, 0.65, 0.22);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.325;
  g.add(base);

  // Yellow rounded dome
  const capGeo = new THREE.CylinderGeometry(0.175, 0.175, 0.22, 12, 1, false, 0, Math.PI);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.7 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.rotation.z = Math.PI / 2;
  cap.rotation.y = Math.PI / 2;
  cap.position.y = 0.65;
  g.add(cap);

  // Text plate
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(0, 0, 128, 45);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 45, 128, 83);
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('NH 544', 64, 28);
  ctx.font = 'bold 26px Arial';
  ctx.fillText(`KM ${km}`, 64, 85);

  const tex = new THREE.CanvasTexture(canvas);
  const plateGeo = new THREE.PlaneGeometry(0.33, 0.6);
  const plateMat = new THREE.MeshBasicMaterial({ map: tex });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, 0.42, 0.12);
  g.add(plate);

  return g;
}

// Spawn clean roadside posters along sidewalk (matching Reference Screenshot 2)
const BILLBOARD_SPAWNS = [-40, -110, -180, -240];
BILLBOARD_SPAWNS.forEach((z, idx) => {
  const ad = BILLBOARD_ADS[idx % BILLBOARD_ADS.length];
  const bb = createKeralaBillboard(ad);
  const x = ROAD.halfWidth + 3.8;
  bb.position.set(x, 0, z);
  bb.userData.baseX = x;
  bb.userData.isLongSegment = true;
  scene.add(bb);
  S.roadMarkings.push(bb);
});

// Spawn KM Stones along left shoulder
const KM_SPAWNS = [-20, -85, -150, -215];
KM_SPAWNS.forEach((z, idx) => {
  const kmNum = (idx + 1) * 20;
  const stone = createKMStone(kmNum);
  const x = -ROAD.halfWidth - 1.8;
  stone.position.set(x, 0, z);
  stone.userData.baseX = x;
  stone.userData.isLongSegment = true;
  scene.add(stone);
  S.roadMarkings.push(stone);
});


// ═══════════════════════════════════════════
//  PLAYER AUTO-RICKSHAW
// ═══════════════════════════════════════════
const playerGroup = new THREE.Group();

// Rear panel canvas texture (Malayalam sticker & KL 07 Taxi plate matching Reference)
function createAutoRearTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // Black rear panel body
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 512, 384);

  // Tinted rear window
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(80, 24, 352, 130);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(80, 24, 352, 130);

  // Glass diagonal reflection
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(90, 140);
  ctx.lineTo(220, 30);
  ctx.lineTo(260, 30);
  ctx.lineTo(130, 140);
  ctx.fill();

  // Malayalam bumper sticker in bold yellow: "ചുംബിക്കല്ലേ മുത്തേ, വാടകക്ക് ആണ്"
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 30px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ചുംബിക്കല്ലേ മുത്തേ,', 256, 192);
  ctx.fillText('വാടകക്ക് ആണ്', 256, 230);

  // Kerala Yellow Taxi Number Plate: KL 07 AU 4321
  ctx.fillStyle = '#ffea3d';
  ctx.fillRect(176, 268, 160, 44);
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.strokeRect(176, 268, 160, 44);

  ctx.fillStyle = '#0a0a0a';
  ctx.font = 'bold 22px "Teko", Arial Black, sans-serif';
  ctx.fillText('KL 07 AU 4321', 256, 290);

  // Taillights: Left (Amber + Red)
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(36, 260, 38, 26);
  ctx.fillStyle = '#e53935';
  ctx.fillRect(36, 286, 38, 28);

  // Taillights: Right (Amber + Red)
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(438, 260, 38, 26);
  ctx.fillStyle = '#e53935';
  ctx.fillRect(438, 286, 38, 28);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// Body (Classic Kerala black body with yellow trim)
const bodyGeo = new THREE.BoxGeometry(1.15, 0.95, 1.9);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.6, metalness: 0.2 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.7;
body.castShadow = true;
playerGroup.add(body);

// Rear Panel with Malayalam Sticker & License Plate
const rearGeo = new THREE.PlaneGeometry(1.15, 0.94);
const rearMat = new THREE.MeshStandardMaterial({ map: createAutoRearTexture(), roughness: 0.45 });
const rearMesh = new THREE.Mesh(rearGeo, rearMat);
rearMesh.position.set(0, 0.7, 0.96);
playerGroup.add(rearMesh);

// Canopy Roof (Kerala Auto yellow curved canopy)
const roofGeo = new THREE.BoxGeometry(1.25, 0.14, 2.0);
const roofMat = new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.4, metalness: 0.2 });
const roofMesh = new THREE.Mesh(roofGeo, roofMat);
roofMesh.position.y = 1.23;
roofMesh.castShadow = true;
playerGroup.add(roofMesh);

// Front
const frontGeo = new THREE.BoxGeometry(0.95, 0.55, 0.1);
const frontMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5 });
const front = new THREE.Mesh(frontGeo, frontMat);
front.position.set(0, 0.95, -1.0);
playerGroup.add(front);

// Windshield
const windGeo = new THREE.BoxGeometry(0.85, 0.4, 0.04);
const windMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.8, opacity: 0.45, transparent: true });
const windshield = new THREE.Mesh(windGeo, windMat);
windshield.position.set(0, 0.93, -0.97);
playerGroup.add(windshield);

// Wheels
function makeWheel(x, z) {
  const geo = new THREE.CylinderGeometry(0.18, 0.18, 0.13, 10);
  const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.z = Math.PI / 2;
  m.position.set(x, 0.18, z);
  m.castShadow = true;
  playerGroup.add(m);
  return m;
}
makeWheel(0, -0.85);
makeWheel(-0.58, 0.65);
makeWheel(0.58, 0.65);

// Headlight (warm twin beams + forward spot)
const hlGeo = new THREE.SphereGeometry(0.08, 8, 8);
const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffea });
const headlightMesh = new THREE.Mesh(hlGeo, hlMat);
headlightMesh.position.set(0, 0.62, -1.05);
playerGroup.add(headlightMesh);

const headlightGlow = new THREE.PointLight(0xffffaa, 0.6, 12);
headlightGlow.position.set(0, 0.6, -1.8);
playerGroup.add(headlightGlow);

// Forward road cone spot
const autoSpot = new THREE.SpotLight(0xfffae0, 2.5, 45, Math.PI / 5, 0.45, 1.2);
autoSpot.position.set(0, 0.65, -0.9);
autoSpot.target.position.set(0, -0.1, -22);
playerGroup.add(autoSpot);
playerGroup.add(autoSpot.target);

// Wings (hidden until boost)
const wingGroup = new THREE.Group();
function makeWing(side) {
  const geo = new THREE.BoxGeometry(1.8, 0.05, 0.7);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.5,
    roughness: 0.3, metalness: 0.6, opacity: 0.8, transparent: true,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(side * 1.45, 1.05, 0);
  m.rotation.z = side * 0.08;
  return m;
}
const leftWing = makeWing(-1);
const rightWing = makeWing(1);
wingGroup.add(leftWing, rightWing);
wingGroup.visible = false;
playerGroup.add(wingGroup);

playerGroup.position.set(-3.5, 0, 0);
scene.add(playerGroup);

// ═══════════════════════════════════════════
//  VEHICLE FACTORIES
// ═══════════════════════════════════════════
function createKSRTCBus(isOncoming) {
  const g = new THREE.Group();
  const bGeo = new THREE.BoxGeometry(1.7, 2.1, 4.2);
  const bMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 });
  const b = new THREE.Mesh(bGeo, bMat); b.position.y = 1.25; b.castShadow = true; g.add(b);

  // Yellow stripe
  const sGeo = new THREE.BoxGeometry(1.75, 0.28, 4.25);
  const sMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
  const s = new THREE.Mesh(sGeo, sMat); s.position.y = 0.95; g.add(s);

  // Roof
  const rGeo = new THREE.BoxGeometry(1.6, 0.18, 4.0);
  const rMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
  const r = new THREE.Mesh(rGeo, rMat); r.position.y = 2.4; g.add(r);

  // Windows
  for (let i = 0; i < 4; i++) {
    [-1, 1].forEach(sd => {
      const wGeo = new THREE.PlaneGeometry(0.45, 0.55);
      const wMat = new THREE.MeshBasicMaterial({ color: 0x88bbff, opacity: 0.45, transparent: true });
      const w = new THREE.Mesh(wGeo, wMat);
      w.position.set(sd * 0.86, 1.65, -1.3 + i * 0.9);
      w.rotation.y = sd * Math.PI / 2;
      g.add(w);
    });
  }

  // Tail lights
  const tlZ = isOncoming ? -2.15 : 2.15;
  [-0.55, 0.55].forEach(x => {
    const tGeo = new THREE.BoxGeometry(0.18, 0.12, 0.04);
    const tMat = new THREE.MeshBasicMaterial({ color: isOncoming ? 0xffffcc : 0xff3300 });
    const t = new THREE.Mesh(tGeo, tMat); t.position.set(x, 0.75, tlZ); g.add(t);
  });

  // Headlights for oncoming
  if (isOncoming) {
    const hlGlow = new THREE.PointLight(0xffffaa, 0.4, 12);
    hlGlow.position.set(0, 0.8, 2.5);
    g.add(hlGlow);
  }

  g.userData = { type: 'bus', width: 1.7, depth: 4.2, height: 2.4, isOncoming };
  return g;
}

function createContainerTruck(isOncoming) {
  const g = new THREE.Group();

  // Cab
  const cabGeo = new THREE.BoxGeometry(1.7, 1.7, 1.4);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x1a3355, roughness: 0.6 });
  const cab = new THREE.Mesh(cabGeo, cabMat); cab.position.set(0, 1.05, isOncoming ? 1.8 : -1.8); cab.castShadow = true; g.add(cab);

  // Container
  const cGeo = new THREE.BoxGeometry(1.9, 2.4, 4.5);
  const cMat = new THREE.MeshStandardMaterial({ color: 0x0d2847, roughness: 0.7 });
  const c = new THREE.Mesh(cGeo, cMat); c.position.set(0, 1.4, isOncoming ? -0.7 : 0.7); c.castShadow = true; g.add(c);

  // Headlights for oncoming
  if (isOncoming) {
    const hl = new THREE.PointLight(0xffffaa, 0.5, 15);
    hl.position.set(0, 0.9, 3);
    g.add(hl);
  }

  g.userData = { type: 'truck', width: 1.9, depth: 6.0, height: 2.4, isOncoming };
  return g;
}

function createSmallVehicle(isOncoming) {
  const g = new THREE.Group();
  const colors = [0x444444, 0x555555, 0x3a3a3a, 0x4a4040];
  const bGeo = new THREE.BoxGeometry(1.0, 0.75, 1.4);
  const bMat = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)], roughness: 0.7 });
  const b = new THREE.Mesh(bGeo, bMat); b.position.y = 0.55; b.castShadow = true; g.add(b);

  const rGeo = new THREE.BoxGeometry(1.0, 0.08, 1.45);
  const rMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const r = new THREE.Mesh(rGeo, rMat); r.position.y = 0.97; g.add(r);

  if (isOncoming) {
    const hl = new THREE.PointLight(0xffffaa, 0.25, 8);
    hl.position.set(0, 0.5, 1.0);
    g.add(hl);
  }

  g.userData = { type: 'car', width: 1.0, depth: 1.4, height: 1.0, isOncoming };
  return g;
}

// ═══════════════════════════════════════════
//  GAME OBJECT FACTORIES
// ═══════════════════════════════════════════

// ── Coin ──
function createCoin() {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.32, 0.32, 0.07, 14);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.8,
  });
  const coin = new THREE.Mesh(geo, mat);
  coin.rotation.x = Math.PI / 2;
  g.add(coin);

  const glowGeo = new THREE.SphereGeometry(0.45, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd700, opacity: 0.12, transparent: true });
  g.add(new THREE.Mesh(glowGeo, glowMat));

  g.userData = { type: 'coin', collected: false };
  return g;
}

// ── Pothole ──
function createPothole() {
  const radius = 0.5 + Math.random() * 0.35;
  const geo = new THREE.CylinderGeometry(radius, radius * 0.85, 0.12, 10);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = -0.04;
  m.userData = { type: 'pothole', width: radius * 2 };
  return m;
}

// ── Customer Pickup Zone (Glowing Yellow & Roadside Passenger) ──
function createPickupZone() {
  const g = new THREE.Group();

  // Wide asphalt pickup pad
  const platGeo = new THREE.BoxGeometry(3.6, 0.08, 4.8);
  const platMat = new THREE.MeshStandardMaterial({
    color: 0xf5c518, emissive: 0xd4a017, emissiveIntensity: 0.6,
    roughness: 0.4, opacity: 0.75, transparent: true
  });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = 0.04;
  g.add(plat);

  // Concentric pulsing rings
  const ringGeo = new THREE.RingGeometry(1.2, 1.5, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, opacity: 0.45, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);

  // Vertical yellow light column reaching into the sky
  const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 30, 12, 1, true);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffd700, opacity: 0.25, transparent: true, side: THREE.DoubleSide
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 15;
  g.add(beacon);

  // Roadside passenger 3D silhouette
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.8 })
  );
  body.position.set(-1.2, 0.65, 0);
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
  );
  head.position.set(-1.2, 1.35, 0);
  g.add(head);

  g.userData = { type: 'pickup', triggered: false };
  return g;
}

// ── Customer Dropoff Zone (Glowing Red & Tall Beacon) ──
function createDropoffZone() {
  const g = new THREE.Group();

  // Wide red dropoff pad covering the player's primary lane and shoulder
  const platGeo = new THREE.BoxGeometry(5.2, 0.08, 7.0);
  const platMat = new THREE.MeshStandardMaterial({
    color: 0xdd2222, emissive: 0xcc1111, emissiveIntensity: 0.8,
    roughness: 0.35, opacity: 0.85, transparent: true
  });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = 0.04;
  g.add(plat);

  // Glowing concentric pulse ring
  const ringGeo = new THREE.RingGeometry(1.6, 2.4, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3333, opacity: 0.6, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);

  // Vertical red light beacon into the sky (visible from 100m away)
  const beaconGeo = new THREE.CylinderGeometry(0.45, 0.45, 36, 12, 1, true);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xff2222, opacity: 0.35, transparent: true, side: THREE.DoubleSide
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 18;
  g.add(beacon);

  // 3D Floating STOP / DROP text board
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#cc1111';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Teko", Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DROP OFF', 128, 55);
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('↓ STOP HERE ↓', 128, 95);

  const signTex = new THREE.CanvasTexture(canvas);
  signTex.encoding = THREE.sRGBEncoding;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.2),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  signMesh.position.set(0, 3.2, 0);
  g.add(signMesh);

  g.userData = { type: 'dropoff', triggered: false };
  return g;
}

// ── Gridlock Wall (line of stationary buses) ──
function spawnGridlockWall() {
  const wallZ = -130;
  const laneXs = [...ROAD.playerLanes];
  // Optionally add a third bus slightly offset
  if (Math.random() > 0.4) laneXs.push((ROAD.playerLanes[0] + ROAD.playerLanes[1]) / 2);

  laneXs.forEach(lx => {
    const bus = createKSRTCBus(false);
    bus.position.set(lx + (Math.random() - 0.5) * 0.5, 0, wallZ + (Math.random() - 0.5) * 2);
    bus.userData.speedMultiplier = 0; // stationary
    bus.userData.isGridlock = true;
    bus.userData.baseX = bus.position.x;
  scene.add(bus);
    S.obstacles.push(bus);
    S.gridlockWalls.push(bus);
  });

  // Additional cars filling gaps
  const gapX = (ROAD.playerLanes[0] + ROAD.playerLanes[1]) / 2;
  const car = createSmallVehicle(false);
  car.position.set(gapX, 0, wallZ + 3);
  car.userData.speedMultiplier = 0;
  car.userData.isGridlock = true;
  car.userData.baseX = car.position.x;
  scene.add(car);
  S.obstacles.push(car);
  S.gridlockWalls.push(car);

  console.log('🔊 SFX: Gridlock spawned!');
}

// ═══════════════════════════════════════════
//  PARTICLE SYSTEM
// ═══════════════════════════════════════════
function spawnParticle(x, y, z, color, vel, life) {
  const geo = new THREE.SphereGeometry(0.05, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.userData.baseX = m.position.x;
  scene.add(m);
  S.particles.push({
    mesh: m,
    vel: vel || { x: (Math.random() - 0.5) * 0.1, y: Math.random() * 0.1, z: 0.05 },
    life: life || 1.0,
    maxLife: life || 1.0,
  });
}

function spawnWingTrail() {
  if (!S.isFlying) return;
  [-1.7, 1.7].forEach(side => {
    for (let i = 0; i < 2; i++) {
      spawnParticle(
        playerGroup.position.x + side + (Math.random() - 0.5) * 0.3,
        playerGroup.position.y + 1.0 + (Math.random() - 0.5) * 0.2,
        playerGroup.position.z + 1.0 + Math.random() * 0.4,
        0xffd700,
        { x: side * 0.025, y: -0.02, z: 0.07 },
        0.55
      );
    }
  });
}

function spawnExhaust() {
  if (S.isFlying) return;
  spawnParticle(
    playerGroup.position.x + (Math.random() - 0.5) * 0.2,
    playerGroup.position.y + 0.25,
    playerGroup.position.z + 1.1,
    0x555555,
    { x: (Math.random() - 0.5) * 0.015, y: 0.02, z: 0.05 },
    0.45
  );
}

function spawnExplosion(x, y, z) {
  for (let i = 0; i < 30; i++) {
    spawnParticle(
      x + (Math.random() - 0.5) * 2, y + 0.5 + Math.random() * 1.5, z + (Math.random() - 0.5) * 2,
      Math.random() > 0.5 ? 0xff4400 : 0xffcc00,
      { x: (Math.random() - 0.5) * 0.3, y: Math.random() * 0.2, z: (Math.random() - 0.5) * 0.3 },
      1.5
    );
  }
}

// ═══════════════════════════════════════════
//  MEMORY MANAGEMENT
// ═══════════════════════════════════════════
function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(mat => mat.dispose());
    } else {
      obj.material.dispose();
    }
  }
  if (obj.children) {
    obj.children.forEach(child => disposeObject(child));
  }
}

// ═══════════════════════════════════════════
//  JUNCTION CLEANUP
// ═══════════════════════════════════════════
function cleanupActiveJunction() {
  if (S.activeTrafficLight) {
    scene.remove(S.activeTrafficLight.mesh);
    disposeObject(S.activeTrafficLight.mesh);
    if (S.activeTrafficLight.timerEl) S.activeTrafficLight.timerEl.style.display = 'none';
    if (S.activeTrafficLight.stopEl) S.activeTrafficLight.stopEl.classList.remove('visible');
    S.activeTrafficLight = null;
  }
  S.activeJunctionAssets.forEach(asset => {
    scene.remove(asset);
    disposeObject(asset);
    const idx = S.roadMarkings.indexOf(asset);
    if (idx >= 0) S.roadMarkings.splice(idx, 1);
  });
  S.crossTraffic = S.crossTraffic.filter(ct => !S.activeJunctionAssets.includes(ct));
  S.activeJunctionAssets.length = 0;
}

// ═══════════════════════════════════════════
//  COLLISION DETECTION
// ═══════════════════════════════════════════
const playerBox = new THREE.Box3();
function checkObstacleCollision(obs) {
  // If airborne high enough to clear vehicles (> 2.6m), auto clears
  if (playerGroup.position.y > 2.6) return false;

  const px = playerGroup.position.x;
  const pz = playerGroup.position.z; // 0
  const py = playerGroup.position.y;

  const ox = obs.position.x;
  const oz = obs.position.z;
  const oy = obs.position.y || 0;

  const type = obs.userData.type || 'car';
  let obsHalfW = 0.95;
  let obsHalfL = 2.0;
  let obsH = 1.8;

  if (type === 'bus') {
    obsHalfW = 1.35;
    obsHalfL = 4.4;
    obsH = 3.2;
  } else if (type === 'truck') {
    obsHalfW = 1.35;
    obsHalfL = 4.0;
    obsH = 3.2;
  }

  const playerHalfW = 0.65;
  const playerHalfL = 1.1;

  const dx = Math.abs(px - ox);
  const dz = Math.abs(pz - oz);

  // Overlap on X, Z, and Y (with generous swept margin on Z to prevent tunneling at high speed)
  const collideX = dx < (playerHalfW + obsHalfW);
  const collideZ = dz < (playerHalfL + obsHalfL + 0.6);
  const collideY = (py < oy + obsH) && (py + 1.2 > oy - 0.2);

  return collideX && collideZ && collideY;
}

function checkZoneCollision(zone) {
  const px = playerGroup.position.x, pz = playerGroup.position.z;
  const zx = zone.position.x, zz = zone.position.z;
  const dx = Math.abs(px - zx);
  const dz = Math.abs(pz - zz);
  // Very broad - covers both player lanes and left shoulder
  const inX = dx < 8.0 || (px < 2.0 && px > -9.5);
  const inZ = dz < 9.0;
  const stoppedNear = (S.velocity < 0.8) && (dz < 18.0);
  const verySlow = (S.velocity < 1.2) && (dz < 12.0);
  return inX && (inZ || stoppedNear || verySlow);
}

function checkDropoffCollision(dz) {
  const px = playerGroup.position.x, pz = playerGroup.position.z;
  const zx = dz.position.x, zz = dz.position.z;
  const dx = Math.abs(px - zx);
  const dzDist = Math.abs(pz - zz);
  const inLane = dx < 8.0 || (px < 2.0 && px > -9.5);
  const inZ = dzDist < 9.0;
  const stoppedNear = (S.velocity < 0.8) && (dzDist < 18.0);
  const verySlow = (S.velocity < 1.2) && (dzDist < 12.0);
  return inLane && (inZ || stoppedNear || verySlow);
}

function checkCoinCollision(coin) {
  const dx = playerGroup.position.x - coin.position.x;
  const dz = playerGroup.position.z - coin.position.z;
  return Math.sqrt(dx * dx + dz * dz) < 1.4;
}

// ═══════════════════════════════════════════
//  SPAWN LOGIC
// ═══════════════════════════════════════════
function getVehicleTypeByZone() {
  const r = Math.random();
  // Mid highway (Chalakudy & Angamaly): container trucks dominate NH 544
  if (S.currentZone === 2 || S.currentZone === 3) {
    if (r < 0.50) return 'truck';
    if (r < 0.85) return 'bus';
    return 'car';
  }
  // Urban Kochi / Kalamassery: dense city traffic & city buses
  if (S.currentZone >= 4) {
    if (r < 0.50) return 'car';
    if (r < 0.80) return 'bus';
    return 'truck';
  }
  // Town & Toll (Thrissur / Paliyekkara)
  if (r < 0.45) return 'car';
  if (r < 0.80) return 'bus';
  return 'truck';
}

function spawnSameDirectionObstacle() {
  const lane = ROAD.playerLanes[Math.floor(Math.random() * ROAD.playerLanes.length)];
  const type = getVehicleTypeByZone();
  let obs;
  if (type === 'bus') obs = createKSRTCBus(false);
  else if (type === 'truck') obs = createContainerTruck(false);
  else obs = createSmallVehicle(false);

  obs.position.set(lane + (Math.random() - 0.5) * 0.6, 0, -130 - Math.random() * 25);
  obs.userData.speedMultiplier = 0.25 + Math.random() * 0.35;
  obs.userData.baseX = obs.position.x;
  scene.add(obs);
  S.obstacles.push(obs);
}

function spawnOncomingVehicle() {
  const lane = ROAD.oncomingLanes[Math.floor(Math.random() * ROAD.oncomingLanes.length)];
  const type = getVehicleTypeByZone();
  let veh;
  if (type === 'bus') veh = createKSRTCBus(true);
  else if (type === 'truck') veh = createContainerTruck(true);
  else veh = createSmallVehicle(true);

  veh.position.set(lane + (Math.random() - 0.5) * 0.4, 0, -140 - Math.random() * 30);
  veh.userData.oncomingSpeed = 0.5 + Math.random() * 0.3;
  veh.userData.baseX = veh.position.x;
  scene.add(veh);
  S.oncomingVehicles.push(veh);
}

function spawnCoin() {
  const coin = createCoin();
  const allLanes = [...ROAD.playerLanes];
  const lane = allLanes[Math.floor(Math.random() * allLanes.length)];
  coin.position.set(lane + (Math.random() - 0.5) * 0.5, 1.0, -85 - Math.random() * 30);
  coin.userData.baseX = coin.position.x;
  scene.add(coin);
  S.coins.push(coin);
}

function spawnPothole() {
  if (S.currentZone !== 2 && S.currentZone !== 3) return; // NH 544 stretches (Chalakudy-Angamaly)
  const x = ROAD.playerLanes[Math.floor(Math.random() * ROAD.playerLanes.length)] + (Math.random() - 0.5) * 2;
  const ph = createPothole();
  ph.position.set(x, -0.04, -95 - Math.random() * 30);
  ph.userData.baseX = ph.position.x;
  scene.add(ph);
  S.potholes.push(ph);
}

function spawnPickupZone() {
  if (S.hasCustomer) return; // only one customer at a time
  const zone = createPickupZone();
  // Place in player lane / left roadside
  zone.position.set(ROAD.playerLanes[0] - 0.4, 0, -95 - Math.random() * 20);
  zone.userData.baseX = zone.position.x;
  scene.add(zone);
  S.pickupZones.push(zone);
}

function spawnDropoffZone() {
  const zone = createDropoffZone();
  // Place directly on player's primary driving lane / left roadside
  zone.position.set(ROAD.playerLanes[0], 0, -95 - Math.random() * 20);
  zone.userData.baseX = zone.position.x;
  scene.add(zone);
  S.dropoffZones.push(zone);
}

// ═══════════════════════════════════════════
//  ZONE MANAGEMENT
// ═══════════════════════════════════════════
function updateZone() {
  const activeZones = getActiveZones();
  const prev = S.currentZone;
  const effectiveDist = S.route === 'reverse'
    ? Math.max(0, (S.totalJourneyDistance || 0) - S.distanceTraveled)
    : S.distanceTraveled;
  let zone = activeZones.length - 1;
  for (let i = 0; i < ZONE_BOUNDARIES.length; i++) {
    if (effectiveDist < ZONE_BOUNDARIES[i]) {
      zone = i;
      break;
    }
  }
  S.currentZone = zone;

  if (prev !== S.currentZone) {
    const z = activeZones[S.currentZone];
    DOM.zoneName.textContent = z.name;

    // Backwater visibility boost for Ernakulam corridor
    const isWaterZone = S.route === 'reverse' ? (S.currentZone === 0) : (S.currentZone === 5);
    waterMat.opacity = isWaterZone ? 0.7 : 0.3;

    DOM.zoneTransTitle.textContent = z.name;
    DOM.zoneTransSub.textContent = z.subtitle;
    DOM.zoneTransition.classList.add('visible');
    setTimeout(() => DOM.zoneTransition.classList.remove('visible'), 2800);
  }
}

// ═══════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  SoundEngine.resume();
  if (e.code === 'Enter') {
    if (!S.started) startGame();
    else if (S.over) restartGame();
  }
  if (e.code === 'Space' && S.started && !S.over) {
    e.preventDefault();
    activateBoost();
  }
  // H: Kerala Auto Horn
  if ((e.code === 'KeyH' || e.code === 'KeyB') && S.started && !S.over) {
    SoundEngine.playHorn();
    showPopup('📯 PEEP-PEEP!', 'coin-popup');
  }
  // T: skip one hour (time jump)
  if (e.code === 'KeyT' && S.started && !S.over) {
    S.gameTimeHour += 1.0;
    if (DOM.hudClock) DOM.hudClock.textContent = formatClock(S.gameTimeHour);
    if (DOM.hudTimeIcon) DOM.hudTimeIcon.textContent = getTimeIcon(S.gameTimeHour);
    showPopup('⏱ +1 Hour', 'savari-popup dropoff');
  }
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

// Sound toggle button in HUD
const soundBtn = document.getElementById('sound-toggle-btn');
if (soundBtn) {
  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    SoundEngine.toggleMute();
  });
}

// Route selector buttons
const routeFwd = document.getElementById('route-forward');
const routeRev = document.getElementById('route-reverse');
if (routeFwd) {
  routeFwd.addEventListener('click', e => {
    e.stopPropagation();
    SoundEngine.resume();
    S.route = 'forward';
    routeFwd.classList.add('active');
    if (routeRev) routeRev.classList.remove('active');
    if (DOM.zoneName) DOM.zoneName.textContent = getActiveZones()[0].name;
    buildWaypointsForRoute();
  });
}
if (routeRev) {
  routeRev.addEventListener('click', e => {
    e.stopPropagation();
    SoundEngine.resume();
    S.route = 'reverse';
    routeRev.classList.add('active');
    if (routeFwd) routeFwd.classList.remove('active');
    if (DOM.zoneName) DOM.zoneName.textContent = getActiveZones()[0].name;
    buildWaypointsForRoute();
  });
}

// Start button
const startPlayBtn = document.getElementById('start-play-btn');
if (startPlayBtn) {
  startPlayBtn.addEventListener('click', e => {
    e.stopPropagation();
    SoundEngine.resume();
    if (!S.started) startGame();
  });
}

// Also allow clicking anywhere on start screen (but not route buttons)
DOM.startScreen.addEventListener('click', () => {
  SoundEngine.resume();
  if (!S.started) startGame();
});
DOM.gameOver.addEventListener('click', () => {
  if (S.over) restartGame();
});

// Mobile — hold buttons with a release handler for every cancellation path
function bindMobileHold(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = e => { e.preventDefault(); SoundEngine.resume(); keys[key] = true; };
  const up = () => { keys[key] = false; };
  el.addEventListener('touchstart', down, { passive: false });
  el.addEventListener('touchend', up);
  el.addEventListener('touchcancel', up);
  el.addEventListener('mousedown', down);
  el.addEventListener('mouseup', up);
  el.addEventListener('mouseleave', up);
}
bindMobileHold('mobile-left', 'ArrowLeft');
bindMobileHold('mobile-right', 'ArrowRight');
bindMobileHold('mobile-up', 'ArrowUp');
bindMobileHold('mobile-down', 'ArrowDown');

document.getElementById('mobile-boost')?.addEventListener('touchstart', e => {
  e.preventDefault();
  SoundEngine.resume();
  activateBoost();
}, { passive: false });

const mobileHorn = document.getElementById('mobile-horn');
if (mobileHorn) {
  const honk = e => {
    e.preventDefault();
    SoundEngine.resume();
    SoundEngine.playHorn();
    showPopup('📯 PEEP-PEEP!', 'coin-popup');
  };
  mobileHorn.addEventListener('touchstart', honk, { passive: false });
  mobileHorn.addEventListener('click', honk);
}

function activateBoost() {
  if (S.boostReady && !S.isFlying && S.started && !S.over) {
    S.isFlying = true;
    S.flyTimer = S.flyDuration;
    S.verticalVelocity = 9.0;
    S.boostMeter = 0;
    S.boostReady = false;
    wingGroup.visible = true;
    DOM.flyingIndicator.classList.add('visible');
    DOM.boostReady.classList.remove('active');
    DOM.speedLines.style.opacity = '0.3';
    SoundEngine.playBoost();
  }
}

// ═══════════════════════════════════════════
//  HUD POPUPS
// ═══════════════════════════════════════════
function showPopup(text, className) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  el.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 80) + 'px';
  el.style.top = (window.innerHeight / 2 - 60) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ═══════════════════════════════════════════
//  EDUCATIONAL OVERLAY
// ═══════════════════════════════════════════
function showEducationalOverlay(violationType, data) {
  const overlay = document.getElementById('educational-overlay');
  const iconEl = document.getElementById('edu-icon');
  const titleEl = document.getElementById('edu-violation-title');
  const locationEl = document.getElementById('edu-violation-location');
  const detailsEl = document.getElementById('edu-violation-details');
  const tipEl = document.getElementById('edu-violation-tip');
  if (!overlay) return;

  if (violationType === 'red_light') {
    iconEl.textContent = '\ud83d\udea6';
    titleEl.textContent = '\ud83d\udea6 RED LIGHT VIOLATION';
    locationEl.textContent = data.junctionName || 'Unknown Junction';
    detailsEl.innerHTML = `
      <strong>What happened:</strong> You crossed the stop line at ${data.junctionName || 'a junction'} while the traffic signal was RED.<br><br>
      <strong>Section 119, Motor Vehicles Act, 1988:</strong> Disobedience of orders, signals, and directions given by authorized persons or through traffic signs is punishable with a fine.<br><br>
      <strong>Section 184 (amended 2019):</strong> Dangerous driving — running a red light endangers pedestrians and other road users.<br>
      <span class="edu-law">Fine: \u20b91,000 (first) / \u20b92,000 (repeat) \u00b7 Penalty Points: 3</span>
    `;
    tipEl.textContent = 'When you see the \ud83d\uded1 STOP indicator and the red line on the road, press \u2193 (down arrow) to brake. You must come to a complete stop (0 KM/H) before the white line. The signal will turn green once you stop correctly.';
  } else if (violationType === 'toll_violation') {
    iconEl.textContent = '\u26a0\ufe0f';
    titleEl.textContent = '\u26a0 TOLL BOOTH VIOLATION';
    locationEl.textContent = data.tollName || 'Toll Plaza';
    detailsEl.innerHTML = `
      <strong>What happened:</strong> You crossed ${data.tollName || 'the toll booth'} at ${data.speed || '?'} KM/H — well above the 20 KM/H limit.<br><br>
      <strong>National Highways Fee (Determination of Rates and Collection) Rules:</strong> All vehicles must slow down at toll plazas. FASTag (electronic toll collection) has been mandatory on all National Highways since Feb 15, 2021.<br><br>
      <strong>Penalty for no FASTag:</strong> Double the applicable toll fee is charged at the booth.<br>
      <span class="edu-law">Max Speed at Toll: 20 KM/H \u00b7 FASTag: Mandatory</span>
    `;
    tipEl.textContent = 'When you see the \u26a0 TOLL PLAZA AHEAD warning, start braking early with \u2193. Slow down below 20 KM/H before reaching the yellow stop line. The barrier will lift once you pass at a safe speed.';
  }

  overlay.classList.add('visible');
  spawnExplosion(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
}

// Educational overlay continue button
document.getElementById('edu-continue-btn')?.addEventListener('click', () => {
  document.getElementById('educational-overlay')?.classList.remove('visible');
  restartGame();
});

// ═══════════════════════════════════════════
//  MAP DATA LOADER
// ═══════════════════════════════════════════
let rawRoutePOIs = [];

function buildWaypointsForRoute() {
  if (!rawRoutePOIs || rawRoutePOIs.length === 0) return;

  const isReverse = S.route === 'reverse';
  const LAT_TO_GAME_DISTANCE = 10000;

  // Real geographical anchor points:
  // Thrissur (North) = 10.528, Ernakulam South = 9.970
  const thrissurLat = 10.528;
  const ernakulamLat = 9.970;

  S.waypoints = rawRoutePOIs
    .map(point => {
      let gameDist;
      if (!isReverse) {
        // Southbound (Thrissur -> Ernakulam)
        gameDist = (thrissurLat - point.lat) * LAT_TO_GAME_DISTANCE;
      } else {
        // Northbound (Ernakulam -> Thrissur)
        gameDist = (point.lat - ernakulamLat) * LAT_TO_GAME_DISTANCE;
      }

      return {
        lat: point.lat,
        lon: point.lon,
        name: point.tags ? point.tags.name : point.name,
        isToll: point.tags ? point.tags.barrier === 'toll_booth' : !!point.isToll,
        isJunction: point.tags ? point.tags.junction === 'yes' : !!point.isJunction,
        triggerDistance: Math.max(0, gameDist),
        spawned: false,
        pinEl: null
      };
    })
    .sort((a, b) => a.triggerDistance - b.triggerDistance);

  // Deduplicate points that are within 140 units
  const deduped = [];
  S.waypoints.forEach(wp => {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(wp.triggerDistance - last.triggerDistance) > 140) {
      deduped.push(wp);
    }
  });
  S.waypoints = deduped;

  if (S.waypoints.length > 0) {
    S.totalJourneyDistance = S.waypoints[S.waypoints.length - 1].triggerDistance + 500;
  }

  // Update HUD progress bar labels
  if (DOM.journeyLabelStart) DOM.journeyLabelStart.textContent = isReverse ? 'Ernakulam' : 'Thrissur';
  if (DOM.journeyLabelEnd) DOM.journeyLabelEnd.textContent = isReverse ? 'Thrissur' : 'Ernakulam';

  createJourneyPins();

  console.log(`🗺️ Map Loaded (${isReverse ? 'Northbound: EKM -> TCR' : 'Southbound: TCR -> EKM'})! ${S.waypoints.length} POIs. Total: ${S.totalJourneyDistance.toFixed(0)} units`);
}

async function loadMapData() {
  try {
    const response = await fetch('./level_data.json');
    const rawData = await response.json();
    const elements = rawData.elements || [];

    const namedElements = elements.filter(el =>
      el.tags && (el.tags.highway === 'traffic_signals' || el.tags.barrier) && el.tags.name
    );

    // Major POIs along the NH 544 corridor
    const manualPOIs = [
      { lat: 10.424, name: 'Pudukkad' },
      { lat: 10.301, name: 'Chalakudy' },
      { lat: 10.267, name: 'Koratty' },
      { lat: 10.196, name: 'Angamaly' },
      { lat: 10.155, name: 'Nedumbassery Airport' },
      { lat: 10.108, name: 'Aluva Bridge' },
      { lat: 10.050, name: 'Kalamassery' },
      { lat: 10.025, name: 'Edappally Junction' },
      { lat: 10.003, name: 'Palarivattom' },
      { lat: 9.992, name: 'Kaloor' },
      { lat: 9.970, name: 'Ernakulam South' }
    ];

    manualPOIs.forEach(poi => {
      namedElements.push({
        lat: poi.lat,
        lon: 76.35,
        tags: { name: poi.name, junction: 'yes' }
      });
    });

    rawRoutePOIs = namedElements;
    buildWaypointsForRoute();
  } catch (err) {
    console.error('Failed to load map data.', err);
  }
}

function createJourneyPins() {
  const bar = document.getElementById('journey-bar');
  if (!bar || S.totalJourneyDistance <= 0) return;

  // Clear existing pins to prevent duplication
  bar.querySelectorAll('.journey-pin').forEach(p => p.remove());

  const majorKeywords = ['Paliyekkara', 'Chalakudy', 'Angamaly', 'Aluva', 'Kalamassery', 'Edappally'];

  S.waypoints.forEach(wp => {
    const pct = Math.max(0, Math.min(100, (wp.triggerDistance / S.totalJourneyDistance) * 100));
    const pin = document.createElement('div');
    pin.className = 'journey-pin';
    pin.style.left = pct + '%';

    const dot = document.createElement('div');
    dot.className = 'journey-pin-dot' + (wp.isToll ? ' toll' : '');
    dot.title = `${wp.name}`;
    pin.appendChild(dot);

    const isMajor = wp.isToll || majorKeywords.some(k => wp.name.includes(k));
    if (isMajor) {
      const label = document.createElement('div');
      label.className = 'journey-pin-label' + (wp.isToll ? ' toll' : '');
      let shortName = wp.name
        .replace(' Junction', ' Jct')
        .replace(', National Highway 47', '')
        .replace(' National Highway 47', '');
      if (shortName.length > 14) shortName = shortName.substring(0, 12) + '…';
      label.textContent = shortName;
      pin.appendChild(label);
    }

    bar.appendChild(pin);
    wp.pinEl = dot;
  });
}

loadMapData();

// ═══════════════════════════════════════════
//  ROADSIDE SIGNS
// ═══════════════════════════════════════════
function createSpeedSign(x, z, limit) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), poleMat);
  pole.position.y = 1.6;
  g.add(pole);

  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#cc0000';
  ctx.stroke();
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(limit), 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const signMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), signMat);
  sign.position.set(0, 3.0, 0.15);
  g.add(sign);

  g.position.set(x, 0, z);
  g.rotation.y = 0;
  return g;
}

function createDirectionBoard(x, z, text) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), poleMat);
  pole.position.y = 1.6;
  g.add(pole);

  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 110;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(0, 0, 320, 110);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 312, 102);

  // Reflective white top/bottom border
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(8, 8, 304, 10);
  ctx.fillRect(8, 92, 304, 10);

  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text || '↑ NH 544', 160, 55);

  const texture = new THREE.CanvasTexture(canvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.75), boardMat);
  board.position.set(0, 3.2, 0.15);
  g.add(board);

  g.position.set(x, 0, z);
  g.rotation.y = 0;
  return g;
}

// ═══════════════════════════════════════════
//  TOLL BOOTH SPAWNER
// ═══════════════════════════════════════════
function spawnTollBooth(waypoint) {
  console.log(`🛣️ Approaching Toll: ${waypoint.name}`);
  
  const boothMesh = createTollBooth(waypoint.name);
  boothMesh.position.set(0, 0, -150);
  boothMesh.userData.baseX = boothMesh.position.x;
  scene.add(boothMesh);

  // Stop line for the toll
  const stopLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD.totalWidth, 1.5),
    new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  stopLineMesh.rotation.x = -Math.PI / 2;
  stopLineMesh.position.set(0, 0.05, -150);
  stopLineMesh.userData.baseX = stopLineMesh.position.x;
  scene.add(stopLineMesh);

  // Speed limit sign before the toll
  const speedSign = createSpeedSign(-ROAD.halfWidth - 3, -130, 20);
  speedSign.userData.baseX = speedSign.position.x;
  scene.add(speedSign);

  S.activeTollBooth = {
    waypointData: waypoint,
    boothMesh: boothMesh,
    stopLineMesh: stopLineMesh,
    speedSign: speedSign,
    prevZ: -150,
    passed: false
  };

  const tollWarn = document.getElementById('toll-warning');
  if (tollWarn) tollWarn.classList.add('visible');
  showPopup(`💰 ${waypoint.name} — FASTag Lane Open`, 'savari-popup');
}

// ═══════════════════════════════════════════
//  TRAFFIC JUNCTION SPAWNER
// ═══════════════════════════════════════════
function spawnEducationalJunction(waypoint) {
  console.log(`🚦 Approaching: ${waypoint.name}`);

  // Clean any existing junction first
  cleanupActiveJunction();

  showPopup(`🚦 ${waypoint.name} — STOP AT RED`, 'savari-popup dropoff');

  // ── Perpendicular Cross-Road (4-way junction) ──
  const crossGeo = new THREE.PlaneGeometry(80, ROAD.totalWidth);
  const crossMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  const crossRoad = new THREE.Mesh(crossGeo, crossMat);
  crossRoad.rotation.x = -Math.PI / 2;
  crossRoad.position.set(0, -0.005, -160);
  crossRoad.userData.baseX = crossRoad.position.x;
  scene.add(crossRoad);
  S.activeJunctionAssets.push(crossRoad);

  // Spawn Cross Traffic Bus
  const bus = createKSRTCBus(false); // Using existing bus factory
  bus.position.set(30, 0.4, -160); // Starts from right
  bus.rotation.y = -Math.PI / 2; // Facing left
  bus.userData = { baseX: bus.position.x, speed: -0.15, active: true }; // Moves along X axis
  scene.add(bus);
  S.crossTraffic.push(bus);
  S.activeJunctionAssets.push(bus); // For automatic cleanup

  // Glowing red stop line
  const lineGeo = new THREE.PlaneGeometry(ROAD.totalWidth, 2.5);
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xff2200,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const stopLine = new THREE.Mesh(lineGeo, lineMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(0, 0.05, -150);
  stopLine.userData.baseX = stopLine.position.x;
  scene.add(stopLine);

  // White border on stop line
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const border = new THREE.Mesh(new THREE.PlaneGeometry(ROAD.totalWidth + 0.5, 0.15), borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.set(0, 0.055, -150);
  border.userData.baseX = border.position.x;
  scene.add(border);
  S.activeJunctionAssets.push(border);

  // 3D signal poles — ALWAYS RED at educational junctions so the player sees reality
  [-1, 1].forEach(side => {
    const sig = createTrafficSignal(side * (ROAD.halfWidth + 2.5), -150, 'red');
    sig.userData.baseX = sig.position.x;
  scene.add(sig);
    S.activeJunctionAssets.push(sig);
  });

  // Zebra crosswalk stripes
  for (let x = -4.5; x <= 4.5; x += 1.0) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.35, transparent: true, side: THREE.DoubleSide })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, 0.01, -147.5);
    stripe.userData.baseX = stripe.position.x;
  scene.add(stripe);
    S.activeJunctionAssets.push(stripe);
  }

  // Junction name board — tells the player exactly WHERE they are
  const nameCanvas = document.createElement('canvas');
  nameCanvas.width = 512; nameCanvas.height = 128;
  const nCtx = nameCanvas.getContext('2d');
  nCtx.fillStyle = '#1a4a1a';
  nCtx.fillRect(0, 0, 512, 128);
  nCtx.strokeStyle = '#ffffff';
  nCtx.lineWidth = 4;
  nCtx.strokeRect(4, 4, 504, 120);
  nCtx.font = 'bold 38px Arial';
  nCtx.fillStyle = '#ffffff';
  nCtx.textAlign = 'center';
  nCtx.textBaseline = 'middle';
  nCtx.fillText(waypoint.name, 256, 42);
  nCtx.font = '20px Arial';
  nCtx.fillStyle = '#ffcc00';
  nCtx.fillText('🛑 STOP AT RED SIGNAL', 256, 85);

  const nameTexture = new THREE.CanvasTexture(nameCanvas);
  const nameBoardMat = new THREE.MeshBasicMaterial({ map: nameTexture, side: THREE.DoubleSide });
  const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.9), nameBoardMat);
  // Mount on roadside sidewalk post instead of blocking the sky
  nameBoard.position.set(ROAD.halfWidth + 2.5, 3.0, -150);
  nameBoard.userData.baseX = nameBoard.position.x;
  scene.add(nameBoard);
  S.activeJunctionAssets.push(nameBoard);

  const timerEl = document.getElementById('junction-timer');
  const nameEl = document.getElementById('junction-timer-name');
  const fillEl = document.getElementById('junction-timer-fill');
  const stopEl = document.getElementById('stop-instruction');

  S.activeTrafficLight = {
    mesh: stopLine,
    state: 'red',
    waypointData: waypoint,
    timerEl: timerEl,
    timerFill: fillEl,
    stopEl: stopEl,
    prevZ: -150
  };
}

// ═══════════════════════════════════════════
//  ZONE-BASED REVIEWS & HIGH SCORE MESSAGES
// ═══════════════════════════════════════════
const ZONE_REVIEWS = [
  // Zone 0: Thrissur City
  [
    "Thrissur Pooram traffic-il thanne stuck aayi! 🐘",
    "Swaraj Round porum idichille... auto-de avastha! 🛺",
    "Thrissur city limit polum kadannilla mone! 😤",
    "Round-il oru round poyi... athum mathi ennu thonni? 🔄",
  ],
  // Zone 1: Paliyekkara Toll
  [
    "Toll adikkathe speed-il poyi! Toll uncle crying 😢",
    "FASTag illa, speed illa, sense illa — full combo! 💀",
    "Toll booth kaanumbol brake adikku mone! Basic! 🚧",
    "Paliyekkara-yil record speed — but wrong record! 🏎️",
  ],
  // Zone 2: Chalakudy & Koratty
  [
    "Chalakudy road-le pothole kandilla? Kannu thurann odi! 👀",
    "Koratty junction-il signal break cheytho? Old style! 🚦",
    "Highway cruising ennu parayumbol crash cheyyaruth! 🛣️",
    "Chalakudy river polum kaanaathe poyi — slow down! 🌊",
  ],
  // Zone 3: Angamaly & Aluva
  [
    "Airport kaanam ennu vech ee speed venda mone! ✈️",
    "Angamaly flyover ethaan nokkiyo? Nee auto-yil alla! 🛺",
    "Aluva bridge-il ninn view kaanam... but not like this! 🌉",
    "Angamaly junction-il signal kaanilla? Undo mone! 🚦",
  ],
  // Zone 4: Kalamassery
  [
    "College students polum better driving cheyyum! 📚",
    "Kalamassery metro pillar-il idicho? Metro varum, auto varilla! 🚇",
    "Industrial area-yil accident — factory workers laughing! 🏭",
    "Highway commuters polum ithra crash cheyyilla! 🚗",
  ],
  // Zone 5: Ernakulam City
  [
    "Ernakulam almost ethiyo... ALMOST! So close mone! 😭",
    "MG Road kaanum mumbe crash — classic tourist move! 🗺️",
    "Edappally flyover kaanum mumbe crash — classic move! 🛣️",
    "Marine Drive ethaan patilla — auto disaster aanu nee! 🌊",
  ],
];

const HIGHSCORE_REVIEWS = [
  "Adipoli mone! New record! Auto Chettan approved! 🏆",
  "Pwoli driving! NH544-le puthan record! 🥇",
  "Superb! Ithrem nannaayi auto odikkunna aareyum kandittilla! 🌟",
  "Record broken! Chettan-de auto-yil GPS track cheythu! 📍",
  "Kidu! Oru auto rickshaw-inu ithrem possible ennu ariyilla! 🛺",
  "Mass! Thrissur to Ernakulam — nee king aada! 👑",
];

// ═══════════════════════════════════════════
//  GAME LIFECYCLE
// ═══════════════════════════════════════════
function startGame() {
  S.started = true;
  SoundEngine.resume();
  SoundEngine.startEngine();
  document.body.classList.add('game-active');
  if (DOM.startScreen) DOM.startScreen.classList.add('hidden');
  // Clear any stale ride zones
  clearArray(S.pickupZones);
  clearArray(S.dropoffZones);
  S.hasCustomer = false;
  S.savariPickupTimer = 0;
  if (DOM.rideCard) DOM.rideCard.classList.remove('hidden');
  if (DOM.rideCardAction) { DOM.rideCardAction.textContent = 'PICKUP'; DOM.rideCardAction.className = 'ride-action pickup'; }
  if (DOM.ridePassengerName) DOM.ridePassengerName.textContent = S.activePassenger.name;
  if (DOM.ridePassengerMeta) DOM.ridePassengerMeta.textContent = `${S.activePassenger.rating} · Cash`;
  if (DOM.rideDestText) DOM.rideDestText.textContent = 'Waiting at roadside · Stop beside yellow beam';
  if (DOM.rideAvatar) DOM.rideAvatar.textContent = S.activePassenger.name.charAt(0);
  if (DOM.savariStatus) DOM.savariStatus.classList.remove('active');
  if (DOM.multBadge) DOM.multBadge.classList.remove('active');
  // Ensure waypoints built for current route
  buildWaypointsForRoute();
  // Set start position for reverse
  if (S.route === 'reverse') {
    S.distanceTraveled = Math.max(0, (S.totalJourneyDistance || 0) - 900);
  } else {
    S.distanceTraveled = 0;
  }
  S.nextWaypointIndex = 0;
  if (S.waypoints) {
    S.waypoints.forEach(wp => { wp.spawned = false; });
  }
  const activeZones = getActiveZones();
  if (DOM.zoneName) DOM.zoneName.textContent = activeZones[0].name;
  scene.background = new THREE.Color(activeZones[0].skyTop);
  scene.fog.color.setHex(activeZones[0].fogColor);
  scene.fog.density = activeZones[0].fogDensity;
  ambientLight.color.setHex(activeZones[0].ambientColor);
  ambientLight.intensity = activeZones[0].ambientInt;
  const journeyFill = document.getElementById('journey-fill');
  const journeyAuto = document.getElementById('journey-auto');
  if (journeyFill) journeyFill.style.width = S.route === 'reverse' ? '100%' : '0%';
  if (journeyAuto) journeyAuto.style.left = S.route === 'reverse' ? '100%' : '0%';

  // Initialize Today's Net with daily auto rent (-₹250)
  if (DOM.hudNet) {
    DOM.hudNet.textContent = '-₹250';
    DOM.hudNet.className = 'hud-net-value negative';
  }
  if (DOM.rideCard) DOM.rideCard.classList.remove('hidden');

  // Initial spawns: traffic, coins, and immediate first customer
  for (let i = 0; i < 4; i++) spawnSameDirectionObstacle();
  for (let i = 0; i < 3; i++) spawnOncomingVehicle();
  for (let i = 0; i < 3; i++) spawnCoin();
  S.savariPickupTimer = 15;
  if (!S.hasCustomer && S.pickupZones.length === 0) spawnPickupZone();
}

function gameOver(hitType = 'traffic') {
  if (S.over) return;
  S.over = true;
  SoundEngine.playCrash();
  SoundEngine.stopEngine();
  document.body.classList.remove('game-active');
  const activeZones = getActiveZones();
  if (DOM.gameOverZone) DOM.gameOverZone.textContent = activeZones[S.currentZone].name;
  if (DOM.gameOverScore) DOM.gameOverScore.textContent = S.score;
  if (DOM.flyingIndicator) DOM.flyingIndicator.classList.remove('visible');
  if (DOM.speedLines) DOM.speedLines.style.opacity = '0';
  if (DOM.gridlockWarn) DOM.gridlockWarn.classList.remove('visible');
  if (DOM.oncomingWarn) DOM.oncomingWarn.classList.remove('visible');
  if (DOM.rideCard) DOM.rideCard.classList.add('hidden');
  if (DOM.savariStatus) DOM.savariStatus.classList.remove('active');
  if (DOM.multBadge) DOM.multBadge.classList.remove('active');
  document.getElementById('toll-warning')?.classList.remove('visible');
  const jTimer = document.getElementById('junction-timer');
  if (jTimer) jTimer.style.display = 'none';
  document.getElementById('stop-instruction')?.classList.remove('visible');

  // Populate stats grid
  const distKm = (S.distanceTraveled / 100).toFixed(1);
  if (DOM.goDistance) DOM.goDistance.textContent = `${distKm} km`;
  if (DOM.goFares) DOM.goFares.textContent = `₹${S.fareTotal}`;
  if (DOM.goTopspeed) DOM.goTopspeed.textContent = `${S.topSpeed} km/h`;
  if (DOM.goTrips) DOM.goTrips.textContent = String(S.tripCount);

  const isNewHighScore = S.score > S.highScore;
  if (isNewHighScore) {
    S.highScore = S.score;
    localStorage.setItem('savariHS', S.highScore);
    if (DOM.gameOverHS) DOM.gameOverHS.textContent = '★ New High Score! ★';
  } else {
    if (DOM.gameOverHS) DOM.gameOverHS.textContent = 'Best: ' + S.highScore;
  }

  if (DOM.gameOver) DOM.gameOver.classList.add('visible');
  spawnExplosion(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);


  // AI Review — Custom zone reviews for normal deaths, Gemini API for new high scores only
  const aiRoastEl = document.getElementById('ai-roast');
  if (aiRoastEl) {
    if (isNewHighScore) {
      // Gemini API only for new high scores — celebratory review
      aiRoastEl.textContent = '🏆 Auto Chettan is impressed...';
      fetch(AI_ROAST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are "Auto Chettan", a warm and witty Kerala auto-rickshaw driver from Kochi. A player just set a NEW HIGH SCORE of ${S.score} points in "Savari Giri Giri", a driving game on the Thrissur-Ernakulam NH544 route. They reached ${getActiveZones()[S.currentZone].name}.

Write ONE short celebratory one-liner (8-12 words). Mix English with 1-2 Malayalam/Manglish words naturally. Be proud, not sarcastic.

Examples of tone: "Pwoli mone! Ernakulam vare ethiyo, adipoli driving!", "Mass record! NH544-le king nee thanne!", "Kidu! Auto Chettan-de salute undu mone!"

Reply with ONLY the one-liner, nothing else.`
            }]
          }]
        })
      })
        .then(res => res.json())
        .then(data => {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.length > 3 && text.length < 100) {
            aiRoastEl.textContent = '🏆 ' + text.trim();
          } else {
            aiRoastEl.textContent = '🏆 ' + HIGHSCORE_REVIEWS[Math.floor(Math.random() * HIGHSCORE_REVIEWS.length)];
          }
        })
        .catch(() => {
          aiRoastEl.textContent = '🏆 ' + HIGHSCORE_REVIEWS[Math.floor(Math.random() * HIGHSCORE_REVIEWS.length)];
        });
    } else {
      // Custom zone-based review — no API call
      const zoneReviews = ZONE_REVIEWS[S.currentZone] || ZONE_REVIEWS[0];
      aiRoastEl.textContent = zoneReviews[Math.floor(Math.random() * zoneReviews.length)];
    }
  }
}

function clearArray(arr) {
  arr.forEach(o => { scene.remove(o); disposeObject(o); });
  arr.length = 0;
}

function restartGame() {
  clearArray(S.obstacles);
  clearArray(S.oncomingVehicles);
  clearArray(S.coins);
  clearArray(S.potholes);
  clearArray(S.pickupZones);
  clearArray(S.dropoffZones);
  S.gridlockWalls.length = 0;
  clearArray(S.roadSigns);
  S.crossTraffic.length = 0;
  S.particles.forEach(p => { scene.remove(p.mesh); disposeObject(p.mesh); });
  S.particles.length = 0;

  cleanupActiveJunction();
  if (S.gridlockTimeoutId) {
    clearTimeout(S.gridlockTimeoutId);
    S.gridlockTimeoutId = null;
  }
  
  if (S.activeTollBooth) {
    scene.remove(S.activeTollBooth.boothMesh);
    scene.remove(S.activeTollBooth.stopLineMesh);
    scene.remove(S.activeTollBooth.speedSign);
    disposeObject(S.activeTollBooth.boothMesh);
    disposeObject(S.activeTollBooth.stopLineMesh);
    disposeObject(S.activeTollBooth.speedSign);
    S.activeTollBooth = null;
  }
  const tollWarn = document.getElementById('toll-warning');
  if (tollWarn) tollWarn.classList.remove('visible');

  const journeyFill = document.getElementById('journey-fill');
  const journeyAuto = document.getElementById('journey-auto');
  if (journeyFill) journeyFill.style.width = S.route === 'reverse' ? '100%' : '0%';
  if (journeyAuto) journeyAuto.style.left = S.route === 'reverse' ? '100%' : '0%';
  S.waypoints.forEach(wp => {
    if (wp.pinEl) wp.pinEl.classList.remove('passed');
  });

  // Rebuild waypoints for current route BEFORE computing start offset
  buildWaypointsForRoute();

  Object.assign(S, {
    over: false, score: 0, speed: 0, velocity: 0,
    playerX: -3.5, playerTargetX: -3.5,
    steerSpeed: S.baseSteerSpeed,
    isFlying: false, flyTimer: 0,
    verticalVelocity: 0, chassisRoll: 0, chassisPitch: 0,
    boostMeter: 0, boostReady: false,
    hasCustomer: false,
    gridlockTimer: 0, gridlockWarning: false, gridlockActive: false,
    obstacleTimer: 0, oncomingTimer: 0, coinTimer: 0,
    potholeTimer: 0, signTimer: 0, savariPickupTimer: 0,
    distanceTraveled: S.route === 'reverse' ? Math.max(0, (S.totalJourneyDistance || 0) - 900) : 0,
    distanceScore: 0, bonusScore: 0, currentZone: 0,
    fareTotal: 0, tripCount: 0, topSpeed: 0,
    gameTimeHour: DAY_START_HOUR,
    nextWaypointIndex: 0, gear: 1, gearChangeCooldown: 0, junctionApproachDist: null,
    curveAmplitudeCurrent: 2.0, curveAmplitudeTarget: 2.0, gridlockTimeoutId: null,
  });

  // Ensure waypoint flags are clean after rebuild
  if (S.waypoints) {
    S.waypoints.forEach(wp => { wp.spawned = false; });
  }

  SoundEngine.resume();
  SoundEngine.startEngine();

  const jTimer = document.getElementById('junction-timer');
  if (jTimer) jTimer.style.display = 'none';

  playerGroup.position.set(-3.5, 0, 0);
  playerGroup.rotation.set(0, 0, 0);
  wingGroup.visible = false;

  if (DOM.gameOver) DOM.gameOver.classList.remove('visible');
  document.getElementById('educational-overlay')?.classList.remove('visible');
  if (DOM.hudNet) {
    DOM.hudNet.textContent = '-₹250';
    DOM.hudNet.className = 'hud-net-value negative';
  }
  if (DOM.boostInner) DOM.boostInner.style.width = '0%';
  if (DOM.boostReady) DOM.boostReady.classList.remove('active');

  const activeZones = getActiveZones();
  if (DOM.zoneName) DOM.zoneName.textContent = activeZones[0].name;
  if (DOM.savariStatus) DOM.savariStatus.classList.remove('active');
  if (DOM.multBadge) DOM.multBadge.classList.remove('active');
  if (DOM.hudClock) DOM.hudClock.textContent = formatClock(DAY_START_HOUR);
  if (DOM.hudTimeIcon) DOM.hudTimeIcon.textContent = getTimeIcon(DAY_START_HOUR);

  // Reset sky & lighting
  scene.background = new THREE.Color(activeZones[0].skyTop);
  scene.fog.color.setHex(activeZones[0].fogColor);
  scene.fog.density = activeZones[0].fogDensity;
  ambientLight.color.setHex(activeZones[0].ambientColor);
  ambientLight.intensity = activeZones[0].ambientInt;
  S.roadMarkings.forEach(rm => {
    if (rm.userData?.isLongSegment && rm.geometry?.parameters?.width === 120) {
      rm.material.color.setHex(activeZones[0].groundColor);
    }
    if (rm.userData?.isRoadSegment) {
      rm.material.color.setHex(0x1a1a1a);
    }
  });
  waterMat.opacity = S.route === 'reverse' ? 0.7 : 0.3;

  for (let i = 0; i < 4; i++) spawnSameDirectionObstacle();
  for (let i = 0; i < 3; i++) spawnOncomingVehicle();
  for (let i = 0; i < 3; i++) spawnCoin();
  spawnPickupZone();
  if (DOM.rideCard) DOM.rideCard.classList.remove('hidden');
}

// ═══════════════════════════════════════════
//  MAIN GAME LOOP
// ═══════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  // All movement values are authored for 60 FPS. Normalise them by the real
  // frame time so 120 Hz / 30 Hz displays run at the same speed.
  const fr = dt * 60;
  const damp = (rate) => 1 - Math.pow(1 - rate, fr);

  if (!S.started || S.over) {
    if (!S.started) camera.position.x = -3.5 + Math.sin(Date.now() * 0.0004) * 1.5;
    renderer.render(scene, camera);
    return;
  }

  // ── Physics & Gear System ──
  if (S.gearChangeCooldown > 0) S.gearChangeCooldown -= dt;
  const gearFactor = S.velocity / S.maxVelocity;
  // Auto-shift up
  if (S.gear < S.maxGear && gearFactor > S.gearCeil[S.gear] * 0.92 && S.gearChangeCooldown <= 0) {
    S.gear++;
    S.gearChangeCooldown = 0.3;
  }
  // Auto-shift down
  if (S.gear > 1 && gearFactor < S.gearFloor[S.gear] * 0.8 && S.gearChangeCooldown <= 0) {
    S.gear--;
    S.gearChangeCooldown = 0.2;
  }

  // Dynamic road surface friction (rough dirt/gravel shoulder outside lane boundaries)
  const isOffRoad = S.playerX < -5.8 || S.playerX > 5.8;
  const surfaceFriction = isOffRoad ? 0.022 : 0.006;
  const aeroDrag = S.velocity * S.velocity * 0.008;

  const accel = isOffRoad ? S.gearAccel[S.gear] * 0.75 : S.gearAccel[S.gear];
  const maxVelAllowed = isOffRoad ? S.maxVelocity * 0.65 : S.maxVelocity;

  if (keys['ArrowUp'] || keys['KeyW']) {
    S.velocity = Math.min(S.velocity + accel * fr, maxVelAllowed * S.gearCeil[S.gear]);
  } else if (keys['ArrowDown'] || keys['KeyS']) {
    S.velocity = Math.max(S.velocity - S.braking * fr, 0);
    if (S.velocity > 0.35 && Date.now() - S.lastBrakeSoundTime > 650) {
      SoundEngine.playBrake();
      S.lastBrakeSoundTime = Date.now();
    }
  } else {
    S.velocity = Math.max(S.velocity - (surfaceFriction + aeroDrag) * fr, 0);
  }
  S.speed = S.velocity * fr;
  S.distanceTraveled += S.speed;
  // Update scores
  if (S.started && !S.over) {
    S.distanceScore += S.speed * 0.02;
    if (S.hasCustomer) {
      S.bonusScore += S.speed * 0.01;
    }
    S.score = Math.floor(S.distanceScore + S.bonusScore);
  }
  const speedNorm = S.velocity / S.maxVelocity;

  // Real-time engine sound update
  SoundEngine.updateEngine(S.velocity, S.maxVelocity, keys['ArrowUp'] || keys['KeyW']);

  // ── MAP WAYPOINT TRIGGER ──
  if (S.waypoints.length > 0 && S.nextWaypointIndex < S.waypoints.length) {
    const nextWP = S.waypoints[S.nextWaypointIndex];
    const triggerDist = S.route === 'reverse'
      ? Math.max(0, (S.totalJourneyDistance || 0) - S.distanceTraveled)
      : S.distanceTraveled;
    if (triggerDist > nextWP.triggerDistance - 150 && !nextWP.spawned) {
      nextWP.spawned = true;
      if (nextWP.isToll) {
        spawnTollBooth(nextWP);
      } else if (nextWP.isJunction) {
        spawnEducationalJunction(nextWP);
      } else {
        showPopup('📍 ' + nextWP.name, 'savari-popup dropoff');
      }
    }
    if (triggerDist > nextWP.triggerDistance + 50) {
      S.nextWaypointIndex++;
    }
  }

  // ── TRAFFIC LIGHT LOGIC ──
  if (S.activeTrafficLight) {
    const currentZ = S.activeTrafficLight.mesh.position.z + S.speed;
    const prevZ = S.activeTrafficLight.prevZ;
    S.activeTrafficLight.mesh.position.z = currentZ;
    S.activeTrafficLight.prevZ = currentZ;

    // Compute approach progress (150 → 0 units ahead)
    const distToStop = -currentZ;
    let pct = Math.max(0, Math.min(100, (1 - distToStop / 150) * 100));
    if (S.activeTrafficLight.timerFill) {
      S.activeTrafficLight.timerFill.style.width = pct + '%';
    }

    // 1. Calibrated Stopping Zone (stop anywhere in the last 80 units before the line)
    if (S.activeTrafficLight.state === 'red' && currentZ > -80 && currentZ <= 0) {
      if (S.velocity <= 0.05) {
        showPopup('✅ Good Stop! Light is Green — GO!', 'savari-popup pickup');
        S.activeTrafficLight.state = 'green';
        if (S.activeTrafficLight.stopEl) S.activeTrafficLight.stopEl.classList.remove('visible');
        if (S.activeTrafficLight.timerEl) S.activeTrafficLight.timerEl.style.display = 'none';
        // Update 3D traffic signal visuals to green
        S.activeJunctionAssets.forEach(asset => {
          if (asset.userData?.isTrafficSignal && asset.userData.lightMeshes) {
            asset.userData.lightMeshes[0].material.color.setHex(0x111111); // red off
            asset.userData.lightMeshes[1].material.color.setHex(0x111111); // yellow off
            asset.userData.lightMeshes[2].material.color.setHex(0x22dd44); // green on
          }
        });
        // Change stop line to green
        S.activeTrafficLight.mesh.material.color.setHex(0x22dd44);
        S.activeTrafficLight.mesh.material.opacity = 0.5;
        // Stop cross traffic
        S.crossTraffic.forEach(ct => { if (ct.userData) ct.userData.active = false; });
        S.activeJunctionAssets.forEach(asset => {
          if (asset.userData && asset.userData.active !== undefined) {
            asset.userData.active = false;
            asset.visible = true;
          }
        });
        console.log('🔊 SFX: Good stop! Signal is GREEN.');
      }
    }

    // 2. Swept collision: did we cross the line this frame while still RED?
    if (prevZ <= 0 && currentZ > 0) {
      // Hide UI when crossing
      if (S.activeTrafficLight.timerEl) S.activeTrafficLight.timerEl.style.display = 'none';
      if (S.activeTrafficLight.stopEl) S.activeTrafficLight.stopEl.classList.remove('visible');

      if (S.activeTrafficLight.state === 'red') {
        // Trigger proper game over flow
        gameOver('Red Light');
        showEducationalOverlay('red_light', { junctionName: S.activeTrafficLight.waypointData.name });
        return;
      }
    }

    // 3. Cleanup after passing the junction completely (allow it to scroll past)
    if (S.activeTrafficLight && currentZ > 120) {
      cleanupActiveJunction();
    }
  }

  // Scroll active junction assets (poles, zebra crossings, boards, cross-roads)
  S.activeJunctionAssets.forEach(asset => {
    // If it's a cross-traffic bus, it moves horizontally and checks collisions
    if (asset.userData && asset.userData.active !== undefined) {
      if (asset.userData.active) {
        asset.userData.baseX += asset.userData.speed * fr;
        // Deactivate when far off-screen
        if (asset.userData.baseX < -50 || asset.userData.baseX > 50) {
          asset.userData.active = false;
          asset.visible = false;
        }
        
        // T-Bone Collision Check (only if player is moving and hasn't stopped properly)
        if (!S.over && S.velocity > 0.1) {
          if (Math.abs(asset.position.z - playerGroup.position.z) < 2.5 && 
              Math.abs(asset.userData.baseX - playerGroup.position.x) < 3.5) {
            console.log('💥 T-BONE COLLISION!');
            gameOver('Cross Traffic Bus');
          }
        }
      }
    }
    asset.position.z += S.speed;
  });

  // ── TOLL BOOTH LOGIC ──
  if (S.activeTollBooth) {
    const currentZ = S.activeTollBooth.stopLineMesh.position.z + S.speed;
    const prevZ = S.activeTollBooth.prevZ;
    const speedKMH = Math.floor((S.velocity / S.maxVelocity) * 100);
    const distToToll = -currentZ;
    
    // Scroll components
    S.activeTollBooth.boothMesh.position.z += S.speed;
    S.activeTollBooth.stopLineMesh.position.z = currentZ;
    S.activeTollBooth.speedSign.position.z += S.speed;
    S.activeTollBooth.prevZ = currentZ;

    // Animate Barrier Arms
    if (S.activeTollBooth.boothMesh.userData && S.activeTollBooth.boothMesh.userData.barrierArms) {
      S.activeTollBooth.boothMesh.userData.barrierArms.forEach((armPivot, index) => {
        // Open FASTag lane (left lane, index 0) if speed is safe. Cash lane (index 1) stays closed.
        if (index === 0 && speedKMH <= 20 && distToToll < 25 && distToToll > -10) {
          armPivot.rotation.z = Math.min(armPivot.rotation.z + dt * 4, Math.PI / 2);
        } else if (distToToll < -10) {
          // Close after passing
          armPivot.rotation.z = Math.max(armPivot.rotation.z - dt * 2, 0);
        }
      });
    }

    // Swept collision: crossed the yellow line
    if (!S.activeTollBooth.passed && prevZ <= 0 && currentZ > 0) {
      S.activeTollBooth.passed = true;
      const tollWarn = document.getElementById('toll-warning');
      if (tollWarn) tollWarn.classList.remove('visible');
      
      // Check if player is in the blocked cash lane (right player lane)
      if (S.playerX > ROAD.cashLaneX) {
        console.log('💥 CRASH! Hit parked car in Cash Lane.');
        gameOver('Static Car');
        return;
      }

      if (speedKMH > 20) {
        console.log('💥 CRASH! Smashed into closed toll barrier.');
        gameOver('Toll Barrier');
        return;
      } else {
        S.bonusScore += 200;
        showPopup('✅ FASTag Scanned! +200', 'savari-popup pickup');
        SoundEngine.playTollBeep();
      }
    }

    if (currentZ > 40) {
      scene.remove(S.activeTollBooth.boothMesh);
      scene.remove(S.activeTollBooth.stopLineMesh);
      scene.remove(S.activeTollBooth.speedSign);
      disposeObject(S.activeTollBooth.boothMesh);
      disposeObject(S.activeTollBooth.stopLineMesh);
      disposeObject(S.activeTollBooth.speedSign);
      S.activeTollBooth = null;
    }
  }

  // ── JOURNEY PROGRESS BAR ──
  if (S.totalJourneyDistance > 0) {
    const pct = S.route === 'reverse'
      ? (1 - (S.distanceTraveled / S.totalJourneyDistance)) * 100
      : (S.distanceTraveled / S.totalJourneyDistance) * 100;
    const progressPct = Math.min(100, Math.max(0, pct));
    const journeyFill = document.getElementById('journey-fill');
    const journeyAuto = document.getElementById('journey-auto');
    if (journeyFill) journeyFill.style.width = progressPct + '%';
    if (journeyAuto) journeyAuto.style.left = progressPct + '%';

    // Highlight passed pins
    const triggerDist = S.route === 'reverse'
      ? Math.max(0, (S.totalJourneyDistance || 0) - S.distanceTraveled)
      : S.distanceTraveled;
    S.waypoints.forEach(wp => {
      if (wp.pinEl && !wp.pinEl.classList.contains('passed') && triggerDist >= wp.triggerDistance) {
        wp.pinEl.classList.add('passed');
      }
    });
  }

  // ── Gear Display ──
  if (DOM.gearValue) DOM.gearValue.textContent = S.gear;

  // ── Analog Speedometer (0 to 60 km/h) ──
  const speedKmH = Math.min(60, Math.round((S.velocity / S.maxVelocity) * 55));
  const needleAngle = -135 + (speedKmH / 60) * 270;
  if (DOM.speedoNeedle) DOM.speedoNeedle.setAttribute('transform', `rotate(${needleAngle} 70 70)`);
  if (DOM.speedoNum) DOM.speedoNum.textContent = speedKmH;
  if (speedKmH > S.topSpeed) S.topSpeed = speedKmH;

  // ── Digital Fare Meter (Kerala base fare ₹30 + ₹15/km) ──
  if (S.hasCustomer) {
    // 70 distance units = 1 real km (5800 units for 83km NH 544 route)
    const tripDistanceKm = Math.max(0, (S.distanceTraveled - S.tripStartDist) / 70);
    const currentFare = Math.max(30, Math.round(30 + Math.max(0, tripDistanceKm - 1.5) * 15));
    S.currentTripFare = currentFare;
    const tripSec = Math.floor((Date.now() - S.tripStartTime) / 1000);
    const tripMin = Math.floor(tripSec / 60);
    const secRem = tripSec % 60;

    if (DOM.meterFare) DOM.meterFare.textContent = currentFare;
    if (DOM.meterKm) DOM.meterKm.textContent = tripDistanceKm.toFixed(1).padStart(4, '0');
    if (DOM.meterTime) DOM.meterTime.textContent = `${tripMin}:${String(secRem).padStart(2, '0')}`;
    if (DOM.meterFlag) DOM.meterFlag.classList.add('flag-down');
  } else {
    if (DOM.meterFare) DOM.meterFare.textContent = '30';
    if (DOM.meterKm) DOM.meterKm.textContent = '00.0';
    if (DOM.meterTime) DOM.meterTime.textContent = '0:00';
    if (DOM.meterFlag) DOM.meterFlag.classList.remove('flag-down');
  }

  // ── Today's Net Earnings Card (Matching Reference Screenshots) ──
  S.todayNet = S.fareTotal - S.autoRent;
  if (DOM.hudNet) {
    if (S.todayNet < 0) {
      DOM.hudNet.textContent = `-₹${Math.abs(S.todayNet)}`;
      DOM.hudNet.className = 'hud-net-value negative';
    } else {
      DOM.hudNet.textContent = `₹${S.todayNet}`;
      DOM.hudNet.className = 'hud-net-value positive';
    }
  }

  // Goal progress fill towards ₹800 (Fares earned towards daily target)
  if (DOM.hudGoalFill) {
    const goalPct = Math.max(0, Math.min(100, (S.fareTotal / S.goal) * 100));
    DOM.hudGoalFill.style.width = goalPct + '%';
  }

  // Subtitle stats (matching Reference: Auto rent -₹250 · Fares ₹172 · 3 trips · 4.0 ★)
  if (DOM.hudSub) {
    const starRating = (4.0 + Math.min(1.0, S.tripCount * 0.1)).toFixed(1);
    DOM.hudSub.textContent = `Auto rent -₹${S.autoRent} · Fares ₹${S.fareTotal} · ${S.tripCount} trips · ${starRating} ★`;
  }

  // ── Day / Night cycle ──
  // Advance in-game time proportional to distance travelled
  const timeRange = DAY_END_HOUR - DAY_START_HOUR;  // 12 h
  S.gameTimeHour = DAY_START_HOUR + (S.distanceTraveled / GAME_DIST_TOTAL) * timeRange;
  const clockStr = formatClock(S.gameTimeHour);
  if (DOM.hudClock) DOM.hudClock.textContent = clockStr;
  if (DOM.hudTimeIcon) DOM.hudTimeIcon.textContent = getTimeIcon(S.gameTimeHour);

  // ── Zone ──
  updateZone();

  // ── DYNAMIC LIGHTING & SKY INTERPOLATION ──
  const activeZones = getActiveZones();
  let nextZoneIdx = Math.min(S.currentZone + 1, activeZones.length - 1);
  let startDist = S.currentZone === 0 ? 0 : ZONE_BOUNDARIES[S.currentZone - 1];
  let endDist = ZONE_BOUNDARIES[S.currentZone] || (startDist + 10000);
  let progress = Math.max(0, Math.min(1, (S.distanceTraveled - startDist) / (endDist - startDist)));

  const currentZObj = activeZones[S.currentZone];
  const nextZObj = activeZones[nextZoneIdx];

  // Fog color + density
  const fogColorStart = new THREE.Color(currentZObj.fogColor);
  const fogColorEnd = new THREE.Color(nextZObj.fogColor);
  scene.fog.color.copy(fogColorStart).lerp(fogColorEnd, progress);
  scene.fog.density = currentZObj.fogDensity + (nextZObj.fogDensity - currentZObj.fogDensity) * progress;

  // Sky background
  const bgStart = new THREE.Color(currentZObj.skyTop);
  const bgEnd = new THREE.Color(nextZObj.skyTop);
  if (!scene.background || !(scene.background instanceof THREE.Color)) scene.background = new THREE.Color();
  scene.background.copy(bgStart).lerp(bgEnd, progress);

  // Ambient light (color + intensity driven by zone)
  const ambStart = new THREE.Color(currentZObj.ambientColor);
  const ambEnd = new THREE.Color(nextZObj.ambientColor);
  ambientLight.color.copy(ambStart).lerp(ambEnd, progress);
  ambientLight.intensity = currentZObj.ambientInt + (nextZObj.ambientInt - currentZObj.ambientInt) * progress;

  // Directional sun: angle based on game time (sunrise=east, noon=high, sunset=west)
  {
    const sunAngle = ((S.gameTimeHour - 6) / 12) * Math.PI;  // 0 at 6AM, PI at 6PM
    dirLight.position.set(
      Math.cos(sunAngle) * 15,
      Math.max(2, Math.sin(sunAngle) * 20),
      8
    );
    // Sun intensity peaks at noon, low at dawn/dusk
    const sunInt = Math.max(0.1, Math.sin(sunAngle) * 0.85);
    dirLight.intensity = sunInt;
    // Sun color: warm at dawn/dusk, white at noon
    const sunT = Math.abs(0.5 - sunAngle / Math.PI) * 2;  // 1 at noon, 0 at edges
    dirLight.color.setRGB(
      1.0,
      0.6 + sunT * 0.4,
      0.4 + sunT * 0.6
    );
  }

  // Moon light: rises at dusk (zone 5)
  const neonBright = currentZObj.neonBrightness + (nextZObj.neonBrightness - currentZObj.neonBrightness) * progress;
  moonLight.intensity = neonBright * 0.4;

  // Neon building lights: only bright in dusk/night zones
  S.buildings.forEach(obj => {
    if (obj.userData && obj.userData.isNeon) {
      obj.intensity = neonBright * (0.3 + Math.sin(Date.now() * 0.002 + obj.position.z) * 0.1);
    }
  });

  // Update minimap zone label
  if (DOM.minimapZoneLabel) DOM.minimapZoneLabel.textContent = ZONES[S.currentZone].name.split(' ')[0];


  // ── Player steering ──
  const effectiveSteer = S.hasCustomer ? S.steerSpeed * S.savariSteerPenalty : S.steerSpeed;
  const steerDelta = Math.max(effectiveSteer * S.speed * 3, 0.04 * fr);
  if (keys['ArrowLeft'] || keys['KeyA']) {
    S.playerTargetX = Math.max(S.playerTargetX - steerDelta, ROAD.boundaryLeft);
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    S.playerTargetX = Math.min(S.playerTargetX + steerDelta, ROAD.boundaryRight);
  }
  S.playerX += (S.playerTargetX - S.playerX) * damp(0.18);
  playerGroup.position.x = S.playerX;

  // ── Chassis Suspension: Roll & Pitch ──
  const steerInput = (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0);
  const targetRoll = -steerInput * (S.velocity / S.maxVelocity) * 0.12;
  S.chassisRoll += (targetRoll - S.chassisRoll) * damp(0.18);
  const tiltDelta = S.playerTargetX - S.playerX;
  playerGroup.rotation.z = S.chassisRoll - tiltDelta * 0.08;
  playerGroup.rotation.y = -tiltDelta * 0.025;

  let targetPitch = 0;
  if (keys['ArrowDown'] || keys['KeyS']) {
    targetPitch = 0.055; // Nose-dive on heavy braking
  } else if (keys['ArrowUp'] || keys['KeyW']) {
    targetPitch = -0.022; // Nose-lift on acceleration
  }
  S.chassisPitch += (targetPitch - S.chassisPitch) * damp(0.15);
  playerGroup.rotation.x = S.chassisPitch;

  // ── Oncoming traffic warning ──
  const onWrongSide = S.playerX > ROAD.medianX + ROAD.medianWidth / 2;
  if (onWrongSide && !S.isFlying) {
    DOM.oncomingWarn.classList.add('visible');
  } else {
    DOM.oncomingWarn.classList.remove('visible');
  }

  // ── Flying & Ballistic Parabolic Gravity ──
  if (S.isFlying) {
    S.flyTimer -= dt;
    S.verticalVelocity = (S.flyHeight - playerGroup.position.y) * 4.5;
    playerGroup.position.y += S.verticalVelocity * dt;
    leftWing.rotation.z = Math.sin(Date.now() * 0.007) * 0.14 - 0.08;
    rightWing.rotation.z = -Math.sin(Date.now() * 0.007) * 0.14 + 0.08;
    spawnWingTrail();

    if (S.flyTimer <= 0) {
      S.isFlying = false;
      wingGroup.visible = false;
      DOM.flyingIndicator.classList.remove('visible');
      DOM.speedLines.style.opacity = '0';
      S.verticalVelocity = 0; // release lift to let gravity take over
    }
  } else if (playerGroup.position.y > 0 || S.verticalVelocity !== 0) {
    // Parabolic downward gravity
    const GRAVITY = 24.0;
    S.verticalVelocity -= GRAVITY * dt;
    playerGroup.position.y += S.verticalVelocity * dt;

    if (playerGroup.position.y <= 0) {
      playerGroup.position.y = 0;
      if (S.verticalVelocity < -2.5) {
        // Landing bounce with suspension rebound
        S.verticalVelocity = -S.verticalVelocity * 0.32;
        SoundEngine.playLanding();
        showPopup('💥 LANDED!', 'coin-popup');
      } else {
        S.verticalVelocity = 0;
      }
    }
  } else {
    // Ground level: engine vibration & off-road gravel rumble
    const rumbleMag = isOffRoad ? 0.025 : (S.velocity > 0.05 ? 0.007 : 0.003);
    playerGroup.position.y = Math.sin(Date.now() * (isOffRoad ? 0.05 : 0.006)) * rumbleMag;
  }

  // Exhaust
  if (Math.random() < Math.min(1, 0.25 * fr)) spawnExhaust();

  // ── Same-direction obstacles ──
  S.obstacleTimer += dt;
  const spawnRate = Math.max(0.7, 2.3 - speedNorm * 1.4);
  if (S.obstacleTimer > spawnRate) {
    S.obstacleTimer = 0;
    spawnSameDirectionObstacle();
  }

  for (let i = S.obstacles.length - 1; i >= 0; i--) {
    const obs = S.obstacles[i];
    
    // Decoupled NPC velocity fix (?? keeps stationary gridlock vehicles at 0)
    const npcWorldSpeed = 0.4 * (obs.userData.speedMultiplier ?? 1) * fr;
    
    // Traffic-light-aware NPC braking behavior
    let effectiveNpcSpeed = npcWorldSpeed;
    if (S.activeTrafficLight && S.activeTrafficLight.state === 'red') {
      const stopLineZ = S.activeTrafficLight.mesh.position.z;
      // If NPC is approaching the stop line and is within 30 units, decelerate
      if (obs.position.z < stopLineZ && Math.abs(stopLineZ - obs.position.z) < 30) {
        effectiveNpcSpeed = npcWorldSpeed * (Math.abs(stopLineZ - obs.position.z) / 30);
      }
    }
    
    const relativeMovement = effectiveNpcSpeed - S.speed;
    obs.position.z -= relativeMovement;

    // Cull if too far ahead or behind
    if (obs.position.z > 18 || obs.position.z < -250) {
      scene.remove(obs);
      disposeObject(obs);
      S.obstacles.splice(i, 1);
      const gi = S.gridlockWalls.indexOf(obs);
      if (gi >= 0) S.gridlockWalls.splice(gi, 1);
      continue;
    }

    if (checkObstacleCollision(obs)) {
      gameOver(obs.userData.type || 'bus');
      return;
    }
  }

  // ── Oncoming traffic ──
  S.oncomingTimer += dt;
  const oncomingRate = Math.max(0.6, 1.8 - speedNorm * 0.8);
  if (S.oncomingTimer > oncomingRate) {
    S.oncomingTimer = 0;
    spawnOncomingVehicle();
  }

  for (let i = S.oncomingVehicles.length - 1; i >= 0; i--) {
    const v = S.oncomingVehicles[i];
    
    // Decoupled oncoming velocity
    const oncomingWorldSpeed = (v.userData.oncomingSpeed || 0.5) * fr;
    v.position.z += S.speed + oncomingWorldSpeed;

    if (v.position.z > 18 || v.position.z < -250) {
      scene.remove(v);
      disposeObject(v);
      S.oncomingVehicles.splice(i, 1);
      continue;
    }

    if (checkObstacleCollision(v)) {
      gameOver(v.userData.type || 'vehicle');
      return;
    }
  }

  // ── Coins ──
  S.coinTimer += dt;
  if (S.coinTimer > 1.6) {
    S.coinTimer = 0;
    spawnCoin();
  }

  for (let i = S.coins.length - 1; i >= 0; i--) {
    const c = S.coins[i];
    c.position.z += S.speed;
    c.rotation.y += dt * 3;
    c.position.y = 1.0 + Math.sin(Date.now() * 0.003 + i) * 0.18;

    if (c.position.z > 18) {
      scene.remove(c);
      disposeObject(c);
      S.coins.splice(i, 1);
      continue;
    }

    if (!c.userData.collected && checkCoinCollision(c)) {
      c.userData.collected = true;
      scene.remove(c);
      disposeObject(c);
      S.coins.splice(i, 1);

      S.boostMeter = Math.min(S.boostMeter + 25, S.boostMax);
      DOM.boostInner.style.width = S.boostMeter + '%';
      if (S.boostMeter >= S.boostMax && !S.boostReady) {
        S.boostReady = true;
        DOM.boostReady.classList.add('active');
      }

      S.bonusScore += 50 * (S.hasCustomer ? S.customerMultiplier : 1);
      showPopup('+🍌', 'coin-popup');
      SoundEngine.playCoin();

      for (let p = 0; p < 6; p++) {
        spawnParticle(
          c.position.x + (Math.random() - 0.5) * 0.4,
          c.position.y + (Math.random() - 0.5) * 0.4,
          c.position.z + (Math.random() - 0.5) * 0.4,
          0xffd700,
          { x: (Math.random() - 0.5) * 0.12, y: Math.random() * 0.12, z: (Math.random() - 0.5) * 0.08 },
          0.7
        );
      }
    }
  }

  // ── Potholes (NH 544) ──
  S.potholeTimer += dt;
  if (S.potholeTimer > 1.8 && (S.currentZone === 2 || S.currentZone === 3)) {
    S.potholeTimer = 0;
    spawnPothole();
  }
  for (let i = S.potholes.length - 1; i >= 0; i--) {
    S.potholes[i].position.z += S.speed;
    if (S.potholes[i].position.z > 18) {
      scene.remove(S.potholes[i]);
      disposeObject(S.potholes[i]);
      S.potholes.splice(i, 1);
    }
  }

  // ── Road Signs (speed limit, direction boards) ──
  S.signTimer += dt;
  if (S.signTimer > 4.0) {
    S.signTimer = 0;
    const validSpeeds = [30, 40, 50, 60, 80];
    const forwardDirs = [
      ['↑ ERNAKULAM 75 km', '↑ NH 544 STRAIGHT', '↖ OLLUR EXIT'],
      ['↑ PALIYEKKARA TOLL 1 km', '↑ CHALAKUDY 22 km', '↑ FASTag LANES'],
      ['↑ ANGAMALY 32 km', '↑ KORATTY 12 km', '↑ NH 544 STRAIGHT'],
      ['↑ ALUVA 16 km', '↖ AIRPORT EXIT 4 km', '↑ ERNAKULAM 36 km'],
      ['↑ KALAMASSERY 4 km', '↑ EDAPPALLY 10 km', '↖ CUSAT CAMPUS'],
      ['↑ EDAPPALLY BYPASS', '↑ MG ROAD 6 km', '↑ MARINE DRIVE 8 km'],
    ];
    const reverseDirs = [
      ['↑ THRISSUR 78 km', '↑ NH 544 NORTH', '↖ EDAPPALLY EXIT'],
      ['↑ KALAMASSERY 4 km', '↑ ALUVA 12 km', '↑ NH 544 STRAIGHT'],
      ['↑ ANGAMALY 16 km', '↖ AIRPORT JUNCTION', '↑ CHALAKUDY 34 km'],
      ['↑ CHALAKUDY 18 km', '↑ KORATTY 6 km', '↑ NH 544 STRAIGHT'],
      ['↑ PALIYEKKARA TOLL', '↑ OLLUR 14 km', '↑ FASTag LANES'],
      ['↑ SWARAJ ROUND 4 km', '↑ THRISSUR CITY', '↑ VADAKKUMNATHAN'],
    ];
    const activeDirSet = S.route === 'reverse' ? reverseDirs : forwardDirs;
    const dirs = activeDirSet[S.currentZone] || activeDirSet[0];
    [-1, 1].forEach(side => {
      const z = -140 - Math.random() * 100;
      const sign = Math.random() > 0.5
        ? createSpeedSign(side * (ROAD.halfWidth + 3), z, validSpeeds[Math.floor(Math.random() * validSpeeds.length)])
        : createDirectionBoard(side * (ROAD.halfWidth + 3), z, dirs[Math.floor(Math.random() * dirs.length)]);
      sign.userData.baseX = sign.position.x;
      scene.add(sign);
      S.roadSigns.push(sign);
    });
  }
  for (let i = S.roadSigns.length - 1; i >= 0; i--) {
    S.roadSigns[i].position.z += S.speed;
    if (S.roadSigns[i].position.z > 18) {
      scene.remove(S.roadSigns[i]);
      disposeObject(S.roadSigns[i]);
      S.roadSigns.splice(i, 1);
    }
  }

  // ── Savari (Customer) system ──
  S.savariPickupTimer += dt;
  if ((S.savariPickupTimer > 14 || S.distanceTraveled < 60) && !S.hasCustomer && S.pickupZones.length === 0) {
    S.savariPickupTimer = 0;
    spawnPickupZone();
  }

  // Pickup zones
  for (let i = S.pickupZones.length - 1; i >= 0; i--) {
    const pz = S.pickupZones[i];
    pz.position.z += S.speed;
    if (pz.children[1]) pz.children[1].rotation.z += dt * 2;
    if (pz.children[2]?.material) pz.children[2].material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.12;

    // Update mounted smartphone with live pickup distance
    if (!S.hasCustomer) {
      if (DOM.rideCard) DOM.rideCard.classList.remove('hidden');
      if (DOM.rideCardAction) { DOM.rideCardAction.textContent = 'PICKUP'; DOM.rideCardAction.className = 'ride-action pickup'; }
      if (DOM.rideAvatar) DOM.rideAvatar.textContent = S.activePassenger.name.charAt(0);
      if (DOM.ridePassengerName) DOM.ridePassengerName.textContent = S.activePassenger.name;
      if (DOM.ridePassengerMeta) DOM.ridePassengerMeta.textContent = `${S.activePassenger.rating} · Cash`;
      const dPick = Math.max(5, Math.round(Math.abs(pz.position.z - playerGroup.position.z)));
      if (DOM.rideDistance) DOM.rideDistance.textContent = `${dPick} m away`;
      if (DOM.rideDestText) DOM.rideDestText.textContent = 'Waiting at roadside · Stop beside yellow beam';
    }

    if (pz.position.z > 20) {
      scene.remove(pz);
      disposeObject(pz);
      S.pickupZones.splice(i, 1);
      // Auto-respawn another customer so player never drives without rides
      if (S.started && !S.over && !S.hasCustomer && S.pickupZones.length === 0) {
        setTimeout(() => {
          if (S.started && !S.over && !S.hasCustomer && S.pickupZones.length === 0) {
            spawnPickupZone();
          }
        }, 1500);
      }
      continue;
    }

    if (!pz.userData.triggered && checkZoneCollision(pz)) {
      pz.userData.triggered = true;
      S.hasCustomer = true;
      S.tripStartDist = S.distanceTraveled;
      S.tripStartTime = Date.now();
      S.steerSpeed = S.baseSteerSpeed;
      if (DOM.savariStatus) DOM.savariStatus.classList.add('active');
      if (DOM.multBadge) DOM.multBadge.classList.add('active');
      showPopup(`🧑 ${S.activePassenger.name} ON BOARD!`, 'savari-popup pickup');
      SoundEngine.playPickup();

      // Flip meter flag down
      if (DOM.meterFlag) DOM.meterFlag.classList.add('flag-down');

      // Update phone app to TRIP / DROP
      if (DOM.rideCardAction) {
        DOM.rideCardAction.textContent = 'DROP';
        DOM.rideCardAction.className = 'ride-action drop';
      }
      if (DOM.ridePassengerName) {
        DOM.ridePassengerName.textContent = S.activePassenger.name + ' (On board)';
      }
      if (DOM.ridePassengerMeta) {
        DOM.ridePassengerMeta.textContent = `${S.activePassenger.rating} · Cash · 😊`;
      }
      if (DOM.rideDestText) {
        DOM.rideDestText.textContent = S.activePassenger.dest;
      }

      scene.remove(pz);
      disposeObject(pz);
      S.pickupZones.splice(i, 1);

      // Spawn dropoff zone immediately ahead
      spawnDropoffZone();
    }
  }

  // Dropoff zones
  for (let i = S.dropoffZones.length - 1; i >= 0; i--) {
    const dz = S.dropoffZones[i];
    dz.position.z += S.speed;
    if (dz.children[1]) dz.children[1].rotation.z += dt * 2;
    if (dz.children[2]?.material) dz.children[2].material.opacity = 0.2 + Math.sin(Date.now() * 0.006) * 0.12;

    // Update smartphone with live dropoff distance
    if (S.hasCustomer) {
      const dDrop = Math.max(5, Math.round(Math.abs(dz.position.z - playerGroup.position.z)));
      if (DOM.rideDistance) DOM.rideDistance.textContent = `${dDrop} m away`;
      if (DOM.rideDestText) DOM.rideDestText.textContent = `${S.activePassenger.dest} · Pull over to stop`;
    }

    if (dz.position.z > 20) {
      scene.remove(dz);
      disposeObject(dz);
      S.dropoffZones.splice(i, 1);
      // Auto-respawn dropoff zone ahead so player never gets stranded
      if (S.started && !S.over && S.hasCustomer && S.dropoffZones.length === 0) {
        setTimeout(() => {
          if (S.started && !S.over && S.hasCustomer && S.dropoffZones.length === 0) {
            spawnDropoffZone();
          }
        }, 1500);
      }
      continue;
    }

    if (!dz.userData.triggered && S.hasCustomer && checkDropoffCollision(dz)) {
      dz.userData.triggered = true;
      S.hasCustomer = false;
      S.steerSpeed = S.baseSteerSpeed;
      if (DOM.savariStatus) DOM.savariStatus.classList.remove('active');
      if (DOM.multBadge) DOM.multBadge.classList.remove('active');

      // Earned fare matches the digital fare meter!
      const earnedFare = S.currentTripFare || 30;
      S.tripCount++;
      S.fareTotal += earnedFare;
      S.todayNet = S.fareTotal - S.autoRent;
      S.bonusScore += 500;
      showPopup(`✅ +500 PASSENGER DROPPED! (₹${earnedFare})`, 'savari-popup dropoff');
      SoundEngine.playDropoff();

      // Flip meter flag back up
      if (DOM.meterFlag) DOM.meterFlag.classList.remove('flag-down');

      // Phone app feedback
      if (DOM.rideCardAction) { DOM.rideCardAction.textContent = 'PAID'; DOM.rideCardAction.className = 'ride-action drop'; }
      if (DOM.rideDistance) DOM.rideDistance.textContent = `+₹${earnedFare}`;
      if (DOM.rideDestText) DOM.rideDestText.textContent = 'Trip completed! Fare collected';

      scene.remove(dz);
      disposeObject(dz);
      S.dropoffZones.splice(i, 1);

      // Celebration particles
      for (let p = 0; p < 18; p++) {
        spawnParticle(
          playerGroup.position.x + (Math.random() - 0.5) * 2,
          playerGroup.position.y + 1 + Math.random() * 2,
          playerGroup.position.z + (Math.random() - 0.5) * 2,
          Math.random() > 0.5 ? 0x66ffaa : 0xffd700,
          { x: (Math.random() - 0.5) * 0.2, y: Math.random() * 0.15, z: (Math.random() - 0.5) * 0.2 },
          1.0
        );
      }

      // Pick next passenger profile and spawn next pickup after 2.0s
      setTimeout(() => {
        const pNames = ['Varghese', 'Unnikrishnan', 'Sujatha', 'Ashraf', 'Manoj', 'Radhamani', 'Jayan'];
        const pDests = ['Ambalam · അമ്പലം', 'Shappu · കള്ളു ഷാപ്പ്', 'Masjid · പള്ളി', 'Boat Jetty · ബോട്ട് ജെട്ടി', 'School · സ്കൂൾ'];
        S.activePassenger = {
          name: pNames[Math.floor(Math.random() * pNames.length)],
          rating: (4.1 + Math.random() * 0.8).toFixed(1) + ' ★',
          dest: pDests[Math.floor(Math.random() * pDests.length)]
        };
        if (S.started && !S.over && !S.hasCustomer && S.pickupZones.length === 0) {
          spawnPickupZone();
        }
      }, 2000);
    }
  }

  // Auto tailpipe exhaust smoke puffs
  if (S.velocity > 0.08 && Math.random() > 0.45) {
    spawnParticle(
      playerGroup.position.x - 0.42 + (Math.random() - 0.5) * 0.08,
      playerGroup.position.y + 0.22,
      playerGroup.position.z + 1.0,
      0xcccccc,
      { x: (Math.random() - 0.5) * 0.04, y: 0.04 + Math.random() * 0.04, z: 0.1 + Math.random() * 0.08 },
      0.5
    );
  }

  // ── Gridlock system ──
  S.gridlockTimer += dt;
  if (S.gridlockTimer > S.gridlockInterval && !S.gridlockActive) {
    S.gridlockWarning = true;
    DOM.gridlockWarn.classList.add('visible');
    console.log('🔊 SFX: Gridlock warning!');

    S.gridlockActive = true;
    S.gridlockTimeoutId = setTimeout(() => {
      S.gridlockTimeoutId = null;
      if (S.started && !S.over) {
        spawnGridlockWall();
        S.gridlockWarning = false;
        DOM.gridlockWarn.classList.remove('visible');
      }
    }, 3000);

    S.gridlockTimer = 0;
  }

  // Check if gridlock walls have all passed
  if (S.gridlockActive && S.gridlockWalls.length === 0) {
    S.gridlockActive = false;
  }

  // ── Metro pillars scroll ──
  const showMetro = S.distanceTraveled > 4400;
  S.metroPillars.forEach(p => {
    p.visible = showMetro;
    p.position.z += S.speed;
    if (p.position.z > 18) p.position.z -= 260;
  });

  // ── World traffic signals scroll (always visible) ──
  S.signals.forEach(s => {
    s.position.z += S.speed;
    if (s.position.z > 18) s.position.z -= 260;
  });

  // ── Road markings scroll (median barriers + dashes) ──
  S.roadMarkings.forEach(m => {
    m.position.z += S.speed;
    if (m.position.z > 18) m.position.z -= 260;
  });

  // ── Buildings & palms parallax ──
  S.buildings.forEach(b => {
    b.position.z += S.speed * 0.7;
    if (b.position.z > 22) b.position.z -= 260;
    
    // Toggle neon lights in Ernakulam Corridor (Zone 5)
    if (b.userData && b.userData.isNeon) {
      b.intensity = S.currentZone === 5 ? 0.8 + Math.sin(Date.now() * 0.01 + b.position.x) * 0.4 : 0;
    }
  });
  S.palms.forEach(p => {
    p.position.z += S.speed;
    if (p.position.z > 22) p.position.z -= 260;
    // Subtle wind sway
    p.children.forEach((c, idx) => {
      if (idx > 0 && idx < 8) {
        c.rotation.z += Math.sin(Date.now() * 0.001 + idx) * 0.0003;
      }
    });
  });

  // ── Particles ──
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.mesh.position.x += p.vel.x * fr;
    p.mesh.position.y += p.vel.y * fr;
    p.mesh.position.z += p.vel.z * fr;
    p.life -= dt;
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      disposeObject(p.mesh);
      S.particles.splice(i, 1);
    }
  }

  // ── Camera follow ──
  const camTargetX = S.playerX * 0.35 + (1 - 0.35) * -3.5;
  const camTargetY = S.isFlying ? 10 : 5.8;

  const targetFOV = S.isFlying ? 80 : 65 + (speedNorm * 10);
  camera.fov += (targetFOV - camera.fov) * damp(0.05);
  camera.updateProjectionMatrix();

  camera.position.x += (camTargetX - camera.position.x) * damp(0.045);
  camera.position.y += (camTargetY - camera.position.y) * damp(0.04);

  let shakeX = 0;
  let shakeY = 0;
  if (S.velocity > 0.5 && !S.isFlying) {
    shakeX = (Math.random() - 0.5) * 0.05;
    shakeY = (Math.random() - 0.5) * 0.05;
  }

  camera.lookAt(
    (playerGroup.position.x * 0.4 + (1 - 0.4) * -3.5) + shakeX,
    (S.isFlying ? 4.5 : 1) + shakeY,
    -12
  );

  // ── Street lights scroll ──
  streetLights.forEach(sl => {
    sl.position.z += S.speed;
    if (sl.position.z > 15) sl.position.z -= 55;
    sl.intensity = 0.4 + Math.sin(Date.now() * 0.008 + sl.position.x) * 0.1;
  });

  // ── Headlight flicker ──
  headlightGlow.intensity = 0.4 + Math.sin(Date.now() * 0.003) * 0.08;

  // ── DYNAMIC ENVIRONMENT ──
  if (S.distanceTraveled > 4280 && S.distanceTraveled < 4400) {
    if (!S.onBridge) {
      S.onBridge = true;
      S.roadMarkings.forEach(rm => {
        if (rm.userData && rm.userData.isRoadSegment) {
          rm.material.color.setHex(0x555555); // Concrete bridge
        } else if (rm.geometry.type === 'PlaneGeometry' && rm.geometry.parameters.width === 120) {
          rm.material.color.setHex(0x1a4d80); // River
        }
      });
    }
  } else if (S.onBridge) {
    S.onBridge = false;
    S.roadMarkings.forEach(rm => {
      if (rm.userData && rm.userData.isRoadSegment) {
        rm.material.color.setHex(0x1a1a1a);
      } else if (rm.geometry.type === 'PlaneGeometry' && rm.geometry.parameters.width === 120) {
        rm.material.color.setHex(getActiveZones()[S.currentZone].groundColor);
      }
    });
  }

  // ── ARCADE CURVATURE SHIFT (Smooth Transition) ──
  const inTollPlaza = S.activeTollBooth !== null;
  const inJunction = S.activeTrafficLight !== null && S.activeTrafficLight.mesh.position.z > -100 && S.activeTrafficLight.mesh.position.z < 20;
  S.curveAmplitudeTarget = (inTollPlaza || inJunction) ? 0 : 2.0;
  S.curveAmplitudeCurrent += (S.curveAmplitudeTarget - S.curveAmplitudeCurrent) * 0.02;

  const curvePhase = S.distanceTraveled * 0.0015;
  const curveAmp = S.curveAmplitudeCurrent;
  const freq = 0.01;

  const applyCurve = (obj) => {
    if (obj?.userData?.baseX !== undefined) {
      let curvedX = obj.userData.baseX + Math.sin(curvePhase - obj.position.z * freq) * curveAmp;
      // Clamp oncoming vehicles to stay on their side of the median
      if (obj.userData?.isOncoming) {
        curvedX = Math.max(curvedX, ROAD.medianX + ROAD.medianWidth);
      }
      obj.position.x = curvedX;

      if (obj.userData.isLongSegment && curveAmp > 0.1) {
        const dx_dz = -curveAmp * freq * Math.cos(curvePhase - obj.position.z * freq);
        const yaw = Math.atan(dx_dz);
        if (obj.geometry?.type === 'PlaneGeometry') {
          obj.rotation.z = yaw;
        } else {
          obj.rotation.y = yaw;
        }
      }
    }
  };
  S.obstacles.forEach(applyCurve);
  S.oncomingVehicles.forEach(applyCurve);
  S.coins.forEach(applyCurve);
  S.potholes.forEach(applyCurve);
  S.roadSigns.forEach(applyCurve);
  S.pickupZones.forEach(applyCurve);
  S.dropoffZones.forEach(applyCurve);
  S.metroPillars.forEach(applyCurve);
  S.signals.forEach(applyCurve);
  S.roadMarkings.forEach(applyCurve);
  S.buildings.forEach(applyCurve);
  S.palms.forEach(applyCurve);
  S.activeJunctionAssets.forEach(applyCurve);
  streetLights.forEach(applyCurve);

  // ── CIRCULAR RADAR MINIMAP ──
  const minimap = document.getElementById('minimap');
  if (minimap) {
    const mW = minimap.width;   // 180
    const mH = minimap.height;  // 180
    const cx = mW / 2, cy = mH / 2, r = mW / 2 - 2;
    const ctx = minimap.getContext('2d');
    ctx.clearRect(0, 0, mW, mH);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background
    ctx.fillStyle = 'rgba(6,10,18,0.95)';
    ctx.fillRect(0, 0, mW, mH);

    // Concentric range rings
    [0.25, 0.5, 0.75].forEach(rf => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * rf, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,180,255,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Road lanes (vertical lines in minimap)
    // Player lanes (left of center)
    ROAD.playerLanes.forEach(lx => {
      const mx = cx + (lx / ROAD.boundaryRight) * (r * 0.55);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(mx - 1, cy - r, 2, r * 2);
    });
    // Median
    ctx.fillStyle = 'rgba(255,200,50,0.15)';
    ctx.fillRect(cx - 2, cy - r, 4, r * 2);
    // Oncoming lanes (right of center)
    ROAD.oncomingLanes.forEach(lx => {
      const mx = cx + (lx / ROAD.boundaryRight) * (r * 0.55);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(mx - 1, cy - r, 2, r * 2);
    });

    // Scale: 1 world unit = scale pixels on radar (ahead is UP = negative z in world)
    const scale = (r * 0.52) / 60;  // 60 world units visible ahead

    function worldToMap(wx, wz) {
      // player is always at center; wz negative = ahead
      const relZ = wz - playerGroup.position.z;  // negative = ahead
      const relX = wx - S.playerX;
      return [
        cx + relX * scale * 3.5,
        cy + relZ * scale     // ahead = up = negative y on canvas
      ];
    }

    // Obstacles (same-direction)
    S.obstacles.forEach(obs => {
      const [ox, oz] = worldToMap(obs.position.x, obs.position.z);
      if (ox > 4 && ox < mW-4 && oz > 4 && oz < mH-4) {
        ctx.fillStyle = obs.userData.isGridlock ? '#ff8800' : '#ff4444';
        ctx.beginPath();
        ctx.arc(ox, oz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Oncoming vehicles
    S.oncomingVehicles.forEach(v => {
      const [ox, oz] = worldToMap(v.position.x, v.position.z);
      if (ox > 4 && ox < mW-4 && oz > 4 && oz < mH-4) {
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.arc(ox, oz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Coins
    S.coins.forEach(coin => {
      const [ox, oz] = worldToMap(coin.position.x, coin.position.z);
      if (ox > 4 && ox < mW-4 && oz > 4 && oz < mH-4) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(ox, oz, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Pickup / dropoff zones
    S.pickupZones.forEach(pz => {
      const [ox, oz] = worldToMap(pz.position.x, pz.position.z);
      if (ox > 4 && ox < mW-4 && oz > 4 && oz < mH-4) {
        ctx.fillStyle = '#44ff88';
        ctx.fillRect(ox - 3, oz - 3, 6, 6);
      }
    });
    S.dropoffZones.forEach(dz => {
      const [ox, oz] = worldToMap(dz.position.x, dz.position.z);
      if (ox > 4 && ox < mW-4 && oz > 4 && oz < mH-4) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(ox - 3, oz - 3, 6, 6);
      }
    });

    // Journey progress arc (outer ring showing how far we are)
    const journeyPct = S.totalJourneyDistance > 0
      ? Math.min(1, S.distanceTraveled / S.totalJourneyDistance) : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, -Math.PI / 2, -Math.PI / 2 + journeyPct * Math.PI * 2, false);
    ctx.strokeStyle = '#66ffaa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Player triangle (always at center, pointing up)
    ctx.fillStyle = '#66ffaa';
    ctx.shadowColor = '#66ffaa';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rerouting text
    if (S.gridlockWarning || S.gridlockActive) {
      ctx.fillStyle = '#ffc832';
      ctx.font = 'bold 13px Teko, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('REROUTING', cx, cy + 20);
    }

    ctx.restore();
  }

  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════
//  RESIZE
// ═══════════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
