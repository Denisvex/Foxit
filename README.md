# Foxit
An app designed for workouts and daily runs so user spends less time scrolling.
React + TypeScript + Vite + Tailwind.

## Run it

```bash
npm install
npm run dev      # http://localhost:8000
```

## Build a static copy

```bash
npm run build    # outputs dist/
npm run preview  # serve the build on :8000
```

Routes: `/` loading → `/welcome` → `/goal` → `/frequency` → `/schedule` →
`/username` → `/dashboard` (map + runs) → `/workouts` → `/verify`
(live on-device pose check) → `/models` (voices) → `/site` (landing page).

All data stays in `localStorage`; pose detection runs 100% on-device.
