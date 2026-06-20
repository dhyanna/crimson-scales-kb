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
  };

  // ===== STATE =====
  const state = {
    activeClass: "chainguard",
    activeTab: "overview",
    cardFilter: "all",
    activeBuild: null,
    cardSearch: "",
    expandedBuild: null,
    perksChecked: {},
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
    bindPerkReset();
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
    const filterMap = { bruiser: "bruiser", trap: "trapbuild", support: "trapbuild", damage: "bruiser", dps: "bruiser", tank: "trapbuild" };
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
      if (!card.builds.includes("trap") && !card.builds.includes("support") && !card.builds.includes("tank") && !card.builds.includes("both")) return false;
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
    const list = document.getElementById("perks-list");
    if (!list) return;

    const data = activeClassData();
    let totalCount = 0;
    let html = "";

    data.perks.forEach((perk, perkIdx) => {
      for (let i = 0; i < perk.count; i++) {
        const key = `${perkIdx}-${i}`;
        totalCount++;
        const countLabel = perk.count > 1 ? `<em>(${i + 1}/${perk.count})</em>` : "";
        html += `
          <div class="perk-row" data-key="${key}" role="button" tabindex="0" aria-pressed="${!!state.perksChecked[key]}">
            <div class="perk-checkbox${state.perksChecked[key] ? " checked" : ""}" aria-hidden="true"></div>
            <div class="perk-label">${countLabel}${perk.text}</div>
          </div>
        `;
      }
    });

    list.innerHTML = html;

    const totalEl = document.getElementById("perks-total");
    if (totalEl) totalEl.textContent = totalCount;
    updatePerkCount();

    list.addEventListener("click", (e) => {
      const row = e.target.closest(".perk-row");
      if (!row) return;
      const key = row.dataset.key;
      state.perksChecked[key] = !state.perksChecked[key];
      const checkbox = row.querySelector(".perk-checkbox");
      if (checkbox) checkbox.classList.toggle("checked", state.perksChecked[key]);
      row.setAttribute("aria-pressed", state.perksChecked[key]);
      updatePerkCount();
    });

    list.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const row = e.target.closest(".perk-row");
        if (row) row.click();
      }
    });
  }

  function updatePerkCount() {
    const takenEl = document.getElementById("perks-taken");
    if (!takenEl) return;
    const count = Object.values(state.perksChecked).filter(Boolean).length;
    takenEl.textContent = count;
  }

  function bindPerkReset() {
    const btn = document.getElementById("reset-perks");
    if (!btn) return;
    btn.addEventListener("click", () => {
      state.perksChecked = {};
      document.querySelectorAll(".perk-checkbox").forEach((cb) => cb.classList.remove("checked"));
      document.querySelectorAll(".perk-row").forEach((r) => r.setAttribute("aria-pressed", "false"));
      updatePerkCount();
    });
  }

  // ===== RENDER BUILDS =====
  function renderBuilds() {
    const container = document.getElementById("builds-container");
    if (!container) return;

    const bd = CLASS_BUILDS[state.activeClass];
    if (!bd) { container.innerHTML = ""; return; }

    // Update perks description
    const perksDesc = document.getElementById("perks-desc");
    if (perksDesc) perksDesc.textContent = bd.perksDesc;

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

    grid.innerHTML = activeClassData().tips
      .map(
        (tip) => `
      <div class="tip-card">
        <div class="tip-category">${tip.category}</div>
        <div class="tip-text">${tip.text}</div>
      </div>
    `
      )
      .join("");
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
      state.perksChecked = {};

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
            { name: "Touch of the Void", desc: "Non-Loss Stun + Voidsight + Dark. Ran for entire career." },
            { name: "Void Step", desc: "Teleport 2 Attack 2 top, Void-to-Teleport-4 Dark bottom. Reliable Void dump." },
            { name: "Find an Opening", desc: "Initiative 15 — fastest card. Voidsight + Stun + party damage aura." },
            { name: "Obliterate", desc: "Level 4 powerhouse — Attack 12-18 Disarm multiple targets. Room-clearing Loss." },
            { name: "Reaching Darkness", desc: "Attack 2 Range 5 Poison top — first enhancement target. Staple Ranged action." },
            { name: "Prescient Voidmastery / No Escape", desc: "Level 9 capstones — both excellent. Go for what looks most fun." },
          ],
          levelups: [
            { lvl: "2", text: "Shrouded Grasp (Init 23) or Nether Binding — Grasp for Dark Invisibility; Binding if party wants Earth/Dark setup" },
            { lvl: "3", text: "Majestic Malevolence (Init 89) — best late Initiative, fantastic Top/Bottom; also consider Void-Enhanced Armory for Shield" },
            { lvl: "4", text: "Obliterate (Init 13) — room-turning Loss Top + excellent Bottom. Or Stalking Quarry for non-Loss flexibility" },
            { lvl: "5", text: "Sever Reality (Init 78) — great late Initiative + Voidsight Bottom; or Enduring Darkness for Ward/Regenerate" },
            { lvl: "6", text: "Implosion — AoE Muddle from Void Pits + Move 4 Infuse Void; essential payoff for Void Pit setup" },
            { lvl: "7", text: "Ruinous Barrage — conditional Triple Attack + Stun Loss; solid Bottom hit-and-run" },
            { lvl: "8", text: "Entropy Unleashed — AoE Poison payoff; stronger pick over Tendrils of Night for most" },
            { lvl: "9", text: "No Escape — Stun + Wound Loss + incredible Bottom. Or Prescient Voidmastery for Voidsight Multi-Attack" },
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
            { name: "Touch of the Void", desc: "Non-Loss Stun + Dark Infuse. Cornerstone of both paths." },
            { name: "Borrowed Vitality", desc: "Bottom: Move 3 Dark consumption Heal 2 Regenerate. Strong early sustain." },
            { name: "Nether Binding", desc: "Bottom: Teleport 4-5 Heal 4 Infuse Dark. Level 2 engine for this build." },
            { name: "Hollow Embrace", desc: "Bottom: Dark or Void consumption Heal 2. Good mid-combat healing." },
            { name: "Enduring Darkness", desc: "Bottom: Move 4 Heal Regenerate Infuse elements. Great repeatable value." },
            { name: "Sever Reality", desc: "Bottom: Voidsight Teleport 3 Attack 2 Curse. Reliable combo setup." },
          ],
          levelups: [
            { lvl: "2", text: "Nether Binding — Bottom Teleport 4-5 Heal 4 Infuse Dark is the engine for this build" },
            { lvl: "3", text: "Void-Enhanced Armory (Init 17) — fast Initiative, Shield + Persistent +1 Attack on Void spend" },
            { lvl: "4", text: "Stalking Quarry (Init 14) — non-Loss flexibility, Move 4 Shield Infuse Dark bottom" },
            { lvl: "5", text: "Enduring Darkness — Move 4 Heal Regenerate Infuse elements; great repeatable value" },
            { lvl: "6", text: "Implosion — AoE Muddle payoff" },
            { lvl: "7", text: "Ruinous Barrage" },
            { lvl: "8", text: "Tendrils of Night or Entropy Unleashed" },
            { lvl: "9", text: "Prescient Voidmastery or No Escape" },
          ],
        },
      ],
      bothBuilds: [
        { name: "Touch of the Void", desc: "Non-Loss Stun at Initiative 29 — ran for the entire career. Core for both builds." },
        { name: "Void Step", desc: "Teleport 2 Attack top, Void-to-Teleport-4 Dark bottom. Reliable Void dump and Dark generator." },
        { name: "Find an Opening", desc: "Initiative 15. Voidsight Attack + Stun top. The class's fastest reliable card." },
        { name: "Reaching Darkness", desc: "Attack 2 Range 5 Poison top. First enhancement target. Staple Ranged action for both builds." },
      ],
    },
  };


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
