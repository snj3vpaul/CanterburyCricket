/**
 * A simple Canterbury shirt: navy with a gold collar and trim, the player's jersey
 * number on the front (their initial if the squad sheet has no number).
 * The captain's shirt is gold with a navy number. Decorative: the name is always shown next to it.
 */
export default function Jersey({ name, jersey, captain = false, size = 40, className = "" }) {
  const j = String(jersey ?? "").trim();
  const text = /^\d{1,3}$/.test(j) ? j : (String(name ?? "?").trim().charAt(0) || "?").toUpperCase();
  const body = captain ? "#f7b500" : "#0f1a33";
  const trim = captain ? "#0f1a33" : "#f7b500";

  return (
    <svg className={`fx-jersey ${className}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path
        d="M17 5 L9 8 L2 17 L8 22 L12 18 L12 44 L36 44 L36 18 L40 22 L46 17 L39 8 L31 5 Q24 11 17 5 Z"
        fill={body}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M17 5 Q24 11 31 5 L29 4.5 Q24 8.5 19 4.5 Z" fill={trim} />
      <path d="M2 17 L8 22 M46 17 L40 22" stroke={trim} strokeWidth="2" strokeLinecap="round" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize={text.length > 2 ? 11 : 14}
        fill={trim}
      >
        {text}
      </text>
    </svg>
  );
}
