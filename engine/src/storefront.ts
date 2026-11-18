import type { EngineConfig } from './config.js';

/**
 * The engine's front door (GET /): a small shop page that says what it sells,
 * what it costs and how to pay. Static, free, and never behind the paywall.
 */
export function storefront(config: Pick<EngineConfig, 'price' | 'network'>, migratePath: string): string {
  const testnet = config.network === 'stellar:testnet';
  const price = config.price.startsWith('$') ? config.price : `$${config.price}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>402 Found · codemod engine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap">
<style>
  :root { --ink: #161b33; --sub: #6a7089; --line: #e4e7f1; --cobalt: #2443b5; --gold: #a9843f; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; font: 16px/1.6 Inter, system-ui, sans-serif; color: var(--ink);
    background: radial-gradient(40% 35% at 18% 12%, rgba(54, 92, 214, 0.1), transparent 70%), radial-gradient(35% 30% at 85% 8%, rgba(214, 178, 104, 0.14), transparent 70%), #fbfbfd; }
  main { width: min(640px, 100%); margin: 0 auto; padding: 8vh 20px 48px; text-align: center; }
  .shop { width: 150px; height: auto; filter: drop-shadow(0 14px 22px rgba(28, 40, 110, 0.16)); }
  .eyebrow { margin: 18px 0 8px; color: var(--gold); font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
  h1 { margin: 0 0 12px; font-family: Fraunces, Georgia, serif; font-weight: 500; font-size: clamp(30px, 5vw, 42px); line-height: 1.12; }
  .lede { margin: 0 auto 26px; max-width: 480px; color: var(--sub); }
  .price { display: inline-flex; align-items: baseline; gap: 8px; padding: 10px 22px; border-radius: 999px; color: #fff; font-weight: 600;
    background-color: var(--cobalt);
    background-image: radial-gradient(circle at 20% 30%, rgba(232, 200, 120, 0.9) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, rgba(232, 200, 120, 0.7) 0 1px, transparent 1.6px), radial-gradient(circle at 45% 80%, rgba(232, 200, 120, 0.6) 0 0.8px, transparent 1.4px);
    background-size: 37px 29px, 61px 43px, 29px 53px; box-shadow: 0 10px 24px rgba(36, 67, 181, 0.25); }
  .price small { font-weight: 500; opacity: 0.85; }
  ol { margin: 34px 0 0; padding: 0; list-style: none; text-align: left; display: grid; gap: 10px; }
  li { padding: 14px 18px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.8); }
  li b { display: block; font-size: 15px; }
  li span { color: var(--sub); font-size: 14px; }
  pre { margin: 18px 0 0; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; text-align: left; font: 13px/1.6 ui-monospace, Menlo, monospace; overflow-x: auto; }
  .fine { margin-top: 22px; color: var(--sub); font-size: 13px; }
  a { color: var(--cobalt); }
</style>
</head>
<body>
<main>
  <img class="shop" src="/assets/shop.webp" alt="A small porcelain shop">
  <p class="eyebrow">402 Found · codemod engine</p>
  <h1>Upgrade ethers v5 to v6, delivered as a pull request</h1>
  <p class="lede">A small shop for AI agents. No sign-up, no card: your agent asks, sees the price, pays per job in USDC on Stellar${testnet ? ' testnet' : ''}, and gets a pull request back.</p>
  <span class="price">${price} <small>USDC per upgrade</small></span>
  <ol>
    <li><b>1 · Ask</b><span><code>POST ${migratePath}</code> with <code>{"repoUrl": "https://github.com/owner/repo"}</code>. A free check comes first: if we can't do the job, you are never asked to pay.</span></li>
    <li><b>2 · See the price</b><span>The answer is HTTP 402 with the price, the asset and where to pay, in the <code>PAYMENT-REQUIRED</code> header (x402).</span></li>
    <li><b>3 · Pay and get the work</b><span>Retry with a signed payment from any x402 client. We open the pull request, then settle. If the job fails, nothing is charged; if settling fails, the pull request is withdrawn.</span></li>
  </ol>
  <pre>curl -i -X POST ${migratePath} -H 'content-type: application/json' -d '{"repoUrl":"https://github.com/owner/repo"}'
# HTTP/1.1 402 Payment Required</pre>
  <p class="fine">${testnet ? 'Test network, test money only. ' : ''}Code: <a href="https://github.com/Chinyereee/x402-Agent">github.com/Chinyereee/x402-Agent</a></p>
</main>
</body>
</html>`;
}
