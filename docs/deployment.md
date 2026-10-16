# Sika Cuisine — Production Deployment Guide

## 1. Hosting Recommendations

1. **Next.js Frontend & API:** Vercel, Node.js Docker container, or AWS Amplify.
2. **PostgreSQL Database:** Supabase PostgreSQL or AWS RDS (eu-west-1 region recommended for lowest latency to West Africa / Ghana).
3. **Payment Provider:** Paystack Live Mode (Ghana).

---

## 2. Environment Variables Checklist

Ensure the following variables are configured in production:
```bash
NEXT_PUBLIC_APP_URL="https://sikacuisine.com"
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
AUTH_SECRET="[secure-32-byte-secret]"
PAYSTACK_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
PAYSTACK_WEBHOOK_SECRET="[configured-paystack-webhook-secret]"
```

---

## 3. Database Migration & Seeding in Production
```bash
# Push database schema
npx prisma db push

# (Optional) Seed initial categories and admin accounts
npm run db:seed
```
