const sgMail = require('@sendgrid/mail');

// Configure SendGrid API key from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@casa.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Casa Shop';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!SENDGRID_API_KEY) {
      console.log('📧 SendGrid not configured - Email would be sent to:', to);
      console.log('📧 Subject:', subject);
      console.log('📧 Content:', text);
      return false;
    }

    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      text,
      html: html || text
    };

    await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    // Don't throw error to avoid breaking the main workflow
    return false;
  }
};

/**
 * Send refund approval notification
 * @param {string} userEmail - User's email address
 * @param {string} orderId - Order ID for reference
 * @returns {Promise<boolean>} - Success status
 */
const sendRefundApprovalEmail = async (userEmail, orderId) => {
  const subject = 'Refund Request Approved - Casa';
  const text = `Dear Customer,

Your return/refund request has been accepted.

Order ID: ${orderId}

Your refund will be processed shortly and the amount will be credited to your original payment method.

Thank you for shopping with Casa.

Best regards,
Casa Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Refund Request Approved</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Customer,</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #2e7d2e;">Your return/refund request has been accepted.</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>Order ID:</strong> ${orderId}</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Your refund will be processed shortly and the amount will be credited to your original payment method.</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for shopping with Casa.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>Casa Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

/**
 * Send refund rejection notification
 * @param {string} userEmail - User's email address
 * @param {string} orderId - Order ID for reference
 * @param {string} reason - Rejection reason (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendRefundRejectionEmail = async (userEmail, orderId, reason = null) => {
  const subject = 'Refund Request Status - Casa';
  const reasonText = reason ? `\n\nReason: ${reason}` : '';
  
  const text = `Dear Customer,

Your return/refund request has been rejected.

Order ID: ${orderId}${reasonText}

If you have any questions about this decision, please contact our customer support team.

Thank you for shopping with Casa.

Best regards,
Casa Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #f44336; margin-bottom: 20px;">Refund Request Status</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Customer,</p>
        
        <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #c62828;">Your return/refund request has been rejected.</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>Order ID:</strong> ${orderId}</p>
        
        ${reason ? `<p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>Reason:</strong> ${reason}</p>` : ''}
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">If you have any questions about this decision, please contact our customer support team.</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for shopping with Casa.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>Casa Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

module.exports = {
  sendEmail,
  sendRefundApprovalEmail,
  sendRefundRejectionEmail
};