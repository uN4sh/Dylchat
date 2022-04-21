module.exports = app => {
    const { register, login, logout, getUsers, getOnlineUsers, getUsername } = require("../controllers/users.controller");
    var router = require("express").Router();

    // Exécute la routine register
    router.post("/register", register); 

    // Exécute la routine login 
    router.post("/login", login); 

    // Affiche tous les users de la DB
    router.get("/getUsers", getUsers);

    // Récupère les users connectés
    router.get("/getOnlineUsers", getOnlineUsers);

    // Récupère l'username de l'utilisateur connecté
    router.get("/getUsername", getUsername); 

    // Déconnecte un utilisateur (le passe hors ligne et détruit son cookie)
    router.get("/logout", logout);

    app.use('/api/users', router);
};
