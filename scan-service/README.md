# VibeScan scan service

This small service runs Semgrep in a Docker container. Deploy it to **Railway** (or Fly.io) and point your VibeScan app on Vercel at it so scans work in production.

## What it does

- **`GET /health`** – Returns `{"ok": true}`. Use this for health checks.
- **`POST /scan`** – Expects a multipart form with a **`file`** field (zip file). Extracts the zip, runs `semgrep scan --config auto --json`, and returns the same JSON shape your Next.js app already uses.

## Deploy to Railway (step-by-step)

1. **Sign up:** Go to [railway.app](https://railway.app) and sign in with GitHub.

2. **New project:** Click **New Project**. When you see **“What would you like to create?”**, choose **GitHub Repository**.

3. **Select repo:** Pick your VibeScan repo (the one that contains both the Next.js app and the `scan-service` folder). Railway will create a project and usually add one service from that repo.

4. **Set the root directory (important):**  
   Railway will have created a service building from the **repo root**. We need it to build only the `scan-service` folder:
   - Click your **service** (the box that represents the deployment).
   - Open the **Settings** tab for that service.
   - Find **Root Directory** (or **Source** → **Root Directory**).
   - Set it to **`scan-service`** (no leading slash).
   - Save. Railway will redeploy using only the `scan-service` folder and its Dockerfile.

5. **Confirm build:** In the **Deployments** tab, wait for the build to finish. The build should use the Dockerfile inside `scan-service`. If it fails, double-check that Root Directory is exactly `scan-service`.

6. **Get the URL:** In the same service, go to **Settings** → **Networking** (or **Variables** area) and **Generate Domain**. You’ll get a URL like `https://your-app.up.railway.app`.

7. **Use it in VibeScan:** In your **Vercel** project (the Next.js app):
   - **Settings** → **Environment Variables**
   - Add: **Name** `SCAN_SERVICE_URL`, **Value** `https://your-app.up.railway.app` (no trailing slash).
   - Redeploy the Vercel app so the new env var is picked up.

After that, when someone uploads a zip on VibeScan, the Vercel API route will send it to this service and return the results.

---

## If you already deployed the whole repo

If you chose **GitHub Repository** and Railway deployed before you could set a root directory, the service is probably building from the **repo root** (the whole VibeScan project). Fix it like this:

1. In your Railway **project**, click the **service** that was created (the one connected to your GitHub repo).
2. Go to the **Settings** tab for that service.
3. Find **Root Directory** (under **Source** or **Build**). It may be empty or “.”.
4. Set it to **`scan-service`** and save.
5. Trigger a **redeploy** (e.g. **Deployments** → three dots on the latest deployment → **Redeploy**, or push a new commit). Railway will rebuild using only the `scan-service` folder and its Dockerfile.

After the redeploy, the service will run the scan API (Flask + Semgrep), not the Next.js app. Use the generated domain as `SCAN_SERVICE_URL` in Vercel as in step 7 above.

---

## Run locally (optional)

```bash
cd scan-service
docker build -t vibescan-scanner .
docker run -p 8080:8080 vibescan-scanner
```

Then set `SCAN_SERVICE_URL=http://localhost:8080` in your local `.env.local` and run the Next.js app with `npm run dev` to test the full flow locally.
