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

### 2. Start the backend

```bash
npm run server
```

Runs on `http://localhost:4000`. Seeded with 6 Chandigarh incidents on first run.

### 3. Start the frontend

```bash
npm run dev
```

Runs on `http://localhost:5173` (or next available port).

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

## Design System — Claymorphism

- **Surface**: `rgba(255,255,255,0.72)` + `backdrop-filter: blur(20px)`
- **Border**: `rgba(255,255,255,0.90)` — milky white halo
- **Shadow**: `6px 6px 0 rgba(30,90,60,.12)` offset clay shadow + soft ambient
- **Radius**: 18px cards, 26px large panels, 999px pills
- **Font**: Plus Jakarta Sans (700–900)
- **Palette**: Deep forest greens + teal accent + amber alert + sky blue water
