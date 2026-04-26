# Merchant Portal Setup

This document configures RobotZio merchant self-service with database-backed onboarding and Stripe payments.

## 1) Environment Variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `DATABASE_SSL` (`require` in cloud environments)
- `ADMIN_EMAIL` (the email that should become admin at registration)
- `UPLOAD_DIR` (absolute directory for uploaded listing images)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (optional, default: `robotzio`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY` (default: `aed`)
- `MERCHANT_ONBOARDING_FEE`
- `MERCHANT_DEPOSIT_FEE`
- `BASE_URL`

## 2) Create Database Tables

Run:

```bash
npm run db:init
```

This applies `scripts/merchant-schema.sql` automatically.

## 3) Configure Stripe Webhook

Create a webhook endpoint in Stripe:

- Endpoint URL: `https://your-domain.com/api/stripe-webhook`
- Events: `checkout.session.completed`

Use the signing secret as `STRIPE_WEBHOOK_SECRET`.

## 4) Merchant Flow

Merchant flow is now:

1. Open `merchant-portal.html`
2. Save profile (stored in DB if `DATABASE_URL` is configured)
3. Add product/solution listings
4. Pay onboarding fee and security deposit
5. Webhook marks payment records as `paid`
6. Merchant onboarding status upgrades to:
   - `pending_payment` when one payment is done
   - `active` when both onboarding and deposit payments are complete

## 5) Account & Admin

- Registration/Login APIs:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Admin console page: `admin.html`
- Admin APIs:
  - `GET /api/admin/overview`
  - `POST /api/admin/merchant-status`
  - `GET /api/media/admin-list`
  - `POST /api/media/admin-delete`

## 6) Image Management

- Merchant portal now uploads listing images via `POST /api/media/upload`
- Max 5 images per listing
- Image URLs are stored in `merchant_listings.image_names`
- Admin console has a Media Library section with preview and delete actions
- Upload behavior:
  - If Cloudinary env vars are configured, uploads are stored in Cloudinary (recommended for Netlify)
  - Otherwise, system falls back to local `UPLOAD_DIR`
