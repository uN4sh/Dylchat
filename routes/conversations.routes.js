module.exports = app => {
    const { getConversations, newConversation, updateConversation } = require("../controllers/conversations.controller.js");
    var router = require("express").Router();

    // Récupère l'ensemble des conversations d'un utilisateur
    router.get("/getConversations", getConversations);

    // Crée une nouvelle conversation
    router.post("/newConversation", newConversation);

    // Actualise une conversation
    // router.post("/updateConversation", updateConversation);

    app.use('/api/chats', router);
};
