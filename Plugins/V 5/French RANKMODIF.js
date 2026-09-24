//"PUUID (TROUVÉ VIA CTRL+MAJ+I SUR TON PROFIL -> CTRL+F -> taper 'PUUID')": 
//'BANNER LINK (SUR COMMUNITYDRAGON) LE RANG DE LA BANNIÈRE MODIFIE TON RANG DE LA SAISON PRÉCÉDENTE'

(function () {
  'use strict';

  // === CONFIGURATION DES JOUEURS (V5) ===
  const PLAYERS_CONFIG = {
    // Exemple de profil configuré (remplace la clé par ton PUUID)
    "f8cfb78f-66e6-5401-a710-02f1491b4c42": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 327,
      lp: 1468,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    },
    "6c1fec8c-6741-5448-a1fa-5b9fc0afa6b4": {
      tier: 'GRANDMASTER',
      div: " ",
      text: 'GRANDMASTER',
      wins: 320,
      lp: 621,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    },
    "debc3389-debb-5e47-a71d-edd8341e8dfd": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 591,
      lp: 2325,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    }
  };

  function getTierFromBanner(url) {
    if (!url) return 'CHALLENGER';
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0].toUpperCase();
  }

  // === 1. HOOK API NATIVE LCU FETCH (Interception réseau directe - NOUVEAUTÉ V5) ===
  const originalFetch = window.fetch;
  if (originalFetch && !window._rankModifHookedV5) {
    window._rankModifHookedV5 = true;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

      if (url.includes('/lol-ranked/v1/ranked-stats/') || url.includes('/lol-ranked/v1/current-ranked-stats')) {
        try {
          const clone = response.clone();
          const data = await clone.json();

          const puuid = data.puuid || (typeof url === 'string' ? url.split('/').pop() : null);
          const conf = (puuid && PLAYERS_CONFIG[puuid]) || getPageAuth();

          if (conf) {
            const tierUpper = conf.tier.toUpperCase();
            const bannerTier = getTierFromBanner(conf.banner);

            // Met à jour la Solo/Duo actuelle
            if (data.queueMap && data.queueMap.RANKED_SOLO_5x5) {
              const solo = data.queueMap.RANKED_SOLO_5x5;
              solo.tier = tierUpper;
              solo.division = conf.div ? conf.div.trim() : "NA";
              solo.leaguePoints = conf.lp;
              solo.wins = conf.wins;
              solo.isHighestRankedEntry = true;
            }

            if (Array.isArray(data.queues)) {
              for (const q of data.queues) {
                if (q.queueType === 'RANKED_SOLO_5x5') {
                  q.tier = tierUpper;
                  q.division = conf.div ? conf.div.trim() : "NA";
                  q.leaguePoints = conf.lp;
                  q.wins = conf.wins;
                  q.isHighestRankedEntry = true;
                }
              }
            }

            if (data.highestRankedEntry) {
              data.highestRankedEntry.queueType = "RANKED_SOLO_5x5";
              data.highestRankedEntry.tier = tierUpper;
              data.highestRankedEntry.division = conf.div ? conf.div.trim() : "NA";
              data.highestRankedEntry.leaguePoints = conf.lp;
              data.highestRankedEntry.wins = conf.wins;
            }

            if (data.highestPreviousSeasonEndTier !== undefined) {
              data.highestPreviousSeasonEndTier = bannerTier;
              data.highestPreviousSeasonEndDivision = "I";
            }

            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch (e) {
          // Si erreur de parsing, retourne la réponse originale
        }
      }
      return response;
    };
  }

  // === 2. DYNAMIC DOM PATCHER (PROFIL, CRESTS, TOOLTIPS, HOVERCARDS) ===
  const SELECTORS = {
    profile: ['.style-profile-emblem-wrapper', '.profile-emblem-wrapper', '.ranked-emblem-wrapper', '[class*="profile-emblem"]', '[class*="ranked-emblem"]'],
    title: ['.style-profile-emblem-header-title', '.profile-emblem-header-title', '.ranked-emblem-header-title', '[class*="header-title"]', 'div[class*="title"]'],
    subtitle: ['.style-profile-emblem-header-subtitle', '.profile-emblem-header-subtitle', '.ranked-emblem-header-subtitle', '[class*="header-subtitle"]', 'div[class*="subtitle"]'],
    emblem: ['lol-regalia-emblem-element', '.regalia-emblem-element', '[class*="emblem-element"]']
  };

  function getContextConf(el) {
    let curr = el;
    while (curr) {
      const p = curr.getAttribute?.('puuid');
      if (p && PLAYERS_CONFIG[p]) return PLAYERS_CONFIG[p];
      curr = curr.parentElement || (curr.parentNode && curr.parentNode.host);
    }
    return null;
  }

  function getPageAuth() {
    const profiles = document.querySelectorAll('lol-regalia-profile-v2-element');
    if (!profiles.length) return Object.values(PLAYERS_CONFIG)[0] || null;
    let auth = null, foreign = false;
    for (let p of profiles) {
      const puuid = p.getAttribute('puuid');
      if (puuid && PLAYERS_CONFIG[puuid]) return PLAYERS_CONFIG[puuid];
      if (p.getAttribute('is-searched') === 'false') auth = PLAYERS_CONFIG[puuid] || Object.values(PLAYERS_CONFIG)[0];
      else if (p.getAttribute('is-searched') === 'true') foreign = true;
    }
    return foreign ? null : (auth || Object.values(PLAYERS_CONFIG)[0]);
  }

  function patchProfileBanner(root = document) {
    const possibleSelectors = ['.style-profile-emblem-wrapper', '.profile-emblem-wrapper', '.ranked-emblem-wrapper', 'lol-regalia-profile-v2-element', '[class*="profile-emblem"]', '[class*="ranked-emblem"]'];
    let foundElements = [];
    possibleSelectors.forEach(selector => {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) foundElements = foundElements.concat(Array.from(elements));
    });

    foundElements.forEach(wrapper => {
      const wrapperConfig = getContextConf(wrapper) || getPageAuth();
      if (!wrapperConfig) return;

      let title = null;
      for (const selector of SELECTORS.title) {
        title = wrapper.querySelector(selector);
        if (title) break;
      }

      let subtitle = null;
      for (const selector of SELECTORS.subtitle) {
        subtitle = wrapper.querySelector(selector);
        if (subtitle) break;
      }

      let emblem = null;
      for (const selector of SELECTORS.emblem) {
        emblem = wrapper.parentElement?.querySelector(selector) || wrapper.querySelector(selector);
        if (emblem) break;
      }

      if (title) {
        const titleText = title.textContent.trim().toLowerCase();
        if (titleText.includes('flex') || titleText.includes('tft')) return;
      }

      if (subtitle && wrapperConfig.text) {
        subtitle.textContent = wrapperConfig.text;
      }

      if (emblem) {
        const tierUpper = wrapperConfig.tier.toUpperCase();
        emblem.setAttribute('ranked-tier', tierUpper);
        emblem.setAttribute('ranked-division', wrapperConfig.div);
        emblem.setAttribute('crest-type', 'ranked');
        emblem.setAttribute('crystal-level', 'DIAMOND');
        emblem.setAttribute('prestige-crest-id', '23');
        emblem.setAttribute('crest-sizing', 'huge');
        emblem.setAttribute('animations', 'true');

        const shadowEl = emblem.shadowRoot?.querySelector('.regalia-emblem');
        if (shadowEl) shadowEl.setAttribute('ranked-tier', wrapperConfig.tier.toLowerCase());
      }
    });
  }

  function patchTooltipQueues(root = document) {
    const tooltipSelectors = ['.profile-ranked-emblem-tooltip-container', '.ranked-emblem-tooltip-container', '.tooltip-container', '[class*="tooltip-container"]', '[class*="ranked-tooltip"]'];
    let tooltipContainers = [];
    tooltipSelectors.forEach(selector => {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) tooltipContainers = tooltipContainers.concat(Array.from(elements));
    });

    const allRankElements = root.querySelectorAll('[class*="ranked"], [class*="rank"], [class*="emblem"], [class*="tier"]');
    allRankElements.forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Last Season') || text.includes('SAISON') || text.includes('Season')) {
        const elementConfig = getContextConf(element) || getPageAuth();
        if (!elementConfig) return;
        const bannerTierU = getTierFromBanner(elementConfig.banner);
        const tierElements = element.querySelectorAll('[class*="tier"], div[class*="rank"]');
        tierElements.forEach(tierEl => {
          if (tierEl.textContent.trim().length > 0 && !tierEl.textContent.includes('Wins') && !tierEl.textContent.includes('LP')) {
            tierEl.textContent = bannerTierU;
          }
        });
      }
    });

    tooltipContainers.forEach(container => {
      const queueSelectors = ['.ranked-tooltip-queue', '.ranked-tooltip-last-season', '.tooltip-queue', '[class*="tooltip-queue"]', '[class*="ranked-queue"]', '[class*="last-season"]'];
      let queueBlocks = [];
      queueSelectors.forEach(selector => {
        const elements = container.querySelectorAll(selector);
        if (elements.length > 0) queueBlocks = queueBlocks.concat(Array.from(elements));
      });

      queueBlocks.forEach(queue => {
        const queueConfig = getContextConf(queue) || getPageAuth();
        if (!queueConfig) return;

        const nameSelectors = ['.ranked-tooltip-queue-name', '.ranked-tooltip-last-season-queue-name', '.tooltip-queue-name', '[class*="queue-name"]', '[class*="tooltip-name"]'];
        let queueName = null;
        for (const selector of nameSelectors) {
          queueName = queue.querySelector(selector)?.textContent?.trim();
          if (queueName) break;
        }

        const isSoloDuo = !queueName || queueName === 'Solo/Duo' || queueName === 'SOLO/DUO' || queueName.toLowerCase().includes('solo');
        const isLastSeason = queueName && (queueName.toLowerCase().includes('last') || queueName.toLowerCase().includes('saison') || queueName.toLowerCase().includes('season'));
        if (!isSoloDuo && !isLastSeason) return;

        const data = isSoloDuo ? queueConfig : {
          tier: getTierFromBanner(queueConfig.banner),
          tierText: getTierFromBanner(queueConfig.banner)
        };

        const emblemSelectors = ['lol-regalia-emblem-element[ranked-tier]', '.regalia-emblem-element', '[class*="emblem-element"]'];
        let emblemElement = null;
        for (const selector of emblemSelectors) {
          emblemElement = queue.querySelector(selector);
          if (emblemElement) break;
        }

        if (emblemElement) {
          emblemElement.setAttribute('ranked-tier', data.tier.toUpperCase());
          const shadowEl = emblemElement.shadowRoot?.querySelector('.regalia-emblem');
          if (shadowEl) shadowEl.setAttribute('ranked-tier', data.tier.toLowerCase());
        }

        const tierSelectors = ['.ranked-tooltip-queue-tier', '.ranked-tooltip-last-season-queue-tier', '.tooltip-tier', '[class*="tooltip-tier"]', '[class*="queue-tier"]', 'div[class*="tier"]', 'span[class*="tier"]'];
        let tierTextEl = null;
        for (const selector of tierSelectors) {
          tierTextEl = queue.querySelector(selector);
          if (tierTextEl) break;
        }

        if (tierTextEl) {
          const tierText = data.tierText || data.tier || queueConfig.tier;
          if (tierText) tierTextEl.textContent = tierText;
        }

        if (isSoloDuo) {
          const lpSelectors = ['.style-profile-ranked-crest-tooltip-lp', '.ranked-crest-tooltip-lp', '.tooltip-lp', '[class*="tooltip-lp"]'];
          let lpBlock = null;
          for (const selector of lpSelectors) {
            lpBlock = queue.querySelector(selector);
            if (lpBlock) break;
          }
          const html = `<span>${queueConfig.wins}</span> Wins <span>${queueConfig.lp}</span> LP`;
          if (!lpBlock) {
            lpBlock = document.createElement('div');
            lpBlock.className = 'style-profile-ranked-crest-tooltip-lp';
            lpBlock.innerHTML = html;
            if (tierTextEl && tierTextEl.parentNode) {
              tierTextEl.parentNode.insertBefore(lpBlock, tierTextEl.nextSibling);
            }
          } else {
            const spans = lpBlock.querySelectorAll('span');
            if (spans.length >= 2) {
              spans[0].textContent = queueConfig.wins;
              spans[1].textContent = queueConfig.lp;
            } else {
              lpBlock.innerHTML = html;
            }
          }
        }
      });
    });
  }

  function patchBannersAndCrests(root = document) {
    root.querySelectorAll('lol-regalia-crest-v2-element, img.regalia-banner-asset-static-image').forEach(el => {
      const c = getContextConf(el) || getPageAuth();
      if (c) {
        if (el.tagName === 'IMG') {
          if (!el.src.includes(c.tier.toLowerCase())) el.src = c.banner;
        } else {
          const tU = c.tier.toUpperCase();
          if (el.getAttribute('ranked-tier') !== tU) {
            el.setAttribute('ranked-tier', tU);
            el.setAttribute('ranked-division', c.div);
            el.setAttribute('crest-type', 'ranked');
            el.setAttribute('crystal-level', 'DIAMOND');
            el.setAttribute('prestige-crest-id', '23');
            el.setAttribute('crest-sizing', 'huge');
            el.setAttribute('animations', 'true');
          }
        }
      }
    });
  }

  function patch(root) {
    if (!root || root._isPatching) return;
    root._isPatching = true;
    patchBannersAndCrests(root);
    patchProfileBanner(root);
    patchTooltipQueues(root);

    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot && !el._patched) {
        if (el.tagName.startsWith('LOL-') || el.classList.contains('ember-view')) {
          el._patched = true;
          patch(el.shadowRoot);
          setTimeout(() => { el._patched = false; }, 50);
        }
      }
    });
    root._isPatching = false;
  }

  const observer = new MutationObserver(() => {
    patch(document);
  });

  function initializePatching() {
    observer.observe(document.body, { childList: true, subtree: true });
    patch(document);
    setInterval(() => patch(document), 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePatching);
  } else {
    initializePatching();
  }

  console.log('[RankModif V5] Version V5 initialisée avec succès !');
})();
