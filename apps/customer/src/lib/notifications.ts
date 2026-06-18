import { Resend } from 'resend';
import { prisma } from '@p4p/db';

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
          .manifest-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin: 20px 0;
          }
          .manifest-table th {
            background-color: #f7fafc;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            color: #4a5568;
            border-bottom: 2px solid #edf2f7;
          }
          .manifest-table td {
            padding: 10px;
            border-bottom: 1px solid #edf2f7;
            color: #4a5568;
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

export async function sendOrderReceivedEmail(orderId: string) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        student: {
          include: {
            school: true,
          },
        },
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error(`[Email Notification] Order ${orderId} not found.`);
      return;
    }

    const customerEmail = order.customer.email;
    const parentName = `${order.customer.firstName} ${order.customer.lastName}`;
    const studentName = order.student
      ? `${order.student.firstName} ${order.student.lastName}`
      : 'Your child';
    const schoolName = order.student?.school.name || 'their school';
    const gradeLevel = order.student?.gradeLevel || 'their grade';

    // Build items checklist table
    let manifestRows = '';
    order.orderLines.forEach((line) => {
      manifestRows += `
        <tr>
          <td>${line.product.itemName}</td>
          <td>${line.product.brand || 'N/A'}</td>
          <td style="text-align: center;">${line.quantityOrdered}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <p>Dear ${parentName},</p>
      <p>Thank you for choosing Prepped 4 Prep! We have successfully received payment for your child's stationery package.</p>
      
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #718096; letter-spacing: 0.5px;">Student Package Details</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold; color: #2d3748;">${studentName}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #718096;">School: ${schoolName} (Grade ${gradeLevel})</p>
      </div>

      <p>Here are the items included in your order:</p>
      <table class="manifest-table">
        <thead>
          <tr>
            <th>Item Details</th>
            <th>Brand</th>
            <th style="text-align: center;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${manifestRows}
        </tbody>
      </table>

      <div class="divider"></div>
      <p><strong>What's next?</strong></p>
      <p>Our warehouse team is preparing your package. We verify every stationery item using barcode verification. You will receive another notification when your box is fully packed and ready for dispatch.</p>
      <p>Avoid the fuss, trust us!</p>
      <p>Warm regards,<br/>The Prepped 4 Prep Team</p>
    `;

    const html = getEmailHtmlWrapper(
      'Order Received - Prepped 4 Prep',
      'We\'ve Received Your Order!',
      bodyHtml
    );

    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()} - Prepped 4 Prep`,
      html,
    });
  } catch (error) {
    console.error('[Email Notification Error] sendOrderReceivedEmail failed:', error);
  }
}
