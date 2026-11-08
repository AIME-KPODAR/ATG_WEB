/* Page Paramètres. */
(function () {
    "use strict";

    const form = document.getElementById("form-param");
    const conf = document.getElementById("confirmation");
    const $ = (id) => document.getElementById(id);
    const radios = (nom) => form.querySelectorAll(`input[name="${nom}"]`);
    const valeurRadio = (nom) => { const r = form.querySelector(`input[name="${nom}"]:checked`); return r ? r.value : null; };
    const fixerRadio = (nom, v) => radios(nom).forEach((r) => { r.checked = r.value === v; });

    const volumeInitial = Reglages.get().volume;       // pour annuler l'aperçu du volume

    function remplir() {
        const p = Reglages.get();
        $("nom_x").value = p.nom_x;
        $("nom_o").value = p.nom_o;
        $("musique").checked = p.musique;
        $("effets").checked = p.effets;
        $("volume").value = p.volume;
        $("volume-val").textContent = p.volume;
        fixerRadio("premier", p.premier);
        $("limite_coups").value = p.limite_coups;
        fixerRadio("difficulte", p.difficulte);
        fixerRadio("symbole_solo", p.symbole_solo);
        $("intro_demarrage").checked = p.intro_demarrage;
        majStats();
    }

    function majStats() {
        const s = Reglages.get().stats;
        $("stats").innerHTML =
            `Deux joueurs : X ${s.duel.X} victoire(s) · O ${s.duel.O} · nuls ${s.duel.nul}<br>` +
            `Solo : vous ${s.solo.joueur} victoire(s) · ordinateur ${s.solo.ordi} · nuls ${s.solo.nul}`;
    }

    function message(texte, erreur) {
        conf.textContent = texte;
        conf.style.color = erreur ? "var(--erreur)" : "";
    }

    // aperçu immédiat du volume
    $("volume").addEventListener("input", () => {
        const v = Number($("volume").value);
        $("volume-val").textContent = v;
        Reglages.get().volume = v;
        Sons.appliquerVolume();
    });
    $("musique").addEventListener("change", () => {
        Reglages.get().musique = $("musique").checked;      // pas de musique sur cette page
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const limite = parseInt($("limite_coups").value, 10);
        Reglages.definir({
            nom_x: $("nom_x").value,
            nom_o: $("nom_o").value,
            musique: $("musique").checked,
            effets: $("effets").checked,
            volume: Number($("volume").value),
            premier: valeurRadio("premier"),
            limite_coups: Number.isNaN(limite) ? Reglages.PAR_DEFAUT.limite_coups : limite,
            difficulte: valeurRadio("difficulte"),
            symbole_solo: valeurRadio("symbole_solo"),
            intro_demarrage: $("intro_demarrage").checked,
        });
        const ok = Reglages.enregistrer();
        Sons.appliquerVolume();
        remplir();
        message(ok ? "Paramètres enregistrés ✓" : "Impossible d'enregistrer (stockage du navigateur bloqué).", !ok);
    });

    $("btn-defaut").addEventListener("click", () => {
        Reglages.parDefaut();
        Sons.appliquerVolume();
        remplir();
        message("Valeurs par défaut rétablies — cliquez sur « Enregistrer » pour les garder.");
    });

    $("btn-stats0").addEventListener("click", () => {
        if (window.confirm("Remettre toutes les statistiques à zéro ?")) {
            Reglages.reinitialiserStats();
            majStats();
            message("Statistiques remises à zéro.");
        }
    });

    // Annuler : on rétablit les réglages enregistrés (volume d'aperçu compris)
    $("btn-annuler").addEventListener("click", () => {
        Reglages.charger();
        Reglages.get().volume = Reglages.get().volume;
        Sons.appliquerVolume();
    });

    remplir();
    void volumeInitial;
})();
