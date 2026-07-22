# 📋 Eco-DPI — Manual TODO List

Things that **only you can add** (credentials, API keys, secrets).
All other code has been fixed automatically.

---

## 🔴 Priority 1 — Required to Run (Do These First)

### ✅ Already Done (Auto-fixed)
- Backend server script fixed (`npm run dev:all` now starts everything)
- JWT_SECRET added to `.env`
- OTP switched to email-based (no more phone SMS)
- Google login `prompt()` replaced with proper form UI
- `nodemailer` installed and wired up

---

## 🟠 Priority 2 — Phone OTP via SMS (Do This to Enable Real SMS)

Right now Phone OTP works in **dev mode** — the OTP code is shown on screen (yellow box).
To send real SMS to users, add your **Twilio** credentials:

### Steps:
1. Sign up (free trial) at → https://console.twilio.com
2. From the dashboard, copy your **Account SID** and **Auth Token**
3. Get a **Twilio phone number** (free trial gives you one)
4. Open your `.env` file and replace these placeholders:
   ```
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE=+1234567890
   ```
   with your actual values:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE=+1xxxxxxxxxx
   ```
5. Install the Twilio SDK: run `npm install twilio` in a terminal
6. Restart the server — OTP will now be sent via real SMS

> Free Twilio trial can only send SMS to verified numbers. Upgrade to a paid account to send to any number.

---

## 🟡 Priority 3 — Real Google OAuth (Optional)

Right now Google Sign-In is a "direct login" (user types their Gmail).
To enable the real **Google OAuth popup** (one-click), you need API credentials:

### Steps:
1. Go to → https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:4173`
7. Add Authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback`
8. Click **Create** → copy **Client ID** and **Client Secret**
9. Open your `.env` file and replace:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```
   with your actual values.

---

## 🟡 Priority 4 — Real SMS OTP (Optional, Paid)

If you want real SMS OTP (instead of email OTP), use **Twilio**:

1. Sign up at → https://twilio.com
2. Get your **Account SID**, **Auth Token**, and a **Twilio phone number**
3. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE=+1234567890
   ```
4. Install: `npm install twilio`
5. Ask the agent to switch OTP from nodemailer to Twilio SMS

---

## 🟢 Priority 5 — Production Security Hardening

When deploying to **Vercel / Railway / Render**:

### Change JWT_SECRET
Replace the default one in `.env` with a strong random string:
```
JWT_SECRET=<generate-a-64-char-random-string>
```
Generate one: https://generate-random.org/api-key-generator

### Set NODE_ENV=production
In your deployment environment variables, set:
```
NODE_ENV=production
```
This disables the dev OTP code display in the UI.

---

## 🔵 Priority 6 — Nice to Have (Future Features)

| Feature | What to do |
|---------|-----------|
| Push notifications | Add Firebase Cloud Messaging (FCM) |
| Real-time updates | Add Socket.io to server for live incident updates |
| File uploads for reports | Add Multer + Cloudinary for photo evidence |
| Map clustering | Leaflet.markercluster plugin |
| Admin analytics dashboard | Add Chart.js graphs for incident trends |
| Password reset via email | Add `/api/auth/reset-password` route using nodemailer (already installed) |
| Rate limiting | Add `express-rate-limit` to prevent OTP spam |

---

## Files Modified (Reference)

| File | What Changed |
|------|-------------|
| `package.json` | Added `dev:all` script, fixed `server` script, added `nodemailer` |
| `.env` | Added `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS` placeholder, `NODE_ENV` |
| `server/models/OtpSession.ts` | Added `email` field |
| `server/routes/auth.ts` | Email OTP via nodemailer, dev OTP in response, error logging |
| `src/api.ts` | `sendOtp`/`verifyOtp` now use email instead of phone |
| `src/pages/LoginPage.tsx` | Email OTP UI, dev OTP box, Google form (no more `prompt()`) |

---

## How to Run

```bash
# Starts BOTH frontend + backend together:
npm run dev:all

# Or separately in two terminals:
npm run server    # Express on port 4000
npm run dev       # Vite on port 5173
```
