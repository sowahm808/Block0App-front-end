# Deployment Guide

Build with `npm run build`, host `dist/block0-app/browser` behind Nginx or Azure Static Web Apps, and configure backend routing/proxy separately. Docker uses a Node build stage and Nginx runtime stage with SPA fallback and security headers.
