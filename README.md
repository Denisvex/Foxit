# Foxit
An app designed for workouts and daily runs so peple spends less time scrolling.

## Run it (React + TypeScript + Vite + Tailwind)

```bash
cd foxit-app
npm install
npm run dev      # http://localhost:8000
```

## Build a static copy

```bash
cd foxit-app
npm run build    # outputs foxit-app/dist/
npm run preview  # serve the build on :8000
```

Routes: `/` loading → `/welcome` → `/goal` → `/frequency` → `/schedule` →
`/username` → `/dashboard` (map + runs) → `/workouts` → `/verify`
(live on-device pose check) → `/models` (voices) → `/site` (landing page).

All data stays in `localStorage`; pose detection runs 100% on-device.
