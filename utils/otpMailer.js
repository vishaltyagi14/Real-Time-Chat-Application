const transporter = require("../generators/mail");
const {genOtp} = require("../generators/otpGen");

async function sendOTP(email) {
  try {
    const { smtpUser, smtpPass, mailFrom } = transporter.mailConfig || {};
    
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address provided");
    }
    
    // Validate SMTP configuration
    if (!smtpUser || !smtpPass) {
      const errorMsg = "Mailer is not configured. Set SMTP_USER/SMTP_PASS (or EMAIL/PASS) in environment variables.";
      console.error("CRITICAL:", errorMsg);
      throw new Error(errorMsg);
    }
    
    // Validate mailFrom is set
    if (!mailFrom) {
      throw new Error("Mail FROM address is not configured. Set MAIL_FROM or SMTP_USER in environment variables.");
    }

    const otp = genOtp();
    
    // Validate OTP was generated
    if (!otp || otp.length !== 6) {
      throw new Error("OTP generation failed - invalid OTP format");
    }
    
    const mailOptions = {
      from: mailFrom,
      to: email,
      subject: "Your Verification Code - Real Time Chat",
      text: `Your OTP for Login on Real Time Chat Application is: ${otp}\n\nThis code will expire in 10 minutes.`,
      html: `<h2>Verification Code</h2><p>Your OTP is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);

    console.log(`OTP sent successfully to ${email}`);

    return otp;   // Return OTP to store in DB/session
  } catch (error) {
    console.error("Error sending mail:", error.message, error.code || "NO_CODE");
    throw error; 
  }
}

module.exports = sendOTP;
