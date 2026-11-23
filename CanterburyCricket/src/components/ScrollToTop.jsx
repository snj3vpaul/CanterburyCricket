// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there is a hash, scroll to that element (with a small delay for render)
    if (hash) {
      // Pages load lazily, so the target may appear a moment later: keep looking for up to ~2 s.
      let tries = 0, timer;
      const find = () => {
        const el = document.querySelector(hash);
        if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (++tries < 40) timer = setTimeout(find, 50);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      };
      find();
      return () => clearTimeout(timer);
    }

    // Otherwise behave like normal ScrollToTop
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
}
