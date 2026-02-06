// Email templates with consistent branding and styling

export const getEmailTemplate = (type, data) => {
  const baseStyle = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
      
      body { font-family: 'Outfit', sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
      .container { max-width: 600px; margin: 0 auto; background-color: white; }
      .header { background-color: #22c55e; padding: 30px; text-align: center; }
      .logo { color: white; font-size: 28px; font-weight: 700; margin: 0; }
      .content { padding: 40px 30px; }
      .title { color: #100001; font-size: 24px; font-weight: 600; margin-bottom: 20px; }
      .text { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
      .button { display: inline-block; background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #999; font-size: 14px; }
      .highlight { color: #22c55e; font-weight: 600; }
      .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
  `;

  const templates = {
    welcome: {
      subject: 'Welcome to One Planet Market! 🌱',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Welcome to One Planet Market, ${data.name}!</h2>
            <p class="text">We're thrilled to have you join our community of eco-conscious shoppers committed to sustainable living.</p>
            <p class="text">At One Planet Market, you'll discover:</p>
            <ul class="text">
              <li>Premium sustainable and organic products</li>
              <li>Direct support for eco-friendly producers</li>
              <li>Your personal sustainability journey tracking</li>
              <li>A community making a positive environmental impact</li>
            </ul>
            <p class="text">Start exploring our marketplace and begin your sustainable shopping journey today!</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Start Shopping</a>
          </div>
          <div class="footer">
            <p>Thank you for choosing sustainability with One Planet Market</p>
            <p>Building a better planet, one purchase at a time</p>
          </div>
        </div>
      `
    },

    newsletter: {
      subject: 'Newsletter Subscription Confirmed 📧',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Thank you for subscribing!</h2>
            <p class="text">You've successfully subscribed to the One Planet Market newsletter with email: <span class="highlight">${data.email}</span></p>
            <p class="text">You'll now receive:</p>
            <ul class="text">
              <li>Latest sustainable product launches</li>
              <li>Eco-friendly tips and insights</li>
              <li>Exclusive offers and discounts</li>
              <li>Producer spotlights and stories</li>
            </ul>
            <p class="text">Stay tuned for amazing content coming your way!</p>
          </div>
          <div class="footer">
            <p>You can unsubscribe at any time from our newsletter emails</p>
          </div>
        </div>
      `
    },

    orderSuccess: {
      subject: 'Order Confirmation - Thank You! 🛍️',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Order Confirmed!</h2>
            <p class="text">Thank you for your order, ${data.name}! Your sustainable shopping choice makes a difference.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #100001;">Order Details</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Total Amount:</strong> $${data.amount}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Delivery Address:</strong><br>${data.address}</p>
            </div>
            
            <p class="text">Your order is being processed and you'll receive tracking information once it ships.</p>
            <p class="text">Thank you for supporting sustainable products and eco-friendly producers!</p>
          </div>
          <div class="footer">
            <p>For any questions, contact us at info@oneplanetmarket.com</p>
          </div>
        </div>
      `
    },

    paymentFailed: {
      subject: 'Payment Issue - Action Required 💳',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Payment Processing Issue</h2>
            <p class="text">Hi ${data.name}, we encountered an issue processing your payment for order <span class="highlight">${data.orderId}</span>.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #100001;">Order Information</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Amount:</strong> $${data.amount}</p>
              <p><strong>Issue:</strong> ${data.reason || 'Payment could not be processed'}</p>
            </div>
            
            <p class="text">Don't worry! You can easily retry your payment or update your payment method.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout?retry=${data.orderId}" class="button">Retry Payment</a>
            <p class="text">If you continue to experience issues, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at info@oneplanetmarket.com</p>
          </div>
        </div>
      `
    },

    resetPassword: {
      subject: 'Reset Your Password 🔐',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Password Reset Request</h2>
            <p class="text">Hi ${data.name}, we received a request to reset your password for your One Planet Market account.</p>
            <p class="text">Click the button below to reset your password. This link will expire in 10 minutes for security.</p>
            <a href="${data.resetLink}" class="button">Reset Password</a>
            <p class="text">If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
            <p class="text"><strong>Security tip:</strong> Never share your password or reset link with anyone.</p>
          </div>
          <div class="footer">
            <p>This reset link expires in 10 minutes for your security</p>
          </div>
        </div>
      `
    },

    producerApplicationSubmitted: {
      subject: 'Producer Application Received ✅',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Application Submitted Successfully!</h2>
            <p class="text">Dear ${data.name}, thank you for your interest in becoming a producer partner with One Planet Market!</p>
            <p class="text">We've successfully received your application and our team will review it carefully.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #100001;">Application Details</h3>
              <p><strong>Business Name:</strong> ${data.businessName}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Under Review</p>
            </div>
            
            <p class="text">Our review process typically takes 3-5 business days. We'll notify you once a decision has been made.</p>
            <p class="text">We appreciate your commitment to sustainable and eco-friendly practices!</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at info@oneplanetmarket.com</p>
          </div>
        </div>
      `
    },

    producerApplicationApproved: {
      subject: 'Producer Application Approved! 🎉',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Congratulations! You're Approved!</h2>
            <p class="text">Excellent news, ${data.name}! Your producer application has been approved.</p>
            <p class="text">Welcome to the One Planet Market producer community! You can now start listing your sustainable products.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #100001;">Next Steps</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Access your Producer Panel</li>
                <li>Upload your sustainable products</li>
                <li>Set up your producer profile</li>
                <li>Start selling to eco-conscious customers</li>
              </ul>
            </div>
            
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/producer/login" class="button">Access Producer Panel</a>
            <p class="text">We're excited to have you as part of our sustainable marketplace!</p>
          </div>
          <div class="footer">
            <p>Need support? Contact us at info@oneplanetmarket.com</p>
          </div>
        </div>
      `
    },

    producerApplicationRejected: {
      subject: 'Producer Application Update',
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
          </div>
          <div class="content">
            <h2 class="title">Application Status Update</h2>
            <p class="text">Dear ${data.name}, thank you for your interest in becoming a producer with One Planet Market.</p>
            <p class="text">After careful review, we're unable to approve your application at this time.</p>
            
            ${data.reason ? `
              <div class="order-details">
                <h3 style="margin-top: 0; color: #100001;">Feedback</h3>
                <p>${data.reason}</p>
              </div>
            ` : ''}
            
            <p class="text">We encourage you to reapply in the future once you've addressed any requirements for our sustainable marketplace.</p>
            <p class="text">Thank you for your interest in promoting sustainable products and eco-friendly practices.</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at info@oneplanetmarket.com</p>
          </div>
        </div>
      `
    },

    newsletterSend: {
      subject: data.title,
      html: `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1 class="logo">One Planet Market</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Newsletter</p>
          </div>
          <div class="content">
            <h2 class="title">${data.title}</h2>
            <div class="text" style="line-height: 1.8;">
              ${data.body}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Visit Our Website</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 One Planet Market - Sustainable Commerce for Everyone</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe" style="color: #22c55e; text-decoration: underline;">Unsubscribe</a> | 
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color: #22c55e; text-decoration: underline;">Visit Website</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              You received this email because you subscribed to One Planet Market newsletter.
            </p>
          </div>
        </div>
      `
    }
  };

  return templates[type] || null;
};