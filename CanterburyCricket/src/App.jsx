import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import ClubBackground from "./components/ClubBackground/ClubBackground";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import SeoHead from "./seo/SeoHead";
import EditorialContent from "./seo/EditorialContent";
import { MemberProvider } from "./fantasy/MemberContext";
import RequireMember from "./fantasy/RequireMember";

// Home loads eagerly so the landing page paints instantly.
import Home from "./pages/HomePage";

// Every other page is code-split: its JS only downloads when first visited.
// This shrinks the initial bundle and makes the first load noticeably snappier.
import {
  HistoryPage, OurSquad, Season, Awards, GalleryPage, Sponsors, JoinCricket, MemberLogin,
  Fantasy, FantasyAdmin, FantasyDecide, FantasyVerify, CricketGuidesIndex, CricketGuide,
} from "./routePages";

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
            <Route path="/masonry" element={<GalleryPage />} />
            
            <Route path="/sponsors" element={<Sponsors />} />
            {/* Contact merged into Join (the server also 301s /contact) */}
            <Route path="/contact" element={<Navigate to="/join#get-in-touch" replace />} />
            <Route path="/join" element={<JoinCricket />} />
            <Route path="/member-login" element={<MemberLogin />} />
            <Route path="/fantasy" element={<RequireMember><Fantasy /></RequireMember>} />
            <Route path="/fantasy/admin" element={<RequireMember admin><FantasyAdmin /></RequireMember>} />
            <Route path="/fantasy/decide" element={<FantasyDecide />} />
            <Route path="/fantasy/verify" element={<FantasyVerify />} />
            <Route path="/guides" element={<CricketGuidesIndex />} />
            <Route path="/guides/:slug" element={<CricketGuide />} />
            <Route path="*" element={<main style={{ padding: "14rem 2rem 6rem", color: "#fff", minHeight: "65vh" }}><h1>Page not found</h1><p>That cricket club page could not be found.</p></main>} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <MemberProvider>
      <ScrollToTop />
      <SeoHead />
      {/* ✅ Global animated background for all pages */}
      <ClubBackground />

      {/* Navbar is visible on all pages */}
      <Navbar />

      {/* Page routing (code-split + smooth transitions) */}
      <AnimatedRoutes />

      <EditorialContent />

      {/* ✅ Footer appears on ALL pages */}
      <Footer />
      </MemberProvider>
    </Router>
  );
}