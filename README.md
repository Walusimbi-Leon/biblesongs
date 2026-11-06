# 🎵 Bible Songs — 24/7 SGSS Songs & Worship Stream

[![Live Web App](https://img.shields.io/badge/Live%20Stream-bible--songs.walusimbileon1.workers.dev-amber?style=for-the-badge&logo=cloudflare)](https://bible-songs.walusimbileon1.workers.dev/)
[![Donate to SGSS](https://img.shields.io/badge/Support%20Developer-donate--to--sgss.pages.dev-emerald?style=for-the-badge&logo=paystack)](https://donate-to-sgss.pages.dev)
[![License](https://img.shields.io/badge/Organization-SGSS-blue?style=for-the-badge)](https://github.com/Walusimbi-Leon)

A modern, synchronized 24/7 continuous audio streaming radio station and on-demand music platform delivering songs, hymns, and worship audio from the **SGSS Audio Collection**.

🌐 **Live Application:** [https://bible-songs.walusimbileon1.workers.dev/](https://bible-songs.walusimbileon1.workers.dev/)  
💖 **Support the Developer:** [https://donate-to-sgss.pages.dev](https://donate-to-sgss.pages.dev)

---

## ✨ Highlights & Features

- **📻 24/7 Global Synchronized Broadcast:** Every listener worldwide experiences the exact same track at the exact same second, synchronized seamlessly via UTC timeline calculation.
- **💿 Interactive Vinyl Turntable Deck:** Realistic vinyl disc animation with RPM inertia, needle placement, and real-time canvas audio wave visualizer.
- **📚 160+ On-Demand Song Catalog:** Switch from 24/7 Live Radio into On-Demand mode to search, filter, and play any specific song in the catalog.
- **👥 Real-Time Presence & Listener Count:** See active listeners tuned in across the globe, with deduplicated session heartbeats and listener profiles.
- **💬 Community Live Chat:** Instant chat room for listeners to share thoughts, prayer requests, and fellowship with threaded replies.
- **🏆 Hall of Fame & Leaderboards:** Recognition for the most dedicated daily, weekly, and all-time listeners.
- **⚡ Cloudflare Edge Audio Proxy:** Built-in HTTP Range request streaming proxy on Cloudflare Workers delivering instant, low-latency audio playback without buffering drops.
- **💖 Integrated "Support Developer" Portal:** Direct link to the SGSS donation platform ([donate-to-sgss.pages.dev](https://donate-to-sgss.pages.dev)) powered by 256-bit SSL Paystack checkout for one-time gifts and monthly sustainer plans.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & UI:** [Lucide React](https://lucide.dev/), Canvas Audio API, Framer Motion
- **Edge Runtime:** [Cloudflare Workers](https://workers.cloudflare.com/) with Cloudflare Workers Static Assets
- **Audio CDN:** High-bandwidth distributed audio releases via GitHub Releases CDN
- **Real-time State:** Firebase Realtime Database for listener presence, leaderboards, and live chat

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js (v18 or newer)
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Walusimbi-Leon/biblesongs.git
cd biblesongs

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build

```bash
# Build the production Vite bundle and server assets
npm run build
```

---

## ☁️ Deployment

The project is configured for deployment to **Cloudflare Workers** with Static Assets delegation.

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy --name bible-songs --assets=./dist --compatibility-date 2024-11-01
```

Once deployed, the app is instantly live at:
👉 **[https://bible-songs.walusimbileon1.workers.dev/](https://bible-songs.walusimbileon1.workers.dev/)**

---

## 🤝 Support the Developer & SGSS

**SGSS** creates and maintains free, open digital tools, audiobooks, educational apps, Discord bots, and community music streams.

If you enjoy the music and would like to support hosting, server runners, audio storage, and future development:

👉 **[Donate to SGSS via Paystack](https://donate-to-sgss.pages.dev)**

- **One-time donations:** Any amount ($1, $5, $10, $25, or custom)
- **Monthly sustainers:** Automated recurring support ($1 – $100/mo)
- **Security:** 256-bit SSL encrypted Paystack checkout accepting international cards & mobile money

---

## 📄 License & Organization

Maintained by **Leon Walusimbi** for the **SGSS Organization**.  
All rights reserved © SGSS.
