// "PUUID (FOUND BY CTRL+MAJ+I ON YOUR PROFILE -> CTRL+F -> type 'PUUID')"
// "RANK MODIFIER APPLIES STRICTLY TO YOU (LOGGED-IN USER), ON YOUR PROFILE AND IN LOBBY."

(function () {
  'use strict';

  const PLAYERS_CONFIG = {
    "2a9819f3-466f-508a-8b3b-65783eeb2331": {
      tier: 'Challenger',
      div: " ",
      text: 'Challenger',
      wins: 327,
      lp: 1468,
      banner: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/CHALLENGER.png'
    },
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

  let currentLocalPuuid = null;

  function extractPuuidFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const uuidMatch = url.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return uuidMatch ? uuidMatch[0] : null;
  }

  function getMyConfig() {
    if (currentLocalPuuid && PLAYERS_CONFIG[currentLocalPuuid]) {
      return PLAYERS_CONFIG[currentLocalPuuid];
    }
    return Object.values(PLAYERS_CONFIG)[0] || null;
  }

  function setAttrIfChanged(el, attr, val) {
    if (!el || val == null) return false;
    const strVal = String(val);
    if (el.getAttribute(attr) !== strVal) {
      el.setAttribute(attr, strVal);
      return true;
    }
    return false;
  }

  function setImgSrcIfChanged(img, newSrc) {
    if (!img || !newSrc) return false;
    const currentSrc = (img.getAttribute('src') || '').toLowerCase();
    const currentAbsSrc = (img.src || '').toLowerCase();
    const targetFilename = newSrc.split('/').pop().toLowerCase();

    if (!currentSrc.includes(targetFilename) && !currentAbsSrc.includes(targetFilename)) {
      img.src = newSrc;
      return true;
    }
    return false;
  }

  function setBgImageIfChanged(el, newSrc) {
    if (!el || !newSrc) return false;
    const currentStyle = (el.style.backgroundImage || '').toLowerCase();
    const targetFilename = newSrc.split('/').pop().toLowerCase();

    if (!currentStyle.includes(targetFilename)) {
      el.style.backgroundImage = `url("${newSrc}")`;
      return true;
    }
    return false;
  }

  function getTierFromBanner(url) {
    if (!url) return 'CHALLENGER';
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0].toUpperCase();
  }

  function getPageAuth() {
    const profiles = document.querySelectorAll('lol-regalia-profile-v2-element');
    if (!profiles.length) return null;
    let auth = null, foreign = false;
    for (let p of profiles) {
      const puuid = p.getAttribute('puuid');
      const isSearched = p.getAttribute('is-searched');
      if (puuid && PLAYERS_CONFIG[puuid]) {
        auth = PLAYERS_CONFIG[puuid];
      } else if (puuid && currentLocalPuuid && puuid === currentLocalPuuid) {
        auth = getMyConfig();
      } else if (isSearched === 'false' && currentLocalPuuid) {
        auth = getMyConfig();
      } else if (isSearched === 'true' || (puuid && puuid !== currentLocalPuuid && !PLAYERS_CONFIG[puuid])) {
        foreign = true;
      }
    }
    return foreign ? null : auth;
  }

  function isEmptyLobbySlot(el) {
    if (!el) return false;

    let checkSelf = el;
    while (checkSelf) {
      const mt = checkSelf.getAttribute?.('member-type');
      if (mt === 'current-player' || mt === 'local-player') {
        return false;
      }
      const p = checkSelf.getAttribute?.('puuid') || checkSelf.getAttribute?.('data-puuid');
      if (p && (p === currentLocalPuuid || PLAYERS_CONFIG[p])) {
        return false;
      }
      checkSelf = checkSelf.parentElement || checkSelf.host || (checkSelf.parentNode && checkSelf.parentNode.host);
    }

    let curr = el;
    while (curr) {
      if (curr.getAttribute) {
        const mt = curr.getAttribute('member-type');
        if (mt === 'open' || mt === 'invite' || mt === 'empty') {
          return true;
        }
        if (curr.getAttribute('is-empty') === 'true' ||
            curr.getAttribute('empty') === 'true' ||
            curr.getAttribute('is-open') === 'true' ||
            curr.getAttribute('is-invite-slot') === 'true' ||
            curr.getAttribute('is-open-slot') === 'true') {
          return true;
        }
      }
      if (curr.classList) {
        if (curr.classList.contains('party-member-empty') ||
            curr.classList.contains('open-slot') ||
            curr.classList.contains('invite-button-container') ||
            curr.classList.contains('empty-slot') ||
            curr.classList.contains('invite-button')) {
          return true;
        }
      }
      curr = curr.parentElement || curr.host || (curr.parentNode && curr.parentNode.host);
    }
    return false;
  }

  function isNonSoloQQueue(el) {
    if (!el) return false;

    let checkCurr = el;
    while (checkCurr) {
      if (checkCurr.className && typeof checkCurr.className === 'string') {
        const cls = checkCurr.className.toLowerCase();
        if (cls.includes('mastery') || cls.includes('top-champion') || cls.includes('highest-champion')) {
          return true;
        }
      }
      checkCurr = checkCurr.parentElement || checkCurr.host || (checkCurr.parentNode && checkCurr.parentNode.host);
    }

    const tag = el.tagName || '';
    if (tag === 'LOL-REGALIA-PROFILE-V2-ELEMENT' ||
        tag === 'LOL-REGALIA-BANNER-V2-ELEMENT' ||
        tag === 'LOL-REGALIA-CREST-V2-ELEMENT' ||
        tag === 'LOL-REGALIA-PARTY-MEMBER-V2-ELEMENT') {
      return false;
    }

    let curr = el;
    while (curr) {
      if (curr.className && typeof curr.className === 'string') {
        const cls = curr.className.toLowerCase();
        if (cls.includes('flex') || cls.includes('tft') || cls.includes('double-up') || cls.includes('arena') || cls.includes('honor') || cls.includes('trophy') || cls.includes('clash')) {
          return true;
        }
      }

      const isContainer = curr.classList && (
        curr.classList.contains('ranked-tooltip-queue') ||
        curr.classList.contains('tooltip-queue') ||
        curr.classList.contains('style-profile-emblem-wrapper') ||
        curr.classList.contains('profile-emblem-wrapper') ||
        curr.classList.contains('ranked-emblem-wrapper')
      );

      if (isContainer && curr !== el && !curr.tagName?.startsWith('LOL-REGALIA-PROFILE')) {
        const nameEl = curr.querySelector('.ranked-tooltip-queue-name, .ranked-tooltip-last-season-queue-name, .tooltip-queue-name, [class*="queue-name"], [class*="tooltip-name"], [class*="queue-title"], .style-profile-emblem-header-title, .profile-emblem-header-title, [class*="header-title"]');
        if (nameEl && nameEl.textContent) {
          const text = nameEl.textContent.trim().toLowerCase();
          const isFlex = text.includes('flex') || text.includes('자유');
          const isTFT = text.includes('tft') || text.includes('전략적') || text.includes('tactique');
          const isDoubleUp = text.includes('double') || text.includes('2인');
          const isArena = text.includes('arena') || text.includes('cherry');
          const isHonor = text.includes('honor') || text.includes('honneur') || text.includes('명예');
          const isTrophy = text.includes('trophy') || text.includes('trophée') || text.includes('트로피');
          const isClash = text.includes('clash') || text.includes('cup');
          const is5v5 = (text.includes('5v5') || text.includes('5vs5')) && !text.includes('solo');

          if (isFlex || isTFT || isDoubleUp || isArena || isHonor || isTrophy || isClash || is5v5) {
            return true;
          }
        }
      }

      curr = curr.parentElement || curr.host || (curr.parentNode && curr.parentNode.host);
    }
    return false;
  }

  function getContextConf(el) {
    if (!el || isEmptyLobbySlot(el) || isNonSoloQQueue(el)) return null;

    let curr = el;
    while (curr) {
      const p = curr.getAttribute?.('puuid') || curr.getAttribute?.('data-puuid');
      if (p) {
        const cleanP = extractPuuidFromUrl(p) || p;
        if (cleanP === currentLocalPuuid) return getMyConfig();
        if (PLAYERS_CONFIG[cleanP]) return PLAYERS_CONFIG[cleanP];
        return null;
      }
      if (curr.getAttribute?.('is-searched') === 'true' || curr.classList?.contains('is-searched')) {
        return null;
      }
      const lm = curr.getAttribute?.('is-local-member') || curr.getAttribute?.('is-self') || curr.getAttribute?.('is-me');
      const mt = curr.getAttribute?.('member-type');
      if (lm === 'true' || mt === 'current-player' || mt === 'local-player') {
        return getMyConfig();
      }
      if (lm === 'false' || mt === 'other-player' || mt === 'member') {
        return null;
      }
      curr = curr.parentElement || (curr.parentNode && curr.parentNode.host);
    }
    return null;
  }

  // === 1. HOOK API NATIVE LCU FETCH ===
  const originalFetch = window.fetch;

  async function initLocalPuuid() {
    try {
      const res = await originalFetch('/lol-summoner/v1/current-summoner');
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.puuid) {
          currentLocalPuuid = data.puuid;
        }
      }
    } catch (e) {}
  }
  initLocalPuuid();

  if (originalFetch && !window._rankModifHookedV5) {
    window._rankModifHookedV5 = true;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      const urlPuuid = extractPuuidFromUrl(url);

      if (url.includes('/lol-summoner/v1/current-summoner') || url.includes('/lol-chat/v1/me')) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data && data.puuid) {
            currentLocalPuuid = data.puuid;
          }
        } catch (e) {}
      }

      if (url.includes('/lol-regalia/v2/')) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          const conf = (urlPuuid && PLAYERS_CONFIG[urlPuuid]) ||
                       (urlPuuid && currentLocalPuuid && urlPuuid === currentLocalPuuid ? getMyConfig() : null) ||
                       (!urlPuuid ? getPageAuth() : null);

          if (data && conf) {
            const bannerTier = getTierFromBanner(conf.banner);
            data.highestPreviousSeasonEndTier = bannerTier;
            data.highestPreviousSeasonEndDivision = "I";
            data.highestPreviousSeasonAchievedTier = bannerTier;
            data.highestPreviousSeasonAchievedDivision = "I";
            data.bannerId = bannerTier;
            data.crestId = conf.tier.toUpperCase();

            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch (e) {}
      }

      if (url.includes('/lol-parties/v1/parties')) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data && Array.isArray(data.members)) {
            let modified = false;
            for (const m of data.members) {
              const mPuuid = m.puuid;
              const conf = (mPuuid && PLAYERS_CONFIG[mPuuid]) ||
                           (mPuuid === currentLocalPuuid || m.memberType === 'current-player' || m.isLocalMember ? getMyConfig() : null);

              if (conf && m.regalia) {
                const bannerTier = getTierFromBanner(conf.banner);
                m.regalia.highestPreviousSeasonEndTier = bannerTier;
                m.regalia.highestPreviousSeasonAchievedTier = bannerTier;
                m.regalia.bannerId = bannerTier;
                m.regalia.crestId = conf.tier.toUpperCase();
                modified = true;
              }
            }
            if (modified) {
              return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }
          }
        } catch (e) {}
      }

      if (url.includes('/lol-ranked/v1/ranked-stats/') || url.includes('/lol-ranked/v1/current-ranked-stats')) {
        try {
          const clone = response.clone();
          const data = await clone.json();

          const targetPuuid = (data && data.puuid) || urlPuuid;

          const isLocalUser = url.includes('/lol-ranked/v1/current-ranked-stats') ||
                              (targetPuuid && currentLocalPuuid && targetPuuid === currentLocalPuuid);

          const conf = isLocalUser ? getMyConfig() : (targetPuuid && PLAYERS_CONFIG[targetPuuid]);

          if (conf) {
            const tierUpper = conf.tier.toUpperCase();
            const bannerTier = getTierFromBanner(conf.banner);

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

            data.highestPreviousSeasonEndTier = bannerTier;
            data.highestPreviousSeasonEndDivision = "I";
            data.highestPreviousSeasonAchievedTier = bannerTier;
            data.highestPreviousSeasonAchievedDivision = "I";

            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch (e) {}
      }
      return response;
    };
  }

  // === 2. DYNAMIC DOM PATCHER ===
  const SELECTORS = {
    profile: ['.style-profile-emblem-wrapper', '.profile-emblem-wrapper', '.ranked-emblem-wrapper', '[class*="profile-emblem"]', '[class*="ranked-emblem"]'],
    title: ['.style-profile-emblem-header-title', '.profile-emblem-header-title', '.ranked-emblem-header-title', '[class*="header-title"]', 'div[class*="title"]'],
    subtitle: ['.style-profile-emblem-header-subtitle', '.profile-emblem-header-subtitle', '.ranked-emblem-header-subtitle', '[class*="header-subtitle"]', 'div[class*="subtitle"]'],
    emblem: ['lol-regalia-emblem-element', '.regalia-emblem-element', '[class*="emblem-element"]']
  };

  function patchProfileBanner(root = document) {
    const pageConfig = getPageAuth();
    const possibleSelectors = [
      'lol-regalia-profile-v2-element',
      '.style-profile-emblem-wrapper',
      '.profile-emblem-wrapper',
      '.ranked-emblem-wrapper',
      '[class*="profile-emblem"]',
      '[class*="ranked-emblem"]'
    ];
    let foundElements = [];
    possibleSelectors.forEach(selector => {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) foundElements = foundElements.concat(Array.from(elements));
    });

    foundElements.forEach(wrapper => {
      const wrapperConfig = getContextConf(wrapper) || pageConfig;
      if (!wrapperConfig) return;

      const bannerTier = getTierFromBanner(wrapperConfig.banner);
      if (wrapper.tagName === 'LOL-REGALIA-PROFILE-V2-ELEMENT') {
        setAttrIfChanged(wrapper, 'highest-previous-season-end-tier', bannerTier);
        setAttrIfChanged(wrapper, 'highest-previous-season-achieved-tier', bannerTier);
      }

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
        const isOtherQueue = titleText.includes('flex') ||
                             titleText.includes('tft') ||
                             titleText.includes('tactique') ||
                             titleText.includes('arena') ||
                             titleText.includes('honor') ||
                             titleText.includes('honneur') ||
                             titleText.includes('trophy') ||
                             titleText.includes('trophée') ||
                             titleText.includes('clash') ||
                             titleText.includes('자유') ||
                             titleText.includes('전략적') ||
                             titleText.includes('hyper') ||
                             titleText.includes('double') ||
                             titleText.includes('명예') ||
                             titleText.includes('트로피');
        if (isOtherQueue) return;
      }

      if (subtitle && wrapperConfig.text) {
        if (subtitle.textContent !== wrapperConfig.text) {
          subtitle.textContent = wrapperConfig.text;
        }
      }

      if (emblem) {
        const tierUpper = wrapperConfig.tier.toUpperCase();
        setAttrIfChanged(emblem, 'ranked-tier', tierUpper);
        setAttrIfChanged(emblem, 'ranked-division', wrapperConfig.div || " ");
        setAttrIfChanged(emblem, 'crest-type', 'ranked');
        setAttrIfChanged(emblem, 'animations', 'true');

        const shadowEl = emblem.shadowRoot?.querySelector('.regalia-emblem');
        if (shadowEl) setAttrIfChanged(shadowEl, 'ranked-tier', wrapperConfig.tier.toLowerCase());
      }
    });
  }

  function patchTooltipQueues(root = document) {
    const pageConfig = getPageAuth();
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
      if (elements.length > 0) tooltipContainers = tooltipContainers.concat(Array.from(elements));
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
        if (elements.length > 0) queueBlocks = queueBlocks.concat(Array.from(elements));
      });

      queueBlocks = Array.from(new Set(queueBlocks));

      queueBlocks.forEach(queue => {
        if (isNonSoloQQueue(queue)) return;

        const queueConfig = getContextConf(queue) || pageConfig;
        if (!queueConfig) return;

        const nameSelectors = [
          '.ranked-tooltip-queue-name',
          '.ranked-tooltip-last-season-queue-name',
          '.tooltip-queue-name',
          '[class*="queue-name"]',
          '[class*="tooltip-name"]'
        ];
        let queueName = null;
        for (const selector of nameSelectors) {
          const el = queue.querySelector(selector);
          if (el && el.textContent.trim()) {
            queueName = el.textContent.trim();
            break;
          }
        }

        if (!queueName) return;

        const qLower = queueName.toLowerCase();

        const isSoloDuo = (qLower.includes('solo') || qLower === 'solo/duo' || queueName.includes('개인')) &&
                          !qLower.includes('flex') && !qLower.includes('tft') && !qLower.includes('arena') && !qLower.includes('5v5') && !qLower.includes('5vs5');

        const isLastSeason = qLower.includes('last') ||
                             qLower.includes('past') ||
                             qLower.includes('previous') ||
                             qLower.includes('saison préc') ||
                             qLower.includes('précédente') ||
                             queueName.includes('지난');

        if (!isSoloDuo && !isLastSeason) return;

        const bannerTierU = getTierFromBanner(queueConfig.banner);
        const data = isSoloDuo ? queueConfig : {
          tier: bannerTierU,
          tierText: bannerTierU
        };

        const emblemSelectors = ['lol-regalia-emblem-element', '.regalia-emblem-element', '[class*="emblem-element"]'];
        let emblemElement = null;
        for (const selector of emblemSelectors) {
          emblemElement = queue.querySelector(selector);
          if (emblemElement) break;
        }

        if (emblemElement) {
          setAttrIfChanged(emblemElement, 'ranked-tier', data.tier.toUpperCase());
          const shadowEl = emblemElement.shadowRoot?.querySelector('.regalia-emblem');
          if (shadowEl) setAttrIfChanged(shadowEl, 'ranked-tier', data.tier.toLowerCase());
        }

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
          if (tierText && tierTextEl.textContent !== tierText) tierTextEl.textContent = tierText;
        }

        if (isSoloDuo) {
          const lpSelectors = ['.style-profile-ranked-crest-tooltip-lp', '.ranked-crest-tooltip-lp', '.tooltip-lp', '[class*="tooltip-lp"]'];
          let lpBlock = null;
          for (const selector of lpSelectors) {
            lpBlock = queue.querySelector(selector);
            if (lpBlock) break;
          }
          const html = `<span>${queueConfig.wins}</span> Wins | <span>${queueConfig.lp}</span> LP`;
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
              if (spans[0].textContent !== String(queueConfig.wins)) spans[0].textContent = queueConfig.wins;
              if (spans[1].textContent !== String(queueConfig.lp)) spans[1].textContent = queueConfig.lp;
            } else {
              lpBlock.innerHTML = html;
            }
          }
        }
      });
    });
  }

  function patchBannersAndCrests(root = document) {
    const pageConfig = getPageAuth();
    const regaliaSelectors = [
      'lol-regalia-crest-v2-element',
      'lol-regalia-banner-v2-element',
      'lol-regalia-parties-v2-element',
      'lol-regalia-party-member-v2-element',
      'lol-regalia-profile-v2-element',
      'lol-regalia-emblem-element',
      '.regalia-emblem',
      '.regalia-crest',
      '.regalia-banner',
      '[class*="regalia-emblem"]',
      '[class*="regalia-crest"]',
      '[class*="regalia-banner"]',
      '[class*="profile-banner"]',
      'img.regalia-banner-asset-static-image',
      'img[src*="BannerSkins"]'
    ];

    root.querySelectorAll(regaliaSelectors.join(',')).forEach(el => {
      if (isEmptyLobbySlot(el) || isNonSoloQQueue(el)) return;

      const c = getContextConf(el) || pageConfig;
      if (!c) return;

      const tierUpper = c.tier.toUpperCase();
      const tierLower = c.tier.toLowerCase();
      const bannerTier = getTierFromBanner(c.banner);
      const bannerTierLower = bannerTier.toLowerCase();

      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src') || '';
        const cls = el.className || '';
        const isProfileIcon = src.includes('profile-icon') || src.includes('SummonerIcons') || src.includes('profile-icons') || cls.includes('profile-icon') || cls.includes('avatar') || cls.includes('icon-image');
        if (isProfileIcon) return;

        if (c.banner && (src.includes('BannerSkins') || cls.includes('regalia-banner-asset-static-image'))) {
          setImgSrcIfChanged(el, c.banner);
        }
      } else {
        const tag = el.tagName || '';
        const isCrest = tag.includes('CREST') || tag.includes('EMBLEM') || el.classList.contains('regalia-emblem') || el.classList.contains('regalia-crest');
        const isBanner = tag.includes('BANNER') || el.classList.contains('regalia-banner') || el.classList.contains('profile-banner');
        const isPartyOrProfile = tag.includes('PARTIES') || tag.includes('PARTY') || tag.includes('PROFILE');

        if (isCrest || isPartyOrProfile) {
          setAttrIfChanged(el, 'ranked-tier', tierUpper);
          setAttrIfChanged(el, 'ranked-division', c.div || " ");
          setAttrIfChanged(el, 'crest-type', 'ranked');
          if (tag === 'DIV' || el.classList.contains('regalia-emblem') || el.classList.contains('regalia-crest')) {
            setAttrIfChanged(el, 'ranked-tier', tierLower);
            setAttrIfChanged(el, 'queue-type', 'RANKED_SOLO_5x5');
          }
        }

        if (isBanner || isPartyOrProfile) {
          setAttrIfChanged(el, 'banner-tier', bannerTier);
          setAttrIfChanged(el, 'highest-previous-season-end-tier', bannerTier);
          setAttrIfChanged(el, 'highest-previous-season-achieved-tier', bannerTier);
          setAttrIfChanged(el, 'animated', 'false');
          if (tag === 'DIV') {
            setAttrIfChanged(el, 'banner-tier', bannerTierLower);
            setAttrIfChanged(el, 'highest-previous-season-end-tier', bannerTierLower);
            setAttrIfChanged(el, 'highest-previous-season-achieved-tier', bannerTierLower);
          }
        }

        el.querySelectorAll('.regalia-emblem, .regalia-crest, [class*="regalia-emblem"], [class*="regalia-crest"]').forEach(em => {
          setAttrIfChanged(em, 'ranked-tier', tierLower);
          setAttrIfChanged(em, 'ranked-division', c.div || " ");
          setAttrIfChanged(em, 'queue-type', 'RANKED_SOLO_5x5');
        });

        el.querySelectorAll('.regalia-banner, [class*="regalia-banner"]').forEach(bn => {
          setAttrIfChanged(bn, 'banner-tier', bannerTierLower);
          setAttrIfChanged(bn, 'highest-previous-season-end-tier', bannerTierLower);
          setAttrIfChanged(bn, 'highest-previous-season-achieved-tier', bannerTierLower);
        });

        el.querySelectorAll('img').forEach(img => {
          if (isEmptyLobbySlot(img)) return;
          const src = img.getAttribute('src') || '';
          const cls = img.className || '';
          const isProfileIcon = src.includes('profile-icon') || src.includes('SummonerIcons') || src.includes('profile-icons') || cls.includes('profile-icon') || cls.includes('avatar') || cls.includes('icon-image');
          if (isProfileIcon) return;

          if (c.banner && (src.includes('BannerSkins') || img.classList.contains('regalia-banner-asset-static-image'))) {
            setImgSrcIfChanged(img, c.banner);
          }
        });

        el.querySelectorAll('[style*="background-image"]').forEach(bgEl => {
          const style = bgEl.style.backgroundImage || '';
          if (style.includes('profile-icon') || style.includes('SummonerIcons') || style.includes('avatar')) return;

          if (c.banner && style.includes('BannerSkins')) {
            setBgImageIfChanged(bgEl, c.banner);
          }
        });
      }
    });
  }

  function removeMasteryDanglingBanners(root = document) {
    const masterySelectors = [
      '.style-profile-top-champions',
      '.style-profile-mastery-score',
      '[class*="top-champion"]',
      '[class*="highest-champion"]',
      '[class*="mastery-score"]',
      '[class*="mastery-item"]'
    ];

    masterySelectors.forEach(selector => {
      root.querySelectorAll(selector).forEach(container => {
        container.querySelectorAll('lol-regalia-banner-v2-element, .regalia-banner-v2-root, [class*="regalia-banner"]').forEach(b => {
          if (b.style.display !== 'none') {
            b.style.setProperty('display', 'none', 'important');
          }
        });
        if (container.shadowRoot) {
          container.shadowRoot.querySelectorAll('lol-regalia-banner-v2-element, .regalia-banner-v2-root, [class*="regalia-banner"]').forEach(b => {
            if (b.style.display !== 'none') {
              b.style.setProperty('display', 'none', 'important');
            }
          });
        }
      });
    });
  }

  function patch(root = document) {
    if (!root) return;
    patchBannersAndCrests(root);
    patchProfileBanner(root);
    patchTooltipQueues(root);
    removeMasteryDanglingBanners(root);

    const customElements = root.querySelectorAll('lol-regalia-crest-v2-element, lol-regalia-banner-v2-element, lol-regalia-parties-v2-element, lol-regalia-party-member-v2-element, lol-regalia-profile-v2-element, lol-regalia-emblem-element');
    customElements.forEach(el => {
      if (el.shadowRoot) {
        patch(el.shadowRoot);
      }
    });
  }

  let patchDebounceTimer = null;
  const observer = new MutationObserver((mutations) => {
    let hasElementNodes = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        for (let i = 0; i < m.addedNodes.length; i++) {
          if (m.addedNodes[i].nodeType === 1) {
            hasElementNodes = true;
            break;
          }
        }
      }
      if (hasElementNodes) break;
    }
    if (hasElementNodes) {
      if (!patchDebounceTimer) {
        patchDebounceTimer = setTimeout(() => {
          patchDebounceTimer = null;
          patch(document);
        }, 300);
      }
    }
  });

  function initializePatching() {
    observer.observe(document.body, { childList: true, subtree: true });
    patch(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePatching);
  } else {
    initializePatching();
  }

  console.log('[RankModif V5] GB RANKMODIF Clean & Loop-Free!');
})();
