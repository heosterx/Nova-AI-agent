---
name: testing-nova-frontend
description: Test the Nova AI Agent OS SvelteKit frontend UI end-to-end. Use when verifying UI rendering, navigation, validation, theming, or component state changes.
---

# Testing Nova Frontend UI

## Prerequisites

- Node.js 20+ and npm installed
- Repo cloned at `repos/nova-ai-agent`

## Devin Secrets Needed

None for frontend-only testing. Backend/Supabase keys needed only if testing API integration.

## Setup

1. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```

2. **Auth bypass** (required when no backend/Supabase is configured):
   Edit `frontend/src/routes/+layout.svelte` — in `onMount()`, comment out the `getMe()` call and set a fake user:
   ```svelte
   onMount(async () => {
     authStore.set({ user: { id: 'test', email: 'test@test.com' }, loading: false });
     // const user = await getMe();
     // authStore.set({ user, loading: false });
     // if (!user && !$page.url.pathname.startsWith('/auth')) {
     //   goto('/auth/login');
     // }
   });
   ```
   This allows access to all inner pages without a real auth session. **Do NOT commit this change.**

3. Start dev server:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5173`.

## Navigation

- Chrome address bar might treat `localhost:5173` as a search query instead of navigating. If this happens, use Puppeteer CDP to navigate programmatically:
  ```js
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:29229' });
  const pages = await browser.pages();
  await pages[0].goto('http://localhost:5173/path', { waitUntil: 'networkidle2' });
  browser.disconnect();
  ```
- Sidebar click coordinates may need fine-tuning. The sidebar nav items are stacked vertically starting around y=187 (Chat) with ~47px spacing. Use the DOM output from the computer tool to verify exact positions.

## Key Test Areas

### Auth Pages (`/auth/login`, `/auth/signup`)
- Verify dark theme colors: bg-primary `#0F0F14`, accent-primary `#7C3AED`
- Check form elements: placeholders, button text, navigation links
- Client-side validation: password mismatch error, minimum length error (6 chars)

### Main App Shell (`/`)
- Header: Nova icon + "Nova" text + API status dots
- Sidebar: 6 nav items with active state indicator (accent border)
- Chat empty state: CPU icon, "Welcome to Nova", 4 prompt buttons
- InputBar: textarea with placeholder, paperclip/mic/send icons

### Inner Pages (Memory, Tasks, Files, Voice, Settings)
- Each page has a heading with an icon
- Memory: "Add Memory" button, search, category filter
- Tasks: 3-column layout (Pending/In Progress/Completed)
- Files: drag-drop zone, "Browse Files" button
- Voice: cyan mic button, waveform, toggle between idle/recording states
- Settings: System Prompt textarea, Model select, Voice ID input, Theme toggle, Save button

### Interactive Components
- **Sidebar toggle**: Collapse button at bottom of sidebar. Collapsed = icons only (~60px wide). Expanded = icons + labels (~200px wide).
- **Voice mic toggle**: Idle = cyan button + Mic icon + "Click to start recording". Recording = red button + MicOff icon + animated waveform + "Recording... Click to stop".

## Known Issues

- The dark background might not cover the full viewport width — a white strip may appear on the right side. This is a CSS/layout issue (main content area doesn't stretch to full width).
- Settings page form sections might appear blank on initial load — scroll to reveal content.
- Task page column headers ("Pending", "In Progress", "Completed") might not be distinctly visible.

## Tips

- Use screen recording for browser testing — start before navigating and annotate each test/assertion.
- Take screenshots at key assertion points for the test report.
- The app uses Tailwind dark theme — verify colors via visual inspection rather than computed styles.
- Toast error notifications may appear when API calls fail (expected without backend) — these can be dismissed or ignored.
- When testing on Windows, use MINGW64/Git Bash and `NODE_PATH` for Puppeteer scripts.