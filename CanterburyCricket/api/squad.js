export default async function handler(req, res) {
  try {
    const base = process.env.SQUAD_API_URL;
    const key = process.env.SQUAD_API_KEY;

    if (!base || !key) {
      return res.status(500).json({ ok: false, error: "Missing server env vars" });
    }

    const url = new URL(base);
    url.searchParams.set("key", key);
    url.searchParams.set("_t", Date.now().toString());

    const r = await fetch(url.toString());
    const text = await r.text();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
