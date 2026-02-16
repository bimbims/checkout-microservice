# Deployment Quick Start

## 🚀 Deploy to Vercel (Recommended)

### Option 1: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `checkout-microservice` folder as the root directory
5. Configure environment variables (see below)
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
cd checkout-microservice
vercel login  # If not logged in
vercel deploy  # For preview deployment
vercel --prod  # For production deployment
```

## 🔐 Environment Variables Setup

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# PagBank
PAGBANK_API_TOKEN=your_pagbank_token
PAGBANK_SANDBOX=false

# URLs
MAIN_APP_URL=https://ibirahill.com.br
CHECKOUT_BASE_URL=https://checkout-ibirahill.vercel.app

# Cron
CRON_SECRET=your_random_secret_here

# Email
RESEND_API_KEY=re_your_key
FROM_EMAIL=Ibirahill <contato@ibirahill.com>

# Node
NODE_ENV=production
```

## 📝 Post-Deployment Steps

### 1. Configure Supabase

1. Create new Supabase project (or use existing)
2. Run the SQL schema from `src/services/supabase.ts`
3. Enable RLS on all tables
4. Copy URL and keys to Vercel env vars

### 2. Configure PagBank Webhook

1. Access PagBank Dashboard
2. Go to Settings → Webhooks
3. Add URL: `https://your-checkout-url.vercel.app/api/webhooks/pagbank`
4. Select events: `charge.paid`, `charge.authorized`, `charge.declined`

### 3. Set Up Cron Job

Vercel automatically configures the cron job from `vercel.json`.
It runs every hour to expire old checkouts.

To test manually:
```bash
curl -X POST https://your-checkout-url.vercel.app/api/cron/expire-checkouts \
  -H "X-Vercel-Cron-Key: your_cron_secret"
```

### 4. Configure Custom Domain (Optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Add `checkout.ibirahill.com`
3. Update DNS with CNAME record:
   ```
   CNAME checkout → cname.vercel-dns.com
   ```
4. Update `CHECKOUT_BASE_URL` env var

### 5. Test the Deployment

1. Generate a checkout:
   ```bash
   curl -X POST https://your-checkout-url.vercel.app/api/public/generate-checkout \
     -H "Content-Type: application/json" \
     -d '{"bookingId": "REQ-1234567890"}'
   ```

2. Access the checkout URL returned

3. Test payment with sandbox cards (see README.md)

4. Check admin panel: `https://your-checkout-url.vercel.app/admin`

## 🔍 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies in package.json
- Ensure tsconfig.json is correct

### API Endpoints Don't Work
- Check environment variables are set
- Verify Function Logs in Vercel Dashboard
- Check CORS configuration

### Emails Not Sending
- Verify RESEND_API_KEY is correct
- Check FROM_EMAIL is verified in Resend
- Check Function Logs for errors

### Database Errors
- Verify Supabase credentials
- Check RLS policies are enabled
- Ensure schema was created correctly

## 📊 Monitoring

- **Function Logs**: Vercel Dashboard → Project → Logs
- **Database**: Supabase Dashboard → Logs
- **Emails**: Resend Dashboard → Logs
- **Payments**: PagBank Dashboard

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Environment variables configured
- [ ] Supabase database created and schema executed
- [ ] PagBank webhook configured
- [ ] Custom domain configured (optional)
- [ ] Test payment flow completed
- [ ] Admin panel accessible
- [ ] Cron job verified
- [ ] Monitoring set up

---

**Need help?** Check the [README.md](./README.md) for detailed documentation.
