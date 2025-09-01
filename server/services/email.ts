import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER || "noreply@absreferzone.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your-email-password";
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"ABS REFERZONE" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw error to prevent blocking the main flow
  }
}

export function getDepositApprovalEmail(userName: string, amount: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #000, #22c55e); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">ABS REFERZONE</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Deposit Approved!</h2>
        <p>Dear ${userName},</p>
        <p>Your deposit of <strong>PKR ${amount}</strong> has been approved and credited to your account.</p>
        <p>You can now view your updated balance in your dashboard.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
             style="background: #22c55e; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
        <p>Thank you for using ABS REFERZONE!</p>
      </div>
    </div>
  `;
}

export function getWithdrawalApprovalEmail(userName: string, amount: string, method: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #000, #22c55e); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">ABS REFERZONE</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Withdrawal Processed!</h2>
        <p>Dear ${userName},</p>
        <p>Your withdrawal request of <strong>PKR ${amount}</strong> has been approved and processed to your ${method} account.</p>
        <p>The funds should reflect in your account within 24-48 hours.</p>
        <p>Thank you for using ABS REFERZONE!</p>
      </div>
    </div>
  `;
}

export function getReferralCommissionEmail(userName: string, amount: string, referredUserName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #000, #22c55e); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">ABS REFERZONE</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Referral Commission Earned!</h2>
        <p>Dear ${userName},</p>
        <p>Congratulations! You've earned a referral commission of <strong>PKR ${amount}</strong> from ${referredUserName}'s deposit.</p>
        <p>The commission has been credited to your account balance.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
             style="background: #22c55e; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
        <p>Keep sharing your referral link to earn more commissions!</p>
      </div>
    </div>
  `;
}
