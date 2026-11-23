import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();

// ✅ Change if your originals live elsewhere.
// This should point to the folder where your current big photos are.
const INPUT_DIR = path.join(ROOT, "src", "assets", "gallery");

// Output folders
const THUMBS_DIR = path.join(INPUT_DIR, "thumbs");
const PREVIEWS_DIR = path.join(INPUT_DIR, "previews");

// Image settings
const THUMB_WIDTH = 420;      // grid thumbnails
const PREVIEW_MAX = 1600;     // lightbox viewing: longest edge (portrait shots are capped too)
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
        .resize({ width: PREVIEW_MAX, height: PREVIEW_MAX, fit: "inside", withoutEnlargement: true })
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
  // Record thumbnail sizes so the gallery can reserve each tile's space before the photo loads.
  const dimensions = {};
  for (const f of fs.readdirSync(THUMBS_DIR).sort()) {
    const { width, height } = await sharp(path.join(THUMBS_DIR, f)).metadata();
    dimensions[path.parse(f).name] = [width, height];
  }
  fs.writeFileSync(path.join(INPUT_DIR, "dimensions.json"), JSON.stringify(dimensions) + "\n");
  console.log("Sizes written to dimensions.json. GalleryPage.jsx picks up new photos by file name.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
