(function () {
  "use strict";

  var PROGRAMMES = {
    beginner: {
      name: "Beginner Programme",
      priceLabel: "NGN 150,000",
      cta: "Pay NGN 150,000",
    },
    intermediate: {
      name: "Intermediate Programme",
      priceLabel: "NGN 375,000",
      cta: "Pay NGN 375,000",
    },
    advanced: {
      name: "Advanced Programme",
      priceLabel: "NGN 750,000",
      cta: "Pay NGN 750,000",
    },
  };

  var config = window.TDG_PAY_CONFIG || {};
  var apiBase = (config.API_BASE_URL || "").replace(/\/$/, "");

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var radios = document.querySelectorAll('input[name="programme"]');
  var checkoutBox = document.getElementById("checkoutBox");
  var checkoutHint = document.getElementById("checkoutHint");
  var orderSummary = document.getElementById("orderSummary");
  var summaryName = document.getElementById("summaryName");
  var summaryPrice = document.getElementById("summaryPrice");
  var emailInput = document.getElementById("payerEmail");
  var payCta = document.getElementById("payCta");
  var payCtaLabel = document.getElementById("payCtaLabel");
  var form = document.getElementById("checkoutForm");
  var formStatus = document.getElementById("formStatus");
  var formHint = document.getElementById("formHint");

  var selected = "";

  function setStatus(message, kind) {
    if (!formStatus) return;
    formStatus.textContent = message || "";
    formStatus.classList.remove("is-error", "is-info");
    if (kind === "error") formStatus.classList.add("is-error");
    if (kind === "info") formStatus.classList.add("is-info");
  }

  function unlockCheckout(programmeKey) {
    selected = programmeKey;
    var info = PROGRAMMES[programmeKey];
    if (!info) return;

    if (checkoutBox) checkoutBox.classList.remove("is-locked");
    if (checkoutHint) {
      checkoutHint.textContent = "Enter your email, then continue to Paystack.";
    }
    if (orderSummary) orderSummary.hidden = false;
    if (summaryName) summaryName.textContent = info.name;
    if (summaryPrice) summaryPrice.textContent = info.priceLabel;

    if (emailInput) {
      emailInput.disabled = false;
      emailInput.value = "";
      emailInput.focus();
    }

    if (payCta) {
      payCta.disabled = !apiBase;
      if (payCtaLabel) {
        payCtaLabel.textContent = apiBase
          ? info.cta
          : "Payment API not configured";
      }
    }

    if (formHint && apiBase) {
      formHint.textContent =
        "You will leave this page for Paystack Checkout. We never store card details.";
    }

    setStatus("", null);

    var panel = document.getElementById("checkoutPanel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  radios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (radio.checked) unlockCheckout(radio.value);
    });
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!selected) {
        setStatus("Please select a programme first.", "error");
        return;
      }

      if (!apiBase) {
        setStatus("Payment backend is not connected yet.", "error");
        return;
      }

      var email = emailInput ? emailInput.value.trim() : "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("Enter a valid email for your receipt.", "error");
        if (emailInput) emailInput.focus();
        return;
      }

      payCta.disabled = true;
      setStatus("Redirecting to Paystack...", "info");

      fetch(apiBase + "/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programme: selected, email: email }),
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
            setStatus(msg, "error");
            payCta.disabled = false;
            return;
          }
          window.location.href = result.data.authorization_url;
        })
        .catch(function () {
          setStatus(
            "Network error. Check your connection or contact support.",
            "error"
          );
          payCta.disabled = false;
        });
    });
  }
})();
