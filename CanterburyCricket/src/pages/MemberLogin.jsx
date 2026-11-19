import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMember } from "../fantasy/MemberContext";
import FormMessages from "../fantasy/components/FormMessages";
import SquadIdentityFields, { useClaimablePlayers } from "../fantasy/components/SquadIdentityFields";
import { loginSchema, registerSchema, issuesOf } from "../fantasy/shared/validation";

import "./MemberLogin.css";
import "../fantasy/fantasy.css";

/** Only same-site paths are allowed as the post-login destination. */
function safeNext(raw) {
  // Only plain in-site paths: blocks "//evil.com", "/\\evil.com" and "javascript:" style values.
  return typeof raw === "string" && /^\/(?![/\\])[\w\-./?=&%#]*$/.test(raw) && raw.length < 200 ? raw : "/fantasy";
}

export default function MemberLogin() {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { member, signIn, signOut } = useMember();

  const [mode, setMode] = useState("login");
  const EMPTY = { name: "", email: "", password: "", playerId: "", username: "" };
  const [form, setForm] = useState(EMPTY);
  const [clubAccount, setClubAccount] = useState(false); // the club's moderator account claims no player
  const [errors, setErrors] = useState([]);
  const [pending, setPending] = useState(false);
  const [awaiting, setAwaiting] = useState(null); // registration sent, waiting for an admin

  const isLogin = mode === "login";
  const squad = useClaimablePlayers();
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const input = isLogin
      ? { email: form.email, password: form.password }
      : clubAccount
        ? { name: form.name, email: form.email, password: form.password }
        : form;
    if (!isLogin && !clubAccount && !form.playerId) {
      setErrors(["Pick which Canterbury squad player you are."]);
      return;
    }
    const parsed = (isLogin ? loginSchema : registerSchema).safeParse(input);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return;
    }
    setErrors([]);
    setPending(true);
    try {
      const res = await signIn(mode, input);
      if (res.pending) {
        setAwaiting({ name: form.name.trim().split(" ")[0], message: res.message });
        setForm(EMPTY);
        return;
      }
      navigate(safeNext(params.get("next")), { replace: true });
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

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
          </>
        )}
      </div>

      <motion.div
        className="future-card fx-login-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="fx-eyebrow">Canterbury Cricket Club</p>
        <h1 className="future-title">Member Login</h1>

        {awaiting ? (
          <div className="fx-stack" role="status">
            <p className="future-sub">
              Thanks{awaiting.name ? `, ${awaiting.name}` : ""}! {awaiting.message}
            </p>
            <p className="fx-muted fx-small">
              Check your spam folder if it hasn&apos;t arrived in a few minutes. Only Canterbury players are approved.
            </p>
            <button
              type="button"
              className="fx-btn fx-btn-ghost fx-btn-block"
              onClick={() => { setAwaiting(null); setMode("login"); }}
            >
              Back to sign in
            </button>
          </div>
        ) : member ? (
          <div className="fx-stack">
            <p className="future-sub">
              Signed in as <strong>{member.name}</strong>. The Fantasy League is unlocked.
            </p>
            <Link to="/fantasy" className="fx-btn fx-btn-primary fx-btn-block">Open Fantasy League</Link>
            <button type="button" className="fx-btn fx-btn-ghost fx-btn-block" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <>
            <p className="future-sub">Sign in to unlock the members-only Fantasy League: pick your five, back your captain, top the table.</p>

            <div className="fx-tabs" role="tablist" aria-label="Sign in or register">
              {[["login", "Sign in"], ["register", "Register"]].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  className={`fx-tab ${mode === value ? "is-active" : ""}`}
                  onClick={() => { setMode(value); setErrors([]); }}
                >
                  {label}
                </button>
              ))}
            </div>

            <form className="fx-stack" onSubmit={submit} noValidate>
              {!isLogin && (
                <label className="fx-field">
                  <span>Full name {clubAccount ? "" : "(as on the squad sheet)"}</span>
                  <input name="name" autoComplete="name" value={form.name} onChange={update} required />
                </label>
              )}
              <label className="fx-field">
                <span>Email</span>
                <input name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={update} required />
              </label>
              <label className="fx-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={form.password}
                  onChange={update}
                  required
                />
              </label>

              {!isLogin && !clubAccount && (
                <SquadIdentityFields
                  players={squad.players}
                  error={squad.error}
                  fullName={form.name}
                  playerId={form.playerId}
                  username={form.username}
                  onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                />
              )}

              <FormMessages errors={errors} />

              <button type="submit" className="fx-btn fx-btn-primary fx-btn-block" disabled={pending}>
                {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
              </button>
              {!isLogin && (
                <>
                  <p className="fx-muted fx-small">
                    You&apos;ll confirm your email, then a club admin approves you, so only Canterbury players can join the league.
                  </p>
                  <p className="fx-muted fx-small">
                    <button type="button" className="fx-link-btn" onClick={() => { setClubAccount((v) => !v); setErrors([]); }}>
                      {clubAccount ? "I'm a squad player" : "Registering the club's admin account?"}
                    </button>
                  </p>
                </>
              )}
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
