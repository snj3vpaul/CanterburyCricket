import { useEffect, useState } from "react";
import { fantasyApi } from "../api";
import FormMessages from "./FormMessages";
import SquadIdentityFields from "./SquadIdentityFields";
import { issuesOf, oauthRegisterSchema } from "../shared/validation";

const OUTCOME = {
  pending: "Your registration is with the club admins. You can sign in once they approve it.",
  rejected: "This registration wasn't approved. If you play for Canterbury, contact the club.",
  unverified: "That account didn't confirm an email address we can trust. Use another provider, or register with email and password.",
  error: "That sign-in didn't work. Please try again.",
  busy: "Too many attempts. Try again in a few minutes.",
  unavailable: "That sign-in option isn't available. Use another one.",
};

/** What happened on the way back from Google/Microsoft/Yahoo. */
export function OAuthOutcome({ outcome }) {
  const text = OUTCOME[outcome];
  if (!text) return null;
  return (
    <p className={`fx-small ${outcome === "pending" ? "fx-ok" : "fx-error-text"}`} role="status">
      {text}
    </p>
  );
}

/** "Continue with Google / Microsoft / Yahoo" buttons, for whichever providers are switched on. */
export function ProviderButtons({ providers, next }) {
  if (!providers?.length) return null;
  return (
    <div className="fx-stack fx-providers">
      {providers.map((p) => (
        <a
          key={p.id}
          className={`fx-btn fx-btn-ghost fx-btn-block fx-provider fx-provider-${p.id}`}
          href={`/api/fantasy?${new URLSearchParams({ action: "oauth-start", provider: p.id, next })}`}
        >
          <span>Continue with {p.label}</span>
          {p.hint && <small>{p.hint}</small>}
        </a>
      ))}
      <p className="fx-divider"><span>or use email and password</span></p>
    </div>
  );
}

/**
 * Back from the provider with a new email: say which squad player you are and pick a username.
 * The provider has already proved the email, so this goes straight to the admins.
 */
export function OAuthFinish({ players, error, next, onPending, onCancel }) {
  const [who, setWho] = useState(null);
  const [form, setForm] = useState({ name: "", playerId: "", username: "" });
  const [errors, setErrors] = useState([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let live = true;
    fantasyApi("oauth-signup")
      .then((w) => {
        if (!live) return;
        setWho(w);
        setForm((f) => ({ ...f, name: w.name || "" }));
      })
      .catch((err) => live && setErrors(err.errors || [err.message]));
    return () => {
      live = false;
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.playerId) return setErrors(["Pick which Canterbury squad player you are."]);
    const parsed = oauthRegisterSchema.safeParse(form);
    if (!parsed.success) return setErrors(issuesOf(parsed.error));
    setErrors([]);
    setPending(true);
    try {
      const r = await fantasyApi("oauth-register", form);
      if (r.member) {
        window.location.replace(next); // fresh load so the whole app sees the new session
        return;
      }
      onPending({ name: form.name.trim().split(" ")[0], message: r.message });
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  if (!who) {
    return (
      <div className="fx-stack">
        {!errors.length && <p className="future-sub" aria-busy="true">Loading…</p>}
        <FormMessages errors={errors} />
        <button type="button" className="fx-btn fx-btn-ghost fx-btn-block" onClick={onCancel}>Back to sign in</button>
      </div>
    );
  }

  return (
    <form className="fx-stack" onSubmit={submit} noValidate>
      <p className="future-sub">
        Signed in with {who.provider} as <strong>{who.email}</strong>. One more step to join the league.
      </p>
      <label className="fx-field">
        <span>Full name (as on the squad sheet)</span>
        <input name="name" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </label>
      <SquadIdentityFields
        players={players}
        error={error}
        fullName={form.name}
        playerId={form.playerId}
        username={form.username}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />
      <FormMessages errors={errors} />
      <button type="submit" className="fx-btn fx-btn-primary fx-btn-block" disabled={pending}>
        {pending ? "Please wait…" : "Join the league"}
      </button>
      <p className="fx-muted fx-small">A club admin approves every new player, so only Canterbury players can join.</p>
      <button type="button" className="fx-link-btn fx-small" onClick={onCancel}>Use a different account</button>
    </form>
  );
}
