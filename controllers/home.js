const user = require('../models/register')
const adduser= require('../models/connected')
const messageModel = require('../models/messages')
const isLogged = require('../middlewares/isLogged')


module.exports.home = (req, res) => {
    res.render('home');
};
module.exports.login = (req, res) => {
    res.render('login');
};
module.exports.signup = (req, res) => {
    res.render('signup');
};
module.exports.otp=(req,res)=>{
    res.render('verify-otp', (err, html) => {
        if (err) {
            console.error('Error rendering verify-otp:', err.message);
            return res.status(500).send('Error loading OTP verification page: ' + err.message);
        }
        res.send(html);
    });
}

module.exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, phone } = req.body;
        const userId = req.user._id;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Name is required" });
        }
        
        const updatedUser = await user.findByIdAndUpdate(
            userId,
            {
                name: name.trim(),
                bio: bio ? bio.trim().substring(0, 150) : req.user.bio,
                phone: phone ? phone.trim() : ""
            },
            { new: true, runValidators: true }
        );
        
        res.json({ 
            success: true, 
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch(err) {
        console.log("Profile update error:", err);
        res.status(500).json({ message: "Error updating profile" });
    }
};

module.exports.updateProfilePicture = async (req, res) => {
    try {
        const { image } = req.body; // Base64 image string
        const userId = req.user._id;
        
        if (!image) {
            return res.status(400).json({ message: "Image is required" });
        }
        
        // Limit image size to 1MB
        if (image.length > 1024 * 1024) {
            return res.status(400).json({ message: "Image size must be less than 1MB" });
        }
        
        const updatedUser = await user.findByIdAndUpdate(
            userId,
            { profilePicture: image },
            { new: true }
        );
        
        res.json({ 
            success: true, 
            message: "Profile picture updated",
            user: updatedUser
        });
    } catch(err) {
        console.log("Profile picture update error:", err);
        res.status(500).json({ message: "Error updating profile picture" });
    }
};

module.exports.adduser = async (req, res) => {
    try{
        const { addId } = req.params;
        if (!addId || !req.user._id) {
            return res.status(400).send("Invalid user ID");
        }
        if (addId === req.user._id.toString()) {
            return res.status(400).send("Cannot add yourself");
        }
        
        const userExists = await user.findById(addId);
        if (!userExists) {
            return res.status(404).send("User not found");
        }
        
        console.log(req.user.id)
        let added= await adduser.findOneAndUpdate(
            { loggedUser: req.user._id },
            { $addToSet: { addedUser: addId } }, 
            { upsert: true, new: true }
        );

        res.redirect("/chat");

    }catch(err){
        console.log("Add user error:", err);
        res.status(500).send("Error adding user");
    }
};


module.exports.chat = async (req, res, next) => {
    try {

        const currentUserId = req.user._id;
        const currentUserIdStr = currentUserId.toString();

        const users = await user.find({
            _id: { $ne: currentUserId }
        });

        let friends = await adduser
            .findOne({ loggedUser: currentUserId })
            .populate("addedUser");
        
        // Ensure friends object exists
        if (!friends) {
            friends = { addedUser: [] };
        }
        
        // Get list of already added user IDs for filtering
        const addedUserIds = friends.addedUser.map(f => f._id.toString());

        // Fetch last message for each friend
        const friendsWithMessages = await Promise.all(
            friends.addedUser.map(async (friend) => {
                const lastMessage = await messageModel.findOne({
                    $or: [
                        { sender: currentUserId, receiver: friend._id },
                        { sender: friend._id, receiver: currentUserId }
                    ]
                }).sort({ createdAt: -1 });
                
                return {
                    ...friend.toObject(),
                    lastMessage: lastMessage ? lastMessage.text : null,
                    lastMessageTime: lastMessage ? lastMessage.createdAt : null
                };
            })
        );

        res.render("chat", {
            currentUser: currentUserIdStr,
            currentUserData: req.user,
            users: users,
            friends: { addedUser: friendsWithMessages },
            addedUserIds: addedUserIds,
            currentUserName: req.user.name || "User"
        });

    } catch (err) {
        console.log("Chat error:", err);
        res.status(500).send("Error loading chat");
    }
};

module.exports.removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const currentUserId = req.user._id;
        
        if (!friendId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }
        
        // Remove friend from addedUser list
        const result = await adduser.findOneAndUpdate(
            { loggedUser: currentUserId },
            { $pull: { addedUser: friendId } },
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ message: "Friend list not found" });
        }
        
        res.json({ success: true, message: "Friend removed successfully" });
    } catch (err) {
        console.log("Remove friend error:", err);
        res.status(500).json({ message: "Error removing friend" });
    }
};