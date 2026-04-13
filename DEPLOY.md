# Deploy SVS Womens Pg (rent ledger)

The app is **static** (HTML/CSS/JS). Data stays in each visitor’s browser (`localStorage`). Pick **one** host below.

**GitHub Actions** only reads `.github/` from the **root** of the GitHub repository. If this folder is inside a bigger mono-repo, either create a **new repo** whose root is **only** this project’s files, or copy these files into a dedicated repo.

## Option A — GitHub Pages (free)

1. Create a **new** repository on GitHub (recommended name e.g. `svs-pg-rent`).
2. Push **this folder’s contents** as the repo root (include `package-lock.json` and `.github/workflows/`).
3. In the repo: **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions**.
4. Push to `main` or `master`. The workflow **Deploy to GitHub Pages** builds and publishes `dist/`.
5. After a green run, open the site URL under **Settings → Pages** (often `https://<user>.github.io/<repo>/`).

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
