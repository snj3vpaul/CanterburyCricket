import { useMemo, useState } from "react";
import "./GetInTouch.css";

/* =========================
   Email validation (practical + strict)
   - blocks obvious provider typos like gmail.chh, gmail.con, etc.
========================= */
function isValidEmailStrict(input) {
  const email = String(input || "").trim();

  if (!email) return false;
  if (email.length > 254) return false;
  if (email.includes(" ")) return false;

  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();

  if (!local || local.length > 64) return false;
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;

  const labels = domain.split(".");
  if (labels.some((l) => !l.length)) return false;
  if (labels.some((l) => l.startsWith("-") || l.endsWith("-"))) return false;

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;

  // overall character sanity (not full RFC, but solid for web forms)
  const re =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  if (!re.test(email)) return false;

  // Provider typo blocking (high impact)
  const providerAllowlist = [
    { base: "gmail", allowed: ["gmail.com"] },
    { base: "yahoo", allowed: ["yahoo.com", "yahoo.ca"] },
    { base: "outlook", allowed: ["outlook.com"] },
    { base: "hotmail", allowed: ["hotmail.com"] },
    { base: "live", allowed: ["live.com"] },
    { base: "icloud", allowed: ["icloud.com"] },
  ];
  for (const p of providerAllowlist) {
    if (domain === p.base || domain.startsWith(p.base + ".")) {
      return p.allowed.includes(domain);
    }
  }

  // Optional: block ultra-common typo TLDs globally
  const blockedTlds = new Set(["con", "cmo", "comm", "cim", "vom", "chh"]);
  if (blockedTlds.has(tld)) return false;

  return true;
}

export default function GetInTouch() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [errors, setErrors] = useState({});

  // timestamp used as a bot-signal (server will check too)
  const startedAt = useMemo(() => Date.now(), []);

  const validateField = (name, value) => {
    const v = String(value ?? "");
    if (name === "name") {
      if (!v.trim()) return "Full name is required.";
      if (v.trim().length < 2) return "Full name is too short.";
      if (v.trim().length > 80) return "Full name is too long.";
      return "";
    }

    if (name === "email") {
      if (!v.trim()) return "Email address is required.";
      if (!isValidEmailStrict(v)) return "Please enter a valid email address.";
      if (v.trim().length > 120) return "Email is too long.";
      return "";
    }

    if (name === "message") {
      if (v.trim().length < 5) return "Message must be at least 5 characters long.";
      if (v.trim().length > 2000) return "Message is too long.";
      return "";
    }

    if (name === "profile") {
      const trimmed = v.trim();
      if (!trimmed) return "";
      if (trimmed.length > 300) return "Profile link is too long.";
      try {
        const u = new URL(trimmed);
        if (!/^https?:$/.test(u.protocol)) return "Profile must be http(s).";
      } catch {
        return "Please enter a valid URL.";
      }
      return "";
    }

    return "";
  };

  const validateForm = (form) => {
    const newErrors = {};

    const nameErr = validateField("name", form.name.value);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateField("email", form.email.value);
    if (emailErr) newErrors.email = emailErr;

    const msgErr = validateField("message", form.message.value);
    if (msgErr) newErrors.message = msgErr;

    const profileErr = validateField("profile", form.profile.value);
    if (profileErr) newErrors.profile = profileErr;

    return newErrors;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const form = e.currentTarget;
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: "error",
        message: "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    setLoading(true);

    // Only send what the server expects (tight payload)
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      profile: form.profile.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value.trim(), // honeypot
      startedAt, // bot-signal
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setStatus({
        type: "success",
        message: "Message sent successfully! We’ll get back to you soon 🙌",
      });
      setErrors({});
      form.reset();
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err.message ||
          "Something went wrong while sending your message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="get-in-touch">
      <div className="get-in-touch-inner">
        <h2>Get in Touch</h2>
        <p>Drop us a message and we’ll get back to you ✍🏼</p>

        <form onSubmit={handleSubmit} className="contact-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" onBlur={handleBlur} />
            {errors.name && <span className="field-error">⚠️ {errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              onBlur={handleBlur}
            />
            {errors.email && <span className="field-error">⚠️ {errors.email}</span>}
          </div>

          {/* Profile */}
          <div className="form-group">
            <label htmlFor="profile">Cricheroes / CricClub Profile</label>
            <input
              id="profile"
              name="profile"
              type="url"
              inputMode="url"
              placeholder="https://cricheroes.com/player/..."
              onBlur={handleBlur}
            />
            {errors.profile && (
              <span className="field-error">⚠️ {errors.profile}</span>
            )}
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" onBlur={handleBlur} />
            {errors.message && (
              <span className="field-error">⚠️ {errors.message}</span>
            )}
          </div>

          {/* Honeypot */}
          <input
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px" }}
          />

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Sending..." : "Submit Message"}
          </button>

          {/* Global Status */}
          {status.message && (
            <div
              className={`form-status ${
                status.type === "success" ? "success" : "error"
              }`}
            >
              {status.type === "success" ? "✅" : "⚠️"} {status.message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
