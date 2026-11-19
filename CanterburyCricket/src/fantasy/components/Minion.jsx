import { minionLook, minionPhase, shirtText } from "../shared/minion";

const INK = "#16110e";
const KIT = "#0f1a33"; // Canterbury navy
const GOLD = "#f7b500";
const WHITES = "#f5f0e6";

function Hair({ look }) {
  const c = look.hairColor;
  switch (look.hair) {
    case "cap":
      return (
        <g>
          <path d="M28 31 q1 -19 22 -19 q21 0 22 19 z" fill={KIT} />
          <path d="M50 31 h27 q2 0 1 2 q-6 3 -28 1 z" fill={KIT} />
          <circle cx="50" cy="14" r="2" fill={GOLD} />
          <path d="M36 22 q14 -6 28 0" stroke={GOLD} strokeWidth="1.4" fill="none" opacity="0.8" />
        </g>
      );
    case "buzz":
      return <path d="M29 30 q2 -17 21 -17 q19 0 21 17 q-6 -6 -21 -7 q-15 1 -21 7 z" fill={c} />;
    case "curly":
      return (
        <g fill={c}>
          {[[31, 27], [35, 19], [42, 14], [50, 12], [58, 14], [65, 19], [69, 27], [46, 18], [55, 18]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6.2} />
          ))}
        </g>
      );
    case "quiff":
      return (
        <g fill={c}>
          <path d="M29 30 q2 -17 21 -17 q19 0 21 17 q-6 -6 -21 -7 q-15 1 -21 7 z" />
          <path d="M33 23 q3 -16 22 -14 q9 1 11 9 q-10 -5 -20 -2 q-8 2 -13 7 z" />
        </g>
      );
    case "spiky":
      return <path d="M29 32 L31 18 L37 24 L40 11 L46 21 L50 8 L54 21 L60 11 L63 24 L69 18 L71 32 Q60 22 50 22 Q40 22 29 32 Z" fill={c} />;
    case "sidepart":
      return <path d="M29 33 q-1 -20 21 -20 q20 0 22 18 q-8 -9 -16 -9 l-4 5 -2 -5 q-12 0 -21 11 z" fill={c} />;
    case "topknot":
      return (
        <g fill={c}>
          <path d="M29 30 q2 -17 21 -17 q19 0 21 17 q-6 -6 -21 -7 q-15 1 -21 7 z" />
          <circle cx="50" cy="9.5" r="6.5" />
          <rect x="46" y="13" width="8" height="2.6" rx="1.3" fill={GOLD} />
        </g>
      );
    case "mop":
      return <path d="M27 38 q-3 -26 23 -26 q26 0 23 26 q-3 -6 -6 -9 q-2 5 -6 4 q-2 -6 -5 -6 q-3 6 -6 5 q-3 -6 -6 -5 q-3 6 -6 4 q-3 -5 -5 -3 q-4 4 -6 10 z" fill={c} />;
    case "waves":
      return (
        <g fill={c}>
          <path d="M29 31 q1 -18 21 -18 q20 0 21 18 q-3 -3 -6 -1 q-3 -4 -7 -2 q-4 -4 -8 -1 q-4 -3 -8 1 q-4 -2 -7 2 q-3 -2 -6 1 z" />
          <path d="M37 19 q4 -2 8 0 M49 17 q4 -2 8 0" stroke="#000" strokeOpacity="0.18" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return <path d="M29 30 q2 -17 21 -17 q19 0 21 17 q-6 -6 -21 -7 q-15 1 -21 7 z" fill={c} />;
  }
}

function Eyes({ look }) {
  if (look.eyes === "happy") {
    return (
      <g className="eyes" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
        <path d="M38.5 36.5 q3.5 -4 7 0" />
        <path d="M54.5 36.5 q3.5 -4 7 0" />
      </g>
    );
  }
  if (look.eyes === "dot") {
    return (
      <g className="eyes" fill={INK}>
        <circle cx="42" cy="35.5" r="2.5" />
        <circle cx="58" cy="35.5" r="2.5" />
      </g>
    );
  }
  return (
    <g className="eyes">
      <ellipse cx="42" cy="35" rx="4.6" ry="5.2" fill="#fff" />
      <ellipse cx="58" cy="35" rx="4.6" ry="5.2" fill="#fff" />
      <circle cx="42.8" cy="36" r="2.5" fill={INK} />
      <circle cx="58.8" cy="36" r="2.5" fill={INK} />
      <circle cx="43.6" cy="35" r="0.8" fill="#fff" />
      <circle cx="59.6" cy="35" r="0.8" fill="#fff" />
    </g>
  );
}

function Mouth({ look }) {
  switch (look.mouth) {
    case "grin":
      return (
        <g>
          <path d="M43 44 q7 7.5 14 0 z" fill="#5a1f1f" />
          <path d="M44.2 44.4 h11.6 l-0.8 1.6 h-10 z" fill="#fff" />
        </g>
      );
    case "o":
      return <ellipse cx="50" cy="46" rx="2.6" ry="3" fill="#5a1f1f" />;
    case "smirk":
      return <path d="M45 45.5 q6 3 11 -2" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />;
    default:
      return <path d="M44 44.5 q6 5 12 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />;
  }
}

