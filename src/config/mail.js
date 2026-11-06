import nodemailer from 'nodemailer';

const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export const enviarCorreo = (para, asunto, html) =>
  transporte.sendMail({ from: `"AgroControl" <${process.env.SMTP_USER}>`, to: para, subject: asunto, html });