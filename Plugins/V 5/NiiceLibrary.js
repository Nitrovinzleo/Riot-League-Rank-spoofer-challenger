/**
 * @param {string} url
 */
function AddStylesheet(url) {
    let style = document.createElement('link');
    style.href = url;
    style.type = 'text/css';
    style.rel = 'stylesheet';

    document.body.append(style);
}

/**
 * @param {string} endpoint
 * @param {(this:WebSocket, ev: MessageEvent) => *} callback
 */
function SubscribeEndpoint(endpoint, callback) {
    const uri = document.querySelector('link[rel="riot:plugins:websocket"]').href
    const ws = new WebSocket(uri, 'wamp')

    ws.onopen = () => ws.send(JSON.stringify([5, 'OnJsonApiEvent' + endpoint.replace(/\//g, '_')]))
    ws.onmessage = callback
}

/**
 * @param {Element} parent
 * @param {string} tag
 * @param {Array} params
 * @param {Array} classes
 * @param {?string} content
 * @return HTMLElement
 */
function AddElement(parent, tag, params = [], classes = [], content = null) {
    let element = document.createElement(tag);

    params.forEach(param => element.setAttribute(param.name, param.value));
    classes.forEach(className => element.classList.add(className));

    if (content) element.innerHTML = content;

    parent.append(element);

    return element;
}

/**
 * @return Object
 */
async function GetLoot() {
    let loot = {
        championShards: [],
        championSkinShards: [],
        shopTokens: [],
        chests: [],
        blueEssence: 0
    };

    await fetch("/lol-loot/v1/player-loot-map")
        .then(response => response.json())
        .then(data => {
            // console.log(data);

            Object.entries(data).forEach(item => {
                const [key, value] = item;

                if (value.lootId === "CURRENCY_champion")
                    loot.blueEssence = value.count;

                if (value.redeemableStatus !== "CHAMPION_NOT_OWNED" || value.upgradeEssenceValue !== 0) {
                    if (value.lootId.includes("CHEST") && value.localizedName !== "") {
                        loot.chests.push({
                            name: value.localizedName,
                            id: value.lootId,
                            data: value
                        });
                    }

                    if (value.localizedRecipeTitle.includes("Shop")) {
                        loot.shopTokens.push({
                            name: value.localizedName,
                            id: value.lootId,
                            data: value
                        });
                    }

                    for (let i = 0; i < value.count; i++) {
                        switch (value.displayCategories) {
                            case "CHAMPION":
                                loot.championShards.push({
                                    name: value.itemDesc,
                                    id: value.lootId,
                                    data: value
                                });
                                break;
                            case "SKIN":
                                loot.championSkinShards.push({
                                    name: value.itemDesc,
                                    id: value.lootId,
                                    data: value
                                });
                                break;
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error(error);
        });

    return loot;
}

/**
 * @param {Array} items
 * @param {string} prop
 * @param {string} propMultiply
 * @return {number}
 */
function Sum(items, prop, propMultiply) {
    return items.reduce(function (a, b) {
        let sum = 0;

        if (propMultiply != null)
            sum = a + prop.split('.').reduce((x, c) => x[c], b) * propMultiply.split('.').reduce((x, c) => x[c], b);
        else
            sum = a + prop.split('.').reduce((x, c) => x[c], b);

        return sum;
    }, 0);
}

export default {
    AddStylesheet: AddStylesheet,
    SubscribeEndpoint: SubscribeEndpoint,
    AddElement: AddElement,
    GetLoot: GetLoot,
    Sum: Sum
}