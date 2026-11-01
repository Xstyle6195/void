import { lazy, Suspense, useState } from "react";
import { CUSTOM_COLORS, DOMAINS, ENGINE_SWAPS, PART_BY_ID, PARTS, VARIANTS } from "../game/data";
import { carName, isCollectible, modelOf, partStatusLabel } from "../game/car";
import { checkCriteria, checkOem, checkRestore, checkSwap, checkVariant, type OpCheck } from "../game/engine";
import type { Car, Domain, Effects, PartId } from "../game/types";
import { formatMoney } from "../game/utils";
import { useStore } from "../state/store";
import { CarSvg } from "./CarSvg";
import { Bar, CarLabelsFor, Empty, StatGrid, ValueLine } from "./common";

const Engine3D = lazy(() => import("../three/Engine3D"));

function effectsText(e: Effects): string {
  const out: string[] = [];
  if (e.powerPct) out.push(`+${Math.round(e.powerPct * 100)} % puissance`);
  if (e.handling) out.push(`${e.handling > 0 ? "+" : ""}${e.handling} tenue`);
  if (e.luxe) out.push(`${e.luxe > 0 ? "+" : ""}${e.luxe} luxe`);
  if (e.style) out.push(`${e.style > 0 ? "+" : ""}${e.style} style`);
  return out.join(" · ");
}

function OpButton({ label, check, onClick, className }: { label: string; check: OpCheck; onClick: () => void; className?: string }) {
  return (
    <button className={className} disabled={!!check.reason} onClick={onClick} title={check.reason ?? ""}>
      <span>{label}</span>
      <small>{check.reason ?? `${formatMoney(check.cost)} · ${check.hours} h`}</small>
    </button>
  );
}

