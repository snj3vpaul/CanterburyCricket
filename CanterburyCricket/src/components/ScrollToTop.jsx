// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there is a hash, scroll to that element (with a small delay for render)
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          // fallback if element not found yet
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      return;
    }

    // Otherwise behave like normal ScrollToTop
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
}
