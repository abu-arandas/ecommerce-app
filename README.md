# BeautyHub - E-Commerce Platform

A modern, full-stack e-commerce platform built with React, TypeScript, Supabase, and Stripe.

## Features

- 🛍️ Complete shopping experience (cart, wishlist, checkout)
- 💳 Secure payment processing with Stripe
- 📧 Automated email notifications
- ⭐ Customer reviews and ratings
- 🔍 Advanced product search and filtering
- 👑 Admin dashboard for management
- 📱 Fully responsive design
- 🔒 Secure authentication and authorization

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Payment:** Stripe
- **Email:** Resend
- **Testing:** Playwright (E2E), Vitest (Unit)
- **CI/CD:** GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account (test mode)
- Resend account (optional)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ecommerce-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Execute database-schema.sql in Supabase Dashboard
```

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FRONTEND_URL=http://localhost:5173

# Deploy functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy send-email
```

### Configure Stripe Webhook

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events: `payment_intent.*`, `charge.refunded`
4. Copy webhook secret and set: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

### Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
ecommerce-app/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── api/           # API functions
│   ├── store/         # Zustand state management
│   └── App.tsx        # Main app
├── supabase/
│   └── functions/     # Edge Functions
│       ├── create-payment-intent/
│       ├── stripe-webhook/
│       └── send-email/
├── tests/
│   └── e2e/          # Playwright E2E tests
├── database-schema.sql  # Complete database schema
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Lint code

## Testing

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

### Test Cards (Stripe)

- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 0002`

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

### Production Checklist

- [ ] Database schema deployed
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Stripe webhook configured
- [ ] Email service configured
- [ ] Test payment flow
- [ ] Switch to live Stripe keys

## Features Breakdown

### User Features
- Product browsing and search
- Shopping cart management
- Wishlist
- Secure checkout with Stripe
- Order history
- Product reviews

### Admin Features
- Product management (CRUD)
- Order management
- Category management
- Dashboard analytics

### Email Notifications
- Order confirmation
- Shipping notification
- Delivery confirmation
- Order updates

## Security

- Row Level Security (RLS) on all tables
- Webhook signature verification
- Environment variables for secrets
- Input validation
- Secure authentication via Supabase Auth

## Performance

- Code splitting
- Lazy loading
- Optimized images
- CDN ready
- Database indexes

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
