import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import "./Masonry.css";

/**
 * HYBRID LOCAL SETUP
 * - originals: src/assets/Masonry/originals (your current big photos)
 * - thumbs:    src/assets/Masonry/thumbs    (small webp for fast grid)
 * - previews:  src/assets/Masonry/previews  (medium webp for lightbox viewing)
 *
 * If thumbs/previews don’t exist yet, it will gracefully fallback to originals.
 */

// Originals (required)
const originals = import.meta.glob(
  "../assets/Masonry/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default" }
);

// Optional thumbs/previews if you create these folders
const thumbs = import.meta.glob(
  "../assets/Masonry/thumbs/**/*.{webp,avif,jpg,jpeg,png,WEBP,AVIF,JPG,JPEG,PNG}",
  { eager: true, import: "default" }
);

const previews = import.meta.glob(
  "../assets/Masonry/previews/**/*.{webp,avif,jpg,jpeg,png,WEBP,AVIF,JPG,JPEG,PNG}",
  { eager: true, import: "default" }
);

const toFileName = (path) => path.split("/").pop() || path;

/**
 * Build a stable list from originals, and match thumb/preview by same filename (recommended).
 * e.g. originals/A01.jpg -> thumbs/A01.webp -> previews/A01.webp
 */
const AUTO_ITEMS = Object.entries(originals)
  .map(([path, url]) => {
    const fileName = toFileName(path);
    const baseName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, ""); // name without ext

    // Find matching thumb/preview by base name (works if you keep names consistent)
    const thumbEntry = Object.entries(thumbs).find(([p]) => toFileName(p).startsWith(baseName));
    const previewEntry = Object.entries(previews).find(([p]) => toFileName(p).startsWith(baseName));

    const thumbUrl = thumbEntry?.[1] ?? url;     // fallback to original
    const previewUrl = previewEntry?.[1] ?? url; // fallback to original

    return {
      id: baseName,
      fileName,
      alt: baseName,
      thumb: thumbUrl,
      preview: previewUrl,
      full: url // original download
    };
  })
  .sort((a, b) => a.fileName.localeCompare(b.fileName));

/* =========================
   Hooks
========================= */

