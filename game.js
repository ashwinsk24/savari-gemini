// ═══════════════════════════════════════════════════════════════
//  SAVARI GEMINI — Game Engine
//  Kerala Auto-Rickshaw Arcade · Ernakulam Airborne
// ═══════════════════════════════════════════════════════════════

/* ────────────────────────────
   ROAD LAYOUT (drives on LEFT)
   ──────────────────────────── 
   x: -7 ─────── -0.4 | 0.4 ─────── 7
       Player Lanes     Med.   Oncoming Lanes
       Lane1=-5  Lane2=-2.2       Lane1=2.2  Lane2=5
*/

// ─── CONSTANTS ───
const AI_ROAST_URL = 'https://savari-gemini.vercel.app/api/roast'; // Deploy to Vercel and update this URL

const ROAD = {
  totalWidth: 16,
  halfWidth: 8,
  playerLanes: [-5, -2.2],
  oncomingLanes: [2.2, 5],
  medianX: 0,
  medianWidth: 0.8,
  boundaryLeft: -6.8,
  boundaryRight: 6.8,
};

const ZONES = [
  { name: 'Thrissur City', subtitle: 'Departing Thrissur', fogColor: 0x0a1118, skyTop: 0x0a1118, skyBot: 0x1a2a22, groundColor: 0x0d1a0f },
  { name: 'Paliyekkara Toll', subtitle: 'Toll plaza — slow down!', fogColor: 0x0f0a1a, skyTop: 0x0f0a1a, skyBot: 0x1a1428, groundColor: 0x0c0f0a },
  { name: 'Chalakudy & Koratty', subtitle: 'Highway cruising', fogColor: 0x0c1610, skyTop: 0x0c1610, skyBot: 0x1a2818, groundColor: 0x0e1a0c },
  { name: 'Angamaly & Aluva', subtitle: 'Approaching airport', fogColor: 0x0a1118, skyTop: 0x0a1118, skyBot: 0x1a2a22, groundColor: 0x0d1a0f },
  { name: 'Kalamassery', subtitle: 'Industrial and university area', fogColor: 0x0f0a1a, skyTop: 0x0f0a1a, skyBot: 0x1a1428, groundColor: 0x0c0f0a },
  { name: 'Ernakulam City', subtitle: 'Destination approach', fogColor: 0x081a1e, skyTop: 0x081a1e, skyBot: 0x0f2a2a, groundColor: 0x0a1812 },
];
const ZONE_BOUNDARIES = [600, 1600, 3200, 4400, 5200];

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

  // flying
  isFlying: false,
  flyTimer: 0,
  flyDuration: 3.5,
  flyHeight: 6,
  boostMeter: 0,
  boostMax: 100,
  boostReady: false,

  // savari (customer)
  hasCustomer: false,
  customerMultiplier: 2,
  savariSteerPenalty: 0.7, // 30% slower

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
  currentZone: 0,

  // object pools
  obstacles: [],
  oncomingVehicles: [],
  coins: [],
  metroPillars: [],
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
  scoreValue: document.getElementById('score-value'),
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
};

