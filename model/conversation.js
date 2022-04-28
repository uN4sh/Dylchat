const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'message' }
}, {
    versionKey: false
});

module.exports = mongoose.model("conversation", conversationSchema);
