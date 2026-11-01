import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PART_BY_ID } from "../game/data";
import { engineLayoutOf, engineLookOf } from "../game/engineLayout";
import type { Car, PartId } from "../game/types";
import { buildEngine, COMPONENTS, type BuiltEngine } from "./engineModel";

interface Props {
  car: Car;
  onSelectPart?: (part: PartId) => void;
}

function condColor(c: number): THREE.Color {
  return new THREE.Color(c >= 75 ? "#3fbf7f" : c >= 45 ? "#e3b341" : "#e5534b");
}

const KIND_LABEL = { inline: "En ligne", v: "En V", flat: "À plat", electric: "Électrique" } as const;

export default function Engine3D({ car, onSelectPart }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ctx = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    engine: BuiltEngine | null;
    explode: number;
    explodeTarget: number;
    hovered: string | null;
    selected: string | null;
    diagnostic: boolean;
  } | null>(null);

  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [explode, setExplode] = useState(0);
  const [diagnostic, setDiagnostic] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const layout = useMemo(() => engineLayoutOf(car), [car]);
  const look = useMemo(() => engineLookOf(car), [car]);
  const buildKey = JSON.stringify([layout, look]);

  // Scène, une seule fois
  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1c2a2e");
    scene.fog = new THREE.Fog("#1c2a2e", 14, 30);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(-6, 4.5, 7);

    // Lampe d'atelier suspendue
    const lamp = new THREE.SpotLight("#ffe2b0", 60, 30, 0.75, 0.55, 1.4);
    lamp.position.set(0, 9, 0.5);
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    lamp.shadow.bias = -0.0004;
    scene.add(lamp, lamp.target);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 1.1, 0.7, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: "#2f4a50", metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }),
    );
    shade.position.set(0, 9.3, 0.5);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: "#fff2cc" }));
    bulb.position.set(0, 9.05, 0.5);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4, 6), new THREE.MeshBasicMaterial({ color: "#111" }));
    cord.position.set(0, 11.6, 0.5);
    scene.add(shade, bulb, cord);
    scene.add(new THREE.HemisphereLight("#cfe3e6", "#2a2018", 0.6));
    const rim = new THREE.DirectionalLight("#9fd0ff", 0.8);
    rim.position.set(6, 3, -6);
    scene.add(rim);

    // Sol d'atelier
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshStandardMaterial({ color: "#3a4447", roughness: 0.85, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = "floor";
    scene.add(floor);
    const grid = new THREE.GridHelper(32, 16, "#56676b", "#4a585b");
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.002;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 3;
    controls.maxDistance = 22;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    ctx.current = { renderer, scene, camera, controls, engine: null, explode: 0, explodeTarget: 0, hovered: null, selected: null, diagnostic: false };

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    renderer.setAnimationLoop(() => {
      const c = ctx.current;
      if (!c) return;
      if (c.engine && Math.abs(c.explode - c.explodeTarget) > 0.001) {
        c.explode += (c.explodeTarget - c.explode) * 0.12;
        for (const m of c.engine.meshes) m.position.copy(m.userData.explodeDir as THREE.Vector3).multiplyScalar(c.explode);
      }
      controls.update();
      renderer.render(scene, camera);
    });

    // Interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const pick = (e: PointerEvent): string | null => {
      const c = ctx.current;
      if (!c?.engine) return null;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(c.engine.meshes, false)[0];
      return hit ? (hit.object.userData.comp as string) : null;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const key = pick(e);
      const r = renderer.domElement.getBoundingClientRect();
      if (ctx.current) ctx.current.hovered = key;
      setHover(key ? { key, x: e.clientX - r.left, y: e.clientY - r.top } : null);
      renderer.domElement.style.cursor = key ? "pointer" : "grab";
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      setSelected(pick(e));
    };
    const onLeave = () => setHover(null);
    const el = renderer.domElement;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      renderer.setAnimationLoop(null);
      ctx.current?.engine?.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh && !o.userData.comp) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      envTex.dispose();
      pmrem.dispose();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(el);
      ctx.current = null;
    };
  }, []);

  // (Re)construction du moteur quand la voiture change
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    const prevCenter = c.engine ? true : false;
    if (c.engine) {
      c.scene.remove(c.engine.root);
      c.engine.dispose();
    }
    const engine = buildEngine(layout, look);
    // Pose le moteur sur le sol, centré
    const lift = -(engine.center.y - engine.size.y / 2) + 0.15;
    engine.root.position.set(-engine.center.x, lift, -engine.center.z);
    c.scene.add(engine.root);
    c.engine = engine;
    c.explode = 0;
    for (const m of engine.meshes) m.position.copy(m.userData.explodeDir as THREE.Vector3).multiplyScalar(c.explodeTarget);
    c.explode = c.explodeTarget;
    if (!prevCenter) {
      const r = Math.max(engine.size.x, engine.size.z) * 0.95 + 2.5;
      c.camera.position.set(-r * 0.75, engine.size.y * 0.9 + 2.2, r * 0.85);
    }
    c.controls.target.set(0, engine.size.y * 0.42, 0);
    applyHighlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  function applyHighlight() {
    const c = ctx.current;
    if (!c?.engine) return;
    const seen = new Set<THREE.MeshStandardMaterial>();
    for (const m of c.engine.meshes) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (seen.has(mat)) continue;
      seen.add(mat);
      const key = m.userData.comp as string;
      mat.emissive.copy(mat.userData.baseEmissive as THREE.Color);
      mat.emissiveIntensity = mat.userData.baseEmissiveIntensity as number;
      if (c.diagnostic) {
        const part = COMPONENTS[key].part;
        mat.emissive.copy(condColor(car.parts[part].condition));
        mat.emissiveIntensity = 0.45;
      }
      if (key === c.selected) {
        mat.emissive.set("#e3a942");
        mat.emissiveIntensity = 0.55;
      } else if (key === c.hovered) {
        mat.emissive.set("#e3a942");
        mat.emissiveIntensity = 0.3;
      }
    }
  }

  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    c.selected = selected;
    c.diagnostic = diagnostic;
    c.hovered = hover?.key ?? null;
    c.explodeTarget = explode;
    c.controls.autoRotate = autoRotate && !selected;
    applyHighlight();
  });

  const resetView = () => {
    const c = ctx.current;
    if (!c?.engine) return;
    const r = Math.max(c.engine.size.x, c.engine.size.z) * 0.95 + 2.5;
    c.camera.position.set(-r * 0.75, c.engine.size.y * 0.9 + 2.2, r * 0.85);
    c.controls.target.set(0, c.engine.size.y * 0.42, 0);
    setSelected(null);
  };

  const sel = selected ? COMPONENTS[selected] : null;
  const selPart = sel ? car.parts[sel.part] : null;
  const layoutText =
    layout.kind === "electric"
      ? "Moteur électrique"
      : `${layout.cylinders} cylindres ${KIND_LABEL[layout.kind].toLowerCase()}${layout.turbos ? ` · ${layout.turbos === 2 ? "biturbo" : "turbo"}` : layout.carbs ? " · carburateurs" : " · atmosphérique"}`;

  return (
    <div className="engine3d">
      <div className="engine3d-head">
        <div>
          <span className="engine3d-kicker">Vue moteur 3D</span>
          <strong>{layout.label}</strong>
          <small>
            {layoutText} · {layout.power} ch{look.stage ? ` · Stage ${look.stage}` : ""}{layout.swapped ? " · SWAP" : ""}
          </small>
        </div>
        <div className="engine3d-tools">
          <label className="explode">
            <span>Vue éclatée</span>
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
          </label>
          <button className={diagnostic ? "active" : ""} onClick={() => setDiagnostic(!diagnostic)} title="Colore chaque élément selon l'état de la pièce">
            Diagnostic
          </button>
          <button className={autoRotate ? "active" : ""} onClick={() => setAutoRotate(!autoRotate)}>
            Rotation
          </button>
          <button onClick={resetView}>Recentrer</button>
        </div>
      </div>
      <div className="engine3d-canvas" ref={mountRef}>
        {hover && !selected && (
          <div className="engine3d-tip" style={{ left: hover.x + 14, top: hover.y + 10 }}>
            {COMPONENTS[hover.key].label}
          </div>
        )}
        {diagnostic && (
          <div className="engine3d-legend">
            <span className="good">● Bon</span>
            <span className="warn">● Usé</span>
            <span className="bad">● À refaire</span>
          </div>
        )}
        {sel && selPart && (
          <div className="engine3d-info">
            <button className="close" onClick={() => setSelected(null)} aria-label="Fermer">
              ✕
            </button>
            <h4>{sel.label}</h4>
            <p>{sel.description}</p>
            <div className="engine3d-cond">
              <span>{PART_BY_ID[sel.part].label}</span>
              <div className="bar">
                <div className={`bar-fill ${selPart.condition >= 75 ? "good" : selPart.condition >= 45 ? "warn" : "bad"}`} style={{ width: `${selPart.condition}%` }} />
              </div>
              <strong>{selPart.condition} %</strong>
            </div>
            {onSelectPart && (
              <button className="primary" onClick={() => onSelectPart(sel.part)}>
                Travailler sur cette pièce
              </button>
            )}
          </div>
        )}
        {!hover && !sel && <div className="engine3d-hint">Glissez pour tourner · molette / pincer pour zoomer · touchez une pièce</div>}
      </div>
    </div>
  );
}
