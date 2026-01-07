// src/components/contact/GetInTouch.jsx
import { useState } from "react";
import "./GetInTouch.css";

export default function GetInTouch() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    const form = e.currentTarget;
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      profile: form.profile.value.trim(),
      message: form.message.value.trim(),
      // Honeypot: bots often fill hidden fields
      website: form.website.value.trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setStatus({ type: "success", message: "Message sent! We’ll reply soon 🙌" });
      form.reset();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="get-in-touch">
      <div className="get-in-touch-inner">
        <h2>Get in Touch</h2>
        <p>Drop us a message and we’ll get back to you 🏏</p>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" placeholder="Your name" required maxLength={80} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="you@email.com" required maxLength={120} />
          </div>

          <div className="form-group">
            <label htmlFor="profile">Cricheroes / CricClub Profile</label>
            <input id="profile" name="profile" type="url" placeholder="https://cricheroes.com/player/..." maxLength={300} />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" placeholder="Tell us how we can help..." required maxLength={2000} />
          </div>

          {/* ✅ Honeypot (hidden field) */}
          <input
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
            aria-hidden="true"
          />

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Sending..." : "Submit Message"}
          </button>

          {status.message && (
            <p style={{ marginTop: 10, fontSize: "0.9rem" }}>
              {status.type === "success" ? "✅ " : "⚠️ "}
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
