# Eco-DPI v2 — Environmental Digital Public Infrastructure

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Claymorphism design system (vanilla CSS, per-page files) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB via Mongoose |

---

## Project Structure

```
eco-dpi/
├── server/                     # Backend (Node/Express)
│   ├── index.ts                # Entry point — Express + MongoDB
│   ├── seed.ts                 # Seed 6 demo incidents (runs once)
│   ├── models/
│   │   ├── Incident.ts         # Mongoose incident schema
│   │   └── User.ts             # Mongoose user schema
│   └── routes/
│       ├── incidents.ts        # CRUD + spatial dedup logic
│       └── auth.ts             # Login/upsert user
│
├── src/                        # Frontend (React)
│   ├── main.tsx                # App orchestrator (routing, state)
│   ├── types.ts                # Shared TypeScript types
│   ├── api.ts                  # All fetch() calls to backend
│   ├── utils.ts                # Haversine, getMarkerStyle, constants
│   │
│   ├── components/
│   │   ├── Header.tsx          # Nav + AnimatedBackground
│   │   └── Shared.tsx          # Metric, IncidentMiniCard
│   │
│   ├── pages/
│   │   ├── HomePage.tsx        # Hero + LiveCityDashboard + flow steps
│   │   ├── LoginPage.tsx       # Role selector + geolocation login
│   │   ├── CitizenPage.tsx     # Report form + nearby list
│   │   └── AdminPage.tsx       # Heatmap + filter chips + incident list
│   │
│   └── styles/
│       ├── globals.css         # Design tokens, reset, nav, buttons, forms
│       ├── home.css            # Hero, live dashboard, promise grid, story
│       ├── login.css           # Auth layout, role toggle, location badge
│       ├── citizen.css         # Report card, location capture, help stack
│       └── admin.css           # Heatmap, markers, filter chips, panel
│
├── .env                        # MONGO_URI, PORT
└── package.json
```

---

## Running Locally

### 1. Start MongoDB

Make sure MongoDB is running on `localhost:27017` (default). Using MongoDB Community:

```bash
mongod
```

Or MongoDB Atlas — update `MONGO_URI` in `.env`.

### Run the full stack

```bash
npm run dev
```

Starts the API on `http://localhost:4000`, waits for its health check, then starts Vite on `http://localhost:5173` (or the next available port). This avoids frontend requests racing backend startup.

To run the processes in separate terminals, start `npm run server` first, then `npm run dev:client`.

---

## Deploying to Vercel

This project is configured for Vercel with `vercel.json`.

Recommended Vercel settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add these Environment Variables in Vercel before deploying:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `ADMIN_EMAILS` | Optional comma-separated list of Google-verified admin emails |
| `CORS_ORIGINS` | Optional comma-separated site origins, such as `https://your-site.vercel.app` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID, available to the frontend at build time |
| `GOOGLE_CLIENT_ID` | Same Google OAuth web client ID, used by the API to verify token audience |

The frontend calls `/api` by default in production. During local Vite development, `/api` is proxied to `http://localhost:4000`.

For Google sign-in, create an OAuth client with application type **Web application** in Google Cloud Console. Add `http://localhost:5173` under **Authorized JavaScript origins** for local development and the exact HTTPS site origin for each deployment. Set `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` to the same client ID, then restart the dev server or rebuild/redeploy the frontend.

Allow-listed administrator access is granted only after Google verifies the email address. Public password registration always creates a citizen account; assign the database role through a trusted administrator-provisioning process for password-based admin accounts.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Backend + DB status |
| GET | /api/incidents | List all incidents |
| POST | /api/incidents | Create or merge duplicate |
| PATCH | /api/incidents/:id/resolve | Mark resolved |
| PATCH | /api/incidents/:id/status | Set status |
| DELETE | /api/incidents/:id | Remove incident |
| POST | /api/auth/login | Upsert user |
| GET | /api/auth/me/:identity | Get user |

---

## Design System — Glass + Clay

- **Surface**: translucent white layers with `backdrop-filter: blur(18px) saturate(135%)`
- **Border**: soft white glass edge paired with inset highlights
- **Shadow**: layered ambient and inset shadows for a soft clay depth
- **Radius**: 16px cards, 22px feature panels, 14px buttons, 999px pills
- **Font**: Plus Jakarta Sans (700–900)
- **Palette**: Deep forest greens + teal accent + amber alert + sky blue water
