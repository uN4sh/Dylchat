const ws = new WebSocket("ws://localhost:8080");

var pseudo = "Michel";

// Que faire lorsque la connexion est établie
ws.addEventListener("open", () => {
    alert("We are connected");
});

// Que faire quand le client reçoit un message du serveur
ws.addEventListener("message", data => {
    addMessageInBox(data.data);
});

function addMessageInBox(message) {
    let messageBox = document.getElementById("messageBox");
    let newMessage = document.createElement("p");
    let messageNode = document.createTextNode(message);
    newMessage.appendChild(messageNode);
    messageBox.appendChild(newMessage);
}

// Envoyer le message ecrit dans l'input après avoir appuyé sur le bouton "Envoyer"
function sendMessage() {
    let messageInput = document.getElementById("messageInput");
    let message = messageInput.value;
    ws.send(pseudo + " > " + message);
    messageInput.value = '';
}

function chosePseudo() {
    let pseudoInput = document.getElementById("pseudoInput");
    pseudo = pseudoInput.value;
}