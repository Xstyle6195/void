import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { EngineLayout, EngineLook } from "../game/engineLayout";
import type { PartId } from "../game/types";

// ——— Définition des composants cliquables ———

interface ComponentDef {
  label: string;
  description: string;
  part: PartId;
  /** Direction d'éclatement fixe. */
  dir: [number, number, number];
  /** Éclatement radial depuis le centre du moteur. */
  radial: number;
}

export const COMPONENTS: Record<string, ComponentDef> = {
  bloc: { label: "Bloc moteur", description: "Fonte ou aluminium : il abrite les cylindres, les pistons et le vilebrequin.", part: "moteur", dir: [0, 0, 0], radial: 0 },
  carter: { label: "Carter d'huile", description: "Réservoir d'huile sous le moteur. Ses ailettes aident au refroidissement.", part: "moteur", dir: [0, -1.6, 0], radial: 0 },
  culasse: { label: "Culasse", description: "Soupapes, arbres à cames et chambres de combustion. Le cœur du rendement.", part: "moteur", dir: [0, 0.4, 0], radial: 1.1 },
  couvre: { label: "Couvre-culasse", description: "Protège la distribution. Sa couleur trahit souvent l'esprit du moteur.", part: "moteur", dir: [0, 0.8, 0], radial: 1.9 },
  allumage: { label: "Allumage", description: "Bobines, bougies, ou allumeur et faisceau sur les anciens.", part: "moteur", dir: [0, 1.4, 0], radial: 2.5 },
  admission: { label: "Collecteur d'admission", description: "Distribue l'air vers chaque cylindre. Pipes courtes = puissance en haut.", part: "moteur", dir: [0, 1.4, 0], radial: 1.6 },
  carbus: { label: "Carburateurs", description: "Dosent le mélange air-essence. Leur réglage est tout un art.", part: "moteur", dir: [0, 1.2, 0], radial: 2.2 },
  papillon: { label: "Boîtier papillon & filtre", description: "Contrôle le débit d'air aspiré, filtré en amont.", part: "moteur", dir: [-1.4, 0.8, 0], radial: 1.2 },
  echappement: { label: "Collecteur d'échappement", description: "Évacue les gaz brûlés. Des tubes de même longueur améliorent le remplissage.", part: "echappement", dir: [0, -0.2, 0], radial: 2.2 },
  ligne: { label: "Descente & catalyseur", description: "Conduit les gaz vers la ligne. Le catalyseur dépollue.", part: "echappement", dir: [1.6, -1, 0], radial: 0.8 },
  turbo: { label: "Turbocompresseur", description: "Les gaz d'échappement font tourner une turbine qui comprime l'air d'admission.", part: "moteur", dir: [0, 0, 0], radial: 2.8 },
  intercooler: { label: "Échangeur & durites de suralimentation", description: "Refroidit l'air comprimé pour le rendre plus dense.", part: "moteur", dir: [-2.2, 0.6, 0], radial: 1 },
  distribution: { label: "Carter de distribution", description: "Cache la chaîne ou la courroie qui synchronise vilebrequin et arbres à cames.", part: "moteur", dir: [-1.4, 0, 0], radial: 0 },
  poulies: { label: "Poulies & courroie d'accessoires", description: "Entraînent pompe à eau, alternateur et climatisation.", part: "moteur", dir: [-2.6, 0, 0], radial: 0 },
  alternateur: { label: "Alternateur", description: "Recharge la batterie et alimente l'électricité de bord.", part: "electronique", dir: [-1.8, 0.2, 0], radial: 1 },
  clim: { label: "Compresseur de climatisation", description: "Comprime le fluide frigorigène. Souvent supprimé sur les prépas piste.", part: "electronique", dir: [-1.8, -0.4, 0], radial: 1 },
  durites: { label: "Durites de refroidissement", description: "Circuit d'eau entre moteur et radiateur. Le silicone tient mieux la chaleur.", part: "moteur", dir: [-1.2, 1, 0], radial: 1.4 },
  filtreHuile: { label: "Filtre à huile", description: "Retient les impuretés de l'huile. À changer à chaque vidange.", part: "moteur", dir: [0, -0.3, 0], radial: 2.2 },
  jauge: { label: "Jauge & bouchon d'huile", description: "Pour vérifier et compléter le niveau d'huile.", part: "moteur", dir: [0, 1.2, 0], radial: 1.6 },
  supports: { label: "Supports moteur", description: "Silentblocs qui fixent le moteur au châssis et filtrent les vibrations.", part: "moteur", dir: [0, -0.6, 0], radial: 1.4 },
  volant: { label: "Volant moteur & embrayage", description: "Transmet le couple à la boîte. Un volant allégé rend le moteur plus vif.", part: "transmission", dir: [1.4, 0, 0], radial: 0 },
  boite: { label: "Boîte de vitesses", description: "Démultiplie le régime moteur. Sur les prépas : rapports courts ou séquentielle.", part: "transmission", dir: [2.8, 0, 0], radial: 0 },
  demarreur: { label: "Démarreur", description: "Petit moteur électrique qui lance le moteur thermique.", part: "electronique", dir: [1, -0.8, 0], radial: 1.2 },
  // Électrique
  stator: { label: "Carter & stator", description: "Bobinages fixes qui créent le champ magnétique tournant.", part: "moteur", dir: [0, 0, 0], radial: 0 },
  rotor: { label: "Rotor & arbre", description: "Partie tournante aimantée, entraînée par le champ du stator.", part: "moteur", dir: [-3.2, 0, 0], radial: 0 },
  onduleur: { label: "Onduleur", description: "Convertit le courant continu de la batterie en courant alternatif triphasé.", part: "electronique", dir: [0, 1.8, 0], radial: 0 },
  cablesHT: { label: "Câbles haute tension", description: "Orange réglementaire : jusqu'à 800 V. Ne pas toucher !", part: "electronique", dir: [0, 1.2, 0.6], radial: 0.6 },
  reducteur: { label: "Réducteur", description: "Engrenage unique qui démultiplie le régime du moteur électrique.", part: "transmission", dir: [2.2, 0, 0], radial: 0 },
  arbres: { label: "Arbres de transmission", description: "Envoient le couple aux roues via des joints homocinétiques.", part: "transmission", dir: [0, 0, 0], radial: 1.6 },
  refroidissement: { label: "Circuit de refroidissement", description: "Le liquide refroidit onduleur et moteur.", part: "moteur", dir: [0, 0.8, 0], radial: 1.4 },
};

