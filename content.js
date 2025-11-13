(() => {
  // ===== IDs & classes =====
  const ROW_ID = "sfw-row";            // row container
  const PANEL_ID = "sfw-panel";        // parent panel id
  const PANEL_CLASS = "sfw-panel";     // common panel class
  const BTN_CLASS = "sfw-btn";
  const INPUT_ID = "sfw-input";

  const HCLASS = "sfw-mark";           // base highlight class
  const HCURRENT = "sfw-mark-current"; // current match class

  // ===== If row exists: toggle the whole UI and focus parent input =====
  const existingRow = document.getElementById(ROW_ID);
  if (existingRow) {
    const visible = getComputedStyle(existingRow).display !== "none";
    existingRow.style.display = visible ? "none" : "flex";
    if (!visible) {
      const parentInput = existingRow.querySelector(`#${PANEL_ID} #${INPUT_ID}`);
      parentInput && parentInput.focus({ preventScroll: true });
    }
    return;
  }

  // ===== Styles =====
  const style = document.createElement("style");
  style.textContent = `
    /* Row that holds panels inline */
    #${ROW_ID} {
      position: fixed; top: 16px; left: 16px; z-index: 2147483647;
      display: flex; gap: 8px; align-items: flex-start; pointer-events: auto;
      font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    }

    /* Common panel look (parent + child) */
    .${PANEL_CLASS} {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border: 1px solid #444; border-radius: 10px;
      background: rgba(20,20,20,.95); color: #eee; box-shadow: 0 8px 24px rgba(0,0,0,.35);
    }
    .${PANEL_CLASS} input {
      width: 280px; padding: 6px 8px; border-radius: 8px;
      border: 1px solid #555; background: #1e1e1e; color: #eee; outline: none;
    }
    .${BTN_CLASS} {
      padding: 4px 8px; border-radius: 8px; border: 1px solid #555;
      background: #2b2b2b; color: #eee; cursor: pointer; user-select: none;
    }
    .${BTN_CLASS}:hover { background: #3a3a3a; }
    .sfw-counter { min-width: 52px; text-align: center; opacity: .9; }
    .sfw-chip { font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid #555; }

    /* Highlights */
    mark.${HCLASS} { padding: 0 2px; border-radius: 3px; color: inherit; outline: none; }
    mark.${HCLASS}[data-role="parent"] { background: rgba(255, 230, 92, .6); }   /* yellow */
    mark.${HCLASS}[data-role="child"]  { background: rgba(116, 192, 252, .45); } /* blue */
    mark.${HCLASS}.${HCURRENT} { box-shadow: 0 0 0 2px rgba(77, 171, 247, .9); background: rgba(255, 230, 92, .95); }
  `;
  document.documentElement.appendChild(style);

  // ===== Row container (inside <body>) =====
  const row = document.createElement("div");
  row.id = ROW_ID;
  (document.body || document.documentElement).appendChild(row);

  // ===== Parent panel (original behavior) =====
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = PANEL_CLASS;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Parent search bar");

  const input = document.createElement("input");
  input.id = INPUT_ID;
  input.type = "text";
  input.placeholder = "Parent: type to highlight on page…";

  const btnPrev = document.createElement("button");
  btnPrev.className = BTN_CLASS; btnPrev.type = "button";
  btnPrev.title = "Previous (Shift+Enter)"; btnPrev.textContent = "◀";

  const counter = document.createElement("span");
  counter.className = "sfw-counter"; counter.textContent = "0 / 0";

  const btnNext = document.createElement("button");
  btnNext.className = BTN_CLASS; btnNext.type = "button";
  btnNext.title = "Next (Enter)"; btnNext.textContent = "▶";

  const close = document.createElement("button");
  close.className = BTN_CLASS; close.type = "button";
  close.textContent = "✕"; close.title = "Close (Esc)";

  panel.append(input, btnPrev, counter, btnNext, close);
  row.appendChild(panel);

  // ===== “+” button to add child panels =====
  const addBtn = document.createElement("button");
  addBtn.className = `${BTN_CLASS} sfw-add-child`;
  addBtn.type = "button";
  addBtn.title = "Add child search bar";
  addBtn.textContent = "+";
  row.appendChild(addBtn);

  input.focus({ preventScroll: true });

  // ===== Parent search state & logic =====
  let hits = [];
  let currentIndex = -1;
  const parentMarkClass = "sfw-p-1";

  input.addEventListener("input", debounce(rebuildHighlights, 120));
  btnNext.addEventListener("click", () => goNext());
  btnPrev.addEventListener("click", () => goPrev());
  close.addEventListener("click", cleanupAndRemove);

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cleanupAndRemove();
      return;
    }
    if (document.activeElement === input && e.key === "Enter") {
      e.preventDefault();
      e.shiftKey ? goPrev() : goNext();
    }
  };
  document.addEventListener("keydown", onKey, true);

  const obs = new MutationObserver(() => {
    if (!document.getElementById(ROW_ID)) {
      tearDown();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  function rebuildHighlights() {
    clearHighlights();
    const term = (input.value || "").trim();
    if (!term) { updateCounter(); return; }
    hits = highlightAcrossNodes(term, "parent", parentMarkClass);
    currentIndex = hits.length ? 0 : -1;
    if (currentIndex >= 0) focusHit(currentIndex, { smooth: false });
    updateCounter();
  }
  function goNext() {
    if (!hits.length) return;
    currentIndex = (currentIndex + 1) % hits.length;
    focusHit(currentIndex, { smooth: true });
    updateCounter();
  }
  function goPrev() {
    if (!hits.length) return;
    currentIndex = (currentIndex - 1 + hits.length) % hits.length;
    focusHit(currentIndex, { smooth: true });
    updateCounter();
  }
  function focusHit(i, { smooth }) {
    document.querySelectorAll(`mark.${HCLASS}.${HCURRENT}.${parentMarkClass}`).forEach(m => m.classList.remove(HCURRENT));
    const el = hits[i];
    if (!el || !document.contains(el)) { rebuildHighlights(); return; }
    el.classList.add(HCURRENT);
    try { el.scrollIntoView({ block: "center", inline: "nearest", behavior: smooth ? "smooth" : "auto" }); } catch {}
  }
  function updateCounter() {
    const total = hits.length;
    const idx = total ? (currentIndex + 1) : 0;
    counter.textContent = `${idx} / ${total}`;
  }
  function cleanupAndRemove() {
    // clear parent + all children
    clearHighlights();
    children.forEach(c => clearHighlightsGeneric(c.markClass));
    row.remove();
    tearDown();
  }
  function tearDown() {
    style.remove();
    document.removeEventListener("keydown", onKey, true);
    obs.disconnect();
  }
  function clearHighlights() {
    clearHighlightsGeneric(parentMarkClass);
    hits = [];
    currentIndex = -1;
  }

  // ===== Child panels (now with real blue highlighting) =====
  let nextPanelId = 2;  // parent is 1
  const children = [];  // { id, el, input, close, markClass, hits }

  addBtn.addEventListener("click", () => createChildPanel());

  function createChildPanel() {
    const id = nextPanelId++;
    const markClass = `sfw-p-${id}`;

    const child = document.createElement("div");
    child.className = PANEL_CLASS;
    child.setAttribute("role", "dialog");
    child.setAttribute("aria-label", "Child search bar");

    const chip = document.createElement("span");
    chip.className = "sfw-chip";
    chip.textContent = "Child";
    chip.style.background = "rgba(116,192,252,.18)";

    const cInput = document.createElement("input");
    cInput.type = "text";
    cInput.placeholder = "Child: type to highlight (blue)…";

    const cClose = document.createElement("button");
    cClose.className = BTN_CLASS; cClose.type = "button";
    cClose.textContent = "✕"; cClose.title = "Close";

    child.append(chip, cInput, cClose);
    row.insertBefore(child, addBtn);
    cInput.focus({ preventScroll: true });

    const state = { id, el: child, input: cInput, close: cClose, markClass, hits: [] };
    children.push(state);

    // Child: live blue highlighting, no navigation or auto-scroll
    cInput.addEventListener("input", debounce(() => {
      clearHighlightsGeneric(markClass);
      const term = (cInput.value || "").trim();
      if (!term) return;
      state.hits = highlightAcrossNodes(term, "child", markClass);
    }, 120));

    cClose.addEventListener("click", () => {
      clearHighlightsGeneric(markClass);
      const idx = children.findIndex(c => c.id === id);
      if (idx >= 0) children.splice(idx, 1);
      child.remove();
    });
  }

  // ===== Generic highlighter (parent/child) =====
  function highlightAcrossNodes(term, role, markClass) {
    const needleLower = term.toLowerCase();
    if (!needleLower.length) return [];
    const nodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const text = node.nodeValue || "";
          if (!text.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          // Skip any of our UI (row, parent, children)
          if (parent.closest(`#${ROW_ID}`) || parent.closest(`#${PANEL_ID}`)) return NodeFilter.FILTER_REJECT;
          const tn = parent.tagName;
          if (["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"].includes(tn)) return NodeFilter.FILTER_REJECT;
          const cs = getComputedStyle(parent);
          if (cs.display === "none" || cs.visibility === "hidden") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let n; while ((n = walker.nextNode())) nodes.push(n);
    if (!nodes.length) return [];

    const lowers = [], lens = [];
    for (const t of nodes) { const s = t.nodeValue || ""; lowers.push(s.toLowerCase()); lens.push(s.length); }
    const full = lowers.join("");

    const matches = [];
    for (let i = 0; ; ) {
      i = full.indexOf(needleLower, i);
      if (i === -1) break;
      matches.push([i, i + needleLower.length]);
      i += needleLower.length; // non-overlapping
    }
    if (!matches.length) return [];

    const pref = [0]; for (let i = 0; i < lens.length; i++) pref.push(pref[i] + lens[i]);
    const locate = (pos) => {
      let lo = 0, hi = pref.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (pref[mid + 1] <= pos) lo = mid + 1; else hi = mid; }
      return { node: nodes[lo], offset: pos - pref[lo] };
    };

    const created = [];
    for (let k = matches.length - 1; k >= 0; k--) {
      const [s, e] = matches[k];
      const a = locate(s), b = locate(e);
      if (!a.node?.parentNode || !b.node?.parentNode) continue;
      const range = document.createRange();
      try { range.setStart(a.node, a.offset); range.setEnd(b.node, b.offset); } catch { continue; }
      const mark = document.createElement("mark");
      mark.className = `${HCLASS} ${markClass}`;
      mark.setAttribute("data-role", role); // parent -> yellow, child -> blue (via CSS)
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
      created.push(mark);
    }
    created.reverse();
    return created;
  }

  function clearHighlightsGeneric(markClass) {
    document.querySelectorAll(`mark.${HCLASS}.${markClass}, mark.${HCLASS}.${HCURRENT}.${markClass}`)
      .forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      });
  }

  // --- Utils ---
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
