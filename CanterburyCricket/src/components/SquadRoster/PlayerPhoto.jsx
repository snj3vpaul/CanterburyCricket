import { useState } from "react";
import { initials } from "./squadPlayers";

// Player photo with graceful fallbacks: resized copy -> original file -> monogram.
export default function PlayerPhoto({ src, fallback, name, className, monogramClass, loading = "lazy" }) {
  const [stage, setStage] = useState(src ? 0 : 2);
  const url = stage === 0 ? src : stage === 1 ? fallback : "";

  if (!url) {
    return (
      <span className={`${className} ${monogramClass}`} role="img" aria-label={name}>
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      className={className}
      src={url}
      alt={name}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setStage((s) => (s === 0 && fallback && fallback !== src ? 1 : 2))}
    />
  );
}
