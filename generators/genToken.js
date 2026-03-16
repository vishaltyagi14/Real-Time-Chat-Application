const jwt = require("jsonwebtoken")
const genToken=(user)=>{
    return jwt.sign(
        { email: user.email, id: user._id }, 
        process.env.JWT_KEY,
        { expiresIn: '7d' } // Token expires in 7 days
    )
};
module.exports=genToken