# Deployment (no Netlify)

Static Vite app; **rent data is only in each browser** (`localStorage`). Use **Download backup** before clearing cache or switching phones.

---

## Option 1 — GitHub Pages (simplest if code can be public)

**Free** on a personal account when the repository is **public**. Your workflow is already set up.

1. **Settings → General → Danger zone → Change repository visibility → Public** (if you are OK sharing the source).
2. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
3. Push to `main`. Open **Actions** and wait for **Deploy to GitHub Pages** to succeed.
4. **Settings → Pages** shows **Visit site** (URL like `https://<user>.github.io/<repo>/`).

**Private repo on GitHub Free:** Pages for private repos usually needs **GitHub Pro**. If the repo must stay private, use **Option 2**.

---

## Option 2 — Cloudflare Pages (private repo, still free)

Works with **private** GitHub repos on Cloudflare’s free plan.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and select **`PG-Expense-Tracker`** (your repo).
3. Build settings:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. Use the `*.pages.dev` URL (you can add a custom domain later).

---

## Option 3 — Upload `dist` anywhere

```bash
npm ci
npm run build
```

Upload the **`dist`** folder to any static host you already use (S3 + CloudFront, Azure Static Web Apps, your own server, etc.).

---

## Not ideal for the PG owner’s daily link

| Approach | Why |
|----------|-----|
| **`npm run dev` + laptop IP** | Dev only; firewall and changing Wi-Fi IPs |
| **`npm run tunnel`** | Temporary / unreliable as a permanent URL |

---

## This app does not sync data across phones

There is **no backend**. Each device has its own data unless someone **restores** a JSON backup.
