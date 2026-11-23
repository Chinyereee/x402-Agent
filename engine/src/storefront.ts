import type { EngineConfig } from './config.js';

/**
 * The engine's front door (GET /): a small shop page that says what it sells,
 * what it costs and how to pay. Static, free, and never behind the paywall.
 *
 * Night look: a drifting aurora, gold dust falling over the page (a small canvas),
 * the porcelain shop glowing, a shimmering title and glass cards. Everything that
 * moves stops for people who ask their system for reduced motion.
 */
export function storefront(config: Pick<EngineConfig, 'price' | 'network'>, migratePath: string): string {
  const testnet = config.network === 'stellar:testnet';
  const price = config.price.startsWith('$') ? config.price : `$${config.price}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>402 Found · codemod engine</title>
<link rel="icon" type="image/png" href="/assets/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap">
<style>
  :root {
    --ink: #eef1ff; --sub: #a3acd0; --line: rgba(170, 185, 255, 0.16);
    --cobalt: #5b74f0; --violet: #9b6bff; --teal: #3fd5c0; --gold: #e6c068; --gold-deep: #b8892f;
    --night: #060a1c;
  }
  * { box-sizing: border-box; }
  html { background: var(--night); }
  body { margin: 0; min-height: 100vh; font: 16px/1.6 Inter, system-ui, sans-serif; color: var(--ink); background: var(--night); overflow-x: hidden; }

  /* the sky: three slow aurora clouds over deep night */
  .sky { position: fixed; inset: -20%; z-index: 0; pointer-events: none;
    background:
      radial-gradient(38% 30% at 20% 18%, rgba(70, 96, 240, 0.42), transparent 70%),
      radial-gradient(34% 28% at 82% 12%, rgba(155, 107, 255, 0.34), transparent 70%),
      radial-gradient(42% 34% at 70% 88%, rgba(63, 213, 192, 0.20), transparent 70%),
      radial-gradient(30% 24% at 12% 80%, rgba(230, 192, 104, 0.14), transparent 70%),
      linear-gradient(180deg, #060a1c 0%, #0a1033 55%, #0d0b2e 100%);
    animation: drift 26s ease-in-out infinite alternate; }
  @keyframes drift { from { transform: translate3d(-2%, -1%, 0) rotate(-2deg) scale(1); } to { transform: translate3d(2%, 1.5%, 0) rotate(2deg) scale(1.06); } }
  .grain { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .5;
    background-image: radial-gradient(rgba(255,255,255,.55) 0.6px, transparent 0.8px), radial-gradient(rgba(255,255,255,.35) 0.5px, transparent 0.7px);
    background-size: 160px 160px, 97px 97px; background-position: 0 0, 40px 60px; }
  #dust { position: fixed; inset: 0; z-index: 1; pointer-events: none; }

  main { position: relative; z-index: 2; width: min(680px, 100%); margin: 0 auto; padding: 8vh 20px 56px; text-align: center; }
  .halo { position: relative; display: inline-block; }
  .halo::before { content: ""; position: absolute; inset: -38px; border-radius: 50%;
    background: radial-gradient(circle, rgba(230, 192, 104, 0.35), rgba(91, 116, 240, 0.18) 45%, transparent 70%);
    filter: blur(6px); animation: breathe 5s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: .65; transform: scale(.94); } 50% { opacity: 1; transform: scale(1.04); } }
  .shop { position: relative; width: 160px; height: auto; filter: drop-shadow(0 0 26px rgba(140, 160, 255, 0.45)) drop-shadow(0 16px 26px rgba(0, 0, 0, 0.55)); animation: float 7s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  .eyebrow { margin: 22px 0 10px; color: var(--gold); font-size: 12px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; text-shadow: 0 0 14px rgba(230, 192, 104, 0.55); }
  h1 { margin: 0 0 14px; font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: clamp(32px, 5.4vw, 48px); line-height: 1.1;
    background: linear-gradient(100deg, #f7dc93 0%, #e6c068 18%, #ffffff 34%, #8da0ff 52%, #b58cff 70%, #f7dc93 100%);
    background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: shimmer 9s linear infinite; filter: drop-shadow(0 0 18px rgba(141, 160, 255, 0.25)); }
  @keyframes shimmer { from { background-position: 0% 50%; } to { background-position: 220% 50%; } }
  .lede { margin: 0 auto 28px; max-width: 500px; color: var(--sub); }

  .price { position: relative; display: inline-flex; align-items: baseline; gap: 8px; padding: 12px 26px; border-radius: 999px; color: #fff; font-weight: 600; font-size: 18px; overflow: hidden;
    background: linear-gradient(135deg, #2b3fbf, #5b3fd0 60%, #2b3fbf);
    border: 1px solid rgba(230, 192, 104, 0.75);
    box-shadow: 0 0 0 4px rgba(230, 192, 104, 0.10), 0 0 30px rgba(91, 116, 240, 0.55), 0 0 60px rgba(155, 107, 255, 0.25); }
  .price::after { content: ""; position: absolute; top: 0; bottom: 0; width: 40%; left: -60%;
    background: linear-gradient(100deg, transparent, rgba(255, 236, 180, 0.55), transparent); transform: skewX(-20deg); animation: sweep 3.6s ease-in-out infinite; }
  @keyframes sweep { 0%, 55% { left: -60%; } 100% { left: 130%; } }
  .price b { color: #ffe7a6; text-shadow: 0 0 12px rgba(255, 220, 140, 0.8); }
  .price small { font-weight: 500; opacity: 0.85; }

  ol { margin: 38px 0 0; padding: 0; list-style: none; text-align: left; display: grid; gap: 12px; }
  li { position: relative; padding: 16px 20px; border-radius: 16px; background: rgba(14, 20, 52, 0.62); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border: 1px solid transparent; background-clip: padding-box; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); }
  li::before { content: ""; position: absolute; inset: -1px; border-radius: 17px; padding: 1px; pointer-events: none;
    background: linear-gradient(120deg, rgba(230, 192, 104, 0.7), rgba(91, 116, 240, 0.5), rgba(155, 107, 255, 0.5), rgba(63, 213, 192, 0.5));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
  li b { display: block; font-size: 15px; color: #fff; }
  li b em { font-style: normal; color: var(--gold); }
  li span { color: var(--sub); font-size: 14px; }
  code { color: #c9d3ff; }

  pre { margin: 20px 0 0; padding: 16px 18px; border-radius: 14px; text-align: left; font: 13px/1.7 ui-monospace, Menlo, monospace; overflow-x: auto;
    background: rgba(4, 8, 24, 0.85); color: #9ff3e3; border: 1px solid rgba(63, 213, 192, 0.35); box-shadow: 0 0 24px rgba(63, 213, 192, 0.18), inset 0 0 30px rgba(63, 213, 192, 0.05); }
  pre .c { color: #f7c96b; text-shadow: 0 0 10px rgba(247, 201, 107, 0.6); }

  .fine { margin-top: 24px; color: var(--sub); font-size: 13px; }
  a { color: #9fb0ff; text-decoration: none; border-bottom: 1px solid rgba(159, 176, 255, 0.4); }
  a:hover { color: #ffe7a6; border-bottom-color: rgba(255, 231, 166, 0.7); }
  .bos { display: flex; justify-content: center; align-items: center; gap: 7px; margin: 20px 0 0; color: var(--sub); font-size: 12px; }
  .bos img { height: 15px; width: auto; }
  .notice { max-width: 540px; margin: 10px auto 0; color: var(--sub); font-size: 11.5px; opacity: 0.75; }

  @media (prefers-reduced-motion: reduce) {
    .sky, .halo::before, .shop, h1, .price::after { animation: none; }
    #dust { display: none; }
  }
</style>
</head>
<body>
<div class="sky" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<canvas id="dust" aria-hidden="true"></canvas>
<main>
  <div class="halo"><img class="shop" src="/assets/shop.webp" alt="A small porcelain shop"></div>
  <p class="eyebrow">402 Found · codemod engine</p>
  <h1>Upgrade ethers v5 to v6, delivered as a pull request</h1>
  <p class="lede">A small shop for AI agents. No sign-up, no card: your agent asks, sees the price, pays per job in USDC on Stellar${testnet ? ' testnet' : ''}, and gets a pull request back.</p>
  <span class="price"><b>${price}</b> <small>USDC per upgrade</small></span>
  <ol>
    <li><b><em>1</em> · Ask</b><span><code>POST ${migratePath}</code> with <code>{"repoUrl": "https://github.com/owner/repo"}</code>. A free check comes first: if we can't do the job, you are never asked to pay.</span></li>
    <li><b><em>2</em> · See the price</b><span>The answer is HTTP 402 with the price, the asset and where to pay, in the <code>PAYMENT-REQUIRED</code> header (x402).</span></li>
    <li><b><em>3</em> · Pay and get the work</b><span>Retry with a signed payment from any x402 client. We open the pull request, then settle. If the job fails, nothing is charged; if settling fails, the pull request is withdrawn.</span></li>
  </ol>
  <pre>curl -i -X POST ${migratePath} -H 'content-type: application/json' -d '{"repoUrl":"https://github.com/owner/repo"}'
<span class="c"># HTTP/1.1 402 Payment Required</span></pre>
  <p class="fine">${testnet ? 'Test network, test money only. ' : ''}Code: <a href="https://github.com/Chinyereee/x402-Agent">github.com/Chinyereee/x402-Agent</a></p>
  <p class="bos">Built on <img src="/assets/stellar-logo-white.png" alt="Stellar"></p>
  <p class="notice">“Stellar” is a trademark of the Stellar Development Foundation. All rights reserved. This is independent software, not affiliated with, sponsored or endorsed by the Stellar Development Foundation.</p>
</main>
<script>
  // Gold dust: small glints drifting down, swaying, now and then catching the light.
  (function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.getElementById('dust'), x = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, ps = [];
    function size() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function make(top) {
      return { x: Math.random() * W, y: top ? -10 : Math.random() * H, r: 0.6 + Math.random() * 1.8, vy: 0.25 + Math.random() * 0.7,
        sway: 0.4 + Math.random() * 1.2, ph: Math.random() * 6.28, tw: 0.02 + Math.random() * 0.05, hue: Math.random() < 0.8 ? 44 : 32 };
    }
    size(); addEventListener('resize', size);
    var n = Math.round(Math.min(140, (W * H) / 9000));
    for (var i = 0; i < n; i++) ps.push(make(false));
    function frame() {
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.ph += p.tw; p.y += p.vy; p.x += Math.sin(p.ph) * p.sway * 0.35;
        if (p.y > H + 10) ps[i] = p = make(true);
        var glint = 0.45 + 0.55 * Math.max(0, Math.sin(p.ph * 1.7));
        var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, 'hsla(' + p.hue + ', 95%, 80%, ' + (0.95 * glint) + ')');
        g.addColorStop(0.35, 'hsla(' + p.hue + ', 85%, 60%, ' + (0.45 * glint) + ')');
        g.addColorStop(1, 'hsla(' + p.hue + ', 80%, 50%, 0)');
        x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 4, 0, 6.283); x.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
</script>
</body>
</html>`;
}
