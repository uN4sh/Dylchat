const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  usernamelowercase: { type: String, unique: true },
  username: { type: String, unique: true }, // ToDo : confirmer l'unicité du pseudo
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);
