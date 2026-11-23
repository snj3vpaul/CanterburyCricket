/**
 * Code-split pages. Each page's JS downloads only when first visited, and
 * main.jsx preloads the current page before the first render.
 */
import { createElement, lazy } from "react";

// A code-split page that can be loaded ahead of time. Once loaded it renders
// synchronously, so the first paint after prerendered HTML is the full page
// (no loader flash, no footer jumping down when the chunk arrives).
function lazyPage(load) {
  let Loaded = null;
  const loadOnce = () => load().then((m) => { Loaded = m.default; return m; });
  const Lazy = lazy(loadOnce);
  function Page(props) {
    return createElement(Loaded ?? Lazy, props);
  }
  Page.preload = loadOnce;
  return Page;
}

export const HistoryPage = lazyPage(() => import("./pages/History/HistoryPage"));
export const OurSquad = lazyPage(() => import("./pages/OurSquad"));
export const Season = lazyPage(() => import("./pages/Season"));
export const Awards = lazyPage(() => import("./pages/Awards"));
export const GalleryPage = lazyPage(() => import("./pages/GalleryPage"));
export const Sponsors = lazyPage(() => import("./pages/Sponsors"));
export const JoinCricket = lazyPage(() => import("./pages/JoinCricket"));
export const MemberLogin = lazyPage(() => import("./pages/MemberLogin"));
export const Fantasy = lazyPage(() => import("./pages/Fantasy"));
export const FantasyAdmin = lazyPage(() => import("./pages/FantasyAdmin"));
export const FantasyDecide = lazyPage(() => import("./pages/FantasyDecide")); // Approve/Reject links in admin emails
export const FantasyVerify = lazyPage(() => import("./pages/FantasyVerify")); // confirm-your-email links
export const CricketGuidesIndex = lazyPage(() => import("./pages/CricketGuides").then((m) => ({ default: m.CricketGuidesIndex })));
export const CricketGuide = lazyPage(() => import("./pages/CricketGuides").then((m) => ({ default: m.CricketGuide })));

const PRELOAD = {
  "/history": HistoryPage, "/squad": OurSquad, "/season": Season, "/awards": Awards,
  "/masonry": GalleryPage, "/sponsors": Sponsors, "/join": JoinCricket, "/member-login": MemberLogin,
  "/fantasy": Fantasy, "/fantasy/admin": FantasyAdmin, "/fantasy/decide": FantasyDecide,
  "/fantasy/verify": FantasyVerify, "/guides": CricketGuidesIndex,
};

/** Load the current page's code before the first render (main.jsx awaits this). */
export function preloadRoute(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = PRELOAD[path] ?? (path.startsWith("/guides/") ? CricketGuide : null);
  return page ? page.preload().catch(() => {}) : Promise.resolve();
}
