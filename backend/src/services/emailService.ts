import nodemailer from 'nodemailer';

// Email configuration - uses environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'noreply@codereview.ai';
const APP_NAME = 'CodeReview.ai';

// Create transporter
const createTransporter = () => {
    if (!SMTP_USER || !SMTP_PASS) {
        console.warn('⚠️ Email not configured: SMTP_USER and SMTP_PASS required');
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
};

let transporter = createTransporter();

// Check if email is configured
export const isEmailConfigured = (): boolean => {
    return !!SMTP_USER && !!SMTP_PASS;
};

// Send email helper
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    if (!transporter) {
        transporter = createTransporter();
        if (!transporter) {
            console.log('📧 Email would be sent to:', to);
            console.log('Subject:', subject);
            return false;
        }
    }

    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${EMAIL_FROM}>`,
            to,
            subject,
            html
        });
        console.log('✅ Email sent to:', to);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
};

// Email templates
export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<boolean> => {
    const subject = 'Reset Your Password - CodeReview.ai';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                    <td style="background-color: #161b22; border-radius: 12px; padding: 40px;">
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 12px; border-radius: 12px;">
                                <span style="font-size: 24px; color: white; font-weight: bold;">⟨/⟩</span>
                            </div>
                            <h1 style="color: #f0f6fc; margin: 15px 0 0; font-size: 24px;">CodeReview.ai</h1>
                        </div>
                        
                        <!-- Content -->
                        <h2 style="color: #f0f6fc; font-size: 20px; margin-bottom: 15px; text-align: center;">Reset Your Password</h2>
                        <p style="color: #8b949e; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                            We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        
                        <!-- Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        
                        <!-- Link fallback -->
                        <p style="color: #8b949e; font-size: 14px; text-align: center; margin-bottom: 20px;">
                            Or copy and paste this link in your browser:<br>
                            <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
                        </p>
                        
                        <!-- Warning -->
                        <div style="background-color: #21262d; border-radius: 8px; padding: 15px; margin-top: 25px;">
                            <p style="color: #8b949e; font-size: 13px; margin: 0;">
                                ⏰ This link expires in <strong style="color: #f0f6fc;">1 hour</strong>.<br><br>
                                🔒 If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="border-top: 1px solid #30363d; margin-top: 30px; padding-top: 20px; text-align: center;">
                            <p style="color: #6e7681; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} CodeReview.ai. All rights reserved.<br>
                                AI-powered code reviews for developers.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail(email, subject, html);
};

// Welcome email
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    const subject = 'Welcome to CodeReview.ai! 🚀';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                    <td style="background-color: #161b22; border-radius: 12px; padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 12px; border-radius: 12px;">
                                <span style="font-size: 24px; color: white; font-weight: bold;">⟨/⟩</span>
                            </div>
                            <h1 style="color: #f0f6fc; margin: 15px 0 0; font-size: 24px;">CodeReview.ai</h1>
                        </div>
                        
                        <h2 style="color: #f0f6fc; font-size: 22px; margin-bottom: 15px; text-align: center;">
                            Welcome, ${name}! 🎉
                        </h2>
                        
                        <p style="color: #8b949e; font-size: 16px; line-height: 1.6; text-align: center;">
                            Your account has been created successfully. You're now ready to get AI-powered code reviews!
                        </p>
                        
                        <div style="background-color: #21262d; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h3 style="color: #f0f6fc; margin: 0 0 15px; font-size: 16px;">✨ What you can do:</h3>
                            <ul style="color: #8b949e; margin: 0; padding-left: 20px; line-height: 1.8;">
                                <li>Get instant AI-powered code reviews</li>
                                <li>Connect your GitHub repositories</li>
                                <li>Create and join teams</li>
                                <li>Save code snippets</li>
                                <li>Track your code quality over time</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                                Go to Dashboard →
                            </a>
                        </div>
                        
                        <div style="border-top: 1px solid #30363d; margin-top: 30px; padding-top: 20px; text-align: center;">
                            <p style="color: #6e7681; font-size: 12px;">
                                © ${new Date().getFullYear()} CodeReview.ai
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail(email, subject, html);
};

// Notification email
export const sendNotificationEmail = async (email: string, title: string, message: string, link?: string): Promise<boolean> => {
    const subject = `${title} - CodeReview.ai`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <tr>
                    <td style="background-color: #161b22; border-radius: 12px; padding: 40px;">
                        <h2 style="color: #f0f6fc; font-size: 20px; margin-bottom: 15px;">${title}</h2>
                        <p style="color: #8b949e; font-size: 16px; line-height: 1.6;">${message}</p>
                        ${link ? `
                            <div style="text-align: center; margin-top: 25px;">
                                <a href="${link}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                                    View Details
                                </a>
                            </div>
                        ` : ''}
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail(email, subject, html);
};

export default {
    isEmailConfigured,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendNotificationEmail
};