function PartRow({ car, partId, flash }: { car: Car; partId: PartId; flash: boolean }) {
  const { game, restore, oem, variant, swap } = useStore();
  const [open, setOpen] = useState(false);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const def = PARTS.find((p) => p.id === partId)!;
  const p = car.parts[partId];
  const m = modelOf(car);
  const variants = VARIANTS.filter((v) => v.part === partId);
  const rc = checkRestore(game, car, partId);
  const oc = checkOem(game, car, partId);
  return (
    <div className={`part-row ${flash ? "flash" : ""}`} id={`part-${partId}`}>
      <div className="part-head">
        <div className="part-name">
          <strong>{def.label}</strong>
          <span className={`origin origin-${p.origin}`}>{partStatusLabel(p)}</span>
        </div>
        <div className="part-cond">
          <Bar value={p.condition} />
          <span>{p.condition} %</span>
        </div>
      </div>
      <div className="part-actions">
        <OpButton label="Restaurer" check={rc} onClick={() => restore(car.id, partId)} />
        <OpButton label={isCollectible(m) ? "Pièce d'origine (rare)" : "Pièce d'origine neuve"} check={oc} onClick={() => oem(car.id, partId)} />
        <button className={open ? "active" : ""} onClick={() => setOpen(!open)}>
          <span>{partId === "moteur" ? "Préparer / Swap" : "Améliorer"} {open ? "▴" : "▾"}</span>
          <small>{variants.length + (partId === "moteur" ? ENGINE_SWAPS.length : 0)} options</small>
        </button>
      </div>
      {open && (
        <div className="variants">
          {variants.map((v) => {
            const c = checkVariant(game, car, v.id);
            return (
              <div key={v.id} className={`variant ${p.variantId === v.id ? "installed" : ""}`}>
                <div>
                  <strong>{v.label}</strong>
                  <p className="small muted">{v.description}</p>
                  <p className="small effects">{effectsText(v.effects)} · originalité ✗</p>
                  {colorFor === v.id && (
                    <div className="swatches">
                      {CUSTOM_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          className="swatch"
                          style={{ background: col.hex }}
                          title={col.name}
                          onClick={() => {
                            variant(car.id, v.id, col);
                            setColorFor(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <OpButton
                  label={p.variantId === v.id ? "Réinstaller" : "Installer"}
                  check={c}
                  className="primary"
                  onClick={() => (v.customColor ? setColorFor(colorFor === v.id ? null : v.id) : variant(car.id, v.id))}
                />
              </div>
            );
          })}
          {partId === "moteur" && (
            <>
              <h4 className="swap-title">Swap moteur — remplace le {m.engineLabel} ({m.basePower} ch)</h4>
              {ENGINE_SWAPS.map((s) => {
                const c = checkSwap(game, car, s.id);
                return (
                  <div key={s.id} className={`variant ${p.variantId === s.id ? "installed" : ""}`}>
                    <div>
                      <strong>{s.label}</strong>
                      <p className="small effects">
                        {s.power} ch · compatible : {s.sizes.join(", ")} · originalité ✗
                      </p>
                    </div>
                    <OpButton label="Swapper" check={c} className="primary" onClick={() => swap(car.id, s.id)} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ConceptionView() {
  const { game, selectedCarId, openCar, setTab } = useStore();
  const [domain, setDomain] = useState<Domain>("mecanique");
  const [flash, setFlash] = useState<PartId | null>(null);
  const workable = game.cars.filter((c) => c.status === "atelier");
  const car = workable.find((c) => c.id === selectedCarId) ?? workable[0];
  if (!car) {
    return (
      <section>
        <h2>Conception</h2>
        <Empty>
          Aucune voiture disponible à l'atelier. <button className="link" onClick={() => setTab("marche")}>Allez au marché</button>.
        </Empty>
      </section>
    );
  }
  const m = modelOf(car);
  const order = car.clientOrderId ? game.orders.find((o) => o.id === car.clientOrderId) : undefined;
  return (
    <section>
      <div className="section-head">
        <h2>Conception</h2>
        <div className="car-picker">
          {workable.map((c) => (
            <button key={c.id} className={c.id === car.id ? "active" : ""} onClick={() => openCar(c.id)}>
              {carName(c)}
            </button>
          ))}
        </div>
      </div>
      <div className="conception">
        <aside className="card car-sheet">
          <h3>{carName(car)}</h3>
          <p className="muted">
            {m.year} · {m.engineLabel} · {m.weight} kg · {car.color.name}
          </p>
          <div className="sheet-car">
            <CarSvg car={car} size={320} />
          </div>
          <CarLabelsFor car={car} />
          <StatGrid car={car} />
          {order ? (
            <div className="order-goal">
              <strong>Objectifs de {order.client}</strong>
              {checkCriteria(car, order.criteria).map((c) => (
                <div key={c.label} className={c.ok ? "ok" : "ko"}>
                  {c.ok ? "✔" : "✘"} {c.label}
                </div>
              ))}
              <small>Rémunération : {formatMoney(order.reward)}</small>
            </div>
          ) : (
            <ValueLine car={car} />
          )}
          <details className="history">
            <summary>Dossier de préparation ({car.history.length})</summary>
            <ul>
              {car.history.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </details>
          <p className="hint small">
            💡 Restaurer conserve l'originalité (100 %). Une pièce d'origine neuve vaut 85 %. Une pièce performance l'annule. Les
            collectionneurs paient très cher un ancien en état concours et d'origine.
          </p>
        </aside>
        <div className="parts-panel">
          <div className="domain-tabs">
            {DOMAINS.map((d) => (
              <button key={d.id} className={domain === d.id ? "active" : ""} onClick={() => setDomain(d.id)}>
                {d.icon} {d.label}
              </button>
            ))}
          </div>
          {domain === "mecanique" && (
            <Suspense fallback={<div className="engine3d engine3d-loading">Chargement de la vue 3D…</div>}>
              <Engine3D
                car={car}
                onSelectPart={(part) => {
                  setDomain(PART_BY_ID[part].domain);
                  setFlash(part);
                  setTimeout(() => document.getElementById(`part-${part}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
                  setTimeout(() => setFlash(null), 1600);
                }}
              />
            </Suspense>
          )}
          {PARTS.filter((p) => p.domain === domain).map((p) => (
            <PartRow key={`${car.id}-${p.id}`} car={car} partId={p.id} flash={flash === p.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
