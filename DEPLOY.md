# Deploy VibeScan to Vercel (step-by-step)

This guide assumes you’ve never deployed to Vercel before. Follow the steps in order.

---

## Step 1: Put your project under Git

Vercel deploys from a **Git repository** (usually GitHub). If the project isn’t in Git yet, set it up:

1. Open **Terminal** (Mac) or your command line.
2. Go to your project folder:
   ```bash
   cd /Users/ryanlewkowski/vibescanner
   ```
3. Turn the folder into a Git repo and make a first commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: VibeScan Next.js app"
   ```

You now have a local Git repo. Next we’ll put it on GitHub.

---

## Step 2: Create a GitHub account and a new repository

1. Go to [github.com](https://github.com) and sign up (or log in).
2. Click the **+** in the top right → **New repository**.
3. Fill in:
   - **Repository name:** e.g. `vibescanner` (or any name you like).
   - **Visibility:** Public is fine.
   - Leave “Add a README” **unchecked** (you already have code).
4. Click **Create repository**.
5. On the new repo page, you’ll see “push an existing repository from the command line.” Copy the **first** set of commands (they look like this, but with your username and repo name):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vibescanner.git
   git branch -M main
   git push -u origin main
   ```
6. In your terminal, run those three commands (paste your own URL). If it asks for credentials, use your GitHub username and a **Personal Access Token** as the password (GitHub no longer accepts account passwords for Git over HTTPS—see [GitHub: Creating a token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)).

Your code is now on GitHub.

---

## Step 3: Sign up for Vercel and connect GitHub

1. Go to [vercel.com](https://vercel.com) and click **Sign Up**.
2. Choose **Continue with GitHub** and authorize Vercel to access your GitHub account.
3. After signup, you’ll be in the Vercel dashboard.

---

## Step 4: Import your project and deploy

1. On the Vercel dashboard, click **Add New…** → **Project**.
2. You’ll see a list of your GitHub repositories. Find **vibescanner** (or whatever you named it) and click **Import**.
3. On the import screen:
   - **Framework Preset:** Vercel should detect **Next.js** automatically. Leave it as is.
   - **Root Directory:** Leave blank (your app is at the repo root).
   - **Build and Output Settings:** Leave the defaults (`npm run build`, output from Next.js).
   - You don’t need any **Environment Variables** for this app right now.
4. Click **Deploy**.
5. Vercel will build and deploy. Wait 1–2 minutes. When it’s done, you’ll see **Congratulations** and a link like `https://vibescanner-xxxx.vercel.app`.

---

## Step 5: Open your live app

1. Click **Visit** (or the project URL) to open your app in the browser.
2. You should see the VibeScan upload page. The app is live.

**Note about scanning on Vercel:** The **Scan** button runs Semgrep on the server. Vercel’s servers don’t have Semgrep installed, so if someone uploads a zip and clicks Scan on the live site, they’ll see a friendly message: *“Scanning is not available on this server. Run VibeScan locally to scan your code.”* So:

- **Local:** Run `npm run dev` and use the app on your machine to actually scan zips.
- **Vercel:** The site is deployed and shareable; scanning is intended for local use until we add a solution (e.g. bundling Semgrep or a separate scan backend).

---

## Step 6: (Optional) Use a custom domain

1. In the Vercel project, go to **Settings** → **Domains**.
2. Add your domain (e.g. `vibescanner.yourdomain.com`) and follow Vercel’s instructions to point DNS to Vercel.

---

## Summary

| Step | What you did |
|------|----------------|
| 1 | Initialized Git and made a first commit. |
| 2 | Created a GitHub repo and pushed your code. |
| 3 | Signed up for Vercel with GitHub. |
| 4 | Imported the repo and deployed. |
| 5 | Opened your live URL. |
| 6 | (Optional) Added a custom domain. |

**Later:** When you change the code, commit and push to the `main` branch on GitHub. Vercel will automatically build and deploy the new version.
