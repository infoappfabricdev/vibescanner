# Stripe setup for VibeScan

This guide walks you through connecting your existing Stripe account so "Run a Vibe Scan — $9" sends users to Stripe Checkout, then back to the scan page after payment.

---

## 1. Get your Stripe keys

1. Log in at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Make sure you’re in **Test mode** (toggle in the sidebar) while testing. Switch to **Live mode** when you’re ready for real payments.
3. Go to **Developers** → **API keys**.
4. Copy:
   - **Secret key** (starts with `sk_test_` in test mode or `sk_live_` in live). You’ll use this on the server only.

You do **not** need the Publishable key for the current flow (we use Stripe Checkout and only create sessions on the server).

---

## 2. Set environment variables

### Local development

1. In your project root, create a file named `.env.local` (it’s already in `.gitignore`).
2. Add:

   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Replace `sk_test_xxxxxxxxxxxx` with your real Secret key. Use your live key (`sk_live_...`) when you’re ready for production.

### Production (Vercel)

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `STRIPE_SECRET_KEY`  
     **Value:** your Stripe Secret key (`sk_test_...` or `sk_live_...`).  
     **Environment:** Production (and Preview if you want to test payments on preview URLs).
3. Add:
   - **Name:** `NEXT_PUBLIC_APP_URL`  
     **Value:** your production URL, e.g. `https://vibescan.co` (no trailing slash).  
     **Environment:** Production.
4. **Redeploy** the app so the new variables are applied.

---

## 3. How the flow works

1. User clicks **"Run a Vibe Scan — $9"** (on pricing, home, or how-it-works).
2. They’re sent to **/checkout**, where they can enter an optional **coupon code** or click **Continue to payment — $9**.
3. If a valid coupon (e.g. internal code) is applied, they’re redirected straight to **/scan** with a signed token (no Stripe).
4. Otherwise they’re redirected to **Stripe’s hosted checkout**. After payment, Stripe sends them to **/scan?session_id=...**.
5. The scan page verifies either the session or the coupon token. If valid, they see the upload form and can run their scan.

If someone opens **/scan** without a valid `session_id` or `coupon_token`, they’re redirected to **/checkout**.

---

## 4. Test the flow locally

1. Set `.env.local` as in step 2 (use your **test** Secret key).
2. Run `npm run dev` and open http://localhost:3000.
3. Click **Run a Vibe Scan** (nav or home). You should be sent to Stripe Checkout.
4. Use Stripe’s test card: **4242 4242 4242 4242**, any future expiry, any CVC, any billing details.
5. After payment, you should land on **/scan** with the upload form. Upload a zip and run a scan to confirm the rest of the flow.

---

## 5. Go live

1. In the Stripe Dashboard, switch to **Live mode**.
2. Copy your **live** Secret key and set it in Vercel as `STRIPE_SECRET_KEY` for Production.
3. Ensure `NEXT_PUBLIC_APP_URL` is your live site (e.g. `https://vibescan.co`).
4. Redeploy on Vercel.
5. Do one real $9 test payment, then refund it in the Stripe Dashboard if you like.

---

## Summary of env vars

| Variable | Where | Purpose |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | Server only (.env.local, Vercel) | Create Checkout Sessions and verify payments. |
| `NEXT_PUBLIC_APP_URL` | Build-time (Vercel) / dev | Used for Stripe `success_url` and `cancel_url` (redirect after payment or cancel). |
| `COUPON_SECRET` | Server only (optional) | Signs coupon tokens for free-scan codes. If unset, the app falls back to `STRIPE_SECRET_KEY`. Set a dedicated secret in production if you use coupon codes. |

No Stripe webhook is required for this flow; payment is confirmed by verifying the Checkout Session when the user lands on /scan. The checkout page also supports optional coupon codes; valid codes (e.g. internal use) can bypass payment and redirect straight to /scan.
