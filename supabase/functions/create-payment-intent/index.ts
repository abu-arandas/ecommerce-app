// Supabase Edge Function: Create Stripe Payment Intent
// Deploy to: supabase/functions/create-payment-intent/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

interface PaymentIntentRequest {
    amount: number
    orderId: string
    customerEmail?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        })
    }

    try {
        const { amount, orderId, customerEmail } = await req.json() as PaymentIntentRequest

        // Validate input
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount')
        }

        if (!orderId) {
            throw new Error('Order ID is required')
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                orderId,
            },
            receipt_email: customerEmail,
            automatic_payment_methods: {
                enabled: true,
            },
        })

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error: any) {
        console.error('Payment intent creation error:', error)

        return new Response(
            JSON.stringify({
                error: error.message || 'Failed to create payment intent',
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})
