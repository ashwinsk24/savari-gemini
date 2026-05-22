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
  { name: 'Edappally Junction', subtitle: 'Dodge the Lulu Mall traffic!', fogColor: 0x0a1118, skyTop: 0x0a1118, skyBot: 0x1a2a22, groundColor: 0x0d1a0f },
  { name: 'Vyttila Junction', subtitle: 'Navigate the flyover pillars!', fogColor: 0x0f0a1a, skyTop: 0x0f0a1a, skyBot: 0x1a1428, groundColor: 0x0c0f0a },
  { name: 'Fort Kochi Seaside', subtitle: 'Backwaters & colonial charm!', fogColor: 0x081a1e, skyTop: 0x081a1e, skyBot: 0x0f2a2a, groundColor: 0x0a1812 },
  { name: 'NH 544 Muringoor', subtitle: 'Beware the craters!', fogColor: 0x0c1610, skyTop: 0x0c1610, skyBot: 0x1a2818, groundColor: 0x0e1a0c },
];

// ─── GAME STATE ───
const S = {
  started: false,
  over: false,
  score: 0,
  highScore: parseInt(localStorage.getItem('savariHS') || '0'),
  speed: 0.32,
  maxSpeed: 0.95,
  speedInc: 0.00007,
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
  savariPickupTimer: 0,

  // tracking
  distanceTraveled: 0,
  currentZone: 0,
  zoneTimer: 0,

  // object pools
  obstacles: [],
  oncomingVehicles: [],
  coins: [],
  metroPillars: [],
  roadMarkings: [],
  buildings: [],
  palms: [],
  potholes: [],
  particles: [],
  pickupZones: [],
  dropoffZones: [],
  gridlockWalls: [],
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
scene.add(new THREE.AmbientLight(0x3a5544, 0.55));

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
  scene.add(sl);
  streetLights.push(sl);
}

// ═══════════════════════════════════════════
//  WORLD BUILDING
// ═══════════════════════════════════════════

// ── Ground plane (vegetation) ──
const groundGeo = new THREE.PlaneGeometry(120, 400);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d1a0f, roughness: 0.95 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.15, -140);
ground.receiveShadow = true;
scene.add(ground);

// ── Road surface ──
const roadGeo = new THREE.PlaneGeometry(ROAD.totalWidth, 400);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92, metalness: 0.05 });
const roadMesh = new THREE.Mesh(roadGeo, roadMat);
roadMesh.rotation.x = -Math.PI / 2;
roadMesh.position.set(0, -0.01, -140);
roadMesh.receiveShadow = true;
scene.add(roadMesh);

// ── Grass strips alongside road ──
function makeGrass(x, w) {
  const geo = new THREE.PlaneGeometry(w, 400);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.95 });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, -0.005, -140);
  m.receiveShadow = true;
  scene.add(m);
}
makeGrass(-ROAD.halfWidth - 4, 8);
makeGrass(ROAD.halfWidth + 4, 8);

// ── Road edge lines ──
function makeEdgeLine(x, color) {
  const geo = new THREE.PlaneGeometry(0.12, 400);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.005, -140);
  scene.add(m);
}
makeEdgeLine(-ROAD.halfWidth, 0xffcc00);
makeEdgeLine(ROAD.halfWidth, 0xffcc00);

// ── Median / Road Divider ──
for (let z = 10; z > -250; z -= 2.5) {
  const bGeo = new THREE.BoxGeometry(0.3, 0.35, 1.2);
  const bMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
  const b = new THREE.Mesh(bGeo, bMat);
  b.position.set(ROAD.medianX, 0.17, z);
  b.castShadow = true;
  scene.add(b);
  S.roadMarkings.push(b);
}

// Median yellow lines
for (let side = -1; side <= 1; side += 2) {
  const lGeo = new THREE.PlaneGeometry(0.07, 400);
  const lMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
  const l = new THREE.Mesh(lGeo, lMat);
  l.rotation.x = -Math.PI / 2;
  l.position.set(ROAD.medianX + side * 0.35, 0.008, -140);
  scene.add(l);
}

// ── Lane dashes ──
function makeDashes(x, opacity) {
  for (let z = 10; z > -280; z -= 4) {
    const geo = new THREE.PlaneGeometry(0.07, 1.8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity, transparent: true, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.004, z);
    scene.add(m);
    S.roadMarkings.push(m);
  }
}
makeDashes(-3.6, 0.25);   // between player lanes
makeDashes(3.6, 0.20);    // between oncoming lanes

// ── Sidewalk / Curb ──
function makeCurb(x) {
  const geo = new THREE.BoxGeometry(2, 0.25, 400);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, 0.1, -140);
  m.receiveShadow = true;
  scene.add(m);
}
makeCurb(-ROAD.halfWidth - 1);
makeCurb(ROAD.halfWidth + 1);

