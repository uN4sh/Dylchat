require("dotenv").config();
require("./config/database").connect();
const express = require("express");

const app = express();

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

const path = require("path");
const htmlPath = path.join(__dirname, "/source");
app.use(express.static(htmlPath));

app.use("/styles",  express.static(__dirname + '/source/stylesheets'));
app.use("/scripts", express.static(__dirname + '/source/javascripts'));
app.use("/images",  express.static(__dirname + '/source/images'));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/source/login.html");
});



// AUTHENTICATION //

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

// importing user context
const User = require("./model/user");

// Register
app.post("/register", async (req, res) => {
    try {
        // Get user input
        console.log(req.body);
        const { usernameSignup, emailSignup, passwordSignup } = req.body;

        // Validate user input
        if (!(emailSignup && passwordSignup && usernameSignup)) {
            res.status(400).send("All input is required");
            return;
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ username:usernameSignup });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedUserPassword = await bcrypt.hash(passwordSignup, 10);

        // Create user in our database
        const user = await User.create({
            username: usernameSignup.toLowerCase(),
            email: emailSignup.toLowerCase(), // sanitize
            password: encryptedUserPassword,
        });
    
        // Create token
        const token = jwt.sign(
            { user_id: user._id, usernameSignup },
            process.env.TOKEN_KEY,
            {
            expiresIn: "5h",
            }
        );
        // save user token
        user.token = token;
    
        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        // Get user input
        console.log(req.body);
        const { usernameLogin, passwordLogin } = req.body;

        // Validate user input
        if (!(usernameLogin && passwordLogin)) {
            res.status(400).send("All input is required");
        }
        
        // Validate if user exist in our database
        const user = await User.findOne({ username:usernameLogin.toLowerCase() });

        if (user && (await bcrypt.compare(passwordLogin, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, usernameLogin },
                process.env.TOKEN_KEY,
                {
                expiresIn: "5h",
                }
            );

            // save user token
            user.token = token;

            // user
            // return res.status(200).json(user);
            // ToDo: conditionner l'accès avec middleware/auth
            // ToDo: post vers /home avec le token en param
            return res.status(200).redirect("/home");
            // return res.status(200).sendFile(__dirname + "/source/home.html");
        }
        return res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

// ToDo: conditionner l'accès avec middleware/auth
// ToDo: post vers /home avec le token en param
app.get("/home", function(req, res) {
    res.sendFile(__dirname + "/source/home.html");
});


const auth = require("./middleware/auth");

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome to FreeCodeCamp 🙌");
});



// WEBSOCKETS //

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

// function getTime() {
//     let date = new Date();
//     let milisec = Date.now();
//     let seconds = milisec / 1000;
//     let minutes = seconds / 60;
//     minutes -= date.getTimezoneOffset();
//     let hours = minutes / 60;
//     let result = Math.floor(hours % 24) + ":" + Math.floor(minutes % 60);
//     return result;
// }

var listClient = [];
console.log("\nServer is open !\n")

wss.on("connection", ws => {
    let clientId = getRandomID();
    if (clientId == -1) {
        ws.send("ECHEC, veuillez retenter une connexion...");
        ws.close();
    }
    else {
        console.log(`New client with ID : #${clientId}`);
        let infoClient = { id: clientId, connection: ws };
        listClient.push(infoClient);
        ws.send(clientId);
    }

    ws.on("message", data => {
        let message = JSON.parse(data.toString());
        let id = -1;
        for (let i = 0; i < listClient.length; i++) { // Cherche l'id de l'emetteur du message
            if (listClient[i].connection == ws) {
                id = listClient[i].id;
            }
        }
        message.author += '#' + id;
        console.log(message);
        message = JSON.stringify(message);
        for (let i = 0; i < listClient.length; i++) { // Envoie du message à tous les clients connectés
            listClient[i].connection.send(message);
        }
    });

    ws.on("close", () => {
        for (let i = 0; i < listClient.length; i++) {
            if (listClient[i].connection == ws) {
                console.log(`Client #${listClient[i].id} has disconnected!`);
                listClient.splice(i, 1);
            }
        }
    });
});

// Génère un ID à 4 chiffres unique
// TODO : Créer l'ID sous forme de 4 digits
// TODO : Limiter le nombre de client dans la room pour éviter une boucle infinie dans cette fonction
function getRandomID() {
    let bonId = true;
    let nbTentative = 10;
    let id = -1;
    do {
        id = Math.floor(Math.random() * 1e4);
        for (let i = 0; i < listClient.length; i++) {
            if (listClient[i].id == id) {
                bonId = false;
            }
        }
        nbTentative--;
    } while (!bonId && nbTentative > 0);

    return id;
}



module.exports = app;
