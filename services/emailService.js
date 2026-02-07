// IMPORTANT: Email service for sending verification emails asynchronously
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../database/db');

// NOTE: Configure email transporter (using Gmail for testing)
// NOTA BENE: For production, use proper email service like SendGrid, AWS SES, etc.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// IMPORTANT: Generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// NOTE: Send verification email asynchronously
// This function returns immediately and sends email in background
async function sendVerificationEmail(userId, email, name) {
  try {
    // IMPORTANT: Generate unique verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // NOTE: Store token in database
    await db.query(
      'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    // NOTA BENE: Construct verification URL
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/verify-email?token=${token}`;

    // IMPORTANT: Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };

    // NOTE: Send email asynchronously without blocking
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending verification email:', error);
      } else {
        console.log('Verification email sent:', info.messageId);
      }
    });

  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    // NOTA BENE: Don't throw error - email sending should not block registration
  }
}

// IMPORTANT: Verify email token and update user status
async function verifyEmailToken(token) {
  try {
    // NOTE: Find valid token
    const tokenResult = await db.query(
      `SELECT user_id FROM verification_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return { success: false, message: 'Invalid or expired verification token' };
    }

    const userId = tokenResult.rows[0].user_id;

    // IMPORTANT: Update user status to 'active' (unless blocked)
    // NOTA BENE: Blocked status should remain blocked even after verification
    await db.query(
      `UPDATE users 
       SET status = CASE 
         WHEN status = 'blocked' THEN 'blocked'
         ELSE 'active'
       END
       WHERE id = $1`,
      [userId]
    );

    // NOTE: Delete used token
    await db.query('DELETE FROM verification_tokens WHERE token = $1', [token]);

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return { success: false, message: 'Verification failed' };
  }
}

module.exports = {
  sendVerificationEmail,
  verifyEmailToken
};