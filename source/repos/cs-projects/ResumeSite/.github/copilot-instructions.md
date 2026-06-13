# Copilot Instructions

## Project Guidelines
- **Portfolio roadmap:** `docs/SHIP-ROOM-PLAN.md` — phased “Ship Room” upgrade plan; update status as phases ship. This file is committed with source and syncs to GitHub on `npm run deploy`.
- Do NOT deploy to the Jason.io GitHub Pages repo unless the user specifically asks. Only build locally so they can review changes first before pushing to production.
- When the user asks to deploy, run `npm run deploy` from this directory (or `.\deploy.ps1`). That commits ResumeSite source to Coding-Project-Files, builds with the `github-pages` config, and pushes dist to the Jason.io repo.
- After pushing to the Jason.io repo, always navigate the terminal back to the project directory: C:\Users\upser\OneDrive\Desktop\Coding-Project-Files\source\repos\cs-projects\ResumeSite
