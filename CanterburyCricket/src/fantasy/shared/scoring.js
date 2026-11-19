/**
 * Canterbury Fantasy — scoring matrix.
 * Pure functions (no I/O, no clock). Shared by the browser (live previews) and
 * api/fantasy.js (the authority), and covered by scoring.test.js.
 */

export const POINTS = Object.freeze({
  FIFTY: 10, // 50–99 runs
  HUNDRED: 25, // 100+ runs (replaces the fifty bonus, not added to it)
  WICKET: 15, // per wicket
  THREE_WICKET_BONUS: 10, // 3+ wickets in the match
  CATCH_OR_STUMPING: 5, // per dismissal in the field
  WIN: 5, // in the Canterbury XI when Canterbury win
  MOTM: 10,
  CAPTAIN_MULTIPLIER: 2,
});

export const PICK_COUNT = 5;
export const XI_SIZE = 11;

const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * Itemised base points for one player (before any captain multiplier).
 * @param {string} playerId
 * @param {{winningTeam:string, motmPlayerId:string|null, playingXI:string[], stats:{playerId:string,runs:number,wickets:number,catches:number}[]}} result
 * @returns {{label:string, points:number}[]}
 */
export function scorePlayer(playerId, result) {
  if (!result.playingXI.includes(playerId)) return [];
  const line = result.stats.find((s) => s.playerId === playerId) ?? { runs: 0, wickets: 0, catches: 0 };
  const items = [];

  if (line.runs >= 100) items.push({ label: `100+ Runs (${line.runs})`, points: POINTS.HUNDRED });
  else if (line.runs >= 50) items.push({ label: `50+ Runs (${line.runs})`, points: POINTS.FIFTY });

  if (line.wickets > 0) {
    items.push({ label: `${line.wickets} ${plural(line.wickets, "Wicket", "Wickets")}`, points: line.wickets * POINTS.WICKET });
    if (line.wickets >= 3) items.push({ label: "3+ Wickets Bonus", points: POINTS.THREE_WICKET_BONUS });
  }
  if (line.catches > 0) {
    items.push({
      label: `${line.catches} ${plural(line.catches, "Catch/Stumping", "Catches/Stumpings")}`,
      points: line.catches * POINTS.CATCH_OR_STUMPING,
    });
  }
  if (result.winningTeam === "CANTERBURY") items.push({ label: "Winning Team", points: POINTS.WIN });
  if (result.motmPlayerId === playerId) items.push({ label: "Man of the Match", points: POINTS.MOTM });
  return items;
}

/** Score a member's 5 picks; the captain's points are doubled. */
export function scorePrediction(prediction, result, playerNames = {}) {
  const picks = prediction.selectedPlayerIds.map((playerId) => {
    const items = scorePlayer(playerId, result);
    const basePoints = items.reduce((sum, i) => sum + i.points, 0);
    const isCaptain = playerId === prediction.captainId;
    const multiplier = isCaptain ? POINTS.CAPTAIN_MULTIPLIER : 1;
    return {
      playerId,
      playerName: playerNames[playerId] ?? "Unknown player",
      isCaptain,
      items,
      basePoints,
      multiplier,
      total: basePoints * multiplier,
    };
  });
  return { total: picks.reduce((sum, p) => sum + p.total, 0), picks };
}

/** "50+ Runs (55) (10) x2 Captain = 20 pts" */
export function describeItem(item, multiplier) {
  return multiplier > 1
    ? `${item.label} (${item.points}) x${multiplier} Captain = ${item.points * multiplier} pts`
    : `${item.label} = ${item.points} pts`;
}
