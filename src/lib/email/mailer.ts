import nodemailer from 'nodemailer';

interface SendOTPEmailParams {
  email: string;
  otp: string;
  name: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendOTPEmail({ email, otp, name }: SendOTPEmailParams) {
  try {
    const mailOptions = {
      from: `Budget Piggy <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Budget Pig Registration OTP',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; }
              .header { text-align: center; color: #10b981; margin-bottom: 30px; }
              .content { color: #333; line-height: 1.6; }
              .otp-box { background-color: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
              .warning { color: #dc2626; font-size: 12px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🐷 Budget Pig</h1>
              </div>
              
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Thank you for signing up for Budget Pig! To complete your registration, please enter the OTP below:</p>
                
                <div class="otp-box">
                  <p>Your OTP Code:</p>
                  <div class="otp-code">${otp}</div>
                </div>
                
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This OTP will expire in <strong>10 minutes</strong></li>
                  <li>Never share your OTP with anyone</li>
                  <li>Budget Pig will never ask for your OTP via email or message</li>
                </ul>
                
                <p>If you didn't request this OTP, you can safely ignore this email.</p>
              </div>
              
              <div class="footer">
                <p class="warning">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

export async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    return false;
  }
}