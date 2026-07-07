/* app.js — bootstrap after all content scripts have registered */
(function () {
  "use strict";

  // Toast helper
  let toastTimer = null;
  window.Toast = function (msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => (t.hidden = true), 260);
    }, 1600);
  };

  function boot() {
    const fws = window.FRAMEWORKS || [];
    if (!fws.length) {
      document.getElementById("content").innerHTML =
        '<div class="sr-empty" style="padding:60px">No content loaded. Ensure content/*.js files are present.</div>';
      return;
    }

    window.Nav.buildSidebar();
    window.Search.init();
    window.Flashcards.init();
    window.Nav.initShortcuts();

    // wire chrome
    document.getElementById("menuToggle").addEventListener("click", window.Nav.toggleMobileNav);
    document.getElementById("scrim").addEventListener("click", window.Nav.closeMobileNav);
    document.getElementById("resetProgress").addEventListener("click", () => {
      if (confirm("Reset all reviewed progress?")) window.Progress.reset();
    });

    // pick initial framework: hash > last visited > first
    let start = (location.hash || "").slice(1);
    if (!start || !fws.find((f) => f.id === start)) {
      try { start = localStorage.getItem("fwdeck.last"); } catch (e) {}
    }
    if (!start || !fws.find((f) => f.id === start)) start = fws[0].id;

    window.Nav.select(start, false);
    window.Progress.refreshUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
