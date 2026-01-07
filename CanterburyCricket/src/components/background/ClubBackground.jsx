import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./ClubBackground.css";

export default function ClubBackground({ intensity = 1 }) {
  const reduce = useReducedMotion();

  // If user prefers reduced motion, render static background only
  if (reduce) {
    return <div className="club-bg" aria-hidden="true" data-static="true" />;
  }

  return (
    <div className="club-bg" aria-hidden="true">
      {/* Soft gradient base */}
      <div className="club-bg-base" />

      {/* Animated orbs (brand-inspired colors) */}
      <motion.div
        className="club-orb orb-indigo"
        animate={{ x: [0, 60 * intensity, 0], y: [0, -30 * intensity, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="club-orb orb-gold"
        animate={{ x: [0, -70 * intensity, 0], y: [0, 40 * intensity, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="club-orb orb-red"
        animate={{ x: [0, 45 * intensity, 0], y: [0, 35 * intensity, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Light streak sweep */}
      <motion.div
        className="club-sweep"
        animate={{ x: ["-35%", "120%"] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "linear" }}
      />

      {/* Subtle rotating “crest ring” abstraction */}
      <motion.div
        className="club-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />

      {/* Grain overlay for premium texture */}
      <div className="club-grain" />
    </div>
  );
}
