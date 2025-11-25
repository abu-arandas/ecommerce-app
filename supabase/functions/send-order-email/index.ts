// Supabase Edge Function: Send Order Confirmation Email
// Deploy to: supabase/functions/send-order-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface OrderEmailData {
    orderId: string
    customerEmail: string
    customerName: string
    orderTotal: number
    orderItems: Array<{
        name: string
        quantity: number
        price: number
        image: string
    }>
    shippingAddress: string
}

serve(async (req) => {
    try {
        // Parse request body
        const { orderId, customerEmail, customerName, orderTotal, orderItems, shippingAddress } = await req.json() as OrderEmailData

        // Generate email HTML
        const emailHtml = generateOrderConfirmationEmail({
            orderId,
            customerName,
            orderTotal,
            orderItems,
            shippingAddress,
        })

        // Send email using Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'BeautyHub <orders@beautyhub.com>',
                to: [customerEmail],
                subject: `Order Confirmation #${orderId.substring(0, 8)}`,
                html: emailHtml,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(`Resend API error: ${JSON.stringify(data)}`)
        }

        // Log email sent
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        await supabase.from('email_logs').insert({
            order_id: orderId,
            email_type: 'order_confirmation',
            recipient: customerEmail,
            status: 'sent',
            provider_response: data,
        })

        return new Response(
            JSON.stringify({ success: true, messageId: data.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Email sending error:', error)

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

function generateOrderConfirmationEmail(data: {
    orderId: string
    customerName: string
    orderTotal: number
    orderItems: Array<{ name: string; quantity: number; price: number; image: string }>
    shippingAddress: string
}): string {
    const { orderId, customerName, orderTotal, orderItems, shippingAddress } = data

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
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
        .order-id {
          background-color: #f5e6e8;
          border-left: 4px solid #8b5a5a;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
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
        .item-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
        }
        .total {
          text-align: right;
          font-size: 24px;
          font-weight: bold;
          color: #8b5a5a;
          margin: 20px 0;
        }
        .shipping-info {
          background-color: #f8f8f8;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f8f8;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Thank You for Your Order!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>We've received your order and we're excited to get it ready for you!</p>
          
          <div class="order-id">
            <strong>Order ID:</strong> #${orderId.substring(0, 8).toUpperCase()}
          </div>
          
          <h2 style="color: #8b5a5a; margin-top: 30px;">Order Details</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${item.image}" alt="${item.name}" class="item-image" />
                      <span>${item.name}</span>
                    </div>
                  </td>
                  <td>${item.quantity}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total: $${orderTotal.toFixed(2)}
          </div>
          
          <h2 style="color: #8b5a5a;">Shipping Address</h2>
          <div class="shipping-info">
            ${shippingAddress.replace(/\n/g, '<br>')}
          </div>
          
          <div style="text-align: center;">
            <a href="https://beautyhub.com/orders/${orderId}" class="button">
              Track Your Order
            </a>
          </div>
          
          <p style="margin-top: 30px;">
            <strong>What's Next?</strong><br>
            We're processing your order now. You'll receive another email with tracking information once your order ships.
          </p>
          
          <p>
            If you have any questions, feel free to reply to this email or contact our support team.
          </p>
          
          <p style="margin-top: 30px;">
            Thank you for shopping with BeautyHub! 💄<br>
            <em>The BeautyHub Team</em>
          </p>
        </div>
        
        <div class="footer">
          <p>
            BeautyHub | Premium Beauty Products<br>
            <a href="https://beautyhub.com" style="color: #8b5a5a;">beautyhub.com</a>
          </p>
          <p style="margin-top: 10px;">
            This email was sent to ${data.customerName}. If you didn't make this purchase, please contact us immediately.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
