# Telematics Web

Tamilzorous Telematics frontend. It shows a fleet dashboard, device management with history, and an MQTT console for testing devices. It talks to the Telematics API in `C:\Users\DELL\Telematics`.

Stack: Vite, React 19, TypeScript (strict), Tailwind CSS 4, TanStack Router and Query, axios, react-hook-form with zod, Leaflet, mqtt.js.

## Run

```bash
npm install
cp .env.example .env
npm run start:local:win
```

- Start the backend first (`npm run start:local:win` in the Telematics folder).
- The terminal prints a `Local` and a `Network` URL. Share the Network URL, for example `http://192.168.1.7:5173`, with anyone on the same network.
- API calls go to `/api` and Vite forwards them to `VITE_API_PROXY_TARGET`, so teammates only need the frontend URL.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VITE_APP_NAME` | Tamilzorous Telematics | App name |
| `VITE_PORT` | 5173 | Dev server port |
| `VITE_API_URL` | /api | API base path used by the browser |
| `VITE_API_PROXY_TARGET` | http://localhost:3000 | Backend address the dev server forwards `/api` to |
| `VITE_MQTT_URL` | mqtt://broker.hivemq.com:1883 | Broker URL, same as the backend and Postman. The console connects to it over WebSocket (port 8884) because browsers cannot open raw MQTT connections |
| `VITE_MQTT_TOPIC_FILTER` | telematics/+/telemetry | Topic the API listens to |
| `VITE_TIMEZONE` | Asia/Kolkata | Time zone for displayed times |
| `VITE_ONLINE_WINDOW_SECONDS` | 120 | A device counts as online if seen within this time |
| `VITE_REFRESH_INTERVAL_SECONDS` | 10 | Auto-refresh interval for live data |

## Pages

| Page | Path | What it does |
|---|---|---|
| Dashboard | `/` | Device counts, live map, recent activity, latest readings |
| Devices | `/devices` | Search, register, edit and delete devices |
| Device detail | `/devices/:id` | Position on a map, latest reading, history with date filters |
| MQTT console | `/console` | Connect to the broker, subscribe, publish (with repeat), inspect messages |

## Keyboard shortcuts

Press `Shift + ?` in the app for the full list.

| Keys | Action |
|---|---|
| `G` then `D` / `V` / `M` | Go to dashboard / devices / MQTT console |
| `/` | Focus search |
| `Alt + N` | Register a device |
| `Alt + R` | Refresh data |
| `Alt + T` | Switch light or dark theme |
| `Ctrl + B` | Collapse or expand the sidebar |
| `Ctrl + S` | Save the open form |
| `Alt + C` | Connect or disconnect (console) |
| `Ctrl + Enter` | Publish (console) |
| `Alt + P` / `Alt + L` | Pause / clear the message stream (console) |
| `↑ ↓` or `J K`, `Enter`, `E`, `Del` | Move through, open, edit and delete table rows |

## Structure

```
src/
  main.tsx, router.tsx        bootstrap and routes (pages are lazy-loaded)
  config/                     env, navigation, shortcut list
  lib/api/                    axios client, ApiError + toApiError, query client
  lib/                        alerts (toasts), formatting, shortcut parsing, utils
  providers/                  theme
  components/ui/              Button, Card, Input, Dialog, Table, Badge, Switch, Skeleton
  components/common/          Page, PageHeader, StatCard, EmptyState, ErrorState, AppModal,
                              ConfirmDialog, Pagination, FormField, FleetMap, BrandLogo
  components/layout/          sidebar, header, system status, toaster
  components/shortcuts/       shortcut provider, hooks, Kbd, help dialog
  features/<name>/            api.ts (types + query hooks), components/, pages/
```

## Error handling

- Every request goes through `lib/api/client.ts`. Its interceptor turns every failure into an `ApiError` with `status`, `code` and `message`, read from the backend's `{ status, error, message }` body.
- Network problems and timeouts become clear messages.
- Failed queries and mutations show one toast through `lib/alerts.ts`, unless they set `meta: { silent: true }` and handle the error themselves. For example, the device form shows "This IMEI is already registered" under the IMEI field.

## Scripts

| Script | Purpose |
|---|---|
| `start:local:win` / `dev` | Dev server on the local network |
| `build` / `preview` | Production build and local preview |
| `lint` / `format` / `typecheck` | ESLint, Prettier, TypeScript |
