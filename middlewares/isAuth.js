const jwt = require("jsonwebtoken");

module.exports.checkAuth= (req,res,next)=>{
    let token = req.cookies.token;

    if(token){
        try{
            jwt.verify(token,process.env.JWT_KEY);
            return res.redirect('/chat');
        }catch{}
    }
    next();
}