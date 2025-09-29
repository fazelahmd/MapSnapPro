# Map Shop — Complete Project (Stellar + Leaflet + Backend)

This repository contains:
- Frontend: Stellar HTML5UP template integrated with a Leaflet map and product catalog.
- Backend: Node.js (Express) + SQLite to serve products and accept orders.

## Quickstart (local)

1. Install Node.js (v16+).
2. From the `backend` folder, install dependencies:
   ```
   cd backend
   npm install
   ```
3. Start server:
   ```
   npm start
   ```
   Server runs on `http://localhost:3000`. The frontend will be served from root and API available under `/api/...`.

4. Open `http://localhost:3000` in your browser.

## Deploy tips

- For static-only deploy (GitHub Pages / Netlify) you can deploy the project root and it will serve the static site but backend APIs will not be available.
- To use the backend, deploy to a Node-capable host (Render, Heroku, Railway, DigitalOcean App Platform) and ensure `backend/package.json` dependencies are installed.

## Notes

- This is a demo starter. For production: add authentication, input validation, CSRF protection, HTTPS, and integrate with a payment gateway.
