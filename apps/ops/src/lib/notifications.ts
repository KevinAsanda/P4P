import { Resend } from 'resend';
import { prisma } from '@p4p/db';
import { decryptValue } from '@p4p/shared';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export function getEmailHtmlWrapper(title: string, heading: string, bodyContentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f9f9f9;
            color: #000000;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .header {
            background-color: #F8C83E; /* Papaya Orange */
            padding: 30px;
            text-align: center;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 900;
            color: #000000;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .tagline {
            font-size: 10px;
            font-weight: bold;
            color: #C4A344; /* Caramel Brown */
            margin: 5px 0 0 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .content {
            padding: 30px;
          }
          h1 {
            font-size: 20px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 20px;
            color: #000000;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 20px;
          }
          .divider {
            border-top: 1px dashed #e2e8f0;
            margin: 20px 0;
          }
          .footer {
            background-color: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">Prepped 4 Prep</div>
            <div class="tagline">Avoid the Fuss, Trust Us!</div>
          </div>
          <div class="content">
            <h1>${heading}</h1>
            ${bodyContentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Prepped 4 Prep. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 11px;">Contact us at admin@prepped4prep.co.za</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_placeholder' || apiKey === '') {
    console.log(`[EMAIL SIMULATOR - NO KEY] To: ${to}, Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  let fromAddress = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';

  try {
    // Correct common domain restrictions for Resend sandbox testing
    if (
      fromAddress.includes('gmail.com') ||
      fromAddress.includes('yahoo.com') ||
      fromAddress.includes('outlook.com')
    ) {
      console.log(`[Email Helper] Adjusting fromAddress "${fromAddress}" to "onboarding@resend.dev" for Resend compat.`);
      fromAddress = 'onboarding@resend.dev';
    }

    console.log(`[Email Helper] Sending email to ${to}...`);
    const response = await resend.emails.send({
      from: `Prepped 4 Prep <${fromAddress}>`,
      to: [to],
      subject,
      html,
    });

    if (response.error) {
      console.error('[Resend Error] Primary send failed:', response.error);

      // Sandbox Fallback: If recipient is unverified, forward to the developer's address
      const fallbackEmail = process.env.RESEND_FROM_ADDRESS || 'kevinasanda99@gamil.com';
      console.log(`[Email Helper Fallback] Forwarding sandbox email to developer: ${fallbackEmail}`);
      const fallbackResponse = await resend.emails.send({
        from: 'Prepped 4 Prep <onboarding@resend.dev>',
        to: [fallbackEmail],
        subject: `[SANDBOX FORWARD: ${to}] ${subject}`,
        html: `<p style="color: #e53e3e; font-size: 12px; margin-bottom: 20px;">
                <strong>Developer Notice:</strong> This email was forwarded to you because the recipient address <em>${to}</em> is not verified in your Resend sandbox account.
              </p><hr/>${html}`,
      });

      if (fallbackResponse.error) {
        console.error('[Resend Fallback Error] Fallback send failed:', fallbackResponse.error);
        return { success: false, error: fallbackResponse.error };
      }

      return { success: true, fallback: true, data: fallbackResponse.data };
    }

    console.log('[Resend Success] Email sent:', response.data);
    return { success: true, data: response.data };
  } catch (err: any) {
    console.error('[Email Helper Exception] Error in sendEmail:', err);
    return { success: false, error: err.message || err };
  }
}

// Fetch helper to avoid duplicate database fetches
async function fetchOrderDetails(orderId: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      student: {
        include: {
          school: true,
        },
      },
      delivery: true,
    },
  });

  if (order && order.customer) {
    order.customer.phone = decryptValue(order.customer.phone);
    order.customer.deliveryAddress = decryptValue(order.customer.deliveryAddress);
  }

  return order;
}

export async function sendOrderPackedEmail(orderId: string) {
  try {
    const order = await fetchOrderDetails(orderId);
    if (!order) return;

    const to = order.customer.email;
    const parentName = `${order.customer.firstName} ${order.customer.lastName}`;
    const studentName = order.student ? `${order.student.firstName} ${order.student.lastName}` : 'your child';
    const schoolName = order.student?.school.name || 'their school';

    const bodyHtml = `
      <p>Dear ${parentName},</p>
      <p>We are excited to let you know that <strong>${studentName}</strong>'s stationery box for <strong>${schoolName}</strong> has been successfully packed and verified by our warehouse team!</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 14px;">✓ Contents Double-Checked & Verified</p>
        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 12px;">Every book cover, notebook, and writing instrument has been scanned and verified against the template list.</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <p>We are coordinating the final logistics. You will receive another notification when your package is ready for collection or has been dispatched with our delivery team.</p>
      <p>Avoid the fuss, trust us!</p>
      <p>Warm regards,<br/>The Prepped 4 Prep Team</p>
    `;

    const html = getEmailHtmlWrapper(
      'Order Packed - Prepped 4 Prep',
      'Your Stationery Box is Packed & Verified!',
      bodyHtml
    );

    await sendEmail({
      to,
      subject: `Your Stationery is Packed! Order #${order.id.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (error) {
    console.error('[Email Notification] sendOrderPackedEmail failed:', error);
  }
}

export async function sendOrderDispatchedEmail(orderId: string) {
  try {
    const order = await fetchOrderDetails(orderId);
    if (!order) return;

    const to = order.customer.email;
    const parentName = `${order.customer.firstName} ${order.customer.lastName}`;
    const studentName = order.student ? `${order.student.firstName} ${order.student.lastName}` : 'your child';
    
    const isDelivery = order.delivery?.deliveryMethod === 'delivery';
    const deliveryDetails = isDelivery 
      ? `<strong>Delivery Address:</strong><br/>${order.customer.deliveryAddress || 'No address specified'}`
      : `<strong>Depot Collection:</strong><br/>Ready for collection at the Prepped 4 Prep Durban office.`;

    const bodyHtml = `
      <p>Dear ${parentName},</p>
      <p>Great news! The stationery pack for <strong>${studentName}</strong> is ready and active for dispatch / collection.</p>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #1e40af;">
        <p style="margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; color: #2563eb;">Logistics Information</p>
        <p style="margin: 0; line-height: 1.5; color: #374151;">${deliveryDetails}</p>
      </div>

      <p>If your package is out for delivery, our driver will make contact shortly. If you chose school/depot collection, you may collect it during operating hours.</p>
      <p>Avoid the fuss, trust us!</p>
      <p>Warm regards,<br/>The Prepped 4 Prep Team</p>
    `;

    const html = getEmailHtmlWrapper(
      'Order Dispatched - Prepped 4 Prep',
      'Your stationery is ready for delivery / collection!',
      bodyHtml
    );

    await sendEmail({
      to,
      subject: `Package Dispatched! Order #${order.id.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (error) {
    console.error('[Email Notification] sendOrderDispatchedEmail failed:', error);
  }
}

export async function sendOrderDeliveredEmail(orderId: string) {
  try {
    const order = await fetchOrderDetails(orderId);
    if (!order) return;

    const to = order.customer.email;
    const parentName = `${order.customer.firstName} ${order.customer.lastName}`;
    const studentName = order.student ? `${order.student.firstName} ${order.student.lastName}` : 'your child';

    const bodyHtml = `
      <p>Dear ${parentName},</p>
      <p>We are pleased to confirm that <strong>${studentName}</strong>'s stationery package has been successfully delivered and signed for!</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-weight: bold; color: #111827; font-size: 15px;">✓ Fulfill Status: Delivered Successfully</p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 11px;">Completed: ${new Date().toLocaleDateString()}</p>
      </div>

      <p>We hope this removes the yearly school-prep hassle for you, and we wish ${studentName} an amazing, productive school year ahead!</p>
      <p>Thank you for choosing Prepped 4 Prep.</p>
      <p>Avoid the fuss, trust us!</p>
      <p>Warm regards,<br/>The Prepped 4 Prep Team</p>
    `;

    const html = getEmailHtmlWrapper(
      'Order Delivered - Prepped 4 Prep',
      'Your stationery has been delivered!',
      bodyHtml
    );

    await sendEmail({
      to,
      subject: `Fulfillment Delivered! Order #${order.id.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (error) {
    console.error('[Email Notification] sendOrderDeliveredEmail failed:', error);
  }
}
