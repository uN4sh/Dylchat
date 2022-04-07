const User = require("../model/user");
const Conversation = require("../model/conversation");

exports.getConversations = async (req, res, next) => {
    if (!req.cookies.jwt) 
        return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter vos conversations." });
    try {
        const user = await User.findOne({ token:req.cookies.jwt });
        if (!user)
          return res.status(409).json({error: "User not found. Please logout and re-login.", username: "Undefined"});
        
        const conversations = await Conversation.find({ $or: [ { username1:user.username }, { username2:user.username }, { username1:null } ] })
        // ToDo: trier les conversations par dernier message
        res.status(200).json({ conversation: conversations });

    } catch (err) {
        res.status(401).json({ message: "Not successful", error: err.message })
    }    
};

exports.newConversation = async (req, res, next) => {
  if (!req.cookies.jwt) 
  return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter votre pseudo." });
  try {
      const { username2 } = req.body;
      const user = await User.findOne({ token:req.cookies.jwt });
      if (!user)
        return res.status(409).json({error: "User not found. Please logout and re-login.", username: "Undefined"});
      
      const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
      if (!user2)
        return res.status(410).json({error: "User 2 not found. Could not create conversation."});
      if (user.username == user2.username)
        return res.status(411).json({error: "You can't create a conversation with yourself."});
        
      // Vérifier que la conversation n'existe pas déjà 
      const already = await Conversation.findOne(
        { 
          $or: [ 
            { $and: [{username1: user.username}, {username2: user2.username}] }, 
            { $and: [{username2: user.username}, {username1: user2.username}] }
          ] 
        }
      )
      if (already)
        return res.status(411).json({error: "This conversation already exists."});

      await Conversation.create({
        username1: user.username,
        username2: user2.username,
        lastMessage: "Nouvelle conversation", 
        messageHour: null 
      });
      
      return res.status(200).redirect("/home");

  } catch (err) {
      res.status(401).json({ message: "Not successful", error: err.message })
  }
};
