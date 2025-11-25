// Supabase Edge Function: Unified Email Service
// Handles all email types: order confirmation, shipping, delivery
// Deploy to: supabase/functions/send-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://beautyhub.com'

type EmailType = 'order_confirmation' | 'shipping_notification' | 'delivery_confirmation' | 'order_update'

interface EmailRequest {
    type: EmailType
    orderId: string
    customerEmail: string
    customerName: string
    orderData: {
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
            image?: string
        }>
        shippingAddress: string
        trackingNumber?: string
        carrier?: string
        estimatedDelivery?: string
    }
}

serve(async (req) => {
    // Handle CORS
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
        const emailRequest = await req.json() as EmailRequest
        const { type, orderId, customerEmail, customerName, orderData } = emailRequest

        // Generate email based on type
        const { subject, html } = generateEmail(type, {
            orderId,
            customerName,
            ...orderData
        })

        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'BeautyHub <orders@beautyhub.com>',
                to: [customerEmail],
                subject,
                html,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(`Resend API error: ${JSON.stringify(data)}`)
        }

        // Log email in database
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        await supabase.from('email_logs').insert({
            order_id: orderId,
            email_type: type,
            recipient: customerEmail,
            status: 'sent',
            provider_response: data,
        })

        console.log(`Email sent successfully: ${type} for order ${orderId}`)

        return new Response(
            JSON.stringify({ success: true, messageId: data.id }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        )
    } catch (error: any) {
        console.error('Email sending error:', error)

        // Log failure
        try {
            const emailRequest = await req.json() as EmailRequest
            const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
            await supabase.from('email_logs').insert({
                order_id: emailRequest.orderId,
                email_type: emailRequest.type,
                recipient: emailRequest.customerEmail,
                status: 'failed',
                error_message: error.message,
            })
        } catch (logError) {
            console.error('Failed to log email error:', logError)
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        )
    }
})

function generateEmail(type: EmailType, data: any): { subject: string; html: string } {
    const orderId = data.orderId.substring(0, 8).toUpperCase()

    switch (type) {
        case 'order_confirmation':
            return {
                subject: `Order Confirmation #${orderId}`,
                html: generateOrderConfirmationEmail(data)
            }

        case 'shipping_notification':
            return {
                subject: `Your Order Has Shipped! #${orderId}`,
                html: generateShippingNotificationEmail(data)
            }

        case 'delivery_confirmation':
            return {
                subject: `Your Order Has Been Delivered! #${orderId}`,
                html: generateDeliveryConfirmationEmail(data)
            }

        case 'order_update':
            return {
                subject: `Order Update #${orderId}`,
                html: generateOrderUpdateEmail(data)
            }

        default:
            throw new Error(`Unknown email type: ${type}`)
    }
}

// Email template styles (reusable)
const emailStyles = `
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
    }
    .container {
        background-color: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
        background: linear-gradient(135deg, #8b5a5a 0%, #6d4747 100%);
        color: white;
        padding: 30px;
        text-align: center;
    }
    .header h1 {
        margin: 0;
        font-size: 28px;
    }
    .content {
        padding: 30px;
    }
    .highlight-box {
        background-color: #f5e6e8;
        border-left: 4px solid #8b5a5a;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
    }
    .button {
        display: inline-block;
        background-color: #8b5a5a;
        color: white !important;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
        font-weight: bold;
    }
    .footer {
        background-color: #f8f8f8;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
    }
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }
    .items-table th {
        background-color: #f8f8f8;
        padding: 12px;
        text-align: left;
        border-bottom: 2px solid #ddd;
    }
    .items-table td {
        padding: 12px;
        border-bottom: 1px solid #eee;
    }
`

