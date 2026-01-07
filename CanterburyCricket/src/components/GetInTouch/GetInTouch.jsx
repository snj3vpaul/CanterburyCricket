import { useState } from "react";
import "./GetInTouch.css";

export default function GetInTouch() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [errors, setErrors] = useState({});

  const validate = (form) => {
    const newErrors = {};

    if (!form.name.value.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!form.email.value.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email.value)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (form.message.value.trim().length < 5) {
      newErrors.message = "Message must be at least 5 characters long.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const form = e.currentTarget;
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: "error",
        message: "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      profile: form.profile.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value.trim(), // honeypot
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

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
            <input id="name" name="name" type="text" />
            {errors.name && <span className="field-error">⚠️ {errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" />
            {errors.email && <span className="field-error">⚠️ {errors.email}</span>}
          </div>

          {/* Profile */}
          <div className="form-group">
            <label htmlFor="profile">Cricheroes / CricClub Profile</label>
            <input
              id="profile"
              name="profile"
              type="url"
              placeholder="https://cricheroes.com/player/..."
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" />
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
