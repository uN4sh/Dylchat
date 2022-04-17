# Dylchat

Projet M1 AWS : Web app de messagerie temps réel chiffrée de bout en bout disponible sur 🔗 [dylchat.elyn.cf](https://dylchat.elyn.cf).

## 🚧 Suivi de projet

### Phase 1 : Interface et bases du serveur

- [x] Page d'inscription / Connexion
- [x] Page d'accueil
- [ ] **Partie gauche**
  - [x] Affichage des conversations
  - [ ] Scrollbar sur les conversations
- [x] **Partie droite**
  - [x] Taille des bulles en fonction du message, avec une largeur max (frame)
  - [x] Les messages envoyés doivent être affichés sur la droite de l'écran (CSS à régler)
  - [x] Heure qui s’affiche sous le dernier message d'une personne
  - [x] Scrollbar
- [x] **Websockets:** échanger des messages en temps réel
- [x] Implémenter correctement le mécanisme de pseudo/ID
- [x] Fusionner les travaux, afficher les messages dans les bulles de l'interface (utiliser la fonction `renderMessage()`)
- [x] Host le serveur sur VPS

### Phase 2 : Authentification et cookie

- [x] Ajouter une base de données pour supporter l'inscription et l'authentification
- [x] Générer un token JWT (cookie) pour rendre la connexion persistante
- [ ] Actualiser le Token au bout de 5h / déconnecter l'utilisateur si Token invalide
- [ ] Ajouter un check pour déconnecter l'utilisateur si le cookie n'existe plus (en cas de connexion ailleurs)
- [ ] Gérer le statut `En ligne` / `Hors ligne` des utilisateurs (?)
- [ ] Faire en sorte que le `GET /` d'une personne connectée mène au `/home`

### Phase 2 : API Rest

- [x] Créer une API pour les requêtes client vers DB (avec son cookie en paramètre de requète GET)
- [x] Routine `/login`
- [x] Routine `/register`
- [x] `/getUsers`: renvoie un JSON de tous les utilisateurs inscrits
- [x] `/getUsername`: renvoie un JSON avec l'username et le mail de l'utilisateur connecté (via Token)
- [x] `/getConversations`: renvoie la liste des conversations d'un utilisateur (via Token)
  - [x] Trier les conversations par timestamp du dernier message
- [x] Routine `/newConversation`: crée une nouvelle conversation à partir du Token et du pseudo d'un autre utilisation s'il existe
- [ ] `getAllMessages`: renvoie l'ensemble des messages pour un IdChat
  - [x] Trier les messages par timestamp
  - [ ] Sécurité: ajouter une vérification via Token que l'utilisateur a bien le droit d'accès à ces messages
- [ ] `fetchMessages`: ToDo: réfléchir à une implémentation pour récupérer seulement une partie des messages du chat

### Phase 2 : Base de données MongoDB (Users, Conversations, Messages)

- [x] Users (usernamelowercase, username, email, password, token)
- [ ] Conversations (user.username, user.username, idchat)
  - [x] Un utilisateur peut créer un nouveau chat en entrant un pseudo
    - [ ] Passer cette action par WebSocket pour que le chat soit automatiquement ajouté chez les 2 users
  - [x] Une row se crée dans la table avec un nouveau ID de chat
  - [x] Quand un user se connecte, une routine `renderConversations()` affiche toutes les conversations liées au contact
  - [ ] Gérer tous les cas d'erreurs à l'ajout de contact (utilisateur introuvable, conversation déjà existante, etc.)
  - [ ] Quand un user clique sur une conversation :
    - [x] Le pseudo de l'utilisateur s'affiche en haut du chat
    - [ ] la routine `renderMessage()` fetch les 50 derniers messages du chat en question et les affiche
- [x] Messages (idchat, author, content, time)

### Phase 2 : Stockage des messages

- [x] Première implémentation avec une DB pour la room publique unique
- [x] Créer par défaut la `Conversation` (null, null) pour le canal `Discussions` (ouvert à tous)
- [ ] Réfléchir à l'implémentation de la base de données (stockage des messages)
  - Requète pour récupérer les 50 derniers messages pour les display
  - Si l'utilisateur remonte son chat, la scrollbar se bloque le temps de fetch les 50 prochains messages
- [x] Update les champs `lastMessage` et `messageHour` de la table `Conversation` à chaque nouveau message sur une conversation

### Phase 2 : Scripts et amélioration de l'interface

- [ ] Page d'inscription / connexion : gérer l'affichage des erreurs
  - [x] Connexion invalide
  - [x] Inscription invalide (pseudo déjà utilisé)
  - [ ] Accès non autorisé (`/home` sans token par exemple)

- [ ] `ws.onMessage`: à chaque nouveau message reçu du socket :
  - [ ] Si le message est sur la conversation active :
    - [ ] Faire un fetch DB avec un /getMessages
    - [x] Call `renderMessages()` pour le réaffichage
    - [x] Call `renderConversations()` pour actualiser lastMessage et messageHour
  - [x] Sinon, le message est sur une autre conversation
    - [x] Call `renderConversations()` pour actualiser lastMessage et messageHour (et faire remonter la conversation)

- [ ] **Partie gauche**
  - [ ] Script `getMessages(idchat)` pour un `GET` API sur `/getAllMessages` avec l'IdChat en body de requète
  - [ ] `selectContact()`: clear le tableau `messagesArray` et appeler `getMessages(idchat)` pour le re-remplir
  - [x] Le bouton `+` pour ajouter un contact doit afficher une pop-up avec un `form` input qui `POST` sur `/newConversation`
  - [ ] Améliorer l'affichage du dernier message (afficher le pseudo ou "vous:" ou autre idée), et couper le message au bout de x caractères
- [ ] **Partie droite**
  - [x] `renderMessages()`: Afficher l'heure après 10 minutes entre deux messages d'une même personne (en test)
  - [x] `renderMessages()`: Afficher la date quelque part (fixe en haut ou à chaque message en timestamp ou à chaque nouveau jour)
  - [ ] Ajouter un bouton retour à l’écran d’accueil (?)
  - [ ] Bouton option en haut à droite du contact (?)
  - [ ] Ajouter un bouton pour supprimer un message (?)
    - [ ] Dans l'idéal, quand on passe la souris sur un message, l'icône option s'affiche pour pouvoir supprimer un message
  - [ ] Ajouter un bouton options profil (changement de pseudo, mot de passe et déconnexion + voir ma clé privée) (?)

### Phase 3 : Chiffrement

## Lancement du serveur

- Installer Mongo (Linux Ubuntu) :
  
  ```shell
  sudo apt get install mongo
  # Vérifier que tout fonctionne 
  mongo
  > show dbs
  ```

- À la racine du projet :
  - `npm init -y`
  - `npm install cors mongoose express jsonwebtoken dotenv bcryptjs cookie-parser`
  - `npm install nodemon -D`
  - Modifier les scripts du fichier `package.json` comme suit :

    ```json
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js",
      "test": "echo \"Error: no test specified\" && exit 1"
    }
    ```

  - Créer un fichier `.env` avec les valeurs suivantes :

    ```env
    API_PORT=8000
    API_HOST=localhost
    SSL=false

    MONGO_URI= mongodb://localhost:27017/dylchat

    TOKEN_KEY=random_string
    ```

- Taper `npm run dev` pour lancer le serveur (`index.js`)
- Le script s'actualise automatiquement avec `nodemon` à chaque modification de fichier
- Les messages "*Listening on `http://localhost:8000`*" et "*Successfully connected to database*" confirment le bon lancement du serveur
