const messageModel = require("../models/messages");

module.exports.getMessages = async (req, res) => {

    const { senderId, receiverId } = req.params;

    try {

        const messages = await messageModel.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (err) {

        res.status(500).json({ error: "Failed to load messages" });

    }

};

module.exports.deleteMessages = async (req, res) => {
    try {
        const { friendId } = req.params;
        const currentUserId = req.user._id;
        
        if (!friendId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }
        
        // Delete all messages between current user and friend
        const result = await messageModel.deleteMany({
            $or: [
                { sender: currentUserId, receiver: friendId },
                { sender: friendId, receiver: currentUserId }
            ]
        });
        
        res.json({ 
            success: true, 
            message: "Chat deleted successfully",
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        console.log("Delete messages error:", err);
        res.status(500).json({ message: "Error deleting chat" });
    }
};