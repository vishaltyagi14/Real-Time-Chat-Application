const usermodel = require('../models/register')
const genToken = require('../generators/genToken')
const sendOtp= require('../utils/otpMailer')
const bcrypt= require('bcrypt')
const cookieParser= require('cookie-parser')

module.exports.verSign = async (req, res) => {
    try {
        let { email, name, username } = req.body;
        
        // Validate inputs
        if (!email || !name || !username) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        
        // Trim and validate
        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();
        name = name.trim();
        
        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }
        
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({
                message: "Username must be 3-30 characters"
            });
        }
        
        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({
                message: "Name must be 2-50 characters"
            });
        }
        
        let user = await usermodel.findOne({ $or: [{ email: email }, { username: username }] });
        if (user) {
            if (user.email === email) {
                return res.status(400).json({
                    message: "Email already exists"
                });
            }
            if (user.username === username) {
                return res.status(400).json({
                    message: "Username already exists"
                });
            }
        } else {
            const otp= await sendOtp(email);
            console.log("Generated OTP:", otp);
            if(!otp){
                return res.status(500).json({message: "Failed to send OTP"})
            }
            
            // Store registration data in session (don't create account yet)
            let hash = await bcrypt.hash(otp, 10);
            let otpExpiry = Date.now() + 10*60*1000;
            
            // Store in cookie to be used during OTP verification
            res.cookie('tempRegistration', JSON.stringify({
                username,
                email,
                name,
                otp: hash,
                otpExpiry
            }), {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 10*60*1000 // 10 minutes
            });
            
            return res.redirect('/verify-otp');
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports.verLogin = async (req, res) => {
    try {
        let {name}=req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                message: "Enter email or username"
            });
        }
        
        name = name.trim().toLowerCase();
        
        if (name.length < 2) {
            return res.status(400).json({
                message: "Invalid email or username"
            });
        }
        
        // Search by email first, then by username
        let user;
        if (name.includes('@')) {
            // It's an email
            user = await usermodel.findOne({ email: name });
        } else {
            // It's a username
            user = await usermodel.findOne({ username: name });
        }
        
        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }
        
        const otp= await sendOtp(user.email);
            if (!otp) {
                return res.status(500).json({
                    message: "Failed to send OTP"
                });
            }
            
            let hash = await bcrypt.hash(otp, 10);
            user.otp = hash;
            user.otpExpiry = Date.now() + 10*60*1000;
            await user.save();
            
            res.cookie('userid', user._id, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 10*60*1000 // 10 minutes
            });
            
            return res.redirect('/verify-otp');
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
}
module.exports.verifyOtp= async (req,res)=>{
    try{
    let {otp}= req.body;
    
    if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
    }
    
    otp = otp.toString().trim();
    // Strict OTP validation: must be exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    // Check if this is a registration (tempRegistration) or login (userid)
    const isRegistration = req.cookies.tempRegistration && !req.cookies.userid;
    
    if (isRegistration) {
        // NEW USER REGISTRATION
        try {
            const tempData = JSON.parse(req.cookies.tempRegistration);
            const { username, email, name, otp: hashedOtp, otpExpiry } = tempData;
            
            if (otpExpiry < Date.now()) {
                res.clearCookie('tempRegistration');
                return res.status(400).json({ message: "OTP Expired" });
            }
            
            let comparedpass = await bcrypt.compare(otp, hashedOtp);
            if (!comparedpass) {
                return res.status(400).json({ success: false, message: "Invalid OTP" });
            }
            
            // OTP verified! Now CREATE the account with verified: true
            let createdUser = await usermodel.create({
                username,
                email,
                name,
                otp: undefined,
                otpExpiry: undefined,
                verified: true  // Account is verified immediately after OTP verification
            });
            
            // Generate token and set it
            let token = genToken(createdUser);
            
            res.cookie('token', token, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7*24*60*60*1000 // 7 days
            });
            
            res.clearCookie('tempRegistration');
            return res.json({success: true, message: "Account created and verified successfully"});
        } catch (err) {
            console.log("Registration verification error:", err);
            res.clearCookie('tempRegistration');
            return res.status(500).json({ message: "Error creating account" });
        }
    } else {
        // EXISTING USER LOGIN
        let userId = req.cookies.userid;
        
        if (!userId) {
            return res.status(400).json({ message: "Session expired or invalid input" });
        }
        
        let user = await usermodel.findById(userId);
        if (!user) {
            res.clearCookie('userid');
            return res.status(400).json({ message: "User not found" });
        }
        
        let serverOtp = user.otp;
        let expiry = user.otpExpiry;
        
        if (expiry < Date.now()) {
            res.clearCookie('userid');
            return res.status(400).json({ message: "OTP Expired" });
        }
        
        let comparedpass = await bcrypt.compare(otp, serverOtp);
        if (!comparedpass) {
            return res.status(400).json({success: false, message: "Invalid OTP"});
        }
        
        // OTP verified for login
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.verified = true;  // Ensure user is marked as verified
        await user.save();

        let token;
        try {
            token = genToken(user);
        } catch (tokenError) {
            console.log("Token Error:", tokenError);
            return res.status(500).json({ message: "Token generation failed" });
        }
        
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000 // 7 days
        });
        
        res.clearCookie("userid");
        return res.json({success: true, message: "Login successful"});
    }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}