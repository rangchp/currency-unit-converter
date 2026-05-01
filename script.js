/* =================================================================
   Currency & Unit Converter — Logic
   -----------------------------------------------------------------
   Two converters share the same UI shell:
     1. CURRENCY: live rates fetched from open.er-api.com (free, no key)
     2. UNITS:   pure JS math — length, mass, temperature, volume

   Strategy for unit conversion: every unit declares a factor relative
   to a category-specific base unit (meter, gram, liter). Convert the
   input to base, then divide by the target factor. Temperature is the
   special case (it has an offset, not just a factor).
   ================================================================= */

"use strict";

/* =====================================================================
   TAB SWITCHING (Currency ↔ Units)
   ===================================================================== */
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((p) => {
      const isActive = p.id === `${target}-panel`;
      p.classList.toggle("active", isActive);
      if (isActive) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  });
});

/* =====================================================================
   CURRENCY CONVERTER
   ===================================================================== */

const API_URL = "https://open.er-api.com/v6/latest/USD";

// Currencies shown at the top of the dropdown for convenience.
// IDR is included since this project was built in Indonesia 🇮🇩
const POPULAR = [
  "USD", "EUR", "IDR", "JPY", "GBP", "SGD",
  "AUD", "CNY", "KRW", "MYR", "THB", "CAD",
];

let rates = null; // populated after fetch

const $currencyAmount = document.getElementById("currency-amount");
const $currencyFrom = document.getElementById("currency-from");
const $currencyTo = document.getElementById("currency-to");
const $currencyResult = document.getElementById("currency-result");
const $currencyStatus = document.getElementById("currency-status");
const $currencySwap = document.getElementById("currency-swap");

async function fetchRates() {
  try {
    setStatus("Loading rates…", false);

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.result !== "success") throw new Error("API returned an error");

    rates = data.rates;
    populateCurrencies();
    convertCurrency();

    const updated = new Date(data.time_last_update_utc).toUTCString();
    setStatus(`Rates updated · ${updated}`, false);
  } catch (err) {
    console.error(err);
    setStatus(
      `⚠ Couldn't load rates: ${err.message}. Check your internet connection.`,
      true
    );
  }
}

function setStatus(message, isError) {
  $currencyStatus.textContent = message;
  $currencyStatus.classList.toggle("error", Boolean(isError));
}

function populateCurrencies() {
  const all = Object.keys(rates).sort();
  // Order: popular currencies first, then everything else
  const popularPresent = POPULAR.filter((c) => all.includes(c));
  const rest = all.filter((c) => !POPULAR.includes(c));
  const ordered = [...popularPresent, ...rest];

  for (const select of [$currencyFrom, $currencyTo]) {
    select.innerHTML = "";

    ordered.forEach((code, idx) => {
      // Visual separator between popular and rest
      if (idx === popularPresent.length) {
        const sep = document.createElement("option");
        sep.disabled = true;
        sep.textContent = "──────";
        select.appendChild(sep);
      }
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      select.appendChild(opt);
    });
  }

  $currencyFrom.value = "USD";
  $currencyTo.value = "IDR";
}

function convertCurrency() {
  if (!rates) return;

  const amount = parseFloat($currencyAmount.value);
  if (isNaN(amount)) {
    $currencyResult.textContent = "—";
    return;
  }

  const from = $currencyFrom.value;
  const to = $currencyTo.value;

  // The API gives us rates relative to USD. To convert A → B, we go A → USD → B.
  const inUSD = amount / rates[from];
  const result = inUSD * rates[to];

  $currencyResult.textContent = `${formatNumber(result)} ${to}`;
}

$currencyAmount.addEventListener("input", convertCurrency);
$currencyFrom.addEventListener("change", convertCurrency);
$currencyTo.addEventListener("change", convertCurrency);

$currencySwap.addEventListener("click", () => {
  const tmp = $currencyFrom.value;
  $currencyFrom.value = $currencyTo.value;
  $currencyTo.value = tmp;
  convertCurrency();
});

/* =====================================================================
   UNIT CONVERTER
   ---------------------------------------------------------------------
   Each non-temperature category declares a `units` map where each value
   is the factor needed to convert TO the base unit.
   E.g. Length base = meter, so 1 km = 1000 m → factor for km is 1000.
   ===================================================================== */

