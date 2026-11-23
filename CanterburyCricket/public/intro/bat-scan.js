/*
 * Canterbury CC intro: an ASCII "specimen scan" of a rotating 3D cricket bat with HUD labels.
 * Plain JS, no libraries. Started by the tiny bootstrap in index.html, which has already checked
 * that this is the first page of the visit, motion is allowed, and the visitor isn't a crawler.
 *
 * How it draws: the bat is described as a signed-distance shape (blade, spine, shoulders, handle,
 * grip). For each character cell we cast a ray at it, shade the surface it hits, and pick a
 * character from a brightness ramp. Labels are 3D points on the bat, projected to the screen.
 */
(function () {
  "use strict";
  var root = document.getElementById("ccIntro");
  if (!root) return;

  var DURATION = 2600; // ms of scanning before the reveal
  var FADE = 450;
  var RAMP = " .,:;-=+*%#@";
  var LABELS = [
    { at: [0, -0.33, 0.03], name: "SWEET SPOT", note: "middle of the blade" },
    { at: [0.055, -0.12, 0], name: "EDGE", note: "willow, 40 mm" },
    { at: [0, -0.49, 0], name: "TOE", note: "knocked in" },
    { at: [0, 0.07, 0], name: "SHOULDER", note: "splice joint" },
    { at: [0, 0.25, 0], name: "GRIP", note: "cane handle" },
  ];

  // ---------- shape ----------
  function len3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }
  function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  function roundBox(px, py, pz, bx, by, bz, r) {
    var qx = Math.abs(px) - bx + r, qy = Math.abs(py) - by + r, qz = Math.abs(pz) - bz + r;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
  }
  function capsuleY(px, py, pz, y0, y1, r) {
    var y = Math.min(Math.max(py, y0), y1);
    return len3(px, py - y, pz) - r;
  }
  // Bat stands upright: toe at y = -0.5, top of handle at y = +0.38. Face looks towards +z.
  function bat(px, py, pz) {
    var blade = roundBox(px, py + 0.215, pz - 0.004, 0.054, 0.285, 0.017, 0.008);
    // Raised spine on the back of the blade, deepest near the sweet spot
    var t = Math.min(Math.max((py + 0.33) / 0.22, -1.6), 1.6);
    var spineR = 0.026 * (1 - 0.28 * t * t);
    var spine = len3(px / 1.9, 0, pz + 0.012) - Math.max(spineR, 0.006);
    spine = Math.max(spine, Math.abs(py + 0.24) - 0.25);
    var body = smin(blade, spine, 0.02);
    var handle = capsuleY(px, py, pz, 0.05, 0.37, 0.0165);
    var grip = py > 0.12 && py < 0.36 ? 0.0012 * Math.sin(py * 260) : 0; // wrapped grip rings
    return smin(body, handle + grip, 0.045);
  }

  // ---------- layout ----------
  var pre = root.querySelector("pre");
  var hud = root.querySelector("canvas");
  var ctx = hud.getContext("2d");
  var cols, rows, cellW, cellH, scale, cx, cy, dpr;
  var ROLL = -0.62; // the bat leans across the screen like a drive through the covers
  var cr = Math.cos(ROLL), sr = Math.sin(ROLL);

  function layout() {
    var w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var fontPx = w < 600 ? 6 : 8;
    pre.style.fontSize = fontPx + "px";
    pre.textContent = "MMMMMMMMMMMMMMMMMMMM"; // measure this device's monospace width
    cellW = pre.getBoundingClientRect().width / 20 || fontPx * 0.6; cellH = fontPx;
    var boxW = Math.min(w * 0.94, 760), boxH = Math.min(h * 0.74, 720);
    cols = Math.floor(boxW / cellW); rows = Math.floor(boxH / cellH);
    pre.style.fontSize = fontPx + "px";
    pre.style.lineHeight = cellH + "px";
    scale = Math.min(boxH / 0.78, boxW / 0.62); // world units -> px
    cx = w / 2; cy = h / 2;
    hud.width = w * dpr; hud.height = h * dpr;
    hud.style.width = w + "px"; hud.style.height = h + "px";
  }

  // ---------- render one frame ----------
  var lx = -0.45, ly = 0.55, lz = 0.7, ll = len3(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;

  function frame(time) {
    var a = time * 0.0011 + 0.6;              // spin around the bat's long axis
    var tilt = 0.22 * Math.sin(time * 0.0007); // gentle nod
    var ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
    var gridW = cols * cellW, gridH = rows * cellH;
    var out = "";
    for (var r = 0; r < rows; r++) {
      var gy = -((r + 0.5) * cellH - gridH / 2) / scale;
      var line = "";
      for (var c = 0; c < cols; c++) {
        var gx = ((c + 0.5) * cellW - gridW / 2) / scale;
        // undo the lean, then skip cells that are clearly nowhere near the bat
        var sx = gx * cr + gy * sr, sy = -gx * sr + gy * cr - 0.06; // bat centre is at y = -0.06
        if (Math.abs(sx) > 0.085 || sy < -0.56 || sy > 0.43) { line += " "; continue; }
        // Orthographic ray from z = 0.2 travelling to -z, transformed into bat space
        var d = 0, hit = false, px, py, pz;
        for (var i = 0; i < 34; i++) {
          var wz = 0.2 - d;
          // undo tilt (about x) then spin (about y)
          var y1 = sy * ct + wz * st, z1 = -sy * st + wz * ct;
          px = sx * ca - z1 * sa; pz = sx * sa + z1 * ca; py = y1;
          var dist = bat(px, py, pz);
          if (dist < 0.0015) { hit = true; break; }
          d += dist;
          if (d > 0.4) break;
        }
        if (!hit) { line += " "; continue; }
        var e = 0.002;
        var nx = bat(px + e, py, pz) - bat(px - e, py, pz);
        var ny = bat(px, py + e, pz) - bat(px, py - e, pz);
        var nz = bat(px, py, pz + e) - bat(px, py, pz - e);
        var nl = len3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        // bring the normal back to view space to light it from a fixed direction
        var vx = nx * ca + nz * sa, vz0 = -nx * sa + nz * ca;
        var vy0 = ny * ct - vz0 * st, vz = ny * st + vz0 * ct;
        var vx0 = vx; vx = vx0 * cr - vy0 * sr; var vy = vx0 * sr + vy0 * cr; // re-apply the lean
        var ndl = vx * lx + vy * ly + vz * lz;
        var diff = Math.max(0, ndl);
        var hz = lz + 1, hl = len3(lx, ly, hz);                       // Blinn-Phong highlight
        var spec = Math.pow(Math.max(0, (vx * lx + vy * ly + vz * hz) / hl), 24);
        var rim = Math.pow(1 - Math.abs(vz), 4) * 0.35;
        var b = Math.min(0.999, 0.04 + diff * diff * 0.75 + spec * 0.6 + rim);
        line += RAMP.charAt(1 + Math.floor(b * (RAMP.length - 1)));
      }
      out += line + "\n";
    }
    pre.textContent = out;
    drawHud(time, ca, sa, ct, st);
  }

  // ---------- HUD ----------
  function project(p, ca, sa, ct, st) {
    var x = p[0] * ca + p[2] * sa, z0 = -p[0] * sa + p[2] * ca;
    var y = p[1] * ct - z0 * st + 0.06;
    var X = x * cr - y * sr, Y = x * sr + y * cr;
    return [cx + X * scale, cy - Y * scale];
  }
  function corners(x, y, s) {
    var k = s * 0.35;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s + k); ctx.lineTo(x - s, y - s); ctx.lineTo(x - s + k, y - s);
    ctx.moveTo(x + s - k, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y - s + k);
    ctx.moveTo(x + s, y + s - k); ctx.lineTo(x + s, y + s); ctx.lineTo(x + s - k, y + s);
    ctx.moveTo(x - s + k, y + s); ctx.lineTo(x - s, y + s); ctx.lineTo(x - s, y + s - k);
    ctx.stroke();
  }
  function drawHud(time, ca, sa, ct, st) {
    var w = hud.width / dpr, h = hud.height / dpr, small = w < 600;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.font = (small ? 10 : 11) + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";

    // Label of the moment: one at a time, ~0.5 s each
    var slot = Math.floor(time / 520) % LABELS.length;
    var local = (time % 520) / 520;
    var L = LABELS[slot];
    var p = project(L.at, ca, sa, ct, st);
    var gold = "rgba(217,180,90,";
    var size = 12 + 4 * (1 - local);
    ctx.strokeStyle = gold + "0.95)";
    corners(p[0], p[1], size);
    var side = p[0] < cx ? -1 : 1;
    var ex = p[0] + side * (small ? 46 : 90), ey = p[1] - 22;
    ctx.beginPath(); ctx.moveTo(p[0] + side * size, p[1]); ctx.lineTo(ex, ey); ctx.lineTo(ex + side * 14, ey); ctx.stroke();
    var shown = Math.ceil(Math.min(1, local * 2.2) * L.name.length);
    ctx.fillStyle = "rgba(246,242,234,0.95)";
    ctx.textAlign = side > 0 ? "left" : "right";
    ctx.fillText(L.name.slice(0, shown), ex + side * 18, ey - 7);
    ctx.fillStyle = gold + "0.8)";
    ctx.fillText(local > 0.35 ? L.note : "", ex + side * 18, ey + 8);

    // Frame furniture
    var pct = Math.min(100, Math.floor((time / DURATION) * 100));
    var m = small ? 16 : 28;
    ctx.fillStyle = "rgba(246,242,234,0.55)";
    ctx.textAlign = "left";
    ctx.fillText("CANTERBURY CC / SPECIMEN 1983", m, m + 4);
    ctx.fillText("ENGLISH WILLOW · " + (small ? "" : "SHORT HANDLE · ") + "2.8 LB", m, m + 20);
    ctx.textAlign = "right";
    ctx.fillText("SCAN " + (pct < 10 ? "0" : "") + pct + "%", w - m, m + 4);
    ctx.fillText("ROT " + ((((time * 0.0011 + 0.6) * 57.3) % 360) | 0) + "°", w - m, m + 20);
    ctx.textAlign = "center";
    ctx.fillStyle = gold + "0.9)";
    ctx.fillText("CANTERBURY CRICKET CLUB · OTTAWA", w / 2, h - m - 18);
    ctx.fillStyle = "rgba(246,242,234,0.4)";
    ctx.fillText(small ? "TAP TO SKIP" : "CLICK OR PRESS ESC TO SKIP", w / 2, h - m);
    // progress hairline
    ctx.fillStyle = gold + "0.9)";
    ctx.fillRect(0, h - 1, (w * pct) / 100, 1);
  }

  // ---------- run ----------
  var start = null, raf = 0, last = 0, done = false;
  function tick(now) {
    if (start === null) start = now;
    var t = now - start;
    if (now - last > 30) { last = now; frame(t); } // ~30 fps is plenty for ASCII
    if (t >= DURATION) finish(); else raf = requestAnimationFrame(tick);
  }
  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    root.classList.add("is-leaving");
    setTimeout(function () {
      root.remove();
      document.documentElement.classList.remove("cc-intro");
    }, FADE);
  }
  function skip(e) { if (!e.key || e.key === "Escape") finish(); }
  root.addEventListener("click", skip);
  window.addEventListener("keydown", skip);
  document.addEventListener("visibilitychange", function () { if (document.hidden) finish(); });
  window.addEventListener("resize", layout);
  layout();
  raf = requestAnimationFrame(tick);
  setTimeout(finish, DURATION + 1500); // safety net: never keep the overlay if anything stalls
})();
