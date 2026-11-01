import type { BodyType, Car } from "../game/types";
import { modelOf } from "../game/car";

interface Shape {
  body: string;
  windows: string[];
  wheels: [number, number];
  r: number;
}

const SHAPES: Record<BodyType, Shape> = {
  citadine: {
    body: "M18 60 L18 46 Q20 40 40 38 L62 20 Q66 17 74 17 L132 17 Q140 17 146 24 L162 40 Q178 42 182 50 L182 60 Z",
    windows: ["M68 22 L120 22 L120 37 L52 37 Z", "M126 22 L140 22 Q143 23 146 27 L156 37 L126 37 Z"],
    wheels: [48, 152],
    r: 11,
  },
  berline: {
    body: "M8 60 L8 47 Q10 41 32 40 L62 24 Q68 20 78 20 L130 20 Q138 20 146 27 L162 39 Q188 41 192 48 L192 60 Z",
    windows: ["M72 25 L112 25 L112 38 L54 38 Z", "M118 25 L136 25 Q141 26 146 31 L154 38 L118 38 Z"],
    wheels: [42, 160],
    r: 11,
  },
  coupe: {
    body: "M8 60 L8 48 Q12 42 40 40 L72 26 Q80 22 92 22 L124 22 Q134 23 144 30 L160 40 Q188 42 192 50 L192 60 Z",
    windows: ["M82 27 L122 27 Q130 28 138 33 L146 39 L62 39 Z"],
    wheels: [44, 160],
    r: 11,
  },
  roadster: {
    body: "M10 60 L10 48 Q14 43 44 42 L84 41 L98 29 L102 29 L94 41 L150 41 Q186 42 190 50 L190 60 Z",
    windows: ["M98 31 L101 31 L95 40 L88 40 Z"],
    wheels: [44, 158],
    r: 11,
  },
  suv: {
    body: "M10 62 L10 42 Q12 36 30 35 L52 16 Q56 13 64 13 L150 13 Q156 13 160 18 L176 34 Q190 36 190 44 L190 62 Z",
    windows: ["M60 18 L104 18 L104 33 L44 33 Z", "M110 18 L150 18 L166 33 L110 33 Z"],
    wheels: [46, 156],
    r: 13,
  },
  supercar: {
    body: "M6 60 L6 50 Q10 45 40 43 L84 28 Q92 25 102 25 L120 25 Q132 26 146 34 L168 42 Q192 44 194 52 L194 60 Z",
    windows: ["M92 30 L120 30 Q128 31 136 35 L144 40 L74 40 Z"],
    wheels: [44, 162],
    r: 11,
  },
};

export function CarSvg({ car, size = 200 }: { car: Car; size?: number }) {
  const m = modelOf(car);
  const s = SHAPES[m.body];
  const p = car.parts;
  const lowered = p.suspension.variantId === "susp-filetes" || p.suspension.variantId === "susp-course" ? 3 : 0;
  const wing = p.boucliers.variantId === "boucliers-aero";
  const lip = p.boucliers.variantId === "boucliers-kit" || wing;
  const rim =
    p.jantes.variantId === "jantes-forgees" ? "#c9a227" : p.jantes.variantId === "jantes-sport" ? "#3a3d42" : p.jantes.condition < 40 ? "#7a6a58" : "#b7bcc2";
  const rust = Math.min(p.caisse.condition, p.peinture.condition) < 50;
  const dull = p.peinture.condition < 60;
  const nacre = p.peinture.variantId === "peinture-nacre";
  const gradId = `g-${car.id}`;
  return (
    <svg viewBox="0 0 200 80" width={size} height={(size * 80) / 200} className="car-svg" role="img" aria-label={m.name}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={nacre ? 0.55 : 0.28} />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="74" rx="90" ry="4" fill="#000" opacity="0.35" />
      <g transform={`translate(0 ${lowered})`}>
        <path d={s.body} fill={car.color.hex} opacity={dull ? 0.75 : 1} stroke="#0008" strokeWidth="1" />
        <path d={s.body} fill={`url(#${gradId})`} />
        {s.windows.map((w, i) => (
          <path key={i} d={w} fill="#9fc4d8" opacity="0.85" stroke="#0006" strokeWidth="0.8" />
        ))}
        {m.body === "roadster" && <path d="M108 41 Q110 33 116 33 Q120 34 120 41 Z" fill="#2a1d14" />}
        {rust && (
          <g fill="#7b4a23" opacity="0.85">
            <circle cx={s.wheels[0] + 16} cy="54" r="3" />
            <circle cx={s.wheels[1] - 18} cy="52" r="2.4" />
            <circle cx="100" cy="57" r="2" />
          </g>
        )}
        {lip && <rect x={s.wheels[0] - 12} y="58" width={s.wheels[1] - s.wheels[0] + 24} height="2.5" fill="#111" />}
        {wing && <path d="M6 40 L26 40 L26 43 L18 43 L16 47 L13 47 L14 43 L6 43 Z" fill="#111" />}
        <rect x="186" y="47" width="5" height="4" rx="1" fill={p.optiques.variantId ? "#e8f6ff" : "#f5e6a8"} />
        <rect x="8" y="47" width="4" height="4" rx="1" fill="#c0262b" />
      </g>
      {s.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={62} r={s.r} fill="#141518" />
          <circle cx={x} cy={62} r={s.r * 0.55} fill={rim} />
          <circle cx={x} cy={62} r={s.r * 0.15} fill="#222" />
        </g>
      ))}
    </svg>
  );
}
