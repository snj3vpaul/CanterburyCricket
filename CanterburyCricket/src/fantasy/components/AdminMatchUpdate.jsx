import { useMemo, useState } from "react";
import { fantasyApi } from "../api";
import FormMessages from "./FormMessages";
import ScorecardImport from "./ScorecardImport";
import { scorePlayer } from "../shared/scoring";
import { issuesOf, matchResultSchema } from "../shared/validation";

const FIELDS = [
  { key: "runs", label: "Runs", max: 400 },
  { key: "wickets", label: "Wkts", max: 10 },
  { key: "catches", label: "Ct/St", max: 10 },
];

/**
 * Phone-first post-match form: result, MOTM, then runs / wickets / catches for
 * each Canterbury XI player, with a live points preview. Saving scores every
 * member's prediction in one atomic write (safe to re-run for corrections).
 */
export default function AdminMatchUpdate({ match, players, onDone }) {
  const initial = match.result;
  const xi = useMemo(() => match.playingXI.map((id) => players.find((p) => p.id === id)).filter(Boolean), [match.playingXI, players]);

  const [winningTeam, setWinningTeam] = useState(initial?.winningTeam ?? null);
  const [motm, setMotm] = useState(initial?.motmPlayerId ?? "");
  const [stats, setStats] = useState(() =>
    Object.fromEntries(
      xi.map((p) => [p.id, initial?.topPerformersData?.find((s) => s.playerId === p.id) ?? { playerId: p.id, runs: 0, wickets: 0, catches: 0 }]),
    ),
  );
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [imported, setImported] = useState(null); // { summary, warnings, unmatched[] (+ assignedTo) }

  /** Fill the form from a CricHeroes draft (replaces what's there; admin still reviews). */
  function applyDraft(draft) {
    if (draft.winningTeam) setWinningTeam(draft.winningTeam);
    setMotm(draft.motmPlayerId ?? "");
    setStats(Object.fromEntries(xi.map((p) => [p.id, draft.stats.find((s) => s.playerId === p.id) ?? { playerId: p.id, runs: 0, wickets: 0, catches: 0 }])));
    setImported({ ...draft, unmatched: draft.unmatched.map((u, i) => ({ ...u, key: i, assignedTo: "" })) });
    setErrors([]);
    setMessage("");
  }

  /** Give an unmatched scorecard name's numbers to an XI player (or take them back). */
  function assign(key, playerId) {
    const u = imported.unmatched.find((x) => x.key === key);
    setStats((s) => {
      const next = { ...s };
      const max = FIELDS.find((f) => f.key === u.field).max;
      if (u.assignedTo) next[u.assignedTo] = { ...next[u.assignedTo], [u.field]: Math.max(0, next[u.assignedTo][u.field] - u.amount) };
      if (playerId) next[playerId] = { ...next[playerId], [u.field]: Math.min(max, next[playerId][u.field] + u.amount) };
      return next;
    });
    setImported((imp) => ({ ...imp, unmatched: imp.unmatched.map((x) => (x.key === key ? { ...x, assignedTo: playerId } : x)) }));
  }

  const FIELD_LABEL = { runs: "runs", wickets: "wickets", catches: "catch/stumping" };

  const outcomes = [
    ["CANTERBURY", "Canterbury won"],
    ["OPPONENT", `${match.opponent} won`],
    ["TIE", "Tie"],
    ["NO_RESULT", "No result"],
  ];

  function set(playerId, field, raw) {
    const max = FIELDS.find((f) => f.key === field).max;
    const value = Number.isFinite(raw) ? Math.min(max, Math.max(0, Math.trunc(raw))) : 0;
    setErrors([]);
    setMessage("");
    setStats((s) => ({ ...s, [playerId]: { ...s[playerId], [field]: value } }));
  }

  const preview = useMemo(() => {
    const input = { winningTeam: winningTeam ?? "NO_RESULT", motmPlayerId: motm || null, playingXI: xi.map((p) => p.id), stats: Object.values(stats) };
    return Object.fromEntries(xi.map((p) => [p.id, scorePlayer(p.id, input).reduce((t, i) => t + i.points, 0)]));
  }, [winningTeam, motm, stats, xi]);

  const totalWickets = Object.values(stats).reduce((t, s) => t + s.wickets, 0);

  async function submit() {
    const payload = { matchId: match.id, winningTeam, motmPlayerId: motm || null, stats: Object.values(stats) };
    const parsed = matchResultSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return;
    }
    if (initial && !window.confirm("Results were already processed. Re-score every member's prediction with these numbers?")) return;
    setPending(true);
    setErrors([]);
    try {
      const res = await fantasyApi("admin-results", parsed.data);
      setMessage(res.message);
      onDone?.(res);
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fx-stack-lg">
      <ScorecardImport matchId={match.id} onDraft={applyDraft} />

      {imported && (
        <section className="fx-card fx-pad fx-import-result" aria-live="polite">
          <p className="fx-h3">Filled from CricHeroes{imported.summary.resultText ? `: ${imported.summary.resultText}` : ""}</p>
          <p className="fx-small fx-muted">Check every number below against the scorecard before saving.</p>
          {imported.warnings.length > 0 && (
            <ul className="fx-warn-list">{imported.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          )}
          {imported.unmatched.length > 0 && (
            <div className="fx-mt">
              <p className="fx-small"><strong>Names we couldn&apos;t match to the Playing XI</strong> — assign them, or leave as &quot;Not ours&quot; (opposition / non-XI):</p>
              <ul className="fx-unmatched">
                {imported.unmatched.map((u) => (
                  <li key={u.key}>
                    <span>
                      <strong>{u.name}</strong> · {u.amount} {FIELD_LABEL[u.field]}
                      {u.context && u.field === "catches" && <small className="fx-muted"> ({u.context})</small>}
                    </span>
                    <select value={u.assignedTo} onChange={(e) => assign(u.key, e.target.value)} aria-label={`Assign ${u.name}`}>
                      <option value="">Not ours</option>
                      {xi.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="fx-card fx-pad">
        <h3 className="fx-h3">1 · Match result</h3>
        <div className="fx-outcomes" role="radiogroup" aria-label="Match result">
          {outcomes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={winningTeam === value}
              className={`fx-outcome ${winningTeam === value ? (value === "CANTERBURY" ? "is-win" : "is-on") : ""}`}
              onClick={() => { setWinningTeam(value); setErrors([]); setMessage(""); }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="fx-card fx-pad">
        <label className="fx-field">
          <span className="fx-h3">2 · Man of the Match</span>
          <select value={motm} onChange={(e) => { setMotm(e.target.value); setMessage(""); }}>
            <option value="">— None / opposition player —</option>
            {xi.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </section>

      <section>
        <div className="fx-row-between">
          <h3 className="fx-h3">3 · Canterbury player stats</h3>
          <span className={`fx-small ${totalWickets > 10 ? "fx-error-text" : "fx-muted"}`}>{totalWickets} wkts total</span>
        </div>
        <ul className="fx-stat-list">
          {xi.map((p) => {
            const line = stats[p.id];
            return (
              <li key={p.id} className="fx-card fx-stat-card">
                <div className="fx-row-between">
                  <strong className="fx-ellipsis">{p.name}</strong>
                  <span className="fx-pts-chip">{preview[p.id]} pts</span>
                </div>
                <div className="fx-stat-grid">
                  {FIELDS.map((f) => (
                    <div key={f.key} className="fx-stat-cell">
                      <span className="fx-stat-label">{f.label}</span>
                      {f.key === "runs" ? (
                        <input
                          aria-label={`${p.name} runs`}
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min={0}
                          max={f.max}
                          placeholder="0"
                          value={line.runs === 0 ? "" : line.runs}
                          onChange={(e) => set(p.id, "runs", e.target.valueAsNumber)}
                          className="fx-runs"
                        />
                      ) : (
                        <div className="fx-stepper">
                          <button type="button" aria-label={`${p.name} ${f.label} minus`} onClick={() => set(p.id, f.key, line[f.key] - 1)} disabled={line[f.key] <= 0}>−</button>
                          <output aria-live="polite">{line[f.key]}</output>
                          <button type="button" aria-label={`${p.name} ${f.label} plus`} onClick={() => set(p.id, f.key, line[f.key] + 1)} disabled={line[f.key] >= f.max}>+</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <FormMessages errors={errors} message={message} />

      <div className="fx-sticky-bar">
        <div className="fx-sticky-inner">
          <div className="fx-sticky-status">
            <span>Scores {match.predictionCount} prediction{match.predictionCount === 1 ? "" : "s"}. Safe to re-run for corrections.</span>
          </div>
          <button type="button" className="fx-btn fx-btn-primary" onClick={submit} disabled={pending}>
            {pending ? "Scoring…" : initial ? "Re-process" : "Save & score"}
          </button>
        </div>
      </div>
    </div>
  );
}
