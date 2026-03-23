const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || process.env.EMAIL;
const smtpPass = process.env.SMTP_PASS || process.env.PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

// Log config on startup (hide sensitive data)
if (smtpUser && smtpPass) {
    console.log(`\n📧 Mail Transport Config:`);
    console.log(`   Host: ${smtpHost ? `${smtpHost}:${smtpPort}` : 'Gmail Service'}`);
    console.log(`   User: ${smtpUser.substring(0, 3)}...${smtpUser.substring(smtpUser.length - 3)}`);
    console.log(`   From: ${mailFrom}\n`);
}

const transporter = nodemailer.createTransport(
    smtpHost
        ? {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        }
        : {
            service: "gmail",
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        }
);

transporter.mailConfig = {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    mailFrom
};

module.exports = transporter;