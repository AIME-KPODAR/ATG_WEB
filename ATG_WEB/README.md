# Aimé Tic Tac Toe Game — version web

Le même jeu que le programme Windows (même design, mêmes règles, mêmes sons, même vidéo d'introduction),
jouable directement dans le navigateur, sur ordinateur comme sur téléphone.

- **Deux joueurs** et **Solo** contre l'ordinateur (facile / moyen / difficile).
- **Paramètres** (noms, musique, effets, volume, premier joueur, limite de coups, difficulté, symbole…) et
  **statistiques**, enregistrés dans le navigateur de chaque joueur.
- **Aide**, **vidéo d'introduction** (l'image de fond s'affiche à la fin), menu latéral avec bulle d'indication.
- Le plateau s'adapte à l'écran (téléphone, tablette, ordinateur, portrait ou paysage).

Toute la logique du jeu et l'IA tournent **dans le navigateur** (`static/js/logique.js`). Le serveur Flask ne fait
que servir les pages : il n'y a ni base de données ni compte, et le site tient très bien sur l'offre gratuite
de PythonAnywhere.

## Essayer chez vous
```
pip install flask
python app.py
```
puis ouvrir http://127.0.0.1:5000

## Mettre en ligne sur PythonAnywhere
1. Créez un compte gratuit sur https://www.pythonanywhere.com (votre site sera `https://VOTRE_NOM.pythonanywhere.com`).
2. Onglet **Files** → *Upload a file* : envoyez `ATG_WEB.zip` dans votre dossier personnel `/home/VOTRE_NOM/`.
3. Onglet **Consoles** → *Bash* :
   ```
   unzip ATG_WEB.zip
   ```
   Vous obtenez le dossier `/home/VOTRE_NOM/ATG_WEB`.
4. Onglet **Web** → *Add a new web app* → *Next* → **Manual configuration** → choisissez une version de Python (3.10 ou plus).
5. Toujours dans l'onglet **Web**, renseignez :
   - **Source code** : `/home/VOTRE_NOM/ATG_WEB`
   - **Working directory** : `/home/VOTRE_NOM/ATG_WEB`
6. Cliquez sur le lien **WSGI configuration file**, supprimez tout son contenu et collez :
   ```python
   import sys

   chemin = "/home/VOTRE_NOM/ATG_WEB"
   if chemin not in sys.path:
       sys.path.insert(0, chemin)

   from app import app as application
   ```
   (remplacez `VOTRE_NOM`), puis *Save*.
7. Section **Static files** : ajoutez
   - URL : `/static/`
   - Directory : `/home/VOTRE_NOM/ATG_WEB/static`
8. Cliquez sur le gros bouton vert **Reload**. Le jeu est en ligne.

Flask est déjà installé sur PythonAnywhere, il n'y a rien d'autre à installer.
Sur l'offre gratuite, pensez à utiliser régulièrement le bouton de prolongation affiché sur la page **Web**
(l'application est mise en pause si on ne le fait pas). Un nom de domaine personnalisé demande une offre payante.

Pour mettre à jour le jeu plus tard : renvoyez les fichiers modifiés (Files), puis **Reload**.

## Structure
```
app.py                  serveur Flask (pages /, /duel, /solo, /parametres, /aide, /intro)
templates/              pages HTML (base.html = barre violette + menu latéral)
static/css/style.css    design (couleurs et boutons identiques au .exe)
static/js/logique.js    règles + IA (identiques à logique.py du jeu Windows)
static/js/partie.js     plateau, tours, scores, minuteur, sons
static/js/sons.js       effets (Web Audio, sans retard) et musique de fond
static/js/reglages.js   paramètres et statistiques (localStorage)
static/son, static/img, static/video
```

## Remarques
- Les sons et la musique ne démarrent qu'après le premier clic ou toucher (règle des navigateurs).
- Les réglages et statistiques sont propres à chaque appareil/navigateur (pas de compte joueur).
- Le jeu peut aussi s'installer sur l'écran d'accueil d'un téléphone (« Ajouter à l'écran d'accueil »).
