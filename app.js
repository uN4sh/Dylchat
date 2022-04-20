require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

const path = require("path");
const htmlPath = path.join(__dirname, "/source");
app.use(express.static(htmlPath));

app.use("/styles", express.static(__dirname + '/source/stylesheets'));
app.use("/scripts", express.static(__dirname + '/source/javascripts'));
app.use("/images", express.static(__dirname + '/source/images'));


// Routage //

const verifyToken = require("./middleware/verifyToken");

// Accède à la page home si le token (cookie) est valide, sinon renvoie la page login  
app.get("/", verifyToken, (req, res) => {
    if (req.user)
        res.status(200).sendFile(__dirname + "/source/home.html");
    else
        res.status(req.err.status).sendFile(__dirname + "/source/login.html");
})


app.get("/logout", (req, res) => {
    res.cookie("jwt", "", { maxAge: "1" }) // Supprime le token de l'utilisateur
    // res.status(200).redirect("/")
    res.status(200).send({status:200, redirect: "/"});
})

const { register, login, getUsers, getUsername } = require("./api/auth");
app.post("/register", register); // Exécute la routine register
app.post("/login", login); // Exécute la routine login 
app.get("/getUsers", getUsers); // Affiche tous les users de la DB 
app.get("/getUsername", getUsername); // Affiche l'username et l'email de l'utilisateur connecté

const { getConversations, newConversation, updateConversation } = require("./api/conversations");
app.post("/newConversation", newConversation);
app.get("/getConversations", getConversations);
app.post("/updateConversation", updateConversation);


// WEBSOCKETS //

var { SSL } = process.env;
SSL = SSL == "true" ? true : false;

var cfg = {
    ssl: SSL,
    port: 8080,
    ssl_key: './privkey.pem',
    ssl_cert: './fullchain.pem'
};

var httpServ = (cfg.ssl) ? require('https') : require('http');
var server = null;

var processRequest = function (req, res) {
    console.log("Request received.")
};

const fs = require('fs');
if (cfg.ssl) {
    server = httpServ.createServer({
        // providing server with  SSL key/cert
        key: fs.readFileSync(cfg.ssl_key),
        cert: fs.readFileSync(cfg.ssl_cert)
    }, processRequest).listen(cfg.port);

} else {
    server = httpServ.createServer(processRequest).listen(cfg.port);
}

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: server });

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

const clientList = new Map();
console.log("\nServer is open !\n")

const MessageModel = require("./model/message");
const User = require("./model/user");
const Conversation = require("./model/conversation");

wss.on("connection", async (ws, req) => {
    // let clientId = getRandomID();
    // if (clientId == -1) {
    //     ws.send("ECHEC, veuillez retenter une connexion...");
    //     ws.close();
    // } else {
    //     console.log(`New client with ID : #${clientId}`);
    //     let infoClient = { id: clientId, connection: ws };
    //     listClient.push(infoClient);
    //     ws.send(clientId);
    // }

    // Check si le canal Discussions existe et le créer si non 
    const discussions = await Conversation.findOne({ username1: null });
    if (!discussions) {
        console.log("Création du canal Discussions")
        await Conversation.create({
            username1: null,
            username2: null,
            lastMessage: "Nouvelle conversation",
            messageHour: null
        });
    }

    const jwttoken = req.headers.cookie.split("jwt=")[1];
    const user = await User.findOne({ token: jwttoken });
    const metadata = { username: user.username, email: user.email };
    console.log("%s is now connected!", metadata.username);
    clientList.set(ws, metadata);

    // ToDo: check si il y a un utilisateur avec token invalide et le déconnecter

    // ToDo: ne pas envoyer tous les messages (laisser l'user fetch les messages en cliquant sur une conv)
    sendAllStoredMessages(ws);

    ws.on("message", async data => {
        // ToDo: parser la data reçue pour savoir si c'est un message ou si c'est une nouvelle conv
        storeMessage(data.toString(), ws);
        let message = JSON.parse(data.toString());
        console.log(message);

        // Get la conversation du message
        const conv = await Conversation.findOne({ _id: message.idchat });
        if (!conv) {
            console.log("ERR - Conversation non trouvée");
            return;
        }

        // Update la conversation avec le nouveau message
        const update = { lastMessage: message.author + ": " + message.content, messageHour: message.time };
        await Conversation.findOneAndUpdate({ _id: message.idchat }, update);


        message = JSON.stringify(message);
        // Si chat général : envoyer le message à tous les clients connectés
        if (!conv.username1) {
            clientList.forEach(function (metadata, clientws) {
                console.log("Sent to " + metadata.username);
                clientws.send(message);
            })
        }
        // Sinon : l'envoyer seulement aux deux utilisateurs concernés
        else {
            // ToDo: mieux récupérer les users via la Map
            clientList.forEach(function (metadata, clientws) {
                if (metadata.username == conv.username1 || metadata.username == conv.username2) {
                    console.log("Sent to " + metadata.username);
                    clientws.send(message);
                }
            })
        }
    });

    ws.on("close", () => {
        console.log("%s has disconnected", clientList.get(ws).username);
        clientList.delete(ws);
    });
});


// Send to the client all the stored messages
async function sendAllStoredMessages(ws) {
    let metadata = clientList.get(ws);

    // Get tous les chats d'un user
    var convIds = new Array();
    await Conversation.find({
        $or: [{ username1: null }, { username1: metadata.username }, { username2: metadata.username }]
    }).then(async function (convs) {
        convs.forEach(function (conv) {
            convIds.push(conv._id);
        });

        // Get uniquement les messages des chats de l'utilisateurs 
        await MessageModel.find({ idchat: { $in: convIds } }).then(function (msgs) {

            // Tri des messages par timestamp
            msgs.sort(function (a, b) {
                return a.time - b.time
            });

            msgs.forEach(function (msg) {
                ws.send(JSON.stringify(msg));
            });
        });
    });

    // let rawdata = fs.readFileSync('Messages.json');
    // let listMessages = JSON.parse(rawdata);
    // for (let i = 0; i < listMessages.Messages.length; i++) {
    //     ws.send(JSON.stringify(listMessages.Messages[i]));
    // }
}

// Store the message into the JSON file
function storeMessage(message, ws) {
    message = JSON.parse(message);
    let newMessage = new MessageModel(message);
    newMessage.save();

    // let rawdata = fs.readFileSync('Messages.json');
    // let listMessages = JSON.parse(rawdata);

    // listMessages.Messages.push(message);
    // fs.writeFileSync("Messages.json", JSON.stringify(listMessages, null, 2));
}

// Génère un ID à 4 chiffres unique
// TODO : Créer l'ID sous forme de 4 digits
// TODO : Limiter le nombre de client dans la room pour éviter une boucle infinie dans cette fonction
// function getRandomID() {
//     let bonId = true;
//     let nbTentative = 10;
//     let id = -1;
//     do {
//         id = Math.floor(Math.random() * 1e4);
//         for (let i = 0; i < listClient.length; i++) {
//             if (listClient[i].id == id) {
//                 bonId = false;
//             }
//         }
//         nbTentative--;
//     } while (!bonId && nbTentative > 0);

//     return id;
// }


module.exports = app;