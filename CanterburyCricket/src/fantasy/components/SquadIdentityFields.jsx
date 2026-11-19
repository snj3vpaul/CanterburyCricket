import { useEffect, useMemo, useState } from "react";
import Jersey from "./Jersey";
import { fantasyApi } from "../api";
import { ROLE_LABEL, USERNAME_RULE, namesMatch, usernameProblems } from "../shared/validation";

/** Loads the squad players nobody has claimed yet (public: the Squad page shows them anyway). */
// eslint-disable-next-line react-refresh/only-export-components
export function useClaimablePlayers() {
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fantasyApi("register-options")
      .then((r) => live && setPlayers(r.players))
      .catch(() => live && setError("Couldn't load the squad. Refresh to try again."));
    return () => {
      live = false;
    };
  }, []);
  return { players, error };
}

/**
 * "Which of these squad players are you?" — a searchable grid of squad players, a live check
 * that the full name matches the squad sheet, and the leaderboard username.
 * The server enforces the same rules; this just gives instant feedback.
 */
export default function SquadIdentityFields({ players, error, fullName, playerId, username, onChange }) {
  const [query, setQuery] = useState("");
  const selected = players?.find((p) => p.id === playerId) ?? null;

  const shown = useMemo(() => {
    if (!players) return [];
    const q = query.trim().toLowerCase();
    return q ? players.filter((p) => p.name.toLowerCase().includes(q) || p.jersey === q) : players;
  }, [players, query]);

  const nameOk = selected && fullName.trim() ? namesMatch(fullName, selected.name) : null;
  const others = useMemo(() => (players ?? []).filter((p) => p.id !== playerId).map((p) => p.name), [players, playerId]);
  const userIssue = username ? usernameProblems(username, { otherSquadNames: others })[0] : null;

  return (
    <div className="fx-stack">
      <fieldset className="fx-field fx-squad-field">
        <legend>Which squad player are you?</legend>
        {error && <p className="fx-error-text">{error}</p>}
        {!players && !error && <p className="fx-muted fx-small">Loading the squad…</p>}
        {players && players.length === 0 && (
          <p className="fx-muted fx-small">Every squad player already has an account. If you&apos;re missing, ask a club admin to add you to the squad sheet.</p>
        )}
        {players && players.length > 8 && (
          <input
            type="search"
            className="fx-squad-search"
            placeholder="Search your name or jersey number"
            aria-label="Search the squad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {players && players.length > 0 && (
          <div className="fx-squad-grid" role="radiogroup" aria-label="Squad players">
            {shown.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={p.id === playerId}
                className={`fx-squad-card ${p.id === playerId ? "is-selected" : ""}`}
                onClick={() => onChange({ playerId: p.id })}
              >
                <Jersey name={p.name} jersey={p.jersey} size={52} />
                <span className="fx-squad-name">{p.name}</span>
                <span className="fx-squad-role">{ROLE_LABEL[p.role] ?? p.role}</span>
              </button>
            ))}
            {shown.length === 0 && <p className="fx-muted fx-small">No squad player matches “{query}”.</p>}
          </div>
        )}
      </fieldset>

      {selected && nameOk !== null && (
        <p className={`fx-small ${nameOk ? "fx-ok" : "fx-error-text"}`} role="status">
          {nameOk
            ? `✓ Your name matches ${selected.name} on the squad sheet.`
            : `Your full name must match the squad sheet: ${selected.name} (middle names optional).`}
        </p>
      )}

      <label className="fx-field">
        <span>Username (shown on the leaderboard)</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          value={username}
          onChange={(e) => onChange({ username: e.target.value })}
          aria-invalid={Boolean(userIssue)}
          required
        />
        <small className={userIssue ? "fx-error-text" : "fx-muted"}>{userIssue ?? USERNAME_RULE}</small>
      </label>
    </div>
  );
}