// ═══════════════════════════════════════════
//  THREE.JS SETUP
// ═══════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(ZONES[0].fogColor, 0.014);
scene.background = new THREE.Color(0x070a0d);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(-3.5, 5.8, 9);
camera.lookAt(-3.5, 1, -12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

// ─── LIGHTING ───
const ambientLight = new THREE.AmbientLight(0x3a5544, 0.55);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 0.7);
dirLight.position.set(5, 18, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -25;
dirLight.shadow.camera.right = 25;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
scene.add(dirLight);

const moonLight = new THREE.DirectionalLight(0x99bbcc, 0.2);
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

// ── Median / Road Divider ──
for (let z = 10; z > -250; z -= 2.5) {
  const bGeo = new THREE.BoxGeometry(0.3, 0.35, 1.2);
  const bMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
  const b = new THREE.Mesh(bGeo, bMat);
  b.position.set(ROAD.medianX, 0.17, z);
  b.castShadow = true;
  b.userData.baseX = b.position.x;
  b.userData.isLongSegment = true;
  scene.add(b);
  S.roadMarkings.push(b);
}

// Median yellow lines
for (let side = -1; side <= 1; side += 2) {
  for (let z = 10; z > -270; z -= 10) {
    const lGeo = new THREE.PlaneGeometry(0.07, 10.5);
    const lMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
    const l = new THREE.Mesh(lGeo, lMat);
    l.rotation.x = -Math.PI / 2;
    l.position.set(ROAD.medianX + side * 0.35, 0.008, z);
    l.userData.baseX = l.position.x;
    l.userData.isLongSegment = true;
    scene.add(l);
    S.roadMarkings.push(l);
  }
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

// ── Sidewalk / Curb ──
function makeCurb(x) {
  for (let z = 10; z > -270; z -= 10) {
    const geo = new THREE.BoxGeometry(2, 0.25, 10.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0.1, z);
    m.receiveShadow = true;
    m.userData.baseX = m.position.x;
    m.userData.isLongSegment = true;
    scene.add(m);
    S.roadMarkings.push(m);
  }
}

makeCurb(-ROAD.halfWidth - 1);
makeCurb(ROAD.halfWidth + 1);

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

// ── Traffic Signals (Kerala-style) ──
function createTrafficSignal(x, z, forceState) {
  const g = new THREE.Group();
  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.6;
  g.add(pole);

  // Signal box
  const boxGeo = new THREE.BoxGeometry(0.3, 0.6, 0.25);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(0, 3.0, 0);
  g.add(box);

  // Lights (red, yellow, green) — only one active
  g.userData.isTrafficSignal = true;
  g.userData.lightMeshes = [];
  const lightStates = ['red', 'yellow', 'green'];
  const active = forceState || lightStates[Math.floor(Math.random() * 3)];
  const lightColors = { red: 0xff2200, yellow: 0xffcc00, green: 0x22dd44 };
  [2.85, 3.0, 3.15].forEach((y, i) => {
    const lGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const color = lightStates[i] === active ? lightColors[lightStates[i]] : 0x111111;
    const lMat = new THREE.MeshBasicMaterial({ color });
    const l = new THREE.Mesh(lGeo, lMat);
    l.position.set(0, y, 0.14);
    g.add(l);
    g.userData.lightMeshes.push(l);
  });

  // Small glow for active light
  if (active === 'green') {
    const glow = new THREE.PointLight(0x22dd44, 0.08, 3);
    glow.position.set(0, 3.0, 0.3);
    g.add(glow);
  }

  g.position.set(x, 0, z);
  return g;
}

for (let z = 5; z > -240; z -= 40 + Math.random() * 30) {
  [-1, 1].forEach(side => {
    const sig = createTrafficSignal(side * (ROAD.halfWidth + 2.5), z);
    sig.userData.baseX = sig.position.x;
  scene.add(sig);
    S.metroPillars.push(sig);
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

// ── Background Buildings (Kerala style) ──
function buildEnvironment() {
  const bldgColors = [0x1a1a2a, 0x16213e, 0x2a2020, 0x1e2e20, 0x2c2c34, 0x1f2820, 0x22201a];
  const roofColors = [0x8b3a2a, 0x9c4430, 0x7a3020, 0x6b2a1a]; // Terracotta

  for (let z = 5; z > -240; z -= 10 + Math.random() * 12) {
    [-1, 1].forEach(side => {
      const w = 3 + Math.random() * 5;
      const h = 3 + Math.random() * 10;
      const d = 3 + Math.random() * 5;

      // Wall
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: bldgColors[Math.floor(Math.random() * bldgColors.length)],
        roughness: 0.88,
      });
      const bldg = new THREE.Mesh(geo, mat);
      const xPos = side * (ROAD.halfWidth + 7 + Math.random() * 10);
      bldg.position.set(xPos, h / 2, z);
      bldg.receiveShadow = true;
      bldg.userData.baseX = bldg.position.x;
  scene.add(bldg);
      S.buildings.push(bldg);

      // Roof (terracotta)
      if (Math.random() > 0.4) {
        const rGeo = new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4);
        const rMat = new THREE.MeshStandardMaterial({
          color: roofColors[Math.floor(Math.random() * roofColors.length)],
          roughness: 0.8,
        });
        const roof = new THREE.Mesh(rGeo, rMat);
        roof.position.set(xPos, h + 0.15, z);
        roof.userData.baseX = roof.position.x;
  scene.add(roof);
        S.buildings.push(roof);
      }

      // Window lights
      const wCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < wCount; i++) {
        const wGeo = new THREE.PlaneGeometry(0.45, 0.55);
        const wMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xffeeaa : 0x88ccff,
          opacity: 0.3 + Math.random() * 0.3,
          transparent: true,
        });
        const win = new THREE.Mesh(wGeo, wMat);
        win.position.set(xPos + side * (-w / 2 - 0.01), 1.5 + Math.random() * (h - 2), z - d / 2 + Math.random() * d);
        win.rotation.y = side * Math.PI / 2;
        win.userData.baseX = win.position.x;
  scene.add(win);
        S.buildings.push(win);
      }

      // Neon Lights (City Vibe)
      if (Math.random() > 0.6) {
        const neonColors = [0xff0055, 0x00ffcc, 0xffcc00, 0xaa00ff];
        const nColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        const neon = new THREE.PointLight(nColor, 0, 15); // Start at 0 intensity
        neon.position.set(xPos + side * (-w / 2 - 0.5), h / 2, z);
        neon.userData.baseX = neon.position.x;
        neon.userData.isNeon = true;
        scene.add(neon);
        S.buildings.push(neon);
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

// ═══════════════════════════════════════════
//  PLAYER AUTO-RICKSHAW
// ═══════════════════════════════════════════
const playerGroup = new THREE.Group();

// Body
const bodyGeo = new THREE.BoxGeometry(1.15, 0.95, 1.9);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d8c2d, roughness: 0.55, metalness: 0.2 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.7;
body.castShadow = true;
playerGroup.add(body);

// Roof
const roofGeo = new THREE.BoxGeometry(1.25, 0.13, 2.0);
const roofMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.45, metalness: 0.3 });
const roofMesh = new THREE.Mesh(roofGeo, roofMat);
roofMesh.position.y = 1.22;
roofMesh.castShadow = true;
playerGroup.add(roofMesh);

// Front
const frontGeo = new THREE.BoxGeometry(0.95, 0.55, 0.1);
const frontMat = new THREE.MeshStandardMaterial({ color: 0x1a6b1a, roughness: 0.5 });
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

// Headlight
const hlGeo = new THREE.SphereGeometry(0.08, 8, 8);
const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
const headlightMesh = new THREE.Mesh(hlGeo, hlMat);
headlightMesh.position.set(0, 0.62, -1.05);
playerGroup.add(headlightMesh);

const headlightGlow = new THREE.PointLight(0xffffaa, 0.45, 10);
headlightGlow.position.set(0, 0.6, -1.8);
playerGroup.add(headlightGlow);

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

// ── Customer Pickup Zone (green) ──
function createPickupZone() {
  const g = new THREE.Group();
  const platGeo = new THREE.BoxGeometry(1.4, 0.08, 2.0);
  const platMat = new THREE.MeshStandardMaterial({
    color: 0x22cc66, emissive: 0x22cc66, emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.2, opacity: 0.75, transparent: true,
  });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = 0.05;
  g.add(plat);

  // Glow ring
  const ringGeo = new THREE.RingGeometry(0.8, 1.0, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, opacity: 0.3, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);

  // Beacon
  const beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, opacity: 0.25, transparent: true });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 1.3;
  g.add(beacon);

  g.userData = { type: 'pickup', triggered: false };
  return g;
}

