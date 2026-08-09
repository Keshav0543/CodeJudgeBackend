import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});
console.log("SMTP USER:", process.env.EMAIL_USER);
console.log("SMTP PASS exists:", !!process.env.EMAIL_APP_PASSWORD);

export default transporter;