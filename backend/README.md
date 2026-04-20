# SmartShelf Backend (Firebase + Express)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create `.env` in this folder using `.env.example` as template.

Required values:
- `FIREBASE_WEB_API_KEY`
- Firebase Admin credentials (`GOOGLE_APPLICATION_CREDENTIALS` OR `FIREBASE_SERVICE_ACCOUNT_JSON` OR `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`)
- `FRONTEND_ORIGIN` (default: `http://localhost:8080`)
- SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- `EMAIL_ACTION_CONTINUE_URL` (for verify/reset redirect)

Notes:
- Localhost origins on any port are allowed by CORS for development.
- Recommended local setup: set `GOOGLE_APPLICATION_CREDENTIALS` to your downloaded Firebase service-account JSON path.

## 3) Run backend

```bash
npm run dev
```

Backend URL: `http://localhost:5000`
Health endpoint: `GET /api/health`

## API endpoints

- `POST /api/auth/register`
  - body: `{ name, email, password, role, phoneNumber }`
  - creates account and sends verification email via SMTP
- `POST /api/auth/login`
  - body: `{ email, password, role }`
  - requires verified email before login
- `POST /api/auth/forgot-password`
  - body: `{ email }`
  - sends reset link via SMTP (Firebase reset link expires in about 1 hour)
- `GET /api/products` (Bearer token)
  - supplier role gets only products mapped to supplier name or created by that supplier
- `POST /api/products` (Bearer token)
  - body: `{ name, quantity, expiryDate, supplier }`
- `PUT /api/products/:id` (Bearer token)
  - body: `{ name, quantity, expiryDate, supplier }`
- `DELETE /api/products/:id` (Bearer token)
