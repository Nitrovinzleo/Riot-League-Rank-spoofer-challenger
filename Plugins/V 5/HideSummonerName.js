(function () {

function patchLobby() {
    try {
        // Masquer les noms des joueurs
        const names = document.querySelectorAll(".player-name__game-name");
        names.forEach(el => {
            if (el && el.textContent) {
                el.textContent = "Player";
            }
        });

        // Masquer les noms dans player-name-wrapper
        const playerWrappers = document.querySelectorAll(".player-name-wrapper");
        playerWrappers.forEach(el => {
            if (el && el.textContent) {
                el.textContent = "Player";
            }
        });

        // Masquer les rangs
        const ranks = document.querySelectorAll(".custom-member-info-ranked-tier");
        ranks.forEach(el => {
            if (el && el.textContent) {
                el.textContent = "Grand maitre";
            }
        });

        // Masquer les victoires
        const wins = document.querySelectorAll(".custom-member-info-ranked-wins");
        wins.forEach(el => {
            if (el && el.textContent) {
                el.textContent = "V : 105 (Classé)";
            }
        });

    } catch (error) {
        console.error('HideSummonerName: Error in patchLobby', error);
    }
}

function patchSocialChat() {
    try {
        // Masquer les Riot IDs dans la fenêtre de chat social
        const conversations = document.querySelectorAll(".conversation[data-id]");
        conversations.forEach(el => {
            if (el && el.getAttribute("data-id")) {
                el.setAttribute("data-id", "player");
            }
        });
    } catch (error) {
        console.error('HideSummonerName: Error in patchSocialChat', error);
    }
}

function startObserver() {
    try {
        const observer = new MutationObserver((mutations) => {
            let shouldPatch = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.querySelector && (
                                node.querySelector(".player-name__game-name") ||
                                node.querySelector(".player-name-wrapper") ||
                                node.querySelector(".custom-member-info-ranked-tier") ||
                                node.querySelector(".custom-member-info-ranked-wins")
                            )) {
                                shouldPatch = true;
                            }
                            // Vérifier les conversations de chat social
                            if (node.matches && node.matches(".conversation[data-id]")) {
                                shouldPatch = true;
                            }
                            if (node.querySelector && node.querySelector(".conversation[data-id]")) {
                                shouldPatch = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldPatch) {
                patchLobby();
                patchSocialChat();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        patchLobby();
        patchSocialChat();

    } catch (error) {
        console.error('HideSummonerName: Error in startObserver', error);
    }
}

if (document.readyState === "complete") {
    startObserver();
} else {
    window.addEventListener("load", startObserver);
}

})();