// ── Customer Dropoff Zone (red) ──
function createDropoffZone() {
  const g = new THREE.Group();
  const platGeo = new THREE.BoxGeometry(1.4, 0.08, 2.0);
  const platMat = new THREE.MeshStandardMaterial({
    color: 0xdd3333, emissive: 0xdd3333, emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.2, opacity: 0.75, transparent: true,
  });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = 0.05;
  g.add(plat);

  const ringGeo = new THREE.RingGeometry(0.8, 1.0, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4444, opacity: 0.3, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);

  const beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff4444, opacity: 0.25, transparent: true });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 1.3;
  g.add(beacon);

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
  S.activeJunctionAssets.length = 0;
}

// ═══════════════════════════════════════════
//  COLLISION DETECTION
// ═══════════════════════════════════════════
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

function checkObstacleCollision(obs) {
  if (S.isFlying) return false;
  const halfW = 0.5;
  const halfD = 0.8;
  playerBox.min.set(
    playerGroup.position.x - halfW,
    playerGroup.position.y - 0.2,
    playerGroup.position.z - halfD
  );
  playerBox.max.set(
    playerGroup.position.x + halfW,
    playerGroup.position.y + 1.0,
    playerGroup.position.z + halfD
  );
  obstacleBox.setFromObject(obs);
  return playerBox.intersectsBox(obstacleBox);
}

function checkZoneCollision(zone) {
  const px = playerGroup.position.x, pz = playerGroup.position.z;
  const zx = zone.position.x, zz = zone.position.z;
  return Math.abs(px - zx) < 1.5 && Math.abs(pz - zz) < 2.0;
}

function checkCoinCollision(coin) {
  const dx = playerGroup.position.x - coin.position.x;
  const dz = playerGroup.position.z - coin.position.z;
  return Math.sqrt(dx * dx + dz * dz) < 1.4;
}

// ═══════════════════════════════════════════
//  SPAWN LOGIC
// ═══════════════════════════════════════════
function spawnSameDirectionObstacle() {
  const lane = ROAD.playerLanes[Math.floor(Math.random() * ROAD.playerLanes.length)];
  const r = Math.random();
  let obs;
  if (r < 0.35) obs = createKSRTCBus(false);
  else if (r < 0.65) obs = createContainerTruck(false);
  else obs = createSmallVehicle(false);

  obs.position.set(lane + (Math.random() - 0.5) * 0.6, 0, -130 - Math.random() * 25);
  obs.userData.speedMultiplier = 0.25 + Math.random() * 0.35;
  obs.userData.baseX = obs.position.x;
  scene.add(obs);
  S.obstacles.push(obs);
}

function spawnOncomingVehicle() {
  const lane = ROAD.oncomingLanes[Math.floor(Math.random() * ROAD.oncomingLanes.length)];
  const r = Math.random();
  let veh;
  if (r < 0.4) veh = createKSRTCBus(true);
  else if (r < 0.7) veh = createContainerTruck(true);
  else veh = createSmallVehicle(true);

  veh.position.set(lane + (Math.random() - 0.5) * 0.4, 0, -140 - Math.random() * 30);
  // Oncoming vehicles move much faster toward player
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
  // Place on leftmost edge of player lanes
  zone.position.set(ROAD.playerLanes[0] - 1.2, 0, -100 - Math.random() * 20);
  zone.userData.baseX = zone.position.x;
  scene.add(zone);
  S.pickupZones.push(zone);
}

function spawnDropoffZone() {
  const zone = createDropoffZone();
  // Place ahead on either player lane edge
  zone.position.set(ROAD.playerLanes[1] + 1.0, 0, -110 - Math.random() * 25);
  zone.userData.baseX = zone.position.x;
  scene.add(zone);
  S.dropoffZones.push(zone);
}

// ═══════════════════════════════════════════
//  ZONE MANAGEMENT
// ═══════════════════════════════════════════
function updateZone() {
  const prev = S.currentZone;
  let zone = ZONES.length - 1;
  for (let i = 0; i < ZONE_BOUNDARIES.length; i++) {
    if (S.distanceTraveled < ZONE_BOUNDARIES[i]) {
      zone = i;
      break;
    }
  }
  S.currentZone = zone;

  if (prev !== S.currentZone) {
    const z = ZONES[S.currentZone];
    DOM.zoneName.textContent = z.name;
    // Colors are now smoothly interpolated in animate()

    // Backwater visibility boost for Ernakulam corridor
    waterMat.opacity = S.currentZone === 5 ? 0.7 : 0.3;

    DOM.zoneTransTitle.textContent = z.name;
    DOM.zoneTransSub.textContent = z.subtitle;
    DOM.zoneTransition.classList.add('visible');
    setTimeout(() => DOM.zoneTransition.classList.remove('visible'), 2800);
  }
}

