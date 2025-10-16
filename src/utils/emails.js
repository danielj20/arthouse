import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT) || 587,
  secure: false, // Brevo uses STARTTLS, not SSL
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});