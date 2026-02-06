import nodemailer from 'nodemailer';

const createTransporter = () => {
  // Use Hostinger SMTP configuration
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: 'info@oneplanetmarket.com',
      pass: 'Opm@27106!@'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const transporter = createTransporter();