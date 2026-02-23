# Running Semgrep in Production (Vercel)

Vercel’s servers don’t have Semgrep installed. Here are your options, from simplest to more involved.

---

## Option 1: Dedicated scan service (recommended)

**What:** A small “scan API” that runs in a container (Docker) on a host like **Railway** or **Fly.io**. Your VibeScan app on Vercel sends the uploaded zip to this service; the service runs Semgrep and returns the same JSON you use today.

**Pros:**
- No server to manage: Railway/Fly run the container for you.
- Uses the official Semgrep Docker image, so Semgrep is always available and up to date.
- One extra deployment (the scan service); your Next.js app stays on Vercel.
- Same UX: user uploads on VibeScan → scan runs in production.

**Cons:**
- Two deployments (Vercel + Railway/Fly) and one env var (`SCAN_SERVICE_URL`).

**How:** This repo includes a `scan-service/` app. You deploy it to Railway (or Fly), get a URL, then set `SCAN_SERVICE_URL` in your Vercel project. The Next.js API route will use that URL when set. See `scan-service/README.md` for step-by-step deploy.

---

## Option 2: Bundle Semgrep binary on Vercel

**What:** Add a pre-built Semgrep binary for Linux to your repo (or download it at build time) and run it from your existing `/api/scan` route.

**Pros:**
- Single deployment (only Vercel).
- No separate service to maintain.

**Cons:**
- Vercel has a 250 MB (uncompressed) limit per serverless function. Semgrep’s full CLI can be large; you must confirm the binary (and any dependencies) fit.
- You must update the binary when you want to upgrade Semgrep.
- Slightly more brittle (binary path, permissions, possible missing libs in the serverless environment).

**How:** You’d add the Linux binary to the project (or a build step that fetches it), use Next.js’s `outputFileTracingIncludes` so the binary is included in the function bundle, and run it from the API route. We haven’t implemented this in the repo; if you want to try it, we can add a minimal version and you can check the deployed function size.

---

## Option 3: Other backends (e.g. Lambda + Lambda Layer)

**What:** Run Semgrep in AWS Lambda (or similar) with a Lambda Layer that includes Semgrep, and call that from VibeScan.

**Pros:** Fits into an existing AWS setup.

**Cons:** More setup (Lambda, Layer, API Gateway or function URL, IAM). Not the simplest if you’re not already on AWS.

---

## Recommendation

Use **Option 1 (dedicated scan service on Railway)**. It’s the simplest way to run Semgrep in production without managing a server: deploy the `scan-service` once, set `SCAN_SERVICE_URL` on Vercel, and scans work on your live app.