export interface BuiltEngine {
  root: THREE.Group;
  meshes: THREE.Mesh[];
  size: THREE.Vector3;
  center: THREE.Vector3;
  dispose: () => void;
}

// ——— Matériaux ———

const DIRT = new THREE.Color("#4a3a2b");
const RUST = new THREE.Color("#8a4520");

function wear(color: string, cond: number, toward = DIRT, amount = 0.75): THREE.Color {
  return new THREE.Color(color).lerp(toward, (1 - cond / 100) * amount);
}

type MatName =
  | "cast"
  | "alu"
  | "cover"
  | "rib"
  | "black"
  | "rubber"
  | "steel"
  | "chrome"
  | "exhaust"
  | "turbo"
  | "gearbox"
  | "red"
  | "orange"
  | "yellow"
  | "hose"
  | "copper"
  | "filter"
  | "wire";

function baseMaterial(name: MatName, look: EngineLook): THREE.MeshStandardMaterial {
  const m = look.condMoteur;
  const rough = (r: number, c: number) => Math.min(1, r + (1 - c / 100) * 0.35);
  switch (name) {
    case "cast":
      return new THREE.MeshStandardMaterial({ color: wear("#6f747a", m), metalness: 0.45, roughness: rough(0.62, m) });
    case "alu":
      return new THREE.MeshStandardMaterial({ color: wear("#b4b8bc", m), metalness: 0.75, roughness: rough(0.38, m) });
    case "cover":
      return new THREE.MeshStandardMaterial({ color: wear(look.coverColor, m, DIRT, 0.55), metalness: 0.35, roughness: rough(0.5, m) });
    case "rib":
      return new THREE.MeshStandardMaterial({ color: wear("#d8dadc", m), metalness: 0.95, roughness: rough(0.18, m) });
    case "black":
      return new THREE.MeshStandardMaterial({ color: "#1d1e21", metalness: 0.15, roughness: 0.62 });
    case "rubber":
      return new THREE.MeshStandardMaterial({ color: "#121213", metalness: 0, roughness: 0.92 });
    case "steel":
      return new THREE.MeshStandardMaterial({ color: "#a9adb2", metalness: 0.9, roughness: 0.32 });
    case "chrome":
      return new THREE.MeshStandardMaterial({ color: "#eceef0", metalness: 1, roughness: 0.08 });
    case "exhaust": {
      const c = look.condEchappement;
      if (look.exhaust === "titane") return new THREE.MeshStandardMaterial({ color: "#7d6cb8", metalness: 1, roughness: 0.22, emissive: "#2a1a40", emissiveIntensity: 0.15 });
      if (look.exhaust === "inox") return new THREE.MeshStandardMaterial({ color: "#d9dcdf", metalness: 1, roughness: 0.16 });
      return new THREE.MeshStandardMaterial({ color: wear("#7a736c", c, RUST, 0.9), metalness: 0.55, roughness: rough(0.6, c) });
    }
    case "turbo":
      return new THREE.MeshStandardMaterial({ color: wear("#5d5852", m, RUST, 0.5), metalness: 0.6, roughness: 0.55 });
    case "gearbox": {
      const c = look.condTransmission;
      return new THREE.MeshStandardMaterial({ color: wear("#a7aaad", c), metalness: 0.65, roughness: rough(0.45, c) });
    }
    case "red":
      return new THREE.MeshStandardMaterial({ color: "#c0262b", metalness: 0.1, roughness: 0.55 });
    case "orange":
      return new THREE.MeshStandardMaterial({ color: "#ff7a1a", metalness: 0.05, roughness: 0.5 });
    case "yellow":
      return new THREE.MeshStandardMaterial({ color: "#f2c200", metalness: 0.05, roughness: 0.45 });
    case "hose":
      return new THREE.MeshStandardMaterial({ color: look.stage >= 1 ? "#1f5fbf" : "#1a1a1c", metalness: 0, roughness: 0.75 });
    case "copper":
      return new THREE.MeshStandardMaterial({ color: "#b8733a", metalness: 0.95, roughness: 0.3 });
    case "filter":
      return new THREE.MeshStandardMaterial({ color: "#1f4fa0", metalness: 0.3, roughness: 0.45 });
    case "wire":
      return new THREE.MeshStandardMaterial({ color: "#8f1414", metalness: 0, roughness: 0.6 });
  }
}

// ——— Géométries utilitaires ———

