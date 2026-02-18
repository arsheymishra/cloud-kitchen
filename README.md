# Cloud Kitchen App

A Next.js 14 application for managing a cloud kitchen workflow.

## Prerequisites

Before running locally, make sure you have:

- **Node.js 18+** (Node 20 recommended)
- **npm**
- A reachable **MongoDB** database
- **Cloudinary** credentials (for image uploads)

## 1) Install dependencies

From the project root:

```bash
npm install
```

## 2) Configure environment variables

Create or update a `.env` file in the project root.

Required variables:

```env
PORT=3000
MONGO_URL=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> ⚠️ If you are using shared credentials in development, replace them with your own secrets before deploying.

## 3) Start the app in development mode

```bash
npm run dev
```

The app will be available at:

- `http://localhost:3000`

## 4) Run production build locally (optional)

```bash
npm run build
npm run start
```

## Helpful scripts

- `npm run dev` – Start local development server
- `npm run build` – Create production build
- `npm run start` – Run production server
- `npm run lint` – Run ESLint checks

## Troubleshooting

- **Port already in use**: change `PORT` in `.env`.
- **Database connection errors**: verify `MONGO_URL` and network/IP access.
- **Image upload issues**: verify Cloudinary environment values.
