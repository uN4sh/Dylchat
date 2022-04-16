class Contact {
    constructor(name, lastMessage, messageHour) {
        this.name = name;
        this.lastMessage = lastMessage;
        this.messageHour = messageHour;
    }
}

class Message {
    constructor(idchat, author, content, time) {
        this.idchat = idchat;
        this.author = author;
        this.content = content;
        this.time = time;
    }
}

async function getUsername() {
    try {
        const res = await fetch('/getUsername', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (res.status === 400 || res.status === 401) {
            return display.textContent = `${data.message}. ${data.error ? data.error : ''}`
        }
        return data.username;
    } catch (err) {
        console.log(err.message)
    }
}

async function getConversations() {
    try {
        const res = await fetch('/getConversations', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (res.status === 400 || res.status === 401) {
            console.log(`${data.message}. ${data.error ? data.error : ''}`)
        }
        return data;
    } catch (err) {
        console.log(err.message)
    }
}


let myPseudo = "Random";
let activeConversationId;
let messagesDict = {};
let conversations = Array();


var http = location.href.split(":")[0];
http = http == "http" ? "ws" : "wss"; // ws:// si serveur HTTP, sinon wss://
const ws = new WebSocket(http + "://" + location.host.split(':')[0] + ":8080");


// Que faire lorsque la connexion est établie
ws.addEventListener("open", () => {
    console.log("We are connected");
});


// Que faire quand le client reçoit un message du serveur
ws.addEventListener("message", data => {
    // ToDo: à modifier pour afficher les messages sur les bonnes conversations :
    // Si le message est sur la conversation active
    //      Faire un fetch DB avec un /getMessages 
    //      Call renderMessages() pour le réaffichage
    //      Call renderConversations() pour actualiser lastMessage et messageHour
    // Sinon, le message est sur une autre conversation
    //      Call renderConversations() pour actualiser lastMessage et messageHour et faire remonter la conversation

    let msg = JSON.parse(data.data);
    // console.log(msg);
    let message = new Message(msg.idchat, msg.author, msg.content, msg.time);

    // Stockage des messages dans le dictionnaire messagesDict selon les chats :
    //      "chatid": [message, message, message]
    //      "chatid": [message, message, message]
    if (!(message.idchat in messagesDict))
        messagesDict[message.idchat] = Array()
    messagesDict[message.idchat].push(message);

    // Afficher les messages si le nouveau message est sur la conversation active
    if (msg.idchat == activeConversationId)
        renderMessages();

    renderConversations();
});


function convertTimestamp(timestamp) {
    let msgdate = new Date(parseInt(timestamp));
    // console.log(msgdate.toLocaleString());
    return msgdate.toLocaleTimeString().slice(0, 5);
}

// TODO : intégrer dans la fonction 'ajouterContact'
// const newConvForm = document.getElementById("newConvForm");
// document.querySelector("#add-contact").addEventListener("click", function() {
//     newConvForm.submit();
// });


async function renderConversations() {
    await getConversations().then(function(res) {
        conversations = res.conversation;

        let div = document.getElementById("contact-list");
        div.innerHTML = "";
        if (!conversations)
            return;

        for (let i = 0; i < conversations.length; i++) {
            let contact = document.createElement("div");
            contact.classList.add("contact");

            if (conversations[i]._id == activeConversationId)
                contact.classList.add("selected");

            contact.id = "contact-" + i;
            // ToDo: transformer conversations en une map (Id, conversation)
            conversations[i].idcontact = i;
            div.appendChild(contact);

            let grid80 = document.createElement("div");
            grid80.classList.add("grid-80-20");
            contact.appendChild(grid80);


            let contact_title = document.createElement("p");
            contact_title.classList.add("contact-title");
            if (conversations[i].username1 == null)
                contact_title.innerText = "Discussions"
            else if (conversations[i].username1 == myPseudo)
                contact_title.innerText = conversations[i].username2;
            else
                contact_title.innerText = conversations[i].username1;
            grid80.appendChild(contact_title);

            let message_hour = document.createElement("p");
            message_hour.classList.add("message-hour");
            if (conversations[i].messageHour != null)
                message_hour.innerText = convertTimestamp(conversations[i].messageHour);
            else
                message_hour.innerText = "/"
            grid80.appendChild(message_hour);

            let last_message = document.createElement("p");
            last_message.classList.add("last-message");
            if (conversations[i].lastMessage != null) {
                last_message.innerText = conversations[i].lastMessage;
            } else
                last_message.innerText = "/"
            contact.appendChild(last_message);
        }

        // Ajout des évènements au clic sur contact
        for (let i = 0; i < conversations.length; i++) {
            let contact = document.querySelector("#contact-" + i);
            contact.addEventListener("click", selectContact, true);
        }
    });
}

var selectContact = function(e) {
    for (let i = 0; i < conversations.length; i++) {
        let contact = document.getElementById("contact-" + i);
        contact.classList.remove("selected");
    }
    e.currentTarget.classList.add("selected");

    // Affichage de la discussion sur la partie droite en cachant l'accueil
    let activeAccueil = document.querySelector("#accueil");
    activeAccueil.classList.add("hidden");
    let footer = document.querySelector("#footer");
    footer.classList.add("hidden");
    let chatHome = document.querySelector("#chat");
    chatHome.classList.remove("hidden");

    // Afficher le nom du destinaire
    let chatname = document.querySelector("#chat-name");
    conversations.forEach(conv => {
        if ("contact-" + conv.idcontact == e.currentTarget.id) {
            activeConversationId = conv._id; // Set active conv ID
            if (conv.username1 == null)
                chatname.innerHTML = "Discussions";
            else if (conv.username1 == myPseudo)
                chatname.innerHTML = conv.username2
            else
                chatname.innerHTML = conv.username1
        }
    });

    // Afficher les messages
    renderMessages();
};



// TODO : ajouter un bouton retour pour réafficher l'accueil


async function sendMessage() {
    let chatbox = document.getElementById("chat-box");
    if (chatbox.value.length == 0) {
        console.log("Aucun message à envoyer");
        return;
    }

    let message = new Message(activeConversationId, myPseudo, chatbox.value, new Date().getTime());

    ws.send(JSON.stringify(message));
    chatbox.value = "";
}


// Maintient la scroll bar au bas à chaque message ajouté
function updateScroll() {
    var messagesChat = document.querySelector("#messages-chat");
    messagesChat.scrollTop = messagesChat.scrollHeight;
}

/*
<div class="message text-only">
  <div class="response">
    <p class="text"> ??? </p>
  </div>
</div>
<p class="response-time time"> 15h04</p>  
*/
function renderMessages() {
    let messagesChat = document.getElementById("messages-chat");
    messagesChat.innerHTML = "";

    if (!(activeConversationId in messagesDict))
        return;

    let messagesArray = messagesDict[activeConversationId]
    for (let i = 0; i < messagesArray.length; i++) {
        // Ne pas afficher les messages des autres conversations
        if (messagesArray[i].idchat != activeConversationId)
            continue;

        var author = messagesArray[i].author;

        // Check si premier message pour ajouter le nom
        if (i == 0 || (i > 0 && messagesArray[i - 1].author != author)) {
            let newMsgDiv = document.createElement("div");
            newMsgDiv.classList.add("message");
            messagesChat.appendChild(newMsgDiv);
            let text = document.createElement("p");
            text.classList.add("username");
            if (myPseudo == author) {
                text.classList.add("response-username");
            }
            text.appendChild(document.createTextNode(author));
            newMsgDiv.appendChild(text);
        }
        if (myPseudo == author) {
            let newMsgDiv = document.createElement("div");
            newMsgDiv.classList.add("message");
            newMsgDiv.classList.add("text-only");
            messagesChat.appendChild(newMsgDiv);
            let response = document.createElement("div");
            response.classList.add("response");
            newMsgDiv.appendChild(response);
            let text = document.createElement("p");
            text.classList.add("text");
            text.appendChild(document.createTextNode(messagesArray[i].content));
            response.appendChild(text);
        } else {
            let newMsgDiv = document.createElement("div");
            newMsgDiv.classList.add("message");
            newMsgDiv.classList.add("text-only");
            messagesChat.appendChild(newMsgDiv);
            let text = document.createElement("p");
            text.classList.add("text");
            text.appendChild(document.createTextNode(messagesArray[i].content));
            newMsgDiv.appendChild(text);
        }
        // Check si c'est le dernier message pour afficher l'heure
        // ToDo: afficher l'heure si message date de + de 5mn
        // || (i > 0 && messagesArray[i].time > new Date(messagesArray[i-1].time.getTime() + 1 * 60000) )
        if (i == messagesArray.length - 1 || (i < messagesArray.length && messagesArray[i + 1].author != author)) {
            let newMsgDiv = document.createElement("div");
            newMsgDiv.classList.add("message");
            messagesChat.appendChild(newMsgDiv);
            let time = document.createElement("p");
            time.classList.add("time");
            if (myPseudo == author) {
                time.classList.add("response-time");
            }

            time.appendChild(document.createTextNode(convertTimestamp(messagesArray[i].time)));
            newMsgDiv.appendChild(time);
        }
    }
    updateScroll();
}


window.addEventListener('DOMContentLoaded', async event => {

    getUsername().then(function(res) {
        myPseudo = res;
    });

    await renderConversations();

    // Touche entrée liée au bouton d'envoi de message
    window.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            this.document.getElementById("send").click();
        }
    });

});


/* -------------------- Menu d'ajout de conversation -------------------- */
function ouvrirMenu() {
    document.getElementById("menu_ajouter_conv").style.display = "grid";
}

function fermerMenu() {
    document.getElementById("menu_ajouter_conv").style.display = "none";
}

function ajouterContact() {
    let input = document.getElementById("entree_pseudo");
    let text = input.value;
    document.getElementById("menu_ajouter_conv").style.display = "none";
    alert(text);
    input.value = "";
}