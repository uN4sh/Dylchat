console.log("Hello 🌎");

class Contact {
  constructor(name, lastMessage, messageHour) {
    this.name = name;
    this.lastMessage = lastMessage;
    this.messageHour = messageHour;
  }
}

var contact_list = new Array();
let c = new Contact("Discussions", "Dylan : Les gars on devrait...", "12:48");
contact_list.push(c);
c = new Contact("Sorties", "Vincent : Qui est dispo demai...", "Hier");
contact_list.push(c);
c = new Contact("Projet AWS", "Elyn : On abandonne ?", "Vendredi");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);
c = new Contact("Test d'overflow", "Vérification de la scrollbar", "Scroll");
contact_list.push(c);

function renderContacts() {
  console.log("rendering");
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

};
// Ajout des évènements au clic sur contact
for (let i = 0; i < contact_list.length; i++) {
  let contact = document.querySelector("#contact-" + i);
  contact.addEventListener("click", selectContact, true);
}

// ToDo: ajouter un bouton retour pour réafficher l'accueil