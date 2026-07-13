<a name="readme-top"></a>

# 

# perish

**A local-first ledger of things that end.**

Milk. Ibuprofen. Your passport. The laptop warranty. The water filter. The smoke-detector battery. Everything in your life has a date on it, and you are currently storing all of those dates in your head, where they quietly expire along with the mayonnaise.

perish is a small, fast web app that keeps the dates so you don't have to — and it does it without an account, without a server, and without ever seeing your data.

![p](https://github.com/bell-kevin/perish/blob/main/docs/Screenshot%20from%202026-07-13%2012-31-00.png)

## Why it's different

- **Everything, not just food.** Most expiry apps stop at the pantry. perish tracks eight categories: food, medicine, personal care, documents, warranties, subscriptions, household intervals (filters, batteries, extinguisher checks), and other.
- **Opened-item logic.** A jar of salsa is "good until October" *and* "good for 14 days once opened" — whichever comes first. perish models both and computes the effective date, which is the feature every fridge actually needs.
- **Scan it.** Point your camera at a barcode. perish uses the native `BarcodeDetector` API where available and falls back to [ZXing](https://github.com/zxing-js/browser) everywhere else, then looks the product up on [Open Food Facts](https://world.openfoodfacts.org) to prefill the name. Only the barcode digits are sent, and only when you're online — manual entry always works.
- **Shelf-life hints.** Type "milk" and perish suggests a typical window, informed by the USDA FoodKeeper dataset (public domain). Guidance, not gospel — the label and your senses win.
- **Reminders with zero infrastructure.** No push server, on purpose. Export your dates as an `.ics` calendar file; every event carries a 2-days-before alarm and your calendar app does the reminding. Works with anything that speaks iCalendar.
- **The waste ledger.** When something leaves the shelf, mark it *used* or *wasted*. perish keeps score — counts, waste rate, and dollars if you log prices. Gentle accountability for the crisper drawer.
- **Local-first, offline-first.** Your ledger lives in IndexedDB in your browser. The app is an installable PWA that works fully offline. Export/import JSON backups whenever you like.

## The stack is the browser

There is no backend. The "whole stack" is:

| Layer | What | License |
|---|---|---|
| UI | [React](https://react.dev) + [Vite](https://vitejs.dev) + TypeScript | MIT |
| Storage | [Dexie](https://dexie.org) over IndexedDB | Apache-2.0 |
| Barcode fallback | [@zxing/browser](https://github.com/zxing-js/browser) | Apache-2.0 |
| Offline / install | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox | MIT |
| Product lookup | [Open Food Facts](https://world.openfoodfacts.org) (optional, online) | AGPL server, ODbL data |
| Shelf-life data | Subset informed by USDA FoodKeeper | Public domain |
| perish itself | this repo | **AGPL-3.0-only** |

Fonts are system stacks (the monospace date-stamps *are* the design), so nothing is fetched from third-party CDNs and the app is fully self-contained when deployed.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the production build locally
```

Deploy `dist/` to any static host (Bolt, Netlify, Cloudflare Pages, your own nginx). Two notes:

- Camera access requires **HTTPS** (any real host provides this; `localhost` also counts).
- The PWA assumes it's served from the site root. For a sub-path deploy (e.g. GitHub Pages project sites), set `base` in `vite.config.ts`.

## Privacy

perish stores everything in your browser's IndexedDB and makes exactly one kind of network request: an optional barcode lookup to Open Food Facts when you scan or type a code while online. No analytics, no accounts, no cookies, no telemetry. Clearing the site's data erases the ledger, so use **Data → Export backup** if you care about it.

## Disclaimers

Shelf-life hints are typical figures for convenience, not food-safety or medical advice. Trust printed dates, product labels, your pharmacist, and your nose — in roughly that order.

## License

perish is free software, released under the **GNU Affero General Public License v3.0** (see [LICENSE](LICENSE)). If you run a modified version of this software for others to use over a network, the AGPL asks you to offer them the source. That's the point.

## Roadmap ideas

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Some directions that would fit:

- Web Push reminders as an *optional* self-hostable companion (keeping the default zero-server)
- Household sync via file-based backup merge or CRDTs
- Quantity decrement ("used one of six")
- Locale-aware currency and date-stamp formats
- Import from receipt OCR

--------------------------------------------------------------------------------------------------------------------------

## Automated architecture diagram

This template now includes an automated architecture diagram process:

- `scripts/generate_architecture_diagram.py` scans source files and docs and writes `docs/architecture.mmd`.
- `.github/workflows/update-architecture-diagram.yml` regenerates and commits `docs/architecture.mmd` on every push.
- `.github/workflows/check-architecture-diagram.yml` ensures pull requests have an up-to-date architecture diagram.

### Local usage

```bash
python scripts/generate_architecture_diagram.py
python scripts/generate_architecture_diagram.py --check
```

--------------------------------------------------------------------------------------------------------------------------
== We're Using GitHub Under Protest ==

This project is currently hosted on GitHub.  This is not ideal; GitHub is a
proprietary, trade-secret system that is not Free and Open Souce Software
(FOSS).  We are deeply concerned about using a proprietary system like GitHub
to develop our FOSS project. I have a [website](https://bellKevin.me) where the
project contributors are actively discussing how we can move away from GitHub
in the long term.  We urge you to read about the [Give up GitHub](https://GiveUpGitHub.org) campaign 
from [the Software Freedom Conservancy](https://sfconservancy.org) to understand some of the reasons why GitHub is not 
a good place to host FOSS projects.

If you are a contributor who personally has already quit using GitHub, please
email me at **kevinBell@Linux.com** for how to send us contributions without
using GitHub directly.

Any use of this project's code by GitHub Copilot, past or present, is done
without our permission.  We do not consent to GitHub's use of this project's
code in Copilot.

![Logo of the GiveUpGitHub campaign](https://sfconservancy.org/img/GiveUpGitHub.png)

<p align="right"><a href="#readme-top">back to top</a></p>
