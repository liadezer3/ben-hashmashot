# Ben HaShmashot (בין השמשות)

**Live:** [ben-hashmashot.com](https://ben-hashmashot.com)

A web and mobile app that gives observant Jews in Israel exact Shabbat and Jewish-holiday times — candle lighting, sunset, and havdalah — based on their location, with reminders and alarms so nothing is left to memory or to printed calendars.

## Why it exists

Shabbat and holiday times change every week and vary by city. People end up checking printed tables, synagogue boards, or generic websites that aren't built around *their* location. Ben HaShmashot puts the exact times for *your* place in one clean, fast interface — and pushes reminders before candle lighting so you're never caught off guard.

## Features

- Exact candle-lighting, sunset (shkia), and havdalah times per location in Israel
- Location-aware times, with place search powered by Google Maps
- Shabbat and holiday reminders / local alarms
- Hebrew-first UI with multilingual support (i18n)
- Companion mobile app for Android and iOS
- Amazon Alexa skill — ask for this week's times by voice
- Messaging-bot integrations (Telegram, WhatsApp bot in progress)

## Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui (Radix), TanStack Query, Framer Motion
- **Jewish calendar engine:** [@hebcal/core](https://github.com/hebcal/hebcal) for halachic date and zmanim calculations
- **Backend:** Supabase (PostgreSQL, Edge Functions, migrations)
- **Mobile:** Capacitor (Android / iOS) with local notifications
- **Voice:** Alexa skill (custom interaction model + Lambda)
- **Maps:** Google Maps browser API
- **Build & workflow:** developed on [Lovable](https://lovable.dev) (AI-assisted low-code), two-way sync with this GitHub repo

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env` with Supabase keys (not committed — see `.gitignore`).

## Project structure

- `src/` — React app (pages, components, hooks, i18n)
- `supabase/` — database migrations and Edge Functions
- `alexa-skill/` — Alexa skill definition and Lambda code
- `capacitor.config.ts` — native app configuration

## Author

**Liad Ezer** — [github.com/liadezer3](https://github.com/liadezer3)
