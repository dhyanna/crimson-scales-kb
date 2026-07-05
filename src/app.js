// app.js — Crimson Scales Knowledge Base application logic
// Card images sourced from: github.com/cmlenius/gloomhaven-card-browser (images branch)

(function () {
  "use strict";

  // ===== CLASS REGISTRY =====
  const CLASS_REGISTRY = {
    chainguard: CHAINGUARD_DATA,
    luminary: LUMINARY_DATA,
    chieftain: CHIEFTAIN_DATA,
    hierophant: HIEROPHANT_DATA,
    hollowpact: HOLLOWPACT_DATA,
    mirefoot: MIREFOOT_DATA,
    fireknight: FIREKNIGHT_DATA,
    bombard: BOMBARD_DATA,
    brightspark: BRIGHTSPARK_DATA,
    starslinger: STARSLINGER_DATA,
  };
  window.CLASS_REGISTRY = CLASS_REGISTRY;

  // Expose switchClass for external use (e.g. campaign panel guide links)
  window.switchClass = function(cls) {
    if (!CLASS_REGISTRY[cls]) return;
    // Expand sidebar if collapsed
    const sidebar = document.getElementById('class-sidebar');
    if (sidebar?.classList.contains('sidebar-collapsed')) {
      sidebar.classList.remove('sidebar-collapsed');
      const icon = document.querySelector('.sidebar-toggle-icon');
      if (icon) icon.textContent = '◀';
    }
    const btn = document.querySelector(`.class-btn[data-class="${cls}"]`);
    if (btn) btn.click();
  };

  // ===== STATE =====
  const state = {
    activeClass: "chainguard",
    activeTab: "overview",
    cardFilter: "all",
    activeBuild: null,
    cardSearch: "",
    expandedBuild: null,

  };

  function activeClassData() {
    return CLASS_REGISTRY[state.activeClass];
  }

  // ===== INIT =====
  function init() {
    // Show Prayer chip only for Hierophant
    const prayerChip = document.getElementById("chip-lvlp");
    if (prayerChip) prayerChip.style.display = state.activeClass === "hierophant" ? "" : "none";

    // Show Trap chip only for Chainguard
    const trapChip = document.getElementById("chip-trap");
    if (trapChip) trapChip.style.display = state.activeClass === "chainguard" ? "" : "none";

    // Milestone flip card
    const flipCard = document.getElementById("milestone-flip-card");
    const flipToBack = document.getElementById("flip-to-back");
    const flipToFront = document.getElementById("flip-to-front");
    if (flipCard && flipToBack && flipToFront) {
      flipToBack.addEventListener("click", () => { flipCard.classList.add("flipped"); });
      flipToFront.addEventListener("click", () => { flipCard.classList.remove("flipped"); });
    }

    // Mat flip card
    const matCard = document.getElementById("mat-flip-card");
    const matToBack = document.getElementById("mat-flip-to-back");
    const matToFront = document.getElementById("mat-flip-to-front");
    if (matCard && matToBack && matToFront) {
      matToBack.addEventListener("click",  () => { matCard.classList.add("flipped"); });
      matToFront.addEventListener("click", () => { matCard.classList.remove("flipped"); });
    }

    renderCards();
    renderPerks();
    renderTips();
    bindTabNav();
    bindFilterChips();
    bindCardSearch();
    bindBuildPanels();
    bindBannerClear();
    bindSidebarSectionToggles();
    // Render sidebar immediately with no campaign (fallback) — campaign load will update it
    if (window.updateSidebarFromCampaign) window.updateSidebarFromCampaign(null, null);

    renderMilestone();
    renderOverview();
    renderBuilds();
    updateMechanicChipLabels();
    bindClassNav();
  }


  // ===== TAB NAVIGATION =====
  function bindTabNav() {
    const tabNav = document.getElementById("tab-nav");
    if (!tabNav) return;
    tabNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  }

  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    document.querySelectorAll(".tab-pane").forEach((p) => {
      p.classList.toggle("active", p.id === "tab-" + tab);
    });
  }

  // ===== FILTER CHIPS =====
  function bindFilterChips() {
    const chips = document.getElementById("filter-chips");
    if (!chips) return;
    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const filter = chip.dataset.filter;
      state.cardFilter = filter;
      state.activeBuild = null;
      hideBuildBanner();
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderCards();
    });
  }

  // ===== CARD SEARCH =====
  function bindCardSearch() {
    const input = document.getElementById("card-search");
    if (!input) return;
    input.addEventListener("input", (e) => {
      state.cardSearch = e.target.value.toLowerCase();
      renderCards();
    });
  }

  // ===== BUILD PANELS =====
  function bindBuildPanels() {
    // Dynamically get build IDs from current class
    const bd = CLASS_BUILDS[state.activeClass];
    const buildIds = bd ? bd.builds.map((b) => b.id) : ["bruiser", "trap"];

    buildIds.forEach((build) => {
      const panel = document.getElementById("bp-" + build);
      if (panel) {
        panel.addEventListener("click", (e) => {
          if (e.target.closest(".show-cards-btn")) return;
          toggleBuildPanel(build);
        });
        const showBtn = panel.querySelector(".show-cards-btn");
        if (showBtn) {
          showBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            goToCardsForBuild(build);
          });
        }
      }
    });
  }

  function toggleBuildPanel(build) {
    const isSame = state.expandedBuild === build;
    state.expandedBuild = isSame ? null : build;

    const bd = CLASS_BUILDS[state.activeClass];
    const buildIds = bd ? bd.builds.map((b) => b.id) : ["bruiser", "trap"];

    buildIds.forEach((b) => {
      const expand = document.getElementById("bx-" + b);
      const chev = document.getElementById("chev-" + b);
      const panel = document.getElementById("bp-" + b);
      const open = state.expandedBuild === b;
      if (expand) expand.classList.toggle("open", open);
      if (chev) chev.classList.toggle("rotated", open);
      if (panel) {
        panel.classList.remove("open-bruiser", "open-trap", "open-support", "open-damage", "open-dps", "open-tank");
        if (open) panel.classList.add("open-" + b);
      }
    });
  }

  function goToCardsForBuild(build) {
    state.activeBuild = build;
    state.cardFilter = "all";
    // Map build id to filter chip data-filter value
    const filterMap = { bruiser: "bruiser", trap: "trapbuild", support: "trapbuild", damage: "bruiser", dps: "bruiser", tank: "trapbuild", trapbuild: "trapbuild" };
    const filterVal = filterMap[build] || "bruiser";
    switchTab("cards");
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    const targetChip = document.querySelector(`.chip[data-filter="${filterVal}"]`);
    if (targetChip) targetChip.classList.add("active");
    showBuildBanner(build);
    renderCards();
  }

  // ===== BUILD BANNER =====
  function showBuildBanner(build) {
    const banner = document.getElementById("build-banner");
    const bannerText = document.getElementById("banner-text");
    if (!banner || !bannerText) return;
    // Look up the build name from the class data
    const bd = CLASS_BUILDS[state.activeClass];
    const buildData = bd ? bd.builds.find((b) => b.id === build) : null;
    const buildName = buildData ? buildData.name : build;
    bannerText.textContent = "Showing " + buildName + " cards";
    banner.classList.remove("hidden");
  }

  function hideBuildBanner() {
    const banner = document.getElementById("build-banner");
    if (banner) banner.classList.add("hidden");
  }

  function bindBannerClear() {
    const btn = document.getElementById("banner-clear");
    if (!btn) return;
    btn.addEventListener("click", () => {
      state.activeBuild = null;
      state.cardFilter = "all";
      hideBuildBanner();
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      const allChip = document.querySelector('.chip[data-filter="all"]');
      if (allChip) allChip.classList.add("active");
      renderCards();
    });
  }

  // ===== RENDER CARDS =====
  function cardMatchesFilter(card) {
    // Map activeBuild to filter key based on class builds order
    let f = state.cardFilter;
    if (state.activeBuild) {
      const bd = CLASS_BUILDS[state.activeClass];
      if (bd) {
        const b1 = bd.builds[0].id;
        f = state.activeBuild === b1 ? "bruiser" : "trapbuild";
      } else {
        f = state.activeBuild === "bruiser" ? "bruiser" : "trapbuild";
      }
    }

    if (f === "lvl1" && (card.level !== "1")) return false;
    if (f === "lvlx" && card.level !== "X") return false;
    if (f === "lvlm" && card.level !== "M") return false;
    if (f === "lvlp" && card.level !== "P") return false;
    if (f === "lvl2plus" && !["2","3","4","5","6","7","8","9"].includes(card.level)) return false;
    if (f === "trap" && !card.tags.includes("trap")) return false;
    // Mechanic filters — map to class-specific tag values
    if (f === "mechanic1" && !card.tags.includes(getTagConfig().mechanic1.filter)) return false;
    if (f === "mechanic2" && !card.tags.includes(getTagConfig().mechanic2.filter)) return false;
    if (f === "loss" && !card.top?.isLoss && !card.bottom?.isLoss) return false;
    if (f === "bruiser") {
      if (!card.builds.includes("bruiser") && !card.builds.includes("damage") && !card.builds.includes("dps") && !card.builds.includes("both")) return false;
    }
    if (f === "trapbuild") {
      if (!card.builds.includes("trap") && !card.builds.includes("support") && !card.builds.includes("tank") && !card.builds.includes("trapbuild") && !card.builds.includes("both")) return false;
    }

    if (state.cardSearch) {
      const s = state.cardSearch;
      const searchable = [card.name, card.commentary].join(" ").toLowerCase();
      if (!searchable.includes(s)) return false;
    }

    return true;
  }

  function getCardHighlightClass(card) {
    const bd = CLASS_BUILDS[state.activeClass];
    const b1 = bd ? bd.builds[0].id : "bruiser";
    const b2 = bd ? bd.builds[1].id : "trap";
    const isB1   = card.builds.includes(b1) && !card.builds.includes(b2) && !card.builds.includes("both");
    const isB2   = card.builds.includes(b2) && !card.builds.includes(b1) && !card.builds.includes("both");
    const isBoth = card.builds.includes("both") || (card.builds.includes(b1) && card.builds.includes(b2));
    if (isB1)   return "hl-bruiser";
    if (isB2)   return "hl-trap";
    if (isBoth) return "hl-both";
    return "hl-none";
  }

  function buildCardTags(card) {
    const tags = [];
    const tc = getTagConfig();
    const bd = CLASS_BUILDS[state.activeClass];
    const b1 = bd ? bd.builds[0] : { id: "bruiser", name: "Bruiser" };
    const b2 = bd ? bd.builds[1] : { id: "trap",    name: "Trap build" };

    tags.push(`<span class="tag tag-lvl">Lvl ${card.level}</span>`);

    // Class-specific mechanic tags
    if (card.tags.includes(tc.mechanic1.filter))
      tags.push(`<span class="tag ${tc.mechanic1.tagClass}">${tc.mechanic1.label}</span>`);
    if (card.tags.includes(tc.mechanic2.filter))
      tags.push(`<span class="tag ${tc.mechanic2.tagClass}">${tc.mechanic2.label}</span>`);
    // Chainguard: also show Trap badge for cards tagged "trap"
    if (state.activeClass === "chainguard" && card.tags.includes("trap") && tc.mechanic2.filter !== "trap")
      tags.push(`<span class="tag tag-trap">Trap</span>`);
    if (card.tags.includes("aoe"))
      tags.push(`<span class="tag tag-shackle">AoE</span>`);
    if (card.top?.isLoss || card.bottom?.isLoss)
      tags.push(`<span class="tag tag-loss">Loss</span>`);

    // Build tags — dynamic per class
    const isB1   = card.builds.includes(b1.id) && !card.builds.includes(b2.id) && !card.builds.includes("both");
    const isB2   = card.builds.includes(b2.id) && !card.builds.includes(b1.id) && !card.builds.includes("both");
    const isBoth = card.builds.includes("both") || (card.builds.includes(b1.id) && card.builds.includes(b2.id));
    if (isB1)   tags.push(`<span class="tag tag-bruiser">${b1.name}</span>`);
    if (isB2)   tags.push(`<span class="tag tag-trapbld">${b2.name}</span>`);
    if (isBoth) tags.push(`<span class="tag tag-both">Both builds</span>`);
    return tags.join("");
  }

  function renderCards() {
    const grid = document.getElementById("cards-grid");
    if (!grid) return;

    const data = activeClassData();
    const filtered = data.cards.filter(cardMatchesFilter);

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="cards-empty">No cards match your filter.</div>`;
      return;
    }

    grid.innerHTML = filtered.map((card) => `
      <div class="card-entry ${getCardHighlightClass(card)}">
        <div class="card-entry-header">
          <div class="card-entry-name">${card.name}</div>
          <div class="card-entry-init">Init ${card.initiative}</div>
        </div>
        <div class="card-entry-meta">${buildCardTags(card)}</div>
        ${card.imageUrl ? `
        <div class="card-image-wrap">
          <img
            class="card-image"
            src="${card.imageUrl}"
            alt="${card.name} ability card"
            loading="eager"
            onerror="this.parentElement.classList.add('card-image-error'); this.parentElement.innerHTML='<span class=\'card-image-fallback\'>Image unavailable</span>'"
          >
        </div>` : ""}
        <div class="card-commentary">${card.commentary}</div>
      </div>
    `).join("");
  }

  // ===== RENDER PERKS =====
  function renderPerks() {
    const desc = document.getElementById("perks-desc");
    if (!desc) return;
    const bd = CLASS_BUILDS[state.activeClass];
    desc.textContent = bd?.perksDesc ?? "Perks are tracked and applied in Secretariat. Refer to the Builds tab for perk selection guidance.";
    const list = document.getElementById("perks-list");
    if (list) list.innerHTML = "";
  }

  function updatePerkCount() {}

  // ===== RENDER BUILDS =====
  function renderBuilds() {
    const container = document.getElementById("builds-container");
    if (!container) return;

    const bd = CLASS_BUILDS[state.activeClass];
    if (!bd) { container.innerHTML = ""; return; }

    // Update perks description is now handled in renderPerks()

    const buildsHTML = bd.builds.map((b) => `
      <div class="build-panel" id="bp-${b.id}" data-build="${b.id}">
        <div class="build-panel-header">
          <div class="build-panel-icon ${b.iconClass}">${b.icon}</div>
          <div>
            <div class="build-panel-name">${b.name}</div>
            <div class="build-panel-tagline">${b.tagline}</div>
          </div>
          <span class="build-chevron" id="chev-${b.id}">&#9660;</span>
        </div>
        <p class="build-panel-desc">${b.desc}</p>
        <div class="build-panel-expand" id="bx-${b.id}">
          <div class="expand-section">
            <div class="expand-label">Playstyle</div>
            <p class="expand-text">${b.playstyle}</p>
          </div>
          <div class="expand-section">
            <div class="expand-label">Core cards</div>
            <div class="expand-card-list">
              ${b.coreCards.map((c) => "<div class=\"expand-card-item\"><strong>" + c.name + "</strong><span>" + c.desc + "</span></div>").join("")}
            </div>
          </div>
          <div class="expand-section">
            <div class="expand-label">Level-up path</div>
            <div class="expand-levelup-list">
              ${b.levelups.map((l) => "<div class=\"expand-levelup-item\"><span class=\"lvl-badge\">" + l.lvl + "</span><span>" + l.text + "</span></div>").join("")}
            </div>
          </div>
          <div class="expand-actions">
            <button class="show-cards-btn ${b.btnClass}" data-build="${b.id}">Show ${b.name} cards →</button>
          </div>
        </div>
      </div>
    `).join("");

    const bothHTML = "<div class=\"both-builds-block\"><div class=\"both-builds-label\">Cards good for both builds</div><div class=\"both-builds-grid\">" +
      bd.bothBuilds.map((c) => "<div class=\"both-card\"><strong>" + c.name + "</strong><p>" + c.desc + "</p></div>").join("") +
      "</div></div>";

    container.innerHTML = "<div class=\"builds-grid\">" + buildsHTML + "</div>" + bothHTML;

    // Re-bind build panel interactions after DOM is updated
    bindBuildPanels();
  }

  // ===== RENDER TIPS =====
  function renderTips() {
    const grid = document.getElementById("tips-grid");
    if (!grid) return;
    const tips = activeClassData().tips;
    if (!tips || !tips.length) {
      grid.innerHTML = "<div style='padding:20px;color:#888;font-size:13px'>No tips available for this class yet.</div>";
      return;
    }
    grid.innerHTML = tips.map((tip) => `
      <div class="tip-card">
        <div class="tip-category">${tip.category}</div>
        <div class="tip-text">${tip.text}</div>
      </div>
    `).join("");
  }


  // ===== RENDER MILESTONE =====
  function renderMilestone() {
    const data = activeClassData();
    const ms = data.milestone;

    // Always clear reward elements first to avoid stale data from previous class
    const rewardLabel   = document.getElementById("milestone-reward-label");
    const rewardDesc    = document.getElementById("milestone-reward-desc");
    const rewardImg     = document.getElementById("milestone-reward-img");
    const abilityLabel  = document.getElementById("milestone-ability-label");
    const goalLabel     = document.getElementById("milestone-goal-label");
    const goalText      = document.getElementById("milestone-goal-text");
    const img           = document.getElementById("milestone-img");

    if (rewardLabel)  rewardLabel.textContent = "Reward — Level M card";
    if (abilityLabel) abilityLabel.textContent = "Level M ability card";
    if (rewardDesc)   rewardDesc.innerHTML = "";
    if (rewardImg)    rewardImg.src = "";
    if (img)          img.src = "";

    if (!ms) return;

    // Milestone condition card image
    if (img) img.src = ms.imageUrl;

    // Milestone goal label and commentary
    if (goalLabel) goalLabel.textContent = data.name + " milestone goal";
    if (goalText)  goalText.innerHTML = ms.commentary;

    // Find the Level M card for this class
    const milestoneCard = data.cards.find((c) => c.level === "M");

    // Reward label, description and card image
    if (rewardLabel) rewardLabel.textContent = milestoneCard
      ? "Reward — " + milestoneCard.name + " (Level M)"
      : "Reward — " + ms.reward.split(" —")[0];
    if (abilityLabel && milestoneCard) {
      abilityLabel.textContent = "Level M card — " + milestoneCard.name;
    }
    if (rewardDesc) rewardDesc.innerHTML = ms.reward;
    if (rewardImg && milestoneCard && milestoneCard.imageUrl) {
      rewardImg.src = milestoneCard.imageUrl;
    }
  }


  // ===== SIDEBAR CLASS GROUPING FROM ACTIVE CAMPAIGN =====
  window.updateSidebarFromCampaign = function(activeCampaign, myPlayerClassId) {
    const guidesBody = document.getElementById('guides-list');
    if (!guidesBody) return;

    const group = activeCampaign?.starting_group;
    const unlockedIds = new Set((activeCampaign?.campaign_unlocked_classes ?? []).map(r => r.class_id));

    const startingGroupClasses = {
      naturalists:  ['mirefoot','hollowpact','chieftain','luminary'],
      militants:    ['bombard','fireknight','hierophant','mirefoot'],
      protectors:   ['chainguard','chieftain','fireknight','hierophant'],
      explorers:    ['brightspark','chainguard','hollowpact','starslinger'],
      trailblazers: ['bombard','brightspark','luminary','starslinger'],
    };
    const activeClassIds = new Set(group ? (startingGroupClasses[group] ?? []) : []);

    const ALL_CS = [
      { id: 'starslinger',  name: 'Aesther Starslinger',   icon: 'cs-starslinger-icon.svg',  hasGuide: true },
      { id: 'amberaegis',   name: 'Harrower Amber Aegis',  icon: null,                        hasGuide: false },
      { id: 'brightspark',  name: 'Human Brightspark',     icon: 'cs-brightspark-icon.svg',   hasGuide: true },
      { id: 'hierophant',   name: 'Human Hierophant',      icon: 'cs-hierophant-icon.svg',    hasGuide: true },
      { id: 'chainguard',   name: 'Inox Chainguard',       icon: 'cs-chainguard-icon.svg',    hasGuide: true },
      { id: 'luminary',     name: 'Lurker Luminary',       icon: 'cs-luminary-icon.svg',      hasGuide: true },
      { id: 'chieftain',    name: 'Orchid Chieftain',      icon: 'cs-chieftain-icon.svg',     hasGuide: true },
      { id: 'shardrender',  name: 'Orchid Shardrender',    icon: null,                        hasGuide: false },
      { id: 'artificer',    name: 'Quatryl Artificer',     icon: null,                        hasGuide: false },
      { id: 'bombard',      name: 'Quatryl Bombard',       icon: 'cs-bombard-icon.svg',       hasGuide: true },
      { id: 'mirefoot',     name: 'Quatryl Mirefoot',      icon: 'cs-mirefoot-icon.svg',      hasGuide: true },
      { id: 'hollowpact',   name: 'Savvas Hollowpact',     icon: 'cs-hollowpact-icon.svg',    hasGuide: true },
      { id: 'fireknight',   name: 'Valrath Fire Knight',   icon: 'cs-fireknight-icon.svg',    hasGuide: true },
      { id: 'vanquisher',   name: 'Valrath Vanquisher',    icon: null,                        hasGuide: false },
      { id: 'ruinmaw',      name: 'Vermling Ruinmaw',      icon: null,                        hasGuide: false },
      { id: 'spiritcaller', name: 'Vermling Spirit Caller', icon: null,                       hasGuide: false },
    ];
    const ALL_TOA = [
      { id: 'incarnate',   name: 'Inox Incarnate',     icon: null, hasGuide: false },
      { id: 'tempest',     name: 'Orchid Tempest',     icon: null, hasGuide: false },
      { id: 'thornreaper', name: 'Orchid Thornreaper', icon: null, hasGuide: false },
      { id: 'rimehearth',  name: 'Savvas Rimehearth',  icon: null, hasGuide: false },
    ];

    const activeGroup   = ALL_CS.filter(c => activeClassIds.has(c.id));
    const unlockedGroup = ALL_CS.filter(c => !activeClassIds.has(c.id) && unlockedIds.has(c.id));
    const lockedGroup   = [...ALL_CS.filter(c => !activeClassIds.has(c.id) && !unlockedIds.has(c.id)), ...ALL_TOA];

    function classBtn(cls, dimmed) {
      const hasGuide = !!(cls.hasGuide && CLASS_REGISTRY[cls.id]);
      const isCurrentClass = state.activeClass === cls.id;
      if (!hasGuide) {
        return `<button class="class-btn sidebar-btn-locked" disabled data-class="${cls.id}">
          <span class="sidebar-lock-icon">🔒</span>
          <span class="sidebar-class-name">${cls.name}<span class="sidebar-no-guide-badge">No Guide</span></span>
        </button>`;
      }
      return `<button class="class-btn${dimmed ? ' sidebar-btn-guide-locked' : ''}${isCurrentClass ? ' active' : ''}" data-class="${cls.id}">
        <img src="${cls.icon}" class="sidebar-class-icon" alt="">
        <span class="sidebar-class-name">${cls.name}</span>
      </button>`;
    }

    function collapsibleGroup(id, label, classes, dimmed, startCollapsed) {
      if (!classes.length && id !== 'unlocked') return '';
      const chevron = startCollapsed ? '▸' : '▾';
      const hiddenClass = startCollapsed ? 'sidebar-section-body-hidden' : '';
      const items = classes.map(c => classBtn(c, dimmed)).join('');
      const emptyMsg = !classes.length ? '<div style="padding:6px 12px;font-size:11px;color:#555;font-style:italic">None yet</div>' : '';
      return `
        <button class="sidebar-section-toggle${startCollapsed ? ' sidebar-section-toggle-collapsed' : ''}" data-target="${id}-group">
          <span class="sidebar-group-label" style="padding:0;margin:0">${label}</span>
          <span class="sidebar-toggle-chevron">${chevron}</span>
        </button>
        <div class="sidebar-section-body ${hiddenClass}" id="${id}-group">
          ${items}${emptyMsg}
        </div>`;
    }

    guidesBody.innerHTML =
      collapsibleGroup('active',   'Active Classes',   activeGroup,   false, false) +
      collapsibleGroup('unlocked', 'Unlocked Classes', unlockedGroup, false, false) +
      collapsibleGroup('locked',   'Locked Classes',   lockedGroup,   true,  false);

    // Rebind section toggles for dynamically rendered groups
    guidesBody.querySelectorAll('.sidebar-section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const isCollapsed = btn.classList.contains('sidebar-section-toggle-collapsed');
        btn.classList.toggle('sidebar-section-toggle-collapsed', !isCollapsed);
        target.classList.toggle('sidebar-section-body-hidden', isCollapsed);
        btn.querySelector('.sidebar-toggle-chevron').textContent = isCollapsed ? '▾' : '▸';
      });
    });

    // Rebind class nav clicks — delegate to switchClass so hero header updates too
    guidesBody.querySelectorAll('.class-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const cls = btn.dataset.class;
        if (!CLASS_REGISTRY[cls]) return;
        // Find the matching button in the static nav (if any) or trigger full class switch
        const staticBtn = document.querySelector(`#class-nav .class-btn[data-class="${cls}"]`);
        if (staticBtn && staticBtn !== btn) {
          staticBtn.click();
        } else {
          // Directly trigger the full class switch sequence
          state.activeClass = cls;
          document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll(`.class-btn[data-class="${cls}"]`).forEach(b => b.classList.add('active'));
          const data = activeClassData();
          const heroTitle = document.querySelector('.hero-title');
          const heroDesc = document.querySelector('.hero-desc');
          const heroEyebrow = document.querySelector('.hero-eyebrow');
          if (heroTitle) heroTitle.textContent = data.name;
          if (heroDesc) heroDesc.textContent = getClassDesc(cls);
          if (heroEyebrow) heroEyebrow.textContent = data.game + ' · ' + (data.symbol ? data.symbol + ' class' : data.name + ' class');
          const statNums = document.querySelectorAll('.stat-num');
          if (statNums.length >= 2) { statNums[0].textContent = data.startingHP; statNums[1].textContent = data.handSize; }
          const searchInput = document.getElementById('card-search');
          if (searchInput) searchInput.value = '';
          hideBuildBanner();
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          state.cardFilter = 'all';
          state.cardSearch = '';
          state.activeBuild = null;
          state.expandedBuild = null;
          renderOverview();
          const grid = document.getElementById('cards-grid');
          if (grid) grid.innerHTML = '';
          renderCards();
          renderBuilds();
          renderPerks();
          renderTips();
          renderMilestone();
          updateMechanicChipLabels();
          switchTab('overview');
        }
      });
    });

    // Auto-select active player's class if provided
    if (myPlayerClassId && CLASS_REGISTRY[myPlayerClassId]) {
      const btn = guidesBody.querySelector(`.class-btn[data-class="${myPlayerClassId}"]`);
      if (btn && !btn.disabled) btn.click();
    }
  };

  // ===== SIDEBAR SECTION TOGGLES =====
  function bindSidebarSectionToggles() {
    document.querySelectorAll('.sidebar-section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const isCollapsed = btn.classList.contains('sidebar-section-toggle-collapsed');
        btn.classList.toggle('sidebar-section-toggle-collapsed', !isCollapsed);
        target.classList.toggle('sidebar-section-body-hidden', isCollapsed);
        btn.querySelector('.sidebar-toggle-chevron').textContent = isCollapsed ? '▾' : '▸';
      });
    });
  }

  // ===== SIDEBAR TOGGLE =====
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('class-sidebar');
  const mainEl = document.getElementById('app');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-collapsed');
      const collapsed = sidebar.classList.contains('sidebar-collapsed');
      const icon = sidebarToggle.querySelector('.sidebar-toggle-icon');
      if (icon) icon.textContent = collapsed ? '▶' : '◀';
      if (mainEl) mainEl.style.marginLeft = collapsed ? '44px' : '220px';
    });
  }

  // ===== CLASS NAV =====
  function bindClassNav() {
    const nav = document.getElementById("class-nav");
    if (!nav) return;
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".class-btn");
      if (!btn || btn.disabled || !btn.dataset.class) return;
      const cls = btn.dataset.class;
      if (cls === state.activeClass) return;
      state.activeClass = cls;
      state.cardFilter = "all";
      state.activeBuild = null;
      state.cardSearch = "";
      state.expandedBuild = null;


      // Update class buttons
      document.querySelectorAll(".class-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.class === cls);
      });

      // Update hero
      const data = activeClassData();
      const heroTitle = document.querySelector(".hero-title");
      const heroDesc = document.querySelector(".hero-desc");
      const heroEyebrow = document.querySelector(".hero-eyebrow");
      if (heroTitle) heroTitle.textContent = data.name;
      if (heroDesc) heroDesc.textContent = getClassDesc(cls);
      if (heroEyebrow) heroEyebrow.textContent = data.game + " · " + (data.symbol ? data.symbol + " class" : data.name + " class");

      // Update stat pills
      const statNums = document.querySelectorAll(".stat-num");
      if (statNums.length >= 2) {
        statNums[0].textContent = data.startingHP;
        statNums[1].textContent = data.handSize;
      }

      // Reset search input
      const searchInput = document.getElementById("card-search");
      if (searchInput) searchInput.value = "";

      // Re-render everything
      hideBuildBanner();
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      const allChip = document.querySelector('.chip[data-filter="all"]');
      if (allChip) allChip.classList.add("active");

      // Show Prayer chip only for Hierophant
      const prayerChip = document.getElementById("chip-lvlp");
      if (prayerChip) prayerChip.style.display = cls === "hierophant" ? "" : "none";

      // Show Trap chip only for Chainguard
      const trapChip = document.getElementById("chip-trap");
      if (trapChip) trapChip.style.display = cls === "chainguard" ? "" : "none";

      // Reset flip card to front
      const flipCard = document.getElementById("milestone-flip-card");
      if (flipCard) flipCard.classList.remove("flipped");

      // Update build filter chip labels for the new class
      updateBuildChipLabels(cls);
      updateMechanicChipLabels();

      renderOverview();
      // Clear grid first to force image reload on class switch
      const grid = document.getElementById("cards-grid");
      if (grid) grid.innerHTML = "";
      renderCards();
      renderBuilds();
      renderPerks();
      renderTips();
      renderMilestone();
    });
  }

  function getClassDesc(cls) {
    const descs = {
      chainguard: "A bruising Damage Soak who pins enemies in place with Shackle and flings them through traps with Swing. Evolution of the Brute — more control, more teeth.",
      chieftain: "An Orchid Summoner who rides Mounted animal companions around the battlefield, controlling their actions while freeing up utility actions for healing, Commands, and tactical plays.",
      luminary: "A frontliner who deploys persistent Glow abilities and side-steps through enemy formations with Scuttle, leveraging Fire, Ice, Dark, and Light for powerful elemental effects.",
      hierophant: "A ranged 11-card battle-priest who distributes Prayer cards to allies, curses the enemy modifier deck, and leverages a burn-card economy (Spiritual Gains) that lets them cast devastating loss attacks all scenario long.",
      hollowpact: "A medium-low HP Savvas who accumulates and spends Void Energy, manipulates their attack modifier deck with Voidsight, teleports around the battlefield, and deploys Void Pit obstacles that power up higher-level abilities.",
      mirefoot: "A 10-card, low-health Quatryl DPS/Assassin who leverages upgraded conditions (Wound 2, Poison 3) and Difficult Terrain to dash in and out of combat, dealing devastating burst damage while staying mobile and elusive.",
      fireknight: "A dynamic mid-complexity Valrath Vanguard-Support who buffs adjacent allies with Strengthen and Advantage, deploys a Ladder token to choke enemy pathing, and unlocks a Fire Mastery damage engine at higher levels.",
      starslinger: "A fragile 10-card Aesther who harnesses stellar energy for simultaneous AoE attacks and ally hex-pattern support, with full-health attack bonuses, pseudo-invisibility modes, and Light/Dark element management.",
      brightspark: "An 11-card Human scientist-adventurer with fragile 8 HP, wielding charge-based persistent effects, chemical AoEs, and a deep toolkit of conditions (Invisible, Stun, Immobilize, Poison, Muddle) for flexible DPS, support, or hybrid play.",
      bombard: "A 9-card ranged tank Quatryl from a special force squad, played as a hybrid of three styles: Tanking (high HP and Shield options), DPS with Projectiles (delayed detonation double-turns), and ranged AoE damage. Limited movement is offset by latching onto enemies with a grappling hook and pulling toward them.",
    };
    return descs[cls] || "";
  }

  // ===== RENDER OVERVIEW =====
  const CLASS_OVERVIEW = {
    chainguard: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-chainguard.png",
      matBack: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-chainguard-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Shackle",
          chipClass: "shackle-chip",
          text: "Places a character token on an enemy. A Shackled enemy cannot perform Move abilities while adjacent to the Chainguard, and does not factor the Chainguard into its Focus pathing. Token removed if the enemy dies or you Shackle a different enemy. Enemies immune to IMMOBILIZE are immune to Shackle."
        },
        {
          label: "Mechanic",
          chip: "Swing",
          chipClass: "swing-chip",
          text: "A modified Push/Pull that moves a target X hexes in a circle around you — clockwise or counterclockwise. The target cannot end up further from or closer to you. Movement ends when the target hits something that would normally block movement."
        }
      ],
      role: "Chainguard holds monster aggro and soaks damage for the party. He struggles with AoE and Jump at Level 1. Initiative Control is a recurring challenge — cards skew 10–60. Comes fully online as a Damage Soak around Level 5, but needs creative play before then.",
      xp: [0,45,95,150,200,275,345,420,500],
      hp: [10,12,14,16,18,20,22,24,26]
    },
    luminary: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-luminary.png",
      matBack: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-luminary-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Glow",
          chipClass: "shackle-chip",
          text: "Persistent, non-Loss abilities that require element Consumption to function. You can activate them at any time during your turn, including during Move actions. You may only have one Glow active by default — each Glow discards when another is played. They produce a different element when first placed into your Active Area, so there is value in playing them even without intent to activate."
        },
        {
          label: "Mechanic",
          chip: "Scuttle",
          chipClass: "swing-chip",
          text: "Many Luminary AoE cards depict black hexes. After performing the attack, you may Move 1 into any depicted black hex — if you do, you infuse a specific element for free. The black hex must be empty and reachable. You resolve Attacks first so you always have full information before deciding whether to Scuttle."
        }
      ],
      role: "Luminary is a Lurker frontliner with 11 cards and high HP (10 at Level 1). Uses Fire, Ice, Dark, and Light extensively. Moderately complex but plays smoothly for players comfortable with element cycling. Two distinct build paths — Bruiser/Scuttle (AoE damage) and Glow/Support (heal, shield, strengthen). Fair to say it's fairly durable, but far from a definitive tank.",
      xp: [0,45,95,150,200,275,345,420,500],
      hp: [10,12,14,16,18,20,22,24,26]
    },
    chieftain: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-chieftain.png",
      matBack: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-chieftain-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Mount",
          chipClass: "shackle-chip",
          text: "End your Move action in a hex occupied by a Summon you own to Mount it. While Mounted, the Summon provides you free movement — it moves on its turn and you ride along. Mounted Summons are under your control: you control both your action and the Summon's action each turn. You and the Summon occupy the same hex for targeting purposes."
        },
        {
          label: "Mechanic",
          chip: "Command",
          chipClass: "swing-chip",
          text: "Command abilities let you order a Summon to perform Move and/or Attack actions with you controlling the ability — you choose the targets and path. This is how you prevent Summons from doing dangerous things like walking into traps or attacking high-Retaliate enemies."
        }
      ],
      role: "Orchid Chieftain is a 10-card, Medium HP (8 at Level 1) Summoner class focused entirely around Mounts. She calls unique Summons with a special classification called Mounts — mountable animals you can ride around battle, freeing up your Bottom actions for utility while your Mount attacks. She recovers Lost Summon cards with Resurrection, making her more sustainable than typical Summoners. Uses Earth element moderately. Extremely strong XP generation.",
      xp: [0,45,95,150,210,275,345,420,500],
      hp: [8,9,11,12,14,15,17,18,20]
    },
    hierophant: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-hierophant.png",
      matBack: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-hierophant-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Prayer Cards",
          chipClass: "shackle-chip",
          text: "The Hierophant gives special Prayer ability cards to allies. These don't count against the Hierophant's hand size. Allies add them to their own hands for extra stamina and useful effects. All Prayers can be used for basic Attack 2/Move 2, but cannot be burned to prevent damage (with one exception: Lamentation). All have Initiative 50."
        },
        {
          label: "Mechanic",
          chip: "Burn Economy",
          chipClass: "swing-chip",
          text: "At level 5, Spiritual Gains lets the Hierophant place a token every time they play a burn card. On a Long Rest, spend a token to skip losing a card. This dramatically extends stamina and makes burn cards far less costly — enabling 5–6 burn plays per scenario without running out of cards."
        }
      ],
      role: "The Hierophant is an 11-card ranged class with the smallest HP pool. Almost all attacks are ranged, keeping them safe despite low health. Two viable paths: a Damage/Battle-Priest build that leverages burn cards, curse synergy, and Spiritual Gains for high damage output; and a Support build focused on Prayer distribution, heals, and shields. Becomes a powerhouse at Level 5 (Spiritual Gains) and again at Level 9 (Bringer of Miracles).",
      xp: [0,45,95,150,200,275,345,420,500],
      hp: [6,7,9,10,12,13,15,16,18]
    },
    hollowpact: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-hollowpact.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-hollowpact-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Void Energy",
          chipClass: "shackle-chip",
          text: "Void Energy accumulates as you use your abilities (cap: 3). It must be spent via abilities or you suffer penalties — at 2 unspent Void you gain Muddle, at 3 you gain Wound at the end of your turn. Managing this resource is the central challenge of the class. Void Energy generates immediately (unlike standard elements which generate at end of turn)."
        },
        {
          label: "Mechanic",
          chip: "Voidsight",
          chipClass: "swing-chip",
          text: "Look at the top 2 cards of your attack modifier deck. You may place one on the bottom; the remaining card(s) can be put back in any order. This is much more streamlined than the Diviner's version — it lets you guarantee strong hits on key turns, and purge unwanted modifiers before they cause problems."
        }
      ],
      role: "The Savvas Hollowpact is a 10-card, medium-low HP (7hp at Level 1) class that blends Melee and Ranged abilities with Teleport actions. Unique Void Energy functions like an element that only powers the Hollowpact's own abilities and generates immediately rather than at end of turn. Void Pit obstacles created by many abilities become increasingly central to the class's power at higher levels. A complex class with significant upsides and downsides built into many effects — one of the most complex of the starter Crimson Scales classes.",
      xp: [0,45,95,150,200,275,345,420,500],
      hp: [7,8,10,11,13,14,16,17,17]
    },
    starslinger: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-starslinger.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-starslinger-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Hex Patterns",
          chipClass: "shackle-chip",
          text: "The Starslinger's AoE abilities feature dual-color hex patterns. Red hexes target enemies; yellow hexes affect allies — providing free movement, invisibility, or small heals. The milestone requires triggering both simultaneously in a single action 10 times. Executing the full combo requires upfront ally coordination and works best with a front-liner who can reliably occupy yellow support hexes. The class innovated this ally-targeting hex pattern before Frosthaven's Bannerspear."
        },
        {
          label: "Mechanic",
          chip: "Full Health",
          chipClass: "swing-chip",
          text: "Many of the Starslinger's most powerful abilities gain bonus damage and/or Advantage when at maximum HP. With a starting health of only 6, this creates a strong incentive for self-preservation over damage absorption. The class supports this through excellent initiative spread (6–90), two pseudo-invisibility modes ('Invisibility Minus' that prevents enemy focus and 'Invisibility Plus' via Lost in the Stars that removes the class from the board entirely), and Light/Dark element management for attack augmentation."
        }
      ],
      role: "The Aesther Starslinger is a fragile 10-card class that heavily rewards maintaining full health. It focuses on healing allies while performing CC or AoE attacks, combining simultaneous enemy damage and ally support through positional hex patterns. The class can be played almost entirely independently through self-preservation and non-loss pseudo-invisibility, or coordinate deeply with allies for maximum hex-pattern payoffs. Excellent initiative spread gives outstanding turn-order control. A class that suits experienced and inexperienced players alike — simple when played independently, deeply satisfying when the hex combos land.",
      xp: [0,45,95,150,210,275,345,420,500],
      hp: [6,7,8,9,10,11,12,13,14]
    },
    brightspark: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-brightspark.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-brightspark-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Persistent Tracks",
          chipClass: "shackle-chip",
          text: "Several Brightspark cards have persistent ability tracks — charge-based effects that stay in play for multiple activations offering healing, conditions, and attacks with advantage. Completing ALL charges counts toward the milestone (10 times). The 11-card hand is uniquely suited to holding multiple persistent cards in the active area simultaneously while still having stamina to spare. Key: leaving persistent cards active reduces effective hand size for the next rest cycle — balance XP gain against stamina needs."
        },
        {
          label: "Mechanic",
          chip: "Wild Element",
          chipClass: "swing-chip",
          text: "Elemental generation is light early on but grows across all elements at higher levels, with Wind and Light as primary focuses. The class can go Invisible — a rare and powerful survivability tool for the fragile 8-HP frame. Many cards offer dual-use top/bottom options letting you pivot between crowd control (push/pull) and buffing/healing. The wild element perk ('consume wild to add +2 Attack') is the class's signature modifier; the triple-checkbox makes it the highest-priority perk to complete."
        }
      ],
      role: "The Human Brightspark is a versatile scientist who makes use of interesting 'experimental' persistent losses and charge-based persistent trackers to introduce cool combinations that can be played without losing the card. Intensely packed with scientific flavor, players can take the role of high damage output, boost teammates with various support actions, or create a hybrid of DPS/support. With a deep 11-card hand but fragile 8 HP, the Brightspark manipulates the battlefield with powerful chemical concoctions, buffs, and ranged attacks rather than engaging in melee. The toolkit feel — Invisible, Immobilize, Poison, Disarm, Stun, Muddle, Heal, Pierce, elemental generation — makes it superb for new players and scenario-to-scenario hand customization.",
      xp: [0,45,95,150,210,275,345,420,500],
      hp: [8,9,11,12,14,15,17,18,20]
    },
    bombard: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-bombard.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-bombard-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Projectile",
          chipClass: "shackle-chip",
          text: "Place a Projectile token on a specific hex during your turn. At the START of your next turn — before normal actions — if an enemy is still standing on that hex, the Projectile detonates. Critical rule: if an enemy's initiative is higher than yours next round, they move before detonation and the hit is lost. This creates a double-turn effect when detonation and a standard attack fire in the same round. The class is played as a hybrid of three styles — Projectile DPS, AoE damage, and Tanking — with the Projectile mechanic being the most distinctive and planning-intensive of the three."
        },
        {
          label: "Mechanic",
          chip: "Shield & Control",
          chipClass: "swing-chip",
          text: "The Bombard has high HP and strong Shield cards for a ranged class, allowing it to sustain hits while deploying Projectiles at close range. Shield options are tailored for melee OR ranged attacks — not both — so read the enemy composition carefully. Movement is limited compared to other ranged classes; the primary movement mechanic involves latching onto enemies with the Grappling Hook and pulling toward them rather than moving freely. Ranged Retaliate is a situational standout for punishing enemies that shoot at you."
        }
      ],
      role: "The Quatryl Bombard belongs to a special force squad tasked with defending Gloomhaven, using military skills and advanced machinery as mercenaries. It is a 9-card ranged tank with high HP, played as a hybrid of three playstyles: Tanking (sustained durability through Shields and Retaliate), DPS with Projectiles (delayed detonation creating devastating double-turns), and ranged AoE damage. Limited movement is a key constraint — the class offsets this by latching onto enemies with a grappling hook and pulling itself toward them rather than moving normally. Players must plan carefully and act strategically to maximize Projectile effectiveness while balancing damage output against damage mitigation.",
      xp: [0,45,95,150,210,275,345,420,500],
      hp: [10,12,14,16,18,20,22,24,26]
    },
    mirefoot: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-mirefoot.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-mirefoot-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "Upgraded Conditions",
          chipClass: "shackle-chip",
          text: "The Mirefoot applies enhanced versions of standard conditions — Wound 2 and Poison 3 being the primary examples. These are multiplicative: Poison 3 adds +3 Attack (not +1) to every Attack Action against the target, and Wound 2 deals 2 True Damage at the start of each turn instead of 1. The Mirefoot's raw Attack values are deliberately low to compensate for this extraordinary damage output."
        },
        {
          label: "Mechanic",
          chip: "Difficult Terrain",
          chipClass: "swing-chip",
          text: "Many Mirefoot abilities place and utilize Difficult Terrain hexes. A Difficult Terrain hex can be occupied by a figure but cannot have any other overlay tiles (traps, obstacles). Most terrain placements are optional. Terrain is a great tactical asset against low-Move enemies and powers several ability effects that require the target or yourself to be on it."
        }
      ],
      role: "The Quatryl Mirefoot is a 10-card, low-health (6hp at Level 1) DPS/Assassin class with strong similarities to both the Mindthief and Scoundrel. It wants to dash in and out of combat, apply devastating upgraded conditions, and leverage excellent Initiative control to stay safe. Gains power in higher player counts. Struggles significantly against Retaliate and high-Shield enemies, though upgraded Poisons help counteract Shields. A class where every card in the starting hand is viable — strong design with no obvious dead weight.",
      xp: [0,45,95,150,200,275,345,420,500],
      hp: [6,8,9,11,12,14,15,17,18]
    },
    fireknight: {
      matFront: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-fire-knight.png",
      matBack:  "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-fire-knight-back.png",
      mechanics: [
        {
          label: "Unique mechanic",
          chip: "The Ladder",
          chipClass: "shackle-chip",
          text: "The Fire Knight carries a unique Ladder token that acts as an impassable obstacle for enemies while allowing you and your allies to traverse the map unhindered. Drop it in chokepoints and enemies are forced to walk around it, severely disrupting their AI pathing. The Ladder also provides combat bonuses when you are on or adjacent to it, and the class milestone is directly tied to using it actively — placing your Ladder token and ending your turn on it during the same turn, 10 times."
        },
        {
          label: "Mechanic",
          chip: "Support & Adjacency",
          chipClass: "swing-chip",
          text: "The Fire Knight specializes in granting Strengthen and Heal actions to the crew, and synergizes effectively with Fire elements to empower ranged attacks and team protections. Many of the best persistent abilities and attack bonuses in your kit rely on being adjacent to an ally — standing just behind or right next to your front-line teammates lets you soak incidental damage while boosting their stats. Persistent non-Loss buffs like Crew Integrity reward this positioning with ongoing value round after round."
        }
      ],
      role: "The Valrath Fire Knight is a dynamic mid-complexity mercenary who acts as a battlefield protector and support engine. The class shines through positioning — staying adjacent to allies triggers defensive buffs, heals, and enhances your own attacks. You are not a pure tank with zero offensive capability, nor a squishy backline sniper; you excel at standing just behind or right next to your front-line teammates. Designed by a real-life firefighter, the class blends a Vanguard-Support identity with a Fire Mastery damage engine that ramps up significantly after Level 5. Convenient Initiative spread makes it easy to play despite a modest starting health pool.",
      xp: [0,45,95,150,210,275,345,420,500],
      hp: [9,10,12,14,16,17,19,21,23]
    },
  };

  function renderOverview() {
    const ov = CLASS_OVERVIEW[state.activeClass];
    if (!ov) return;

    // Update mat images
    const matFront = document.getElementById("mat-img-front");
    const matBack  = document.getElementById("mat-img-back");
    if (matFront) matFront.src = ov.matFront || "";
    if (matBack)  matBack.src  = ov.matBack  || "";

    // Reset mat flip to front on class switch
    const matCard = document.getElementById("mat-flip-card");
    if (matCard) matCard.classList.remove("flipped");

    const mechBlocks = document.querySelectorAll(".info-block");
    if (mechBlocks.length >= 4) {
      // Block 0: mechanic 1
      const m0 = ov.mechanics[0];
      mechBlocks[0].querySelector(".info-block-label").innerHTML =
        '<span class="mechanic-chip ' + m0.chipClass + '">' + m0.label + '</span> ' + m0.chip;
      mechBlocks[0].querySelector("p").textContent = m0.text;

      // Block 1: mechanic 2
      const m1 = ov.mechanics[1];
      mechBlocks[1].querySelector(".info-block-label").innerHTML =
        '<span class="mechanic-chip ' + m1.chipClass + '">' + m1.label + '</span> ' + m1.chip;
      mechBlocks[1].querySelector("p").textContent = m1.text;

      // Block 2: role
      mechBlocks[2].querySelector("p").textContent = ov.role;

      // Block 3: XP table
      const xpRow = document.querySelectorAll(".xp-row:not(.header)")[0];
      const hpRow = document.querySelectorAll(".xp-row:not(.header)")[1];
      if (xpRow && hpRow) {
        const xpCells = xpRow.querySelectorAll("span");
        const hpCells = hpRow.querySelectorAll("span");
        ov.xp.forEach((v, i) => { if (xpCells[i+1]) xpCells[i+1].textContent = v; });
        ov.hp.forEach((v, i) => { if (hpCells[i+1]) hpCells[i+1].textContent = v; });
      }
    }
  }



  // ===== BUILDS DATA =====
  const CLASS_BUILDS = {
    chainguard: {
      perksDesc: "Tap a checkbox to mark a perk as taken. Perks reinforce the class themes: Shackle, Shields, Retaliate, Wound, and Traps. Remove -1 cards first, then prioritize rolling modifiers.",
      builds: [
        {
          id: "bruiser",
          icon: "⚔",
          iconClass: "bruiser-icon",
          name: "Bruiser build",
          tagline: "Shields, Retaliate, raw melee damage",
          btnClass: "bruiser-btn",
          desc: "Shackle a target, then attack it repeatedly for stacking bonus damage. Use Shields and Retaliate to survive incoming hits. The most straightforward path — strong from Level 1 with cards that clearly serve a single purpose.",
          playstyle: "Lead with Untouchable Keeper (Init 14) or Chokehold (Init 22) to establish Shackle early. Use Wrapped in Metal (Init 82) as your emergency Stun when something dangerous is about to activate. Stack Retaliate with Spiked Knuckles and perks to punish your Shackled target. Champion of Chains at Level 9 lets you Shackle three targets simultaneously — each getting Wound — fundamentally changing the class's threat level.",
          coreCards: [
            { name: "Chokehold", desc: "Shackle + stacking attack bonus (+7 damage over 3 hits)" },
            { name: "Follow the Chains", desc: "Attack 3 + repositioning, pairs well in rest cycles" },
            { name: "Wrapped in Metal", desc: "Unconditional Ranged Stun — your emergency brake" },
            { name: "Untouchable Keeper", desc: "Fastest card (Init 14), Shield + Heal 3 Self" },
            { name: "Locking Links", desc: "Persistent True Damage clock — great vs Shielded targets" },
            { name: "Merciless Beatdown", desc: "High-ceiling Loss Attack + forced enemy-on-enemy attack" },
          ],
          levelups: [
            { lvl: "2", text: "Iron Thrust — Jump + ally chain combos" },
            { lvl: "3", text: "Sweeping Collision — Pierce 2 for party + grounds Fliers" },
            { lvl: "4", text: "Double K.O. — two Attack 4s, Init 92" },
            { lvl: "5", text: "Impending Power — defensive capstone, good for both builds" },
            { lvl: "7", text: "Meteor Hammer — Disarm + Shield Ignore vs Shackled" },
            { lvl: "8", text: "Syndicated Assault — ally-chain AoE, Attack 9–15" },
            { lvl: "9", text: "Champion of Chains — 3 Shackles + Wound on each" },
          ],
        },
        {
          id: "trap",
          icon: "⚙",
          iconClass: "trap-icon",
          name: "Trap build",
          tagline: "True Damage, Shackle-delivery, Shield bypass",
          btnClass: "trap-btn",
          desc: "Place traps, Shackle a nearby enemy, then force or lure it through them. Traps deal True Damage — bypassing Shields entirely. More setup-dependent than Bruiser but scales better against high-armor enemies.",
          playstyle: "Place a trap adjacent to you, establish Shackle, then use Pull abilities (Latch and Tow, Titanic Chainwhip) to drag the target through it. Latch and Tow top combo makes traps deal minimum 5 True Damage + Muddle. Dizzying Release + Latch and Tow is your signature combo: 7 True Damage, Wound, Muddle, 2 XP in one round. Impending Power at Level 5 extends trap placement to Range 2 and adds 2 bonus damage whenever you trigger one.",
          coreCards: [
            { name: "Locking Links", desc: "Bottom 2-damage Trap — always better than Bottom Attack 2" },
            { name: "Rusty Spikes", desc: "3-dmg Poison Trap + Move 2 Shackle, fast Init 18" },
            { name: "Latch and Tow", desc: "Pull into trap for +3 True Damage + Muddle + XP" },
            { name: "Dizzying Release", desc: "Wound Trap — 7 True Damage combo with Latch and Tow" },
            { name: "Impending Power", desc: "Range 2 trap placement + 2 bonus damage on spring" },
            { name: "Clamping Snare", desc: "First AoE Trap — 5 True Dmg + Muddle + 2 splash" },
          ],
          levelups: [
            { lvl: "2", text: "Latch and Tow — core trap-trigger Pull card" },
            { lvl: "3", text: "Sweeping Collision — Pierce 2 + grounds Fliers" },
            { lvl: "4", text: "Dizzying Release — Wound Trap combo centerpiece" },
            { lvl: "5", text: "Impending Power — near-mandatory for Trap builds" },
            { lvl: "7", text: "Clamping Snare — first AoE Trap" },
            { lvl: "8", text: "Pivot and Smash — Swing + trap trigger + Jump" },
            { lvl: "9", text: "Unending Torment — double Trap damage victory lap" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Untouchable Keeper", desc: "Fastest card (Init 14) and only self-Heal at Level 1. Almost never cut." },
        { name: "Wrapped in Metal", desc: "Unconditional Ranged Stun + Shackle. Repeatedly saves the party on key turns." },
        { name: "Impending Power (Lvl 5)", desc: "Top serves Bruisers (Shield/Heal), Bottom serves Trap builds (range + bonus damage)." },
        { name: "Sweeping Collision (Lvl 3)", desc: "Pierce 2 for everyone + grounds Fliers. Addresses both builds' core weaknesses." },
      ],
    },
    luminary: {
      perksDesc: "Tap a checkbox to mark a perk as taken. The Luminary has solid perk utility but lacks raw damage upgrades — every single perk caps out at +0. This lowers average Attack values slightly but adds elemental Infusion, healing, and utility. Remove -1 cards first, then prioritize Infuse replacements.",
      builds: [
        {
          id: "bruiser",
          icon: "⡠",
          iconClass: "bruiser-icon",
          name: "Bruiser / Scuttle build",
          tagline: "AoE attacks, Scuttle positioning, element consumption",
          btnClass: "bruiser-btn",
          desc: "Focus on AoE Attack cards with element consumption bonuses. Scuttle into black hexes to generate elements for free after your attack. Chain Dark → Stun and Fire → Wound for consistent conditions against grouped enemies.",
          playstyle: "Lead with Radiant Glare (Move 2 Infuse Dark) or Flickering Lights (Init 19) to establish element generation. Use Chilling Wave Top to Stun key targets with Dark Consumption. Scuttle after attacks to generate secondary elements — you resolve the attack first so you always have full information before Scuttling. Darkened Overcast at Level 2 is a cornerstone — Initiative 10 quasi-Invisibility that also generates Dark. Blackened Rage at Level 3 gives the AoE Immobilize this build wants.",
          coreCards: [
            { name: "Chilling Wave", desc: "Attack 3 + Dark Stun AoE — workhorse attack at Level 1" },
            { name: "Flickering Lights", desc: "Attack 3 AoE, generates up to 4 elements, Heal 2 Loot bottom" },
            { name: "Shimmering Scuttle", desc: "Fast Init 21, Attack 2 AoE + Fire Scuttle" },
            { name: "Darkened Overcast (Lvl 2)", desc: "Init 10 quasi-Invisibility + Disadvantage + Dark generation" },
            { name: "Blackened Rage (Lvl 3)", desc: "AoE Attack + Dark Immobilize, Scuttle Fire — signature Bruiser card" },
            { name: "Colorful Wavelengths (Lvl 5)", desc: "Attack 5 with all-element conversion — class vision capstone" },
          ],
          levelups: [
            { lvl: "2", text: "Darkened Overcast — Init 10, quasi-Invisibility + Dark generation" },
            { lvl: "3", text: "Blackened Rage — AoE Immobilize + Fire Scuttle" },
            { lvl: "4", text: "Floodlight — Jump Scuttle Attack 4 Poison + ally Heal" },
            { lvl: "5", text: "Colorful Wavelengths — Attack 5 all-element conversion capstone" },
            { lvl: "6", text: "Imposing Brilliance — condition AoE + multi-element bottom" },
            { lvl: "7", text: "Gamma Energy — Glow AoE 2 True Damage + Ranged Loss" },
            { lvl: "9", text: "Blazing Pincers — Attack 8-12 Wound, or Light the Way (Summon + Ranged)" },
          ],
        },
        {
          id: "support",
          icon: "✨",
          iconClass: "trap-icon",
          name: "Glow / Support build",
          tagline: "Persistent Glows, party Heals, Shields, Strengthen",
          btnClass: "trap-btn",
          desc: "Deploy Glow persistent abilities to Heal, Shield, and Strengthen allies each turn. Pair Glow Tops with Move 2 Infuse Bottoms to generate the elements your Glows need. More party-dependent but excels in long attrition fights.",
          playstyle: "Set up your active Glow on Turn 1 or between rooms. Soft Glow (Strengthen, Init 24) and Radiant Glare (Dark, Init 36) are your best early Glows. Each rest cycle, recover your Glow and re-deploy. Be aware you can only have one Glow active by default — Drawn into the Light (Milestone M card) upgrades this to two. The Support build really comes online at Level 5-7 when Gamma Energy and better Glow payoffs become available.",
          coreCards: [
            { name: "Radiant Glare", desc: "Glow Immobilize (Light) + Move 2 Infuse Dark — best bottom at Level 1" },
            { name: "Soft Glow", desc: "Glow Strengthen allies (Dark) + Move 2 Infuse Light, fast Init 24" },
            { name: "Frosty Glimmer", desc: "Heal 2 Range 3 with Dark extra target + Move 3 Jump with Ice" },
            { name: "Luminescence (Lvl 2)", desc: "Glow Heal 2 all allies (Ice) + Move 4 Heal 3 Self with Ice" },
            { name: "Shadow Claws (Lvl 5)", desc: "Glow Dark Muddle AoE + Advantage vs Muddled" },
            { name: "Encompassing Aura (Lvl 6)", desc: "Shield/Retaliate all allies AoE + Immobilize/Wound bottom" },
          ],
          levelups: [
            { lvl: "2", text: "Luminescence — Glow party Heal + Move 4 Heal 3 Self" },
            { lvl: "3", text: "Shining Diversion — Glow Shield allies (Light) + Move 5 Muddle" },
            { lvl: "4", text: "Empowering Rays — Strengthen + AoE Attack, Poison on next Glow" },
            { lvl: "5", text: "Shadow Claws — Glow Muddle AoE + Advantage on attacks" },
            { lvl: "6", text: "Encompassing Aura — AoE Shield/Retaliate, Init 11" },
            { lvl: "7", text: "Gamma Energy — first big Glow AoE damage payoff" },
            { lvl: "9", text: "Light the Way — Glow Summon + Persistent Loss Move 4" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Radiant Glare", desc: "Best Level 1 card for both builds — Glow Top and Move 2 Infuse Dark bottom. Never cut." },
        { name: "Flickering Lights", desc: "Fastest Initiative (19), generates up to 4 elements, Heal 2 Loot self bottom with Wild Element rider." },
        { name: "Solid Light (Level X)", desc: "Init 12 is your best Initiative at Level 1. Move 3 Jump with Ice is excellent for positioning." },
        { name: "Gamma Energy (Lvl 7)", desc: "Good for both builds — Glow AoE True Damage Top and Ranged multi-target Loss Bottom." },
      ],
    },
    chieftain: {
      perksDesc: "Tap a checkbox to mark a perk as taken. Prioritize the -1 to +0 Poison and -1 to +0 Heal Summoned Ally perks first. Then grab rolling Pierce 2 perks — Retaliate enemies are a serious problem. The +X Summon Count perk scales very well in late game.",
      builds: [
        {
          id: "dps",
          icon: "⚔",
          iconClass: "bruiser-icon",
          name: "DPS Chieftain",
          tagline: "Mounted attack combos, high personal damage",
          btnClass: "bruiser-btn",
          desc: "Focus on maximizing the Chieftain's own damage output while Mounted. Stack Positive Reinforcement (+1 Attack mounted), Piercing Darts Bottom Pierce bonus, and One With Nature for devastating melee attacks that scale with Earth consumption.",
          playstyle: "Mount the Speedy Ostrich or Fighting Bull for Initiative control and free movement. Stack Piercing Darts Bottom (active while mounted) with Ceremonial Dance for Attack 4 Pierce 1 Target 3 Muddle. At Level 5 add Positive Reinforcement as a Persistent Loss to push all your attacks up. One With Nature at Level 6 becomes Attack 6-7 with Earth — your signature big hit. Strapping Bullwhip at Level 7 pairs with One With Nature for Attack 9 Pierce 2. You'll output massive damage while your Black Panther tanks hits with Disadvantage on all attacks.",
          coreCards: [
            { name: "Piercing Darts", desc: "+1 Attack Pierce 1 mounted — scales incredibly as you level" },
            { name: "Resurrection", desc: "Recover 3 lost cards — the class's lifeline, near-mandatory" },
            { name: "Catastrophic Cattle", desc: "Fighting Bull — most reliable general Mount with Attack 2" },
            { name: "Ceremonial Dance (Lvl 2)", desc: "Attack 2 Target 3 Muddle — combos with Piercing Darts Bottom" },
            { name: "Positive Reinforcement (Lvl 5)", desc: "Persistent +1 Attack while mounted — transforms all your attacks" },
            { name: "One With Nature (Lvl 6)", desc: "Attack 4/6 with Earth — your signature big hit card" },
          ],
          levelups: [
            { lvl: "2", text: "Ceremonial Dance — Attack Target 3 Muddle, group Move bottom" },
            { lvl: "3", text: "Take the Reins + Agile Predator — both are near-unanimous picks" },
            { lvl: "4", text: "Spiked Muzzle — persistent +2 Mount attacks, or War Paint" },
            { lvl: "5", text: "Positive Reinforcement — persistent +1 Attack while mounted" },
            { lvl: "6", text: "One With Nature — Attack 4/6 with Earth, Move 5 Infuse Earth" },
            { lvl: "7", text: "Strapping Bullwhip — AoE Attack + mounted Pierce 2 burst" },
            { lvl: "8", text: "Majestic Mass — War Elephant Attack 3 AoE, Mount 4 bottom" },
            { lvl: "9", text: "Master the Reins or Regal Beast — both excellent for either build" },
          ],
        },
        {
          id: "tank",
          icon: "🛡",
          iconClass: "trap-icon",
          name: "Summon Tank",
          tagline: "Multiple summons, damage absorption, party support",
          btnClass: "trap-btn",
          desc: "Field multiple Summons simultaneously to absorb hits for the party. Use Sucker Punch and War Paint to redirect damage, Soul Whisperer to Heal your Summons, and Medicine Shield for emergency healing. Sacrifice individual damage output for exceptional party survivability.",
          playstyle: "Keep 2 Summons out most of the time — one to Mount, one to tank hits. The Giant Tortoise is your go-to early tank Mount with 6 HP and Shield 1. Use Sucker Punch Bottom to absorb hits your Mount would take. War Paint at Level 4 is essential — it makes enemies focus you before your Mount, and lets you act before your Mount to kill threats before they can attack it. The Pack Mule X card provides free Heal 2 each round. At Level 7 the Battle Rhinoceros with Shield 1 (plus Shield 1 for you while Mounted) makes the whole setup extremely durable.",
          coreCards: [
            { name: "Sucker Punch", desc: "Fastest Init (14) — Immobilize top, absorb Summon damage bottom" },
            { name: "Soul Whisperer", desc: "Command + Heal 2 all Summons — keep your beasts alive" },
            { name: "Slow and Steady", desc: "Giant Tortoise — 6HP Shield 1, tankiest early Mount" },
            { name: "Prepared Rations (X)", desc: "Pack Mule — free Heal 2 Self each round while mounted" },
            { name: "Medicine Shield (Lvl 2)", desc: "Heal 3 Range 3 with Earth, Shield 2 Heal 1 all allies Loss" },
            { name: "War Paint (Lvl 4)", desc: "Enemy focus redirect + act before your Mount — near-mandatory" },
          ],
          levelups: [
            { lvl: "2", text: "Medicine Shield — Heal 3 Range 3, Shield 2 all allies emergency" },
            { lvl: "3", text: "Take the Reins + Agile Predator — both picks for tank too" },
            { lvl: "4", text: "War Paint — quasi-Invisibility + focus redirect, near-mandatory" },
            { lvl: "5", text: "Chest Thumper — Lowland Gorilla 7HP Jump, Strengthen bottom" },
            { lvl: "6", text: "Venomous Mayhem — Snake Poison/Immobilize, Attack 3 Poison bottom" },
            { lvl: "7", text: "Impervious Armor — Battle Rhino Shield 1 + you get Shield 1 mounted" },
            { lvl: "8", text: "Tribal Blessing — Heal 5 Bless, Move 4 Heal 3 Range 3 bottom" },
            { lvl: "9", text: "Master the Reins or Regal Beast — both excellent for either build" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Resurrection", desc: "The class-defining card. Recover 3 Lost Summons. Never cut before Level 9." },
        { name: "Sucker Punch", desc: "Fastest Initiative (14). Immobilize top + damage absorption bottom. Near-mandatory." },
        { name: "Soul Whisperer", desc: "Command your Mount's full Move+Attack + Heal 2 all Summons. Essential." },
        { name: "Take the Reins (Lvl 3)", desc: "Attack+1 Command (Mounted: +2 Attack). Both builds want this. Agile Predator also near-unanimous." },
      ],
    },
    hierophant: {
      perksDesc: "Remove −1 cards first (highest priority), then: Replace +1s with +0 Curse ×2, Replace +0s with rolling Light, Replace +0s with rolling Earth, Ignore negative scenario effects + remove +0, Replace +1s with +3 ×2, Start each scenario with a Bless (skip if using Bringer of Miracles bottom), Replace −2 with 'give ally a Prayer' + +0, Replace last +0 with Shield 1 Ally, Add +1 Wound/Muddle ×2, Add rolling Heal 1 ×2.",
      builds: [
        {
          id: "damage",
          icon: "🔥",
          iconClass: "bruiser-icon",
          name: "Damage / Battle Priest",
          tagline: "Burn economy, curse synergy, Spiritual Gains engine",
          btnClass: "bruiser-btn",
          desc: "Play Spiritual Gains on turn 1 to unlock free burn cards each rest cycle. Use Sacred Death to replay burn attacks. Load the enemy deck with Curses. Hit level 9 for Bringer of Miracles' permanent Advantage and second ×2.",
          playstyle: "Turn 1: play Spiritual Gains (persistent) and a fast attack. Each burn card you play earns a Spiritual Gains token — on Long Rest, spend a token to skip losing a card. Sacred Death bottom lets you replay burn-card bottoms this turn; combine with Curious Pendant for a third use of Soul Strike or Divine Allegiance. Sit right behind your melee allies — most attacks have short range or adjacency requirements. Build toward 3–5 curses in the enemy deck via perks and Orb of Despair so Muddle becomes devastating and Unruly Repentance triggers fast.",
          coreCards: [
            { name: "Spiritual Gains", desc: "Persistent: burn cards earn tokens → skip card loss on Long Rest. ENGINE." },
            { name: "Sacred Death", desc: "Burn Attack 3, then replay a burn-card bottom this turn." },
            { name: "Soul Strike", desc: "Burn Attack 4, Pierce 3, Wound — feeds Sacred Death. Stays to level 9." },
            { name: "Faith Calling", desc: "Enhanced bottom: Attack 1 double-Curse. Init 10 is your fastest card." },
            { name: "Bringer of Miracles", desc: "Level 9: permanent Advantage + permanent ×2. Play turn 1 every scenario." },
            { name: "Divine Allegiance (Lvl 2)", desc: "Multi-target burn attack — third Sacred Death fuel source." },
          ],
          levelups: [
            { lvl: "2", text: "Divine Allegiance — multi-target burn, feeds Sacred Death" },
            { lvl: "3", text: "Prosperous Concord (X card) — only repeatable Light source" },
            { lvl: "4", text: "Rooted Subjugation — Attack 3 Pierce 3, core damage card" },
            { lvl: "5", text: "Spiritual Gains — mandatory engine card, play turn 1 every scenario" },
            { lvl: "6", text: "Chains of Light — effective Attack 6+ with stun" },
            { lvl: "7", text: "Revered Protector — Initiative 15, Shield top + Move 4 Jump" },
            { lvl: "8", text: "Vengeful Veneration — effective Attack 6, Range 4" },
            { lvl: "9", text: "Bringer of Miracles — permanent Advantage + ×2, play turn 1" },
          ],
        },
        {
          id: "support",
          icon: "🙏",
          iconClass: "trap-icon",
          name: "Support / Prayer Focus",
          tagline: "Prayer distribution, heals, shields, ally buffs",
          btnClass: "trap-btn",
          desc: "Maximise Prayer distribution and keep allies healthy and shielded. Give out Prayers liberally for extra stamina. Use heals, ward abilities, and shield cards to dramatically reduce incoming damage. Spiritual Gains is still strong for its emergency bottom.",
          playstyle: "Focus on cards with Prayer triggers: Inspired Remedy top, Vocal Sermon bottom, Harsh Rebuke top, Faith Calling top (if only one ally). Keep Inspired Remedy or Oak's Embrace in hand for consistent healing. Oak's Embrace top gives two ward charges — functionally 3–5 damage mitigation at low levels. Weakened Will bottom (Disadvantage on all enemy attacks) is extremely powerful on turns when lots of incoming damage is expected. At level 9, Expansive Permanence bottom gives the whole team +2 Attack and enemies −2 Attack — massive swing.",
          coreCards: [
            { name: "Faith Calling", desc: "Shield 1 all allies + Prayer if only one ally. Init 10." },
            { name: "Inspired Remedy", desc: "Heal 3 top with Prayer trigger at half HP. End-of-turn Heal 1 bottom." },
            { name: "Oak's Embrace", desc: "Two ward charges within Range 3. Only Move 4 until level 5." },
            { name: "Vocal Sermon", desc: "Best Prayer trigger — Move 3 Jump bottom, give Prayer to ally moved through." },
            { name: "Uplifting Ascension (M)", desc: "Heal 3 / Invisibility card from milestone. Main Earth consumer mid-game." },
            { name: "Expansive Permanence (Lvl 9)", desc: "Team +2 Attack all attacks + enemy −2 Attack. Huge in 4P." },
          ],
          levelups: [
            { lvl: "2", text: "Weakened Will — Disadvantage on all enemy attacks bottom, Init 20" },
            { lvl: "3", text: "Vital Bond — ally card recovery bottom, top swap + Muddle" },
            { lvl: "4", text: "Devout Assistance (Lvl 5 card) or hold for level 5" },
            { lvl: "5", text: "Devout Assistance — persistent element-to-Shield/Heal conversion" },
            { lvl: "6", text: "Unstoppable Force — Init 15, Shield top + Range 4 attack bottom" },
            { lvl: "7", text: "Righteous Atonement — ally card recovery burst, or Revered Protector" },
            { lvl: "8", text: "Two Allies Fight — grant allies Attack 3 each" },
            { lvl: "9", text: "Expansive Permanence — team +2/−2 attack swing, Init 10" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Faith Calling", desc: "Initiative 10 — your fastest card. Enhanced with Curse on bottom it's core for damage; Shield top is useful for support. Never cut." },
        { name: "Vocal Sermon", desc: "Best Prayer delivery (Move 3 Jump bottom) and team card recovery top. Both builds value this." },
        { name: "Uplifting Ascension (Milestone M)", desc: "Heal 3 / Invisibility card from milestone. Main Earth consumer mid-game. Competes with Inspired Remedy." },
        { name: "Sacred Death", desc: "Bottom card recovery is surprisingly useful even for support — lets you replay a discard's bottom action." },
      ],
    },
    hollowpact: {
      perksDesc: "The Hollowpact's perks follow its subtheme of upsides and downsides. Prioritise the effects that replace -2 and -1 cards with Rolling Void and Curse early — they thin the deck and add the resources your class wants (Dark and Void) with some nice added CC. The ignore negative scenario effects/gain +0 Ward Self perk felt good. The Voidsight perks get a lot better once you have a consistent source of Voidsight generation. The -2 Earth +2 Dark perk is interesting but the -2 Earth is quite a stinker for the majority of your career barring a party member who wants it.",
      builds: [
        {
          id: "bruiser",
          icon: "⚡",
          iconClass: "bruiser-icon",
          name: "Void Control",
          tagline: "Void Pits, Teleport, Stun and Voidsight",
          btnClass: "bruiser-btn",
          desc: "The primary build path — manipulate your attack modifier deck with Voidsight, create Void Pit obstacles to power your abilities, Teleport to stay safe, and offload Void via consumptions to avoid Muddle/Wound.",
          playstyle: "Lead with Touch of the Void (Init 29) or Find an Opening (Init 15) early. Use Void Step Bottom as your most reliable Void dump into Dark generation. Place Void Pits strategically — by Level 4-5 many abilities want them as targeting requirements. Voidsight before big attacks to guarantee hits on key turns. Stay mobile with Teleports; this class wants to hit and run. Manage Void carefully — spend before end of turn to avoid Muddle at 2 or Wound at 3.",
          coreCards: [
            { name: "Find an Opening", desc: "Initiative 15 — fastest card. Voidsight + Stun top. Sets up ally damage via Void Pits." },
            { name: "Untethered Advance", desc: "AoE Attack 4 top + Move 3 Create Void Pit bottom. Core Void Pit generator." },
            { name: "Withering Deluge", desc: "Bottom: Move 3 Create Void Pit — the primary setup card for this build." },
            { name: "Obliterate", desc: "Level 4 room-clearer — Attack 12-18 Disarm multiple targets, creates Void Pits on kills." },
            { name: "Implosion", desc: "Level 6 AoE Muddle payoff — fires from any adjacent Void Pit, no range limit." },
            { name: "Entropy Unleashed", desc: "Level 8 AoE Poison — Voidsight setup makes this consistently land on priority targets." },
          ],
          levelups: [
            { lvl: "2", text: "Shrouded Grasp (Init 23) — Pull enemy to Void Pit bottom; Top Dark Immobilize Invisibility" },
            { lvl: "3", text: "Majestic Malevolence (Init 89) — Top targets from Void Pits; best late Initiative period" },
            { lvl: "4", text: "Void-Enhanced Armory — fast Initiative Shield top; or Empowered Assault for Teleport/Stun" },
            { lvl: "5", text: "Obliterate (Init 13) — primary pick; room-turning Loss + great Push/Void Pit bottom" },
            { lvl: "6", text: "Implosion — AoE Muddle from Void Pits; essential payoff for this build's obstacle placement" },
            { lvl: "7", text: "Gateway to the Abyss — uncapped AoE Attack 4 Wound Loss + Push 5 bottom; core Void Pit payoff" },
            { lvl: "8", text: "Entropy Unleashed — AoE Poison with Voidsight setup; stronger pick for this build" },
            { lvl: "9", text: "No Escape — two Void Pits + huge Teleport bottom; or Prescient Voidmastery for multi-attack" },
          ],
        },
        {
          id: "trapbuild",
          icon: "🌑",
          iconClass: "trap-icon",
          name: "Dark/Teleport",
          tagline: "Dark element cycling, long-range Teleports, healing",
          btnClass: "trap-btn",
          desc: "Lean into Dark element generation and consumption — Heal + Regenerate, long Teleports, and Invisibility. Less Void Pit focused, more element cycling focused.",
          playstyle: "Use Borrowed Vitality and Hollow Embrace for early healing. Generate Dark via Void Step Bottom, Reaching Darkness, and Radiant Glare. Spend Dark on Touch of the Void Stun, Shrouded Grasp Invisibility, and Borrowed Vitality Regenerate. Nether Binding Bottom (Teleport 4-5 Heal 4 Infuse Dark) is your engine — it catapults you forward, heals an ally, and sets up the following turn.",
          coreCards: [
            { name: "Touch of the Void", desc: "Non-Loss Stun + Voidsight + Dark Infuse. Ran for entire career. Core of this build." },
            { name: "Void Step", desc: "Teleport 2 Attack top; Void-to-Teleport-4 Dark bottom. Most reliable Void dump." },
            { name: "Reaching Darkness", desc: "Attack 2 Range 5 Poison top — first enhancement target. Keeps you safe at range." },
            { name: "Nether Binding", desc: "Both builds — Bottom Teleport 4-5 Heal 4 Infuse Dark is the engine; Top creates Void Pit." },
            { name: "Enduring Darkness", desc: "Bottom Move 4 Heal Regenerate Infuse elements — great repeatable value action." },
            { name: "Sever Reality", desc: "Bottom Voidsight Teleport 3 Attack 2 Curse — value-packed setup for the following turn." },
          ],
          levelups: [
            { lvl: "2", text: "Nether Binding (Init 64) — both Top (Void Pit) and Bottom (Teleport 4-5 Heal 4 Infuse Dark) are excellent" },
            { lvl: "3", text: "Empowered Assault (Init 19) — Teleport Attack with Dark Stun bottom; upgrade over Void Step" },
            { lvl: "4", text: "Void-Enhanced Armory (Init 17) — fast Initiative, Shield top + Persistent +1 Attack on Void spend" },
            { lvl: "5", text: "Stalking Quarry (Init 14) — non-Loss flexibility; Move 4 Shield Infuse Dark bottom is excellent" },
            { lvl: "6", text: "Enduring Darkness — Move 4 Heal Regenerate Infuse elements; great repeatable bottom action" },
            { lvl: "7", text: "Ruinous Barrage — Bottom Attack 3 Immobilize Teleport 3 hit-and-run is perfect for this build" },
            { lvl: "8", text: "Tendrils of Night or Entropy Unleashed depending on party needs" },
            { lvl: "9", text: "Prescient Voidmastery — Voidsight multi-attack setup fits this build's focus on modifier manipulation" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Find an Opening", desc: "Initiative 15 — fastest card. Voidsight + Stun + party damage aura. Core for both builds." },
        { name: "Nether Binding", desc: "Top creates a Void Pit; Bottom Teleport 4-5 Heal 4 Infuse Dark. Excellent for both paths." },
        { name: "Nether Blades", desc: "Voidsight AoE Attack + Void generation top. Bottom Attack 2 Move 1 stayed relevant for a long time." },
        { name: "Stalking Quarry", desc: "Attack 4 with multiple Void sinks and best-in-class Bottom Move 4 Shield Infuse Dark." },
        { name: "Enervating Strike", desc: "Unconditional Attack + Heal top with Void spends. Reasonable Initiative for a slower-than-average class." },
      ],
    },
    starslinger: {
      perksDesc: "Perks are tracked and applied in Secretariat. The Starslinger's perks should reinforce its two core strengths: full-health attack bonuses (add rolling modifiers that trigger when at max health, remove negative cards) and the Light/Dark element engine (add rolling Light and Dark generators). Standard advice: remove -1 and -2 cards first to make the modifier deck more reliable — consistency is especially important for a class where a single bad draw when at full health feels especially costly.",
      builds: [
        {
          id: "dps",
          icon: "⭐",
          iconClass: "bruiser-icon",
          name: "Full Health DPS",
          tagline: "Self-preservation, full-health attack bonuses, fast initiative",
          btnClass: "bruiser-btn",
          desc: "Maximize the full-health attack bonus by staying at maximum HP as much as possible. Use pseudo-invisibility modes to avoid incoming damage, act with fast initiative to strike before dangerous enemies, and unleash the full-health Advantage/bonus damage on each turn. Can be played almost entirely independently of ally positioning.",
          playstyle: "Open with fast-initiative setup (Lost in the Stars 6, Force Field 9, Plasmatic Power 10) to establish positioning and protection before acting. Use Luminous Blitz (17) and Crashing Flare (26) as reliable fast-initiative non-Loss attacks. Save heavy Loss cards like Starstruck and Aligned Constellations for final rooms when full health can be maintained. Supernova is the core burst card — chain Diamond Rings (Light generation) into Supernova for the recommended opening.",
          coreCards: [
            { name: "Supernova", desc: "Level 1 initiative 30 — flagship burst card, chain after Diamond Rings for maximum effect." },
            { name: "Luminous Blitz", desc: "Level 1 initiative 17 — fastest non-Loss AoE attack, reliable every cycle." },
            { name: "Plasmatic Power", desc: "Level 5 initiative 10 — powerful Loss with major full-health bonus." },
            { name: "Absolute Magnitude", desc: "Level 6 initiative 20 — fast non-Loss attack showing true power at full health." },
            { name: "Pierce the Firmament", desc: "Level 9 initiative 33 — capstone DPS, non-Loss full-health peak damage." },
            { name: "Lost in the Stars", desc: "Level X initiative 6 — Invisibility Plus for guaranteed full-health setup." },
          ],
          levelups: [
            { lvl: "2", text: "Defying Gravity for mobility and escape to maintain full health" },
            { lvl: "3", text: "Shooting Stars for non-Loss AoE to add to the damage rotation" },
            { lvl: "4", text: "Equinox for AoE with Light/Dark balance payoff" },
            { lvl: "5", text: "Plasmatic Power — powerful full-health Loss for high-value turns" },
            { lvl: "6", text: "Absolute Magnitude — fast non-Loss true-brightness attack" },
            { lvl: "7", text: "Stone Meteorite — Loss capstone for maximum full-health damage" },
            { lvl: "8", text: "Sungaze for Light element consumption into full-health bonus" },
            { lvl: "9", text: "Pierce the Firmament — non-Loss capstone DPS" },
          ],
        },
        {
          id: "support",
          icon: "🌙",
          iconClass: "trap-icon",
          name: "Hex Pattern Support",
          tagline: "Ally positioning in yellow hexes, simultaneous attack/support, Light/Dark",
          btnClass: "trap-btn",
          desc: "Maximize the simultaneous ally support and enemy damage potential of the hex pattern cards. Coordinate with allies to occupy yellow support hexes for heals, movement, or invisibility while red hexes damage enemies. Deeply satisfying when it comes together — requires explicit pre-round communication with your party.",
          playstyle: "Coordinate with your front-liner before each round about which hex positions to occupy. Use Gravitational Flip (13) to reposition enemies into red hex zones. Earthshine (57) and Lucky Stars (74) provide support on turns when hex positioning isn't aligned. Crashing Flare and Shooting Stars are the workhorses of the combo rotation — reliable non-Loss cards that deliver both halves every cycle.",
          coreCards: [
            { name: "Crashing Flare", desc: "Level 1 initiative 26 — non-Loss hex pattern combo staple, available every cycle." },
            { name: "Earthshine", desc: "Level 1 initiative 57 — core support card for ally healing in hex pattern." },
            { name: "Gravitational Flip", desc: "Level X initiative 13 — repositions enemies into red hexes and allies into yellow." },
            { name: "Shooting Stars", desc: "Level 3 initiative 54 — reliable mid-game non-Loss hex combo." },
            { name: "Interplanar Voyager", desc: "Level 9 initiative 24 — non-Loss capstone AoE with full hex pattern support." },
            { name: "Blue Moon", desc: "Level 6 initiative 79 — powerful late-acting hex combo when positions are committed." },
          ],
          levelups: [
            { lvl: "2", text: "Defying Gravity for mobility to reach optimal hex positions" },
            { lvl: "3", text: "Shooting Stars — non-Loss hex pattern combo for the mid-game rotation" },
            { lvl: "4", text: "Wish Upon a Star for reliable ally buff when positioning doesn't align" },
            { lvl: "5", text: "Shifting Chasma for AoE terrain manipulation to reshape hex patterns" },
            { lvl: "6", text: "Blue Moon — high-value late-acting hex combo" },
            { lvl: "7", text: "Eonic Blast for reliable non-Loss AoE damage contribution" },
            { lvl: "8", text: "Sungaze for AoE hex pattern bottom at fast-medium initiative" },
            { lvl: "9", text: "Interplanar Voyager — non-Loss capstone combining AoE and full hex support" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Diamond Rings", desc: "Level 1 — essential Light generator and Turn 1 setup card for either build." },
        { name: "Solar Eclipse", desc: "Level 1 — non-Loss AoE top for consistent damage in any rotation." },
        { name: "Defying Gravity", desc: "Level 2 — mobility for either self-preservation (DPS) or hex positioning (Support)." },
        { name: "Deflection", desc: "Milestone reward — AoE top versatile for either build at medium initiative." },
      ],
    },
    brightspark: {
      perksDesc: "Take all three copies of the triple 'consume wild to add +2 Attack' perk first — this is the class's most powerful modifier and anchors the wild element economy. Follow with the double wild-generation perk (+2 generate wild) for consistent fuel. The double ally-affecting perks (Heal 1 Range 2, Strengthen Range 2) are strong for a support-leaning build with no element setup required.",
      builds: [
        {
          id: "dps",
          icon: "⚗️",
          iconClass: "bruiser-icon",
          name: "Condition DPS",
          tagline: "Ranged condition damage, AoE, persistent tracks",
          btnClass: "bruiser-btn",
          desc: "Apply a rotating arsenal of conditions — Blind, Wound, Immobilize, Poison, Stun, Muddle — to disable and destroy enemies while persistent tracks chip away passively. Exothermic Cocktail and Corrosive Combustion provide AoE condition spreading; Contagious Malady spreads conditions between adjacent enemies for compound efficiency.",
          playstyle: "Open with fast-initiative condition cards (Contagious Malady 13, Critical Observation 20) to establish conditions before enemies act. Use Exothermic Cocktail as a reliable non-Loss AoE anchor each rest cycle. Save Loss cards like Frozen Explosion and Blinding Lightwaves for high-value rooms where Immobilize or Blind turns the tide. Track persistent card completions for milestone progress.",
          coreCards: [
            { name: "Contagious Malady", desc: "Level 1 — initiative 13, spread conditions between adjacent enemies." },
            { name: "Exothermic Cocktail", desc: "Level 1 — non-Loss AoE, backbone of the rest cycle." },
            { name: "Critical Observation", desc: "Level 1 — persistent 3-charge condition track, prime milestone contributor." },
            { name: "Elevated Chemicals", desc: "Level 5 — upgraded conditions for dramatically increased damage." },
            { name: "Astronomical Strike", desc: "Level 7 — AoE capstone with Loss bottom for critical moments." },
            { name: "Ultraviolet Rays", desc: "Level 9 — DPS capstone Loss attack." },
          ],
          levelups: [
            { lvl: "2", text: "Transformation Libation for powerful Loss condition application" },
            { lvl: "3", text: "Electromagnetism — Stun at Level 3 is exceptionally strong" },
            { lvl: "4", text: "Befuddling Serum for Muddle and a powerful Loss condition bottom" },
            { lvl: "5", text: "Elevated Chemicals — upgraded conditions multiply damage output" },
            { lvl: "6", text: "Molecular Hydroblast for strong non-Loss ranged damage" },
            { lvl: "7", text: "Astronomical Strike — AoE top with Loss bottom flexibility" },
            { lvl: "8", text: "Critical Hypothesis — fast initiative 16 persistent track" },
            { lvl: "9", text: "Ultraviolet Rays — capstone DPS Loss" },
          ],
        },
        {
          id: "support",
          icon: "💊",
          iconClass: "trap-icon",
          name: "Field Medic",
          tagline: "Heals, Strengthen, condition removal, ally buffs",
          btnClass: "trap-btn",
          desc: "Keep the party alive and buffed through strategic healing, Strengthen distribution, and condition removal. The 11-card hand gives room to carry both support and utility cards simultaneously. Preliminary Research's rest benefits compound over a long scenario to give the party a significant stamina advantage.",
          playstyle: "Prioritize Preliminary Research to optimize every short rest — choose your lost card and refresh a spent item each cycle. Use fast-initiative Strengthen (Strength Elixir 19, Nutrient Overdose 17) before allies act. Antibiotic Boost handles party-wide condition removal mid-scenario. Nourishing Formula and Elixir of Life provide late-game heal throughput for the final rooms.",
          coreCards: [
            { name: "Preliminary Research", desc: "Level 1 — initiative 24, choose rest lost card + refresh item. Hold forever." },
            { name: "Cell Regeneration", desc: "Level 1 — non-Loss heal for consistent throughput." },
            { name: "Strength Elixir", desc: "Level 4 — fast initiative 19 Strengthen before allies act." },
            { name: "Antibiotic Boost", desc: "Level 6 — party-wide heal and condition removal." },
            { name: "Nourishing Formula", desc: "Level 7 — strong non-Loss party heal." },
            { name: "Elixir of Life", desc: "Level 9 — capstone heal for the support build." },
          ],
          levelups: [
            { lvl: "2", text: "Nutrient Overdose for fast initiative 17 support buff" },
            { lvl: "3", text: "Weather Forecast for non-Loss persistent utility" },
            { lvl: "4", text: "Strength Elixir — fast Strengthen for allies" },
            { lvl: "5", text: "Advanced Research for major recovery utility" },
            { lvl: "6", text: "Antibiotic Boost — party-wide heal and condition removal" },
            { lvl: "7", text: "Nourishing Formula — non-Loss party heal" },
            { lvl: "8", text: "Versatile Concoction for flexible situational support" },
            { lvl: "9", text: "Elixir of Life — capstone support heal" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Dynamic Balance", desc: "Level 1 — Attack 3, Move 3, or Heal 3 in any order. Exceptional flexibility for either build." },
        { name: "Magnetic Field", desc: "Level 1 — non-Loss PUSH/PULL repositioning utility for either build." },
        { name: "Preliminary Research", desc: "Level 1 — hold through the whole campaign regardless of build." },
        { name: "Creative Sparks", desc: "Milestone reward — flexible medium-initiative card for either build." },
      ],
    },
    bombard: {
      perksDesc: "The '(+3) if Projectile' double-perk is the class's signature modifier — prioritize both copies early. Pair with Immobilize for controlling problem enemies. Pierce 3 redraw cards complement strength against high-Shield enemies. The Shield 1 Self and Heal 1 Self redraw cards provide passive sustain for the Tank build without burning card slots.",
      builds: [
        {
          id: "projectile",
          icon: "💣",
          iconClass: "bruiser-icon",
          name: "Projectile Artillery",
          tagline: "Delayed Projectile attacks, Pierce, Immobilize, double-turns",
          btnClass: "bruiser-btn",
          desc: "Maximize the Projectile mechanic's delayed detonation for devastating late/early initiative double-turns. Place Projectiles late in each round after enemies have moved, then act early next round to detonate before they respond. Particularly brutal on door-opening rounds.",
          playstyle: "Open with slow-initiative Projectile placement cards (Consistent Firing 76, Unexpected Bombshell 85, Supercharged Gunpowder 90) paired with fast-initiative detonation cards (Rolling into Position 14, Man the Cannon 21). On door-opening rounds, act late to seed Projectiles in the new room then detonate early next round for maximum impact. The '(+3) if Projectile' perks turn each Projectile trigger into a potential damage spike.",
          coreCards: [
            { name: "Consistent Firing", desc: "Level 1 — reliable Projectile setup at slow initiative 76. The backbone of the Projectile engine." },
            { name: "Rolling into Position", desc: "Level 1 — initiative 14 fast half for late/early pairing strategy." },
            { name: "Twin Blast", desc: "Level 3 — two Projectile placements in one card, doubling milestone progress per cycle." },
            { name: "Sharpened Focus", desc: "Level 5 — Pierce cuts through high-Shield problem enemies the class specializes in handling." },
            { name: "Quadruple Cannons", desc: "Level 8 — four-cannon AoE at initiative 86, the Projectile build's mid-to-late game centerpiece." },
            { name: "Supercharged Gunpowder", desc: "Level 9 — initiative 90 capstone AoE, the ultimate delayed Projectile payoff." },
          ],
          levelups: [
            { lvl: "2", text: "Rapid Fire for additional Projectile triggers and burst damage" },
            { lvl: "3", text: "Twin Blast — two Projectile placements per card is exceptional value" },
            { lvl: "4", text: "Powerful Buckshot for a strong slow-initiative ranged option" },
            { lvl: "5", text: "Sharpened Focus — Pierce is core for handling problem enemies" },
            { lvl: "6", text: "Meteoric Blast for a strong mid-game damage card" },
            { lvl: "7", text: "Ballistic Barrage — multi-hit Loss payoff for boss fights" },
            { lvl: "8", text: "Quadruple Cannons — AoE evolution of Double Cannons" },
            { lvl: "9", text: "Supercharged Gunpowder — capstone Projectile AoE nuke" },
          ],
        },
        {
          id: "tank",
          icon: "🛡️",
          iconClass: "trap-icon",
          name: "Ranged Tank",
          tagline: "Shield, Retaliate, stationary firing position, self-sustain",
          btnClass: "trap-btn",
          desc: "Hold position, absorb damage through carefully chosen Shields, and punish attackers with Ranged Retaliate. The Bombard's ability to tank while dealing consistent ranged damage is a unique and powerful combination — stay still, keep firing, and let enemies hurt themselves on your Retaliate.",
          playstyle: "Open with fast-initiative defensive setup (Stationary Enhancements 3, Unbreakable Position 15, Distant Retribution 12) to get shields and Retaliate active before enemies act. Then hold your position — Stationary Enhancements rewards not moving with persistent bonuses. Use Hurried Repairs for self-sustain when needed. Ranged Retaliate means enemies taking shots at you from range are actively helping you deal damage.",
          coreCards: [
            { name: "Barbed Armor", desc: "Level 1 — fast initiative 13 Shield/Retaliate setup. Remember: Shield works against melee OR ranged, not both." },
            { name: "Stationary Enhancements", desc: "Level 3 — initiative 3, the fastest card in the deck. Persistent buff for holding position." },
            { name: "Distant Retribution", desc: "Level 2 — Ranged Retaliate is a situational all-star for punishing enemies that shoot at you." },
            { name: "Unbreakable Position", desc: "Level 5 — initiative 15, strong persistent Shield for the Tank build's core defense." },
            { name: "Defense Mechanism", desc: "Level 8 — fast initiative 18, mature defensive toolkit for the late-game Tank build." },
            { name: "Superior Upgrade", desc: "Level 9 — initiative 9, capstone defensive upgrade for an unbreakable final position." },
          ],
          levelups: [
            { lvl: "2", text: "Distant Retribution for Ranged Retaliate — a situational all-star" },
            { lvl: "3", text: "Stationary Enhancements — initiative 3 and persistent bonus for holding position" },
            { lvl: "4", text: "Hurried Repairs for self-sustain while tanking hits" },
            { lvl: "5", text: "Unbreakable Position — strong persistent Shield for the Tank build" },
            { lvl: "6", text: "Meteoric Blast for continued ranged damage output while tanking" },
            { lvl: "7", text: "Airborne Skyrocket for long-range engagement without repositioning" },
            { lvl: "8", text: "Defense Mechanism — fast initiative mature defensive toolkit" },
            { lvl: "9", text: "Superior Upgrade — capstone defensive Loss for the ultimate Tank position" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Forceful Bolt", desc: "Level 1 — versatile ranged attack with control effect, useful for either build." },
        { name: "Grappling Hook", desc: "Level 1 — mobility utility for staying at range regardless of build." },
        { name: "Pummeling Chain", desc: "Milestone reward — fast initiative 17, adds Projectile triggers for either build." },
      ],
    },
    mirefoot: {
      perksDesc: "Start with replace -2 with 0 and replace -1 with +1 to improve your baseline deck. The 'X based on Poison value' perks are mid-tier — often end up as +1s. Rolling conditional Invisibility perks are great for the Difficult Terrain build. Replacing +1s with +0 Wound 2s is swingy but potentially very powerful if you reliably go before monsters.",
      builds: [
        {
          id: "bruiser",
          icon: "☠️",
          iconClass: "bruiser-icon",
          name: "Poison/Wound DPS",
          tagline: "Upgraded conditions, burst damage, hit and run",
          btnClass: "bruiser-btn",
          desc: "Stack Poison and apply Wound 2 to high-priority targets. Use excellent Initiative control to dash in before monsters act, apply a devastating condition, then get out before taking damage. Let upgraded Conditions do the heavy lifting.",
          playstyle: "Lead with Death Sentence Top (Init 8) or Blood Thinner (Init 11) on the scariest Elite each room. Follow up with Throwing Daggers Active for Range 3 access on melee attacks, keeping you safe from Retaliate. Use Neurotoxin Top to apply Poison broadly. Save Paralytic Agent for the most dangerous activation each rest cycle. Keep Wound 2 targets on a mental clock — they'll die within a turn or two without spending more actions on them.",
          coreCards: [
            { name: "Blood Thinner", desc: "Initiative 11 Wound 2 + XP top. Ran until retirement. The class's signature kill condition." },
            { name: "Death Sentence", desc: "Initiative 8 Attack 2 Stun Poison 3 Loss. A Death Sentence for any non-immune monster." },
            { name: "Paralytic Agent", desc: "Repeatable Stun at Initiative 76. Wanted every rest cycle." },
            { name: "Throwing Daggers", desc: "Level 2 — converts melee attacks to Range 3 for 3 uses. Opens up the entire class." },
            { name: "Neurotoxin", desc: "Ranged Poison AoE top. Sleeper hit played in starting hand all the way to Level 4." },
            { name: "Compound Toxin", desc: "Level 5 — reliable Poison 3 every rest cycle. Basically always Attack 2 Poison 3." },
          ],
          levelups: [
            { lvl: "2", text: "Throwing Daggers — mandatory; converts melee attacks to Range 3, unlocks the class's full potential" },
            { lvl: "3", text: "Potent Mixture (Init 17) for single-target Poison 3 burst; or Hide and Seek for Invisibility utility" },
            { lvl: "4", text: "Fireroot Sap (Init 91) — late Initiative + both halves Wound; or Radiant Forest Fungi for Move/Shield" },
            { lvl: "5", text: "Compound Toxin — reliable Poison 3 each cycle; Personal Poison is a strong alternative for mass Wound" },
            { lvl: "6", text: "Anticoagulant (Init 12) — replaces Blood Thinner; or Tainted Waters for Difficult Terrain payoff" },
            { lvl: "7", text: "Sludge Bomb (Init 7) — Ranged Immobilize + Wound + terrain; or Wild Stings for AoE Attack 8" },
            { lvl: "8", text: "Whitefire Balm — primarily for the incredible Wound 2 Stun Bottom; Twist the Blade is alternative" },
            { lvl: "9", text: "Lingering Swamp Moss — non-Loss Poison 4 at Init 94; or Complex Toxicology for AoE True Damage" },
          ],
        },
        {
          id: "trapbuild",
          icon: "🌿",
          iconClass: "trap-icon",
          name: "Difficult Terrain",
          tagline: "Terrain control, area denial, Ranged payoffs",
          btnClass: "trap-btn",
          desc: "Build the battlefield with Difficult Terrain to lock down slow enemies, enable Bogstep-style power plays, and set up AoE attacks that require terrain. Combine with Ranged actions to attack safely from elevated positions.",
          playstyle: "Open with Ground Solvent Top to Poison targets and create terrain. Use Sinkhole Loss to mass-Immobilize and terrain-fill an area. Combine with Airborne Spores Bottom (Range 3 Muddle all Poisoned) for devastating chip damage. At higher levels Tainted Waters (Poison 2 Wound 2 Range 4 on terrain targets) and Sludge Bomb provide excellent terrain payoffs. Keep Bogstep ready for turns where you're sitting on terrain for the Attack 4 Immobilize.",
          coreCards: [
            { name: "Ground Solvent", desc: "Creates terrain and Poisons — sets up everything the Terrain build wants." },
            { name: "Bogstep", desc: "Attack 4 Immobilize on Difficult Terrain top. Bring in/out as terrain is available." },
            { name: "Sinkhole", desc: "Mass Immobilize + create terrain in all hexes. Great at Level 2 with Throwing Daggers." },
            { name: "Airborne Spores", desc: "Level X — Bottom targets all Poisoned within Range 3 for chip damage + Muddle." },
            { name: "Tainted Waters", desc: "Level 6 — Poison 2 Wound 2 Range 4 on terrain targets. Huge terrain build payoff." },
            { name: "Sludge Bomb", desc: "Level 7 — Ranged Immobilize + terrain generation at Initiative 7. Repeatable Sinkhole feel." },
          ],
          levelups: [
            { lvl: "2", text: "Throwing Daggers — mandatory for both builds; also enables Ranged Sinkhole follow-ups safely" },
            { lvl: "3", text: "Hide and Seek (Init 43) — Loot + terrain top; Invisible bottom for terrain build mobility" },
            { lvl: "4", text: "Radiant Forest Fungi (Init 6) — Move 3+ through terrain bottom; Shield on terrain top for party" },
            { lvl: "5", text: "Compound Toxin Bottom — Poison 2 all Poisoned targets on Difficult Terrain; great terrain payoff" },
            { lvl: "6", text: "Tainted Waters (Init 88) — the terrain build's crown jewel; Poison 2 Wound 2 Range 4 Loss" },
            { lvl: "7", text: "Sludge Bomb (Init 7) — Ranged Immobilize terrain generation; feels like repeatable Sinkhole" },
            { lvl: "8", text: "Whitefire Balm — Bottom Wound 2 Stun is too good for both builds; Difficult Terrain Top bonus" },
            { lvl: "9", text: "Lingering Swamp Moss Bottom — Persistent: Ranged Attacks create terrain adjacent; near-complete melee safety" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Blood Thinner", desc: "Initiative 11 Wound 2 top. Ran until retirement. The class's signature condition — both builds want this every rest cycle." },
        { name: "Death Sentence", desc: "Initiative 8 Stun Poison 3 Loss. A Death Sentence for any non-immune monster regardless of build." },
        { name: "Throwing Daggers", desc: "Level 2 mandatory pickup. Converts melee attacks to Range 3 — opens up the entire class regardless of build." },
        { name: "Whitefire Balm", desc: "Level 8 — primarily for the incredible Wound 2 Stun bottom. Both builds plan rests around using this." },
      ],
    },
    fireknight: {
      perksDesc: "The two core builds are Vanguard-Support (lean into adjacency buffs, Strengthen, Advantage, and healing) and Fire Mastery (build toward fire-fueled AoE damage that comes online at Level 5+). Start with 'remove two -1 cards' and 'replace -1 with +0 Strengthen Ally' to improve your baseline deck while adding party utility. The Ladder-conditional +2 perks are excellent regardless of build — you should be using the Ladder actively in either case. The Fire perks (ignore negative item/scenario effects + add +0 Fire card) are efficient two-for-one picks that ease the early fire scarcity problem.",
      builds: [
        {
          id: "support",
          icon: "🤝",
          iconClass: "bruiser-icon",
          name: "Vanguard-Support",
          tagline: "Adjacency buffs, Strengthen, Advantage, heals",
          btnClass: "bruiser-btn",
          desc: "Stay close to allies and amplify the whole party. Distribute Strengthen and Advantage liberally, keep the team topped up with accessible healing, and use persistent non-Loss buffs for ongoing value every round. At Level 1, Coordinated Attack, Combat Medic, and Practical Tools are likely candidates to leave behind as you build out your starting hand.",
          playstyle: "Open with Collective Combat or Combined Effort to start the adjacency engine, granting Advantage and bonus damage as long as you're near allies. Bring in Crew Integrity for a persistent round-after-round buff that doesn't cost a Loss action. Lean on Combat Medic and Trauma Care to keep the party alive without sacrificing tempo. At higher levels, Mutual Aid and Search and Rescue reinforce the responder identity, with Incident Commander as a capstone party-wide buff at Level 9.",
          coreCards: [
            { name: "Collective Combat", desc: "Level 1 — Attack bonus when an adjacent ally also attacks. Core adjacency payoff." },
            { name: "Combined Effort", desc: "Level 1 — grants Advantage to self or an adjacent ally. Huge against the rough starting modifier deck." },
            { name: "Crew Integrity", desc: "Level 3 — persistent non-Loss buff while adjacent to allies. Standout repeatable value card." },
            { name: "Fiery Charisma", desc: "Level X — multi-target Strengthen from the very first scenario." },
            { name: "Trauma Care", desc: "Level 2 — strong heal plus condition removal." },
            { name: "Mutual Aid", desc: "Level 6 — party-wide buff or heal, reinforcing the teamwork theme at mid-levels." },
          ],
          levelups: [
            { lvl: "2", text: "Trauma Care for stronger healing and condition removal if the starting hand felt light on sustain" },
            { lvl: "3", text: "Crew Integrity — persistent adjacency buff, a standout pickup for this build" },
            { lvl: "4", text: "Jack Of All Trades for flexible generalist utility while deciding build direction" },
            { lvl: "5", text: "Hook and Ladder for traversal utility that benefits the whole party's positioning" },
            { lvl: "6", text: "Mutual Aid — party-wide buff/heal reinforcing the Support identity" },
            { lvl: "7", text: "Search and Rescue — ally-focused utility and rapid repositioning to reach isolated allies" },
            { lvl: "8", text: "Cauterize Wound — strong late-game heal with Fire-enhanced healing power" },
            { lvl: "9", text: "Incident Commander — capstone party-wide buff, the Support build's peak power level" },
          ],
        },
        {
          id: "fire",
          icon: "🔥",
          iconClass: "trap-icon",
          name: "Fire Mastery",
          tagline: "Fire generation/consumption, AoE damage, unlocked at higher levels",
          btnClass: "trap-btn",
          desc: "Build toward a powerful Fire-fueled damage engine. Early levels are about securing reliable fire generation; once that's established around Level 5-6, fire-consuming cards deliver some of the class's biggest damage spikes.",
          playstyle: "Hold Playing With Fire early to guarantee fire generation alongside consumer cards like Fire Whirl — without both in hand simultaneously, the fire payoffs can feel weak. Be patient through the early levels; the build doesn't truly come online until Searing Blaze and Flaming Axe arrive at Levels 5-6. By Level 8-9, Backdraft and Flashover deliver the build's signature explosive AoE damage spikes, rewarding the early investment.",
          coreCards: [
            { name: "Playing With Fire", desc: "Level 1 — one of the only early reliable Fire generators. Near-mandatory for early Fire build players." },
            { name: "Fire Whirl", desc: "Level 1 — AoE Attack with Fire payoff, though early on the payoff often won't fire without dedicated generation." },
            { name: "Searing Blaze", desc: "Level 5 — where the Fire build starts feeling consistent, with real payoff for held Fire element." },
            { name: "Flaming Axe", desc: "Level 6 — the class's namesake weapon, strong single-target Fire-infused damage." },
            { name: "Backdraft", desc: "Level 8 — explosive Fire payoff attack, named for one of firefighting's most dangerous phenomena." },
            { name: "Flashover", desc: "Level 9 — capstone AoE nuke, the build's biggest damage spike." },
          ],
          levelups: [
            { lvl: "2", text: "Heavy Irons for a straightforward damage upgrade while the Fire engine is still being assembled" },
            { lvl: "3", text: "Ladder Assault — rewards Ladder positioning, doubling as milestone progress and real damage" },
            { lvl: "4", text: "Kindled Tonic — bridges Fire generation with healing, easing the early fire scarcity problem" },
            { lvl: "5", text: "Searing Blaze — the build's turning point, finally delivering consistent Fire payoff" },
            { lvl: "6", text: "Flaming Axe — strong single-target Fire damage centerpiece for the build's mid-game" },
            { lvl: "7", text: "Rolling Flames — AoE Fire payoff rewarding the generation investment made so far" },
            { lvl: "8", text: "Backdraft — explosive Fire damage spike, one of the build's biggest hits" },
            { lvl: "9", text: "Flashover — capstone AoE nuke, the ultimate payoff for a fully built Fire engine" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Controlled Aggression", desc: "Level 1 — reliable filler attack that doesn't depend on fire or adjacency setups. Useful for either build early on." },
        { name: "Light Irons / Heavy Irons", desc: "Fast, low-commitment Attack/Move pairing useful for Initiative control regardless of build." },
        { name: "Loyal Companion", desc: "Level X — the Dalmatian summon. Fun thematic centerpiece worth considering for either build depending on appetite for summon play." },
        { name: "Improvised Methods", desc: "Milestone reward — flexible, adapts to any situation. Useful for either build once unlocked." },
      ],
    },
  };
  window.CLASS_BUILDS = CLASS_BUILDS;


  function updateBuildChipLabels(cls) {
    const bd = CLASS_BUILDS[cls];
    if (!bd || bd.builds.length < 2) return;
    const bruiserChip = document.querySelector('.chip[data-filter="bruiser"]');
    const trapChip = document.querySelector('.chip[data-filter="trapbuild"]');
    if (bruiserChip) bruiserChip.textContent = bd.builds[0].name;
    if (trapChip) trapChip.textContent = bd.builds[1].name;
  }


  // ===== CLASS TAG CONFIG =====
  // Maps generic filter keys to class-specific tag names and card tag values
  const CLASS_TAGS = {
    chainguard: {
      mechanic1: { filter: "shackle", label: "Shackle", tagClass: "tag-shackle" },
      mechanic2: { filter: "swing",   label: "Swing",   tagClass: "tag-trap" },
    },
    luminary: {
      mechanic1: { filter: "glow",    label: "Glow",    tagClass: "tag-shackle" },
      mechanic2: { filter: "scuttle", label: "Scuttle", tagClass: "tag-trap" },
    },
    chieftain: {
      mechanic1: { filter: "mount",   label: "Mount",   tagClass: "tag-shackle" },
      mechanic2: { filter: "command", label: "Command", tagClass: "tag-trap" },
    },
    hierophant: {
      mechanic1: { filter: "prayer",  label: "Prayer",  tagClass: "tag-shackle" },
      mechanic2: { filter: "",        label: "",         tagClass: "" },
    },
    hollowpact: {
      mechanic1: { filter: "void",      label: "Void",      tagClass: "tag-shackle" },
      mechanic2: { filter: "voidsight", label: "Voidsight", tagClass: "tag-trap" },
    },
    mirefoot: {
      mechanic1: { filter: "wound",   label: "Condition",     tagClass: "tag-shackle" },
      mechanic2: { filter: "terrain", label: "Terrain",       tagClass: "tag-trap" },
    },
    fireknight: {
      mechanic1: { filter: "support", label: "Support",   tagClass: "tag-shackle" },
      mechanic2: { filter: "fire",    label: "Fire",      tagClass: "tag-trap" },
    },
    starslinger: {
      mechanic1: { filter: "aoe",     label: "AoE",     tagClass: "tag-shackle" },
      mechanic2: { filter: "support", label: "Support", tagClass: "tag-trap" },
    },
    brightspark: {
      mechanic1: { filter: "condition", label: "Condition", tagClass: "tag-shackle" },
      mechanic2: { filter: "support",   label: "Support",   tagClass: "tag-trap" },
    },
    bombard: {
      mechanic1: { filter: "projectile", label: "Projectile", tagClass: "tag-shackle" },
      mechanic2: { filter: "shield",    label: "Shield",     tagClass: "tag-trap" },
    },
  };

  function getTagConfig() {
    return CLASS_TAGS[state.activeClass] || CLASS_TAGS.chainguard;
  }

  function updateMechanicChipLabels() {
    const tc = getTagConfig();
    const chip1 = document.getElementById("chip-mechanic1");
    const chip2 = document.getElementById("chip-mechanic2");
    if (chip1) chip1.textContent = tc.mechanic1.label;
    if (chip2) {
      chip2.textContent = tc.mechanic2.label;
      chip2.style.display = tc.mechanic2.label ? "" : "none";
    }
  }

  // ===== START =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
