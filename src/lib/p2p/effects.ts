import type { Vendor } from "./types";

/** ntfy push to the vendor's phone. No personal data beyond the message. */
export function sendPush(
  v: Pick<Vendor, "ntfy"> | null | undefined,
  title: string,
  message: string,
): Promise<boolean> {
  const topic = v && v.ntfy;
  if (!topic || !/^[A-Za-z0-9_-]{8,64}$/.test(topic)) return Promise.resolve(false);

  // The panel has its own route: the notification must open it directly.
  const panel = window.location.origin + "/p2p/panel";
  const url =
    `https://ntfy.sh/${topic}?title=${encodeURIComponent(title)}` +
    `&priority=high&tags=zap&click=${encodeURIComponent(panel)}`;

  return fetch(url, { method: "POST", body: message })
    .then((r) => r.ok)
    .catch(() => false);
}

export function beep(): void {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    [0, 0.25].forEach((t0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + 0.2);
      o.start(ctx.currentTime + t0);
      o.stop(ctx.currentTime + t0 + 0.22);
    });
  } catch {
    /* autoplay policy */
  }
}

/** Canvas confetti celebration. Appends to <body> and removes itself. */
export function confetti(): void {
  const cv = document.createElement("canvas");
  // The canvas lives outside the app root, so the scoped stylesheet cannot
  // reach it: the original .confetti rule is applied inline.
  cv.style.position = "fixed";
  cv.style.inset = "0";
  cv.style.width = "100%";
  cv.style.height = "100%";
  cv.style.pointerEvents = "none";
  cv.style.zIndex = "50";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);

  const ctx = cv.getContext("2d");
  if (!ctx) {
    cv.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const COLORS = ["#F69433", "#FFD23F", "#74ACDF", "#EE4266", "#3BCEAC", "#111111", "#FFFFFF"];
  const parts = Array.from({ length: Math.round(Math.min(220, W / 2.2)) }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.32,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 15 - 5,
    w: 6 + Math.random() * 6,
    h: 3 + Math.random() * 5,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
    circle: Math.random() < 0.25,
  }));

  const start = performance.now();
  const DUR = 3800;

  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - DUR + 900) / 900);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1);
      }
      ctx.restore();
    }
    if (t < DUR) requestAnimationFrame(frame);
    else cv.remove();
  };

  requestAnimationFrame(frame);
}
