// Supabase Edge Function: Send Shipping Notification
// Deploy to: supabase/functions/send-shipping-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface ShippingEmailData {
    orderId: string
    customerEmail: string
    customerName: string
    trackingNumber?: string
    carrier?: string
    estimatedDelivery?: string
}

serve(async (req) => {
    try {
        const { orderId, customerEmail, customerName, trackingNumber, carrier, estimatedDelivery } = await req.json() as ShippingEmailData

        const emailHtml = generateShippingEmail({
            orderId,
            customerName,
            trackingNumber,
            carrier,
            estimatedDelivery,
        })

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'BeautyHub <shipping@beautyhub.com>',
                to: [customerEmail],
                subject: `📦 Your Order is On the Way! #${orderId.substring(0, 8)}`,
                html: emailHtml,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(`Resend API error: ${JSON.stringify(data)}`)
        }

        return new Response(
            JSON.stringify({ success: true, messageId: data.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

function generateShippingEmail(data: {
    orderId: string
    customerName: string
    trackingNumber?: string
    carrier?: string
    estimatedDelivery?: string
}): string {
    const { orderId, customerName, trackingNumber, carrier, estimatedDelivery } = data

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order is Shipped!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px;
        }
        .tracking-box {
          background: linear-gradient(135deg, #f5e6e8 0%, #e8d4d8 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .tracking-number {
          font-size: 24px;
          font-weight: bold;
          color: #8b5a5a;
          margin: 10px 0;
          letter-spacing: 2px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
          font-size: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .info-item {
          background-color: #f8f8f8;
          padding: 15px;
          border-radius: 6px;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        .footer {
          background-color: #f8f8f8;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">📦</div>
          <h1>Your Order is On the Way!</h1>
          <p>Your BeautyHub order has shipped</p>
        </div>
        
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          ${trackingNumber ? `
            <div class="tracking-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Tracking Number</p>
              <div class="tracking-number">${trackingNumber}</div>
              ${carrier ? `<p style="margin: 5px 0 0 0; color: #666;">Carrier: ${carrier}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="https://beautyhub.com/track/${trackingNumber}" class="button">
                Track Your Package
              </a>
            </div>
          ` : ''}
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Order Number</div>
              <div class="info-value">#${orderId.substring(0, 8).toUpperCase()}</div>
            </div>
            ${estimatedDelivery ? `
              <div class="info-item">
                <div class="info-label">Estimated Delivery</div>
                <div class="info-value">${estimatedDelivery}</div>
              </div>
            ` : ''}
          </div>
          
          <h3 style="color: #8b5a5a; margin-top: 30px;">What to Expect</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>Your package may take 3-5 business days to arrive</li>
            <li>You'll receive updates as your package moves</li>
            <li>Signature may be required upon delivery</li>
            <li>Contact us if you have any questions</li>
          </ul>
          
          <p style="margin-top: 30px;">
            Thank you for your patience! We hope you love your new products. 💄<br>
            <em>The BeautyHub Team</em>
          </p>
        </div>
        
        <div class="footer">
          <p>
            BeautyHub | Premium Beauty Products<br>
            <a href="https://beautyhub.com" style="color: #8b5a5a;">beautyhub.com</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