function generateOrderConfirmationEmail(data: any): string {
    const { orderId, customerName, total, items, shippingAddress } = data
    const orderIdShort = orderId.substring(0, 8).toUpperCase()

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Thank You for Your Order!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${customerName},</p>
                <p>We've received your payment and we're getting your order ready!</p>
                
                <div class="highlight-box">
                    <strong>Order ID:</strong> #${orderIdShort}
                </div>
                
                <h2 style="color: #8b5a5a;">Order Details</h2>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right; font-size: 20px; font-weight: bold; color: #8b5a5a; margin: 20px 0;">
                    Total: $${total.toFixed(2)}
                </div>
                
                <h2 style="color: #8b5a5a;">Shipping Address</h2>
                <div style="background-color: #f8f8f8; padding: 15px; border-radius: 6px;">
                    ${shippingAddress.replace(/\n/g, '<br>')}
                </div>
                
                <div style="text-align: center;">
                    <a href="${FRONTEND_URL}/orders/${orderId}" class="button">
                        Track Your Order
                    </a>
                </div>
                
                <p style="margin-top: 30px;">
                    <strong>What's Next?</strong><br>
                    We're processing your order now. You'll receive another email with tracking information once your order ships (usually within 1-2 business days).
                </p>
                
                <p>Thank you for shopping with BeautyHub! 💄</p>
            </div>
            
            <div class="footer">
                <p>BeautyHub | Premium Beauty Products<br>
                <a href="${FRONTEND_URL}" style="color: #8b5a5a;">beautyhub.com</a></p>
                <p style="margin-top: 10px;">
                    Questions? Reply to this email or contact support@beautyhub.com
                </p>
            </div>
        </div>
    </body>
    </html>
    `
}

function generateShippingNotificationEmail(data: any): string {
    const { orderId, customerName, trackingNumber, carrier, estimatedDelivery } = data
    const orderIdShort = orderId.substring(0, 8).toUpperCase()

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Shipped</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📦 Your Order Has Shipped!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${customerName},</p>
                <p>Great news! Your order is on its way!</p>
                
                <div class="highlight-box">
                    <strong>Order ID:</strong> #${orderIdShort}
                </div>
                
                <h2 style="color: #8b5a5a;">Shipping Information</h2>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px 0;"><strong>Carrier:</strong> ${carrier || 'Standard Shipping'}</li>
                    <li style="padding: 8px 0;"><strong>Tracking Number:</strong> ${trackingNumber || 'Will be updated soon'}</li>
                    <li style="padding: 8px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery || '3-5 business days'}</li>
                </ul>
                
                ${trackingNumber ? `
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.google.com/search?q=${trackingNumber}+${carrier}" class="button">
                            Track Your Package
                        </a>
                    </div>
                ` : ''}
                
                <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>📍 Track your delivery:</strong><br>
                    Your package will be delivered to the address provided at checkout. Make sure someone is available to receive it!
                </div>
                
                <p>We'll send you another email once your package is delivered.</p>
                
                <p>Thank you for choosing BeautyHub! 💄</p>
            </div>
            
            <div class="footer">
                <p>BeautyHub | Premium Beauty Products<br>
                <a href="${FRONTEND_URL}" style="color: #8b5a5a;">beautyhub.com</a></p>
            </div>
        </div>
    </body>
    </html>
    `
}

function generateDeliveryConfirmationEmail(data: any): string {
    const { orderId, customerName } = data
    const orderIdShort = orderId.substring(0, 8).toUpperCase()

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Delivered</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Your Order Has Been Delivered!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${customerName},</p>
                <p>Your BeautyHub order has been successfully delivered!</p>
                
                <div class="highlight-box">
                    <strong>Order ID:</strong> #${orderIdShort}
                </div>
                
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>💡 How was your experience?</strong><br>
                    We'd love to hear your feedback! Your review helps other customers make informed decisions.
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${FRONTEND_URL}/orders/${orderId}" class="button">
                        Leave a Review
                    </a>
                </div>
                
                <h2 style="color: #8b5a5a;">Need Help?</h2>
                <p>If you have any issues with your order, our support team is here to help:</p>
                <ul>
                    <li>Reply to this email</li>
                    <li>Email: support@beautyhub.com</li>
                    <li>Visit our <a href="${FRONTEND_URL}/help" style="color: #8b5a5a;">Help Center</a></li>
                </ul>
                
                <p style="margin-top: 30px;">
                    Thank you for shopping with BeautyHub! We hope to see you again soon. 💄✨
                </p>
            </div>
            
            <div class="footer">
                <p>BeautyHub | Premium Beauty Products<br>
                <a href="${FRONTEND_URL}" style="color: #8b5a5a;">beautyhub.com</a></p>
            </div>
        </div>
    </body>
    </html>
    `
}

function generateOrderUpdateEmail(data: any): string {
    const { orderId, customerName, updateMessage } = data
    const orderIdShort = orderId.substring(0, 8).toUpperCase()

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📢 Order Update</h1>
            </div>
            
            <div class="content">
                <p>Hi ${customerName},</p>
                <p>There's an update regarding your order:</p>
                
                <div class="highlight-box">
                    <strong>Order ID:</strong> #${orderIdShort}
                </div>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    ${updateMessage || 'Your order status has been updated.'}
                </div>
                
                <div style="text-align: center;">
                    <a href="${FRONTEND_URL}/orders/${orderId}" class="button">
                        View Order Details
                    </a>
                </div>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
                <p>BeautyHub | Premium Beauty Products<br>
                <a href="${FRONTEND_URL}" style="color: #8b5a5a;">beautyhub.com</a></p>
            </div>
        </div>
    </body>
    </html>
    `
}
