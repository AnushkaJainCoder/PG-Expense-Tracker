# Deploy SVS Womens Pg (rent ledger)

The app is **static** (HTML/CSS/JS). Data stays in each visitor’s browser (`localStorage`). Pick **one** host below.

**GitHub Actions** only reads `.github/` from the **root** of the GitHub repository. If this folder is inside a bigger mono-repo, either create a **new repo** whose root is **only** this project’s files, or copy these files into a dedicated repo.

## Option A — GitHub Pages (free)

1. Push **this folder’s contents** as the repo root (include `package-lock.json` and `.github/workflows/`).
2. In the repo: **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions** (not “Deploy from a branch”).
3. Open the **Actions** tab and confirm **Deploy to GitHub Pages** runs green after each push to `main`.
4. When it succeeds, **Settings → Pages** shows **Visit site** (URL shape: `https://<username>.github.io/<repo>/`, e.g. `PG-Expense-Tracker`).

**Private repo on a free GitHub account:** GitHub Pages for **private** repos usually needs **GitHub Pro**, or make the repo **Public** under **Settings → General → Danger zone → Change repository visibility**. If you want to keep the repo private, use **Netlify** (Option B) instead—it works with private GitHub repos on the free plan.

**Backup:** use **Download backup** on the site so you don’t lose data if you clear the browser.

## Option B — Netlify (free)

1. Sign up at [netlify.com](https://www.netlify.com/).
2. **Add new site → Import an existing project** (Git) **or** drag the **`dist`** folder after running `npm run build` locally.
3. Build settings are in `netlify.toml` (`npm run build`, publish `dist`).

## Option C — Cloudflare Pages (free)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → Connect Git or upload **`dist`**.
2. Build command: `npm run build`, output directory: `dist`.

## Local build

```bash
npm ci
npm run build
```

Upload the **`dist`** folder to any static host.
