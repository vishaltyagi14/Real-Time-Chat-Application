const transporter = require("../generators/mail");
const {genOtp} = require("../generators/otpGen");

async function sendOTP(email) {
  try {
    const { smtpUser, smtpPass, mailFrom } = transporter.mailConfig || {};
    if (!smtpUser || !smtpPass) {
      throw new Error(
        "Mailer is not configured. Set SMTP_USER/SMTP_PASS (or EMAIL/PASS) in environment variables."
      );
    }

    const otp = genOtp();
    const mailOptions = {
      from: mailFrom,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP for Login on Real Time Chat Application is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log("OTP sent successfully");

    return otp;   // Return OTP to store in DB/session
  } catch (error) {
    console.error("Error sending mail:", error.message, error.code || "NO_CODE");
    throw error; 
  }
}

module.exports = sendOTP;
