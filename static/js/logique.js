/* Logique pure du jeu + IA (port fidèle de logique.py, sans interface).
 *
 * Règles (variante à 3 pions) :
 *  - Phase 1, placement : chaque joueur pose ses 3 pions à tour de rôle.
 *  - Phase 2, déplacement : on déplace un de ses pions vers une case VIDE ADJACENTE
 *    (diagonales comprises).
 *  - Victoire : 3 pions alignés.
 * Cases numérotées de 0 à 8 (ligne * 3 + colonne).
 * Coups : ["poser", case] ou ["deplacer", origine, destination].
 */
(function (racine) {
    "use strict";

    const LIGNES_GAGNANTES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    const PIONS_PAR_JOUEUR = 3;

    function calculerAdjacentes(c) {
        const r = Math.floor(c / 3), col = c % 3, res = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if ((dr || dc) && r + dr >= 0 && r + dr < 3 && col + dc >= 0 && col + dc < 3) {
                    res.push((r + dr) * 3 + col + dc);
                }
            }
        }
        return res;
    }
    const ADJ = Array.from({ length: 9 }, (_, i) => calculerAdjacentes(i));

    const adversaire = (j) => (j === "X" ? "O" : "X");

    class Jeu {
        constructor(premier = "X", limiteCoups = 0) {
            this.plateau = new Array(9).fill(null);
            this.courant = premier;
            this.pose = { X: 0, O: 0 };
            this.nbCoups = 0;
            this.limiteCoups = limiteCoups;     // 0 = illimité
            this.ligneGagnante = null;
            this.gagnant = null;
            this.nul = false;
        }

        copie() {
            const j = new Jeu(this.courant, this.limiteCoups);
            j.plateau = this.plateau.slice();
            j.pose = { X: this.pose.X, O: this.pose.O };
            j.nbCoups = this.nbCoups;
            j.ligneGagnante = this.ligneGagnante;
            j.gagnant = this.gagnant;
            j.nul = this.nul;
            return j;
        }

        get termine() { return this.gagnant !== null || this.nul; }

        phase(joueur) {
            joueur = joueur || this.courant;
            return this.pose[joueur] < PIONS_PAR_JOUEUR ? "placement" : "deplacement";
        }

        casesLibres() {
            const r = [];
            this.plateau.forEach((v, i) => { if (v === null) r.push(i); });
            return r;
        }

        coupsLegaux(joueur) {
            joueur = joueur || this.courant;
            if (this.pose[joueur] < PIONS_PAR_JOUEUR) {
                return this.casesLibres().map((c) => ["poser", c]);
            }
            const coups = [];
            this.plateau.forEach((v, i) => {
                if (v === joueur) {
                    for (const d of ADJ[i]) if (this.plateau[d] === null) coups.push(["deplacer", i, d]);
                }
            });
            return coups;
        }

        destinations(origine) {
            return ADJ[origine].filter((d) => this.plateau[d] === null);
        }

        estLegal(coup) {
            const cle = coup.join(",");
            return this.coupsLegaux().some((c) => c.join(",") === cle);
        }

        /** Applique un coup légal ; retourne true s'il a été appliqué. */
        jouer(coup) {
            if (this.termine || !this.estLegal(coup)) return false;
            const joueur = this.courant;
            if (coup[0] === "poser") {
                this.plateau[coup[1]] = joueur;
                this.pose[joueur] += 1;
            } else {
                this.plateau[coup[1]] = null;
                this.plateau[coup[2]] = joueur;
            }
            this.nbCoups += 1;
            this._verifierFin(joueur);
            if (!this.termine) this.courant = adversaire(joueur);
            return true;
        }

        _verifierFin(joueur) {
            for (const ligne of LIGNES_GAGNANTES) {
                if (ligne.every((i) => this.plateau[i] === joueur)) {
                    this.gagnant = joueur;
                    this.ligneGagnante = ligne;
                    return;
                }
            }
            if (this.limiteCoups && this.nbCoups >= this.limiteCoups) this.nul = true;
        }

        /** Si le joueur courant n'a aucun coup, passe son tour (true si passé). */
        passerSiBloque() {
            if (this.termine || this.coupsLegaux().length) return false;
            const suivant = adversaire(this.courant);
            if (!this.coupsLegaux(suivant).length) { this.nul = true; return false; }
            this.courant = suivant;
            return true;
        }
    }

    /* ======================= Intelligence artificielle ======================= */
    const VICTOIRE = 1000;
    const POIDS_LIGNE = [0, 1, 6, 0];

    function evaluer(jeu, moi) {
        const adv = adversaire(moi), p = jeu.plateau;
        let score = 0;
        if (p[4] === moi) score += 3; else if (p[4] === adv) score -= 3;
        for (const [a, b, c] of LIGNES_GAGNANTES) {
            const ligne = [p[a], p[b], p[c]];
            const nm = ligne.filter((v) => v === moi).length;
            const na = ligne.filter((v) => v === adv).length;
            if (na === 0) score += POIDS_LIGNE[nm];
            else if (nm === 0) score -= POIDS_LIGNE[na];
        }
        return score;
    }

    function negamax(jeu, profondeur, alpha, beta, moi) {
        if (jeu.gagnant) return jeu.gagnant === moi ? VICTOIRE + profondeur : -(VICTOIRE + profondeur);
        if (jeu.nul) return 0;
        if (profondeur === 0) return evaluer(jeu, moi);

        const coups = jeu.coupsLegaux();
        if (!coups.length) {                       // joueur bloqué : il passe
            const s = jeu.copie();
            s.courant = adversaire(s.courant);
            if (!s.coupsLegaux().length) return 0;
            return negamax(s, profondeur - 1, alpha, beta, moi);
        }
        const maximise = jeu.courant === moi;
        let meilleur = maximise ? -1e9 : 1e9;
        for (const coup of coups) {
            const s = jeu.copie();
            s.jouer(coup);
            const val = negamax(s, profondeur - 1, alpha, beta, moi);
            if (maximise) { meilleur = Math.max(meilleur, val); alpha = Math.max(alpha, val); }
            else { meilleur = Math.min(meilleur, val); beta = Math.min(beta, val); }
            if (beta <= alpha) break;
        }
        return meilleur;
    }

    const PROFONDEURS = { facile: 0, moyen: 2, difficile: 5 };

    /** Score de chaque coup légal (utile aux tests de comparaison avec Python). */
    function scoresCoups(jeu, profondeur) {
        const moi = jeu.courant;
        return jeu.coupsLegaux().map((coup) => {
            const s = jeu.copie();
            s.jouer(coup);
            return [coup, negamax(s, profondeur - 1, -1e9, 1e9, moi)];
        });
    }

    const choixAlea = (tab, rng) => tab[Math.floor(rng() * tab.length)];

    /** Choisit un coup pour le joueur courant selon la difficulté. */
    function choisirCoup(jeu, difficulte = "moyen", rng = Math.random) {
        const coups = jeu.coupsLegaux();
        if (!coups.length) return null;
        const prof = difficulte in PROFONDEURS ? PROFONDEURS[difficulte] : 2;
        const moi = jeu.courant;

        // Facile : hasard, mais une fois sur deux il prend une victoire immédiate.
        if (prof === 0) {
            if (rng() < 0.5) {
                for (const coup of coups) {
                    const s = jeu.copie();
                    s.jouer(coup);
                    if (s.gagnant === moi) return coup;
                }
            }
            return choixAlea(coups, rng);
        }

        let meilleurs = [], meilleurScore = -1e9;
        for (const [coup, val] of scoresCoups(jeu, prof)) {
            if (val > meilleurScore) { meilleurScore = val; meilleurs = [coup]; }
            else if (val === meilleurScore) meilleurs.push(coup);
        }
        // Moyen : se trompe 1 fois sur 5, sauf victoire forcée.
        if (difficulte === "moyen" && meilleurScore < VICTOIRE && rng() < 0.2) return choixAlea(coups, rng);
        return choixAlea(meilleurs, rng);
    }

    const API = { Jeu, ADJ, LIGNES_GAGNANTES, adversaire, choisirCoup, scoresCoups, negamax, evaluer, PROFONDEURS };
    if (typeof module !== "undefined" && module.exports) module.exports = API;
    else racine.Logique = API;
})(typeof window !== "undefined" ? window : globalThis);
