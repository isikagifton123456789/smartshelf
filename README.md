# SmartShelf — Stock Expiry & CRM Management System

SmartShelf is a full-stack retail platform for inventory expiry management plus supplier-shopkeeper CRM workflows.

It supports two roles:
- **Shopkeeper**: inventory management, supplier orders, notifications, and stock/expiry monitoring.
- **Supplier**: product visibility, order handling, delivery status updates, and action notifications.

---

## 1) Monorepo Structure

This repository is a monorepo:

- `frontend/` — React + Vite + TypeScript UI
- `backend/` — Node.js + Express API
- `render.yaml` — Render monorepo blueprint

---

## 2) Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- shadcn/ui + Radix UI
- Sonner toasts
- `@react-oauth/google` for Google sign-in

### Backend
- Node.js + Express
- Firebase Admin SDK
- Firebase Identity Toolkit REST API
- Firestore
- Nodemailer (SMTP emails)
- Helmet, CORS, Morgan

### Cloud / Auth / DB
- Firebase Authentication (Email/Password + Google)
- Cloud Firestore collections:
	- `users`
	- `products`
	- `orders`
	- `notifications`

---

## 3) Current Features

### Authentication
- Email/password registration + login
- Email verification on register
- Forgot password via SMTP reset email
- Google sign-in/sign-up with role assignment
- Role enforcement (`shopkeeper`, `supplier`)

### Inventory
- Product CRUD
- Supplier-filtered product access
- Quantity units support (`pcs`, `kg`, `g`, `l`, `ml`)
- Expiry + low-stock alerts

### CRM (Orders & Delivery)
- Shopkeeper creates supplier orders
- Supplier updates order status:
	- `pending` → `confirmed` → `in_transit` → `delivered`
	- plus `cancelled`
- Delivery/order status visible to both roles

### Notification System
- Supplier product actions (`restock`, `acknowledge`) notify shopkeeper
- New order creation notifies supplier
- Order status updates notify shopkeeper
- Notification center supports mark-as-read
- Existing expiry/stock alerts still available

### Branding
- Uses assets from `frontend/public`:
	- `Logo.png`
	- `favicon.ico`

---

## 4) High-Level Request Flow

1. User acts in frontend.
2. Frontend calls backend `/api/*` routes.
3. Backend verifies bearer token with Firebase Admin.
4. Backend applies role checks.
5. Backend reads/writes Firestore.
6. API returns JSON; UI updates tables, cards, and notifications.

---

## 5) API Summary

Base URL (local): `http://localhost:5000/api`

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/forgot-password`

### Products (auth required)
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`

### Orders (auth required)
- `GET /orders`
- `POST /orders`
- `PATCH /orders/:id/status`

### Notifications (auth required)
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /notifications/product-action`

For deeper endpoint details, see `backend/README.md`.

---

## 6) Firestore Data Model (Typical)

### `users/{uid}`
- `name`
- `email`
- `role`
- `phoneNumber`
- `emailVerified`
- `createdAt`, `updatedAt`

### `products/{id}`
- `name`
- `quantity`
- `quantityUnit`
- `expiryDate`
- `supplier`
- `supplierNormalized`
- `createdBy`, `createdByName`, `createdByPhone`
- `createdAt`, `updatedAt`

### `orders/{id}`
- `supplierId`, `supplierName`
- `productName`
- `quantity`, `quantityUnit`
- `storeLocation`
- `requestedDeliveryDate`
- `status`
- `createdBy`, `createdByName`, `createdByPhone`
- `createdAt`, `updatedAt`

### `notifications/{id}`
- `recipientId`
- `senderId`, `senderName`
- `type`, `title`, `message`
- `relatedEntityType`, `relatedEntityId`
- `isRead`
- `createdAt`, `updatedAt`

---

## 7) Local Development Setup

### Prerequisites
- Node.js 18+ (22 works)
- npm
- Firebase project with:
	- Authentication enabled (Email/Password + Google)
	- Firestore enabled
	- Admin service account credentials

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 8) Environment Variables

### Backend (`backend/.env`)
- `PORT`
- `FRONTEND_ORIGIN` (comma-separated list)
- `FIREBASE_WEB_API_KEY`
- Firebase Admin credentials (one strategy):
	- `GOOGLE_APPLICATION_CREDENTIALS`
	- OR `FIREBASE_SERVICE_ACCOUNT_JSON`
	- OR `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- SMTP:
	- `SMTP_HOST`
	- `SMTP_PORT`
	- `SMTP_SECURE`
	- `SMTP_USER`
	- `SMTP_PASS`
	- `SMTP_FROM`
- `EMAIL_ACTION_CONTINUE_URL`

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

---

## 9) Deployment Notes

### Recommended
1. Deploy backend from `backend/` (Render Web Service).
2. Deploy frontend from `frontend/` (Vercel or Render static site).
3. Set frontend `VITE_API_BASE_URL` to deployed backend API URL.
4. Set backend `FRONTEND_ORIGIN` to all frontend domains.

### Google OAuth (important)
If Google login shows `origin_mismatch`:
1. Open Google Cloud Console → Credentials.
2. Open OAuth client ID used in `VITE_GOOGLE_CLIENT_ID`.
3. Add all frontend origins under **Authorized JavaScript origins** (no paths).
4. Add same domains in Firebase Auth → Authorized domains.

---

## 10) Scripts

### Backend
- `npm run dev`
- `npm start`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run test`

---

## 11) Repository Layout

```text
.
├─ frontend/
│  ├─ public/
│  │  ├─ Logo.png
│  │  └─ favicon.ico
│  └─ src/
├─ backend/
│  └─ src/
│     ├─ routes/
│     └─ services/
├─ render.yaml
└─ README.md
```

---

## 12) Troubleshooting

- **CORS blocked**: verify deployed frontend URL is listed in backend `FRONTEND_ORIGIN`.
- **Google login `origin_mismatch`**: verify OAuth JavaScript origins + Firebase authorized domains.
- **Email/password registration `CONFIGURATION_NOT_FOUND`**: enable Email/Password in Firebase Auth.
- **No notification entries**: confirm user role and action path (`/notifications/product-action`, `/orders/*`) and Firestore write permissions.
