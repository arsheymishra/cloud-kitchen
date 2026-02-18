# Cloud Kitchen App

Cloud Kitchen is a **Next.js 14** app with:
- user/admin authentication,
- food management,
- order management,
- MongoDB persistence,
- Cloudinary image uploads.

## Local setup

### 1) Prerequisites

Install the following first:

- **Node.js 18+** (Node 20 recommended)
- **npm**
- A running **MongoDB** database (local or Atlas)
- A **Cloudinary** account for image upload support

### 2) Install dependencies

From the project root:

```bash
npm install
```

### 3) Configure environment variables

Create a `.env` file in the project root and add:

```env
PORT=3000
MONGO_URL=<your-mongodb-connection-string>
JWT_SECRET=<your-strong-random-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Security note: never commit real secrets to git.

### 4) Start the app

```bash
npm run dev
```

Open:

- http://localhost:3000

## Default admin account (auto-created)

On first API initialization, the backend creates a default admin user if it does not exist:

- **Email:** `admin@cloudkitchen.com`
- **Password:** `Admin@123`

You can use this account to access admin-protected flows.

## Useful scripts

- `npm run dev` – run development server
- `npm run build` – build for production
- `npm run start` – start production build
- `npm run lint` – run lint checks

## Optional: run production mode locally

```bash
npm run build
npm run start
```

## Optional: API test script

There is a backend API test script in `backend_test.py`.

1. Start the app (`npm run dev`)
2. In another terminal, run:

```bash
python3 backend_test.py
```

The script targets `http://localhost:3000` by default.

## Troubleshooting

- **Port conflict**
  - Change `PORT` in `.env`.
- **MongoDB connection errors**
  - Verify `MONGO_URL` and database network access.
- **Cloudinary upload failures**
  - Verify all three Cloudinary env vars are set correctly.
- **Auth token errors**
  - Ensure `JWT_SECRET` is present and stable across restarts.
