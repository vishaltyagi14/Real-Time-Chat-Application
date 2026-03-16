const transporter = require("../generators/mail");
const {genOtp} = require("../generators/otpGen");

async function sendOTP(email) {
  try {
    const otp = genOtp();
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP for Login on Real Time Chat Application is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log("OTP sent successfully");

    return otp;   // Return OTP to store in DB/session
  } catch (error) {
    console.error("Error sending mail:", error.message);
    throw error; 
  }
}

module.exports = sendOTP;
