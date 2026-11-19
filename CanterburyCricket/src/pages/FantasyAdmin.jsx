import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fantasyApi, formatWhen, MATCH_TYPE_LABEL } from "../fantasy/api";
import AdminMatchUpdate from "../fantasy/components/AdminMatchUpdate";
import FormMessages from "../fantasy/components/FormMessages";
import { PLAYER_ROLES, ROLE_LABEL, addPlayerSchema, allowedEmailsSchema, createMatchSchema, issuesOf } from "../fantasy/shared/validation";
import { XI_SIZE } from "../fantasy/shared/scoring";
import "../fantasy/fantasy.css";

/** Runs an admin API action and tracks its own errors/message. */
function useAdminAction(onData) {
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const run = async (action, body, schema) => {
    setMessage("");
    if (schema) {
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        setErrors(issuesOf(parsed.error));
        return null;
      }
    }
    setErrors([]);
    setPending(true);
    try {
      const res = await fantasyApi(action, body);
      setMessage(res.message || "");
      onData(res);
      return res;
    } catch (err) {
      setErrors(err.errors || [err.message]);
      return null;
    } finally {
      setPending(false);
    }
  };
  return { run, errors, message, pending };
}

export default function FantasyAdmin() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [panel, setPanel] = useState(null); // { type: "xi" | "result", matchId }

  useEffect(() => {
    let alive = true;
    fantasyApi("admin")
      .then((d) => alive && setData(d))
      .catch((err) => alive && setLoadError(err.errors || [err.message]));
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) return <div className="fx-page"><FormMessages errors={loadError} /></div>;
  if (!data) return <div className="fx-page"><p className="fx-muted" aria-busy="true">Loading admin…</p></div>;

  const activeMatch = panel && data.matches.find((m) => m.id === panel.matchId);

  if (activeMatch) {
    return (
      <div className="fx-page">
        <button type="button" className="fx-back" onClick={() => setPanel(null)}>← Back to admin</button>
        <p className="fx-eyebrow">{panel.type === "xi" ? "Playing XI" : "Post-match update"}</p>
        <h1 className="fx-title fx-title-sm">Canterbury vs {activeMatch.opponent}</h1>
        <p className="fx-muted fx-mb">{formatWhen(activeMatch.date)} · {activeMatch.venue}</p>
        {panel.type === "xi" ? (
          <PlayingXIPicker match={activeMatch} players={data.players} onDone={(res) => { setData(res); setPanel(null); }} />
        ) : (
          <AdminMatchUpdate match={activeMatch} players={data.players} scorecardReader={data.scorecardReader} onDone={setData} />
        )}
      </div>
    );
  }

  return (
    <div className="fx-page">
      <Link to="/fantasy" className="fx-back">← Fantasy League</Link>
      <p className="fx-eyebrow">Committee</p>
      <h1 className="fx-title">Fantasy Admin</h1>
      <p className="fx-muted fx-mb">
        {data.members.length} members · {data.allowedEmails.length} whitelisted emails · {data.players.filter((p) => p.isActive).length} active players
      </p>

      <section className="fx-section">
        <h2 className="fx-h2">Matches</h2>
        <ul className="fx-stack">
          {!data.matches.length && <li className="fx-card fx-pad fx-muted">No matches yet. Create one below.</li>}
          {data.matches.map((m) => (
            <li key={m.id} className="fx-card fx-pad fx-admin-match">
              <div className="fx-grow">
                <strong>vs {m.opponent}</strong>
                <span className="fx-small fx-muted">
                  {formatWhen(m.date)} · {MATCH_TYPE_LABEL[m.matchType]} · {m.status} · XI {m.playingXI.length}/{XI_SIZE} · {m.predictionCount} predictions
                </span>
              </div>
              <div className="fx-admin-actions">
                {m.status !== "COMPLETED" && (
                  <button type="button" className="fx-btn fx-btn-ghost" onClick={() => setPanel({ type: "xi", matchId: m.id })}>XI</button>
                )}
                {m.playingXI.length === XI_SIZE && (
                  <button type="button" className="fx-btn fx-btn-primary" onClick={() => setPanel({ type: "result", matchId: m.id })}>
                    {m.status === "COMPLETED" ? "Edit result" : "Enter result"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CreateMatchForm onCreated={(res) => { setData(res); setPanel({ type: "xi", matchId: res.matchId }); }} />
      <SquadSection players={data.players} onData={setData} />
      <WhitelistSection data={data} onData={setData} />
    </div>
  );
}

function CreateMatchForm({ onCreated }) {
  const [form, setForm] = useState({ opponent: "", venue: "Lynda Lane Park", local: "", matchType: "T20" });
  const { run, errors, message, pending } = useAdminAction(onCreated);
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    // datetime-local has no timezone: convert in the browser so the right instant is stored.
    const date = form.local ? new Date(form.local).toISOString() : "";
    run("admin-create-match", { opponent: form.opponent, venue: form.venue, date, matchType: form.matchType }, createMatchSchema);
  }

  return (
    <section className="fx-card fx-pad fx-section">
      <h2 className="fx-h2">New match</h2>
      <form className="fx-stack" onSubmit={submit} noValidate>
        <label className="fx-field"><span>Opponent</span><input name="opponent" value={form.opponent} onChange={update} placeholder="e.g. Ottawa CC" /></label>
        <label className="fx-field"><span>Venue</span><input name="venue" value={form.venue} onChange={update} /></label>
        <div className="fx-two">
          <label className="fx-field"><span>Start (locks picks)</span><input type="datetime-local" name="local" value={form.local} onChange={update} /></label>
          <label className="fx-field">
            <span>Format</span>
            <select name="matchType" value={form.matchType} onChange={update}>
              {Object.entries(MATCH_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <FormMessages errors={errors} message={message} />
        <button className="fx-btn fx-btn-primary fx-btn-block" disabled={pending}>{pending ? "Creating…" : "Create match & pick XI"}</button>
      </form>
    </section>
  );
}

function SquadSection({ players, onData }) {
  const [form, setForm] = useState({ name: "", role: "BATTER" });
  const add = useAdminAction(onData);
  const sync = useAdminAction(onData);

  async function submit(e) {
    e.preventDefault();
    if (await add.run("admin-add-player", form, addPlayerSchema)) setForm({ name: "", role: form.role });
  }

  return (
    <section className="fx-card fx-pad fx-section">
      <h2 className="fx-h2">Squad ({players.length})</h2>
      <p className="fx-small fx-muted">Import names and roles from the club squad sheet (the one behind the Our Squad page), or add players by hand.</p>
      <button type="button" className="fx-btn fx-btn-ghost fx-btn-block" disabled={sync.pending} onClick={() => sync.run("admin-import-squad", {})}>
        {sync.pending ? "Importing…" : "Import from club squad sheet"}
      </button>
      <FormMessages errors={sync.errors} message={sync.message} />

      <form className="fx-stack fx-mt" onSubmit={submit} noValidate>
        <div className="fx-two">
          <label className="fx-field"><span>Player name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="fx-field">
            <span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {PLAYER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </label>
        </div>
        <FormMessages errors={add.errors} message={add.message} />
        <button className="fx-btn fx-btn-ghost fx-btn-block" disabled={add.pending}>Add player</button>
      </form>

      {players.length > 0 && (
        <ul className="fx-chips fx-mt">
          {players.map((p) => <li key={p.id} className="fx-chip">{p.name} · {ROLE_LABEL[p.role]}</li>)}
        </ul>
      )}
    </section>
  );
}

function WhitelistSection({ data, onData }) {
  const [emails, setEmails] = useState("");
  const { run, errors, message, pending } = useAdminAction(onData);
  const registered = new Set(data.members.map((m) => m.email));

  async function submit(e) {
    e.preventDefault();
    if (await run("admin-allow-emails", { emails }, allowedEmailsSchema)) setEmails("");
  }

  return (
    <section className="fx-card fx-pad fx-section">
      <h2 className="fx-h2">Member whitelist</h2>
      <form className="fx-stack" onSubmit={submit} noValidate>
        <label className="fx-field">
          <span>Member emails (comma or new-line separated)</span>
          <textarea rows={4} value={emails} onChange={(e) => setEmails(e.target.value)} />
        </label>
        <FormMessages errors={errors} message={message} />
        <button className="fx-btn fx-btn-ghost fx-btn-block" disabled={pending}>Whitelist emails</button>
      </form>
      {data.allowedEmails.length > 0 && (
        <ul className="fx-email-list fx-mt">
          {data.allowedEmails.map((a) => (
            <li key={a.email}>
              <span className="fx-ellipsis">{a.email}</span>
              <span className={registered.has(a.email) ? "fx-ok" : "fx-muted"}>{registered.has(a.email) ? "registered" : "invited"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayingXIPicker({ match, players, onDone }) {
  const [picked, setPicked] = useState(match.playingXI);
  const { run, errors, message, pending } = useAdminAction(onDone);
  const active = players.filter((p) => p.isActive);

  const toggle = (id) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < XI_SIZE ? [...cur, id] : cur));

  return (
    <div>
      {!active.length && <p className="fx-card fx-pad fx-muted">Add or import squad players first.</p>}
      <ul className="fx-stack">
        {active.map((p) => {
          const on = picked.includes(p.id);
          return (
            <li key={p.id}>
              <label className={`fx-xi-row ${on ? "is-on" : ""}`}>
                <input type="checkbox" checked={on} disabled={!on && picked.length >= XI_SIZE} onChange={() => toggle(p.id)} />
                <span className="fx-grow">{p.name}</span>
                <span className="fx-small fx-muted">{ROLE_LABEL[p.role]}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <FormMessages errors={errors} message={message} />
      <div className="fx-sticky-bar">
        <div className="fx-sticky-inner">
          <div className="fx-sticky-status"><strong>{picked.length}/{XI_SIZE} selected</strong></div>
          <button
            type="button"
            className="fx-btn fx-btn-primary"
            disabled={pending || picked.length !== XI_SIZE}
            onClick={() => run("admin-set-xi", { matchId: match.id, playerIds: picked })}
          >
            {pending ? "Saving…" : "Save XI"}
          </button>
        </div>
      </div>
    </div>
  );
}
