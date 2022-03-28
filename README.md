# Dylchat

# Suivi de projet

- Pas de salles de discussions car chiffrement non implémentable pour un grupe

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
- [x] Host le serveur sur VPS (http://dylchat.elyn.cf)

## Phase 2

- [ ] Ajouter une base de données pour supporter l'inscription et l'authentification 
- [ ] Faire le routage "page login" --> "page chat" (recupérer le pseudo de la page 'login' pour continuer sur la page 'chat')
- [ ] Réfléchir à l'implémentation de la base de données (stockage des messages)
