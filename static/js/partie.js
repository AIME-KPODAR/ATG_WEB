/* Page de jeu (deux joueurs / solo) : port de partie.py.
 * Le plateau est un <canvas> carré qui s'adapte à l'écran. */
(function () {
    "use strict";

    const { Jeu, adversaire, choisirCoup } = window.Logique;
    const section = document.querySelector(".jeu");
    const mode = section.dataset.mode;                       // "duel" | "solo"
    const param = Reglages.get();

    const COULEURS = {
        X: "#EE4035", O: "#0492CF", violet: "#800080", or: "#F2B90F",
        ok: "#2E8B57", erreur: "#C0392B", fond: "#F6F1FA",
    };
    const DELAI_ORDI_MS = 650;

    const canvas = document.getElementById("plateau");
    const zone = document.getElementById("zone-plateau");
    const ctx = canvas.getContext("2d");
    const lblEtat = document.getElementById("etat");
    const lblScoreX = document.getElementById("score-x");
    const lblScoreO = document.getElementById("score-o");
    const lblMinuteur = document.getElementById("minuteur");
    const btnMusique = document.getElementById("btn-musique");

    /* ------------------------------------------------------------ joueurs */
    let humain = null, ordi = null, noms;
    if (mode === "solo") {
        humain = param.symbole_solo;
        ordi = adversaire(humain);
        noms = { [humain]: "Vous", [ordi]: "Ordinateur" };
        document.getElementById("titre-mode").textContent = "SOLO — niveau " + param.difficulte;
    } else {
        noms = { X: param.nom_x, O: param.nom_o };
    }

    let scores = { X: 0, O: 0 };
    let premierPrecedent = null;
    let jeu = null;
    let selection = null;
    let bloque = false;
    let finPrete = false;
    let texteFin = "", couleurFin = "#555555";
    let secondes = 0;
    const taches = { minuteur: null, ordi: null, victoire: null, erreur: null };

    // géométrie du plateau (en pixels CSS)
    let cote = 300, ox = 0, oy = 0, cote_canvas = 300;

    /* ------------------------------------------------------------ messages */
    const message = (texte, couleur) => { lblEtat.textContent = texte; lblEtat.style.color = couleur || ""; };
    const majScores = () => {
        lblScoreX.textContent = `${noms.X} (X) : ${scores.X}`;
        lblScoreO.textContent = `${noms.O} (O) : ${scores.O}`;
    };
    const majBoutonMusique = () => {
        btnMusique.textContent = "Musique : " + (Reglages.get().musique ? "oui" : "non") + " (M)";
    };

    function annuler(nom) {
        if (taches[nom]) { clearTimeout(taches[nom]); clearInterval(taches[nom]); }
        taches[nom] = null;
    }

    /* ------------------------------------------------------ partie / tours */
    function nouvellePartie() {
        annuler("ordi"); annuler("victoire"); annuler("erreur");
        let premier;
        if (param.premier === "alternance") premier = (premierPrecedent === null || premierPrecedent === "O") ? "X" : "O";
        else premier = param.premier;
        premierPrecedent = premier;

        jeu = new Jeu(premier, param.limite_coups);
        selection = null;
        bloque = false;
        finPrete = false;
        secondes = 0;
        annuler("minuteur");
        ticMinuteur();
        taches.minuteur = setInterval(ticMinuteur, 1000);
        majScores();
        dessiner();
        debutDeTour();
    }

    function resetScores() {
        scores = { X: 0, O: 0 };
        nouvellePartie();
    }

    const tourOrdi = () => mode === "solo" && jeu.courant === ordi;

    function debutDeTour() {
        if (jeu.termine) return;
        if (jeu.passerSiBloque()) {
            message(`${noms[adversaire(jeu.courant)]} est bloqué : il passe son tour.`, COULEURS.erreur);
            taches.erreur = setTimeout(debutDeTour, 900);
            return;
        }
        if (jeu.termine) { finDePartie(); return; }        // plus personne ne peut jouer
        messageTour();
        dessiner();
        if (tourOrdi()) {
            bloque = true;
            taches.ordi = setTimeout(jouerOrdi, DELAI_ORDI_MS);
        } else {
            bloque = false;
        }
    }

    function messageTour() {
        const nom = noms[jeu.courant], c = COULEURS[jeu.courant];
        if (tourOrdi()) message(`${nom} réfléchit…`, c);
        else if (jeu.phase() === "placement") message(`Tour de ${nom} (${jeu.courant}) — posez un pion (${jeu.pose[jeu.courant] + 1}/3)`, c);
        else if (selection === null) message(`Tour de ${nom} (${jeu.courant}) — choisissez un de vos pions`, c);
        else message(`Tour de ${nom} (${jeu.courant}) — touchez une case vide adjacente`, c);
    }

    function jouerOrdi() {
        taches.ordi = null;
        if (jeu.termine) return;
        const coup = choisirCoup(jeu, param.difficulte);
        if (coup) appliquer(coup);
    }

    function appliquer(coup) {
        jeu.jouer(coup);
        selection = null;
        Sons.jouer("poser");
        dessiner();
        if (jeu.termine) finDePartie(); else debutDeTour();
    }

    /* ---------------------------------------------------------------- clics */
    function clic(e) {
        if (jeu.termine) { nouvellePartie(); return; }      // un clic après la fin relance une partie
        if (bloque) return;
        const r = canvas.getBoundingClientRect();
        const casepx = cote / 3;
        const col = Math.floor((e.clientX - r.left - ox) / casepx);
        const lig = Math.floor((e.clientY - r.top - oy) / casepx);
        if (col < 0 || col > 2 || lig < 0 || lig > 2) return;   // hors du plateau : ignoré
        const c = lig * 3 + col, joueur = jeu.courant;

        if (jeu.phase() === "placement") {
            if (jeu.plateau[c] === null) appliquer(["poser", c]);
            else erreur("Cette case est déjà occupée.");
            return;
        }
        // phase de déplacement
        if (jeu.plateau[c] === joueur) {
            selection = selection === c ? null : c;
            dessiner();
            messageTour();
        } else if (selection === null) {
            erreur("Sélectionnez d'abord l'un de vos propres pions.");
        } else if (jeu.destinations(selection).includes(c)) {
            appliquer(["deplacer", selection, c]);
        } else {
            erreur("Déplacement invalide : la case doit être vide et adjacente.");
        }
    }

    function erreur(texte) {
        Sons.jouer("erreur");
        message(texte, COULEURS.erreur);
        annuler("erreur");
        taches.erreur = setTimeout(() => { if (!jeu.termine) messageTour(); }, 1600);
    }

    /* ------------------------------------------------------- fin de partie */
    function finDePartie() {
        annuler("minuteur");
        bloque = false;
        if (jeu.gagnant) {
            scores[jeu.gagnant] += 1;
            majScores();
            let texte;
            if (mode === "solo") {
                const gagne = jeu.gagnant === humain;
                texte = gagne ? "Bravo, vous avez gagné !" : "L'ordinateur a gagné.";
                Reglages.ajouterResultat("solo", gagne ? "joueur" : "ordi");
            } else {
                texte = `${noms[jeu.gagnant]} (${jeu.gagnant}) a gagné !`;
                Reglages.ajouterResultat("duel", jeu.gagnant);
            }
            Sons.musiqueArreter();
            Sons.jouer("victoire");
            message(texte + "  Touchez le plateau pour rejouer.", COULEURS.ok);
            texteFin = texte; couleurFin = COULEURS[jeu.gagnant];
            taches.victoire = setTimeout(() => { taches.victoire = null; Sons.musiqueDemarrer(); }, 5200);
        } else {
            Reglages.ajouterResultat(mode === "solo" ? "solo" : "duel", "nul");
            message("Match nul (limite de coups atteinte). Touchez le plateau pour rejouer.", COULEURS.erreur);
            texteFin = "Match nul"; couleurFin = "#555555";
        }
        finPrete = true;
        dessiner();
    }

    /* ---------------------------------------------------------------- dessin */
    function ajusterTaille() {
        // le plateau est un carré qui prend toute la place disponible dans la zone
        const s = Math.max(180, Math.floor(Math.min(zone.clientWidth, zone.clientHeight)));
        const dpr = window.devicePixelRatio || 1;
        cote_canvas = s;
        canvas.style.width = s + "px";
        canvas.style.height = s + "px";
        canvas.width = Math.round(s * dpr);
        canvas.height = Math.round(s * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const centre = (c) => {
        const lig = Math.floor(c / 3), col = c % 3, w = cote / 3;
        return [ox + w * col + w / 2, oy + w * lig + w / 2];
    };

    function dessiner() {
        if (!jeu) return;
        cote = Math.max(150, cote_canvas - 6);
        ox = oy = (cote_canvas - cote) / 2;
        const w = cote / 3, demi = w * 0.28, ep = Math.max(6, w * 0.145);
        ctx.clearRect(0, 0, cote_canvas, cote_canvas);

        // fond blanc du plateau + grille
        ctx.fillStyle = "#fff";
        ctx.fillRect(ox, oy, cote, cote);
        ctx.strokeStyle = COULEURS.violet; ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, cote, cote);
        ctx.strokeStyle = "#999999"; ctx.lineWidth = 3; ctx.lineCap = "butt";
        for (const i of [1, 2]) {
            ctx.beginPath(); ctx.moveTo(ox, oy + w * i); ctx.lineTo(ox + cote, oy + w * i); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox + w * i, oy); ctx.lineTo(ox + w * i, oy + cote); ctx.stroke();
        }

        // aide visuelle : destinations possibles du pion sélectionné
        if (selection !== null && !jeu.termine) {
            const r = Math.max(6, w * 0.07);
            for (const d of jeu.destinations(selection)) {
                const [x, y] = centre(d);
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = "#DDEFD9"; ctx.fill();
                ctx.strokeStyle = COULEURS.ok; ctx.lineWidth = 2; ctx.stroke();
            }
            const [x, y] = centre(selection), m = demi + ep / 2 + 4;
            ctx.strokeStyle = COULEURS.or; ctx.lineWidth = Math.max(3, ep / 5);
            ctx.strokeRect(x - m, y - m, 2 * m, 2 * m);
        }

        // pions
        jeu.plateau.forEach((v, i) => {
            if (!v) return;
            const [x, y] = centre(i);
            if (v === "X") {
                ctx.strokeStyle = COULEURS.X; ctx.lineWidth = ep; ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(x - demi, y - demi); ctx.lineTo(x + demi, y + demi); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - demi, y + demi); ctx.lineTo(x + demi, y - demi); ctx.stroke();
            } else {
                ctx.strokeStyle = COULEURS.O; ctx.lineWidth = ep * 0.8;
                ctx.beginPath(); ctx.arc(x, y, demi, 0, Math.PI * 2); ctx.stroke();
            }
        });

        // ligne gagnante
        if (jeu.ligneGagnante) {
            const [x1, y1] = centre(jeu.ligneGagnante[0]), [x2, y2] = centre(jeu.ligneGagnante[2]);
            ctx.strokeStyle = COULEURS.or; ctx.lineWidth = Math.max(5, ep * 0.4); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }

        if (jeu.termine && finPrete) banniere();
    }

    function banniere() {
        const cx = ox + cote / 2, cy = oy + cote / 2, h = Math.max(34, cote * 0.085);
        ctx.fillStyle = "#fff"; ctx.fillRect(ox + 4, cy - h, cote - 8, 2 * h);
        ctx.strokeStyle = couleurFin; ctx.lineWidth = 4; ctx.strokeRect(ox + 4, cy - h, cote - 8, 2 * h);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = couleurFin;
        let taille = Math.max(13, Math.floor(cote / 22));
        ctx.font = `bold ${taille}px Arial`;
        while (ctx.measureText(texteFin).width > cote - 30 && taille > 10) { taille--; ctx.font = `bold ${taille}px Arial`; }
        ctx.fillText(texteFin, cx, cy - h * 0.25);
        ctx.fillStyle = "#555555";
        ctx.font = `${Math.max(9, Math.floor(cote / 40))}px Arial`;
        ctx.fillText("Touchez ou appuyez sur R pour rejouer", cx, cy + h * 0.55);
    }

    /* ------------------------------------------------------------- minuteur */
    function ticMinuteur() {
        const h = Math.floor(secondes / 3600), m = Math.floor((secondes % 3600) / 60), s = secondes % 60;
        const d = (n) => String(n).padStart(2, "0");
        lblMinuteur.textContent = h ? `${d(h)}:${d(m)}:${d(s)}` : `${d(m)}:${d(s)}`;
        secondes += 1;
    }

    /* ---------------------------------------------------------------- liens */
    canvas.addEventListener("pointerdown", (e) => { if (e.button === 0 || e.pointerType !== "mouse") clic(e); });
    document.getElementById("btn-rejouer").addEventListener("click", nouvellePartie);
    document.getElementById("btn-scores").addEventListener("click", resetScores);
    btnMusique.addEventListener("click", () => { Sons.musiqueBasculer(); majBoutonMusique(); });
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (k === "r") nouvellePartie();
        else if (k === "m") { Sons.musiqueBasculer(); majBoutonMusique(); }
        else if (k === "escape") location.href = document.getElementById("btn-fermer").href;
    });
    window.addEventListener("resize", () => { ajusterTaille(); dessiner(); });
    if (window.ResizeObserver) new ResizeObserver(() => { ajusterTaille(); dessiner(); }).observe(zone);
    window.addEventListener("pagehide", () => Sons.musiqueArreter());

    majBoutonMusique();
    ajusterTaille();
    nouvellePartie();

    // pour les tests automatisés
    window.__partie = { get jeu() { return jeu; }, get scores() { return scores; }, centre: (c) => centre(c) };
})();