// ── Metro Pillars & Viaduct ──
function buildMetroPillars() {
  for (let z = 10; z > -240; z -= 14) {
    [-(ROAD.halfWidth + 0.3), ROAD.halfWidth + 0.3].forEach((x, idx) => {
      const pGeo = new THREE.BoxGeometry(0.7, 11, 0.7);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.75 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(x, 5.5, z);
      p.castShadow = true;
      scene.add(p);
      S.metroPillars.push(p);

      if (idx === 1) {
        const beamGeo = new THREE.BoxGeometry(ROAD.totalWidth + 2, 0.5, 1.4);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.65 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 11.2, z);
        beam.castShadow = true;
        scene.add(beam);
        S.metroPillars.push(beam);
      }
    });
  }
}
buildMetroPillars();

// ── Coconut Palm Trees ──
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
//  COLLISION DETECTION
// ═══════════════════════════════════════════
function boxCollide(px, pz, pw, pd, ox, oz, ow, od) {
  return Math.abs(px - ox) < (pw + ow) / 2 * 0.78 &&
    Math.abs(pz - oz) < (pd + od) / 2 * 0.72;
}

function checkObstacleCollision(obs) {
  if (S.isFlying) return false;
  return boxCollide(
    playerGroup.position.x, playerGroup.position.z, 1.15, 1.9,
    obs.position.x, obs.position.z, obs.userData.width || 1.5, obs.userData.depth || 3.0
  );
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
  scene.add(veh);
  S.oncomingVehicles.push(veh);
}

function spawnCoin() {
  const coin = createCoin();
  const allLanes = [...ROAD.playerLanes];
  const lane = allLanes[Math.floor(Math.random() * allLanes.length)];
  coin.position.set(lane + (Math.random() - 0.5) * 0.5, 1.0, -85 - Math.random() * 30);
  scene.add(coin);
  S.coins.push(coin);
}

function spawnPothole() {
  if (S.currentZone !== 3) return; // NH 544 only
  const x = ROAD.playerLanes[Math.floor(Math.random() * ROAD.playerLanes.length)] + (Math.random() - 0.5) * 2;
  const ph = createPothole();
  ph.position.set(x, -0.04, -95 - Math.random() * 30);
  scene.add(ph);
  S.potholes.push(ph);
}

function spawnPickupZone() {
  if (S.hasCustomer) return; // only one customer at a time
  const zone = createPickupZone();
  // Place on leftmost edge of player lanes
  zone.position.set(ROAD.playerLanes[0] - 1.2, 0, -100 - Math.random() * 20);
  scene.add(zone);
  S.pickupZones.push(zone);
}

function spawnDropoffZone() {
  const zone = createDropoffZone();
  // Place ahead on either player lane edge
  zone.position.set(ROAD.playerLanes[1] + 1.0, 0, -110 - Math.random() * 25);
  scene.add(zone);
  S.dropoffZones.push(zone);
}

