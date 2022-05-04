module.exports = app => {
    const { getConversations, newConversation, isDiffieHellmanable, updateConversation } = require("../controllers/conversations.controller.js");
    var router = require("express").Router();

    // Récupère l'ensemble des conversations d'un utilisateur
    router.get("/getConversations", getConversations);

    // Crée une nouvelle conversation
    router.post("/newConversation", newConversation);

    // Vérifier si un utilisateur est connecté
    router.post("/isDiffieHellmanable", isDiffieHellmanable);

    // Actualise une conversation
    // router.post("/updateConversation", updateConversation);

    app.use('/api/chats', router);
};
