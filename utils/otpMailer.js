const transporter = require("../generators/mail");
const { genOtp } = require("../generators/otpGen");

async function sendOTP(email) {
  try {
    const { mailFrom } = transporter.mailConfig || {};

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address provided");
    }

    // Validate Brevo configuration
    if (!process.env.BREVO_API_KEY) {
      const errorMsg = "Brevo API is not configured. Set BREVO_API_KEY in environment variables.";
      console.error("CRITICAL:", errorMsg);
      throw new Error(errorMsg);
    }

    // Validate mailFrom is set
    if (!mailFrom) {
      throw new Error("Mail FROM address is not configured. Set MAIL_FROM in environment variables.");
    }

    const otp = genOtp();

    // Validate OTP was generated
    if (!otp || String(otp).length !== 6) {
      throw new Error("OTP generation failed - invalid OTP format");
    }

    const mailOptions = {
      from: mailFrom,
      to: email,
      subject: "Your Verification Code - Real Time Chat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Verification Code</h2>
          <p style="color: #555;">Use the OTP below to log in to <strong>Real Time Chat</strong>:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent successfully to ${email}`);

    return otp;
  } catch (error) {
    console.error("❌ Error sending OTP mail:", error.message, error.code || "NO_CODE");
    throw error;
  }
}

module.exports = sendOTP;