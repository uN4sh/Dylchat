const WebSocket = require("ws");

const path = require("path");
const express = require("express");
const app = express();

const htmlPath = path.join(__dirname, "./source/home");

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

app.use(express.static(htmlPath));

const server = app.listen(8000, function () {
    const host = "localhost";
    const port = server.address().port;
    console.log(`listening on http://${host}:${port}`);
});

const wss = new WebSocket.Server({ port: 8080 });

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