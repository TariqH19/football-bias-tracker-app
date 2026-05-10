# Football Bias Tracker

A heuristics dashboard that finds footballers receiving disproportionate social media hate, compares their stats against peers, and scores the injustice of the criticism.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Database | Supabase (PostgreSQL) |
| Styling | Custom CSS design system (`dashboard.css`) |
| Routing | Hash-based SPA routing (no React Router needed) |
| Hosting | Netlify / Cloudflare Pages (static build) |

## Pages

| Route | Component | Purpose |
|---|---|---|
| `#` | LeaderboardPage | Weekly injustice rankings |
| `#player/<slug>` | PlayerPage | Player detail with stats, social trend, evidence |
| `#compare/<slugA>/<slugB>` | ComparePage | Side-by-side player comparison |
| `#methodology` | MethodologyPage | How the injustice score is calculated |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/TariqH19/football-bias-tracker-app.git
cd football-bias-tracker-app
npm install
```

### 2. Set up Supabase

See [`supabase/README.md`](./supabase/README.md) for full instructions.

Short version:
- Create a Supabase project
- Run `supabase/schema.sql` → `supabase/views.sql` → `supabase/seed.sql` in the SQL Editor
- Copy `.env.example` to `.env` and fill in your URL + anon key

### 3. Run locally

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build for production

```bash
npm run build
# Output: dist/
```

Deploy `dist/` to Netlify, Cloudflare Pages, or any static host.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Never commit `.env`. Use `.env.example` as the template.

## Injustice Score

```
injustice_score = hate_score - expectation_score
bias_gap        = clamp((injustice_score / 5) × 100, -100, +100)
```

A positive score means the player is criticised more than their performances justify.
See [Methodology](src/components/MethodologyPage.jsx) for full details.

## Project Structure

```
football-bias-tracker-app/
├── .env.example              ← copy to .env, fill in Supabase credentials
├── .eslintrc.cjs             ← ESLint config
├── index.html
├── vite.config.js
├── package.json
├── supabase/
│   ├── README.md             ← Supabase setup guide
│   ├── schema.sql            ← All tables, indexes, RLS
│   ├── views.sql             ← Computed views used by the frontend
│   └── seed.sql              ← 10 demo players with realistic data
└── src/
    ├── main.jsx
    ├── App.jsx               ← Hash router + theme toggle
    ├── dashboard.css         ← Full design system (Nexus tokens)
    ├── lib/
    │   └── supabase.js       ← Supabase client init
    └── components/
        ├── Nav.jsx
        ├── LeaderboardPage.jsx
        ├── PlayerPage.jsx
        ├── ComparePage.jsx
        └── MethodologyPage.jsx
```
