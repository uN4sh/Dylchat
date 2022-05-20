const socket = io();

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
        const res = await fetch('/api/users/getUsername', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (res.status === 400 || res.status === 401) {
            return display.textContent = `${data.message}. ${data.error ? data.error : ''}`
        }
        return data;
    } catch (err) {
        console.log(err.message)
    }
}

async function getConversations() {
    try {
        const res = await fetch('/api/chats/getConversations', {
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

async function getOnlineUsers() {
    try {
        const res = await fetch('/api/users/getOnlineUsers', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()
        if (data.status === 200)
            return data.users;
        else
            console.log(data);
    } catch (err) {
        console.log(err.message)
    }
}

// Square and Multiply
function expmod(base, exponent, modulus) {
    if (modulus === 1) return 0;
    let result = 1;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2 === 1)
            result = (result * base) % modulus;
        exponent = exponent >> 1;
        base = (base * base) % modulus;
    }
    return result;
}

let key;

let myPseudo = "Random";
let myId = "";
let activeConversationId;
let messagesDict = {};
let conversations = Array();
let encryptedChats = Array();
let AESKeys = new Map();

/*
var http = location.href.split(":")[0];
http = http == "http" ? "ws" : "wss"; // ws:// si serveur HTTP, sinon wss://
const ws = new WebSocket(http + "://" + location.host.split(':')[0] + ":8080");
*/

// Que faire lorsque la connexion est établie
socket.on("connected", (metadata) => {
    console.log("We are connected,", metadata.username);
});

socket.on('Diffie-Hellman', (p, g, publicServeur) => {
    let secret = Math.floor(Math.random() * (p - 2)) + 2; // ToDo: Remplacer math.random par window.crypto
    let publicClient = expmod(g, secret, p);
    socket.emit('Diffie-Hellman', publicClient);
    key = expmod(publicServeur, secret, p);
});

// Que faire quand le client reçoit un message du serveur
socket.on("newMessage", (message) => {
    // ToDo: si le message est dans un chat chiffré
    // Si l'user a déjà rempli la clé : le déchiffrer
    // Sinon : rien faire

    message.content = CryptoJS.AES.decrypt(message.content, key.toString());
    message.content = message.content.toString(CryptoJS.enc.Utf8);

    // Stockage des messages dans le dictionnaire messagesDict selon les chats :
    //      "chatid": [message, message, message]
    //      "chatid": [message, message, message]
    if (!(message.idchat in messagesDict))
        messagesDict[message.idchat] = Array()
    messagesDict[message.idchat].push(message);

    // Afficher les messages si le nouveau message est sur la conversation active
    if (message.idchat == activeConversationId)
        renderMessages();

    // Actualiser lastMessage et messageHour et faire remonter la conversation
    renderConversations();
});


socket.on("allMessages", (msgs) => {
    msgs.forEach(message => {
        message.content = CryptoJS.AES.decrypt(message.content, key.toString());
        message.content = message.content.toString(CryptoJS.enc.Utf8);
        if (!(message.idchat in messagesDict))
            messagesDict[message.idchat] = Array()
        messagesDict[message.idchat].push(message);
    });

    // Afficher les messages et actualiser les conversations
    renderMessages();
    renderConversations();
});

function convertTimestampToTime(timestamp) {
    let msgdate = new Date(parseInt(timestamp));
    // console.log(msgdate.toLocaleString());
    return msgdate.toLocaleTimeString().slice(0, 5);
}

function convertTimestampToDate(timestamp) {
    let msgdate = new Date(parseInt(timestamp));
    return msgdate.toLocaleDateString();
}


async function renderConversations() {
    await getConversations().then(async function(res) {
        conversations = res.chats;
        encryptedChats = res.encrypted;
        if (!conversations)
            return;

        // Ajout des conversations chiffrées dont la clé est saisie dans l'array des conversations        
        for (let i = encryptedChats.length - 1; i >= 0; --i) {
            const enc = encryptedChats[i];
            if (AESKeys.has(enc._id)) {
                encryptedChats.splice(i, 1);
                conversations.push(enc);
            }
        }

        // Récupération des utilisateurs en ligne
        await getOnlineUsers().then(function(onlineUsers) {
            $("#contact-list").empty();
            for (let i = 0; i < conversations.length; i++) {

                $("#contact-list").append(`
                    <div id="contact-${i}" class="row sideBar-body">
                      <div class="sideBar-main">
                          <div class="row">
                              <div class="col-sm-8 col-xs-8 sideBar-name">
                                  <span id="contact-title-${i}" class="name-meta"> RIEN </span>
                              </div>
                              <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
                                  <span id="contact-hour-${i}" class="time-meta pull-right"> RIEN </span>
                              </div>
                          </div>
                        </div>
                      <div class="sideBar-main">
                        <div class="row">
                          <div class="col-sm-12 col-xs-12 sideBar-lastMessage">
                                <span id="contact-message-${i}" class="lastMessage-meta"> RIEN </span>
                          </div> 
                        </div>
                      </div>
                    </div>
                `);

                if (conversations[i]._id == activeConversationId)
                    $(`#contact-${i}`).addClass("selected");

                conversations[i].idcontact = i;

                // Titre de la conversation
                let contactTitle = "";
                if (conversations[i].userId1 == null)
                    contactTitle = "[Discussions]";
                else {
                    if (conversations[i].encrypted)
                        contactTitle += "🔒 ";
                    if (conversations[i].userId1.username == myPseudo) {
                        // ToDo: ajouter un vrai truc CSS pour distinguer les personnes en ligne et les chats chiffrés
                        if (onlineUsers.includes(conversations[i].userId2.username))
                            contactTitle += "🟢 "
                        contactTitle += conversations[i].userId2.username;
                    } else {
                        if (onlineUsers.includes(conversations[i].userId1.username))
                            contactTitle += "🟢 "
                        contactTitle += conversations[i].userId1.username;
                    }
                }
                $(`#contact-title-${i}`).text(contactTitle);

                // Contenu du dernier message
                if (conversations[i].lastMessageId) {

                    if (conversations[i].lastMessageId.author == myPseudo)
                        $(`#contact-message-${i}`).text(conversations[i].lastMessageId.content);
                    else
                        $(`#contact-message-${i}`).text(conversations[i].lastMessageId.author + ": " + conversations[i].lastMessageId.content);

                    // Timestamp du dernier message (affichée en date si message ancien)
                    let messageDate = new Date(parseInt(conversations[i].lastMessageId.time)).getDate();
                    if (messageDate == new Date().getDate())
                        $(`#contact-hour-${i}`).text(convertTimestampToTime(conversations[i].lastMessageId.time));
                    else
                        $(`#contact-hour-${i}`).text(convertTimestampToDate(conversations[i].lastMessageId.time));

                } else {
                    // Nouvelle conversation
                    $(`#contact-message-${i}`).text("Nouvelle conversation");
                    $(`#contact-hour-${i}`).text("-")
                }
            }

            // Ajout des évènements au clic sur contact
            for (let i = 0; i < conversations.length; i++) {
                $(`#contact-${i}`).on("click", selectContact);
            }

            // ToDo: à remplacer par if(encryptedChats.length une fois que tout est ok
            if (encryptedChats && !AESKeys.length) {
                $("#contact-list").append(`
                <div class="row sideBar-alert-body">
                    <div class="sideBar-main-alert">
                        <div class="row">
                            <div class="col-sm-8 col-xs-8 sideBar-alert">
                                <span class="alert-meta"> 🔒 Vous avez ${encryptedChats.length} conversation(s) chiffrée(s) </span>
                            </div>
                            <div class="col-sm-8 col-xs-8 sideBar-alert">
                                <span class="alert-meta text-link-blue" onclick="AESKeysPopup()"> Cliquer ici pour les déverrouiller </span>
                            </div>
                        </div>
                    </div>
                </div>
                `);
            }
        })
    });
}

function selectContact(e) {
    conversations.forEach(conv => {
        if ("contact-" + conv.idcontact == e.currentTarget.id) {
            openChat(conv);
            return;
        }
    });
};

async function sendMessage() {
    if ($("#chat-box").val().length == 0) {
        console.log("Aucun message à envoyer");
        return;
    }

    // ToDo : si on est dans une conversation chiffrée : chiffrer le message
    // Sinon : envoyer directement
    // ToDo : ajouter un event newEncryptedMessage pour ajouter l'id du second utilisateur à l'envoi du message

    let encrypted = CryptoJS.AES.encrypt($("#chat-box").val(), key.toString());
    let message = new Message(activeConversationId, myPseudo, encrypted.toString(), new Date().getTime());

    socket.emit("newMessage", message);
    $("#chat-box").val("");
}


// Maintient la scroll bar au bas à chaque message ajouté
function updateScroll() {
    var messagesChat = document.querySelector("#messages-chat");
    messagesChat.scrollTop = messagesChat.scrollHeight;
}

// ToDo: faire un updateScroll après renderConversation


function renderMessages() {
    $("#messages-chat").empty();
    if (!(activeConversationId in messagesDict))
        return;

    // Récupérer les messages de la conversation courante
    let messagesArray = messagesDict[activeConversationId]
    for (let i = 0; i < messagesArray.length; i++) {

        var author = messagesArray[i].author;
        var messageDate = new Date(parseInt(messagesArray[i].time)).getDate();

        // Affichage de la date au premier message ou entre 2 messages de dates différentes 
        if ((i == 0) ||
            (i > 0 && messageDate != new Date(parseInt(messagesArray[i - 1].time)).getDate())) {

            let messageDateString = convertTimestampToDate(messagesArray[i].time);
            $("#messages-chat").append(`
                <div class="row message-body">
                    <div class="message-main">
                        <span class="message-date">${messageDateString}</span>
                    </div>
                </div>
            `);
        }


        // Message envoyé 
        if (myPseudo == author) {
            $("#messages-chat").append(`
              <div class="row message-body">
                  <div class="col-sm-12 message-main-sender">
                      <div class="row sender-nick">
                        <span id="chat-username-${i}">  </span>
                      </div>
                      <div class="sender">
                          <div id="chat-content-${i}" class="message-text">
                              RIEN
                          </div>
                          <span id="chat-time-${i}" class="message-time pull-right">
                              RIEN
                          </span>
                      </div>
                  </div>
              </div>
          `);
        }
        // Message reçu
        else {
            $("#messages-chat").append(`
              <div class="row message-body">
                  <div class="col-sm-12 message-main-receiver">
                      <div class="row receiver-nick">
                        <span id="chat-username-${i}">  </span>
                      </div>
                      <div class="receiver">
                          <div id="chat-content-${i}" class="message-text">
                              RIEN
                          </div>
                          <span id="chat-time-${i}" class="message-time pull-right">
                              RIEN
                          </span>
                      </div>
                  </div>
              </div>
          `);
        }

        $(`#chat-content-${i}`).text(messagesArray[i].content);
        $(`#chat-time-${i}`).text(convertTimestampToTime(messagesArray[i].time));

        // Check si premier message pour ajouter le nom
        if (i == 0 ||
            (i > 0 && messagesArray[i - 1].author != author) ||
            (i > 0 && messagesArray[i - 1].author == author && messageDate != new Date(parseInt(messagesArray[i - 1].time)).getDate())) {
            $(`#chat-username-${i}`).text(author);
        }

    }
    updateScroll();
}


window.addEventListener('DOMContentLoaded', async event => {

    getUsername().then(function(data) {
        myPseudo = data.username;
        myId = data.id;
        // Affichage du pseudo de l'utilisateur connecté
        $("#username").text(myPseudo);
    });

    await renderConversations();

    // Touche entrée liée au bouton d'envoi de message
    window.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            $("#send").click();
        }
    });

    // Link des boutons à leurs fonctions
    $("#back-button").click(function() {
        $("#partie-gauche").slideToggle("fast");
    });

    $("#logout-button").on("click", function(event) {
        $('#logoutPopup').modal('show');
    });

    $("#add-contact-button").on("click", openAddContactPopup);

});


