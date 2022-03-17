class Contact {
  constructor(name, lastMessage, messageHour) {
    this.name = name;
    this.lastMessage = lastMessage;
    this.messageHour = messageHour;
  }
}

var contact_list = new Array();
contact_list.push(new Contact("Discussions", "Dylan : Les gars on devrait...", "12:48"));
contact_list.push(new Contact("Sorties", "Vincent : Qui est dispo demai...", "Hier"));
contact_list.push(new Contact("Projet AWS", "Elyn : On abandonne ?", "Vendredi"));
contact_list.push(new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll"));


function renderContacts() {
  let div = document.querySelector("#contact-list");
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
    let contact = document.querySelector("#contact-" + i);
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

// ToDo: ajouter un bouton retour pour réafficher l'accueil

var me = "Elyn"; // ToDo: client, auteur du message
class Message {
  constructor(author, content, time) {
    this.author = author; // 1 si moi, 0 si l'autre
    this.content = content;
    this.time = time;
  }
}


var messagesArray = Array();
messagesArray.push(new Message("Dylan", "Salut !", new Date()));



let send = document.querySelector("#send");
send.addEventListener("click", sendMessage, true);

function sendMessage() {
  let chatbox = document.querySelector("#chat-box");
  if (chatbox.value.length == 0) {
    console.log("Aucun message à envoyer");
    return;
  }

  messagesArray.push(new Message(me, chatbox.value, new Date()));
  
  chatbox.value = "";
  renderMessages();
}

// Touche entrée liée au bouton d'envoi de message
window.addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
     this.document.querySelector("#send").click();
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
  let messagesChat = document.querySelector("#messages-chat");
  messagesChat.innerHTML = "";
  
  for (let i = 0; i < messagesArray.length; i++) {
    var author = messagesArray[i].author;

    // Check si premier message pour ajouter le nom
    if (i == 0 || (i>0 && messagesArray[i-1].author != author)) {
      let newMsgDiv = document.createElement("div");
      newMsgDiv.classList.add("message");
      messagesChat.appendChild(newMsgDiv);
      let text = document.createElement("p");
      text.classList.add("username");
      text.appendChild(document.createTextNode(author));
      newMsgDiv.appendChild(text);
    }

    if (author == me) {
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
     
    if (i == messagesArray.length-1 || (i < messagesArray.length && messagesArray[i+1].author != author) ) {
      let newMsgDiv = document.createElement("div");
      newMsgDiv.classList.add("message");
      messagesChat.appendChild(newMsgDiv);
      let time = document.createElement("p");
      time.classList.add("time");
      let formatted_time = messagesArray[i].time.toLocaleTimeString().substring(0, 5);
      time.appendChild(document.createTextNode(formatted_time));
      newMsgDiv.appendChild(time);
    } 
  }
  updateScroll();
}

// Maintient la scroll bar au bas à chaque message ajouté
function updateScroll(){
  var messagesChat = document.querySelector("#messages-chat");
  messagesChat.scrollTop = messagesChat.scrollHeight;
}