/** Bat for batters/keepers/all-rounders, red ball for bowlers, held in the right hand. */
function Prop({ role }) {
  if (role === "BOWLER") {
    return (
      <g>
        <circle cx="78" cy="76" r="5" fill="#b3261e" />
        <path d="M74 73.5 q4 2.5 8 0 M74 78.5 q4 -2.5 8 0" stroke="#f5f0e6" strokeWidth="0.8" fill="none" />
      </g>
    );
  }
  return (
    <g transform="rotate(-24 77 78)">
      <rect x="75.5" y="58" width="3" height="11" rx="1.2" fill="#2b1d15" />
      <rect x="73" y="68" width="8" height="26" rx="2.5" fill="#e9c98a" />
      <rect x="73" y="68" width="8" height="3" fill="#000" opacity="0.12" />
    </g>
  );
}

/**
 * An original cartoon cricketer for a Canterbury squad player: big head, navy kit with
 * a gold collar, jersey number on the shirt, whites, and a bat or ball for their role.
 * Decorative by default; pass `label` to expose it to screen readers. Static unless `animated`
 * (a page of 30 bobbing minions is a lot of repainting for a phone).
 */
export default function Minion({ name, jersey, role, size = 96, variant = "full", className = "", label, animated = false }) {
  const look = minionLook(name);
  const full = variant === "full";
  const text = shirtText(name, jersey);
  const style = { "--phase": minionPhase(name), height: size, width: full ? size * (100 / 124) : size };

  return (
    <svg
      className={`minion ${full ? "minion-full" : "minion-head"} ${animated ? "is-animated" : ""} ${className}`}
      viewBox={full ? "0 0 100 124" : "24 4 52 52"}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {full && <ellipse cx="50" cy="118" rx="20" ry="3.5" fill="#000" opacity="0.35" />}
      <g className="bob">
        {full && (
          <g className="body">
            {/* whites: trousers and shoes */}
            <rect x="38" y="84" width="10" height="24" rx="3.5" fill={WHITES} />
            <rect x="52" y="84" width="10" height="24" rx="3.5" fill={WHITES} />
            <rect x="32" y="105.5" width="16" height="7.5" rx="3.75" fill={look.shoes} stroke="#000" strokeOpacity="0.15" />
            <rect x="52" y="105.5" width="16" height="7.5" rx="3.75" fill={look.shoes} stroke="#000" strokeOpacity="0.15" />
            <path d="M36 80 h28 v8 h-28 z" fill={WHITES} />
            {/* arms */}
            <g className="arm-l">
              <rect x="23" y="56" width="9" height="21" rx="4.5" fill={KIT} transform="rotate(14 27.5 58)" />
              <circle cx="23.5" cy="77" r="4.2" fill={look.skin} />
            </g>
            <g className="arm-r">
              <rect x="68" y="56" width="9" height="21" rx="4.5" fill={KIT} transform="rotate(-14 72.5 58)" />
              <Prop role={role} />
              <circle cx="76.5" cy="77" r="4.2" fill={look.skin} />
            </g>
            {/* shirt */}
            <path d="M31 63 q0 -9 9 -10 h20 q9 1 9 10 v20 h-38 z" fill={KIT} />
            <path d="M60 53 q9 1 9 10 v20 h-7 v-18 q0 -9 -6 -12 z" fill="#000" opacity="0.18" />
            <path d="M43.5 53 l6.5 7.5 l6.5 -7.5 z" fill={GOLD} />
            <path d="M31 81 h38 v2 h-38 z" fill={GOLD} opacity="0.85" />
            <text x="50" y="77" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize={text.length > 2 ? 10 : 13} fill={GOLD}>
              {text}
            </text>
          </g>
        )}
        <g className="head">
          <rect x="45" y="50" width="10" height="6" fill={look.skin} />
          <circle cx="29" cy="37" r="4.5" fill={look.skin} />
          <circle cx="71" cy="37" r="4.5" fill={look.skin} />
          <circle cx="50" cy="34" r="21" fill={look.skin} />
          {look.beard && <path d="M30 38 q2 18 20 19 q18 -1 20 -19 q-3 11 -20 12 q-17 -1 -20 -12 z" fill={look.hairColor} opacity="0.92" />}
          <circle cx="37.5" cy="42.5" r="3.4" fill="#ff7a7a" opacity="0.22" />
          <circle cx="62.5" cy="42.5" r="3.4" fill="#ff7a7a" opacity="0.22" />
          <Hair look={look} />
          <g stroke={look.hairColor} strokeWidth="2.2" strokeLinecap="round">
            <line x1="38" y1="27.5" x2="46" y2="27.5" transform={`rotate(${look.brow} 42 27.5)`} />
            <line x1="54" y1="27.5" x2="62" y2="27.5" transform={`rotate(${-look.brow} 58 27.5)`} />
          </g>
          <Eyes look={look} />
          <Mouth look={look} />
        </g>
      </g>
    </svg>
  );
}
