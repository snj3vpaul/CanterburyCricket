/** Tiny client for /api/fantasy. Throws an Error with `.errors` (string[]) and `.status` on failure. */
export async function fantasyApi(action, body, query = {}) {
  const qs = new URLSearchParams({ action, ...query });
  const res = await fetch(`/api/fantasy?${qs}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON (e.g. the API isn't running under `vite dev`)
  }
  if (!res.ok || !json) {
    const err = new Error(json?.errors?.[0] || "The member service is unavailable. Please try again shortly.");
    err.errors = json?.errors || [err.message];
    err.status = res.status;
    throw err;
  }
  return json;
}

const torontoDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto",
});
const torontoDay = new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", timeZone: "America/Toronto" });

export const formatWhen = (iso) => torontoDate.format(new Date(iso));
export const formatDay = (iso) => torontoDay.format(new Date(iso));
export const MATCH_TYPE_LABEL = { T20: "T20", T30: "T30", ONE_DAY: "One-day", TWO_DAY: "Two-day" };
