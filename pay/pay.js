(function () {
  "use strict";

  var config = window.TDG_PAY_CONFIG || {};
  var apiBase = (config.API_BASE_URL || "").replace(/\/$/, "");

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var buttons = document.querySelectorAll(".pay-btn");
  var apiReady = Boolean(apiBase);

  buttons.forEach(function (btn) {
    var card = btn.closest(".pay-card");
    var hint = card ? card.querySelector(".pay-btn-hint") : null;

    if (apiReady) {
      btn.disabled = false;
      if (hint) {
        hint.textContent = "You will be redirected to Paystack’s secure checkout.";
      }
    }

    btn.addEventListener("click", function () {
      if (!apiReady) {
        setStatus(card, "Payment backend is not connected yet.", "error");
        return;
      }

      var programme = btn.getAttribute("data-programme");
      var emailInput = card ? card.querySelector(".pay-email") : null;
      var email = emailInput ? emailInput.value.trim() : "";

      if (!email || !isValidEmail(email)) {
        setStatus(card, "Enter a valid email for your receipt.", "error");
        if (emailInput) emailInput.focus();
        return;
      }

      btn.disabled = true;
      setStatus(card, "Redirecting to Paystack…", "info");

      fetch(apiBase + "/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programme: programme, email: email }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.data || !result.data.authorization_url) {
            var msg =
              (result.data && result.data.error) ||
              "Could not start payment. Please try again or contact support.";
            setStatus(card, msg, "error");
            btn.disabled = false;
            return;
          }
          window.location.href = result.data.authorization_url;
        })
        .catch(function () {
          setStatus(
            card,
            "Network error. Check your connection or contact support.",
            "error"
          );
          btn.disabled = false;
        });
    });
  });

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setStatus(card, message, kind) {
    if (!card) return;
    var el = card.querySelector(".pay-status");
    if (!el) {
      el = document.createElement("p");
      el.className = "pay-status";
      var hint = card.querySelector(".pay-btn-hint");
      if (hint && hint.parentNode) {
        hint.parentNode.insertBefore(el, hint.nextSibling);
      } else {
        card.appendChild(el);
      }
    }
    el.textContent = message;
    el.classList.remove("is-error", "is-info");
    if (kind === "error") el.classList.add("is-error");
    if (kind === "info") el.classList.add("is-info");
  }
})();