// ═══════════════════════════════════════════
//  ZONE MANAGEMENT
// ═══════════════════════════════════════════
function updateZone() {
  const prev = S.currentZone;
  S.zoneTimer += S.speed * 0.016;
  if (S.zoneTimer > 35) {
    S.zoneTimer = 0;
    S.currentZone = (S.currentZone + 1) % ZONES.length;
  }

  if (prev !== S.currentZone) {
    const z = ZONES[S.currentZone];
    DOM.zoneName.textContent = z.name;
    scene.fog.color.set(z.fogColor);
    scene.background = new THREE.Color(z.skyTop);
    ground.material.color.set(z.groundColor);

    // Backwater visibility boost for Fort Kochi
    waterMat.opacity = S.currentZone === 2 ? 0.7 : 0.3;

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
//  GAME LIFECYCLE
// ═══════════════════════════════════════════
function startGame() {
  S.started = true;
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
  S.over = true;
  DOM.gameOverZone.textContent = ZONES[S.currentZone].name;
  DOM.gameOverScore.textContent = S.score;
  DOM.flyingIndicator.classList.remove('visible');
  DOM.speedLines.style.opacity = '0';
  DOM.gridlockWarn.classList.remove('visible');
  DOM.oncomingWarn.classList.remove('visible');
  DOM.savariStatus.classList.remove('active');
  DOM.multBadge.classList.remove('active');

  if (S.score > S.highScore) {
    S.highScore = S.score;
    localStorage.setItem('savariHS', S.highScore);
    DOM.gameOverHS.textContent = '★ New High Score! ★';
  } else {
    DOM.gameOverHS.textContent = 'Best: ' + S.highScore;
  }

  DOM.gameOver.classList.add('visible');
  spawnExplosion(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
  console.log('🔊 SFX: Crash!');

  // AI Roast Integration
  const aiRoastEl = document.getElementById('ai-roast');
  if (aiRoastEl) {
    aiRoastEl.textContent = 'Auto Chettan is typing...';

    fetch(AI_ROAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a sarcastic Kochi auto-rickshaw driver. The player just crashed their auto in the game. They scored ${S.score} points, died in ${ZONES[S.currentZone].name}, and crashed into a ${hitType}. Write a short, funny, 2-sentence insult in Manglish (Malayalam written in English) making fun of their driving skills.`
          }]
        }]
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          aiRoastEl.textContent = data.candidates[0].content.parts[0].text;
        } else {
          aiRoastEl.textContent = 'Eda mone, driving padichittu vaa!';
        }
      })
      .catch(() => {
        aiRoastEl.textContent = 'Eda mone, driving padichittu vaa!';
      });
  }
}

function clearArray(arr) {
  arr.forEach(o => scene.remove(o));
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
  S.particles.forEach(p => scene.remove(p.mesh));
  S.particles.length = 0;

  Object.assign(S, {
    over: false, score: 0, speed: 0.32,
    playerX: -3.5, playerTargetX: -3.5,
    steerSpeed: S.baseSteerSpeed,
    isFlying: false, flyTimer: 0,
    boostMeter: 0, boostReady: false,
    hasCustomer: false,
    gridlockTimer: 0, gridlockWarning: false, gridlockActive: false,
    obstacleTimer: 0, oncomingTimer: 0, coinTimer: 0,
    potholeTimer: 0, savariPickupTimer: 0,
    distanceTraveled: 0, currentZone: 0, zoneTimer: 0,
  });

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
  ground.material.color.set(ZONES[0].groundColor);
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

  // ── Speed ──
  S.speed = Math.min(S.speed + S.speedInc, S.maxSpeed);
  S.distanceTraveled += S.speed;

  // ── Score ──
  const mult = S.hasCustomer ? S.customerMultiplier : 1;
  S.score = Math.floor(S.distanceTraveled * 2 * mult);
  DOM.scoreValue.textContent = S.score;

  // ── Zone ──
  updateZone();

  // ── Player steering ──
  const effectiveSteer = S.hasCustomer ? S.steerSpeed * S.savariSteerPenalty : S.steerSpeed;
  if (keys['ArrowLeft'] || keys['KeyA']) {
    S.playerTargetX = Math.max(S.playerTargetX - effectiveSteer * S.speed * 3, ROAD.boundaryLeft);
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    S.playerTargetX = Math.min(S.playerTargetX + effectiveSteer * S.speed * 3, ROAD.boundaryRight);
  }
  S.playerX += (S.playerTargetX - S.playerX) * 0.12;
  playerGroup.position.x = S.playerX;

  // Tilt
  const steerDelta = S.playerTargetX - S.playerX;
  playerGroup.rotation.z = -steerDelta * 0.12;
  playerGroup.rotation.y = -steerDelta * 0.025;

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
    const relSpeed = S.speed * (1 - (obs.userData.speedMultiplier || 0));
    obs.position.z += relSpeed;

    if (obs.position.z > 18) {
      scene.remove(obs);
      S.obstacles.splice(i, 1);
      // Also remove from gridlockWalls if present
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
    v.position.z += S.speed + (v.userData.oncomingSpeed || 0.5);

    if (v.position.z > 18) {
      scene.remove(v);
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
      S.coins.splice(i, 1);
      continue;
    }

    if (!c.userData.collected && checkCoinCollision(c)) {
      c.userData.collected = true;
      scene.remove(c);
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
      S.potholes.splice(i, 1);
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
    setTimeout(() => {
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
  S.metroPillars.forEach(p => {
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
    b.position.z += S.speed * 0.45;
    if (b.position.z > 22) b.position.z -= 260;
  });
  S.palms.forEach(p => {
    p.position.z += S.speed * 0.6;
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
      S.particles.splice(i, 1);
    }
  }

  // ── Camera follow ──
  const camTargetX = S.playerX * 0.35 + (1 - 0.35) * -3.5;
  const camTargetY = S.isFlying ? 10 : 5.8;
  camera.position.x += (camTargetX - camera.position.x) * 0.045;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;
  camera.lookAt(
    playerGroup.position.x * 0.4 + (1 - 0.4) * -3.5,
    S.isFlying ? 4.5 : 1,
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

    // Obstacles
    ctx.fillStyle = '#ff4444';
    S.obstacles.concat(S.oncomingVehicles).forEach(obs => {
      const ox = 75 + (obs.position.x / ROAD.boundaryRight) * 50;
      // map z from -150 to 15 -> 0 to 130
      const oz = 130 - ((obs.position.z + 150) / 165) * 130;
      if (oz > 0 && oz < 150) {
        ctx.beginPath();
        ctx.arc(ox, oz, 3, 0, Math.PI * 2);
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
