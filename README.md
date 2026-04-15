# SmartShelf — Stock Expiry Management System

SmartShelf is a full-stack inventory and expiry monitoring system designed for retail use.

It helps two user roles:
- **Shopkeeper**: manage inventory, add/update/delete products, monitor low stock and expiry alerts.
- **Supplier**: view supplier-relevant products and respond to stock/expiry needs.

---

## 1) Project Overview

This repository is a **monorepo** with separate frontend and backend apps:

- **Frontend**: `frontend/` (React + Vite + TypeScript + Tailwind)
- **Backend**: `backend/` (Node.js + Express + Firebase Auth + Firestore)

The frontend communicates with the backend API, and the backend uses Firebase services for authentication and data persistence.

---

## 2) Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query (available in app setup)
- Radix UI + shadcn/ui components
- Sonner (toasts)

### Backend
- Node.js
- Express
- Firebase Admin SDK
- Firebase Identity Toolkit REST API (for email/password login/register/reset flows)
- Firestore (NoSQL database)
- CORS + Helmet + Morgan

### Database / Cloud
- **Firebase Authentication** for user accounts
- **Cloud Firestore** for `users` and `products` collections

### Deployment
- Render (backend / optional static frontend)
- Vercel (frontend)

---

## 3) High-Level Architecture

1. User interacts with frontend UI.
2. Frontend sends requests to backend REST API.
3. Backend validates token (Bearer token from Firebase Auth).
4. Backend applies role checks (shopkeeper/supplier).
5. Backend reads/writes Firestore.
6. Backend returns JSON response; frontend updates UI and notifications.

---

## 4) Authentication and Authorization Flow

### Register
1. Frontend posts to `/api/auth/register` with `name`, `email`, `password`, `role`.
2. Backend creates Firebase auth user.
3. Backend writes user profile in Firestore `users/{uid}`.
4. Backend returns user payload + `idToken`.

### Login
1. Frontend posts to `/api/auth/login` with `email`, `password`, `role`.
2. Backend validates credentials using Firebase Auth REST API.
3. Backend verifies role using stored Firestore profile.
4. Backend returns user payload + token.

### Protected API access
- Frontend stores session in local storage.
- For protected routes, frontend sends `Authorization: Bearer <token>`.
- Backend verifies token with Firebase Admin.

### Forgot Password
- Frontend posts email to `/api/auth/forgot-password`.
- Backend requests Firebase password reset email.

---

## 5) Product Workflow

### Shopkeeper
- Add product
- View all products
- Edit product
- Delete product
- See dashboard metrics and alerts (expiry + low stock)

### Supplier
- View filtered product list based on supplier mapping logic
- Can access supplier-relevant records as enforced by backend role filters

### Product fields
- `id`
- `name`
- `quantity`
- `expiryDate` (ISO date)
- `supplier`
- metadata: `createdBy`, timestamps

---

## 6) Database Model (Firestore)

### `users` collection
Document key: Firebase `uid`

Typical fields:
- `name`
- `email`
- `role` (`shopkeeper` | `supplier`)
- `createdAt`
- `updatedAt`

### `products` collection
Document key: auto-generated

Typical fields:
- `name`
- `quantity`
- `expiryDate`
- `supplier`
- `supplierNormalized`
- `createdBy`
- `createdAt`
- `updatedAt`

---

## 7) API Summary

Base URL: `http://localhost:5000/api` (local)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`

### Products (Bearer token required)
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`

Health:
- `GET /health`

For request/response-level backend details, see `backend/README.md`.

---

## 8) Local Development Setup

## 8.1 Prerequisites
- Node.js 18+ (Node 22 also works)
- npm
- Firebase project with:
	- Email/Password sign-in enabled
	- Firestore enabled
	- Service account credentials

## 8.2 Install and run backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend default URL: `http://localhost:5000`

## 8.3 Install and run frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend Vite URL is shown in terminal (usually `http://localhost:8080` or next free port).

---

## 9) Environment Variables

## Backend (`backend/.env`)
- `PORT`
- `FRONTEND_ORIGIN` (comma-separated allowlist)
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_PROJECT_ID`
- One Firebase Admin credential strategy:
	- `GOOGLE_APPLICATION_CREDENTIALS`
	- OR `FIREBASE_SERVICE_ACCOUNT_JSON`
	- OR `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

## Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` (example: `http://localhost:5000/api`)

---

## 10) Deployment Workflow

This repo includes a Render blueprint:
- `render.yaml`

Recommended deployment:
1. Deploy backend as Render Web Service from `backend/` rootDir.
2. Set backend environment variables in Render dashboard.
3. Deploy frontend (Render Static Site or Vercel) from `frontend/`.
4. Set frontend `VITE_API_BASE_URL` to deployed backend URL.
5. Configure backend `FRONTEND_ORIGIN` with deployed frontend domains.

---

## 11) Security Notes

- Keep all secrets in environment variables.
- Never commit `.env` files to git.
- Rotate Firebase service account private keys if exposed.
- Restrict CORS allowlist to trusted frontend origins.

---

## 12) Useful Scripts

### Backend
- `npm run dev` — run with nodemon
- `npm start` — production start

### Frontend
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run test` — tests

---

## 13) Current Feature Set

- Role-based authentication (`shopkeeper`, `supplier`)
- Product CRUD
- Role-based product filtering for supplier view
- Expiry status dashboard and low-stock alerts
- Forgot password flow via Firebase
- Separate frontend/backend deploy-ready structure

---

## 14) Repository Structure

```text
.
├─ frontend/          # React app (UI)
├─ backend/           # Express API + Firebase integration
├─ render.yaml        # Render blueprint for monorepo deployment
└─ README.md          # Project documentation
```

---

## 15) Notes

- If CORS errors appear after deploy, verify:
	- frontend URL in backend `FRONTEND_ORIGIN`
	- frontend `VITE_API_BASE_URL`
- If auth registration fails with `CONFIGURATION_NOT_FOUND`, enable Email/Password provider in Firebase Auth.
