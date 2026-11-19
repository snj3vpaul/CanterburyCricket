import { useMemo, useState } from "react";
import { fantasyApi } from "../api";
import FormMessages from "./FormMessages";
import { PICK_COUNT } from "../shared/scoring";
import { MIN_BATTERS, MIN_BOWLERS, ROLE_LABEL, compositionErrors, isBattingRole, predictionSchema } from "../shared/validation";

const ROLE_ORDER = ["BATTER", "WICKET_KEEPER", "ALL_ROUNDER", "BOWLER"];

/**
 * Pick 5 from the Playing XI and make one of them captain (2x points).
 * Same zod schema + composition rule as the server, so the Save button only
 * enables for a team the API will accept.
 */
export default function PredictionForm({ match, onSaved }) {
  const players = match.playingXI;
  const initial = match.myPrediction;
  const locked = !match.isOpen;

  const [selected, setSelected] = useState(() => (initial?.selectedPlayerIds ?? []).filter((id) => players.some((p) => p.id === id)));
  const [captainId, setCaptainId] = useState(initial?.captainId ?? null);
  const [serverErrors, setServerErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const sorted = useMemo(
    () => [...players].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name)),
    [players],
  );

  const roles = selected.map((id) => byId.get(id).role);
  const batters = roles.filter(isBattingRole).length;
  const bowlers = roles.length - batters;

  const errors = useMemo(() => {
    const parsed = predictionSchema.safeParse({ matchId: match.id, selectedPlayerIds: selected, captainId: captainId ?? "" });
    const list = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
    if (selected.length === PICK_COUNT) list.push(...compositionErrors(selected.map((id) => byId.get(id).role)));
    return [...new Set(list)];
  }, [match.id, selected, captainId, byId]);
  const isValid = errors.length === 0;
  const full = selected.length >= PICK_COUNT;

  function reset() {
    setServerErrors([]);
    setMessage("");
  }

  function toggle(id) {
    if (locked) return;
    reset();
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      if (captainId === id) setCaptainId(null);
    } else if (!full) {
      setSelected([...selected, id]);
    }
  }

  async function save() {
    if (!isValid) return;
    setPending(true);
    reset();
    try {
      const view = await fantasyApi("predict", { matchId: match.id, selectedPlayerIds: selected, captainId });
      setMessage(view.message);
      onSaved?.(view);
    } catch (err) {
      setServerErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fx-predict">
      {locked && <div className="fx-alert fx-alert-warn">Predictions are closed for this match.</div>}

      <ul className="fx-pick-list" aria-label="Playing XI">
        {sorted.map((p) => {
          const picked = selected.includes(p.id);
          const isCaptain = captainId === p.id;
          const disabled = locked || (!picked && full);
          return (
            <li key={p.id} className={`fx-pick ${picked ? "is-picked" : ""} ${isCaptain ? "is-captain" : ""} ${disabled && !picked ? "is-dim" : ""}`}>
              <button type="button" className="fx-pick-main" onClick={() => toggle(p.id)} disabled={disabled} aria-pressed={picked}>
                <span className="fx-check" aria-hidden="true">{picked ? "✓" : ""}</span>
                <span className="fx-pick-text">
                  <span className="fx-pick-name">{p.name}</span>
                  <span className={`fx-role fx-role-${p.role.toLowerCase()}`}>{ROLE_LABEL[p.role]}</span>
                </span>
              </button>
              {picked && (
                <button
                  type="button"
                  className={`fx-captain ${isCaptain ? "is-on" : ""}`}
                  onClick={() => { if (!locked) { reset(); setCaptainId(p.id); } }}
                  disabled={locked}
                  aria-pressed={isCaptain}
                  aria-label={isCaptain ? `${p.name} is captain` : `Make ${p.name} captain`}
                >
                  {isCaptain ? "C ×2" : "C"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!locked && !isValid && selected.length === PICK_COUNT && <FormMessages errors={errors} />}
      <FormMessages errors={serverErrors} message={message} />

      {!locked && (
        <div className="fx-sticky-bar">
          <div className="fx-sticky-inner">
            <div className="fx-sticky-status">
              <strong>
                {selected.length}/{PICK_COUNT} picked · {captainId ? `C: ${byId.get(captainId)?.name}` : "No captain"}
              </strong>
              <span>
                <span className={batters >= MIN_BATTERS ? "fx-ok" : ""}>Bat {batters}/{MIN_BATTERS}+</span> ·{" "}
                <span className={bowlers >= MIN_BOWLERS ? "fx-ok" : ""}>Bowl {bowlers}/{MIN_BOWLERS}+</span>
              </span>
            </div>
            <button type="button" className="fx-btn fx-btn-primary" onClick={save} disabled={pending || !isValid}>
              {pending ? "Saving…" : initial ? "Update picks" : "Save picks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
