import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fantasyApi } from "../fantasy/api";
import FormMessages from "../fantasy/components/FormMessages";
import "./MemberLogin.css";
import "../fantasy/fantasy.css";

const STATUS_TEXT = { ACTIVE: "approved", REJECTED: "rejected", PENDING: "waiting for approval" };

/**
 * Opened from the Approve / Reject buttons in the admin email.
 * Shows who and what, then needs one tap to confirm. Email link-scanners only load
 * the page (a read-only GET), so they can't approve or reject anyone by themselves.
 */
export default function FantasyDecide() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [info, setInfo] = useState(null);
  const [errors, setErrors] = useState([]);
  const [done, setDone] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    fantasyApi("decision", undefined, { t: token })
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
      setDone(await fantasyApi("decide", { t: token }));
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  const approving = info?.decision === "APPROVE";
  const status = done?.status ?? info?.status;
  const alreadyDecided = (info && info.status !== "PENDING") || done?.already;

  return (
    <div className="future-wrap">
      <div className="future-bg" aria-hidden="true"><div className="grid" /></div>
      <div className="future-card fx-login-card">
        <p className="fx-eyebrow">Fantasy League · Admin</p>
        <h1 className="future-title">{approving ? "Approve player" : info ? "Reject registration" : "Registration"}</h1>

        {!info && !errors.length && <p className="future-sub" aria-busy="true">Checking the link…</p>}

        {info && !done && !alreadyDecided && (
          <div className="fx-stack">
            <p className="future-sub">
              <strong>{info.name}</strong>
              <br />
              <span className="fx-muted">{info.email}</span>
            </p>
            <p className="fx-small fx-muted">
              {approving
                ? "They'll be able to sign in and play, and they'll get an email saying they're in."
                : "They won't be able to sign in. You can still approve them later from the admin page."}
            </p>
            <button
              type="button"
              className={`fx-btn fx-btn-block ${approving ? "fx-btn-primary" : "fx-btn-danger"}`}
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "Saving…" : approving ? `Confirm: approve ${info.name.split(" ")[0]}` : `Confirm: reject ${info.name.split(" ")[0]}`}
            </button>
          </div>
        )}

        {(done || alreadyDecided) && info && (
          <div className="fx-stack" role="status">
            <p className="future-sub">
              {done && !done.already
                ? `Done: ${info.name} is ${STATUS_TEXT[status]}.`
                : `Already decided: ${info.name} is ${STATUS_TEXT[status]}.`}
            </p>
            {done && !done.already && approving && <p className="fx-small fx-muted">They've been emailed that they can sign in.</p>}
          </div>
        )}

        <FormMessages errors={errors} />

        <Link to="/fantasy/admin" className="fx-btn fx-btn-ghost fx-btn-block fx-mt">Open the admin page</Link>
      </div>
    </div>
  );
}
