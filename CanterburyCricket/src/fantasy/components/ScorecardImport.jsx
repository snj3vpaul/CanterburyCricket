import { useRef, useState } from "react";
import { fantasyApi } from "../api";
import FormMessages from "./FormMessages";
import { MAX_UPLOAD_BASE64 } from "../shared/validation";

const MAX_SIDE = 2000; // px — plenty for reading a scorecard, small enough to upload fast

function fileToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(blob);
  });
}

/** Phone photos/screenshots can be several MB: shrink to ≤2000px JPEG before upload. */
async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return { name: file.name, mediaType: "image/jpeg", data: await fileToBase64(blob) };
}

async function prepare(file) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return { name: file.name, mediaType: "application/pdf", data: await fileToBase64(file) };
  }
  if (file.type.startsWith("image/")) return shrinkImage(file);
  throw new Error(`${file.name} isn't a PDF or an image.`);
}

/**
 * Step 0 of the post-match form: upload the CricHeroes scorecard (PDF from
 * "Share → PDF", or screenshots), or paste its text. Returns a draft via onDraft;
 * nothing is saved until the admin taps "Save & score".
 */
export default function ScorecardImport({ matchId, onDraft }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [pending, setPending] = useState(false);

  async function read() {
    setErrors([]);
    setPending(true);
    try {
      const prepared = await Promise.all(files.map(prepare));
      const size = prepared.reduce((n, f) => n + f.data.length, 0);
      if (size > MAX_UPLOAD_BASE64) throw Object.assign(new Error(), { errors: ["The upload is too large. Use the PDF, or fewer screenshots."] });
      const res = await fantasyApi("admin-read-scorecard", { matchId, files: prepared, text });
      onDraft(res.draft);
      setFiles([]);
      setText("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="fx-card fx-pad fx-import">
      <h3 className="fx-h3">0 · Read the CricHeroes scorecard</h3>
      <p className="fx-small fx-muted">
        In CricHeroes open the match → Scorecard → Share, and save it as a PDF (or take screenshots of both innings).
        Upload it here and the form below fills itself. Check it, then Save &amp; score.
      </p>

      <label className="fx-dropzone">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={(e) => { setFiles([...e.target.files].slice(0, 4)); setErrors([]); }}
        />
        <span>{files.length ? files.map((f) => f.name).join(", ") : "Choose scorecard PDF or screenshots (up to 4)"}</span>
      </label>

      <details className="fx-mt">
        <summary className="fx-small fx-summary">…or paste the scorecard text</summary>
        <textarea
          className="fx-paste"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full scorecard (both innings, result, player of the match)"
        />
      </details>

      <FormMessages errors={errors} />

      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block fx-mt"
        onClick={read}
        disabled={pending || (!files.length && text.trim().length < 20)}
      >
        {pending ? "Reading scorecard… (up to 30 seconds)" : "Read scorecard"}
      </button>
    </section>
  );
}
