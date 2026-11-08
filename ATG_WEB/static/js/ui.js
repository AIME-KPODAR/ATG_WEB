/* Éléments communs : menu latéral, indication du menu, son de clic. */
(function () {
    "use strict";

    const menu = document.getElementById("menu");
    const voile = document.getElementById("voile");
    const bouton = document.getElementById("btn-menu");
    const fermer = document.getElementById("btn-fermer-menu");
    const bulle = document.getElementById("indication-menu");

    function ouvrir() {
        menu.classList.add("ouvert");
        menu.setAttribute("aria-hidden", "false");
        bouton.setAttribute("aria-expanded", "true");
        voile.hidden = false;
        cacherIndication();
        const premier = menu.querySelector(".menu-lien");
        if (premier) premier.focus({ preventScroll: true });
    }

    function fermerMenu() {
        menu.classList.remove("ouvert");
        menu.setAttribute("aria-hidden", "true");
        bouton.setAttribute("aria-expanded", "false");
        voile.hidden = true;
    }

    const basculer = () => (menu.classList.contains("ouvert") ? fermerMenu() : ouvrir());
    bouton.addEventListener("click", basculer);
    fermer.addEventListener("click", fermerMenu);
    voile.addEventListener("click", fermerMenu);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("ouvert")) { fermerMenu(); e.stopPropagation(); }
    }, true);

    /* ---- indication « cliquez sur le menu » (page d'accueil) : bulle + bouton qui clignote */
    let minuterie = null;
    function cacherIndication() {
        if (!bulle) return;
        bulle.hidden = true;
        bouton.classList.remove("clignote");
        clearInterval(minuterie);
        try { sessionStorage.setItem("atg_menu_vu", "1"); } catch (e) { /* ignoré */ }
    }
    if (bulle) {
        let vu = false;
        try { vu = sessionStorage.getItem("atg_menu_vu") === "1"; } catch (e) { /* ignoré */ }
        if (!vu) {
            bulle.hidden = false;
            bulle.addEventListener("click", ouvrir);
            minuterie = setInterval(() => bouton.classList.toggle("clignote"), 500);
        }
    }

    /* ---- son de clic à CHAQUE clic gauche / toucher, et déblocage de l'audio */
    document.addEventListener("pointerdown", (e) => {
        if (e.button !== undefined && e.button > 0) return;
        Sons.debloquer();
        Sons.jouer("clic");
    }, true);
    document.addEventListener("keydown", () => Sons.debloquer(), true);
})();
