// "Built on Stellar" with the official Stellar logo, used as Stellar's brand policy allows:
// unaltered (black on light, white on dark), set apart from our own mark, never the most prominent thing.
// https://stellar.org/brand-policy
export function BuiltOnStellar({ className = "" }: { className?: string }) {
  return (
    <span className={`built-on-stellar ${className}`}>
      <span>Built on</span>
      <img className="bos-light" src="/stellar/stellar-logo-black.png" alt="Stellar" />
      <img className="bos-dark" src="/stellar/stellar-logo-white.png" alt="Stellar" />
    </span>
  );
}

export const STELLAR_NOTICE =
  "“Stellar” is a trademark of the Stellar Development Foundation. All rights reserved. This is independent software, not affiliated with, sponsored or endorsed by the Stellar Development Foundation.";
