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

const { smtpHost, smtpPort, smtpUser, smtpPass } = transporter.mailConfig || {};
if (!smtpUser || !smtpPass) {
    console.warn("Mailer config missing. Set SMTP_USER/SMTP_PASS (or EMAIL/PASS) to enable OTP emails.");
} else {
    transporter.verify((error) => {
        if (error) {
            console.error("Mailer connection failed:", error.message);
            return;
        }
        console.log(
            `Mailer ready (${smtpHost ? `${smtpHost}:${smtpPort}` : "gmail service"})`
        );
    });
}

app.use(express.json())
const cookieParser = require('cookie-parser')
const cookieSecret = process.env.COOKIE_SECRET || 'your-secret-key-change-in-production';
app.use(cookieParser(cookieSecret));

const viewsPath = path.join(__dirname, 'views');
console.log('EJS Views path set to:', viewsPath);
app.set('views', viewsPath);
app.set('view engine','ejs');
// Explicitly set up EJS engine
const ejs = require('ejs');
app.engine('ejs', ejs.renderFile);
console.log('EJS engine configured');
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended: true}))

// Request logging with more detail
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Status: ${res.statusCode} - ${duration}ms`);
    });
    next();
});

app.use('/',routes)

app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        code: err.code,
        status: err.status,
        stack: err.stack
    });
    res.status(err.status || 500).send({
        error: err.message || 'Server Error',
        path: req.path
    });
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

server.listen(PORT, () => {
    console.log('Server running on port 3000');
})