const useMedia = (queries, values, defaultValue) => {
  const get = () => values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;
  const [value, setValue] = useState(get);

  useEffect(() => {
    const handler = () => setValue(get);
    const mqs = queries.map((q) => matchMedia(q));
    mqs.forEach((mq) => mq.addEventListener("change", handler));
    return () => mqs.forEach((mq) => mq.removeEventListener("change", handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

const useMeasure = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
};

const loadImageMeta = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;

    const done = () => {
      const w = img.naturalWidth || 1200;
      const h = img.naturalHeight || 900;
      resolve({ src, w, h, ratio: h / w });
    };

    img.onload = done;
    img.onerror = done;
  });

/* =========================
   Component
========================= */

export default function Masonry({
  items, // optional override [{id, thumb, preview, full, filename, alt}]
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.03,
  minTileH = 180,
  maxTileH = 560
}) {
  const columns = useMedia(
    ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"],
    [5, 4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);
  const [measuredItems, setMeasuredItems] = useState([]);
  const hasMounted = useRef(false);

  // Lightbox
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const finalSource = useMemo(() => {
    if (items?.length) {
      return items.map((it, idx) => ({
        id: it.id ?? `custom-${idx}`,
        thumb: it.thumb ?? it.img ?? it.full,
        preview: it.preview ?? it.thumb ?? it.img ?? it.full,
        full: it.full ?? it.preview ?? it.thumb,
        filename: it.filename ?? `photo-${idx + 1}.jpg`,
        alt: it.alt ?? `Photo ${idx + 1}`
      }));
    }
    return AUTO_ITEMS.map((it) => ({
      id: it.id,
      thumb: it.thumb,
      preview: it.preview,
      full: it.full,
      filename: it.fileName,
      alt: it.alt
    }));
  }, [items]);

  // Measure aspect ratios based on THUMB (fastest) or PREVIEW fallback
  useEffect(() => {
    let cancelled = false;
    setImagesReady(false);

    const measureSrc = finalSource.map((it) => it.thumb || it.preview || it.full);

    Promise.all(measureSrc.map((src) => loadImageMeta(src))).then((metas) => {
      if (cancelled) return;

      const next = finalSource.map((it) => {
        const src = it.thumb || it.preview || it.full;
        const meta = metas.find((m) => m.src === src);
        return { ...it, ratio: meta?.ratio ?? 0.75 };
      });

      setMeasuredItems(next);
      setImagesReady(true);
      hasMounted.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [finalSource]);

  const { grid, totalHeight } = useMemo(() => {
  if (!width || !imagesReady || measuredItems.length === 0) return { grid: [], totalHeight: 0 };

  const gap = 16; // 👈 spacing between tiles (matches visual)
  const colHeights = new Array(columns).fill(0);

  // ✅ account for gaps between columns
  const columnWidth = (width - gap * (columns - 1)) / columns;

  const positioned = measuredItems.map((child) => {
    const col = colHeights.indexOf(Math.min(...colHeights));
    const x = (columnWidth + gap) * col;

    let h = columnWidth * (child.ratio ?? 0.75);
    h = Math.max(minTileH, Math.min(maxTileH, h));

    const y = colHeights[col];
    colHeights[col] += h + gap; // ✅ account for vertical gap

    return { ...child, x, y, w: columnWidth, h };
  });

  const maxH = Math.max(...colHeights, 0);
  return { grid: positioned, totalHeight: Math.max(0, maxH - gap) };
}, [width, imagesReady, measuredItems, columns, minTileH, maxTileH]);

  // Animate positions
  useLayoutEffect(() => {
    if (!imagesReady || grid.length === 0) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animationProps = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        gsap.fromTo(
          selector,
          { opacity: 0, x: item.x, y: item.y + 30, width: item.w, height: item.h, filter: "blur(10px)" },
          {
            opacity: 1,
            ...animationProps,
            filter: "blur(0px)",
            duration: 0.7,
            ease: "power3.out",
            delay: index * stagger
          }
        );
      } else {
        gsap.to(selector, { ...animationProps, duration, ease, overwrite: "auto" });
      }
    });

    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, stagger, duration, ease]);

  const openAt = useCallback((idx) => {
    setActiveIndex(idx);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + grid.length) % grid.length), [grid.length]);
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % grid.length), [grid.length]);

  const active = grid[activeIndex];

  // Keyboard controls when modal open
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  const downloadActive = useCallback(() => {
    if (!active?.full) return;
    const a = document.createElement("a");
    a.href = active.full;
    a.download = active.filename || "photo.jpg";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [active]);

  const onKeyDown = (e, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(idx);
    }
  };

  return (
    <>
      <div ref={containerRef} className="list" style={{ height: totalHeight }}>
        {grid.map((item, idx) => (
          <div
            key={item.id}
            data-key={item.id}
            className="item-wrapper"
            onClick={() => openAt(idx)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            role="button"
            tabIndex={0}
            aria-label="Open photo"
          >
            {/* CHANGED: use <img> for true lazy-loading */}
            <img className="item-img" src={item.thumb} alt={item.alt} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {open && active && (
        <div className="mModal" role="dialog" aria-modal="true">
          <div className="mBackdrop" onClick={close} />

          <div className="mPanel">
            <div className="mTopbar">
              <div className="mCount">
                {activeIndex + 1} / {grid.length}
              </div>

              <div className="mActions">
                <button className="mBtn" onClick={downloadActive}>
                  Download
                </button>
                <button className="mBtn mBtnGhost" onClick={close}>
                  Close
                </button>
              </div>
            </div>

            <div className="mStage">
              <button className="mNav mNavLeft" onClick={prev} aria-label="Previous photo">
                ‹
              </button>

              {/* Use preview (medium) for viewing. Falls back to thumb/original. */}
              <img className="mFull" src={active.preview || active.thumb || active.full} alt={active.alt} />

              <button className="mNav mNavRight" onClick={next} aria-label="Next photo">
                ›
              </button>
            </div>

            <div className="mFooter">
              <div className="mCaption">{active.alt}</div>
              <div className="mHint">Tip: Download grabs the original file.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
