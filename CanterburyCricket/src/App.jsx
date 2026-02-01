import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ClubBackground from "./components/background/ClubBackground";
import Navbar from "./components/Navbars/Navbar1";
import Footer from "./components/Footer/Footer";
import Home from "./pages/home";
import Sponsors from "./pages/Sponsors";
import Awards from "./pages/Awards";
import Masonry from "./pages/Masonry";



import Season from "./pages/Season";
import Contact from "./pages/Contact";
import MemberLogin from "./pages/MemberLogin";
import OurSquad from "./pages/OurSquad";
import HistoryPage from "./pages/History/HistoryPage";
export default function App() {
  return (
    <Router>
      <ScrollToTop/>
      {/* ✅ Global animated background for all pages */}
      <ClubBackground />

      {/* Navbar is visible on all pages */}
      <Navbar />

      {/* Page routing */}
      <Routes>
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
      {/* ✅ Footer appears on ALL pages */}
      <Footer />
    </Router>
  );
}
