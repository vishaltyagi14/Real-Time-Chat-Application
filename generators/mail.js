const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM || 'onboarding@resend.dev';

let transporter;

if (resendApiKey) {
    const resend = new Resend(resendApiKey);

    transporter = {
        sendMail: async (mailOptions) => {
            try {
                console.log(`📨 Sending OTP email to: ${mailOptions.to}`);

                const { data, error } = await resend.emails.send({
                    from: mailOptions.from || mailFrom,
                    to: mailOptions.to,
                    subject: mailOptions.subject,
                    html: mailOptions.html || `<p>${mailOptions.text}</p>`,
                });

                if (error) {
                    console.error(`❌ Resend Error:`, error);
                    throw new Error(error.message);
                }

                console.log(`✅ Email sent successfully. Message ID:`, data.id);
                return { messageId: data.id };
            } catch (error) {
                console.error(`❌ Resend Error:`, error.message);
                throw error;
            }
        }
    };

    console.log(`\n📧 Mail Transport Config (Resend):`);
    console.log(`   Service: Resend Transactional Email`);
    console.log(`   From: ${mailFrom}`);
    console.log(`   Status: Ready\n`);
} else {
    console.error('\n⚠️  CRITICAL: RESEND_API_KEY not configured.');
    
    transporter = {
        sendMail: async () => {
            throw new Error('Resend API is not configured. Set RESEND_API_KEY in environment variables.');
        }
    };
}

transporter.mailConfig = { mailFrom };

module.exports = transporter;