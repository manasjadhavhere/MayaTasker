# Maya Tasker

A lightweight personal task planner with a calm, responsive interface. Runs entirely in the browser, with **zero production dependencies, no separate backend, no API keys, and no environment variables**.

## Run locally

Requires Node.js 20 or newer.

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. Enter your name to open your saved workspace. A new name creates an empty workspace. The app opens on the name-entry screen each time it loads. No package installation is needed.

```sh
npm run check
npm test
npm run build
```

The build creates `dist/`, containing only HTML, CSS, JavaScript, and an SVG icon. No fonts, analytics, third-party scripts, or other network services are loaded by the app.

## Deploy to Vercel

1. Upload this project to a Git repository and import it in Vercel, or run `npx vercel` from this folder if you use the Vercel CLI.
2. Use the **Other** framework preset, **`npm run build`** build command, and **`dist`** output directory. The included `vercel.json` already specifies these settings.
3. Deploy. No environment variables, database setup, or separate backend are required.

The app uses relative module imports and an absolute `/src` asset path; host at the root of your Vercel domain. Security headers in `vercel.json` restrict scripts and network requests to the same origin and prevent framing.

## Features

- Up to five separate name-based workspaces, with automatic local saving.
- Tasks with daily, weekly, monthly, or yearly planning cadence, due dates, optional time, status, priorities, tags, descriptions, reference links, and subtasks.
- Recurring tasks create their next occurrence when completed; monthly/yearly schedules retain their original day across short months and leap years.
- Completion flow with optional notes and evidence links; completed history retains these details and supports reopening.
- Projects with descriptions, colors, target dates, progress, and project-specific task views.
- Task list and draggable Kanban board, cadence tabs, search, filters, and sorting.
- Monthly calendar with day agenda and drag-to-reschedule.
- Dashboard with real task counts, seven-day activity, daily goals, focus time, and project progress.
- Insights for today, trailing 7, 30, or 365 days, with project filters and cadence breakdowns. Completed counts use actual completion dates; pending/rate/project breakdowns use due dates within the selected period.
- Focus timer linked to a task, adjustable duration, short breaks, and recorded completed sessions. It continues while navigating the app and accounts for background-tab timer throttling using wall-clock time.
- Light, dark, or system appearance with eight theme colors saved per workspace; keyboard shortcuts and responsive layouts.
- Readable 16 px main text and inputs, secondary text at least 14 px, stronger text contrast, larger controls, visible keyboard focus, and a skip-to-content link. Phone layouts stack forms and keep task metadata visible; dense calendars, charts, and tables scroll within their panels.
- Optional in-app scheduled reminders while the page is open.
- JSON workspace backup/export and validated import into a new workspace; completed-task CSV export.
- Undo for task deletion and completion, safe link protocols, import limits, empty states, and accessible dialogs/form labels.

## Storage and workspace behavior

**Workspaces are browser-local profiles, not authenticated accounts.** The same name on another device or browser creates an independent workspace. People using the same browser can switch among all its workspaces. This matches a serverless static deployment; secure accounts, shared projects, cross-device sync, email notifications, and reminders while the app is closed require a shared persistence/authentication service.

Data is saved under `maya-tasker:v1` in `localStorage`, scoped to the site origin. Clearing site data, private browsing, changing browsers/domains, or browser storage restrictions can remove or isolate records. Export JSON backups regularly from **Settings & backup**. Import preserves the current workspace and creates a separate restored workspace. Each browser supports a maximum of five workspaces. A storage warning appears if saving fails.

The focus timer survives in-app navigation, but resets on refresh or page closure. Only completed focus sessions are logged. Times follow the visitor's device timezone. Task reminders appear inside the app while it remains open; this app does not request browser notification permission.

For simultaneous tabs, Maya Tasker detects saves from another tab and asks you to reload rather than knowingly overwrite newer data. Use one active editing tab per browser.

## Project structure

```text
index.html              App entry point
src/app.js              UI, workflows, local persistence, timer
src/model.js            Data model, recurrence, dates, import validation
src/styles.css          Responsive UI and light/dark themes
scripts/build.mjs       Dependency-free static build
scripts/serve.mjs       Local preview server
tests/model.test.mjs    Date, recurrence, completion, backup, isolation checks
vercel.json             Ready-to-deploy Vercel configuration
```

No sample accounts, tasks, or projects are included. Every new person starts with an empty workspace. Returning names restore their saved tasks, projects, history, and theme preferences on the same browser. Name matching ignores capitalization and extra spaces. To return to name entry, use the workspace menu. Old workspaces marked as demo are excluded when loading earlier app data.
