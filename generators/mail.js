const axios = require('axios');

const mailFrom = process.env.BREVO_SMTP_USER;

let transporter;

if (process.env.BREVO_API_KEY) {
    transporter = {
        sendMail: async (mailOptions) => {
            try {
                console.log(`📨 Sending OTP email to: ${mailOptions.to}`);

                const response = await axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    {
                        sender: { email: mailFrom },
                        to: [{ email: mailOptions.to }],
                        subject: mailOptions.subject,
                        htmlContent: mailOptions.html,
                    },
                    {
                        headers: {
                            'api-key': process.env.BREVO_API_KEY,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log(`✅ Email sent. Message ID:`, response.data.messageId);
                return { messageId: response.data.messageId };
            } catch (error) {
                const errMsg = error.response?.data?.message || error.message;
                console.error(`❌ Brevo API Error:`, errMsg);
                throw new Error(errMsg);
            }
        }
    };

    console.log(`\n📧 Mail Transport: Brevo HTTP API | From: ${mailFrom}\n`);
} else {
    console.error('\n⚠️  BREVO_API_KEY not set.\n');
    transporter = {
        sendMail: async () => {
            throw new Error('Brevo API is not configured.');
        }
    };
}

transporter.mailConfig = { mailFrom };
module.exports = transporter;