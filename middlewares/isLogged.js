const cookieParser = require('cookie-parser')
const jwt= require('jsonwebtoken')
const usermodel= require('../models/register')

module.exports.isLogged=async (req,res,next)=>{
    if(!req.cookies || !req.cookies.token){
        return res.redirect('/login')
    }
    try{
        let decoded = jwt.verify(req.cookies.token,process.env.JWT_KEY);
        const user = await usermodel.findById(decoded.id);
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        // Verify email matches to ensure account integrity
        if (user.email !== decoded.email) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        // Check if user account is verified
        if (!user.verified) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        req.user= user;
        return next()
    }catch (err){
        console.log("Auth error:", err.message);
        res.clearCookie('token');
        return res.redirect('/login')
    }
}