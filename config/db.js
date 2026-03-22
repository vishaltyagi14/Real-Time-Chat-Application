require("dotenv").config();
const mongoose = require("mongoose");

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

module.exports = mongoose.connection;