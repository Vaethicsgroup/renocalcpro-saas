// src/components/library/MaterialIcon.tsx
// ════════════════════════════════════════════════════════════════════════════
// Croquis SVG d'un matériau selon sa clé. 24 patterns visuels distincts.
// ════════════════════════════════════════════════════════════════════════════

import type { SketchKey } from "@/lib/calc/catalog/materials-library";

interface Props {
  kind: SketchKey;
  className?: string;
}

export function MaterialIcon({ kind, className = "h-12 w-12" }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden
    >
      {renderSketch(kind)}
    </svg>
  );
}

function renderSketch(kind: SketchKey): JSX.Element {
  switch (kind) {
    case "STONE":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" rx="2" fill="#D6CFB5" />
          <path d="M4 14h12l4 6h-8l-4 4z" fill="#B8AE8F" />
          <path d="M24 6h8l4 6h-12z" fill="#B8AE8F" />
          <path d="M36 14h8v10h-4l-4-4z" fill="#B8AE8F" />
          <path d="M16 26l6 4 4-4 6 4-4 6h-12z" fill="#B8AE8F" />
          <path d="M4 30h6l4 6h-6l-4-6z" fill="#A89E80" />
          <path d="M36 30h8v12h-12z" fill="#A89E80" />
        </g>
      );
    case "BRICK":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#C75F45" />
          {[10, 18, 26, 34].map((y) => (
            <line
              key={y}
              x1="4"
              y1={y}
              x2="44"
              y2={y}
              stroke="#9E4837"
              strokeWidth={1}
            />
          ))}
          {[10, 18, 26, 34, 42].map((y, i) =>
            [10, 22, 34].map((x) => (
              <line
                key={`${y}-${x}`}
                x1={i % 2 === 0 ? x : x + 6}
                y1={y - 8}
                x2={i % 2 === 0 ? x : x + 6}
                y2={y}
                stroke="#9E4837"
                strokeWidth={1}
              />
            )),
          )}
        </g>
      );
    case "BLOCK":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#B8BCC0" />
          {[14, 22, 30, 38].map((y) => (
            <line
              key={y}
              x1="4"
              y1={y}
              x2="44"
              y2={y}
              stroke="#8B8E91"
              strokeWidth={1}
            />
          ))}
          {[14, 22, 30, 38].map((y, i) => (
            <line
              key={`v${y}`}
              x1={i % 2 === 0 ? 18 : 30}
              y1={y - 8}
              x2={i % 2 === 0 ? 18 : 30}
              y2={y}
              stroke="#8B8E91"
              strokeWidth={1}
            />
          ))}
          <ellipse cx="14" cy="18" rx="2" ry="2" fill="#8B8E91" opacity="0.5" />
          <ellipse cx="34" cy="26" rx="2" ry="2" fill="#8B8E91" opacity="0.5" />
        </g>
      );
    case "CONCRETE":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#A8A8A8" />
          <circle cx="12" cy="14" r="1.5" fill="#7D7D7D" />
          <circle cx="22" cy="18" r="1" fill="#7D7D7D" />
          <circle cx="32" cy="12" r="1.2" fill="#7D7D7D" />
          <circle cx="40" cy="20" r="1.5" fill="#7D7D7D" />
          <circle cx="10" cy="28" r="1" fill="#7D7D7D" />
          <circle cx="20" cy="32" r="1.4" fill="#7D7D7D" />
          <circle cx="30" cy="36" r="1.2" fill="#7D7D7D" />
          <circle cx="38" cy="32" r="1.1" fill="#7D7D7D" />
        </g>
      );
    case "EARTH":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#A07A4F" />
          <path d="M4 16q10 -4 20 0 t20 0" stroke="#7B5A35" strokeWidth={1} fill="none" />
          <path d="M4 26q10 -4 20 0 t20 0" stroke="#7B5A35" strokeWidth={1} fill="none" />
          <path d="M4 36q10 -4 20 0 t20 0" stroke="#7B5A35" strokeWidth={1} fill="none" />
          <line x1="10" y1="10" x2="14" y2="16" stroke="#7B5A35" strokeWidth={0.6} />
          <line x1="22" y1="20" x2="26" y2="26" stroke="#7B5A35" strokeWidth={0.6} />
          <line x1="34" y1="30" x2="38" y2="36" stroke="#7B5A35" strokeWidth={0.6} />
        </g>
      );
    case "WOOD_FRAME":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#F5EBD7" />
          <rect x="6" y="8" width="3" height="32" fill="#A0825A" />
          <rect x="22" y="8" width="3" height="32" fill="#A0825A" />
          <rect x="38" y="8" width="3" height="32" fill="#A0825A" />
          <rect x="6" y="8" width="35" height="3" fill="#A0825A" />
          <rect x="6" y="37" width="35" height="3" fill="#A0825A" />
          <rect x="6" y="22" width="35" height="2.5" fill="#A0825A" />
          {/* Hachures isolant */}
          {[12, 17, 27, 32].map((y) => (
            <line
              key={y}
              x1="9"
              y1={y}
              x2="22"
              y2={y}
              stroke="#D4B68E"
              strokeWidth={0.8}
              strokeDasharray="3 2"
            />
          ))}
          {[12, 17, 27, 32].map((y) => (
            <line
              key={`r${y}`}
              x1="25"
              y1={y}
              x2="38"
              y2={y}
              stroke="#D4B68E"
              strokeWidth={0.8}
              strokeDasharray="3 2"
            />
          ))}
        </g>
      );
    case "STRAW":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#EDD897" />
          <rect x="6" y="8" width="36" height="6" fill="none" stroke="#C9A856" strokeWidth={1} />
          <rect x="6" y="16" width="36" height="6" fill="none" stroke="#C9A856" strokeWidth={1} />
          <rect x="6" y="24" width="36" height="6" fill="none" stroke="#C9A856" strokeWidth={1} />
          <rect x="6" y="32" width="36" height="6" fill="none" stroke="#C9A856" strokeWidth={1} />
          {[11, 19, 27, 35].map((y) =>
            [10, 16, 22, 28, 34, 40].map((x) => (
              <line
                key={`${x}-${y}`}
                x1={x}
                y1={y - 2}
                x2={x + 1}
                y2={y + 2}
                stroke="#A38A48"
                strokeWidth={0.5}
              />
            )),
          )}
        </g>
      );
    case "FIBER_BOARD":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#D9C9A3" />
          {[10, 14, 18, 22, 26, 30, 34, 38].map((y) => (
            <line
              key={y}
              x1="4"
              y1={y}
              x2="44"
              y2={y}
              stroke="#A89478"
              strokeWidth={0.6}
              opacity={0.7}
            />
          ))}
          <path d="M10 24q4 -3 8 0 q4 3 8 0 q4 -3 8 0" stroke="#7E6C50" strokeWidth={0.8} fill="none" />
        </g>
      );
    case "MINERAL_WOOL":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#FFE8D6" />
          {[10, 18, 26, 34].map((y) =>
            [...Array(20)].map((_, i) => (
              <line
                key={`${y}-${i}`}
                x1={4 + i * 2}
                y1={y - 3}
                x2={4 + i * 2 + 1}
                y2={y + 3}
                stroke="#C99B6E"
                strokeWidth={0.4}
                opacity={0.6}
              />
            )),
          )}
        </g>
      );
    case "FOAM":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#F2F2F2" />
          {Array.from({ length: 80 }).map((_, i) => {
            const cx = 6 + (i % 10) * 4;
            const cy = 10 + Math.floor(i / 10) * 4;
            const r = 1 + ((i * 7) % 4) * 0.3;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#B5B5B5"
                strokeWidth={0.6}
              />
            );
          })}
        </g>
      );
    case "CORK":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#C49C66" />
          {[
            [8, 10, 3],
            [16, 12, 2.5],
            [22, 8, 2],
            [30, 14, 3],
            [38, 10, 2.5],
            [10, 20, 2.8],
            [20, 22, 3],
            [28, 18, 2.4],
            [36, 22, 3.2],
            [8, 30, 2.6],
            [18, 32, 2.9],
            [26, 34, 2.3],
            [34, 30, 3],
            [42, 36, 2.5],
            [14, 38, 2.6],
          ].map(([cx, cy, r], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={r}
              ry={r * 0.7}
              fill="#9C7340"
              opacity={0.6}
            />
          ))}
        </g>
      );
    case "CELLULOSE":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#E8DCC2" />
          {Array.from({ length: 40 }).map((_, i) => {
            const cx = 6 + (i * 13) % 36;
            const cy = 8 + (i * 7) % 32;
            const rot = (i * 23) % 90;
            return (
              <rect
                key={i}
                x={cx}
                y={cy}
                width={4}
                height={1.5}
                fill="#A88F65"
                transform={`rotate(${rot} ${cx + 2} ${cy + 0.75})`}
                opacity={0.55}
              />
            );
          })}
        </g>
      );
    case "GLASS_DOUBLE":
      return (
        <g>
          <rect x="8" y="6" width="32" height="36" fill="#C5DEE5" opacity="0.4" />
          <rect x="8" y="6" width="3" height="36" fill="#7BA8B5" />
          <rect x="37" y="6" width="3" height="36" fill="#7BA8B5" />
          <line x1="22" y1="6" x2="22" y2="42" stroke="#7BA8B5" strokeWidth={2} />
          <line x1="26" y1="6" x2="26" y2="42" stroke="#7BA8B5" strokeWidth={2} />
          {/* Reflets */}
          <line x1="14" y1="10" x2="18" y2="14" stroke="white" strokeWidth={1} opacity={0.7} />
          <line x1="30" y1="20" x2="34" y2="24" stroke="white" strokeWidth={1} opacity={0.7} />
        </g>
      );
    case "GLASS_TRIPLE":
      return (
        <g>
          <rect x="8" y="6" width="32" height="36" fill="#C5DEE5" opacity="0.4" />
          <rect x="8" y="6" width="2" height="36" fill="#7BA8B5" />
          <rect x="38" y="6" width="2" height="36" fill="#7BA8B5" />
          <line x1="19" y1="6" x2="19" y2="42" stroke="#7BA8B5" strokeWidth={1.5} />
          <line x1="22" y1="6" x2="22" y2="42" stroke="#7BA8B5" strokeWidth={1.5} />
          <line x1="26" y1="6" x2="26" y2="42" stroke="#7BA8B5" strokeWidth={1.5} />
          <line x1="29" y1="6" x2="29" y2="42" stroke="#7BA8B5" strokeWidth={1.5} />
          <line x1="14" y1="10" x2="18" y2="14" stroke="white" strokeWidth={1} opacity={0.7} />
        </g>
      );
    case "VAPOR_BARRIER":
      return (
        <g>
          <rect x="4" y="20" width="40" height="8" fill="#3A8A57" opacity={0.85} />
          <rect x="4" y="20" width="40" height="8" fill="none" stroke="#1F4D2E" strokeWidth={0.6} />
          {/* Hachures isolant des deux côtés */}
          {[8, 12, 16].map((y) => (
            <line key={`a${y}`} x1="4" y1={y} x2="44" y2={y} stroke="#D9C9A3" strokeWidth={0.6} strokeDasharray="3 2" />
          ))}
          {[32, 36, 40].map((y) => (
            <line key={`b${y}`} x1="4" y1={y} x2="44" y2={y} stroke="#D9C9A3" strokeWidth={0.6} strokeDasharray="3 2" />
          ))}
          <text x="24" y="26" fontSize="6" fontWeight="700" textAnchor="middle" fill="white">SD</text>
        </g>
      );
    case "TILE":
      return (
        <g>
          {[
            [4, 8],
            [12, 8],
            [20, 8],
            [28, 8],
            [36, 8],
            [4, 18],
            [12, 18],
            [20, 18],
            [28, 18],
            [36, 18],
            [4, 28],
            [12, 28],
            [20, 28],
            [28, 28],
            [36, 28],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y + 10}q4 -10 8 0`}
              fill="#A6532E"
              stroke="#7A3C20"
              strokeWidth={0.5}
            />
          ))}
        </g>
      );
    case "SLATE":
      return (
        <g>
          {[
            [4, 8],
            [13, 8],
            [22, 8],
            [31, 8],
            [40, 8],
            [4, 18],
            [13, 18],
            [22, 18],
            [31, 18],
            [40, 18],
            [4, 28],
            [13, 28],
            [22, 28],
            [31, 28],
            [40, 28],
          ].map(([x, y], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={9}
              height={11}
              fill="#3A4A5C"
              stroke="#1F2A3A"
              strokeWidth={0.6}
            />
          ))}
        </g>
      );
    case "ZINC":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#A8B2BC" />
          {[10, 18, 26, 34, 42].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1={6}
              x2={x}
              y2={42}
              stroke="#5A6371"
              strokeWidth={2}
            />
          ))}
          <line x1="4" y1="6" x2="44" y2="6" stroke="#5A6371" strokeWidth={1} />
        </g>
      );
    case "AEROGEL":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#E0EBF5" opacity={0.95} />
          {Array.from({ length: 200 }).map((_, i) => {
            const cx = 4 + (i * 11) % 38;
            const cy = 8 + (i * 7) % 32;
            return (
              <circle key={i} cx={cx} cy={cy} r={0.3} fill="#8FB4C8" opacity={0.6} />
            );
          })}
          <text x="24" y="28" fontSize="10" fontWeight="700" textAnchor="middle" fill="#3D6C85" opacity={0.8}>
            ✦
          </text>
        </g>
      );
    case "VIP":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#1F2A3A" />
          <rect x="6" y="8" width="36" height="32" fill="#3A4A5C" />
          <rect x="8" y="10" width="32" height="28" fill="none" stroke="#7B8AA0" strokeWidth={1} strokeDasharray="2 2" />
          <text x="24" y="28" fontSize="8" fontWeight="700" textAnchor="middle" fill="white">
            VIDE
          </text>
        </g>
      );
    case "PCM":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#FFE8D6" />
          {Array.from({ length: 30 }).map((_, i) => {
            const cx = 6 + (i * 17) % 36;
            const cy = 8 + (i * 11) % 32;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={2} fill="#FF8A00" opacity={0.7} />
                <circle cx={cx} cy={cy} r={1} fill="#FFD89A" />
              </g>
            );
          })}
        </g>
      );
    case "BTC":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#B89976" />
          {[12, 20, 28, 36].map((y) => (
            <line key={y} x1="4" y1={y} x2="44" y2={y} stroke="#7B5A35" strokeWidth={1} />
          ))}
          {[12, 20, 28, 36].map((y, i) => (
            <line
              key={`v${y}`}
              x1={i % 2 === 0 ? 18 : 30}
              y1={y - 8}
              x2={i % 2 === 0 ? 18 : 30}
              y2={y}
              stroke="#7B5A35"
              strokeWidth={1}
            />
          ))}
        </g>
      );
    case "HEMP_LIME":
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#F0E8D5" />
          {/* Brins de chanvre */}
          {Array.from({ length: 30 }).map((_, i) => {
            const cx = 6 + (i * 13) % 36;
            const cy = 8 + (i * 7) % 32;
            const rot = (i * 31) % 180;
            return (
              <rect
                key={i}
                x={cx}
                y={cy}
                width={6}
                height={1}
                fill="#3A8A57"
                opacity={0.7}
                transform={`rotate(${rot} ${cx + 3} ${cy})`}
              />
            );
          })}
          {/* Liant chaux */}
          {Array.from({ length: 25 }).map((_, i) => {
            const cx = 4 + (i * 19) % 40;
            const cy = 6 + (i * 5) % 36;
            return (
              <circle key={`c${i}`} cx={cx} cy={cy} r={0.4} fill="white" opacity={0.6} />
            );
          })}
        </g>
      );
    default:
      return (
        <g>
          <rect x="4" y="6" width="40" height="36" fill="#E5E5E5" />
        </g>
      );
  }
}
