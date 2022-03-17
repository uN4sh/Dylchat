const WebSocket = require("ws");

const path = require("path");
const express = require("express");
const app = express();

const htmlPath = path.join(__dirname, "public");

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
    console.log("New client connected!!");
    listClient.push(ws);

    ws.on("message", data => {
        console.log(data.toString());
        for (let i = 0; i < listClient.length; i++) {
            listClient[i].send(data.toString());
        }
    });

    ws.on("close", () => {
        console.log("Client has disconnected!");
        for (let i = 0; i < listClient.length; i++) {
            if (listClient[i] == ws) {
                listClient.splice(i, 1);
            }
        }
    });
});