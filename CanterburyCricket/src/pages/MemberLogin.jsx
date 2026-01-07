import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import "./MemberLogin.css";

export default function MemberLogin() {
  const prefersReducedMotion = useReducedMotion();
const navigate = useNavigate(); // ✅ THIS LINE WAS MISSING
  return (
    <div className="future-wrap">
      <div className="future-bg" aria-hidden="true">
        <div className="grid" />
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="orb orb1"
              animate={{ x: [0, 50, 0], y: [0, -25, 0], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="orb orb2"
              animate={{ x: [0, -60, 0], y: [0, 30, 0], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="scanline"
              animate={{ y: ["-40%", "120%"] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
      </div>

      <motion.div
        className="future-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1
          className="future-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          Member Login
        </motion.h1>

        <motion.p
          className="future-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          🚀 Future Project — secure member portal coming soon.
        </motion.p>

        <div className="future-actions">
          <button className="future-primary" type="button">
            Notify Me
          </button>
          <button
  className="future-secondary"
  type="button"
  onClick={() => navigate("/")}
>
  Back
</button>

        </div>
      </motion.div>
    </div>
  );
}
