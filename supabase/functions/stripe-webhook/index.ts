import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
            undefined,
            cryptoProvider
        )

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object
                // Update order status
                const { error } = await supabase
                    .from('orders')
                    .update({
                        payment_status: 'succeeded',
                        status: 'processing',
                        payment_intent_id: paymentIntent.id
                    })
                    .eq('payment_intent_id', paymentIntent.id)

                if (error) throw error

                // Log payment
                await supabase.from('payment_logs').insert({
                    event_type: event.type,
                    stripe_event_id: event.id,
                    amount: paymentIntent.amount / 100,
                    status: 'succeeded',
                    payload: paymentIntent
                })
                break

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object
                await supabase
                    .from('orders')
                    .update({ payment_status: 'failed' })
                    .eq('payment_intent_id', failedIntent.id)

                await supabase.from('payment_logs').insert({
                    event_type: event.type,
                    stripe_event_id: event.id,
                    amount: failedIntent.amount / 100,
                    status: 'failed',
                    error_message: failedIntent.last_payment_error?.message,
                    payload: failedIntent
                })
                break
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(err.message, { status: 400 })
    }
})
