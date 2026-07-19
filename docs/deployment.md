# Deployment Guide

Build with `npm run build`, host `dist/block0-app/browser` behind Nginx or Azure Static Web Apps, and configure backend routing/proxy separately. Docker uses a Node build stage and Nginx runtime stage with SPA fallback and security headers.


## Production backend

The production Angular environment points API traffic at `https://block0app-back-end.onrender.com/api`. Keep `apiWithCredentials` enabled when the backend issues HttpOnly refresh-token cookies; the backend must allow the deployed frontend origin through CORS with credentials.
