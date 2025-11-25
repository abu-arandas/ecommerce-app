# Stripe Webhook Edge Function

This function handles Stripe webhooks to update order status and log payments.

## Deployment

1. Ensure you have the Supabase CLI installed.
2. Login to Supabase:
   ```bash
   npx supabase login
   ```
3. Deploy the function:
   ```bash
   npx supabase functions deploy stripe-webhook
   ```
4. Set the required secrets:
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing Locally

1. Start the function:
   ```bash
   npx supabase functions serve stripe-webhook
   ```
2. Use the Stripe CLI to forward events:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```
