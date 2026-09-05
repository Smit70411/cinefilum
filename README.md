# 🎬 Cinefilum

<div align="center">

**Watch Movies · TV Shows · Anime — All in One Place**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-cinefilum.vercel.app-f59e0b?style=for-the-badge)](https://cinefilum.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Smit70411%2Fcinefilum-181717?style=for-the-badge&logo=github)](https://github.com/Smit70411/cinefilum)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎬 **Movies** | Browse trending, popular, and top-rated movies |
| 📺 **TV Series** | Discover binge-worthy TV shows by genre |
| ⛩️ **Anime** | Dedicated anime catalog with genre filters |
| 🔍 **Smart Search** | Search across all movies, shows & anime |
| 🎯 **Recommendations** | AI-powered personalized picks based on your list |
| 👥 **Watch Together** | Sync streaming rooms with live chat |
| 📋 **My List** | Save favourites across sessions |
| 🖼️ **Avatar Cropper** | Crop profile photos from URL or upload |
| 🛡️ **Ad Shield** | Toggle to block pop-ups in the player |
| 👑 **Admin Panel** | Manage content, API keys & site analytics |
| 📱 **PWA Support** | Install as a mobile app from browser |

---

## 🚀 Live Demo

👉 **[https://cinefilum.vercel.app](https://cinefilum.vercel.app)**

---

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router v7
- **Build Tool:** Vite 6 with chunk splitting
- **Icons:** Lucide React
- **APIs:** TMDB, OMDb, TVmaze
- **Hosting:** Vercel (auto-deploy)
- **Styling:** Vanilla CSS with CSS variables

---

## ⚡ Getting Started

```bash
# 1. Clone
git clone https://github.com/Smit70411/cinefilum.git
cd cinefilum

# 2. Install
npm install

# 3. Set up env (copy and fill in API keys)
cp .env.example .env

# 4. Run locally
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
VITE_OMDB_API_KEY=your_omdb_key      # https://www.omdbapi.com/apikey.aspx (free)
VITE_TMDB_API_KEY=your_tmdb_key      # https://www.themoviedb.org/settings/api (free)
```

---

## 🔐 Admin Access

Navigate to `/admin-login` and enter the master key to unlock the admin panel.

---

## 📦 Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📁 Project Structure

```
cinefilum/
├── public/
│   ├── favicon.svg        # Browser tab icon
│   ├── og-image.png       # Social share banner
│   ├── robots.txt         # Google crawl config
│   ├── sitemap.xml        # SEO sitemap
│   └── site.webmanifest   # PWA manifest
├── src/
│   ├── data/
│   │   └── moviesData.js  # Local media catalog
│   ├── services/
│   │   └── movieApi.js    # TMDB / OMDb API layer
│   ├── main.jsx           # All components & routing
│   └── styles.css         # Global styles
├── index.html             # SEO + meta tags
├── vite.config.js         # Build config
└── vercel.json            # Deployment config
```

---

## 📜 License

[MIT](LICENSE) © 2024 [Smit70411](https://github.com/Smit70411)
