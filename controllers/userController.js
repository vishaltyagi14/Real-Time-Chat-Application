const user = require('../models/register');

module.exports.userController=async (req,res)=>{
    try{
        const query = req.query.q;
        const currentUserId = req.query.currentUser;
        const addedUserIds = req.query.addedUserIds ? JSON.parse(req.query.addedUserIds) : [];
        
        if(!query || query.trim().length === 0){
            return res.json([]);
        }
        
        // Search by username or name with case-insensitive regex
        const searchRegex = { $regex: query.trim(), $options: 'i' };
        
        const users = await user.find({
            $or: [
                { username: searchRegex },
                { name: searchRegex }
            ],
            // Exclude current user and already added users
            _id: { 
                $ne: currentUserId,
                $nin: addedUserIds
            }
        }).select('username name _id profilePicture email').limit(20);
        
        res.json(users);
    }catch(err){
        console.error('Search error:', err);
        res.status(500).json({ message: "Server error during search" });
    }
}