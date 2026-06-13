# Crimson Scales — Class Knowledge Base

A fan-made reference web app for the **Crimson Scales** and **Trail of Ashes** board game expansions. Currently covers the **Inox Chainguard** class with full card data, build guides, perk tracker, and tips.

> Guide source: *Magatis* on Imgur (August 2022)  
> Fan-made reference tool — not affiliated with Crimson Scales or Isaac Childres.

---

## Features

- **Overview** — Class mechanics (Shackle, Swing), role in party, XP/HP table
- **Cards** — All 29 cards (Levels 1–9 + X cards) with searchable/filterable browser
- **Builds** — Bruiser and Trap build guides with level-up paths, expandable panels, and direct card filtering
- **Perks** — Interactive perk tracker with checkboxes and reset
- **Tips** — Categorized play tips distilled from community guides

---

## Running locally

### With Docker (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/crimson-scales-kb.git
cd crimson-scales-kb
docker compose up
```

Open [http://localhost:8080](http://localhost:8080).

### Without Docker

The app is pure HTML/CSS/JS with no build step. Just open `src/index.html` directly in a browser, or serve with any static file server:

```bash
cd src
npx serve .
# or
python3 -m http.server 8080
```

---

## Project structure

```
crimson-scales-kb/
├── src/
│   ├── index.html   # App shell and markup
│   ├── style.css    # All styles
│   ├── data.js      # Card, perk, and tip data
│   └── app.js       # Application logic
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .github/
    └── workflows/
        └── docker.yml   # CI: builds and pushes to ghcr.io on merge to main
```

---

## Deployment

### Production server (searing-plains.com)

The app runs at `cs.searing-plains.com` behind a Caddy reverse proxy on port 8081.

**First-time setup on the server:**

```bash
# Set your GitHub username
export GITHUB_REPO=your-github-username/crimson-scales-kb

# Pull and start
docker compose --profile prod pull
docker compose --profile prod up -d
```

**Updating to the latest image:**

```bash
docker compose --profile prod pull
docker compose --profile prod up -d --force-recreate
```

The GitHub Actions workflow automatically builds and pushes a new image to `ghcr.io` on every push to `main`, so deployment is just a pull + recreate.

**Caddy reverse proxy config** (`/etc/caddy/Caddyfile`):

```
searing-plains.com {
    reverse_proxy localhost:8080
}

cs.searing-plains.com {
    reverse_proxy localhost:8081
}
```

### Any static host

Since the app is pure static files, you can also deploy `src/` to any host:
- **Netlify / Vercel** — drag and drop the `src/` folder, or point at the repo
- **GitHub Pages** — set Pages source to the `src/` folder on `main`
- **Cloudflare Pages** — connect repo, set build output to `src/`

---

## Card images

Card images are loaded at runtime from the [any2cards/gloomhaven](https://github.com/any2cards/gloomhaven) repository on GitHub. The URL pattern is:

```
https://raw.githubusercontent.com/any2cards/gloomhaven/master/images/character-ability-cards/{game}/{class-slug}/{prefix}-{cardnum}.png
```

For Chainguard: `crimson-scales/chainguard/cs-cg-{059-087}.png`

Card metadata (xws identifiers, image paths) is sourced from [`any2cards/worldhaven/data/character-ability-cards.js`](https://github.com/any2cards/worldhaven/blob/master/data/character-ability-cards.js), filtering by `character-xws: "chainguard"`. Note that Crimson Scales card **images** live in the `gloomhaven` repo, not `worldhaven`.

If GitHub is unavailable or rate-limits requests, cards will display with text only (graceful fallback built in).

---

## Adding more classes

Each class is a single data file. To add a new class:

1. Create `src/data-CLASSNAME.js` following the structure in `data.js`
2. Add a `<script>` tag for it in `index.html`
3. Add a button to the `.class-nav` in `index.html`
4. Wire up the class switcher in `app.js`

---

## License

Fan-made reference tool. All game content belongs to their respective creators.
