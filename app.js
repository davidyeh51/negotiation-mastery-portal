/* ==========================================================================
   談判協商知識庫暨麥肯錫簡報教材系統 — 核心互動與檢索引擎 (app.js)
   功能：
   1. 門戶首頁 (index.html)：跨書／跨簡報頁全站關鍵字即時搜尋、螢光高亮標記、六大談判領域分類篩選
   2. 簡報教材頁 (course-*.html / book-*.html)：麥肯錫簡報模式 (16:9) vs 講義全覽模式、鍵盤導覽、三段式講稿開關、頁內關鍵字高亮搜尋
   ========================================================================== */

(function () {
  "use strict";

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightText(text, query) {
    if (!query || !text) return text || "";
    const terms = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(escapeRegExp);
    if (!terms.length) return text;
    const regex = new RegExp("(" + terms.join("|") + ")", "gi");
    return text.replace(regex, '<mark class="search-hl">$1</mark>');
  }

  /* ========================================================================
     PART A: PORTAL HOMEPAGE LOGIC (index.html)
     ======================================================================== */
  function initPortalPage() {
    const globalSearchInput = document.getElementById("globalSearchInput");
    const searchResultsPanel = document.getElementById("searchResultsPanel");
    const searchResultsList = document.getElementById("searchResultsList");
    const searchResultCount = document.getElementById("searchResultCount");
    const btnClearSearch = document.getElementById("btnClearSearch");
    const kwChips = document.querySelectorAll(".kw-chip");
    const domainTabs = document.querySelectorAll(".domain-tab");
    const bookCards = document.querySelectorAll(".book-deck-card");

    if (!globalSearchInput) return;

    function performGlobalSearch(rawQuery) {
      const q = (rawQuery || "").trim().toLowerCase();
      if (!q) {
        if (searchResultsPanel) searchResultsPanel.classList.remove("active");
        bookCards.forEach((card) => {
          card.style.display = "";
        });
        return;
      }

      const terms = q.split(/\s+/).filter(Boolean);
      const data = window.NEGOTIATION_PORTAL_DATA || window.STRATEGY_PORTAL_DATA || { books: [], slides: [] };

      // 1. Search all slides across all courses & books
      const matchedSlides = data.slides.filter((s) => {
        const haystack = [
          s.bookTitle,
          s.chapter,
          s.title,
          s.keywords,
          s.summary,
          s.action
        ]
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });

      // 2. Search books & cases
      const matchedBooks = data.books.filter((b) => {
        const haystack = [
          b.code,
          b.title,
          b.author,
          b.domainLabel,
          b.thesis,
          (b.tags || []).join(" ")
        ]
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });

      // Render Search Results Panel
      if (searchResultsPanel && searchResultsList) {
        searchResultsPanel.classList.add("active");
        const totalHits = matchedSlides.length + matchedBooks.length;
        if (searchResultCount) {
          searchResultCount.innerHTML = `找到 <strong>${matchedSlides.length}</strong> 頁精準簡報教材、<strong>${matchedBooks.length}</strong> 本課程／書籍（關鍵字：「<mark class="search-hl">${rawQuery}</mark>」）`;
        }

        if (totalHits === 0) {
          searchResultsList.innerHTML = `
            <div style="padding: 24px; text-align: center; color: #64748B;">
              未找到包含「<strong>${rawQuery}</strong>」的簡報頁或教材。建議嘗試：<code>我要</code>、<code>分橘子</code>、<code>機會成本</code>、<code>報完價閉嘴</code>、<code>離桌威脅</code>、<code>條件換條件</code>、<code>假設性問題</code>、<code>價值鏈</code>、<code>拍板人</code>、<code>紅白臉</code>、<code>拒絕公式</code>。
            </div>`;
        } else {
          let html = "";

          // Render matched slides first (most actionable for students)
          matchedSlides.forEach((s) => {
            const targetLink = `${s.url.split("#")[0]}?q=${encodeURIComponent(rawQuery.trim())}#${s.slideId}`;
            html += `
              <div class="search-result-item">
                <div style="flex: 1;">
                  <div class="search-result-meta">
                    <span class="search-badge-book">${s.bookTitle}</span>
                    <span class="search-badge-slide">Slide ${s.slideNum} ｜ ${highlightText(s.chapter, rawQuery)}</span>
                  </div>
                  <div class="search-result-title">${highlightText(s.title, rawQuery)}</div>
                  <div class="search-result-snippet">
                    <strong>核心洞察：</strong>${highlightText(s.summary, rawQuery)}<br>
                    <span style="color:#059669; font-weight:600;">⚡ 落地行動：</span>${highlightText(s.action, rawQuery)}
                  </div>
                </div>
                <a href="${targetLink}" class="search-result-go">直達簡報頁 →</a>
              </div>
            `;
          });

          // Render matched books/cases
          matchedBooks.forEach((b) => {
            html += `
              <div class="search-result-item" style="border-left: 4px solid #D97706;">
                <div style="flex: 1;">
                  <div class="search-result-meta">
                    <span class="search-badge-book" style="background:#D97706;">${b.code}</span>
                    <span class="search-badge-slide">${highlightText(b.domainLabel, rawQuery)}</span>
                  </div>
                  <div class="search-result-title">${highlightText(b.title, rawQuery)} — <span style="font-weight:600; font-size:0.9rem; color:#475569;">${highlightText(b.author, rawQuery)}</span></div>
                  <div class="search-result-snippet">
                    <strong>全書核心主張：</strong>${highlightText(b.thesis, rawQuery)}
                  </div>
                </div>
                <a href="${b.url}" class="search-result-go" style="background:#051C2C;">開啟教材 →</a>
              </div>
            `;
          });

          searchResultsList.innerHTML = html;
        }
      }
    }

    globalSearchInput.addEventListener("input", (e) => {
      performGlobalSearch(e.target.value);
    });

    if (btnClearSearch) {
      btnClearSearch.addEventListener("click", () => {
        globalSearchInput.value = "";
        performGlobalSearch("");
        globalSearchInput.focus();
      });
    }

    kwChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const kw = chip.getAttribute("data-kw") || chip.textContent.trim();
        globalSearchInput.value = kw;
        performGlobalSearch(kw);
        globalSearchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // Domain Filter Tabs
    domainTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        domainTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const domain = tab.getAttribute("data-domain");
        bookCards.forEach((card) => {
          const cardDomain = card.getAttribute("data-domain") || "";
          if (domain === "all" || cardDomain.includes(domain)) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        });
      });
    });

    // Keyboard shortcut '/' or Ctrl+K to focus global search
    document.addEventListener("keydown", (e) => {
      if (
        (e.key === "/" || (e.ctrlKey && e.key.toLowerCase() === "k")) &&
        document.activeElement !== globalSearchInput
      ) {
        e.preventDefault();
        globalSearchInput.focus();
      } else if (e.key === "Escape" && searchResultsPanel && searchResultsPanel.classList.contains("active")) {
        searchResultsPanel.classList.remove("active");
      }
    });
  }

  /* ========================================================================
     PART B: PRESENTATION DECK LOGIC (course-*.html / book-*.html)
     ======================================================================== */
  function initPresentationDeck() {
    const slides = Array.from(document.querySelectorAll(".mck-slide"));
    if (!slides.length) return;

    const navItems = Array.from(document.querySelectorAll(".slide-nav-item"));
    const btnModeSlide = document.getElementById("btnModeSlide");
    const btnModeScroll = document.getElementById("btnModeScroll");
    const btnToggleSidebar = document.getElementById("btnToggleSidebar");
    const btnToggleNotesAll = document.getElementById("btnToggleNotesAll");
    const btnFullscreen = document.getElementById("btnFullscreen");
    const btnPrev = document.getElementById("btnPrevSlide");
    const btnNext = document.getElementById("btnNextSlide");
    const slideCounter = document.getElementById("slideCounter");
    const progressBar = document.getElementById("deckProgressBar");
    const deckSearchInput = document.getElementById("deckSearchInput");
    const deckSearchStatus = document.getElementById("deckSearchStatus");
    const layerBtns = Array.from(document.querySelectorAll(".layer-btn"));

    let currentIndex = 0;
    let allNotesOpen = false;

    // Cache original HTML of searchable elements inside slides for clean re-highlighting
    const searchableTargets = [];
    slides.forEach((slide, idx) => {
      const elements = slide.querySelectorAll(
        ".mck-action-title, .bucket-title, .bucket-list li, .mck-table td, .mck-table th, .mck-takeaway-bar, .notes-body"
      );
      elements.forEach((el) => {
        searchableTargets.push({
          slideIndex: idx,
          el: el,
          origHTML: el.innerHTML
        });
      });
    });

    function updateSlideView(index, updateHash = true) {
      if (index < 0) index = 0;
      if (index >= slides.length) index = slides.length - 1;
      currentIndex = index;

      slides.forEach((s, i) => {
        if (i === currentIndex) {
          s.classList.add("active-slide");
        } else {
          s.classList.remove("active-slide");
        }
      });

      const activeId = slides[currentIndex].id;
      navItems.forEach((item) => {
        if (item.getAttribute("data-target") === activeId) {
          item.classList.add("active");
          item.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          item.classList.remove("active");
        }
      });

      if (slideCounter) {
        slideCounter.textContent = `Slide ${currentIndex + 1} / ${slides.length}`;
      }

      if (progressBar) {
        const pct = ((currentIndex + 1) / slides.length) * 100;
        progressBar.style.width = `${pct}%`;
      }

      if (updateHash && history.replaceState) {
        const url = new URL(window.location.href);
        url.hash = `#${activeId}`;
        history.replaceState(null, "", url.toString());
      }

      if (document.body.classList.contains("mode-scroll")) {
        slides[currentIndex].scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    // Mode Switching (Slide Mode vs Scroll Handout Mode)
    function setDeckMode(mode) {
      if (mode === "scroll") {
        document.body.classList.remove("mode-slide");
        document.body.classList.add("mode-scroll");
        if (btnModeScroll) btnModeScroll.classList.add("active");
        if (btnModeSlide) btnModeSlide.classList.remove("active");
      } else {
        document.body.classList.remove("mode-scroll");
        document.body.classList.add("mode-slide");
        if (btnModeSlide) btnModeSlide.classList.add("active");
        if (btnModeScroll) btnModeScroll.classList.remove("active");
        updateSlideView(currentIndex, false);
      }
    }

    if (btnModeSlide) {
      btnModeSlide.addEventListener("click", () => setDeckMode("slide"));
    }
    if (btnModeScroll) {
      btnModeScroll.addEventListener("click", () => setDeckMode("scroll"));
    }

    // Sidebar Toggle
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-collapsed");
        const sidebar = document.getElementById("deckSidebar");
        if (sidebar) sidebar.classList.toggle("mobile-open");
      });
    }

    // Speaker Notes Toggle (Individual & All)
    document.querySelectorAll(".notes-toggle-header").forEach((header) => {
      header.addEventListener("click", () => {
        const parent = header.closest(".mck-speaker-notes");
        if (parent) parent.classList.toggle("open");
      });
    });

    if (btnToggleNotesAll) {
      btnToggleNotesAll.addEventListener("click", () => {
        allNotesOpen = !allNotesOpen;
        document.querySelectorAll(".mck-speaker-notes").forEach((note) => {
          if (allNotesOpen) note.classList.add("open");
          else note.classList.remove("open");
        });
        btnToggleNotesAll.classList.toggle("active", allNotesOpen);
      });
    }

    // Fullscreen Toggle
    if (btnFullscreen) {
      btnFullscreen.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Navigation Click Events
    if (btnPrev) {
      btnPrev.addEventListener("click", () => updateSlideView(currentIndex - 1));
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => updateSlideView(currentIndex + 1));
    }

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = item.getAttribute("data-target");
        const targetIdx = slides.findIndex((s) => s.id === targetId);
        if (targetIdx !== -1) {
          updateSlideView(targetIdx);
        }
      });
    });

    // Layer Filter Buttons in Sidebar
    layerBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        layerBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const layer = btn.getAttribute("data-layer");
        navItems.forEach((item) => {
          const itemLayer = item.getAttribute("data-layer");
          if (layer === "all" || itemLayer === layer) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
    });

    // In-Deck Keyword Search & Highlighting
    function runDeckSearch(rawQuery, jumpToFirstMatch = false) {
      const q = (rawQuery || "").trim().toLowerCase();

      // Restore original HTML before applying new highlights
      searchableTargets.forEach((item) => {
        item.el.innerHTML = item.origHTML;
      });

      if (!q) {
        navItems.forEach((item) => {
          item.style.display = "";
        });
        if (deckSearchStatus) deckSearchStatus.style.display = "none";
        return;
      }

      const terms = q.split(/\s+/).filter(Boolean);
      const matchedSlideIndices = new Set();

      slides.forEach((slide, idx) => {
        const text = slide.textContent.toLowerCase();
        if (terms.every((t) => text.includes(t))) {
          matchedSlideIndices.add(idx);
        }
      });

      // Highlight matching terms inside matched slides
      const regex = new RegExp("(" + terms.map(escapeRegExp).join("|") + ")", "gi");
      searchableTargets.forEach((item) => {
        if (matchedSlideIndices.has(item.slideIndex)) {
          item.el.innerHTML = item.origHTML.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, textNode) => {
            if (tag) return tag;
            return textNode.replace(regex, '<mark class="search-hl">$1</mark>');
          });
        }
      });

      // Filter sidebar nav items
      navItems.forEach((item) => {
        const targetId = item.getAttribute("data-target");
        const idx = slides.findIndex((s) => s.id === targetId);
        item.style.display = matchedSlideIndices.has(idx) ? "" : "none";
      });

      if (deckSearchStatus) {
        deckSearchStatus.style.display = "block";
        deckSearchStatus.innerHTML = `🔍 找到 <strong>${matchedSlideIndices.size}</strong> 頁包含「<span style="color:#FDE047;">${rawQuery}</span>」的簡報`;
      }

      if (jumpToFirstMatch && matchedSlideIndices.size > 0 && !matchedSlideIndices.has(currentIndex)) {
        const firstIdx = Array.from(matchedSlideIndices)[0];
        updateSlideView(firstIdx);
      }
    }

    if (deckSearchInput) {
      deckSearchInput.addEventListener("input", (e) => {
        runDeckSearch(e.target.value, true);
      });
    }

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        updateSlideView(currentIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        updateSlideView(currentIndex - 1);
      } else if (e.key === "/" && deckSearchInput) {
        e.preventDefault();
        deckSearchInput.focus();
      } else if (e.key.toLowerCase() === "n" && btnToggleNotesAll) {
        e.preventDefault();
        btnToggleNotesAll.click();
      }
    });

    // Check URL Hash & Query Parameter (?q=...#slide-XX) on Load
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("q");
    const hash = window.location.hash.replace("#", "");

    if (hash) {
      const targetIdx = slides.findIndex((s) => s.id === hash);
      if (targetIdx !== -1) {
        currentIndex = targetIdx;
      }
    }

    updateSlideView(currentIndex, false);

    if (initialQuery && deckSearchInput) {
      deckSearchInput.value = initialQuery;
      runDeckSearch(initialQuery, !hash);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPortalPage();
    initPresentationDeck();
  });
})();
