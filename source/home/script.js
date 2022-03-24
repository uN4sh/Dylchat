class Contact {
  constructor(name, lastMessage, messageHour) {
    this.name = name;
    this.lastMessage = lastMessage;
    this.messageHour = messageHour;
  }
}

class Message {
  constructor(author, content, time) {
    this.author = author;
    this.content = content;
    this.time = time;
  }
}


var myPseudo = "Random";
var ID = -1;


var contact_list = new Array();
contact_list.push(new Contact("Discussions", "Dylan : Les gars on devrait...", "12:48"));
contact_list.push(new Contact("Sorties", "Vincent : Qui est dispo demai...", "Hier"));
contact_list.push(new Contact("Projet AWS", "Elyn : On abandonne ?", "Vendredi"));
contact_list.push(new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll"));

var messagesArray = Array();
messagesArray.push(new Message("Dylan", "Salut !", new Date()));


// TODO : faire en sorte que cet URL s'adapte à l'adresse du serveur
const ws = new WebSocket("ws://localhost:8080");


var messageNumber = 0;

// Que faire lorsque la connexion est établie
ws.addEventListener("open", () => {
  console.log("We are connected");
});


// Que faire quand le client reçoit un message du serveur
ws.addEventListener("message", data => {
  if (messageNumber == 0) { // Le tout premier message est celui du serveur qui communique l'ID du client
    console.log(data.data);
    ID = parseInt(data.data);
    alert(`Your ID is ${ID}`);
  }
  else {
    let msg = JSON.parse(data.data);
    console.log(msg);
    let message = new Message(msg.author, msg.content, msg.time);
    messagesArray.push(message);
    renderMessages();
  }
  messageNumber++;
});


function getTime() {
  let date = new Date();
  let milisec = Date.now();
  let seconds = milisec / 1000;
  let minutes = seconds / 60;
  minutes -= date.getTimezoneOffset(); // Permet de ne pas appliquer le fuseau horaire du client
  let hours = minutes / 60;
  let result = Math.floor(hours % 24) + ":" + Math.floor(minutes % 60);
  return result;
}


function renderContacts() {
  let div = document.getElementById("contact-list");
  div.innerHTML = "";
  for (let i = 0; i < contact_list.length; i++) {
    let contact = document.createElement("div");
    contact.classList.add("contact");
    contact.id = "contact-" + i;
    div.appendChild(contact);

    let grid80 = document.createElement("div");
    grid80.classList.add("grid-80-20");
    contact.appendChild(grid80);

    let contact_title = document.createElement("p");
    contact_title.classList.add("contact-title");
    contact_title.innerText = contact_list[i].name;
    grid80.appendChild(contact_title);

    let message_hour = document.createElement("p");
    message_hour.classList.add("message-hour");
    message_hour.innerText = contact_list[i].messageHour;
    grid80.appendChild(message_hour);

    let last_message = document.createElement("p");
    last_message.classList.add("last-message");
    last_message.innerText = contact_list[i].lastMessage;
    contact.appendChild(last_message);
  }
}

renderContacts();

var selectContact = function (e) {
  for (let i = 0; i < contact_list.length; i++) {
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

  // Afficher les messages
  renderMessages();
};

// Ajout des évènements au clic sur contact
for (let i = 0; i < contact_list.length; i++) {
  let contact = document.querySelector("#contact-" + i);
  contact.addEventListener("click", selectContact, true);
}

// TODO : ajouter un bouton retour pour réafficher l'accueil


function sendMessage() {
  let chatbox = document.getElementById("chat-box");
  if (chatbox.value.length == 0) {
    console.log("Aucun message à envoyer");
    return;
  }

  let message = new Message(myPseudo, chatbox.value, getTime());
  ws.send(JSON.stringify(message));

  chatbox.value = "";
}

// Touche entrée liée au bouton d'envoi de message
window.addEventListener('keyup', function (event) {
  if (event.keyCode === 13) {
    this.document.getElementById("send").click();
  }
});



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

  for (let i = 0; i < messagesArray.length; i++) {
    var author = messagesArray[i].author;

    // Check si premier message pour ajouter le nom
    if (i == 0 || (i > 0 && messagesArray[i - 1].author != author)) {
      let newMsgDiv = document.createElement("div");
      newMsgDiv.classList.add("message");
      messagesChat.appendChild(newMsgDiv);
      let text = document.createElement("p");
      text.classList.add("username");
      text.appendChild(document.createTextNode(author));
      newMsgDiv.appendChild(text);
    }

    let messageId = parseInt(author.split('#')[1]);
    if (messageId == ID) {
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

    }
    else {
      /*
      <div class="message text-only">
        <p class="text"> Ça va ? </p>
      </div>
      <p class="time"> 14h58</p> */
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
      // let formatted_time = messagesArray[i].time.toLocaleTimeString().substring(0, 5);
      // time.appendChild(document.createTextNode(formatted_time));
      time.appendChild(document.createTextNode(messagesArray[i].time));
      newMsgDiv.appendChild(time);
    }
  }
  updateScroll();
}

// Maintient la scroll bar au bas à chaque message ajouté
function updateScroll() {
  var messagesChat = document.querySelector("#messages-chat");
  messagesChat.scrollTop = messagesChat.scrollHeight;
}
