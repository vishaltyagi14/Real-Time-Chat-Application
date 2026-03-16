const mongoose=require('mongoose');

const connectedSchema= mongoose.Schema({
    loggedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true
        },
    addedUser:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }]
}, { timestamps: true })

module.exports = mongoose.model("adduser",connectedSchema)