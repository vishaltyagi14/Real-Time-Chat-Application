const express = require('express');
const router = express.Router();
const home= require('../controllers/home')
const auth= require('../authorization/auth')
const {isLogged}= require('../middlewares/isLogged')
const user = require('../models/register')
const chatController = require("../controllers/chatController");

router.get("/messages/:senderId/:receiverId", chatController.getMessages);

router.get('/',home.home);
router.get('/login',home.login)
router.get('/signup',home.signup)
router.get('/logout',auth.logout)
router.get('/verify-otp',home.otp)
router.get('/chat',isLogged,home.chat)
router.post('/register',auth.verSign)
router.post('/loginUser',auth.verLogin)
router.post('/verifyOtp',auth.verifyOtp)
router.post('/adduser/:addId',isLogged,home.adduser)
router.put('/updateProfile',isLogged,home.updateProfile)
router.put('/updateProfilePicture',isLogged,home.updateProfilePicture)
router.delete('/removeFriend/:receiverId',isLogged, chatController.deleteMessages);
// router.delete('/removeFriend/:friendId',isLogged,home.removeFriend)
// router.delete('/deleteMessages/:friendId',isLogged,chatController.deleteMessages)
module.exports =router;