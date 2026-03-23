module.exports.genOtp = () => {
    // Generate random 6-digit OTP (100000-999999)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpString = otp.toString();
    // Ensure it's always 6 digits (pad with zeros if needed)
    return otpString.padStart(6, '0');
};
