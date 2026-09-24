// ==UserScript==
// @name         Chat Translator & Anti-Toxicity
// @description  Translate chat messages to UwU or auto-censor insults into polite phrases with a footer toggle button.
// @version      1.1
// @author       Antigravity
// ==/UserScript==

(function () {
    'use strict';

    // Persist mode using localStorage
    let currentMode = localStorage.getItem('chat-translator-mode') || 'off';

    const INSULTS_MAP = {
        "fdp": "aimable partenaire",
        "fils de pute": "fils d'une charmante dame",
        "ntm": "gros bisous à ta maman",
        "nique ta mere": "respecte ta maman",
        "nique ta maman": "respecte ta maman",
        "nique": "câline",
        "connard": "gentil compagnon",
        "connards": "gentils compagnons",
        "connasse": "personne fort sympathique",
        "con": "champion",
        "cons": "champions",
        "conne": "championne",
        "merde": "purée",
        "chier": "embêter",
        "noob": "joueur en plein apprentissage",
        "noobs": "joueurs en plein apprentissage",
        "trash": "futur talent",
        "useless": "plein de potentiel caché",
        "cancer": "petit rayon de soleil",
        "kys": "passe une excellente journée remplie de bonheur",
        "kms": "je t'adore",
        "diff": "très beau match équilibré",
        "ez": "bien joué, c'était un match très serré et agréable !",
        "easy": "très belle partie de votre part !",
        "tg": "s'il te plaît, écoute-moi attentivement",
        "ta gueule": "silence apaisant s'il vous plaît",
        "debile": "génie incompris",
        "idiot": "poète",
        "mongol": "personne extraordinaire",
        "pute": "gentille dame",
        "salope": "personne adorable",
        "worse": "meilleur",
        "worst": "assez original",
        "retard": "personne un peu distraite",
        "boosted": "très motivé",
        "tocard": "champion",
        "salop": "gentil garçon",
        "encule": "bisous à toi",
        "enculé": "bisous à toi",
        "pd": "mon cher ami",
        "gros porc": "gentil panda",
        "imbecile": "penseur créatif"
    };

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function replaceWord(text, searchWord, replacement) {
        const pattern = new RegExp('(?<=^|[^a-zA-Z0-9àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ])' + escapeRegExp(searchWord) + '(?=$|[^a-zA-Z0-9àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ])', 'gi');
        return text.replace(pattern, replacement);
    }

    function cleanMessage(text) {
        let result = text;
        const keys = Object.keys(INSULTS_MAP).sort((a, b) => b.length - a.length);
        for (const insult of keys) {
            result = replaceWord(result, insult, INSULTS_MAP[insult]);
        }
        return result;
    }

    function uwuMessage(text) {
        let uwuified = text
            .replace(/[rl]/g, 'w')
            .replace(/[RL]/g, 'W');
        
        uwuified = uwuified.split(' ').map(word => {
            if (word.length >= 3 && /^[a-zA-Z]/.test(word) && Math.random() < 0.15) {
                return `${word[0]}-${word}`;
            }
            return word;
        }).join(' ');

        uwuified = uwuified
            .replace(/!+/g, ' >w<!')
            .replace(/\?+/g, ' owo?');

        const suffixes = [" uwu", " owo", " nya~", " :3", " >w<", " ^-^", " rawr~"];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        uwuified += suffix;

        return uwuified;
    }

    function translateText(text) {
        if (currentMode === 'clean') {
            return cleanMessage(text);
        } else if (currentMode === 'uwu') {
            return uwuMessage(cleanMessage(text));
        }
        return text;
    }

    function sendToast(title, message) {
        fetch('/lol-notifications/v1/notifications', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                backgroundUrl: '',
                created: '',
                critical: false,
                data: {},
                detailKey: message,
                dismissible: true,
                expires: '',
                iconUrl: '/lol-game-data/assets/v1/profile-icons/29.jpg',
                id: Math.floor(Math.random() * 1000000),
                source: 'ChatTranslator',
                state: 'Toast',
                titleKey: title,
                type: 'toast'
            })
        }).catch(err => console.error('[ChatTranslator] Toast error:', err));
    }

    function handleCommand(mode) {
        const validModes = ['clean', 'gentil', 'uwu', 'off'];
        if (validModes.includes(mode)) {
            let targetMode = mode;
            if (mode === 'gentil') targetMode = 'clean';
            
            currentMode = targetMode;
            localStorage.setItem('chat-translator-mode', targetMode);
            
            let message = '';
            if (targetMode === 'clean') {
                message = 'Mode Anti-Toxicité activé ! 😇';
            } else if (targetMode === 'uwu') {
                message = 'Mode UwU mignon activé ! >w<';
            } else {
                message = 'Filtre de chat désactivé.';
            }
            sendToast('Traducteur de Chat', message);
            updateButtonUI();
            return true;
        } else {
            sendToast('Traducteur de Chat', 'Mode inconnu. Modes dispos : clean, uwu, off');
            return false;
        }
    }

    // --- BUTTON UI INTEGRATION ---
    
    // Inject Custom Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #chatTranslatorButton {
            height: 30px;
            padding: 0 12px;
            font-size: 12px;
            font-family: var(--font-body), sans-serif;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #cdbe91;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #785a28;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease-in-out;
        }
        #chatTranslatorButton:hover {
            color: #f0e6d2;
            background: rgba(120, 90, 40, 0.2);
            border-color: #c8aa6e;
            box-shadow: 0 0 8px rgba(200, 170, 110, 0.4);
        }
        #chatTranslatorButton.mode-clean {
            color: #00ffcc;
            border-color: #00b386;
        }
        #chatTranslatorButton.mode-clean:hover {
            background: rgba(0, 255, 204, 0.1);
            border-color: #00ffcc;
            box-shadow: 0 0 8px rgba(0, 255, 204, 0.4);
        }
        #chatTranslatorButton.mode-uwu {
            color: #ff88ff;
            border-color: #cc66cc;
        }
        #chatTranslatorButton.mode-uwu:hover {
            background: rgba(255, 136, 255, 0.1);
            border-color: #ff88ff;
            box-shadow: 0 0 8px rgba(255, 136, 255, 0.4);
        }
    `;
    document.head.appendChild(style);

    window.cycleChatTranslatorMode = function () {
        let nextMode = 'off';
        if (currentMode === 'off') {
            nextMode = 'clean';
        } else if (currentMode === 'clean') {
            nextMode = 'uwu';
        } else {
            nextMode = 'off';
        }
        handleCommand(nextMode);
    };

    function updateButtonUI() {
        const btn = document.getElementById('chatTranslatorButton');
        if (!btn) return;
        
        btn.className = ''; // reset classes
        
        if (currentMode === 'clean') {
            btn.textContent = 'Chat: Clean 😇';
            btn.classList.add('mode-clean');
        } else if (currentMode === 'uwu') {
            btn.textContent = 'Chat: UwU >w<';
            btn.classList.add('mode-uwu');
        } else {
            btn.textContent = 'Chat: Off 💬';
        }
    }

    function injectButton() {
        const container = document.querySelector(".v2-footer-notifications.ember-view");
        if (container && !document.getElementById("chatTranslatorButton")) {
            let btnContainer = document.querySelector(".cs-buttons-container");
            if (!btnContainer) {
                btnContainer = document.createElement("div");
                btnContainer.className = "cs-buttons-container";
                container.appendChild(btnContainer);
            }
            
            const btn = document.createElement("button");
            btn.id = "chatTranslatorButton";
            btn.setAttribute("onclick", "window.cycleChatTranslatorMode()");
            btnContainer.appendChild(btn);
            updateButtonUI();
        }
    }

    // Keep checking to handle view changes
    setInterval(injectButton, 1000);

    // --- NETWORK HOOKS ---

    // Intercept Fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        let url = typeof input === 'string' ? input : input.url;
        if (url && url.includes('/lol-chat/v1/conversations/') && url.includes('/messages') && init && init.body) {
            try {
                const data = JSON.parse(init.body);
                if (data.body) {
                    const trimmed = data.body.trim();
                    if (trimmed.startsWith('/translator ')) {
                        const mode = trimmed.replace('/translator ', '').trim().toLowerCase();
                        handleCommand(mode);
                        return new Response(JSON.stringify({ id: "command", body: "Mode changed" }), { status: 200 });
                    }
                    
                    const newText = translateText(data.body);
                    if (newText !== data.body) {
                        data.body = newText;
                        init.body = JSON.stringify(data);
                    }
                }
            } catch (e) {
                console.error('[ChatTranslator] Fetch intercept error:', e);
            }
        }
        return originalFetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest requests
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
        if (body && typeof body === 'string') {
            const url = this._url || '';
            if (url.includes('/lol-chat/v1/conversations/') && url.includes('/messages')) {
                try {
                    const data = JSON.parse(body);
                    if (data.body) {
                        const trimmed = data.body.trim();
                        if (trimmed.startsWith('/translator ')) {
                            const mode = trimmed.replace('/translator ', '').trim().toLowerCase();
                            handleCommand(mode);
                            
                            Object.defineProperty(this, 'readyState', { writable: true, value: 4 });
                            Object.defineProperty(this, 'status', { writable: true, value: 200 });
                            Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify({ id: "command", body: "Mode changed" }) });
                            if (this.onreadystatechange) this.onreadystatechange();
                            if (this.onload) this.onload();
                            return;
                        }
                        
                        const newText = translateText(data.body);
                        if (newText !== data.body) {
                            data.body = newText;
                            body = JSON.stringify(data);
                        }
                    }
                } catch (e) {
                    console.error('[ChatTranslator] XHR intercept error:', e);
                }
            }
        }
        return originalSend.call(this, body);
    };

    console.log('[ChatTranslator] Script loaded. Current mode: ' + currentMode);
})();
