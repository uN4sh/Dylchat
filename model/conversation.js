const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    username1: { type: String },
    username2: { type: String },
    lastMessage: { type: String },
    messageHour: { type: String }
}, {
    versionKey: false
});

module.exports = mongoose.model("conversation", conversationSchema);
