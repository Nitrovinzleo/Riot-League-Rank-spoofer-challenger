//"PUUID (FOUND BY CTRL+MAJ+I ON YOUR/THE PERSON'S PROFILE -> CTRL+F -> type 'PUUID'. IF NOT YOUR PROFILE SEARCH FOR THE ONE WHERE 'is-searched' IS FALSE": 
//'BANNER LINK (CAN BE FOUND ON COMUNITYDRAGON) THE RANK OF THE BANNER CHANGES YOUR LAST SEASON RANK (MIGHT BE PROBLEMATIC WITH NON RANKED BANNERS : USE RANKEDLOBBY.JS)'



(function () {
  const PLAYERS_CONFIG = {
    // exemple of working profile
    "f8cfb78f-66e6-5401-a710-02f1491b4c42": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 327,
      lp: 2467,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    },
    "6c1fec8c-6741-5448-a1fa-5b9fc0afa6b4": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 370,
      lp: 2180,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    },
    "debc3389-debb-5e47-a71d-edd8341e8dfd": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 591,
      lp: 2325,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/GRANDMASTER.png'
    },
    "ab2e4ff0-2779-5927-bac6-484366be98bb": {
      tier: 'Grandmaster',
      div: " ",
      text: 'Grandmaster',
      wins: 240,
      lp: 1917,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/GRANDMASTER.png'
    }
  };

  // Petite fonction pour extraire "MASTER" de ".../MASTER.png"
  function getTierFromBanner(url) {
    if (!url) return 'CHALLENGER';
    const parts = url.split('/');
    const filename = parts[parts.length - 1]; // "CHALLENGER.png"
    return filename.split('.')[0].toUpperCase(); // "CHALLENGER"
  }

  // === HOOK API LCU FETCH (Interception multilingue native) ===
  const originalFetch = window.fetch;
  if (originalFetch && !window._rankModifHooked) {
    window._rankModifHooked = true;
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

            // 1. Update Solo/Duo entry in queueMap (Laisse les autres queues intactes)
            if (data.queueMap && data.queueMap.RANKED_SOLO_5x5) {
              const solo = data.queueMap.RANKED_SOLO_5x5;
              solo.tier = tierUpper;
              solo.division = conf.div ? conf.div.trim() : "NA";
              solo.leaguePoints = conf.lp;
              solo.wins = conf.wins;
              solo.isHighestRankedEntry = true;
            }

            // 2. Update Solo/Duo dans l'array queues (Laisse Flex, TFT, etc. par défaut)
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

            // 3. Update highestRankedEntry (pour que le crest principal affiche Challenger)
            if (data.highestRankedEntry) {
              data.highestRankedEntry.queueType = "RANKED_SOLO_5x5";
              data.highestRankedEntry.tier = tierUpper;
              data.highestRankedEntry.division = conf.div ? conf.div.trim() : "NA";
              data.highestRankedEntry.leaguePoints = conf.lp;
              data.highestRankedEntry.wins = conf.wins;
            }

            // 4. Update Last Season rank
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
          // Si erreur de parsing, retourner la réponse originale
        }
      }
      return response;
    };
  }

  // Cache pour les sélecteurs et éléments
  const SELECTORS = {
    profile: [
      '.style-profile-emblem-wrapper',
      '.profile-emblem-wrapper',
      '.ranked-emblem-wrapper',
      '[class*="profile-emblem"]',
      '[class*="ranked-emblem"]'
    ],
    title: [
      '.style-profile-emblem-header-title',
      '.profile-emblem-header-title',
      '.ranked-emblem-header-title',
      '[class*="header-title"]',
      'div[class*="title"]'
    ],
    subtitle: [
      '.style-profile-emblem-header-subtitle',
      '.profile-emblem-header-subtitle',
      '.ranked-emblem-header-subtitle',
      '[class*="header-subtitle"]',
      'div[class*="subtitle"]'
    ],
    emblem: [
      'lol-regalia-emblem-element',
      '.regalia-emblem-element',
      '[class*="emblem-element"]'
    ]
  };

  // Throttling pour éviter les exécutions trop fréquentes
  let isThrottled = false;
  function throttle(func, delay) {
    return function () {
      if (isThrottled) return;
      isThrottled = true;
      func.apply(this, arguments);
      setTimeout(() => { isThrottled = false; }, delay);
    };
  }

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
    let auth = null, foreign = false;
    for (let p of profiles) {
      const puuid = p.getAttribute('puuid');
      if (puuid && PLAYERS_CONFIG[puuid]) return PLAYERS_CONFIG[puuid];
      if (p.getAttribute('is-searched') === 'false') {
        auth = (puuid && PLAYERS_CONFIG[puuid]) || PLAYERS_CONFIG["ab2e4ff0-2779-5927-bac6-484366be98bb"] || Object.values(PLAYERS_CONFIG)[0];
      } else if (p.getAttribute('is-searched') === 'true') {
        foreign = true;
      }
    }
    if (foreign) return null;
    return auth || PLAYERS_CONFIG["ab2e4ff0-2779-5927-bac6-484366be98bb"] || Object.values(PLAYERS_CONFIG)[0] || null;
  }

  // === PATCH PROFIL (hors-tooltip) AVEC LOGIQUE PUUID + SHADOW DOM ===
  function patchProfileBanner(root = document) {
    const possibleSelectors = [
      '.style-profile-emblem-wrapper',
      '.profile-emblem-wrapper',
      '.ranked-emblem-wrapper',
      'lol-regalia-profile-v2-element',
      '[class*="profile-emblem"]',
      '[class*="ranked-emblem"]'
    ];

    let foundElements = [];
    possibleSelectors.forEach(selector => {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) {
        foundElements = foundElements.concat(Array.from(elements));
      }
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

      // Filtrage strict : Ne patcher que si le titre est Solo Q (Ignorer Flex/TFT/etc.)
      if (title) {
        const titleText = title.textContent.trim().toLowerCase();
        const isFlexOrOther = titleText.includes('flex') || titleText.includes('자유') || titleText.includes('tft') || titleText.includes('전략적');
        if (isFlexOrOther) return;

        const isSolo = titleText.includes('solo') ||
                       titleText.includes('개인') ||
                       titleText.includes('솔로') ||
                       titleText.includes('2인') ||
                       titleText.length === 0;
        if (!isSolo) return;
      }

      // 1. Mettre à jour le texte du rang avec la config du joueur
      if (subtitle && wrapperConfig.text) {
        subtitle.textContent = wrapperConfig.text;
      }

      // 2. Mettre à jour l'emblème avec la config du joueur
      if (emblem) {
        const tierUpper = wrapperConfig.tier.toUpperCase();
        emblem.setAttribute('ranked-tier', tierUpper);
        emblem.setAttribute('ranked-division', wrapperConfig.div || " ");
        emblem.setAttribute('crest-type', 'ranked');
        emblem.setAttribute('crystal-level', 'DIAMOND');
        emblem.setAttribute('prestige-crest-id', '23');
        emblem.setAttribute('ranked-split-reward', '0');
        emblem.setAttribute('crest-sizing', 'huge');
        emblem.setAttribute('animations', 'true');

        const shadowEl = emblem.shadowRoot?.querySelector('.regalia-emblem');
        if (shadowEl) {
          shadowEl.setAttribute('ranked-tier', wrapperConfig.tier.toLowerCase());
        }
      }
    });
  }

  // === PATCH TOOLTIP SOLO/DUO + LAST SEASON AVEC LOGIQUE PUUID + SHADOW DOM ===
  function patchTooltipQueues(root = document) {
    const tooltipSelectors = [
      '.profile-ranked-emblem-tooltip-container',
      '.ranked-emblem-tooltip-container',
      '.tooltip-container',
      '[class*="tooltip-container"]',
      '[class*="ranked-tooltip"]'
    ];

    let tooltipContainers = [];
    tooltipSelectors.forEach(selector => {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) {
        tooltipContainers = tooltipContainers.concat(Array.from(elements));
      }
    });

    tooltipContainers.forEach(container => {
      const queueSelectors = [
        '.ranked-tooltip-queue',
        '.ranked-tooltip-last-season',
        '.tooltip-queue',
        '[class*="tooltip-queue"]',
        '[class*="ranked-queue"]',
        '[class*="last-season"]',
        '[class*="lastseason"]'
      ];

      let queueBlocks = [];
      queueSelectors.forEach(selector => {
        const elements = container.querySelectorAll(selector);
        if (elements.length > 0) {
          queueBlocks = queueBlocks.concat(Array.from(elements));
        }
      });

      // Dédupliquer les blocs de queues
      queueBlocks = Array.from(new Set(queueBlocks));

      queueBlocks.forEach(queue => {
        const queueConfig = getContextConf(queue) || getPageAuth();
        if (!queueConfig) return;

        const nameSelectors = [
          '.ranked-tooltip-queue-name',
          '.ranked-tooltip-last-season-queue-name',
          '.tooltip-queue-name',
          '[class*="queue-name"]',
          '[class*="tooltip-name"]',
          '.title',
          '[class*="title"]'
        ];

        let queueName = null;
        for (const selector of nameSelectors) {
          const el = queue.querySelector(selector);
          if (el && el.textContent.trim()) {
            queueName = el.textContent.trim();
            break;
          }
        }

        const qLower = queueName ? queueName.toLowerCase() : '';
        const qRaw = queueName || '';

        // Détection stricte de Solo/Duo (exclut explicitement Flex / 자유)
        const isSoloDuo = (qLower.includes('solo') ||
                           qRaw.includes('개인/2인') ||
                           qRaw.includes('개인 랭크') ||
                           qRaw.includes('솔로') ||
                           (qRaw.includes('개인') && !qRaw.includes('자유'))) &&
                          !qLower.includes('flex') && !qRaw.includes('자유');

        // Détection stricte de Last Season
        const isLastSeason = qLower.includes('last') ||
                             qLower.includes('saison préc') ||
                             qLower.includes('previous') ||
                             qRaw.includes('지난 시즌') ||
                             qRaw.includes('지난시즌');

        // REGLE IMPORTANTE : Si ce n'est NI Solo/Duo NI Last Season (ex: Flex 5v5, TFT, Arena), NE PAS TOUCHER !
        if (!isSoloDuo && !isLastSeason) return;

        const data = isSoloDuo ? queueConfig : {
          tier: getTierFromBanner(queueConfig.banner),
          tierText: getTierFromBanner(queueConfig.banner)
        };

        // 1. Modifier l'emblème (Solo/Duo et Last Season uniquement)
        const emblemSelectors = [
          'lol-regalia-emblem-element',
          '.regalia-emblem-element',
          '[class*="emblem-element"]'
        ];

        let emblemElement = null;
        for (const selector of emblemSelectors) {
          emblemElement = queue.querySelector(selector);
          if (emblemElement) break;
        }

        if (emblemElement) {
          const tU = data.tier.toUpperCase();
          emblemElement.setAttribute('ranked-tier', tU);
          const shadowEl = emblemElement.shadowRoot?.querySelector('.regalia-emblem');
          if (shadowEl) {
            shadowEl.setAttribute('ranked-tier', data.tier.toLowerCase());
          }
        }

        // 2. Texte du rang (Solo/Duo et Last Season uniquement)
        const tierSelectors = [
          '.ranked-tooltip-queue-tier',
          '.ranked-tooltip-last-season-queue-tier',
          '.tooltip-tier',
          '[class*="tooltip-tier"]',
          '[class*="queue-tier"]'
        ];

        let tierTextEl = null;
        for (const selector of tierSelectors) {
          tierTextEl = queue.querySelector(selector);
          if (tierTextEl) break;
        }

        if (tierTextEl) {
          const tierText = data.tierText || data.tier || queueConfig.tier;
          if (tierText) {
            tierTextEl.textContent = tierText;
          }
        }

        // 3. LP/Victoires (Uniquement pour Solo/Duo actuel)
        if (isSoloDuo) {
          const lpSelectors = [
            '.style-profile-ranked-crest-tooltip-lp',
            '.ranked-crest-tooltip-lp',
            '.tooltip-lp',
            '[class*="tooltip-lp"]'
          ];

          let lpBlock = null;
          for (const selector of lpSelectors) {
            lpBlock = queue.querySelector(selector);
            if (lpBlock) break;
          }

          const isKoreanUnit = queue.textContent.includes('승') || document.documentElement.lang === 'ko' || document.body.textContent.includes('개인') || document.body.textContent.includes('랭크');
          const winsUnit = isKoreanUnit ? '승' : 'Wins';
          const html = `<span>${queueConfig.wins}</span> ${winsUnit} | <span>${queueConfig.lp}</span> LP`;

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

  // === PATCH BANNIÈRES ET CREST ===
  function patchBannersAndCrests(root = document) {
    root.querySelectorAll('lol-regalia-crest-v2-element, img.regalia-banner-asset-static-image').forEach(el => {
      const c = getContextConf(el);
      if (c) {
        if (el.tagName === 'IMG') {
          if (!el.src.includes(c.tier.toLowerCase())) el.src = c.banner;
        } else {
          const tU = c.tier.toUpperCase();
          if (el.getAttribute('ranked-tier') !== tU) {
            el.setAttribute('ranked-tier', tU);
            el.setAttribute('ranked-division', c.div || " ");
            el.setAttribute('crest-type', 'ranked');
            el.setAttribute('crystal-level', 'DIAMOND');
            el.setAttribute('prestige-crest-id', '23');
            el.setAttribute('ranked-split-reward', '0');
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

    // 1. BANNIÈRES ET CREST
    patchBannersAndCrests(root);

    // 2. PATCH PROFIL ET TOOLTIPS (en transmettant la racine Shadow DOM)
    patchProfileBanner(root);
    patchTooltipQueues(root);

    // 3. RÉCURSION DANS LES SHADOW ROOTS
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

  // === OBSERVER + INTERVAL AMÉLIORÉ ===
  const observer = new MutationObserver(() => {
    patch(document);
  });

  function initializePatching() {
    observer.observe(document.body, { childList: true, subtree: true });

    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
      patch(document);
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 300);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePatching);
  } else {
    initializePatching();
  }

  // Fallback sur window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      patch(document);
    }, 1000);
  });

  // Intervalle régulier throttlé
  const throttledPatch = throttle(() => patch(document), 200);
  setInterval(throttledPatch, 200);
})();
