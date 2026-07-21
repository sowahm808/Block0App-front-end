# UI Enhancement Plan

## Phase 1 UI audit

1. **Current layout structure**
   - The application uses standalone Angular components and lazy feature routes behind a protected `ShellComponent`.
   - The shell currently has a sticky toolbar and ad-hoc mobile nav, but no desktop drawer, typed role-aware navigation metadata, page title helper, user menu, or theme controls.

2. **Inconsistent components**
   - Feature placeholder pages, dashboard, team, check-in, and auth pages each define their own cards, headings, loading text, and error blocks.
   - Several UI states are plain text instead of consistent Material-backed components.

3. **Accessibility problems**
   - Some icon/action controls lack accessible labels or are not present where needed.
   - Authentication password fields do not provide visibility toggles.
   - Loading and error states need stronger `aria-live`, `role`, and focus-visible support.

4. **Mobile responsiveness problems**
   - The shell lacks a proper drawer pattern and relies on a temporary nav block.
   - Data previews and wide content need overflow containment.
   - Forms and page headers need consistent wrapping and touch target sizing.

5. **Repeated CSS or markup**
   - Alert blocks, loading messages, page hero/header patterns, and status chips are repeated in feature pages.
   - Design values are scattered across utility classes and global CSS.

6. **Missing loading and error states**
   - Dashboard and generic feature pages have basic loading/error messages but no reusable loading, empty, or error components.
   - Check-in submission reuses a single message for success and error.

7. **Weak form validation experience**
   - Check-in fields do not expose detailed validation errors.
   - Auth forms need a more focused layout, clearer hints, and duplicate submission protection.

8. **Navigation problems**
   - Navigation is hard-coded directly in the shell template and exposes admin links without role filtering.
   - Mobile navigation does not close on every route change through a centralized subscription.

9. **Performance risks**
   - Components use Angular lazy routes, but repeated rendering lacks reusable OnPush UI primitives.
   - Global effects and subscriptions need cleanup where route events are observed.

10. **Components that should be reusable**
    - Page header, loading spinner/skeleton, empty state, error state, status badge, search input, confirmation dialog, form field error helper, toast service, and theme toggle.

## Implementation plan

- Centralize CSS custom properties for color, surfaces, spacing, radius, shadows, typography, breakpoints, motion, and focus rings.
- Add light/dark theme classes with local storage persistence and first-visit system preference support.
- Replace the shell with an accessible Material sidenav layout, typed role-aware nav config, desktop collapse, mobile drawer, top app bar, skip link, user menu, and theme toggle.
- Create shared standalone UI components and services for page headers, loading, empty/error states, status badges, search, confirmation, form errors, toast, and theme management.
- Redesign dashboard, generic feature pages, team, check-in, auth, landing, and question flow to use the shared visual system.
- Preserve existing routes, guards, API calls, auth behavior, forms, and business logic.
- Add focused unit tests for theme switching and shell role-based navigation helpers.
