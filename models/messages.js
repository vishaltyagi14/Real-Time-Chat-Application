const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    text: {
        type: String,
        required: true
    }
},
{
    timestamps: true
}
);

messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("message", messageSchema);