const PI = Math.PI;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function rbox(w: number, h: number, d: number, x: number, y: number, z: number, r = 0.06): THREE.BufferGeometry {
  const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return new RoundedBoxGeometry(w, h, d, 2, Math.max(0.001, radius)).translate(x, y, z);
}

/** Cylindre d'axe X (rTop côté -X). */
function cylX(rTop: number, rBot: number, len: number, x: number, y: number, z: number, seg = 24): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(rTop, rBot, len, seg).rotateZ(PI / 2).translate(x, y, z);
}

function cylY(rTop: number, rBot: number, len: number, x: number, y: number, z: number, seg = 20): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(rTop, rBot, len, seg).translate(x, y, z);
}

/** Cylindre d'axe Z (rTop côté +Z). */
function cylZ(rTop: number, rBot: number, len: number, x: number, y: number, z: number, seg = 20): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(rTop, rBot, len, seg).rotateX(PI / 2).translate(x, y, z);
}

function torusX(R: number, r: number, x: number, y: number, z: number): THREE.BufferGeometry {
  return new THREE.TorusGeometry(R, r, 10, 28).rotateY(PI / 2).translate(x, y, z);
}

function tube(points: THREE.Vector3[], r: number, seg = 28, closed = false): THREE.BufferGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, "catmullrom", 0.3), seg, r, 10, closed);
}

/** Trompette d'admission (cornet) orientée selon +Y puis transformée. */
function trumpet(r: number, len: number): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(r * (1 + 0.9 * Math.pow(t, 3)), t * len));
  }
  pts.push(new THREE.Vector2(r * 2.05, len + 0.02));
  return new THREE.LatheGeometry(pts, 24);
}

/** Filtre conique sport, orienté selon +Y. */
function coneFilter(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.17, 0),
    new THREE.Vector2(0.3, 0.06),
    new THREE.Vector2(0.3, 0.12),
    new THREE.Vector2(0.24, 0.55),
    new THREE.Vector2(0.001, 0.58),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

/** Oriente une géométrie construite selon +Y vers `dir` puis la place en `at`. */
function orient(geo: THREE.BufferGeometry, dir: THREE.Vector3, at: THREE.Vector3): THREE.BufferGeometry {
  const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), dir.clone().normalize());
  return geo.applyQuaternion(q).translate(at.x, at.y, at.z);
}

// ——— Constructeur ———

class EngineBuilder {
  root = new THREE.Group();
  meshes: THREE.Mesh[] = [];
  private mats = new Map<string, THREE.MeshStandardMaterial>();
  private look: EngineLook;

  constructor(look: EngineLook) {
    this.look = look;
  }

  mat(comp: string, name: MatName): THREE.MeshStandardMaterial {
    const key = `${comp}|${name}`;
    let m = this.mats.get(key);
    if (!m) {
      m = baseMaterial(name, this.look);
      m.userData.baseEmissive = m.emissive.clone();
      m.userData.baseEmissiveIntensity = m.emissiveIntensity;
      this.mats.set(key, m);
    }
    return m;
  }

