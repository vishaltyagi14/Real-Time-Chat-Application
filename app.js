require('dotenv').config()

const express= require('express')
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const PORT = process.env.PORT || 3000;
const app= express();
const server = createServer(app);
const io = new Server(server);
const path= require('path')
const routes= require('./routes/router')
const transporter = require("./generators/mail");
const socket = require('./socketConn/socket')
socket(io)
require('./config/db');

app.use(express.json())
const cookieParser = require('cookie-parser')
const cookieSecret = process.env.COOKIE_SECRET || 'your-secret-key-change-in-production';
app.use(cookieParser(cookieSecret));

app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended: true}))

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use('/',routes)

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).send(err.message || 'Server Error');
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

server.listen(PORT, () => {
    console.log('Server running on port 3000');
})