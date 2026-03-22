const user = require('../models/register');

module.exports.userController=async (req,res)=>{
    try{
        const query = req.query.q;
        if(!query){
            return res.json([]);
        }
        const users = await user.find({
            username: {$regex: query, $options: 'i'}
        }).select('username _id profilePicture')
        res.json(users)
    }catch(err){
        res.status(500).json({ message: "Server error" });
    }
}