# Dylchat

# Suivi de projet

- Pas de salles de discussions car chiffrement non implémentable pour un groupe

## Phase 1

### Interface

- [x] Inscription / Connexion
- [x] Page d'accueil
- [ ] **Partie gauche**
  - [x] Affichage des contacts
  - [ ] Scrollbar sur les salles
  - [ ] Link salles de discussions aux discussions en DB
  - [ ] Bouton options profil (changement de pseudo, mot de passe et déconnexion + voir ma clé privée)
- [ ] **Partie droite**
  - [x] Taille des bulles en fonction du message, avec une largeur max (frame) 
  - [x] Heure qui s’affiche sous le dernier message d'une personne
  - [ ] Heure qui s'affiche il y 10 minutes passés entre deux messages d'une même personne (en test)
  - [ ] Scrollbar
  - [ ] Date qui s’affiche quelque part (fixe en haut ou à chaque message en timestamp ou à chaque nouveau jour)
  - [ ] Les messages envoyés doivent être affichés sur la droite de l'écran (CSS à régler)
  - [ ] Bouton retour à l’écran d’accueil (?)
  - [ ] Bouton option en haut à droite du contact (?)

### Côté serveur

- [x] Websockets: échanger des messages en temps réel
- [x] Implémenter correctement le mécanisme de pseudo/ID
- [x] Fusionner les travaux, afficher les messages dans les bulles de l'interface (utiliser la fonction `renderMessage()`)
- [x] Host le serveur sur VPS (<http://dylchat.elyn.cf>)

## Phase 2

### Authentification et cookie

- [x] Ajouter une base de données pour supporter l'inscription et l'authentification
- [x] Générer un token JWT (cookie) pour rendre la connexion persistante
- [x] Créer une API pour les requêtes client vers DB (avec son cookie en paramètre de requète)
- [x] Routage `/login` --> `/home` (recupérer le pseudo de l'utilisateur connecté)
- [ ] Faire en sorte que le `GET /` d'une personne connectée mène au `/home`
- [ ] Ajouter les actions en cas de connexion invalide, inscription invalide, accès non autorisé (`/home` sans token par exemple)

### Base de données MongoDB

- [x] Users (username, email, password, token)
- [ ] Contacts (user.username, user.username)
- [ ] Messages

### Stockage des messages

- [ ] Première implémentation avec une DB pour la room publique unique
- [ ] Réfléchir à l'implémentation de la base de données (stockage des messages)
  - Requète pour récupérer les 50 derniers messages pour les display
  - Si l'utilisateur remonte son chat, la scrollbar se bloque le temps de fetch les 50 prochains messages

# Lancement du serveur

- Installer Mongo (Linux Ubuntu) : 
  ```shell
  sudo apt get install mongo
  # Vérifier que tout fonctionne 
  mongo
  > show dbs
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
- Taper `npm run dev` pour lancer le serveur (`index.js`)
- Le script s'actualise automatiquement avec `nodemon` à chaque modification de fichier
- Les messages "*Listening on `http://localhost:8000`*" et "*Successfully connected to database*" confirment le bon lancement du serveur
