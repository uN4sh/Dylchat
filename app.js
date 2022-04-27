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

require("./routes/users.routes")(app);
require("./routes/conversations.routes")(app);



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

const clientList = new Map();
console.log("\nServer is open !\n")

const MessageModel = require("./model/message");
const User = require("./model/user");
const Conversation = require("./model/conversation");

wss.on("connection", async (ws, req) => {

    // Check si le canal Discussions existe et le créer si non 
    const discussions = await Conversation.findOne({ userId1: null });
    if (!discussions) {
        console.log("Création du canal Discussions")
        await Conversation.create({
            userId1: null,
            userId2: null,
            username1: null,
            username2: null
        });
    }

    const jwttoken = req.headers.cookie.split("jwt=")[1];
    const user = await User.findOne({ token: jwttoken });
    const metadata = { username: user.username, id: user._id };
    console.log("%s is now connected!", metadata.username);
    clientList.set(ws, metadata);
    await User.updateOne({ token: jwttoken }, { $set: { status: 1 } });

    // ToDo: check si il y a un utilisateur avec token invalide et le déconnecter

    // ToDo: ne pas envoyer tous les messages (laisser l'user fetch les messages en cliquant sur une conv)
    sendAllStoredMessages(ws);

    ws.on("message", async data => {
        // ToDo: parser la data reçue pour savoir si c'est un message ou si c'est une nouvelle conv
        let messageId = storeMessage(data.toString(), ws);
        let message = JSON.parse(data.toString());
        console.log(message);


        // Get la conversation du message
        const conv = await Conversation.findOne({ _id: message.idchat });
        if (!conv) {
            console.log("ERR - Conversation non trouvée");
            return;
        }

        // Update la conversation en stockant l'ID du nouveau message
        await Conversation.findOneAndUpdate({ _id: message.idchat }, { lastMessageId: messageId });


        message = JSON.stringify(message);
        // Si chat général : envoyer le message à tous les clients connectés
        if (!conv.userId1) {
            clientList.forEach(function (metadata, clientws) {
                console.log("Sent to " + metadata.username);
                clientws.send(message);
            })
        }
        // Sinon : l'envoyer seulement aux deux utilisateurs concernés
        else {
            // ToDo: mieux récupérer les users via la Map
            clientList.forEach(function (metadata, clientws) {
                if (metadata.id.equals(conv.userId1) || metadata.id.equals(conv.userId2)) {
                    console.log("Sent to " + metadata.username);
                    clientws.send(message);
                }
            })
        }
    });

    // À la fermeture du socket: passe l'utilisateur hors ligne
    ws.on("close", async () => {
        console.log("%s has disconnected", clientList.get(ws).username);
        await User.updateOne({ _id: clientList.get(ws).id }, { $set: { status: 0 } });
        clientList.delete(ws);
    });
});


// Send to the client all the stored messages
async function sendAllStoredMessages(ws) {
    let metadata = clientList.get(ws);

    // Get tous les chats d'un user
    var convIds = new Array();
    await Conversation.find({
        $or: [{ userId1: null }, { userId1: metadata.id }, { userId2: metadata.id }]
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
}

// Store the message into the JSON file
function storeMessage(message, ws) {
    message = JSON.parse(message);
    let newMessage = new MessageModel(message);
    newMessage.save();
    return newMessage._id;
}


module.exports = app;