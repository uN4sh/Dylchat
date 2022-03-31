//Import the mongoose module
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var MessagesSchema = new Schema({
    author: String,
    content: String,
    time: String
}, {
    versionKey: false
});

module.exports = mongoose.model("Messages", MessagesSchema);