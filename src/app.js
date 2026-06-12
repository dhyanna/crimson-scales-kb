// app.js — Crimson Scales Knowledge Base application logic
// Card images sourced from: github.com/cmlenius/gloomhaven-card-browser (images branch)

(function () {
  "use strict";

  // ===== STATE =====
  const state = {
    activeTab: "overview",
    cardFilter: "all",
    activeBuild: null,
    cardSearch: "",
    expandedBuild: null,
    perksChecked: {},
  };

  // ===== INIT =====
  function init() {
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
    ["bruiser", "trap"].forEach((build) => {
      const panel = document.getElementById("bp-" + build);
      if (panel) {
        panel.addEventListener("click", (e) => {
          if (e.target.closest(".show-cards-btn")) return;
          toggleBuildPanel(build);
        });
      }
      const showBtn = panel ? panel.querySelector(".show-cards-btn") : null;
      if (showBtn) {
        showBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          goToCardsForBuild(build);
        });
      }
    });
  }

  function toggleBuildPanel(build) {
    const isSame = state.expandedBuild === build;
    state.expandedBuild = isSame ? null : build;

    ["bruiser", "trap"].forEach((b) => {
      const expand = document.getElementById("bx-" + b);
      const chev = document.getElementById("chev-" + b);
      const panel = document.getElementById("bp-" + b);
      const open = state.expandedBuild === b;
      if (expand) expand.classList.toggle("open", open);
      if (chev) chev.classList.toggle("rotated", open);
      if (panel) {
        panel.classList.remove("open-bruiser", "open-trap");
        if (open) panel.classList.add("open-" + b);
      }
    });
  }

  function goToCardsForBuild(build) {
    state.activeBuild = build;
    state.cardFilter = "all";
    switchTab("cards");
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    const targetChip = document.querySelector(
      `.chip[data-filter="${build === "bruiser" ? "bruiser" : "trapbuild"}"]`
    );
    if (targetChip) targetChip.classList.add("active");
    showBuildBanner(build);
    renderCards();
  }

  // ===== BUILD BANNER =====
  function showBuildBanner(build) {
    const banner = document.getElementById("build-banner");
    const bannerText = document.getElementById("banner-text");
    if (!banner || !bannerText) return;
    bannerText.textContent =
      "Showing " + (build === "bruiser" ? "Bruiser build" : "Trap build") + " cards";
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
    const f = state.activeBuild
      ? state.activeBuild === "bruiser"
        ? "bruiser"
        : "trapbuild"
      : state.cardFilter;

    if (f === "lvl1" && card.level !== "1") return false;
    if (f === "lvlx" && card.level !== "X") return false;
    if (f === "lvlm" && card.level !== "M") return false;
    if (f === "lvl2plus" && !["2","3","4","5","6","7","8","9"].includes(card.level)) return false;
    if (f === "shackle" && !card.tags.includes("shackle")) return false;
    if (f === "trap" && !card.tags.includes("trap")) return false;
    if (f === "loss" && !card.top.isLoss && !card.bottom.isLoss) return false;
    if (f === "bruiser") {
      if (!card.builds.includes("bruiser") && !card.builds.includes("both")) return false;
    }
    if (f === "trapbuild") {
      if (!card.builds.includes("trap") && !card.builds.includes("both")) return false;
    }

    if (state.cardSearch) {
      const s = state.cardSearch;
      const searchable = [card.name, card.top.text, card.bottom.text, card.commentary].join(" ").toLowerCase();
      if (!searchable.includes(s)) return false;
    }

    return true;
  }

  function getCardHighlightClass(card) {
    const isBruiser = card.builds.includes("bruiser") && !card.builds.includes("trap") && !card.builds.includes("both");
    const isTrap = card.builds.includes("trap") && !card.builds.includes("bruiser") && !card.builds.includes("both");
    const isBoth = card.builds.includes("both") || (card.builds.includes("bruiser") && card.builds.includes("trap"));
    if (isBruiser) return "hl-bruiser";
    if (isTrap) return "hl-trap";
    if (isBoth) return "hl-both";
    return "hl-none";
  }

  function buildCardTags(card) {
    const tags = [];
    tags.push(`<span class="tag tag-lvl">Lvl ${card.level}</span>`);
    if (card.tags.includes("shackle")) tags.push(`<span class="tag tag-shackle">Shackle</span>`);
    if (card.tags.includes("trap")) tags.push(`<span class="tag tag-trap">Trap</span>`);
    if (card.top.isLoss || card.bottom.isLoss) tags.push(`<span class="tag tag-loss">Loss</span>`);
    const isBruiser = card.builds.includes("bruiser") && !card.builds.includes("trap") && !card.builds.includes("both");
    const isTrap = card.builds.includes("trap") && !card.builds.includes("bruiser") && !card.builds.includes("both");
    const isBoth = card.builds.includes("both") || (card.builds.includes("bruiser") && card.builds.includes("trap"));
    if (isBruiser) tags.push(`<span class="tag tag-bruiser">Bruiser</span>`);
    if (isTrap) tags.push(`<span class="tag tag-trapbld">Trap build</span>`);
    if (isBoth) tags.push(`<span class="tag tag-both">Both builds</span>`);
    return tags.join("");
  }

  function renderCards() {
    const grid = document.getElementById("cards-grid");
    if (!grid) return;

    const data = CHAINGUARD_DATA;
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
            loading="lazy"
            onerror="this.parentElement.classList.add('card-image-error'); this.parentElement.innerHTML='<span class=\'card-image-fallback\'>Image unavailable</span>'"
          >
        </div>` : ""}
        <div class="card-half">
          <div class="half-label">Top</div>
          <div class="half-text">${card.top.text}${card.top.isLoss ? ' <span class="tag tag-loss" style="vertical-align:middle">Loss</span>' : ""}</div>
        </div>
        <div class="card-half">
          <div class="half-label">Bottom</div>
          <div class="half-text">${card.bottom.text}${card.bottom.isLoss ? ' <span class="tag tag-loss" style="vertical-align:middle">Loss</span>' : ""}</div>
        </div>
        <div class="card-commentary">${card.commentary}</div>
      </div>
    `).join("");
  }

  // ===== RENDER PERKS =====
  function renderPerks() {
    const list = document.getElementById("perks-list");
    if (!list) return;

    const data = CHAINGUARD_DATA;
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

  // ===== RENDER TIPS =====
  function renderTips() {
    const grid = document.getElementById("tips-grid");
    if (!grid) return;

    grid.innerHTML = CHAINGUARD_DATA.tips
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
    const ms = CHAINGUARD_DATA.milestone;
    if (!ms) return;
    const img = document.getElementById("milestone-img");
    if (img) img.src = ms.imageUrl;
    const ropepit = CHAINGUARD_DATA.cards.find((c) => c.id === "rope-pit");
    const rewardImg = document.getElementById("milestone-reward-img");
    if (rewardImg && ropepit && ropepit.imageUrl) {
      rewardImg.src = ropepit.imageUrl;
    }
  }

  // ===== START =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
