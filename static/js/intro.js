/* Vidéo d'introduction : à la fin, on affiche l'image de fond du jeu. */
(function () {
    "use strict";

    const video = document.getElementById("video");
    const imageFin = document.getElementById("image-fin");
    const btnLancer = document.getElementById("btn-lancer");
    const btnRevoir = document.getElementById("btn-revoir");

    function lire() {
        imageFin.hidden = true;
        video.hidden = false;
        btnLancer.hidden = true;
        video.muted = false;
        video.volume = Reglages.get().volume / 100;
        video.currentTime = 0;
        const p = video.play();
        if (p && p.catch) {
            p.catch(() => {
                // lecture automatique avec son bloquée par le navigateur : on demande un clic
                btnLancer.hidden = false;
            });
        }
    }

    function fin() {
        video.hidden = true;
        imageFin.hidden = false;
        btnLancer.hidden = true;
    }

    video.addEventListener("ended", fin);
    video.addEventListener("error", fin);                     // vidéo illisible : on montre l'image
    btnLancer.addEventListener("click", lire);
    btnRevoir.addEventListener("click", lire);

    lire();
})();
