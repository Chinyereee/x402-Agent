import type { NextConfig } from "next";

const config: NextConfig = {
  // The Stellar SDK and x402 packages run on the server only, as plain Node modules.
  serverExternalPackages: ["@stellar/stellar-sdk", "@x402/stellar", "@x402/fetch", "@x402/core"],
};

export default config;
