// src/components/library/SystemIcon.tsx
// Croquis SVG pour systèmes énergétiques.
import type { SystemIconKey } from "@/lib/calc/catalog/systems-library";

interface Props {
  kind: SystemIconKey;
  className?: string;
}

export function SystemIcon({ kind, className = "h-12 w-12" }: Props) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden>
      {render(kind)}
    </svg>
  );
}

function render(kind: SystemIconKey): JSX.Element {
  switch (kind) {
    case "BOILER_GAS":
    case "BOILER_OIL":
    case "BOILER_PELLET":
    case "BOILER_WOOD":
      return (
        <g>
          <rect x="10" y="6" width="28" height="34" rx="2" fill={kind === "BOILER_PELLET" || kind === "BOILER_WOOD" ? "#8B5A2B" : "#5A6371"} />
          <rect x="14" y="10" width="20" height="14" rx="1" fill={kind === "BOILER_OIL" ? "#1F2A3A" : "#FF8A00"} />
          <circle cx="18" cy="30" r="1.5" fill="#FFE9B7" />
          <circle cx="24" cy="30" r="1.5" fill="#FFE9B7" />
          <circle cx="30" cy="30" r="1.5" fill="#FFE9B7" />
          <path d="M14 6l4-4 4 4M30 6l4-4 4 4" stroke="#5A6371" strokeWidth={1.5} fill="none" />
          <rect x="22" y="42" width="4" height="4" fill="#5A6371" />
        </g>
      );
    case "HEAT_PUMP_AIR":
      return (
        <g>
          <rect x="6" y="14" width="36" height="22" rx="2" fill="#3A8A57" />
          <circle cx="24" cy="25" r="9" fill="#1F4D2E" />
          <circle cx="24" cy="25" r="3" fill="#3A8A57" />
          {/* Ailes ventilo */}
          {[0, 45, 90, 135].map((rot) => (
            <ellipse
              key={rot}
              cx="24"
              cy="17"
              rx="2"
              ry="6"
              fill="#3A8A57"
              transform={`rotate(${rot} 24 25)`}
            />
          ))}
          <path d="M6 36h36v4H6z" fill="#1F4D2E" />
        </g>
      );
    case "HEAT_PUMP_GEO":
      return (
        <g>
          <path d="M2 30h44v10H2z" fill="#8B5A2B" />
          <rect x="16" y="14" width="16" height="16" rx="2" fill="#3A8A57" />
          <circle cx="24" cy="22" r="4" fill="#1F4D2E" />
          <path d="M10 32q2 6 0 10M14 32q2 6 0 10M18 32q2 6 0 10M30 32q2 6 0 10M34 32q2 6 0 10M38 32q2 6 0 10" stroke="#6C4523" strokeWidth={1} fill="none" />
        </g>
      );
    case "RADIATOR_ELEC":
      return (
        <g>
          <rect x="8" y="10" width="32" height="28" rx="2" fill="white" stroke="#1F4D2E" strokeWidth={1.5} />
          {[14, 18, 22, 26, 30, 34].map((x) => (
            <rect key={x} x={x} y={14} width={2} height={20} fill="#1F4D2E" />
          ))}
          <line x1="8" y1="40" x2="40" y2="40" stroke="#3A8A57" strokeWidth={3} />
        </g>
      );
    case "FLOOR_HEATING":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#E8DCC2" />
          <path
            d="M4 14h36q4 0 4 4t-4 4H8q-4 0-4 4t4 4h36"
            fill="none"
            stroke="#C0392B"
            strokeWidth={1.8}
          />
          <path
            d="M4 22h36q4 0 4 4t-4 4H8q-4 0-4 4"
            fill="none"
            stroke="#C0392B"
            strokeWidth={1.8}
          />
        </g>
      );
    case "STOVE_PELLET":
    case "STOVE_WOOD":
      return (
        <g>
          <rect x="12" y="8" width="24" height="32" rx="2" fill="#2A2A2A" />
          <rect x="16" y="16" width="16" height="12" fill="#FF8A00" />
          <path d="M20 28q2 -8 4 0 q2 -8 4 0" fill="#FFE9B7" />
          <rect x="14" y="36" width="20" height="3" fill="#1A1A1A" />
          <rect x="22" y="2" width="4" height="8" fill="#5A5A5A" />
        </g>
      );
    case "WATER_TANK_ELEC":
    case "WATER_TANK_THERMO":
      return (
        <g>
          <rect x="14" y="6" width="20" height="36" rx="3" fill="#7BA8B5" />
          <rect x="14" y="6" width="20" height="6" fill="#5A8693" />
          <circle cx="24" cy="20" r="3" fill={kind === "WATER_TANK_THERMO" ? "#FF8A00" : "#FFE9B7"} />
          <text x="24" y="32" fontSize="8" fontWeight="700" textAnchor="middle" fill="white">
            {kind === "WATER_TANK_THERMO" ? "TH" : "ELC"}
          </text>
          <rect x="22" y="42" width="4" height="4" fill="#5A8693" />
        </g>
      );
    case "SOLAR_THERMAL":
    case "SOLAR_PV":
      return (
        <g>
          <rect
            x="6"
            y="10"
            width="36"
            height="22"
            rx="1"
            fill={kind === "SOLAR_PV" ? "#1F3A52" : "#A6532E"}
            transform="rotate(-10 24 21)"
          />
          {[14, 22, 30].map((x) => (
            <line
              key={x}
              x1={x}
              y1="8"
              x2={x - 4}
              y2="32"
              stroke={kind === "SOLAR_PV" ? "#3D6C85" : "#C49C66"}
              strokeWidth={1}
            />
          ))}
          {[16, 22, 28].map((y) => (
            <line
              key={y}
              x1="8"
              y1={y}
              x2="42"
              y2={y - 2}
              stroke={kind === "SOLAR_PV" ? "#3D6C85" : "#C49C66"}
              strokeWidth={1}
            />
          ))}
          <circle cx="38" cy="6" r="3" fill="#FFD700" />
          <line x1="38" y1="1" x2="38" y2="3" stroke="#FFD700" strokeWidth={1} />
          <line x1="43" y1="6" x2="45" y2="6" stroke="#FFD700" strokeWidth={1} />
        </g>
      );
    case "VMC_SIMPLE":
    case "VMC_DOUBLE":
      return (
        <g>
          <rect x="6" y="14" width="36" height="20" rx="2" fill="#7BA8B5" />
          <circle cx="16" cy="24" r="6" fill="#1F4D2E" />
          {[0, 60, 120].map((rot) => (
            <ellipse
              key={rot}
              cx="16"
              cy="20"
              rx="1.5"
              ry="4"
              fill="white"
              transform={`rotate(${rot} 16 24)`}
            />
          ))}
          {kind === "VMC_DOUBLE" && (
            <>
              <circle cx="32" cy="24" r="6" fill="#1F4D2E" />
              {[0, 60, 120].map((rot) => (
                <ellipse
                  key={`r${rot}`}
                  cx="32"
                  cy="20"
                  rx="1.5"
                  ry="4"
                  fill="white"
                  transform={`rotate(${rot} 32 24)`}
                />
              ))}
            </>
          )}
          <path d="M6 14l-4 -4M42 14l4 -4" stroke="#5A8693" strokeWidth={2} />
        </g>
      );
    case "AC_SPLIT":
    case "AC_CENTRAL":
      return (
        <g>
          <rect x="6" y="14" width="36" height="14" rx="2" fill="white" stroke="#1F4D2E" strokeWidth={1.5} />
          {[12, 18, 24, 30, 36].map((x) => (
            <line key={x} x1={x} y1="18" x2={x} y2="24" stroke="#1F4D2E" strokeWidth={1} />
          ))}
          {/* Flux d'air */}
          <path d="M14 30q-2 4 0 8M24 30q-2 4 0 8M34 30q-2 4 0 8" stroke="#7BA8B5" strokeWidth={1.5} fill="none" strokeDasharray="2 2" />
        </g>
      );
    case "DISTRICT_HEAT":
      return (
        <g>
          <rect x="6" y="14" width="36" height="24" rx="2" fill="#A6532E" />
          <rect x="18" y="20" width="12" height="14" rx="1" fill="#FF8A00" />
          <text x="24" y="32" fontSize="6" fontWeight="700" textAnchor="middle" fill="white">
            RCU
          </text>
          <path d="M14 6h4v8h-4z M30 6h4v8h-4z" fill="#7B4823" />
          <path d="M2 14q4 -8 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" stroke="#7B4823" strokeWidth={1.5} fill="none" />
        </g>
      );
    case "DISTRICT_COLD":
      return (
        <g>
          <rect x="6" y="14" width="36" height="24" rx="2" fill="#7BA8B5" />
          <circle cx="24" cy="26" r="6" fill="white" />
          <text x="24" y="29" fontSize="6" fontWeight="700" textAnchor="middle" fill="#1F4D2E">
            ❄
          </text>
          <path d="M2 14q4 -8 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" stroke="#5A8693" strokeWidth={1.5} fill="none" />
        </g>
      );
    case "GTB_CONTROL":
      return (
        <g>
          <rect x="8" y="6" width="32" height="20" rx="2" fill="#1F4D2E" />
          <rect x="10" y="8" width="28" height="16" fill="#3A8A57" />
          {[12, 16, 20, 24, 28, 32].map((x, i) => (
            <rect key={x} x={x} y={10 + (i % 3) * 4} width={2} height={2} fill={i % 2 === 0 ? "#FFD700" : "white"} />
          ))}
          <rect x="20" y="28" width="8" height="14" fill="#1F4D2E" />
          <rect x="14" y="42" width="20" height="2" fill="#1F4D2E" />
        </g>
      );
    case "MICRO_WIND":
      return (
        <g>
          <rect x="22" y="20" width="4" height="22" fill="#7BA8B5" />
          <circle cx="24" cy="20" r="3" fill="#1F4D2E" />
          <path d="M24 20 L24 6 Q26 8 24 12" fill="white" />
          <path d="M24 20 L36 26 Q32 28 28 24" fill="white" />
          <path d="M24 20 L12 26 Q16 28 20 24" fill="white" />
        </g>
      );
    default:
      return <rect x="6" y="6" width="36" height="36" fill="#E5E5E5" />;
  }
}
