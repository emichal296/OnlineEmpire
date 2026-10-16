# Profit Reads — Online Empire V2

A no-backend, no-account arcade game built with HTML, CSS and vanilla JavaScript.

## Files
- `index.html` — page structure
- `style.css` — responsive visual design
- `game.js` — gameplay, scoring, XP, local best score, controls and share action

## Publish on GitHub Pages
1. Create or open a public GitHub repository.
2. Upload all three files to the repository's root (not inside another folder).
3. Open **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**, choose `main` and `/(root)`, then Save.
5. Wait for the published link to appear. GitHub Pages serves static HTML/CSS/JS files.

## Controls
- Keyboard: Left/Right arrows or A/D to move; Space/Up to jump; P to pause.
- Touch: on-screen left, jump and right buttons.
- Collect cyan A (AI), lime B (blog) and purple F (focus) sparks.
- Avoid pink distraction markers. Skill sparks raise your score and multiplier.
- Best score and XP are saved locally in the browser on that device.

## Notes
- Sound is off by default.
- This is a client-side game. There is no global leaderboard or cross-device saving.
- The Google Fonts import is optional; the page uses system fonts if the font service is unavailable.
