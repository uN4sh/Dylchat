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
        return data.username;
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


let myPseudo = "Random";
let activeConversationId;
let messagesDict = {};
let conversations = Array();


/*
var http = location.href.split(":")[0];
http = http == "http" ? "ws" : "wss"; // ws:// si serveur HTTP, sinon wss://
const ws = new WebSocket(http + "://" + location.host.split(':')[0] + ":8080");
*/

// ToDo: ajouter une erreur quand c'est pas possible d'établir la connexion au bout d'un certain temps

// Que faire lorsque la connexion est établie
socket.on("connected", (metadata) => {
    console.log("We are connected,", metadata.username);
});


// Que faire quand le client reçoit un message du serveur
socket.on("newMessage", (message) => {
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
        conversations = res.conversation;
        if (!conversations)
            return;
    
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
                if (conversations[i].userId1 == null)
                    $(`#contact-title-${i}`).text("[Discussions]");
                else if (conversations[i].userId1.username == myPseudo) {
                    // ToDo: ajouter un vrai truc pour afficher les personnes en ligne
                    if (onlineUsers.includes(conversations[i].userId2.username))
                        $(`#contact-title-${i}`).text("🟢 " + conversations[i].userId2.username);
                    else
                        $(`#contact-title-${i}`).text(conversations[i].userId2.username);
                }
                else {
                    if (onlineUsers.includes(conversations[i].userId1.username))
                        $(`#contact-title-${i}`).text("🟢 " + conversations[i].userId1.username);
                    else
                        $(`#contact-title-${i}`).text(conversations[i].userId1.username);
                }
                
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
                
                // Tronquer le message si trop long pour affichage
                // if ($(`#contact-message-${i}`).text().length > 25){
                //     $(`#contact-message-${i}`).text($(`#contact-message-${i}`).text().substring(0, 25));
                //     $(`#contact-message-${i}`).text($(`#contact-message-${i}`).text().concat("..."));
                // }
            }
    
            // Ajout des évènements au clic sur contact
            for (let i = 0; i < conversations.length; i++) {
                $(`#contact-${i}`).on("click", selectContact);
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

    let message = new Message(activeConversationId, myPseudo, $("#chat-box").val(), new Date().getTime());

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
          (i > 0 && messagesArray[i - 1].author == author && messageDate != new Date(parseInt(messagesArray[i - 1].time)).getDate())) 
        {
            $(`#chat-username-${i}`).text(author);
        }

    }
    updateScroll();
}


window.addEventListener('DOMContentLoaded', async event => {

    getUsername().then(function(res) {
        myPseudo = res;
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

    $("#logout-button").on("click", function (event) {
      $('#logoutPopup').modal('show'); 
    });
    
    $("#add-contact-button").on("click", openAddContactPopup);

});


/* -------------------- Menu d'ajout de conversation -------------------- */

function openAddContactPopup(event) {
  $("#addContactError").addClass("invisible");
  $('#addContactPopup').modal('show');

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
            socket.emit("newConversation", response.userId1, response.userId2);
            $('#addContactPopup').modal('hide');
            $("#addContactConfirm").off('click');
        } else {
            $("#addContactError").text(response.error);
            $("#addContactError").removeClass("invisible");
        }
    }).catch(error => console.error('Error:', error))
  
  });
};

socket.on("newConversation", () => {
    renderConversations();
});

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

function accueilpage(){
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
