# Cloud Kitchen App

A full-stack **Next.js 14** cloud kitchen demo with:

- Email/password authentication
- Google Sign-In (OAuth via Google Identity Services)
- Role-based access (`user` and `admin`)
- Food catalog management for admins
- Cart and order placement for users
- Order status tracking

## Tech Stack

- **Frontend:** Next.js App Router, React, Tailwind CSS, shadcn/ui
- **Backend/API:** Next.js route handlers (`app/api/[[...path]]/route.js`)
- **Database:** MongoDB (Mongoose)
- **Media:** Cloudinary
- **Auth:** JWT + Google ID token verification

---

## Project Structure

```text
app/
  page.js                    # Main UI (auth, menu, admin, orders)
  api/[[...path]]/route.js   # All API endpoints
components/                  # UI components
```

---

## Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required variables:

- `PORT`
- `MONGO_URL` **or** `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

> Note: The app accepts either `MONGO_URL` or `MONGO_URI` for MongoDB connection.

---

## Google OAuth Setup

1. Open **Google Cloud Console** → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Add allowed origins (example for local):
   - `http://localhost:3000`
4. Add your client ID to both:
   - `GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

How it works:

- Frontend loads Google Identity Services and gets an `idToken`.
- Frontend sends token to `POST /api/auth/google`.
- Backend verifies token with Google tokeninfo endpoint.
- Backend creates/fetches the user and returns app JWT.

---

## Install & Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

---

## Authentication Notes

- **Local auth routes:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/me`
- **Google auth route:**
  - `POST /api/auth/google`
- If an account was created via Google and has no password, password login is rejected for that account.

---

## Default Admin Seed

On startup, if no admin exists, the app seeds:

- **Email:** `admin@cloudkitchen.com`
- **Password:** `Admin@123`

> Change this behavior before production use.

---

## Scripts

- `npm run dev` – start development server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – run Next.js lint task (requires ESLint config)

---

## Security Recommendations

- Never commit real `.env` credentials.
- Rotate any credentials that were ever exposed.
- Restrict Google OAuth allowed origins and configured client IDs.
- Use a strong `JWT_SECRET` in production.

