require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const cookieParser = require("cookie-parser");
var cookie = require("cookie");

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



// Init serveur HTTP/HTTPS //

let SSL = process.env.SSL;
const PORT = process.env.API_PORT;
SSL = SSL == "true" ? true : false;

var cfg = {
    ssl: SSL,
    port: PORT,
    ssl_key: './privkey.pem',
    ssl_cert: './fullchain.pem'
};

var httpServ = (cfg.ssl) ? require('https') : require('http');
var server = null;

// var processRequest = function (req, res) {
//     console.log("Request received.")
// };

const fs = require('fs');
if (cfg.ssl) {
    server = httpServ.createServer({
        // providing server with  SSL key/cert
        key: fs.readFileSync(cfg.ssl_key),
        cert: fs.readFileSync(cfg.ssl_cert)
    }, app);

} else {
    server = httpServ.createServer(app);
}


// WEBSOCKETS //

const socketIO = require('socket.io');
const io = socketIO(server);

const clientList = new Map();
console.log("\nServer is open !\n")

const MessageModel = require("./model/message");
const User = require("./model/user");
const Conversation = require("./model/conversation");


io.on('connection', async (socket) => {

    // Check si le canal Discussions existe et le créer si non 
    const discussions = await Conversation.findOne({ userId1: null });
    if (!discussions) {
        console.log("Création du canal Discussions")
        await Conversation.create({
            userId1: null,
            userId2: null,
            lastMessageId: null
        });
    }

    var cookies = cookie.parse(socket.handshake.headers.cookie);
    const user = await User.findOne({ token: cookies.jwt });
    const metadata = { username: user.username, id: user._id };
    console.log("%s is now connected!", metadata.username);
    clientList.set(socket, metadata);
    await User.updateOne({ token: cookies.jwt }, { $set: { status: 1 } });
    socket.emit("connected", metadata);

    // ToDo: check si il y a un utilisateur avec token invalide et le déconnecter

    // ToDo: ne pas envoyer tous les messages (laisser l'user fetch les messages en cliquant sur une conv)
    sendAllStoredMessages(socket);

    socket.on("newMessage", async (message) => {
        let newMessage = new MessageModel(message);
        newMessage.save();

        let messageId = newMessage._id;
        console.log(message);


        // Get la conversation du message
        const conv = await Conversation.findOne({ _id: message.idchat });
        if (!conv) {
            console.log("ERR - Conversation non trouvée");
            return;
        }

        // Update la conversation en stockant l'ID du nouveau message
        await Conversation.findOneAndUpdate({ _id: message.idchat }, { lastMessageId: messageId });


        // Si chat général : envoyer le message à tous les clients connectés
        if (!conv.userId1) {
            clientList.forEach(function (metadata, clientSocket) {
                console.log("Sent to " + metadata.username);
                clientSocket.emit("newMessage", message);
            })
        }
        // Sinon : l'envoyer seulement aux deux utilisateurs concernés
        else {
            // ToDo: mieux récupérer les users via la Map
            clientList.forEach(function (metadata, clientSocket) {
                if (metadata.id.equals(conv.userId1) || metadata.id.equals(conv.userId2)) {
                    console.log("Sent to " + metadata.username);
                    clientSocket.emit("newMessage", message);
                }
            })
        }
    });

    socket.on('newConversation', async (data) => {
        // Transmet la nouvelle conversation aux 2 utilisateurs concernés
        socket.emit("newConversation");
        clientList.forEach(function (metadata, clientSocket) {
            if (metadata.id.equals(data.userId2)) {
                clientSocket.emit("newConversation");
            }
        })
    });

    // À la fermeture du socket: passe l'utilisateur hors ligne
    socket.on('disconnect', async () => {
        console.log("%s has disconnected", clientList.get(socket).username);
        await User.updateOne({ _id: clientList.get(socket).id }, { $set: { status: 0 } });
        clientList.delete(socket);
    });
});


// Send to the client all the stored messages
async function sendAllStoredMessages(socket) {
    let metadata = clientList.get(socket);

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

            socket.emit("allMessages", msgs);
        });
    });
}

module.exports = server;
