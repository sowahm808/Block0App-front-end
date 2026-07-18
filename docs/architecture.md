# Architecture

The app is organized by core infrastructure, shared primitives, and lazy-loaded features. Auth stores access tokens in memory, refreshes through secure backend cookies, and route guards enforce role/permission UX gates. Business workflows such as Three Whisper are modeled as explicit state machines.
