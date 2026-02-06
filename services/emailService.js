import { transporter } from '../configs/mailer.js';
import { getEmailTemplate } from '../configs/emailTemplates.js';

export const sendEmail = async (type, recipientEmail, data) => {
  try {
    const template = getEmailTemplate(type, data);
    
    if (!template) {
      throw new Error(`Email template not found for type: ${type}`);
    }

    const mailOptions = {
      from: {
        name: 'One Planet Market',
        address: 'info@oneplanetmarket.com'
      },
      to: recipientEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${type} to ${recipientEmail}`);
    return result;
  } catch (error) {
    console.error(`Failed to send ${type} email to ${recipientEmail}:`, error);
    throw error;
  }
};

// Specific email functions for different events
export const sendWelcomeEmail = (email, name) => {
  return sendEmail('welcome', email, { name });
};

export const sendNewsletterConfirmation = (email) => {
  return sendEmail('newsletter', email, { email });
};

export const sendOrderConfirmation = (email, orderData) => {
  return sendEmail('orderSuccess', email, orderData);
};

export const sendPaymentFailedEmail = (email, orderData) => {
  return sendEmail('paymentFailed', email, orderData);
};

export const sendPasswordResetEmail = (email, name, resetLink) => {
  return sendEmail('resetPassword', email, { name, resetLink });
};

export const sendProducerApplicationSubmitted = (email, applicationData) => {
  return sendEmail('producerApplicationSubmitted', email, applicationData);
};

export const sendProducerApplicationApproved = (email, producerData) => {
  return sendEmail('producerApplicationApproved', email, producerData);
};

export const sendProducerApplicationRejected = (email, producerData) => {
  return sendEmail('producerApplicationRejected', email, producerData);
};

// Send newsletter to all subscribers
export const sendNewsletterToSubscribers = async (subscribers, title, body) => {
  let sentCount = 0;
  
  for (const subscriber of subscribers) {
    try {
      await sendEmail('newsletterSend', subscriber.email, { title, body });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
      // Continue sending to other subscribers even if one fails
    }
  }
  
  return sentCount;
};