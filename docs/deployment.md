# Deployment Guide

Build with `npm run build`, host `dist/block0-app/browser` behind Nginx or Azure Static Web Apps, and configure backend routing/proxy separately. Docker uses a Node build stage and Nginx runtime stage with SPA fallback and security headers.


## Render static site routing

When the Angular frontend is deployed as a Render Static Site, configure a rewrite from `/*` to `/index.html` so browser refreshes on client-side routes (for example `/dashboard`) are served by Angular instead of Render returning a 404. This repo includes `render.yaml` with that rewrite for Blueprint-managed Render deploys. If the site was created manually in the Render Dashboard, add the same Redirect/Rewrite rule there:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

## Production backend

The production Angular environment points API traffic at `https://block0app-back-end.onrender.com/api`. Keep `apiWithCredentials` enabled when the backend issues HttpOnly refresh-token cookies; the backend must allow the deployed frontend origin through CORS with credentials.
