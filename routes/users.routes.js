module.exports = app => {
    const { register, login, getUsers, getUsername } = require("../controllers/users.controller");
    var router = require("express").Router();

    // Exécute la routine register
    router.post("/register", register); 

    // Exécute la routine login 
    router.post("/login", login); 

    // Affiche tous les users de la DB
    router.get("/getUsers", getUsers);

    // ToDo: Récupère les users connectés
    // router.get("/getOnlineUsers", getOnlineUsers);

    // Affiche l'username et l'email de l'utilisateur connecté
    router.get("/getUsername", getUsername); 

    app.use('/api/users', router);
};
