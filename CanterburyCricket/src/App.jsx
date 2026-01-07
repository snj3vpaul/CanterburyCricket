import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ClubBackground from "./components/background/ClubBackground";
import Navbar from "./components/Navbars/Navbar1";

import Home from "./pages/home";
import Sponsors from "./pages/Sponsors";
import Awards from "./pages/Awards";
import Season from "./pages/Season";
import Contact from "./pages/Contact";
import MemberLogin from "./pages/MemberLogin";

export default function App() {
  return (
    <Router>
      {/* ✅ Global animated background for all pages */}
      <ClubBackground />

      {/* Navbar is visible on all pages */}
      <Navbar />

      {/* Page routing */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/season" element={<Season />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/member-login" element={<MemberLogin />} />
      </Routes>
    </Router>
  );
}
