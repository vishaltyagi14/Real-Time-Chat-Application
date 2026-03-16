const mongoose=require('mongoose');

const userSchema= mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    bio: {
        type: String,
        default: "Hey there! I'm using Chat App",
        maxlength: 150
    },
    phone: {
        type: String,
        default: ""
    },
    profilePicture: {
        type: String,
        default: null  // Will store base64 or image URL
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Number
    },
    verified: {
        type: Boolean,
        default: false  // User must verify OTP before account is active
    }
}, { timestamps: true })

module.exports = mongoose.model("user",userSchema)