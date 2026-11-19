/**
 * Public squad list for the Our Squad page (proxies the club's Google Sheet).
 * Only the fields the page needs are returned; form metadata such as the
 * submission Timestamp is dropped, and errors never echo internal details.
 */
const PUBLIC_FIELDS = ["Full Name", "Playing Role", "Playing Style", "Bowling Style", "Jersey Number", "Photo for Squad Banner"];

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    const base = process.env.SQUAD_API_URL;
    const key = process.env.SQUAD_API_KEY;

    if (!base || !key) {
      console.error("[squad] SQUAD_API_URL / SQUAD_API_KEY not set");
      return res.status(500).json({ ok: false, error: "Squad list unavailable" });
    }

    const url = new URL(base);
    url.searchParams.set("key", key);
    url.searchParams.set("_t", Date.now().toString());

    const r = await fetch(url.toString());
    const json = await r.json();

    const data = Array.isArray(json?.data)
      ? json.data.map((row) => Object.fromEntries(PUBLIC_FIELDS.filter((f) => f in row).map((f) => [f, row[f]])))
      : [];

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(r.ok ? 200 : 502).json({ ok: Boolean(json?.ok) && r.ok, updatedAt: json?.updatedAt, count: data.length, data });
  } catch (e) {
    console.error("[squad] fetch failed:", e?.message || e);
    return res.status(502).json({ ok: false, error: "Squad list unavailable" });
  }
}
