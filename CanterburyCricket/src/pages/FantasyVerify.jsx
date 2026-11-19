import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fantasyApi } from "../fantasy/api";
import FormMessages from "../fantasy/components/FormMessages";
import "./MemberLogin.css";
import "../fantasy/fantasy.css";

/**
 * Opened from the "Confirm my email" button. Loading the page only reads (so email
 * link-scanners can't confirm on someone's behalf); one tap confirms.
 */
export default function FantasyVerify() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [info, setInfo] = useState(null);
  const [done, setDone] = useState(null);
  const [errors, setErrors] = useState([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    fantasyApi("verify", undefined, { t: token })
      .then((d) => alive && setInfo(d))
      .catch((err) => alive && setErrors(err.errors || [err.message]));
    return () => {
      alive = false;
    };
  }, [token]);

  async function confirm() {
    setPending(true);
    setErrors([]);
    try {
      const r = await fantasyApi("verify-email", { t: token });
      if (r.member) {
        // Signed in by the confirmation: full load so every part of the app sees the new session
        // (an in-flight "who am I?" check from before the cookie existed can't override it).
        window.location.replace("/fantasy");
        return;
      }
      setDone(r);
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  const first = info?.name?.split(" ")[0] ?? "";
  const status = done?.status ?? info?.status;
  const unconfirmed = info && info.status === "UNVERIFIED" && !done;

  return (
    <div className="future-wrap">
      <div className="future-bg" aria-hidden="true"><div className="grid" /></div>
      <div className="future-card fx-login-card">
        <p className="fx-eyebrow">Canterbury CC · Fantasy League</p>
        <h1 className="future-title">Confirm your email</h1>

        {!info && !errors.length && <p className="future-sub" aria-busy="true">Checking the link…</p>}

        {unconfirmed && (
          <div className="fx-stack">
            <p className="future-sub">Hi {first}, tap below to confirm this is your email address.</p>
            <button type="button" className="fx-btn fx-btn-primary fx-btn-block" onClick={confirm} disabled={pending}>
              {pending ? "Confirming…" : "Confirm my email"}
            </button>
          </div>
        )}

        {info && !unconfirmed && (
          <div className="fx-stack" role="status">
            {status === "PENDING" && (
              <p className="future-sub">
                Thanks{first ? `, ${first}` : ""}! Your email is confirmed and your registration has gone to the club admins.
                You&apos;ll get an email when you&apos;re approved.
              </p>
            )}
            {status === "ACTIVE" && <p className="future-sub">Your email is already confirmed. Sign in to play.</p>}
            {status === "REJECTED" && <p className="future-sub">This registration wasn&apos;t approved. If you play for Canterbury, contact the club.</p>}
            <Link to="/member-login" className="fx-btn fx-btn-ghost fx-btn-block">Go to sign in</Link>
          </div>
        )}

        <FormMessages errors={errors} />
        {errors.length > 0 && !info && (
          <Link to="/member-login" className="fx-btn fx-btn-ghost fx-btn-block">Go to sign in</Link>
        )}
      </div>
    </div>
  );
}
