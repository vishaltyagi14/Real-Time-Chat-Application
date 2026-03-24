const nodemailer = require('nodemailer');

const mailFrom = process.env.BREVO_SMTP_USER;

let transporter;

if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS,
        },
    });

    console.log(`\n📧 Mail Transport: Brevo SMTP | From: ${mailFrom}\n`);
} else {
    console.error('\n⚠️  BREVO_SMTP_USER or BREVO_SMTP_PASS not set.\n');
    transporter = {
        sendMail: async () => {
            throw new Error('Brevo SMTP is not configured.');
        }
    };
}

transporter.mailConfig = { mailFrom };
module.exports = transporter;