# Dylchat

[![SchoolProject](https://img.shields.io/badge/School-project-83BD75?labelColor=B4E197&style=for-the-badge)]()
[![Javascript](https://img.shields.io/badge/Made%20with-Javascript-B22727?labelColor=EE5007&style=for-the-badge)]()
[![Socket](https://img.shields.io/badge/Uses-Socket.io-E4AEC5?labelColor=FFC4DD&style=for-the-badge)]()

Web app de **messagerie instantée chiffrée de bout en bout** disponible sur 🔗 [dylchat.fr](https://dylchat.fr).

Conversation de groupe, chiffrement end-to-end, messages privés et gestion du compte. 

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
  - `npm install cors mongoose express jsonwebtoken dotenv bcryptjs cookie-parser ws socket.io crypto-js`
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

## Auteurs

* [@Elyn](https://github.com/vdElyn)
* [@Vincent](https://github.com/uvsq21802951)
* [@Elo](https://github.com/elo0501)
* [@Dylan](https://github.com/deadcode-overflow)

## 🚧 Axes d'amélioration

### Côté serveur

- [ ] Améliorer la gestion des statuts `En ligne` / `Hors ligne` des utilisateurs
- [ ] Gérer le cas de la double connexion pour un même utilisateur 
- [ ] Modifier la façon de récupérer les messages d'un chat (pour gérer un + grand nombre de données)
  - Requète pour fetch les 50 derniers messages pour les afficher
  - Si l'utilisateur remonte son chat, la scrollbar se bloque le temps de fetch les 50 prochains messages

### Côté client

- [ ] Script `getMessages(idchat)` pour un `GET` API sur `/getAllMessages` avec l'IdChat en body de requète
- [ ] `selectContact()`: clear le tableau `messagesArray` et appeler `getMessages(idchat)` pour le re-remplir
- [ ] Ajouter une icône pour le statut `En ligne` des contacts et les conversations chiffrées
- [ ] Bouton option en haut à droite du contact (?)
- [ ] Ajouter un bouton pour supprimer un message ou une conversation (?)