const UNIT_DATA = {
  length: {
    base: "meter",
    units: {
      "Millimeter (mm)": 0.001,
      "Centimeter (cm)": 0.01,
      "Meter (m)": 1,
      "Kilometer (km)": 1000,
      "Inch (in)": 0.0254,
      "Foot (ft)": 0.3048,
      "Yard (yd)": 0.9144,
      "Mile (mi)": 1609.344,
    },
  },
  mass: {
    base: "gram",
    units: {
      "Milligram (mg)": 0.001,
      "Gram (g)": 1,
      "Kilogram (kg)": 1000,
      "Tonne (t)": 1_000_000,
      "Ounce (oz)": 28.3495,
      "Pound (lb)": 453.592,
    },
  },
  temperature: {
    // Temperature gets special handling — see convertTemperature()
    units: ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"],
  },
  volume: {
    base: "liter",
    units: {
      "Milliliter (ml)": 0.001,
      "Liter (l)": 1,
      "Cubic meter (m³)": 1000,
      "Teaspoon (tsp)": 0.00492892,
      "Tablespoon (tbsp)": 0.0147868,
      "Fluid ounce (fl oz)": 0.0295735,
      "Cup (US)": 0.236588,
      "Pint (US)": 0.473176,
      "Gallon (US)": 3.78541,
    },
  },
};

let currentCategory = "length";

const $unitAmount = document.getElementById("unit-amount");
const $unitFrom = document.getElementById("unit-from");
const $unitTo = document.getElementById("unit-to");
const $unitResult = document.getElementById("unit-result");
const $unitSwap = document.getElementById("unit-swap");
const catTabs = document.querySelectorAll(".cat-tab");

function populateUnits(category) {
  const data = UNIT_DATA[category];
  const units =
    category === "temperature" ? data.units : Object.keys(data.units);

  for (const select of [$unitFrom, $unitTo]) {
    select.innerHTML = "";
    units.forEach((unit) => {
      const opt = document.createElement("option");
      opt.value = unit;
      opt.textContent = unit;
      select.appendChild(opt);
    });
  }

  // Sensible defaults — first two distinct units
  if (units.length >= 2) {
    $unitFrom.value = units[0];
    $unitTo.value = units[1];
  }
}

function convertUnit() {
  const amount = parseFloat($unitAmount.value);
  if (isNaN(amount)) {
    $unitResult.textContent = "—";
    return;
  }

  const from = $unitFrom.value;
  const to = $unitTo.value;
  let result;

  if (currentCategory === "temperature") {
    result = convertTemperature(amount, from, to);
  } else {
    const factors = UNIT_DATA[currentCategory].units;
    const inBase = amount * factors[from];
    result = inBase / factors[to];
  }

  $unitResult.textContent = formatNumber(result);
}

/**
 * Temperature conversion — does NOT use simple factor math because
 * the scales have different zero points. We always pass through
 * Celsius as the intermediate step.
 */
function convertTemperature(value, from, to) {
  // Step 1: convert input to Celsius
  let celsius;
  if (from.startsWith("Celsius")) celsius = value;
  else if (from.startsWith("Fahrenheit")) celsius = (value - 32) * (5 / 9);
  else if (from.startsWith("Kelvin")) celsius = value - 273.15;

  // Step 2: convert Celsius to target
  if (to.startsWith("Celsius")) return celsius;
  if (to.startsWith("Fahrenheit")) return celsius * (9 / 5) + 32;
  if (to.startsWith("Kelvin")) return celsius + 273.15;

  return NaN; // safety fallback — should never reach
}

catTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentCategory = tab.dataset.cat;
    catTabs.forEach((t) => t.classList.toggle("active", t === tab));
    populateUnits(currentCategory);
    convertUnit();
  });
});

$unitAmount.addEventListener("input", convertUnit);
$unitFrom.addEventListener("change", convertUnit);
$unitTo.addEventListener("change", convertUnit);

$unitSwap.addEventListener("click", () => {
  const tmp = $unitFrom.value;
  $unitFrom.value = $unitTo.value;
  $unitTo.value = tmp;
  convertUnit();
});

/* =====================================================================
   SHARED HELPERS
   ===================================================================== */

/**
 * Smart number formatter:
 *  - Big numbers get thousand separators with up to 2 decimals
 *  - Small numbers (|n| < 1) get up to 6 decimals to preserve precision
 */
function formatNumber(n) {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const opts =
    abs >= 1
      ? { maximumFractionDigits: 2 }
      : { maximumFractionDigits: 6 };
  return n.toLocaleString("en-US", opts);
}

/* =====================================================================
   INIT
   ===================================================================== */
fetchRates();
populateUnits("length");
convertUnit();
