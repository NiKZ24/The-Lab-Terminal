const DEFAULT_WATCH = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE"];

const INTERVALS = { "5m": 3e5, "15m": 9e5, "1h": 36e5, "4h": 144e5, "1d": 864e5 };

const TV_MAP = { HYPE: "KUCOIN:HYPEUSDT", kPEPE: "BINANCE:1000PEPEUSDT", kBONK: "BINANCE:1000BONKUSDT", kSHIB: "BINANCE:1000SHIBUSDT", kFLOKI: "BINANCE:1000FLOKIUSDT", kLUNC: "BINANCE:1000LUNCUSDT", PURR: "HYPERLIQUID:PURRUSDC" };

const CG_IDS = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple", DOGE: "dogecoin", HYPE: "hyperliquid", BNB: "binancecoin", AVAX: "avalanche-2", LINK: "chainlink", SUI: "sui", ADA: "cardano", LTC: "litecoin", ARB: "arbitrum", OP: "optimism", APT: "aptos", TIA: "celestia", INJ: "injective", SEI: "sei-network", JUP: "jupiter-exchange-solana", AAVE: "aave", UNI: "uniswap", NEAR: "near", DOT: "polkadot", TON: "the-open-network", TRX: "tron", BCH: "bitcoin-cash", ENA: "ethena", PENDLE: "pendle", WLD: "worldcoin-wld", TAO: "bittensor", FIL: "filecoin", ATOM: "cosmos" };

const DEFAULT_RULES = [
  { id: "r-btc-move", type: "pct_move", coin: "BTC", value: 2, windowMin: 15, enabled: true, once: false },
  { id: "r-fund-any", type: "funding_apr", coin: "ANY", value: 100, windowMin: 0, enabled: true, once: false },
  { id: "r-whale", type: "whale_open", coin: "", value: 250000, windowMin: 0, enabled: true, once: false },
];

/* ════════════════════════════ DESIGN SYSTEM ════════════════════════════ */


/* ════════════════════════════ UTILITIES ════════════════════════════ */

const DXY_W = { EUR: 0.576, JPY: 0.136, GBP: 0.119, CAD: 0.091, SEK: 0.042, CHF: 0.036 };

export { CG_IDS, DEFAULT_RULES, DEFAULT_WATCH, DXY_W, INTERVALS, TV_MAP };
