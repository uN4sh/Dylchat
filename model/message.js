//Import the mongoose module
var mongoose = require('mongoose');

// const Conversation = require("./model/conversation");

//Define a schema
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    idchat: {type: mongoose.Schema.Types.ObjectId, ref: 'conversation'},
    author: String,
    content: String,
    time: String
}, {
    versionKey: false
});

module.exports = mongoose.model("message", messageSchema);