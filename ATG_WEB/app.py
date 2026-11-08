"""Aimé Tic Tac Toe Game — version web (Flask).

Toute la logique du jeu et l'intelligence artificielle tournent dans le navigateur
(static/js/logique.js) : le serveur ne fait que servir les pages, donc il supporte
sans problème beaucoup de joueurs, même sur l'offre gratuite de PythonAnywhere.

Lancer en local :   python app.py      puis ouvrir http://127.0.0.1:5000
"""
from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)
# Les fichiers statiques (images, sons, vidéo) peuvent être gardés 1 jour par le navigateur.
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 86400


@app.route("/")
def accueil():
    return render_template("index.html", page="accueil")


@app.route("/duel")
def duel():
    return render_template("partie.html", page="duel", mode="duel")


@app.route("/solo")
def solo():
    return render_template("partie.html", page="solo", mode="solo")


@app.route("/jeu")
def ancien_jeu():
    """Ancienne adresse du mode deux joueurs."""
    return redirect(url_for("duel"), code=301)


@app.route("/parametres")
def parametres():
    return render_template("parametres.html", page="parametres")


@app.route("/aide")
def aide():
    return render_template("aide.html", page="aide")


@app.route("/intro")
def intro():
    return render_template("intro.html", page="intro")


@app.errorhandler(404)
def introuvable(_erreur):
    return render_template("404.html", page=""), 404


if __name__ == "__main__":
    app.run(debug=True)
