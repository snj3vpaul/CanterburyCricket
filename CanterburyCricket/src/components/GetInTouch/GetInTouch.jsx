import { useMemo, useState } from "react";
import "./GetInTouch.css";

/* =========================
   Provider typo-squat detection
   - Blocks near-miss domains like ggmail.com / gmaill.com / gmial.com
   - Low false positives by only applying to common providers
========================= */
const COMMON_PROVIDER_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.ca",
  "icloud.com",
];

function levenshtein(a, b) {
  a = String(a || "");
  b = String(b || "");
  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // delete
        dp[i][j - 1] + 1, // insert
        dp[i - 1][j - 1] + cost // replace
      );
    }
  }
  return dp[m][n];
}

function detectProviderTypo(domain) {
  const d = String(domain || "").toLowerCase();

  // Only run near-match checks for typical provider TLDs to avoid false positives
  if (!/\.(com|ca)$/.test(d)) return null;

  for (const good of COMMON_PROVIDER_DOMAINS) {
    if (d === good) continue;

    // distance <= 2 catches ggmail.com (extra g), gmial.com (swap), gmaill.com (extra l)
    const dist = levenshtein(d, good);
    if (dist <= 2) return good;
  }

  return null;
}

/* =========================
   Email validation (practical + strict)
   - Syntax validation
   - Blocks common provider typos (gmail.??)
   - Blocks typo-squat near-misses (ggmail.com)
   - Still not "deliverability" (DNS) — server should do that.
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

  const re =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  if (!re.test(email)) return false;

  // Provider "base" blocking (gmail.* -> must be gmail.com)
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

  // Typo-squat near matches (ggmail.com etc.)
  const suggestion = detectProviderTypo(domain);
  if (suggestion) return false;

  // Optional: block ultra-common typo TLDs
  const blockedTlds = new Set(["con", "cmo", "comm", "cim", "vom", "chh"]);
  if (blockedTlds.has(tld)) return false;

  return true;
}

function isHttpUrl(value) {
  const v = String(value || "").trim();
  if (!v) return true; // optional
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
// ✅ Add these helpers near the top (above GetInTouch)

function collapseSpaces(raw) {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

// Only alphabets + single spaces between words
function isValidFullName(raw) {
  const v = collapseSpaces(raw);
  if (!v) return { ok: false, value: v, error: "Full name is required." };
  if (v.length < 2) return { ok: false, value: v, error: "Name is too short." };
  if (v.length > 80) return { ok: false, value: v, error: "Name is too long." };

  // ✅ STRICT: A-Z letters only + single spaces between words
  // Allows: "Sanjeev", "Sanjeev Paul", "Sanjeev K Paul"
  // Blocks: "Sanj222v", "Sanjeev.Paul", "Sanjeev, Paul", "<script> paul"
  const re = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  if (!re.test(v)) {
    return {
      ok: false,
      value: v,
      error: "Use letters only (A–Z) with single spaces. No numbers or symbols.",
    };
  }

  return { ok: true, value: v, error: "" };
}


export default function GetInTouch() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Bot-signal: when the form was first rendered
  const startedAt = useMemo(() => Date.now(), []);

  const setFieldError = (field, message) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const validateField = (name, value) => {
    const v = String(value ?? "").trim();

    switch (name) {
      case "name":
        const check = isValidFullName(value);
  return check.error;

      case "email": {
        if (!v) return "Email address is required.";
        if (v.length > 120) return "Email is too long.";

        const domain = v.includes("@") ? v.split("@").pop()?.toLowerCase() : "";
        const suggestion = detectProviderTypo(domain);

        if (!isValidEmailStrict(v)) {
          return suggestion ? `Did you mean ${suggestion}?` : "Please enter a valid email address.";
        }
        return "";
      }

      case "profile":
        if (v.length > 300) return "Profile link is too long.";
        if (!isHttpUrl(v)) return "Please enter a valid http(s) URL.";
        return "";

      case "message":
        if (v.length < 5) return "Message must be at least 5 characters long.";
        if (v.length > 2000) return "Message is too long.";
        return "";

      default:
        return "";
    }
  };

  const validateForm = (formEl) => {
    const next = {};
    const fields = ["name", "email", "profile", "message"];

    for (const field of fields) {
      const err = validateField(field, formEl[field]?.value);
      if (err) next[field] = err;
    }

    return next;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

  // 🔧 Auto-normalize spacing for the Full Name field on blur
  if (name === "name") {
    const normalized = collapseSpaces(value);
    if (value !== normalized) e.target.value = normalized;
  }

  const err = validateField(name, e.target.value);
  setFieldError(name, err);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (touched[name]) {
      const err = validateField(name, value);
      setFieldError(name, err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const form = e.currentTarget;

    setTouched({ name: true, email: true, profile: true, message: true });

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

    // ✅ In handleSubmit, normalize the name before sending (replace payload.name line)
const payload = {
  name: isValidFullName(form.name.value).value, // normalized + validated format
  email: form.email.value.trim(),
  profile: form.profile.value.trim(),
  message: form.message.value.trim(),
  website: form.website.value.trim(),
  startedAt,
};


    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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
      setTouched({});
      form.reset();
    } catch (err) {
      const msg =
        err?.message ||
        "Something went wrong while sending your message. Please try again.";

      // Pin certain server errors to fields (better UX)
      if (/email/i.test(msg) && /domain|address|invalid|mean/i.test(msg)) {
        setFieldError("email", msg);
      }

      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const hasAnyError = Object.keys(errors).length > 0;

  return (
    <section className="git">
      <div className="git__inner">
        <header className="git__header">
          <h2 className="git__title">Get in Touch</h2>
          <p className="git__subtitle">Drop us a message and we’ll get back to you ✍🏼</p>
        </header>

        <form className="git__form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className={`git__field ${errors.name ? "is-error" : ""}`}>
            <label className="git__label" htmlFor="name">
              Full Name <span className="git__req">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="git__input"
              placeholder="Your full name"
              autoComplete="name"
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <div id="name-error" className="git__error">
                ⚠️ {errors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div className={`git__field ${errors.email ? "is-error" : ""}`}>
            <label className="git__label" htmlFor="email">
              Email Address <span className="git__req">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className="git__input"
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <div id="email-error" className="git__error">
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className={`git__field ${errors.profile ? "is-error" : ""}`}>
            <label className="git__label" htmlFor="profile">
              Cricheroes / CricClub Profile <span className="git__hint">(optional)</span>
            </label>
            <input
              id="profile"
              name="profile"
              type="url"
              inputMode="url"
              className="git__input"
              placeholder="https://cricheroes.com/player/..."
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={!!errors.profile}
              aria-describedby={errors.profile ? "profile-error" : undefined}
            />
            {errors.profile && (
              <div id="profile-error" className="git__error">
                ⚠️ {errors.profile}
              </div>
            )}
          </div>

          {/* Message */}
          <div className={`git__field ${errors.message ? "is-error" : ""}`}>
            <label className="git__label" htmlFor="message">
              Message <span className="git__req">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="git__textarea"
              placeholder="Write your message…"
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            <div className="git__meta">
              <span className="git__hint">Minimum 5 characters</span>
            </div>
            {errors.message && (
              <div id="message-error" className="git__error">
                ⚠️ {errors.message}
              </div>
            )}
          </div>

          {/* Honeypot (bots) */}
          <input
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
            className="git__honeypot"
          />

          <button type="submit" className="git__btn" disabled={loading} aria-busy={loading}>
            {loading ? "Sending..." : "Submit Message"}
          </button>

          {/* Global Status */}
          {status.message && (
            <div
              className={`git__status ${
                status.type === "success" ? "is-success" : "is-error"
              }`}
              role="status"
            >
              <span className="git__statusIcon">
                {status.type === "success" ? "✅" : "⚠️"}
              </span>
              <span>{status.message}</span>
            </div>
          )}

          {hasAnyError && !status.message && (
            <div className="git__status is-error" role="status">
              <span className="git__statusIcon">⚠️</span>
              <span>Please review the highlighted fields.</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
