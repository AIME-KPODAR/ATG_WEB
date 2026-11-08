/* Sons : effets joués avec l'API Web Audio (sans retard) + musique de fond.
 *
 * Les navigateurs interdisent le son tant que l'utilisateur n'a pas touché la page :
 * on prépare tout au chargement, et le son démarre dès le premier clic / toucher. */
(function (racine) {
    "use strict";

    const FICHIERS = {
        clic: "clic.wav",          // clic de souris : joué à chaque clic
        poser: "poser.wav",        // pion posé / déplacé
        erreur: "erreur.wav",
        victoire: "victoire.mp3",
    };
    const base = (racine.ATG && racine.ATG.son) || "/static/son/";
    const volume = () => Reglages.get().volume / 100;

    let ctx = null;
    let gain = null;
    const tampons = {};
    let musique = null;
    let musiqueVoulue = false;
    let deverrouille = false;

    function preparer() {
        const AC = racine.AudioContext || racine.webkitAudioContext;
        if (!AC) return;
        try {
            ctx = new AC({ latencyHint: "interactive" });
            gain = ctx.createGain();
            gain.connect(ctx.destination);
            appliquerVolume();
        } catch (e) { ctx = null; return; }
        for (const [nom, fichier] of Object.entries(FICHIERS)) {
            fetch(base + fichier)
                .then((r) => r.arrayBuffer())
                .then((buf) => new Promise((ok, ko) => ctx.decodeAudioData(buf, ok, ko)))
                .then((tampon) => { tampons[nom] = tampon; })
                .catch(() => { /* fichier absent : pas de son, le jeu continue */ });
        }
    }

    function appliquerVolume() {
        if (gain) gain.gain.value = volume();
        if (musique) musique.volume = volume() * 0.5;      // la musique est plus discrète
    }

    /** Joue un effet (si les effets sont activés). */
    function jouer(nom) {
        if (!Reglages.get().effets || !ctx || !tampons[nom]) return;
        if (ctx.state === "suspended") ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = tampons[nom];
        source.connect(gain);
        source.start(0);
    }

    function musiqueDemarrer() {
        musiqueVoulue = true;
        if (!Reglages.get().musique) return;
        if (!musique) {
            musique = new Audio(base + "background_music.mp3");
            musique.loop = true;
            musique.preload = "auto";
        }
        appliquerVolume();
        const p = musique.play();
        if (p && p.catch) p.catch(() => { /* bloqué : réessayé au prochain clic */ });
    }

    function musiqueArreter() {
        musiqueVoulue = false;
        if (musique) musique.pause();
    }

    /** Active/désactive la musique ; retourne le nouvel état. */
    function musiqueBasculer() {
        const p = Reglages.get();
        p.musique = !p.musique;
        Reglages.enregistrer();
        if (p.musique) musiqueDemarrer(); else musiqueArreter();
        return p.musique;
    }

    /** À appeler au premier geste de l'utilisateur : lève le blocage audio du navigateur. */
    function debloquer() {
        if (ctx && ctx.state === "suspended") ctx.resume();
        if (deverrouille) {
            // la musique a pu être bloquée au chargement : on la relance si elle est voulue
            if (musiqueVoulue && Reglages.get().musique && musique && musique.paused) musiqueDemarrer();
            return;
        }
        deverrouille = true;
        if (document.body.dataset.musique === "1") musiqueDemarrer();
    }

    preparer();
    racine.Sons = { jouer, appliquerVolume, musiqueDemarrer, musiqueArreter, musiqueBasculer, debloquer };
})(window);
