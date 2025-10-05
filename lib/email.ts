import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  recipientEmail: string,
  recipientName: string,
  trip: any,
  participantId: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${participantId}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'trips@yourdomain.com',
      to: recipientEmail,
      subject: `🌍 You're invited to join a trip!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .trip-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .button:hover { background: #5568d3; }
              .button.reject { background: #dc2626; }
              .button.reject:hover { background: #b91c1c; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌍 Trip Invitation</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                
                <p>You've been invited to join an exciting trip!</p>
                
                <div class="trip-details">
                  <h2>📍 ${trip.destination}</h2>
                  <p><strong>Trip ID:</strong> ${trip.id}</p>
                  <p><strong>Created:</strong> ${new Date(trip.createdAt).toLocaleDateString()}</p>
                </div>
                
                <p>Click below to accept or decline this invitation:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" class="button">View Invitation</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${inviteUrl}" style="color: #667eea;">${inviteUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>This invitation was sent to ${recipientEmail}</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Invitation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send invitation email');
  }
}
