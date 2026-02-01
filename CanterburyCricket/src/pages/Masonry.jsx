import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import "./Masonry.css";

/**
 * Auto-import all images from: src/assets/Masonry
 * (Masonry.jsx is in src/pages, so path is ../assets/...)
 */
const masonryImages = import.meta.glob(
  "../assets/Masonry/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default" }
);

// Stable, sorted list of image URLs
const AUTO_URLS = Object.entries(masonryImages)
  .map(([path, url]) => {
    const fileName = path.split("/").pop() || path;
    return { path, fileName, url };
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
      // If something fails, fall back to a safe ratio (4:3)
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
  items, // optional override
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.96,
  blurToFocus = true,
  colorShiftOnHover = false,

  // Tuning controls (feel free to tweak)
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

  // The “real” masonry items we render (with measured ratios)
  const [measuredItems, setMeasuredItems] = useState([]);

  const hasMounted = useRef(false);

  const finalSource = items?.length
    ? items.map((it, idx) => ({
        id: it.id ?? `masonry-custom-${idx}`,
        img: it.img,
        url: it.url ?? it.img
      }))
    : AUTO_URLS.map((it, idx) => ({
        id: `masonry-${idx}`,
        img: it.url,
        url: it.url
      }));

  // Measure image aspect ratios once
  useEffect(() => {
    let cancelled = false;
    setImagesReady(false);

    Promise.all(finalSource.map((it) => loadImageMeta(it.img))).then((metas) => {
      if (cancelled) return;

      const next = finalSource.map((it) => {
        const meta = metas.find((m) => m.src === it.img);
        const ratio = meta?.ratio ?? 0.75; // fallback
        return {
          ...it,
          ratio // h / w
        };
      });

      setMeasuredItems(next);
      setImagesReady(true);
      hasMounted.current = false; // treat as fresh mount on new set
    });

    return () => {
      cancelled = true;
    };
  }, [items]); // only re-measure when user passes a new items array

  const getInitialPosition = useCallback(
    (item) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return { x: item.x, y: item.y };

      let direction = animateFrom;

      if (animateFrom === "random") {
        const directions = ["top", "bottom", "left", "right"];
        direction = directions[Math.floor(Math.random() * directions.length)];
      }

      switch (direction) {
        case "top":
          return { x: item.x, y: -200 };
        case "bottom":
          return { x: item.x, y: window.innerHeight + 200 };
        case "left":
          return { x: -200, y: item.y };
        case "right":
          return { x: window.innerWidth + 200, y: item.y };
        case "center":
          return {
            x: containerRect.width / 2 - item.w / 2,
            y: containerRect.height / 2 - item.h / 2
          };
        default:
          return { x: item.x, y: item.y + 100 };
      }
    },
    [animateFrom, containerRef]
  );

  /**
   * Build masonry grid based on real aspect ratios.
   * height = columnWidth * ratio
   * then clamp so portraits don't become skyscrapers.
   */
  const { grid, totalHeight } = useMemo(() => {
    if (!width || !imagesReady || measuredItems.length === 0) return { grid: [], totalHeight: 0 };

    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;

    const positioned = measuredItems.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;

      // ratio is (h/w). For portrait images ratio > 1.
      let h = columnWidth * (child.ratio ?? 0.75);

      // Clamp for nicer visual rhythm
      h = Math.max(minTileH, Math.min(maxTileH, h));

      const y = colHeights[col];
      colHeights[col] += h;

      return { ...child, x, y, w: columnWidth, h };
    });

    const maxH = Math.max(...colHeights, 0);
    return { grid: positioned, totalHeight: maxH };
  }, [width, imagesReady, measuredItems, columns, minTileH, maxTileH]);

  // Animate positions
  useLayoutEffect(() => {
    if (!imagesReady || grid.length === 0) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animationProps = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        const initialPos = getInitialPosition(item);
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h,
          ...(blurToFocus && { filter: "blur(10px)" })
        };

        gsap.fromTo(selector, initialState, {
          opacity: 1,
          ...animationProps,
          ...(blurToFocus && { filter: "blur(0px)" }),
          duration: 0.8,
          ease: "power3.out",
          delay: index * stagger
        });
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration,
          ease,
          overwrite: "auto"
        });
      }
    });

    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, stagger, blurToFocus, duration, ease, getInitialPosition]);

  const handleMouseEnter = (e, item) => {
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, { scale: hoverScale, duration: 0.25, ease: "power2.out" });
    }

    if (colorShiftOnHover) {
      const overlay = e.currentTarget.querySelector(".color-overlay");
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.25 });
    }
  };

  const handleMouseLeave = (e, item) => {
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, { scale: 1, duration: 0.25, ease: "power2.out" });
    }

    if (colorShiftOnHover) {
      const overlay = e.currentTarget.querySelector(".color-overlay");
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.25 });
    }
  };

  const onKeyDown = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      item.url && window.open(item.url, "_blank", "noopener");
    }
  };

  return (
    <div
      ref={containerRef}
      className="list"
      // ✅ critical: real height so footer never overlaps
      style={{ height: totalHeight }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="item-wrapper"
          onClick={() => item.url && window.open(item.url, "_blank", "noopener")}
          onKeyDown={(e) => onKeyDown(e, item)}
          onMouseEnter={(e) => handleMouseEnter(e, item)}
          onMouseLeave={(e) => handleMouseLeave(e, item)}
          role="button"
          tabIndex={0}
          aria-label="Open photo"
        >
          <div className="item-img" style={{ backgroundImage: `url(${item.img})` }}>
            {colorShiftOnHover && (
              <div
                className="color-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5))",
                  opacity: 0,
                  pointerEvents: "none",
                  borderRadius: "inherit"
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
