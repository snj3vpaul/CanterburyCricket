import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import ClubBackground from "./components/background/ClubBackground";
import Navbar from "./components/Navbars/Navbar1";
import Footer from "./components/Footer/Footer";

// Home loads eagerly so the landing page paints instantly.
import Home from "./pages/home";

// Every other page is code-split: its JS only downloads when first visited.
// This shrinks the initial bundle and makes the first load noticeably snappier.
const HistoryPage = lazy(() => import("./pages/History/HistoryPage"));
const OurSquad = lazy(() => import("./pages/OurSquad"));
const Season = lazy(() => import("./pages/Season"));
const Awards = lazy(() => import("./pages/Awards"));
const Masonry = lazy(() => import("./pages/Masonry"));
//const Reels = lazy(() => import("./pages/Reels")); // ← if Reels was deleted, remove this line + its <Route> below
const Sponsors = lazy(() => import("./pages/Sponsors"));
const Contact = lazy(() => import("./pages/Contact"));
const MemberLogin = lazy(() => import("./pages/MemberLogin"));

// Lightweight branded loader shown while a split chunk loads.
function PageLoader() {
  return (
    <div className="pageLoader" aria-busy="true" aria-label="Loading">
      <span className="pageLoaderDot" />
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/squad" element={<OurSquad />} />
            <Route path="/season" element={<Season />} />
            <Route path="/awards" element={<Awards />} />
            <Route path="/masonry" element={<Masonry />} />
            
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/member-login" element={<MemberLogin />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* ✅ Global animated background for all pages */}
      <ClubBackground />

      {/* Navbar is visible on all pages */}
      <Navbar />

      {/* Page routing (code-split + smooth transitions) */}
      <AnimatedRoutes />

      {/* ✅ Footer appears on ALL pages */}
      <Footer />
    </Router>
  );
}