# Crypto Game Backend

All backend files intentionally live in one directory/root. No routes/models/controllers subfolders.

## Run

1. Copy `.env.example` to `.env`.
2. Fill `MONGODB_URI`, `JWT_SECRET`, and SMTP values.
3. `npm install`
4. `npm start`

## Important security note

The wallet deposit endpoint creates a pending record only. It MUST NOT credit balances from a client-supplied TXID. A real deployment needs a blockchain verification adapter and secure wallet/key management.

The current project includes the data model and API boundary for USDT/BTC/ETH, but it does not pretend to perform real blockchain transfers without a configured custody/provider layer.

## Initial economics

1000 coins = $0.01 (configurable through the admin settings).

Default daily reward: 500 coins.

Game rewards are server-capped and should be hardened further with signed game sessions/server-authoritative game logic before production.

## Render

Build/start backend with:
- Build command: `npm install`
- Start command: `npm start`

Set environment variables in Render instead of uploading `.env`.
