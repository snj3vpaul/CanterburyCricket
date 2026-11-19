import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMember } from "../fantasy/MemberContext";
import { fantasyApi, formatDay, formatWhen, MATCH_TYPE_LABEL } from "../fantasy/api";
import PredictionForm from "../fantasy/components/PredictionForm";
import LeaderboardTable from "../fantasy/components/LeaderboardTable";
import FormMessages from "../fantasy/components/FormMessages";
import { POINTS } from "../fantasy/shared/scoring";
import "../fantasy/fantasy.css";

const RESULT_LABEL = { CANTERBURY: "Canterbury won", OPPONENT: "Lost", TIE: "Tie", NO_RESULT: "No result" };

export default function Fantasy() {
  const { member, setMember, signOut } = useMember();
  const navigate = useNavigate();
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    fantasyApi("state")
      .then((v) => {
        if (!alive) return;
        setView(v);
        setMember(v.me);
      })
      .catch((err) => {
        if (!alive) return;
        if (err.status === 401) navigate("/member-login?next=/fantasy", { replace: true });
        else setError(err.errors || [err.message]);
      });
    return () => {
      alive = false;
    };
  }, [navigate, setMember]);

  if (error) return <div className="fx-page"><FormMessages errors={error} /></div>;
  if (!view) return <div className="fx-page"><p className="fx-muted" aria-busy="true">Loading the Fantasy League…</p></div>;

  const me = view.me;
  const nextMatch = view.matches.find((m) => m.status === "UPCOMING" || m.status === "LOCKED");
  const history = view.matches.filter((m) => m.status === "COMPLETED" && m.myPrediction).reverse();
  const xi = new Map(nextMatch?.playingXI.map((p) => [p.id, p]) ?? []);
  const xiReady = xi.size === 11;
  const mine = nextMatch?.myPrediction;
  const dropped = mine?.selectedPlayerIds.filter((id) => !xi.has(id)) ?? [];

  async function handleSignOut() {
    await signOut();
    navigate("/member-login", { replace: true });
  }

  return (
    <div className="fx-page">
      <header className="fx-hero">
        <div>
          <p className="fx-eyebrow">Members only</p>
          <h1 className="fx-title">Fantasy League</h1>
          <p className="fx-muted">Welcome back, {me.name.split(" ")[0]}.</p>
        </div>
        <div className="fx-hero-actions">
          {member?.role === "ADMIN" && <Link to="/fantasy/admin" className="fx-btn fx-btn-ghost">Admin</Link>}
          <button type="button" className="fx-btn fx-btn-ghost" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

{me.isClubAccount ? (
        <p className="fx-card fx-pad fx-small fx-muted fx-mt">
          You&apos;re signed in as the club&apos;s moderator account. It runs the league but doesn&apos;t play, so it has no
          picks or points. Use <strong>Admin</strong> to approve players, set up matches and enter results.
        </p>
      ) : (
            <div className="fx-stats">
        <div className="fx-card fx-stat"><span>Season points</span><strong>{me.totalFantasyPoints}</strong></div>
        <div className="fx-card fx-stat"><span>Rank</span><strong>{me.rank ? `#${me.rank}` : "—"}</strong></div>
      </div>
      )}

      <section className="fx-section">
        <h2 className="fx-h2">Next match</h2>
        {!nextMatch ? (
          <p className="fx-card fx-pad fx-muted">No fixtures scheduled yet. Check back soon.</p>
        ) : (
          <div className="fx-card fx-match">
            <div className="fx-match-head">
              <p className="fx-eyebrow">{MATCH_TYPE_LABEL[nextMatch.matchType]}</p>
              <h3>Canterbury vs {nextMatch.opponent}</h3>
              <p className="fx-muted">{formatWhen(nextMatch.date)} · {nextMatch.venue}</p>
            </div>

            <div className="fx-pad fx-stack">
              {mine && !editing && (
                <div>
                  <p className="fx-small fx-muted">Your picks</p>
                  <ul className="fx-chips">
                    {mine.selectedPlayerIds.map((id) => (
                      <li key={id} className={`fx-chip ${id === mine.captainId ? "is-captain" : ""} ${xi.has(id) ? "" : "is-dropped"}`}>
                        {xi.get(id)?.name ?? "Dropped player"}{id === mine.captainId && " (C)"}
                      </li>
                    ))}
                  </ul>
                  {dropped.length > 0 && nextMatch.isOpen && (
                    <p className="fx-error-text fx-small">A player you picked is no longer in the XI and will score 0. Update your team.</p>
                  )}
                </div>
              )}

              {!xiReady ? (
                <p className="fx-muted">The Playing XI hasn&apos;t been announced yet.</p>
              ) : editing ? (
                <>
                  <PredictionForm
                    match={nextMatch}
                    onSaved={(v) => { setView(v); setMember(v.me); setEditing(false); }}
                  />
                  <button type="button" className="fx-btn fx-btn-ghost fx-btn-block" onClick={() => setEditing(false)}>Cancel</button>
                </>
              ) : me.isClubAccount ? (
                <p className="fx-muted">Picks are open for players. As moderator you can set the XI and enter results in Admin.</p>
              ) : nextMatch.isOpen ? (
                <>
                  <button type="button" className="fx-btn fx-btn-primary fx-btn-block" onClick={() => setEditing(true)}>
                    {mine ? "Edit your prediction" : "Make your prediction"}
                  </button>
                  <p className="fx-small fx-muted fx-center">Picks lock {formatWhen(nextMatch.predictionsLockAt)}</p>
                </>
              ) : (
                <p className="fx-muted">Predictions are closed. Points are added after the match.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="fx-section">
        <h2 className="fx-h2">Leaderboard</h2>
        <LeaderboardTable rows={view.leaderboard} currentUserId={me.id} />
      </section>

      {history.length > 0 && (
        <section className="fx-section">
          <h2 className="fx-h2">My results</h2>
          <ul className="fx-stack">
            {history.map((m) => (
              <li key={m.id} className="fx-card fx-pad fx-row-between">
                <span>
                  <strong>vs {m.opponent}</strong>
                  <span className="fx-small fx-muted"> · {formatDay(m.date)} · {RESULT_LABEL[m.result?.winningTeam] ?? ""}</span>
                </span>
                <strong>{m.myPrediction.totalPoints} pts</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="fx-card fx-pad fx-section">
        <summary className="fx-summary">How points work</summary>
        <p className="fx-small fx-muted">
          Pick 5 players from the official Playing XI: at least 2 batters/keepers and 2 bowlers/all-rounders. Make one your captain; they score double.
        </p>
        <dl className="fx-rules">
          <dt>50+ runs</dt><dd>+{POINTS.FIFTY}</dd>
          <dt>100+ runs</dt><dd>+{POINTS.HUNDRED}</dd>
          <dt>Each wicket</dt><dd>+{POINTS.WICKET}</dd>
          <dt>3+ wickets bonus</dt><dd>+{POINTS.THREE_WICKET_BONUS}</dd>
          <dt>Catch / stumping</dt><dd>+{POINTS.CATCH_OR_STUMPING}</dd>
          <dt>Canterbury win</dt><dd>+{POINTS.WIN}</dd>
          <dt>Man of the Match</dt><dd>+{POINTS.MOTM}</dd>
          <dt>Captain</dt><dd>×{POINTS.CAPTAIN_MULTIPLIER}</dd>
        </dl>
      </details>
    </div>
  );
}
