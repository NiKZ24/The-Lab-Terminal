# The Lab Terminal

Crypto perp/spot/macro monitoring dashboard. Free public feeds only (Hyperliquid,
CoinGecko, CryptoCompare, Frankfurter/ECB, US Treasury). Monitoring only — no execution.

## Local dev
npm install
npm run dev        # http://localhost:5173

## Build
npm run build      # output: dist/

## Deploy (Vercel)
Import this repo on vercel.com → framework auto-detected as Vite →
Build command: `npm run build` · Output directory: `dist` → Deploy.
The `api/us10y.js` serverless function deploys automatically with it.