  add(comp: string, geo: THREE.BufferGeometry, mat: MatName, matrix?: THREE.Matrix4): THREE.Mesh {
    if (matrix) geo.applyMatrix4(matrix);
    const mesh = new THREE.Mesh(geo, this.mat(comp, mat));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.comp = comp;
    this.root.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  finalize(): BuiltEngine {
    const box = new THREE.Box3().setFromObject(this.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    for (const mesh of this.meshes) {
      const def = COMPONENTS[mesh.userData.comp as string];
      mesh.geometry.computeBoundingBox();
      const c = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3());
      const radial = c.clone().sub(center);
      radial.x *= 0.35;
      if (radial.lengthSq() > 1e-6) radial.normalize();
      mesh.userData.explodeDir = v(...def.dir).add(radial.multiplyScalar(def.radial));
    }
    const mats = [...this.mats.values()];
    return {
      root: this.root,
      meshes: this.meshes,
      size,
      center,
      dispose: () => {
        for (const m of this.meshes) m.geometry.dispose();
        for (const m of mats) m.dispose();
      },
    };
  }
}

const PITCH = 0.82;

interface Bank {
  matrix: THREE.Matrix4;
  /** +1 / -1 : côté intérieur (admission) = -s·Z local. */
  s: 1 | -1;
  xs: number[];
  len: number;
  turbos: number;
}

function buildCombustion(b: EngineBuilder, L: EngineLayout, look: EngineLook): void {
  const banksCount = L.kind === "inline" ? 1 : 2;
  const perBank = Math.max(1, Math.round(L.cylinders / banksCount));
  const len = perBank * PITCH + 0.45;
  const half = (L.vAngle * PI) / 360;

  const banks: Bank[] = [];
  if (L.kind === "inline") {
    const xs = Array.from({ length: perBank }, (_, i) => (i - (perBank - 1) / 2) * PITCH);
    banks.push({ matrix: new THREE.Matrix4(), s: -1, xs, len, turbos: L.turbos });
  } else {
    for (const side of [1, -1] as const) {
      const stagger = side * 0.14;
      const xs = Array.from({ length: perBank }, (_, i) => (i - (perBank - 1) / 2) * PITCH + stagger);
      const turbos = L.turbos === 2 ? 1 : L.turbos === 1 && side === 1 ? 1 : 0;
      // Banc côté +Z : tourné de +half ; son intérieur pointe vers -Z local.
      banks.push({ matrix: new THREE.Matrix4().makeRotationX(side * half), s: side, xs, len, turbos });
    }
  }

  const flat = L.kind === "flat";
  const vee = L.kind === "v";
  const crankW = vee ? 2.0 : flat ? 1.5 : 1.45;
  const crankY = flat ? 0 : -0.35;
  const crankH = flat ? 1.25 : 1.25;
  const frontX = -len / 2 - (L.kind === "inline" ? 0.05 : 0.22);
  const rearX = len / 2 + (L.kind === "inline" ? 0.05 : 0.22);

  // —— Carter-cylindres (bas moteur) ——
  b.add("bloc", rbox(len + (banksCount > 1 ? 0.45 : 0.1), crankH, crankW, 0, crankY, 0, 0.1), "cast");
  // Nervures de fonderie
  for (let i = 0; i < perBank + 1; i++) {
    const x = (i - perBank / 2) * PITCH;
    for (const z of [1, -1]) b.add("bloc", rbox(0.07, crankH * 0.8, 0.08, x, crankY, z * (crankW / 2 + 0.02), 0.02), "cast");
  }

  // —— Carter d'huile ——
  const panY = crankY - crankH / 2 - 0.3;
  b.add("carter", rbox(len * 0.88, 0.55, crankW * 0.82, 0.1, panY, 0, 0.12), "alu");
  for (let i = 0; i < 5; i++) b.add("carter", rbox(len * 0.8, 0.04, 0.05, 0.1, panY - 0.1, (i - 2) * 0.22, 0.01), "alu");
  b.add("carter", cylY(0.07, 0.07, 0.08, len * 0.3, panY - 0.31, 0.2, 6), "steel");

  // —— Bancs ——
  const intakePorts: THREE.Vector3[] = [];
  const plugPoints: THREE.Vector3[] = [];
  for (const bank of banks) {
    const { matrix: M, s, xs } = bank;
    const P = (x: number, y: number, z: number) => v(x, y, z).applyMatrix4(M);
    const blockY = flat ? 0.95 : 0.95;
    b.add("bloc", rbox(len, 1.45, 1.2, 0, blockY, 0, 0.08), "cast", M);
    for (const x of xs) b.add("bloc", cylZ(0.34, 0.34, 0.08, x, blockY + 0.1, s * 0.62), "cast", M);

    // Culasse et joint
    b.add("culasse", rbox(len + 0.02, 0.06, 1.24, 0, 1.7, 0, 0.01), "steel", M);
    b.add("culasse", rbox(len + 0.05, 0.5, 1.3, 0, 1.98, 0, 0.07), "alu", M);
    for (const x of xs) b.add("culasse", rbox(0.16, 0.16, 0.08, x + PITCH / 2, 2.0, s * 0.68, 0.02), "alu", M);

    // Couvre-culasse nervuré
    b.add("couvre", rbox(len - 0.05, 0.36, 1.02, 0, 2.39, 0, 0.14), "cover", M);
    for (const x of xs) b.add("couvre", rbox(0.06, 0.07, 0.78, x + PITCH / 2, 2.6, 0, 0.02), "rib", M);
    b.add("couvre", rbox(len * 0.5, 0.03, 0.22, 0, 2.58, s * 0.3, 0.01), "rib", M);

    // Allumage
    if (!L.classic) {
      for (const x of xs) {
        b.add("allumage", cylY(0.085, 0.085, 0.36, x, 2.72, -s * 0.05), "black", M);
        b.add("allumage", rbox(0.2, 0.1, 0.16, x, 2.92, -s * 0.05, 0.03), "black", M);
      }
      b.add("allumage", tube(xs.map((x) => P(x, 2.99, -s * 0.12)), 0.03, 24), "black");
    } else {
      for (const x of xs) {
        b.add("allumage", cylZ(0.05, 0.05, 0.2, x, 2.05, s * 0.75), "black", M);
        plugPoints.push(P(x, 2.05, s * 0.86));
      }
    }

    // Bouchon de remplissage d'huile (premier banc)
    if (bank === banks[0]) {
      b.add("jauge", cylY(0.13, 0.13, 0.1, xs[0] + 0.2, 2.62, s * 0.25), "yellow", M);
      b.add("jauge", cylY(0.06, 0.06, 0.12, xs[0] + 0.2, 2.7, s * 0.25, 6), "black", M);
    }

    // Ports d'admission (côté intérieur)
    for (const x of xs) intakePorts.push(P(x, 1.98, -s * 0.66));

    // —— Échappement (côté extérieur) ——
    const groups: number[][] = [];
    const tg = Math.max(1, bank.turbos);
    const per = Math.ceil(xs.length / tg);
    for (let g = 0; g < tg; g++) groups.push(xs.slice(g * per, (g + 1) * per));
    for (const grp of groups) {
      const xc = grp.reduce((a, c) => a + c, 0) / grp.length + (bank.turbos ? 0 : 0.35);
      const C = v(xc, 0.55, s * 1.4);
      for (const x of grp) {
        b.add("echappement", rbox(0.34, 0.28, 0.05, x, 1.92, s * 0.67, 0.02), "steel", M);
        b.add("echappement", tube([v(x, 1.92, s * 0.67), v(x, 1.86, s * 1.05), v(x * 0.65 + xc * 0.35, 1.2, s * 1.38), C], 0.085, 30), "exhaust", M);
      }
      b.add("echappement", new THREE.SphereGeometry(0.17, 16, 12).translate(C.x, C.y, C.z), "exhaust", M);

      const end = v(rearX + 1.3, -1.35, s * 1.05);
      if (bank.turbos) {
        const T = v(xc, 0.62, s * 1.95);
        const big = look.stage === 2 ? 1.3 : 1;
        // Turbine (fonte) + carter central + compresseur (alu)
        b.add("turbo", tube([C, v(xc, 0.5, s * 1.7), v(T.x, T.y - 0.32 * big, T.z)], 0.1, 12), "exhaust", M);
        b.add("turbo", torusX(0.27 * big, 0.15 * big, T.x + 0.1, T.y, T.z), "turbo", M);
        b.add("turbo", cylX(0.2 * big, 0.2 * big, 0.3, T.x + 0.1, T.y, T.z), "turbo", M);
        b.add("turbo", cylX(0.14, 0.14, 0.35, T.x - 0.22, T.y, T.z), "steel", M);
        b.add("turbo", torusX(0.3 * big, 0.14 * big, T.x - 0.5, T.y, T.z), "alu", M);
        b.add("turbo", cylX(0.24 * big, 0.24 * big, 0.25, T.x - 0.52, T.y, T.z), "alu", M);
        b.add("turbo", cylX(0.17 * big, 0.2 * big, 0.3, T.x - 0.78, T.y, T.z), "alu", M);
        // Wastegate
        b.add("turbo", cylY(0.08, 0.08, 0.22, T.x + 0.3, T.y + 0.3, T.z), "steel", M);
        // Descente
        b.add("ligne", tube([v(T.x + 0.25, T.y, T.z), v(T.x + 0.6, T.y - 0.4, T.z - s * 0.05), v(rearX + 0.3, -1.1, s * 1.15), end], 0.12, 30), "exhaust", M);
        // Arrivée d'air au compresseur
        const inlet = v(T.x - 0.95, T.y, T.z);
        if (look.stage >= 1) b.add("papillon", orient(coneFilter(), v(-1, 0, 0), inlet), "red", M);
        else b.add("papillon", tube([inlet, v(T.x - 1.3, T.y + 0.2, T.z - s * 0.2), v(frontX - 0.3, 1.0, s * 1.5)], 0.17, 16), "black", M);
        // Sortie compresseur vers l'échangeur (coordonnées monde)
        const out = P(T.x - 0.5, T.y + 0.35 * big, T.z);
        const ic = v(frontX - 1.55, 0.1, 0);
        b.add("intercooler", tube([P(T.x - 0.5, T.y + 0.1, T.z), out, v(frontX - 0.5, out.y + 0.1, out.z * 0.9), v(ic.x + 0.1, 0.4, out.z > 0 ? 0.9 : -0.9)], 0.11, 30), "hose");
      } else {
        b.add("ligne", tube([C, v(C.x + 0.4, -0.5, s * 1.45), v(rearX + 0.3, -1.15, s * 1.15), end], 0.11, 30), "exhaust", M);
      }
      // Catalyseur et suite de ligne (monde)
      const e = end.clone().applyMatrix4(M);
      b.add("ligne", cylX(0.24, 0.24, 0.8, e.x + 0.4, e.y, e.z), "exhaust");
      b.add("ligne", cylX(0.11, 0.11, 0.7, e.x + 1.15, e.y, e.z), "exhaust");
      if (look.exhaust !== "stock") b.add("ligne", cylX(0.15, 0.13, 0.3, e.x + 1.6, e.y, e.z), look.exhaust === "titane" ? "exhaust" : "chrome");
    }
  }

  // —— Admission ——
  const throttleTarget = (() => {
    if (L.kind === "inline") {
      const s = banks[0].s;
      const M = banks[0].matrix;
      if (L.carbs) {
        for (const p of intakePorts) {
          b.add("carbus", tube([p, v(p.x, p.y + 0.02, p.z - s * 0.25)], 0.11, 6), "alu", M);
          b.add("carbus", cylZ(0.15, 0.15, 0.32, p.x, p.y, p.z - s * 0.45), "alu", M);
          b.add("carbus", rbox(0.2, 0.18, 0.2, p.x, p.y - 0.22, p.z - s * 0.45, 0.04), "alu", M);
          b.add("carbus", orient(trumpet(0.13, 0.3), v(0, 0, -s), v(p.x, p.y, p.z - s * 0.6)), "chrome", M);
        }
        const zz = intakePorts[0].z - s * 0.45;
        b.add("carbus", cylX(0.025, 0.025, len, 0, 2.2, zz, 8), "steel", M);
        return null;
      }
      const pz = -s * 1.55;
      const py = 1.6;
      b.add("admission", cylX(0.32, 0.32, len * 0.86, 0, py, pz), "alu", M);
      for (const e of [1, -1]) b.add("admission", new THREE.SphereGeometry(0.32, 18, 12).scale(0.5, 1, 1).translate(e * len * 0.43, py, pz), "alu", M);
      for (const p of intakePorts) {
        b.add("admission", tube([p, v(p.x, 2.08, -s * 0.98), v(p.x, 1.98, -s * 1.32), v(p.x, py + 0.05, pz + s * 0.12)], 0.1, 20), "alu", M);
      }
      const th = v(-len * 0.43 - 0.18, py, pz);
      b.add("papillon", cylX(0.21, 0.21, 0.24, th.x, th.y, th.z), "chrome", M);
      return th;
    }
    // V / à plat : plénum central sur le dessus
    if (L.carbs) {
      for (const p of intakePorts) {
        const dir = v(0, 1, 0);
        b.add("carbus", tube([p, v(p.x, p.y + 0.2, p.z * 0.6)], 0.1, 6), "alu");
        b.add("carbus", cylY(0.13, 0.13, 0.3, p.x, p.y + 0.38, p.z * 0.55), "alu");
        b.add("carbus", orient(trumpet(0.11, 0.28), dir, v(p.x, p.y + 0.53, p.z * 0.55)), "chrome");
      }
      return null;
    }
    const maxY = Math.max(...intakePorts.map((p) => p.y));
    const py = maxY + (flat ? 0.45 : 0.7);
    b.add("admission", cylX(0.4, 0.4, len * 0.92, 0, py, 0), "alu");
    for (const e of [1, -1]) b.add("admission", new THREE.SphereGeometry(0.4, 18, 12).scale(0.45, 1, 1).translate(e * len * 0.46, py, 0), "alu");
    b.add("admission", rbox(len * 0.6, 0.05, 0.3, 0, py + 0.4, 0, 0.02), "rib");
    for (const p of intakePorts) {
      const sz = Math.sign(p.z) || 1;
      b.add("admission", tube([p, v(p.x, p.y + 0.25, p.z * 0.75), v(p.x, py - 0.1, sz * 0.32), v(p.x, py, sz * 0.1)], 0.095, 20), "alu");
    }
    const th = v(-len * 0.46 - 0.22, py, 0);
    b.add("papillon", cylX(0.24, 0.24, 0.26, th.x, th.y, th.z), "chrome");
    return th;
  })();

  // Filtre à air / liaison au papillon
  if (throttleTarget) {
    if (L.turbos > 0) {
      const ic = v(frontX - 1.55, 0.1, 0);
      b.add("intercooler", rbox(0.18, 1.2, 2.3, ic.x, ic.y, ic.z, 0.04), "alu");
      for (let i = 0; i < 9; i++) b.add("intercooler", rbox(0.2, 0.025, 2.1, ic.x, ic.y - 0.5 + i * 0.125, 0, 0.005), "black");
      b.add("intercooler", tube([v(ic.x + 0.1, -0.3, 0), v(frontX - 0.6, -0.1, 0.3), v(throttleTarget.x - 0.5, throttleTarget.y - 0.2, throttleTarget.z), v(throttleTarget.x - 0.12, throttleTarget.y, throttleTarget.z)], 0.13, 30), "hose");
    } else if (look.stage >= 1) {
      b.add("papillon", orient(coneFilter(), v(-1, 0, 0), v(throttleTarget.x - 0.12, throttleTarget.y, throttleTarget.z)), "red");
    } else {
      const box = v(frontX - 0.75, throttleTarget.y + 0.1, throttleTarget.z + (L.kind === "inline" ? 0 : 0.6));
      b.add("papillon", rbox(0.85, 0.5, 0.75, box.x, box.y, box.z, 0.1), "black");
      b.add("papillon", tube([v(box.x + 0.42, box.y, box.z), v(throttleTarget.x - 0.35, throttleTarget.y, throttleTarget.z), v(throttleTarget.x - 0.12, throttleTarget.y, throttleTarget.z)], 0.17, 12), "black");
    }
  }

  // —— Allumeur et faisceau (anciens) ——
  if (L.classic && plugPoints.length) {
    const top = Math.max(...plugPoints.map((p) => p.y));
    const D = v(frontX + 0.25, top + 0.55, L.kind === "inline" ? -banks[0].s * 0.2 : 0);
    b.add("allumage", cylY(0.15, 0.12, 0.32, D.x, D.y, D.z), "black");
    b.add("allumage", cylY(0.17, 0.15, 0.12, D.x, D.y + 0.2, D.z), "red");
    for (const p of plugPoints) {
      const mid = v((D.x + p.x) / 2, Math.max(D.y, p.y) + 0.25, (D.z + p.z) / 2);
      b.add("allumage", tube([v(D.x, D.y + 0.26, D.z), mid, p], 0.028, 20), "wire");
    }
  }

  // —— Façade avant : distribution, poulies, accessoires ——
  const wide = L.kind === "inline" ? 1 : 1.35;
  b.add("distribution", rbox(0.22, flat ? 1.6 : 2.5, (L.kind === "inline" ? 1.3 : 2.1), frontX - 0.11, flat ? 0.1 : 0.75, 0, 0.08), "cast");
  const px = frontX - 0.36;
  const pulleys: { y: number; z: number; r: number }[] = [
    { y: crankY - 0.25, z: 0, r: 0.42 },
    { y: 0.4, z: 1.05 * wide, r: 0.2 },
    { y: flat ? 0.75 : 0.95, z: 0, r: 0.3 },
    { y: 0.25, z: -0.55 * wide, r: 0.15 },
    { y: crankY - 0.15, z: -1.05 * wide, r: 0.22 },
  ];
  b.add("poulies", cylX(0.42, 0.42, 0.18, px, pulleys[0].y, 0, 32), "steel");
  b.add("poulies", cylX(0.3, 0.3, 0.2, px - 0.02, pulleys[0].y, 0, 32), "rubber");
  b.add("poulies", cylX(0.1, 0.1, 0.24, px - 0.04, pulleys[0].y, 0, 6), "chrome");
  b.add("poulies", cylX(0.3, 0.3, 0.14, px, pulleys[2].y, 0, 28), "steel");
  b.add("poulies", cylX(0.15, 0.15, 0.14, px, pulleys[3].y, pulleys[3].z, 20), "steel");
  // Courroie : enveloppe des poulies
  const cy = pulleys.reduce((a, p) => a + p.y, 0) / pulleys.length;
  const cz = pulleys.reduce((a, p) => a + p.z, 0) / pulleys.length;
  const beltPts: { a: number; p: THREE.Vector3 }[] = [];
  for (const p of pulleys) {
    const base = Math.atan2(p.y - cy, p.z - cz);
    for (const da of [-0.6, 0, 0.6]) {
      const a = base + da;
      const pt = v(px, p.y + Math.sin(a) * (p.r + 0.03), p.z + Math.cos(a) * (p.r + 0.03));
      beltPts.push({ a: Math.atan2(pt.y - cy, pt.z - cz), p: pt });
    }
  }
  beltPts.sort((a, c) => a.a - c.a);
  b.add("poulies", tube(beltPts.map((x) => x.p), 0.035, 90, true), "rubber");

  // Alternateur
  const alt = pulleys[1];
  b.add("alternateur", cylX(0.36, 0.36, 0.55, px + 0.45, alt.y, alt.z, 28), "alu");
  b.add("alternateur", torusX(0.36, 0.035, px + 0.3, alt.y, alt.z), "rib");
  b.add("alternateur", cylX(0.2, 0.2, 0.12, px, alt.y, alt.z, 20), "steel");
  b.add("alternateur", cylX(0.12, 0.12, 0.12, px + 0.78, alt.y, alt.z), "black");
  // Compresseur de clim
  const ac = pulleys[4];
  b.add("clim", cylX(0.3, 0.3, 0.7, px + 0.5, ac.y, ac.z, 24), "alu");
  b.add("clim", cylX(0.22, 0.22, 0.14, px, ac.y, ac.z, 20), "steel");
  b.add("clim", cylY(0.06, 0.06, 0.3, px + 0.6, ac.y + 0.4, ac.z, 8), "black");

  // Durites d'eau
  const headFront = L.kind === "inline" ? v(frontX + 0.05, 2.0, 0.2) : v(frontX + 0.05, flat ? 1.0 : 2.0, 0);
  b.add("durites", tube([headFront, v(frontX - 0.5, headFront.y + 0.1, 0.35), v(frontX - 1.2, headFront.y - 0.5, 0.55)], 0.1, 20), "hose");
  b.add("durites", tube([v(px + 0.1, pulleys[2].y - 0.1, -0.25), v(frontX - 0.7, 0, -0.6), v(frontX - 1.2, -0.5, -0.55)], 0.1, 20), "hose");

  // —— Filtre à huile, jauge, supports ——
  const sideZ = crankW / 2;
  b.add("filtreHuile", cylZ(0.21, 0.21, 0.42, -len * 0.15, crankY - 0.15, sideZ + 0.24, 24), "filter");
  b.add("filtreHuile", cylZ(0.22, 0.22, 0.05, -len * 0.15, crankY - 0.15, sideZ + 0.04, 24), "steel");
  b.add("jauge", tube([v(len * 0.28, crankY, -sideZ - 0.02), v(len * 0.28, 1.0, -sideZ - 0.25), v(len * 0.28, 2.0, -sideZ - 0.35)], 0.03, 16), "steel");
  b.add("jauge", new THREE.TorusGeometry(0.09, 0.025, 8, 18).translate(len * 0.28, 2.11, -sideZ - 0.35), "yellow");
  for (const z of [1, -1]) {
    b.add("supports", rbox(0.36, 0.3, 0.36, -len * 0.2, crankY + 0.15, z * (sideZ + 0.28), 0.05), "rubber");
    b.add("supports", rbox(0.42, 0.06, 0.5, -len * 0.2, crankY - 0.02, z * (sideZ + 0.28), 0.02), "steel");
  }

  // —— Arrière : cloche, boîte, démarreur ——
  b.add("volant", cylX(1.05, 0.7, 0.75, rearX + 0.37, crankY + 0.15, 0, 32), "gearbox");
  b.add("volant", torusX(1.02, 0.05, rearX + 0.05, crankY + 0.15, 0), "gearbox");
  const gx = rearX + 0.75;
  b.add("boite", cylX(0.66, 0.46, 1.9, gx + 0.95, crankY + 0.05, 0, 28), "gearbox");
  for (let i = 0; i < 4; i++) b.add("boite", torusX(0.62 - i * 0.045, 0.035, gx + 0.3 + i * 0.45, crankY + 0.05, 0), "gearbox");
  b.add("boite", cylX(0.17, 0.17, 0.6, gx + 2.2, crankY + 0.05, 0, 16), "steel");
  if (look.gearbox === "seq") {
    b.add("boite", rbox(0.5, 0.45, 0.5, gx + 0.9, crankY + 0.6, 0, 0.06), "black");
    b.add("boite", cylY(0.03, 0.03, 1.1, gx + 0.9, crankY + 1.35, 0, 8), "chrome");
    b.add("boite", new THREE.SphereGeometry(0.1, 14, 10).translate(gx + 0.9, crankY + 1.95, 0), "black");
  } else {
    const h = look.gearbox === "sport" ? 0.5 : 0.85;
    b.add("boite", rbox(0.3, 0.2, 0.3, gx + 1.1, crankY + 0.55, 0, 0.05), "rubber");
    b.add("boite", cylY(0.025, 0.025, h, gx + 1.1, crankY + 0.65 + h / 2, 0, 8), "steel");
    b.add("boite", new THREE.SphereGeometry(look.gearbox === "sport" ? 0.11 : 0.09, 14, 10).translate(gx + 1.1, crankY + 0.68 + h, 0), look.gearbox === "sport" ? "chrome" : "black");
  }
  b.add("demarreur", cylX(0.2, 0.2, 0.6, rearX + 0.1, crankY - 0.45, sideZ + 0.15, 20), "black");
  b.add("demarreur", cylX(0.1, 0.1, 0.35, rearX + 0.05, crankY - 0.18, sideZ + 0.2, 12), "steel");
}

function buildElectric(b: EngineBuilder, look: EngineLook): void {
  // Carter & stator
  b.add("stator", cylX(1.02, 1.02, 2.2, 0, 0, 0, 40), "alu");
  for (let i = 0; i < 9; i++) b.add("stator", torusX(1.04, 0.04, -0.9 + i * 0.225, 0, 0), "alu");
  b.add("stator", cylX(0.92, 0.92, 0.2, -1.2, 0, 0, 36), "alu");
  b.add("stator", cylX(0.3, 0.3, 0.1, -1.35, 0, 0, 20), "steel");
  for (const x of [-0.95, 0.95]) b.add("stator", torusX(0.72, 0.13, x, 0, 0), "copper");
  // Rotor (visible en vue éclatée)
  b.add("rotor", cylX(0.66, 0.66, 1.7, 0, 0, 0, 32), "steel");
  for (let i = 0; i < 6; i++) b.add("rotor", rbox(1.6, 0.08, 0.14, 0, Math.cos((i / 6) * PI * 2) * 0.62, Math.sin((i / 6) * PI * 2) * 0.62, 0.01), "copper");
  b.add("rotor", cylX(0.11, 0.11, 3.0, 0, 0, 0, 12), "chrome");
  // Onduleur
  b.add("onduleur", rbox(1.9, 0.5, 1.4, 0.1, 1.32, 0, 0.08), "alu");
  b.add("onduleur", rbox(1.75, 0.08, 1.25, 0.1, 1.6, 0, 0.03), "black");
  b.add("onduleur", rbox(0.5, 0.01, 0.3, -0.35, 1.645, 0.2, 0.004), "yellow");
  for (let i = 0; i < 3; i++) b.add("onduleur", cylZ(0.08, 0.08, 0.2, 0.55 + i * 0.22, 1.3, 0.78, 14), "orange");
  b.add("onduleur", cylX(0.12, 0.12, 0.25, -0.95, 1.4, 0.35, 14), "orange");
  b.add("onduleur", cylX(0.12, 0.12, 0.25, -0.95, 1.4, -0.35, 14), "orange");
  // Câbles HT
  for (let i = 0; i < 3; i++) {
    const x = 0.55 + i * 0.22;
    b.add("cablesHT", tube([v(x, 1.3, 0.88), v(x + 0.05, 1.1, 1.25), v(x + 0.1, 0.55, 1.15), v(x + 0.1, 0.35, 0.98)], 0.06, 20), "orange");
  }
  for (const z of [0.35, -0.35]) b.add("cablesHT", tube([v(-1.08, 1.4, z), v(-1.6, 1.3, z * 1.6), v(-2.3, 0.9, z * 2)], 0.08, 20), "orange");
  // Réducteur & arbres
  b.add("reducteur", rbox(1.0, 1.7, 1.5, 1.6, -0.25, 0, 0.18), "gearbox");
  b.add("reducteur", cylZ(0.72, 0.72, 1.6, 1.65, -0.55, 0, 32), "gearbox");
  for (let i = 0; i < 6; i++) b.add("reducteur", rbox(0.05, 1.4, 0.06, 1.25 + i * 0.15, -0.25, 0.78, 0.01), "gearbox");
  for (const z of [1, -1]) {
    b.add("arbres", cylZ(0.11, 0.11, 2.2, 1.65, -0.55, z * 1.9, 14), "steel");
    for (let i = 0; i < 4; i++) b.add("arbres", new THREE.TorusGeometry(0.22 - i * 0.025, 0.06, 8, 18).translate(1.65, -0.55, z * (1.0 + i * 0.1)), "rubber");
    for (let i = 0; i < 4; i++) b.add("arbres", new THREE.TorusGeometry(0.2 - i * 0.025, 0.055, 8, 18).translate(1.65, -0.55, z * (2.7 + i * 0.1)), "rubber");
    b.add("arbres", cylZ(0.3, 0.3, 0.12, 1.65, -0.55, z * 3.1, 24), "steel");
  }
  // Refroidissement
  b.add("refroidissement", tube([v(-0.7, 1.15, -0.72), v(-0.9, 0.9, -1.1), v(-0.6, 0.2, -1.12), v(-0.4, 0, -1.02)], 0.07, 20), "hose");
  b.add("refroidissement", tube([v(0.8, 1.15, -0.72), v(1.0, 0.95, -1.15), v(1.4, 1.0, -1.4), v(2.2, 0.8, -1.6)], 0.07, 20), "hose");
  b.add("refroidissement", cylY(0.15, 0.15, 0.35, -1.6, 0.6, -0.9, 18), "black");
  // Supports
  for (const z of [1, -1]) b.add("supports", rbox(0.4, 0.3, 0.4, -0.4, -0.9, z * 0.8, 0.05), "rubber");
  void look;
}

export function buildEngine(layout: EngineLayout, look: EngineLook): BuiltEngine {
  const b = new EngineBuilder(look);
  if (layout.kind === "electric") buildElectric(b, look);
  else buildCombustion(b, layout, look);
  return b.finalize();
}
