import { useEffect, useRef, useState } from "react";
import DIMENSIONS from "../assets/gallery/dimensions.json";
import "./GalleryPage.css";

// Gallery: thumbs (420px wide WebP) in the grid, previews (1600px WebP) in the lightbox.
// Layout is pure CSS columns, so nothing waits for JavaScript or for every photo to download:
// each tile reserves its space from dimensions.json and the browser lazy-loads photos as you scroll.
// New photo? Add the same file name to thumbs/ and previews/ (and ideally its size to dimensions.json).
const thumbs = import.meta.glob("../assets/gallery/thumbs/*.{webp,avif,jpg,jpeg,png}", { eager: true, import: "default" });
const previews = import.meta.glob("../assets/gallery/previews/*.{webp,avif,jpg,jpeg,png}", { eager: true, import: "default" });

const baseName = (path) => path.split("/").pop().replace(/\.[a-z]+$/i, "");
const thumbByName = Object.fromEntries(Object.entries(thumbs).map(([p, url]) => [baseName(p), url]));

const PHOTOS = Object.entries(previews)
  .map(([path, preview]) => {
    const id = baseName(path);
    const [w, h] = DIMENSIONS[id] ?? [420, 280];
    return { id, preview, thumb: thumbByName[id] ?? preview, w, h };
  })
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((photo, i, all) => ({ ...photo, alt: `Canterbury Cricket Club photo ${i + 1} of ${all.length}` }));

const EAGER = 4; // first row loads straight away; the rest wait until they are near the screen

// Fade each tile up as it scrolls into view (skipped for reduced-motion users via CSS).
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    root.classList.add("gallery--reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    root.querySelectorAll(".gallery__tile").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function GalleryPage() {
  const gridRef = useReveal();
  const [active, setActive] = useState(null); // index of the open photo, or null
  const closeBtn = useRef(null);
  const lastTile = useRef(null);
  const touchX = useRef(null);

  const open = (i, el) => { lastTile.current = el; setActive(i); };
  const close = () => { setActive(null); lastTile.current?.focus(); };
  const step = (d) => setActive((i) => (i + d + PHOTOS.length) % PHOTOS.length);
  const isOpen = active !== null;

  // While the viewer is open: keyboard controls, focus on Close, no page scrolling behind it.
  useEffect(() => {
    if (!isOpen) return;
    closeBtn.current?.focus();
    const move = (d) => setActive((i) => (i + d + PHOTOS.length) % PHOTOS.length);
    const onKey = (e) => {
      if (e.key === "Escape") { setActive(null); lastTile.current?.focus(); }
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [isOpen]);

  // Warm up the neighbouring photos so next/previous feel instant.
  useEffect(() => {
    if (active === null) return;
    [1, -1].forEach((d) => { new Image().src = PHOTOS[(active + d + PHOTOS.length) % PHOTOS.length].preview; });
  }, [active]);

  const photo = active === null ? null : PHOTOS[active];

  return (
    <main className="gallery">
      <header className="gallery__header">
        <p className="gallery__eyebrow">CANTERBURY CRICKET CLUB · OTTAWA</p>
        <h1>Club photo gallery</h1>
        <p>Matches, awards nights and the people behind the club. Tap a photo to view it full size.</p>
      </header>

      <ul ref={gridRef} className="gallery__grid">
        {PHOTOS.map((p, i) => (
          <li key={p.id} className="gallery__tile">
            <button type="button" onClick={(e) => open(i, e.currentTarget)} aria-label={`Open ${p.alt}`}>
              <img
                src={p.thumb}
                alt={p.alt}
                width={p.w}
                height={p.h}
                loading={i < EAGER ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                decoding="async"
              />
            </button>
          </li>
        ))}
      </ul>

      {photo && (
        <div className="mModal" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="mBackdrop" onClick={close} />
          <div className="mPanel">
            <div className="mTopbar">
              <div className="mCount">{active + 1} / {PHOTOS.length}</div>
              <div className="mActions">
                <a className="mBtn" href={photo.preview} download={`canterbury-${photo.id}.webp`}>Download</a>
                <button ref={closeBtn} className="mBtn mBtnGhost" onClick={close}>Close</button>
              </div>
            </div>
            <div
              className="mStage"
              onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
                if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              }}
            >
              <button className="mNav mNavLeft" onClick={() => step(-1)} aria-label="Previous photo">‹</button>
              <img className="mFull" src={photo.preview} alt={photo.alt} />
              <button className="mNav mNavRight" onClick={() => step(1)} aria-label="Next photo">›</button>
            </div>
            <div className="mFooter"><div className="mHint">Swipe or use the arrows to browse.</div></div>
          </div>
        </div>
      )}
    </main>
  );
}
