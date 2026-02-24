# VibeScan – What to install first

This is the minimal version: upload a zip → we extract it and run Semgrep → you see raw results.

## 1. Node.js

You need **Node.js** (v18 or newer) to run Next.js.

- **Check if you have it:** open a terminal and run:
  ```bash
  node -v
  ```
- **If you don’t:** install from [nodejs.org](https://nodejs.org/) (use the LTS version).

## 2. Semgrep (for the scan to work)

The app runs the **Semgrep** CLI on the server. You need it installed on your machine (for local dev) or on the server (for production).

**On your Mac (for local development):**

- **Option A – Homebrew (simplest):**
  ```bash
  brew install semgrep
  ```
- **Option B – pip:**
  ```bash
  python3 -m pip install semgrep
  ```
  (Requires Python 3.8+.)

**Check it works:**
```bash
semgrep --version
```

## 3. Install project dependencies and run the app

In the project folder (`vibescanner`), run:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser. You can upload a zip file of your app’s code; the app will extract it, run Semgrep, and show the raw JSON results on the page.

## 4. (Optional) AI-generated fix prompts

To get AI-generated, plain-English fix prompts for each finding (instead of rule-based ones), set **`ANTHROPIC_API_KEY`** in your environment. Get a key from [Anthropic](https://console.anthropic.com/). If the key is missing or the API call fails, the app falls back to rule-based fix suggestions and the scan still works.

- **Local:** create a `.env.local` file in the project root with `ANTHROPIC_API_KEY=your_key`.
- **Production:** add `ANTHROPIC_API_KEY` in your host’s environment variables (e.g. Vercel → Settings → Environment Variables).

## Summary

| Thing    | Why |
|----------|-----|
| **Node.js** | Runs Next.js and the dev server. |
| **Semgrep** | The scanner that runs on your uploaded code; the API route calls the `semgrep` command. |
| **npm install** | Installs Next.js, React, and the zip library (adm-zip) used in the API. |
| **ANTHROPIC_API_KEY** (optional) | Enables AI-generated fix prompts via Claude; if unset, rule-based prompts are used. |

## Deploying to Vercel later

- **Next.js + Vercel:** works as usual; you’ll connect this repo to Vercel and deploy.
- **Semgrep on Vercel:** Serverless functions don’t include Semgrep by default. For this minimal version we assume Semgrep is available (e.g. only for local use). When you’re ready to run scans on Vercel, we can add a solution (e.g. bundling the Semgrep binary or using a different backend).

## Supabase

Not used in this minimal version. We’ll add Supabase when we add auth, storing reports, etc.
