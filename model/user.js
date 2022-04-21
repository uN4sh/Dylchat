const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    usernamelowercase: { type: String, unique: true },
    username: { type: String, unique: true }, 
    status: { type: Boolean },
    password: { type: String },
    token: { type: String },
}, {
    versionKey: false
});

module.exports = mongoose.model("user", userSchema);
