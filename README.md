# SecureID (Next.js version)

Same IAM registration + login journey as the plain HTML/CSS/JS build, ported
to Next.js 14 (App Router) — React client components for the pages, Next.js
Route Handlers (`app/api/*/route.js`) for the backend, same hand-rolled
crypto in `lib/store.js` (HMAC-signed tickets, scrypt password hashing,
RFC 6238 TOTP — no `jsonwebtoken`/`otplib`/`bcrypt` dependency).

**Read this before you submit anything with this version:** your assignment
brief asked for HTML/CSS/JS, explicitly to be understood and explained
without AI. This Next.js build uses React (JSX, hooks, client components) —
if your mentor didn't specifically ask for Next.js, treat this as a personal
learning exercise and keep the plain-JS build as your actual submission. See
this project's chat history for the fuller reasoning.

## What's the same as the plain-JS build

- Every API route's logic is unchanged — `lib/store.js` is the same
  functions as `api/_store.js`, just exported with ESM syntax instead of
  CommonJS, because Next.js route handlers are ES modules.
- Same signed-ticket design threading state through registration and login.
- Same TOTP implementation, same attempt-limiting, same session cookie
  mechanics (`HttpOnly`, 7-day expiry, cleared on logout).
- I ran a full HTTP-level test against a real running server (register →
  email OTP → mobile OTP → MFA setup → MFA verify → session cookie →
  `/api/me` → login) before handing this over — not just a build check.

## What's different (because it's React now)

- Pages are components with `useState`/`useEffect` instead of manual DOM
  manipulation (`getElementById`, `addEventListener`).
- The OTP boxes are a reusable `<OtpBoxes />` component instead of six
  separately-wired `<input>` elements.
- QR code rendering uses the `qrcode` npm package instead of a CDN
  `<script>` tag.
- Cookie reading in `/api/me` uses Next's `cookies()` helper from
  `next/headers` instead of manually parsing the `Cookie` header.

## What's intentionally still missing

Same as the plain-JS build: the password show/hide toggle and live
strength checklist aren't wired up in `app/register/page.js` — that's your
own feature to build, live, without AI.

## Run locally

```bash
npm install
npm run dev
```
Opens on `http://localhost:3000`.

## Deploy to Vercel

Vercel has first-class Next.js support — this deploys with zero config:

```bash
npm install -g vercel
vercel --prod
```
Then add `OTP_SECRET` and `SESSION_SECRET` as Environment Variables in the
Vercel dashboard (Project → Settings → Environment Variables) and redeploy,
same as the plain-JS build.

## Push to GitHub

```bash
git init
git add .
git commit -m "SecureID — Next.js version"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## The one real limitation, same as before

`/tmp/secureid-users.json` is demo-only storage — wiped on cold starts.
Swap `readUsers`/`writeUsers` in `lib/store.js` for a real database for
anything beyond a demo.