// ═══════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════
// Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    if ((transcript.includes('fly') || transcript.includes('pongi')) && S.boostReady) {
      activateBoost();
      const micIcon = document.getElementById('mic-icon');
      if (micIcon) {
        micIcon.classList.add('active');
        setTimeout(() => micIcon.classList.remove('active'), 1000);
      }
    }
  };
  recognition.onerror = (e) => console.log('Speech rec error', e);
}

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Enter') {
    if (!S.started) startGame();
    else if (S.over) restartGame();
  }
  if (e.code === 'Space' && S.started && !S.over) {
    e.preventDefault();
    activateBoost();
  }
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

// Click to start / restart
DOM.startScreen.addEventListener('click', () => {
  if (!S.started) startGame();
});
DOM.gameOver.addEventListener('click', () => {
  if (S.over) restartGame();
});

// Mobile
document.getElementById('mobile-left')?.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; });
document.getElementById('mobile-left')?.addEventListener('touchend', () => { keys['ArrowLeft'] = false; });
document.getElementById('mobile-right')?.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; });
document.getElementById('mobile-right')?.addEventListener('touchend', () => { keys['ArrowRight'] = false; });
document.getElementById('mobile-up')?.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowUp'] = true; });
document.getElementById('mobile-up')?.addEventListener('touchend', () => { keys['ArrowUp'] = false; });
document.getElementById('mobile-down')?.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowDown'] = true; });
document.getElementById('mobile-down')?.addEventListener('touchend', () => { keys['ArrowDown'] = false; });
document.getElementById('mobile-boost')?.addEventListener('touchstart', e => { e.preventDefault(); activateBoost(); });

function activateBoost() {
  if (S.boostReady && !S.isFlying && S.started && !S.over) {
    S.isFlying = true;
    S.flyTimer = S.flyDuration;
    S.boostMeter = 0;
    S.boostReady = false;
    wingGroup.visible = true;
    DOM.flyingIndicator.classList.add('visible');
    DOM.boostReady.classList.remove('active');
    DOM.speedLines.style.opacity = '0.3';
    console.log('🔊 SFX: Pazham Pori Boost activated!');
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
async function loadMapData() {
  try {
    const response = await fetch('./level_data.json');
    const rawData = await response.json();
    const elements = rawData.elements || [];

    const namedElements = elements.filter(el =>
      el.tags && (el.tags.highway === 'traffic_signals' || el.tags.barrier) && el.tags.name
    );
    // Find northernmost node (Thrissur side) as start reference
    let startLat = 0;
    namedElements.forEach(n => { if (n.lat > startLat) startLat = n.lat; });
    if (startLat === 0) startLat = 10.535;

    // Inject comprehensive list of major NH544 POIs
    const manualPOIs = [
      { lat: 10.424, name: 'Pudukkad' },
      { lat: 10.301, name: 'Chalakudy' },
      { lat: 10.267, name: 'Koratty' },
      { lat: 10.196, name: 'Angamaly' },
      { lat: 10.155, name: 'Nedumbassery Airport' },
      { lat: 10.108, name: 'Aluva Bridge' },
      { lat: 10.050, name: 'Kalamassery' },
      { lat: 10.025, name: 'Edappally Lulu Mall' },
      { lat: 10.003, name: 'Palarivattom' },
      { lat: 9.992, name: 'Kaloor' },
      { lat: 9.970, name: 'Ernakulam South' }
    ];

    manualPOIs.forEach(poi => {
      namedElements.push({
        lat: poi.lat,
        lon: 76.35, // visual dummy
        tags: { name: poi.name, junction: 'yes' }
      });
    });

    const LAT_TO_GAME_DISTANCE = 10000;

    S.waypoints = namedElements
      .map(point => {
        const latDiff = startLat - point.lat;
        const gameDistance = latDiff * LAT_TO_GAME_DISTANCE;
        return {
          lat: point.lat,
          lon: point.lon,
          name: point.tags.name,
          isToll: point.tags.barrier === 'toll_booth',
          isJunction: point.tags.junction === 'yes',
          triggerDistance: Math.max(0, gameDistance),
          spawned: false,
          pinEl: null
        };
      })
      .sort((a, b) => a.triggerDistance - b.triggerDistance);

    // Deduplicate waypoints that are very close together
    const deduped = [];
    S.waypoints.forEach(wp => {
      const last = deduped[deduped.length - 1];
      if (!last || Math.abs(wp.triggerDistance - last.triggerDistance) > 150) {
        deduped.push(wp);
      }
    });
    S.waypoints = deduped;

    // Compute total journey distance for the progress bar
    if (S.waypoints.length > 0) {
      S.totalJourneyDistance = S.waypoints[S.waypoints.length - 1].triggerDistance + 500;
    }

    // Create journey progress bar pins from real map data
    createJourneyPins();

    console.log(`🗺️ Map Loaded! ${S.waypoints.length} named POIs. Journey: ${S.totalJourneyDistance.toFixed(0)} units`);
    S.waypoints.forEach(w => console.log(`  ${w.triggerDistance.toFixed(0)}: ${w.name}${w.isToll ? ' (toll)' : ''}`));
  } catch (err) {
    console.error('Failed to load map data.', err);
  }
}

function createJourneyPins() {
  const bar = document.getElementById('journey-bar');
  if (!bar || S.totalJourneyDistance <= 0) return;

  let labelIndex = 0;
  S.waypoints.forEach(wp => {
    const pct = (wp.triggerDistance / S.totalJourneyDistance) * 100;
    const pin = document.createElement('div');
    pin.className = 'journey-pin';
    pin.style.left = pct + '%';

    const dot = document.createElement('div');
    dot.className = 'journey-pin-dot' + (wp.isToll ? ' toll' : '');
    pin.appendChild(dot);

    const label = document.createElement('div');
    label.className = 'journey-pin-label' + (wp.isToll ? ' toll' : '');
    let shortName = wp.name
      .replace(' Junction', ' Jct')
      .replace(', National Highway 47', '')
      .replace(' National Highway 47', '');
    if (shortName.length > 18) shortName = shortName.substring(0, 16) + '…';
    label.textContent = shortName;
    if (labelIndex % 2 === 1) {
      label.style.marginTop = '14px';
    }
    labelIndex++;
    pin.appendChild(label);

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
  g.rotation.y = x < 0 ? 0 : Math.PI;
  return g;
}

function createDirectionBoard(x, z, text) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), poleMat);
  pole.position.y = 1.6;
  g.add(pole);

  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 88);
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text || 'NH 544', 128, 48);

  const texture = new THREE.CanvasTexture(canvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), boardMat);
  board.position.set(0, 3.2, 0.15);
  g.add(board);

  g.position.set(x, 0, z);
  g.rotation.y = x < 0 ? 0 : Math.PI;
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
  const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), nameBoardMat);
  nameBoard.position.set(0, 6, -155);
  nameBoard.userData.baseX = nameBoard.position.x;
  scene.add(nameBoard);
  S.activeJunctionAssets.push(nameBoard);

  // Show junction timer
  const timerEl = document.getElementById('junction-timer');
  const nameEl = document.getElementById('junction-timer-name');
  const fillEl = document.getElementById('junction-timer-fill');
  if (timerEl && nameEl) {
    nameEl.textContent = '🛑 STOP — ' + waypoint.name.replace('Junction', 'Jct');
    timerEl.style.display = 'block';
  }

  // Show STOP instruction
  const stopEl = document.getElementById('stop-instruction');
  if (stopEl) stopEl.classList.add('visible');

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
    "CUSAT students polum better driving cheyyum! 📚",
    "Kalamassery metro pillar-il idicho? Metro varum, auto varilla! 🚇",
    "Industrial area-yil accident — factory workers laughing! 🏭",
    "InfoPark techies polum ithra crash cheyyilla! 💻",
  ],
  // Zone 5: Ernakulam City
  [
    "Ernakulam almost ethiyo... ALMOST! So close mone! 😭",
    "MG Road kaanum mumbe crash — classic tourist move! 🗺️",
    "Lulu Mall kaanam ennu vech ethra speed venam! 🛍️",
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
  document.body.classList.add('game-active');
  DOM.startScreen.classList.add('hidden');
  scene.background = new THREE.Color(ZONES[0].skyTop);

  // Initial spawns
  for (let i = 0; i < 4; i++) spawnSameDirectionObstacle();
  for (let i = 0; i < 3; i++) spawnOncomingVehicle();
  for (let i = 0; i < 3; i++) spawnCoin();

  // Start listening for 'Fly' or 'Pongi'
  if (recognition) {
    try { recognition.start(); } catch (e) { }
  }
}

