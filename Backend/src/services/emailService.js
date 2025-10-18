const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Setup transporter for SMTP (works with Gmail, Hostinger, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // Add timeout settings
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email service is ready to send emails');
  }
});

// Load and compile Handlebars email template
function loadTemplate(templateName, data) {
  try {
    // Use absolute path to ensure correct template loading
    const templatePath = path.join(process.cwd(), 'src/templates/emails', `${templateName}.hbs`);
    console.log('Loading template from:', templatePath);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error('Template loading error:', error);
    return null;
  }
}

// Order confirmation email
async function sendOrderConfirmationEmail(orderData) {
  try {
    const { user, order, orderItems, address } = orderData;

    const emailData = {
      customerName: user.name,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN'),
      totalAmount: parseFloat(order.totalAmount).toFixed(2),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderItems: orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price).toFixed(2),
        total: (parseFloat(item.price) * item.quantity).toFixed(2),
        image: item.product.images[0]?.url || item.product.images[0] || ''
      })),
      deliveryAddress: {
        name: address.name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark
      },
      trackingUrl: order.trackingUrl || '',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com',
      storeUrl: process.env.STORE_URL || 'https://yourstore.com'
    };

    const htmlContent = loadTemplate('order-confirmation', emailData);
    if (!htmlContent) throw new Error('Failed to load email template');

    const mailOptions = {
      from: {
        name: process.env.STORE_NAME || 'Your Store',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Order confirmation email error:', error);
    return { success: false, error: error.message };
  }
}

// Order delivered email
async function sendOrderDeliveredEmail(orderData) {
  try {
    const { user, order, orderItems } = orderData;

    const emailData = {
      customerName: user.name,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN'),
      deliveryDate: new Date().toLocaleDateString('en-IN'),
      totalAmount: parseFloat(order.totalAmount).toFixed(2),
      paymentMethod: order.paymentMethod,
      orderItems: orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price).toFixed(2),
        image: item.product.images[0]?.url || item.product.images[0] || ''
      })),
      reviewUrl: `${process.env.STORE_URL}/review-order/${order.id}`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com',
      storeUrl: process.env.STORE_URL || 'https://yourstore.com'
    };

    const htmlContent = loadTemplate('order-delivered', emailData);
    if (!htmlContent) throw new Error('Failed to load email template');

    const mailOptions = {
      from: {
        name: process.env.STORE_NAME || 'Your Store',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `Order Delivered - ${order.orderNumber} 🎉`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order delivered email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Order delivered email error:', error);
    return { success: false, error: error.message };
  }
}

// Order status update email
async function sendOrderStatusUpdateEmail(orderData, newStatus) {
  try {
    const { user, order } = orderData;

    const statusMessages = {
      CONFIRMED: 'Your order has been confirmed and is being prepared for shipment.',
      SHIPPED: 'Your order has been shipped and is on the way to you.',
      DELIVERED: 'Your order has been delivered successfully.',
      CANCELLED: 'Your order has been cancelled.'
    };

    const emailData = {
      customerName: user.name,
      orderNumber: order.orderNumber,
      newStatus,
      statusMessage: statusMessages[newStatus] || 'Your order status has been updated.',
      trackingUrl: order.trackingUrl || '',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com',
      storeUrl: process.env.STORE_URL || 'https://yourstore.com'
    };

    const htmlContent = loadTemplate('order-status-update', emailData);
    if (!htmlContent) throw new Error('Failed to load email template');

    const mailOptions = {
      from: {
        name: process.env.STORE_NAME || 'Your Store',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `Order Update - ${order.orderNumber}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order status update email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Order status update email error:', error);
    return { success: false, error: error.message };
  }
}

// Welcome email
async function sendWelcomeEmail(userData) {
  try {
    const emailData = {
      customerName: userData.name,
      storeUrl: process.env.STORE_URL || 'https://yourstore.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com'
    };

    const htmlContent = loadTemplate('welcome', emailData);
    if (!htmlContent) throw new Error('Failed to load email template');

    const mailOptions = {
      from: {
        name: process.env.STORE_NAME || 'Your Store',
        address: process.env.EMAIL_USER
      },
      to: userData.email,
      subject: `Welcome to ${process.env.STORE_NAME || 'Our Store'}! 🎉`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

// Send Password Reset Email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Use appropriate URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://korakagazindia.com' 
      : 'http://localhost:3003';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: process.env.STORE_NAME || 'KORAKAGAZ',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Request - KORAKAGAZ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">🔐 Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">You requested a password reset for your KORAKAGAZ account.</p>
            <p style="color: #666; line-height: 1.6;">Click the button below to reset your password:</p>
            
            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                🔑 Reset Password
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⏰ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              Best regards,<br>
              <strong>KORAKAGAZ Team</strong><br>
              <a href="mailto:support@korakagazindia.com" style="color: #007bff;">support@korakagazindia.com</a>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// Export all functions
module.exports = {
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendOrderStatusUpdateEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
