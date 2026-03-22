const mongoose = require("mongoose");
require("dotenv").config();

const dbgr = require("debug")("development:mongoose");

mongoose.connect(`${process.env.MONGODB_URI}/rtl`)
.then(() => {
    dbgr("MongoDB Connected");
})
.catch((err) => {
    dbgr(err);
});

module.exports = mongoose.connection;