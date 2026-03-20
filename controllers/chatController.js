const messageModel = require("../models/messages");
const connectedModel = require("../models/connected");

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

        const { receiverId } = req.params;
        const currentUserId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }

        // Delete all messages between current user and friend
        const result = await messageModel.deleteMany({
            $or: [
                { sender: currentUserId, receiver: receiverId },
                { sender: receiverId, receiver: currentUserId }
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

module.exports.removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const currentUserId = req.user._id;
        if (!friendId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }
        await connectedModel.deleteMany({
            $or: [
                { loggedUser: currentUserId, addedUser: friendId },
                { loggedUser: friendId, addedUser: currentUserId }
            ]
        });
        res.json({
            success: true,
            message: "Friend Deleted Successfully",
        })
    } catch (err) {
        console.log("Delete Friend error:", err);
        res.status(500).json({ message: "Error Removing Friend" });
    }
}