/* -------------------- Menu d'ajout de conversation -------------------- */

function openAddContactPopup(event) {
    $("#addContactError").addClass("invisible");
    $('#addContactPopup').modal('show');

    // Bouton confirmer la conversation non chiffrée
    $("#addContactConfirm").on("click", async function(e) {
        e.preventDefault();

        // Check si l'utilisateur a entré un pseudo
        if ($("#addContactInput").val().length == 0) {
            $("#addContactError").text("Veuillez entrer l'identifiant de l'utilisateur à qui vous souhaitez écrire.");
            $("#addContactError").removeClass("invisible");
            return;
        }

        // POST Request 
        const body = { username2: $("#addContactInput").val() };
        $("#addContactInput").val("");
        const res = await fetch('/api/chats/newConversation', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        res.json().then(response => {
            if (response.status === 200) {
                socket.emit("newConversation", { userId1: response.userId1, userId2: response.userId2 });
                $('#addContactPopup').modal('hide');
                $("#addContactConfirm").off('click');
            } else {
                $("#addContactError").text(response.error);
                $("#addContactError").removeClass("invisible");
            }
        }).catch(error => console.error('Error:', error))
    });

    // Bouton Conversation chiffrée
    $('#openEndToEndPopup').on('click', async function(e) {
        e.preventDefault();

        // Check si l'utilisateur a entré un pseudo
        if ($("#addContactInput").val().length == 0) {
            $("#addContactError").text("Veuillez entrer l'identifiant de l'utilisateur à qui vous souhaitez écrire.");
            $("#addContactError").removeClass("invisible");
            return;
        }

        // POST Request 
        const body = { username2: $("#addContactInput").val() };
        // $("#addContactInput").val("");
        const res = await fetch('/api/chats/isDiffieHellmanable', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        res.json().then(response => {
            if (response.status === 200) {
                $("#addContactInput").val("");
                $('#openEndToEndPopup').off('click');
                $('#addContactPopup').modal('hide');
                processDiffieHellman(response);
            } else {
                $("#addContactError").text(response.error);
                $("#addContactError").removeClass("invisible");
            }
        }).catch(error => console.error('Error:', error))
    });

};

socket.on("newConversation", async() => {
    await renderConversations();
});

/* -------------------- Diffie-Hellman -------------------- */

let senderSecret;

function processDiffieHellman(data) {
    $('#diffieHellmanPopup').modal({
            backdrop: 'static',
            keyboard: false
        })
        // ToDo: trouver un moyen de prévenir l'utilisateur que si il quitte, le protocole s'annule (et emit un cancelDiffieHellman)

    // Boutons de pop-up et placeholder de clé résultat
    $('#diffieHellmanError').addClass("invisible");
    $('#readyDiffieHellman').show();
    $('#cancelDiffieHellman').show();
    $('#terminateDiffieHellman').hide();
    $('#generatedSymKey').val("");

    $('#diffieHellmanPopup').modal('show');
    $('#otherUserDFProgress').text(`Clique sur "Je suis prêt" pour notifier ${data.user2}`);

    // ToDo après DH authentifié: si les clés sont déjà renseignées: les écrire dans publicKeyInput et privateKeyInput 

    $('#cancelDiffieHellman').on('click', function(e) {
        e.preventDefault();
        socket.emit("cancelDiffieHellman", data.userId1, data.userId2);
        $('#diffieHellmanPopup').modal('hide');
        return;
    });

    $('#readyDiffieHellman').on('click', function(e) {
        e.preventDefault();
        $('#otherUserDFProgress').text(`En attente de ${data.user2}...`);
        // Calcul de la valeur publique A du DH
        senderSecret = Math.floor(Math.random() * (data.p - 2)) + 2; // ToDo: Remplacer math.random par window.crypto
        data.publicA = expmod(data.g, senderSecret, data.p);
        // Envoi des données au serveur pour transfert à user2
        socket.emit("engageDiffieHellman", data);
    });
}

socket.on("acceptedDiffieHellman", async(data) => {
    // Retrait des deux boutons
    $('#readyDiffieHellman').hide();
    $('#cancelDiffieHellman').hide();
    $('#terminateDiffieHellman').show();

    $('#otherUserDFProgress').text(`La conversation chiffrée avec ${data.user2} a été créée.`);
    $('#diffieHellmanError').text("Veillez à enregistrer la clé symétrique dans un fichier local de clés avant de fermer de cette fenêtre.");
    $('#diffieHellmanError').removeClass("invisible");
    let secretKey = expmod(data.publicB, senderSecret, data.p);

    // POST Request pour la création de la conversation 
    const body = { username2: data.user2 };
    const res = await fetch('/api/chats/newEncryptedConversation', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })

    res.json().then(response => {
        // Affichage de l'ID de conversation et de la clé symétrique 
        $('#generatedSymKey').val(`"${response.idChat}":  "${secretKey.toString(16)}", `);
        // Stockage de la paire en Map
        AESKeys.set(response.idChat, secretKey);
        // Envoi de la nouvelle conversation aux deux parties
        socket.emit("newConversation", { userId1: response.userId1, userId2: response.userId2 });
    }).catch(error => console.error('Error:', error))
});

socket.on("notifDiffieHellman", (data) => {
    $('#notifDHPopup').modal('show');
    $('#notifDHText').text(`${data.user1} souhaite engager une conversation privée avec vous.`)

    $('#rejectDiffieHellman').on('click', function(e) {
        e.preventDefault();
        socket.emit("cancelDiffieHellman", data.userId1, data.userId2);
        $('#cancelDiffieHellman').off('click');
        $('#notifDHPopup').modal("hide");
        return;
    });

    $('#acceptDiffieHellman').on('click', async function(e) {
        e.preventDefault();
        // Calcul de la valeur publique B du DH
        let receiverSecret = Math.floor(Math.random() * (data.p - 2)) + 2; // ToDo: Remplacer math.random par window.crypto
        data.publicB = expmod(data.g, receiverSecret, data.p);
        socket.emit("acceptedDiffieHellman", data);

        $('#acceptDiffieHellman').off('click');
        await new Promise(r => setTimeout(r, 1000));
        $('#notifDHPopup').modal("hide");
        finishDiffieHellman(data, receiverSecret);
        return;
    });
});


function finishDiffieHellman(data, receiverSecret) {
    let secretKey = expmod(data.publicA, receiverSecret, data.p);

    // ToDo : retrouver l'ID du chat
    let idChat = null;

    encryptedChats.forEach(conv => {
        if ((conv.userId1._id == data.userId1 && conv.userId2._id == data.userId2) ||
            (conv.userId1._id == data.userId2 && conv.userId2._id == data.userId1)) {
            idChat = conv._id;
        }
    });


    $('#diffieHellmanPopup').modal({
            backdrop: 'static',
            keyboard: false
        })
        // Boutons de popup
    $('#readyDiffieHellman').hide();
    $('#cancelDiffieHellman').hide();
    $('#terminateDiffieHellman').show();

    // ToDo: trouver un moyen de prévenir l'utilisateur que si il quitte, le protocole s'annule (et emit un cancelDiffieHellman)
    $('#diffieHellmanPopup').modal('show');
    $('#otherUserDFProgress').text(`La conversation chiffrée avec ${data.user1} a été créée.`);
    // Affichage de l'ID de conversation et de la clé symétrique 
    $('#generatedSymKey').val(`"${idChat}":  "${secretKey.toString(16)}", `);
    // Stockage de la paire en Map
    AESKeys.set(idChat, secretKey);
    $('#diffieHellmanError').text("Veillez à enregistrer la clé symétrique dans un fichier local de clés avant de fermer de cette fenêtre.");
    $('#diffieHellmanError').removeClass("invisible");
    renderConversations();
}

socket.on("cancelDiffieHellman", () => {
    $('#otherUserDFProgress').text(`Protocole Diffie-Hellman annulé.`);
    // ToDo: cancelDiffieHellman : dire qui a annulé et fermer la fenetre 
});


/* -------------------- AES -------------------- */

// ToDo: popup pour entrer les clés AES
function AESKeysPopup() {
    $("#AESKeysError").addClass("invisible");
    $('#AESKeysPopup').modal('show');

    $('#AESKeysConfirm').on('click', function(e) {
        $("#AESKeysError").addClass("invisible");
        e.preventDefault();

        if (!$('#AESKeysInput').val().length) {
            $("#AESKeysError").text("Veuillez saisir au minimum une clé AES pour valider.");
            $("#AESKeysError").removeClass("invisible");
        }

        // Parsing des IDs conv / clés AES
        const jsonRegExp = new RegExp('\".+\"\ *\:\ *\".+\"'); // Regex "dfdf":"dsfsd"
        const parsed = ($('#AESKeysInput').val().match(jsonRegExp))[0];
        console.log(parsed);

        if (parsed.length) {
            // Retirer les espaces
            let string = parsed.replace(/ /g, "").replace(/"/g, "");
            console.log(string);
            const keys = string.split(",");
            console.log(keys);
            for (const key of keys) {
                AESKeys.set(key.split(":")[0], key.split(":")[1]);
            }
            renderConversations();
            $('#AESKeysInput').val("");
            $('#AESKeysPopup').modal('hide');
        } else {
            $("#AESKeysError").text("Le format est invalide.");
            $("#AESKeysError").removeClass("invisible");
        }
    })
}


/* -------------------- Menu de déconnexion -------------------- */

async function deconnexion() {
    try {
        const res = await fetch('/api/users/logout', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json()

        if (data.status === 200) {
            window.location = data.redirect;
        }
    } catch (err) {
        console.log(err.message)
    }
}

function accueilpage() {
    $("#menu_ajouter_conv").css("display", "none");
    $("#menu_deco").css("display", "none");

    $("#accueil").removeClass("hidden");
    $("#footer").removeClass("hidden");
    $("#chat").addClass("hidden");

    for (let i = 0; i < conversations.length; i++) {
        $(`contact-${i}`).removeClass("selected");
    }
}


function openChat(chat) {
    for (let i = 0; i < conversations.length; i++) {
        $(`#contact-${i}`).removeClass("selected");
    }
    $(`#contact-${chat.idcontact}`).addClass("selected");

    // Affichage de la discussion sur la partie droite en cachant l'accueil
    $("#accueil").addClass("hidden");
    $("#footer").addClass("hidden");

    $("#header-chat").removeClass("hidden");
    $("#messages-chat").removeClass("hidden");
    $("#reply-chat").removeClass("hidden");

    // Si écran XS : retirer la partie gauche au clic sur un contact
    if ($(window).width() < 768) {
        // $("#partie-gauche").addClass("hidden");
        $("#partie-gauche").slideToggle("fast"); // ToDo: faire un slide left/right (cf. jquery-ui easing)
    };

    // Afficher le nom du destinaire
    activeConversationId = chat._id; // Set active conv ID
    if (chat.userId1 == null)
        $("#chat-name").text("[Discussions] – Canal général");
    else if (chat.userId1.username == myPseudo)
        $("#chat-name").text(chat.userId2.username);
    else
        $("#chat-name").text(chat.userId1.username);

    // Afficher les messages
    renderMessages();
}


function openGeneralChat() {
    for (let i = 0; i < conversations.length; i++) {
        $(`#contact-${i}`).removeClass("selected");
    }

    conversations.forEach(conv => {
        if (!("userId1" in conv)) {
            openChat(conv);
            return;
        }
    });
}