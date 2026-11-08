/* Paramètres et statistiques, enregistrés dans le navigateur (localStorage). */
(function (racine) {
    "use strict";

    const CLE = "atg_parametres_v1";
    const DIFFICULTES = ["facile", "moyen", "difficile"];

    const PAR_DEFAUT = {
        nom_x: "Joueur X",
        nom_o: "Joueur O",
        musique: true,
        effets: true,
        volume: 60,                  // 0 à 100
        difficulte: "moyen",         // facile | moyen | difficile
        symbole_solo: "X",           // symbole du joueur humain en mode solo
        premier: "alternance",       // X | O | alternance
        limite_coups: 40,            // 0 = illimité ; sinon match nul au-delà
        intro_demarrage: false,
        stats: {
            duel: { X: 0, O: 0, nul: 0 },
            solo: { joueur: 0, ordi: 0, nul: 0 },
        },
    };

    const copie = (o) => JSON.parse(JSON.stringify(o));
    let donnees = copie(PAR_DEFAUT);

    function nettoyer(d) {
        const entier = (v, min, max, defaut) => {
            const n = Math.round(Number(v));
            return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : defaut;
        };
        d.volume = entier(d.volume, 0, 100, PAR_DEFAUT.volume);
        d.limite_coups = entier(d.limite_coups, 0, 200, PAR_DEFAUT.limite_coups);
        if (!DIFFICULTES.includes(d.difficulte)) d.difficulte = "moyen";
        if (!["X", "O"].includes(d.symbole_solo)) d.symbole_solo = "X";
        if (!["X", "O", "alternance"].includes(d.premier)) d.premier = "alternance";
        d.musique = !!d.musique;
        d.effets = !!d.effets;
        d.intro_demarrage = !!d.intro_demarrage;
        d.nom_x = String(d.nom_x || "").trim().slice(0, 16) || "Joueur X";
        d.nom_o = String(d.nom_o || "").trim().slice(0, 16) || "Joueur O";
        return d;
    }

    function charger() {
        donnees = copie(PAR_DEFAUT);
        try {
            const lu = JSON.parse(localStorage.getItem(CLE) || "null");
            if (lu && typeof lu === "object") {
                for (const cle of Object.keys(PAR_DEFAUT)) {
                    if (cle === "stats") {
                        for (const mode of Object.keys(PAR_DEFAUT.stats)) {
                            for (const k of Object.keys(PAR_DEFAUT.stats[mode])) {
                                const v = lu.stats && lu.stats[mode] && lu.stats[mode][k];
                                if (Number.isInteger(v) && v >= 0) donnees.stats[mode][k] = v;
                            }
                        }
                    } else if (cle in lu && typeof lu[cle] === typeof PAR_DEFAUT[cle]) {
                        donnees[cle] = lu[cle];
                    }
                }
            }
        } catch (e) { /* stockage indisponible ou corrompu : valeurs par défaut */ }
        nettoyer(donnees);
    }

    function enregistrer() {
        nettoyer(donnees);
        try { localStorage.setItem(CLE, JSON.stringify(donnees)); return true; }
        catch (e) { return false; }
    }

    const Reglages = {
        PAR_DEFAUT,
        get: () => donnees,
        charger,
        enregistrer,
        definir(valeurs) { Object.assign(donnees, valeurs); nettoyer(donnees); },
        parDefaut() { const stats = donnees.stats; donnees = copie(PAR_DEFAUT); donnees.stats = stats; },
        ajouterResultat(mode, cle) { donnees.stats[mode][cle] += 1; enregistrer(); },
        reinitialiserStats() { donnees.stats = copie(PAR_DEFAUT.stats); enregistrer(); },
    };

    charger();
    racine.Reglages = Reglages;
})(window);
