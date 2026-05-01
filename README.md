# Converter — Currency &amp; Units

A clean, fast converter for both **live currency exchange** and **everyday unit math**. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step.

> 🌐 **[Live demo](https://YOUR-USERNAME.github.io/currency-unit-converter/)** &nbsp;·&nbsp; (replace with your URL after deploying — see below)

![App preview](preview.png)

---

## ✨ Features

- 💱 **Live currency rates** for 160+ currencies (including IDR, MYR, SGD, THB), powered by a free API — no API key required.
- 📏 **Four unit categories**: Length, Mass, Temperature, Volume.
- ↻ **Instant swap** between source and target.
- 📱 **Fully responsive** — works on mobile, tablet, desktop.
- ♿ **Accessible** — ARIA roles, keyboard navigation, `prefers-reduced-motion` respected.
- ⚡ **Zero dependencies** — pure HTML/CSS/JS, ~15 KB total.
- 🌙 **Dark editorial theme** with carefully chosen typography.

---

## 🛠 Tech Stack

| Layer        | Tool                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| Markup       | Semantic HTML5                                                           |
| Styling      | CSS3 (custom properties, grid, clamp, media queries)                     |
| Logic        | Vanilla JavaScript (ES2020+, async/await, Fetch API)                     |
| Currency API | [open.er-api.com](https://www.exchangerate-api.com/docs/free) — free tier, no auth |
| Fonts        | Instrument Serif, Geist, JetBrains Mono (via Google Fonts)               |
| Hosting      | GitHub Pages                                                              |

---

## 🧠 How it works

### Currency conversion

Rates from the API are quoted relative to USD. To convert from currency `A` to currency `B`, we take the indirect route through USD:

```
amount_in_USD = amount_in_A / rate_of_A
result        = amount_in_USD * rate_of_B
```

This means a single API call gives us conversions between any pair of supported currencies.

### Unit conversion

Each non-temperature category defines a **base unit** (meter for length, gram for mass, liter for volume). Every unit then declares a factor that converts it to the base:

```
value_in_base = amount * factor_of_source_unit
result        = value_in_base / factor_of_target_unit
```

**Temperature is special** — it has a non-zero offset (water freezes at 0 °C but 32 °F), so simple multiplication doesn't work. The app routes every temperature through Celsius as an intermediate step.

---

## 🚀 Run locally

No build step, no dependencies. Just open the file:

```bash
git clone https://github.com/YOUR-USERNAME/currency-unit-converter.git
cd currency-unit-converter
```

Then either:

- Double-click `index.html` to open it in your browser, **or**
- Serve it with any static server, e.g.:
  ```bash
  npx serve .
  # or
  python3 -m http.server 8080
  ```

---

## 🌐 Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to your repo → **Settings** → **Pages**.
3. Under **Source**, select branch `main` and folder `/ (root)`. Save.
4. Wait ~1 minute. Your app will be live at `https://YOUR-USERNAME.github.io/currency-unit-converter/`.

Update the demo link at the top of this README once it's live.

---

## 📂 Project structure

```
currency-unit-converter/
├── index.html      # Markup
├── style.css       # Styles & theme
├── script.js       # Conversion logic & UI behavior
├── README.md
└── LICENSE
```

---

## 💡 Possible next steps

If you want to keep extending this project as you learn:

- [ ] Add more unit categories (speed, area, time, digital storage)
- [ ] Persist last-used currencies and amount in `localStorage`
- [ ] Add a small line chart of exchange-rate history (using a free API like Frankfurter)
- [ ] Add a light/dark theme toggle
- [ ] Migrate to React + TypeScript as a learning exercise
- [ ] Add unit tests for the conversion functions (Vitest or Jest)
- [ ] Add internationalization (i18n) — Bahasa Indonesia, English, etc.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

---

## 🙋 Author

Built by **Rangga**, an Informatics student.
Find me on [GitHub](https://github.com/YOUR-USERNAME).