function gameOver(hitType = 'traffic') {
  if (S.over) return;
  S.over = true;
  document.body.classList.remove('game-active');
  DOM.gameOverZone.textContent = ZONES[S.currentZone].name;
  DOM.gameOverScore.textContent = S.score;
  DOM.flyingIndicator.classList.remove('visible');
  DOM.speedLines.style.opacity = '0';
  DOM.gridlockWarn.classList.remove('visible');
  DOM.oncomingWarn.classList.remove('visible');
  DOM.savariStatus.classList.remove('active');
  DOM.multBadge.classList.remove('active');

  const isNewHighScore = S.score > S.highScore;
  if (isNewHighScore) {
    S.highScore = S.score;
    localStorage.setItem('savariHS', S.highScore);
    DOM.gameOverHS.textContent = '★ New High Score! ★';
  } else {
    DOM.gameOverHS.textContent = 'Best: ' + S.highScore;
  }

  DOM.gameOver.classList.add('visible');
  spawnExplosion(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
  console.log('🔊 SFX: Crash!');

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
              text: `You are "Auto Chettan", a warm and witty Kerala auto-rickshaw driver from Kochi. A player just set a NEW HIGH SCORE of ${S.score} points in "Savari Gemini", a driving game on the Thrissur-Ernakulam NH544 route. They reached ${ZONES[S.currentZone].name}.

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
  clearArray(S.gridlockWalls);
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
  if (journeyFill) journeyFill.style.width = '0%';
  if (journeyAuto) journeyAuto.style.left = '0%';
  S.waypoints.forEach(wp => {
    if (wp.pinEl) wp.pinEl.classList.remove('passed');
  });

  Object.assign(S, {
    over: false, score: 0, speed: 0, velocity: 0,
    playerX: -3.5, playerTargetX: -3.5,
    steerSpeed: S.baseSteerSpeed,
    isFlying: false, flyTimer: 0,
    boostMeter: 0, boostReady: false,
    hasCustomer: false,
    gridlockTimer: 0, gridlockWarning: false, gridlockActive: false,
    obstacleTimer: 0, oncomingTimer: 0, coinTimer: 0,
    potholeTimer: 0, signTimer: 0, savariPickupTimer: 0,
    distanceTraveled: 0, currentZone: 0,
    nextWaypointIndex: 0, gear: 1, gearChangeCooldown: 0, junctionApproachDist: null,
    curveAmplitudeCurrent: 2.0, curveAmplitudeTarget: 2.0, gridlockTimeoutId: null,
  });

  const jTimer = document.getElementById('junction-timer');
  if (jTimer) jTimer.style.display = 'none';

  S.waypoints.forEach(wp => wp.spawned = false);

  playerGroup.position.set(-3.5, 0, 0);
  wingGroup.visible = false;

  DOM.gameOver.classList.remove('visible');
  DOM.scoreValue.textContent = '0';
  DOM.boostInner.style.width = '0%';
  DOM.boostReady.classList.remove('active');
  DOM.zoneName.textContent = ZONES[0].name;
  DOM.savariStatus.classList.remove('active');
  DOM.multBadge.classList.remove('active');
  scene.fog.color.set(ZONES[0].fogColor);
  scene.background = new THREE.Color(ZONES[0].skyTop);
  S.roadMarkings.forEach(rm => {
    if (rm.userData?.isLongSegment && rm.geometry?.parameters?.width === 120) {
      rm.material.color.setHex(ZONES[0].groundColor);
    }
    if (rm.userData?.isRoadSegment) {
      rm.material.color.setHex(0x1a1a1a);
    }
  });
  waterMat.opacity = 0.3;

  for (let i = 0; i < 4; i++) spawnSameDirectionObstacle();
  for (let i = 0; i < 3; i++) spawnOncomingVehicle();
  for (let i = 0; i < 3; i++) spawnCoin();
}

// ═══════════════════════════════════════════
//  MAIN GAME LOOP
// ═══════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

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

  const accel = S.gearAccel[S.gear];
  if (keys['ArrowUp'] || keys['KeyW']) {
    S.velocity = Math.min(S.velocity + accel, S.maxVelocity * S.gearCeil[S.gear]);
  } else if (keys['ArrowDown'] || keys['KeyS']) {
    S.velocity = Math.max(S.velocity - S.braking, 0);
  } else {
    S.velocity = Math.max(S.velocity - S.friction, 0);
  }
  S.speed = S.velocity;
  S.distanceTraveled += S.speed;

  // ── MAP WAYPOINT TRIGGER ──
  if (S.waypoints.length > 0 && S.nextWaypointIndex < S.waypoints.length) {
    const nextWP = S.waypoints[S.nextWaypointIndex];
    if (S.distanceTraveled > nextWP.triggerDistance - 150 && !nextWP.spawned) {
      nextWP.spawned = true;
      if (nextWP.isToll) {
        spawnTollBooth(nextWP);
      } else if (nextWP.isJunction) {
        spawnEducationalJunction(nextWP);
      } else {
        showPopup('📍 ' + nextWP.name, 'savari-popup dropoff');
      }
    }
    if (S.distanceTraveled > nextWP.triggerDistance + 50) {
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

    // 1. Calibrated Stopping Zone (Stop before the line!)
    if (S.activeTrafficLight.state === 'red' && currentZ > -30 && currentZ <= 0) {
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
        console.log('🔊 SFX: Good stop! Signal is GREEN.');
      }
    }

    // 2. Swept collision: did we cross the line this frame while still RED?
    if (prevZ <= 0 && currentZ > 0) {
      // Hide UI when crossing
      if (S.activeTrafficLight.timerEl) S.activeTrafficLight.timerEl.style.display = 'none';
      if (S.activeTrafficLight.stopEl) S.activeTrafficLight.stopEl.classList.remove('visible');

      if (S.activeTrafficLight.state === 'red') {
        S.over = true;
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
        asset.userData.baseX += asset.userData.speed;
        // Deactivate when far off-screen
        if (asset.userData.baseX < -50 || asset.userData.baseX > 50) {
          asset.userData.active = false;
          asset.visible = false;
        }
        
        // T-Bone Collision Check (only if player is moving and hasn't stopped properly)
        if (!S.over && S.speed > 0.1) {
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
      
      // Check if player is in the blocked cash lane (right side)
      if (S.playerX > -1.0) {
        console.log('💥 CRASH! Hit parked car in Cash Lane.');
        gameOver('Static Car');
        return;
      }

      if (speedKMH > 20) {
        console.log('💥 CRASH! Smashed into closed toll barrier.');
        gameOver('Toll Barrier');
        return;
      } else {
        S.score += 200;
        showPopup('✅ FASTag Scanned! +200', 'savari-popup pickup');
        console.log('🔊 SFX: Toll scanned successfully!');
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
    const progressPct = Math.min(100, (S.distanceTraveled / S.totalJourneyDistance) * 100);
    const journeyFill = document.getElementById('journey-fill');
    const journeyAuto = document.getElementById('journey-auto');
    if (journeyFill) journeyFill.style.width = progressPct + '%';
    if (journeyAuto) journeyAuto.style.left = progressPct + '%';

    // Highlight passed pins
    S.waypoints.forEach(wp => {
      if (wp.pinEl && !wp.pinEl.classList.contains('passed') && S.distanceTraveled >= wp.triggerDistance) {
        wp.pinEl.classList.add('passed');
      }
    });
  }

  // ── Gear Display ──
  const gearEl = document.getElementById('gear-value');
  if (gearEl) gearEl.textContent = S.gear;

  // ── Speedometer ──
  const displaySpeed = Math.floor((S.velocity / S.maxVelocity) * 100);
  const speedoEl = document.getElementById('speed-value');
  if (speedoEl) speedoEl.textContent = displaySpeed;

  // ── Score ──
  const mult = S.hasCustomer ? S.customerMultiplier : 1;
  S.score = Math.floor(S.distanceTraveled * 2 * mult);
  DOM.scoreValue.textContent = S.score;

  // ── Zone ──
  updateZone();

  // ── DYNAMIC LIGHTING & BACKGROUND INTERPOLATION ──
  let nextZoneIdx = Math.min(S.currentZone + 1, ZONES.length - 1);
  let startDist = S.currentZone === 0 ? 0 : ZONE_BOUNDARIES[S.currentZone - 1];
  let endDist = ZONE_BOUNDARIES[S.currentZone] || (startDist + 10000);
  let progress = Math.max(0, Math.min(1, (S.distanceTraveled - startDist) / (endDist - startDist)));
  
  const currentZObj = ZONES[S.currentZone];
  const nextZObj = ZONES[nextZoneIdx];

  const fogColorStart = new THREE.Color(currentZObj.fogColor);
  const fogColorEnd = new THREE.Color(nextZObj.fogColor);
  scene.fog.color.copy(fogColorStart).lerp(fogColorEnd, progress);

  const bgStart = new THREE.Color(currentZObj.skyTop);
  const bgEnd = new THREE.Color(nextZObj.skyTop);
  if (!scene.background || !(scene.background instanceof THREE.Color)) {
    scene.background = new THREE.Color();
  }
  scene.background.copy(bgStart).lerp(bgEnd, progress);

  ambientLight.color.copy(fogColorStart).lerp(fogColorEnd, progress);
  // Ernakulam city gets slightly brighter ambient lighting
  ambientLight.intensity = 0.55 + (S.currentZone === 5 ? progress * 0.3 : 0);

  // ── Player steering ──
  const effectiveSteer = S.hasCustomer ? S.steerSpeed * S.savariSteerPenalty : S.steerSpeed;
  const steerDelta = Math.max(effectiveSteer * S.speed * 3, 0.04);
  if (keys['ArrowLeft'] || keys['KeyA']) {
    S.playerTargetX = Math.max(S.playerTargetX - steerDelta, ROAD.boundaryLeft);
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    S.playerTargetX = Math.min(S.playerTargetX + steerDelta, ROAD.boundaryRight);
  }
  S.playerX += (S.playerTargetX - S.playerX) * 0.18;
  playerGroup.position.x = S.playerX;

  // Tilt
  const tiltDelta = S.playerTargetX - S.playerX;
  playerGroup.rotation.z = -tiltDelta * 0.12;
  playerGroup.rotation.y = -tiltDelta * 0.025;

  // ── Oncoming traffic warning ──
  const onWrongSide = S.playerX > ROAD.medianX + ROAD.medianWidth / 2;
  if (onWrongSide && !S.isFlying) {
    DOM.oncomingWarn.classList.add('visible');
  } else {
    DOM.oncomingWarn.classList.remove('visible');
  }

  // ── Flying ──
  if (S.isFlying) {
    S.flyTimer -= dt;
    playerGroup.position.y += (S.flyHeight - playerGroup.position.y) * 0.08;
    leftWing.rotation.z = Math.sin(Date.now() * 0.007) * 0.14 - 0.08;
    rightWing.rotation.z = -Math.sin(Date.now() * 0.007) * 0.14 + 0.08;
    spawnWingTrail();

    if (S.flyTimer <= 0) {
      S.isFlying = false;
      wingGroup.visible = false;
      DOM.flyingIndicator.classList.remove('visible');
      DOM.speedLines.style.opacity = '0';
    }
  } else {
    playerGroup.position.y += (0 - playerGroup.position.y) * 0.1;
  }

  // Auto wobble
  playerGroup.position.y += Math.sin(Date.now() * 0.004) * 0.006;

  // Exhaust
  if (Math.random() < 0.25) spawnExhaust();

  // ── Same-direction obstacles ──
  S.obstacleTimer += dt;
  const spawnRate = Math.max(0.7, 2.3 - S.speed * 1.4);
  if (S.obstacleTimer > spawnRate) {
    S.obstacleTimer = 0;
    spawnSameDirectionObstacle();
  }

  for (let i = S.obstacles.length - 1; i >= 0; i--) {
    const obs = S.obstacles[i];
    
    // Decoupled NPC velocity fix
    const npcWorldSpeed = 0.4 * (obs.userData.speedMultiplier || 1);
    
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
  const oncomingRate = Math.max(0.6, 1.8 - S.speed * 0.8);
  if (S.oncomingTimer > oncomingRate) {
    S.oncomingTimer = 0;
    spawnOncomingVehicle();
  }

  for (let i = S.oncomingVehicles.length - 1; i >= 0; i--) {
    const v = S.oncomingVehicles[i];
    
    // Decoupled oncoming velocity
    const oncomingWorldSpeed = v.userData.oncomingSpeed || 0.5;
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

      S.score += 50 * mult;
      showPopup('+🍌', 'coin-popup');
      console.log('🔊 SFX: Coin collected!');

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
  if (S.potholeTimer > 1.8 && S.currentZone === 3) {
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
    const zoneDirections = [
      ['Thrissur ←', 'Ernakulam →', 'NH 544'],
      ['Paliyekkara Toll', 'Chalakudy 25km', 'NH 544'],
      ['Chalakudy ←', 'Angamaly 40km', 'Koratty →'],
      ['Angamaly ←', 'Aluva 12km', 'Airport 8km'],
      ['Kalamassery ←', 'Ernakulam 6km', 'CUSAT →'],
      ['Ernakulam City', 'MG Road 2km', 'Marine Drive →'],
    ];
    [-1, 1].forEach(side => {
      const z = -140 - Math.random() * 100;
      const dirs = zoneDirections[S.currentZone] || zoneDirections[0];
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
  if (S.savariPickupTimer > 25 && !S.hasCustomer && S.pickupZones.length === 0) {
    S.savariPickupTimer = 0;
    spawnPickupZone();
  }

  // Pickup zones
  for (let i = S.pickupZones.length - 1; i >= 0; i--) {
    const pz = S.pickupZones[i];
    pz.position.z += S.speed;
    // Pulse animation
    pz.children[1].rotation.z += dt * 2;
    pz.children[2].material.opacity = 0.15 + Math.sin(Date.now() * 0.005) * 0.1;

    if (pz.position.z > 18) {
      scene.remove(pz);
      disposeObject(pz);
      S.pickupZones.splice(i, 1);
      continue;
    }

    if (!pz.userData.triggered && checkZoneCollision(pz)) {
      pz.userData.triggered = true;
      S.hasCustomer = true;
      S.steerSpeed = S.baseSteerSpeed;
      DOM.savariStatus.classList.add('active');
      DOM.multBadge.classList.add('active');
      showPopup('🧑 SAVARI ABOARD!', 'savari-popup pickup');
      console.log('🔊 SFX: Customer picked up!');

      scene.remove(pz);
      disposeObject(pz);
      S.pickupZones.splice(i, 1);

      // Spawn dropoff zone ahead
      setTimeout(() => { if (S.started && !S.over && S.hasCustomer) spawnDropoffZone(); }, 3000);
    }
  }

  // Dropoff zones
  for (let i = S.dropoffZones.length - 1; i >= 0; i--) {
    const dz = S.dropoffZones[i];
    dz.position.z += S.speed;
    dz.children[1].rotation.z += dt * 2;
    dz.children[2].material.opacity = 0.15 + Math.sin(Date.now() * 0.006) * 0.1;

    if (dz.position.z > 18) {
      scene.remove(dz);
      disposeObject(dz);
      S.dropoffZones.splice(i, 1);
      continue;
    }

    if (!dz.userData.triggered && S.hasCustomer && checkZoneCollision(dz)) {
      dz.userData.triggered = true;
      S.hasCustomer = false;
      S.steerSpeed = S.baseSteerSpeed;
      DOM.savariStatus.classList.remove('active');
      DOM.multBadge.classList.remove('active');

      S.score += 500;
      showPopup('✅ +500 DROP OFF!', 'savari-popup dropoff');
      console.log('🔊 SFX: Customer dropped off! +500 bonus');

      scene.remove(dz);
      disposeObject(dz);
      S.dropoffZones.splice(i, 1);

      // Celebration particles
      for (let p = 0; p < 15; p++) {
        spawnParticle(
          playerGroup.position.x + (Math.random() - 0.5) * 2,
          playerGroup.position.y + 1 + Math.random() * 2,
          playerGroup.position.z + (Math.random() - 0.5) * 2,
          Math.random() > 0.5 ? 0x66ffaa : 0xffd700,
          { x: (Math.random() - 0.5) * 0.2, y: Math.random() * 0.15, z: (Math.random() - 0.5) * 0.2 },
          1.0
        );
      }
    }
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
    p.mesh.position.x += p.vel.x;
    p.mesh.position.y += p.vel.y;
    p.mesh.position.z += p.vel.z;
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

  const targetFOV = S.isFlying ? 80 : 65 + (S.speed * 10);
  camera.fov += (targetFOV - camera.fov) * 0.05;
  camera.updateProjectionMatrix();

  camera.position.x += (camTargetX - camera.position.x) * 0.045;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;

  let shakeX = 0;
  let shakeY = 0;
  if (S.speed > 0.8 && !S.isFlying) {
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
        rm.material.color.setHex(ZONES[S.currentZone].groundColor);
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
  S.roadMarkings.forEach(applyCurve);
  S.buildings.forEach(applyCurve);
  S.palms.forEach(applyCurve);
  S.activeJunctionAssets.forEach(applyCurve);
  streetLights.forEach(applyCurve);

  // ── Minimap ──
  const minimap = document.getElementById('minimap');
  if (minimap) {
    const ctx = minimap.getContext('2d');
    ctx.clearRect(0, 0, 150, 150);

    // Player
    ctx.fillStyle = '#66ffaa';
    ctx.beginPath();
    const px = 75 + (S.playerX / ROAD.boundaryRight) * 50;
    ctx.moveTo(px, 130);
    ctx.lineTo(px - 6, 142);
    ctx.lineTo(px + 6, 142);
    ctx.fill();

    // Obstacles (same-direction = squares, oncoming = triangles pointing toward player)
    S.obstacles.forEach(obs => {
      const ox = 75 + (obs.position.x / ROAD.boundaryRight) * 50;
      const oz = ((obs.position.z + 150) / 165) * 150;
      if (oz > 0 && oz < 150) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(ox - 2, oz - 2, 4, 4);
      }
    });
    S.oncomingVehicles.forEach(obs => {
      const ox = 75 + (obs.position.x / ROAD.boundaryRight) * 50;
      const oz = ((obs.position.z + 150) / 165) * 150;
      if (oz > 0 && oz < 150) {
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.moveTo(ox, oz - 4);
        ctx.lineTo(ox - 3, oz + 3);
        ctx.lineTo(ox + 3, oz + 3);
        ctx.fill();
      }
    });
    // Coins
    S.coins.forEach(coin => {
      const cx = 75 + (coin.position.x / ROAD.boundaryRight) * 50;
      const cz = ((coin.position.z + 150) / 165) * 150;
      if (cz > 0 && cz < 150) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cz, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Rerouting text
    if (S.gridlockWarning || S.gridlockActive) {
      ctx.fillStyle = '#ffc832';
      ctx.font = 'bold 16px Teko';
      ctx.textAlign = 'center';
      ctx.fillText('REROUTING...', 75, 75);
    }
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

// ═══════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════
scene.background = new THREE.Color(0x070a0d);
animate();
