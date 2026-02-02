import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();

// ✅ Change if your originals live elsewhere.
// This should point to the folder where your current big photos are.
const INPUT_DIR = path.join(ROOT, "src", "assets", "Masonry");

// Output folders
const THUMBS_DIR = path.join(INPUT_DIR, "thumbs");
const PREVIEWS_DIR = path.join(INPUT_DIR, "previews");

// Image settings
const THUMB_WIDTH = 420;      // grid thumbnails
const PREVIEW_WIDTH = 1600;   // lightbox viewing
const THUMB_QUALITY = 62;     // webp quality
const PREVIEW_QUALITY = 78;

const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip output folders if they already exist
      if (full === THUMBS_DIR || full === PREVIEWS_DIR) continue;
      files.push(...walk(full));
    } else {
      const ext = path.extname(e.name);
      if (VALID_EXT.has(ext)) files.push(full);
    }
  }
  return files;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function toBaseName(filePath) {
  const name = path.basename(filePath);
  return name.replace(/\.(jpg|jpeg|png|webp)$/i, "");
}

async function main() {
  ensureDir(THUMBS_DIR);
  ensureDir(PREVIEWS_DIR);

  const files = walk(INPUT_DIR);

  if (!files.length) {
    console.log("No images found in:", INPUT_DIR);
    process.exit(0);
  }

  console.log(`Found ${files.length} images. Generating thumbs + previews...`);

  let done = 0;

  for (const file of files) {
    const base = toBaseName(file);
    const thumbOut = path.join(THUMBS_DIR, `${base}.webp`);
    const previewOut = path.join(PREVIEWS_DIR, `${base}.webp`);

    // Skip if already generated
    const thumbExists = fs.existsSync(thumbOut);
    const previewExists = fs.existsSync(previewOut);

    // Read once
    const img = sharp(file, { failOn: "none" }).rotate();

    if (!thumbExists) {
      await img
        .clone()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbOut);
    }

    if (!previewExists) {
      await img
        .clone()
        .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
        .webp({ quality: PREVIEW_QUALITY })
        .toFile(previewOut);
    }

    done++;
    if (done % 10 === 0 || done === files.length) {
      console.log(`Progress: ${done}/${files.length}`);
    }
  }

  console.log("✅ Done!");
  console.log("Thumbs:", THUMBS_DIR);
  console.log("Previews:", PREVIEWS_DIR);
  console.log("Next: your Masonry.jsx will auto-pick matching thumbs/previews by filename.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
