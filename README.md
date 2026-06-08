# Bubble Tea Station Corner

Static marketing site for Bubble Tea Station Corner — a kawaii bubble tea shop in Carson City, NV.

Self-contained: a single `index.html` with all images, fonts, and the cursor-chaser script served locally from `assets/`. No build step, no dependencies.

## Local preview

```bash
python -m http.server 4321 --directory .
# open http://localhost:4321
```

## Deploy

Static — deploys to Vercel as-is with zero config.
