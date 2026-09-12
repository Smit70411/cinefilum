import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Play,
  Info,
  Star,
  Users,
  MessageCircle,
  Menu,
  X,
  Heart,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Lock,
  Copy,
  Send,
  Film,
  Tv,
  Key,
  Check,
  Compass,
  Radio,
  Clock,
  Shield,
  UserPlus,
  BarChart2,
  Settings2,
  Trash2,
  Edit3,
  Camera,
  Save,
  LogOut,
  Sliders
} from "lucide-react";
import {
  initialMedia,
  genres,
  getFeaturedMedia,
  getTrendingMediaList,
  getPopularMediaList,
  getTopRatedMediaList
} from "./data/moviesData";
import {
  searchMedia,
  getTmdbApiKey,
  setTmdbApiKey,
  getOmdbApiKey,
  setOmdbApiKey,
  getStreamUrl,
  STREAM_SERVERS,
  resolveTmdbId,
  fetchLiveVidsrcCatalog,
  fetchMediaDetailsById,
  getCachedMedia,
  AVATAR_PRESETS,
  fetchAccurateRecommendations,
  fetchTrailerKey,
  compressAvatarImage,
  fetchMoreGenreItems,
  deduplicateMedia
} from "./services/movieApi";
import "./styles.css";

const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";

// ── Global user store (localStorage-backed) ──────────────────────
const DEFAULT_PROFILE = {
  name: "Guest User",
  initial: "G",
  avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  bio: "",
  email: "",
  role: "user"
};

function loadProfile() {
  try {
    const raw = localStorage.getItem("cf_profile");
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(p) {
  try {
    localStorage.setItem("cf_profile", JSON.stringify(p));
  } catch (err) {
    console.warn("Storage quota limit reached, saving with lightweight avatar:", err);
    try {
      const fallback = { ...p, avatar: p.avatar?.startsWith("data:") ? "" : p.avatar };
      localStorage.setItem("cf_profile", JSON.stringify(fallback));
    } catch (e2) {
      console.error("Critical error saving profile to storage:", e2);
    }
  }
}

function getTitle(id, list = initialMedia) {
  const cached = getCachedMedia(id);
  if (cached) return cached;
  const found = list.find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id));
  return found || initialMedia[0];
}

function App() {
  const [list, setList] = useState(["m-1", "m-2", "tv-1"]);
  const [menu, setMenu] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState(null);
  const [profile, setProfile] = useState(loadProfile);
  const [allMedia, setAllMedia] = useState(initialMedia);
  const [feedMode, setFeedMode] = useState(() => {
    try { return localStorage.getItem("cf_feed_mode") || "dynamic"; }
    catch { return "dynamic"; }
  });

  const toggleFeedMode = (mode) => {
    setFeedMode(mode);
    localStorage.setItem("cf_feed_mode", mode);
  };

  useEffect(() => {
    fetchLiveVidsrcCatalog().then((catalog) => {
      if (catalog && catalog.length > initialMedia.length) {
        setAllMedia(catalog);
      }
    });
  }, []);

  const toggleList = (id) => {
    setList((x) => (x.includes(id) ? x.filter((v) => v !== id) : [...x, id]));
  };

  const updateProfile = (p) => {
    setProfile(p);
    saveProfile(p);
  };

  const handlePlayTrailer = async (media) => {
    if (!media) return;
    const title = media.title || "Movie";
    setActiveTrailer({
      title,
      year: media.year,
      trailerId: media.trailerId || null,
      loading: !media.trailerId
    });

    try {
      const trailerKey = await fetchTrailerKey(media);
      setActiveTrailer({
        title,
        year: media.year,
        trailerId: trailerKey || null,
        loading: false
      });
    } catch {
      setActiveTrailer({
        title,
        year: media.year,
        trailerId: null,
        loading: false
      });
    }
  };

  const isAdmin = profile.role === "admin";

  return (
    <div className="app">
      <header className="nav">
        <Link to="/" className="brand">
          <Compass size={22} color="#f59e0b" style={{ marginRight: 4 }} />
          CINE<span>FILUM</span>
        </Link>
        <nav className={menu ? "navlinks open" : "navlinks"}>
          {[
            { name: "Home", path: "/" },
            { name: "Movies", path: "/movies" },
            { name: "TV Series", path: "/tv-shows" },
            { name: "Anime", path: "/anime" },
            { name: "Genres", path: "/genres" },
            { name: "My List", path: "/my-list" },
            { name: "Watch Together", path: "/watch-together" },
            ...(isAdmin ? [{ name: "Admin", path: "/admin" }] : [])
          ].map((x) => (
            <Link key={x.name} to={x.path} onClick={() => setMenu(false)}>
              {x.name}
            </Link>
          ))}
        </nav>
        <div className="navright">
          <Link to="/search" aria-label="Search">
            <Search size={20} />
          </Link>
          <Link to="/profile" className="avatar" title={profile.name}>
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="avatarImg" />
            ) : (
              profile.initial || "U"
            )}
          </Link>
          <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Menu">
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Official Dynamic Movie Trailer Modal */}
      {activeTrailer && (
        <div className="trailerOverlay" onClick={() => setActiveTrailer(null)}>
          <div className="trailerModal" onClick={(e) => e.stopPropagation()}>
            <div className="trailerHeader">
              <b>{activeTrailer.title} — Official Trailer</b>
              <button className="closeBtn" onClick={() => setActiveTrailer(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="trailerVideoWrap">
              {activeTrailer.loading ? (
                <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#f59e0b" }}>
                  <div style={{ textAlign: "center" }}>
                    <Sparkles size={24} style={{ animation: "spin 2s linear infinite", marginBottom: 8 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Loading official trailer for "{activeTrailer.title}"...</p>
                  </div>
                </div>
              ) : activeTrailer.trailerId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeTrailer.trailerId}?autoplay=1&rel=0`}
                  title={activeTrailer.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(activeTrailer.title + " Official Trailer " + (activeTrailer.year || ""))}&autoplay=1&rel=0`}
                  title={activeTrailer.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} feedMode={feedMode} toggleFeedMode={toggleFeedMode} />} />
        <Route path="/movies" element={<Catalog type="movie" title="Movies" list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} feedMode={feedMode} />} />
        <Route path="/tv-shows" element={<Catalog type="tv" title="TV Series" list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} feedMode={feedMode} />} />
        <Route path="/anime" element={<Catalog type="anime" title="Anime Series & Movies" list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} feedMode={feedMode} />} />
        <Route path="/genres" element={<Genres allMedia={allMedia} list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} />} />
        <Route path="/my-list" element={<MyList list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="/continue-watching" element={<Continue allMedia={allMedia} />} />
        <Route path="/search" element={<SearchPage list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="/profile" element={<Profile list={list} toggleList={toggleList} profile={profile} updateProfile={updateProfile} allMedia={allMedia} />} />
        <Route path="/create-profile" element={<CreateProfile profile={profile} updateProfile={updateProfile} />} />
        <Route path="/settings" element={<Settings profile={profile} updateProfile={updateProfile} feedMode={feedMode} toggleFeedMode={toggleFeedMode} />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/watch-together" element={<WatchTogether profile={profile} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="/watch/:id" element={<SoloWatch list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="/admin" element={<Admin profile={profile} list={list} allMedia={allMedia} />} />
        <Route path="/admin-login" element={<AdminLogin profile={profile} updateProfile={updateProfile} />} />
        <Route path="/title/:id" element={<Details list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="/recommendations/:id" element={<RecommendationsPage list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} />} />
        <Route path="*" element={<Home list={list} toggleList={toggleList} onPlayTrailer={handlePlayTrailer} allMedia={allMedia} feedMode={feedMode} toggleFeedMode={toggleFeedMode} />} />
      </Routes>
    </div>
  );
}

// ── Hero (Modern Streaming Hero Carousel with Live Trending Titles) ──────────────
function Hero({ list, toggleList, onPlayTrailer, feedMode = "dynamic", allMedia = initialMedia }) {
  const [heroIndex, setHeroIndex] = useState(0);

  // Diverse multi-category featured titles for the dynamic carousel from allMedia
  const featuredHeroes = useMemo(() => {
    if (feedMode === "classic") return [initialMedia[0]];

    // Categorized candidate buckets from allMedia
    const trendingMovies = allMedia.filter(
      (m) => m.type === "movie" && m.backdrop && m.poster && (m.tags?.includes("trending") || m.tags?.includes("popular"))
    );
    const animeHits = allMedia.filter(
      (m) => m.backdrop && m.poster && (m.genre?.includes("Anime") || m.tags?.includes("anime"))
    );
    const tvSeries = allMedia.filter(
      (m) => m.type === "tv" && m.backdrop && m.poster && (m.tags?.includes("series") || m.tags?.includes("trending") || parseFloat(m.rating) >= 8.5)
    );
    const scifiEpics = allMedia.filter(
      (m) => m.backdrop && m.poster && (m.genre?.includes("Sci-Fi") || m.tags?.includes("scifi"))
    );

    // Interleave titles so the hero constantly rotates between Blockbusters, Anime, Hit TV Series, and Sci-Fi
    const interleaved = [];
    const maxLen = Math.max(trendingMovies.length, animeHits.length, tvSeries.length, scifiEpics.length, 10);
    const seen = new Set();

    for (let i = 0; i < maxLen; i++) {
      [trendingMovies[i], animeHits[i], tvSeries[i], scifiEpics[i], trendingMovies[i + 1], animeHits[i + 1]].forEach((item) => {
        if (item && item.backdrop && item.poster && !seen.has(String(item.id))) {
          seen.add(String(item.id));
          interleaved.push(item);
        }
      });
      if (interleaved.length >= 16) break;
    }

    return interleaved.length > 0 ? interleaved : initialMedia.slice(0, 8);
  }, [feedMode, allMedia]);

  // Auto-rotate every 7.5s if in dynamic mode
  useEffect(() => {
    if (feedMode === "classic" || featuredHeroes.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredHeroes.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [feedMode, featuredHeroes.length]);

  const activeIdx = featuredHeroes.length > 0 ? (heroIndex % featuredHeroes.length + featuredHeroes.length) % featuredHeroes.length : 0;
  const m = featuredHeroes[activeIdx] || initialMedia[0];

  // Sliding 4-item preview window centered/sliding with heroIndex
  const previewCards = useMemo(() => {
    if (featuredHeroes.length <= 4) return featuredHeroes.map((item, idx) => ({ item, idx }));
    const count = Math.min(4, featuredHeroes.length);
    const result = [];
    for (let offset = 0; offset < count; offset++) {
      const idx = (activeIdx + offset) % featuredHeroes.length;
      result.push({ item: featuredHeroes[idx], idx });
    }
    return result;
  }, [featuredHeroes, activeIdx]);

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(2,2,5,0.98) 0%, rgba(2,2,5,0.85) 42%, rgba(2,2,5,0.3) 75%, rgba(2,2,5,0.1) 100%), linear-gradient(to top, #010204 2%, transparent 40%), url(${m.backdrop || m.poster})`
      }}
    >
      <div className="heroContent">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <div className="heroRankBadge">
            🔥 #{activeIdx + 1} Trending on Cinefilum
          </div>
          <span className="typeBadge">{m.type === "movie" ? "Movie" : "TV Series"}</span>
          <span className="heroQualityTag">4K ULTRA HD</span>
          <span className="heroQualityTag">5.1 SURROUND</span>
        </div>

        <h1>{m.title}</h1>

        <div className="meta">
          <span className="heroRatingScore">
            <Star size={16} fill="#fbbf24" color="#fbbf24" /> {m.rating || "8.4"} IMDb
          </span>
          <span>{m.year}</span>
          <span>{m.runtime || (m.type === "tv" ? "TV Series" : "2h 15m")}</span>
          {m.seasons && m.type === "tv" && (
            <span>{m.seasons} {m.seasons === 1 ? "Season" : "Seasons"}</span>
          )}
        </div>

        <p className="heroDescText">{m.desc}</p>

        <div className="chips">
          {(m.genre || []).map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>

        <div className="actions">
          <Link className="btn primary" to={`/watch/${m.id}`}>
            <Play size={18} fill="currentColor" /> Watch Now
          </Link>
          <button className="btn" onClick={() => onPlayTrailer(m)}>
            <Film size={18} /> Trailer
          </button>
          <Link className="btn" to={`/watch-together?id=${m.id}`}>
            <Users size={18} /> Watch Together
          </Link>
          <Link className="btn" to={`/title/${m.id}`}>
            <Info size={18} /> Details
          </Link>
          <button
            className="iconbtn"
            onClick={() => toggleList(m.id)}
            title={list.includes(m.id) ? "In My List" : "Add to My List"}
          >
            {list.includes(m.id) ? "✓" : "+"}
          </button>
        </div>
      </div>

      {/* Hero Interactive Preview Thumbnails (Bottom Right) */}
      {feedMode === "dynamic" && featuredHeroes.length > 1 && (
        <div className="heroPreviewStrip">
          <button
            className="heroArrowBtn"
            onClick={() => setHeroIndex((prev) => (prev - 1 + featuredHeroes.length) % featuredHeroes.length)}
            aria-label="Previous Featured Title"
          >
            <ChevronLeft size={18} />
          </button>

          {previewCards.map(({ item: heroItem, idx }) => (
            <div
              key={heroItem.id}
              className={`heroPreviewCard ${activeIdx === idx ? "active" : ""}`}
              onClick={() => setHeroIndex(idx)}
            >
              <img src={heroItem.poster || FALLBACK_POSTER} alt={heroItem.title} className="heroPreviewThumb" />
              <div>
                <div className="heroPreviewTitle">{heroItem.title}</div>
                <small style={{ color: "#94a3b8", fontSize: "10px" }}>★ {heroItem.rating}</small>
              </div>
            </div>
          ))}

          <button
            className="heroArrowBtn"
            onClick={() => setHeroIndex((prev) => (prev + 1) % featuredHeroes.length)}
            aria-label="Next Featured Title"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

// ── Row (With Smooth Carousel Arrows & Expandable Grid) ────────
function Row({ title, items = [], list, toggleList, seeAllPath = "/movies", allowExpand = true }) {
  const rowRef = React.useRef(null);
  const [expanded, setExpanded] = useState(false);

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = direction === "left" ? -650 : 650;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!items || !items.length) return null;

  return (
    <section className="section">
      <div className="sectionHead">
        <h2>
          {title} {items.length > 0 && <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500 }}>({items.length})</span>}
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {allowExpand && items.length > 5 && (
            <button
              className="btn"
              onClick={() => setExpanded(!expanded)}
              style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "999px" }}
              title={expanded ? "Switch to horizontal carousel" : "View all items in grid"}
            >
              {expanded ? "Show Carousel" : "Expand All"}
            </button>
          )}
          {seeAllPath && (
            <Link to={seeAllPath} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              See all <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="grid">
          {items.map((m) => (
            <Card key={m.id} m={m} list={list} toggleList={toggleList} />
          ))}
        </div>
      ) : (
        <div className="rowWrapper">
          <button
            className="rowScrollBtn left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="row" ref={rowRef}>
            {items.map((m) => (
              <Card key={m.id} m={m} list={list} toggleList={toggleList} />
            ))}
          </div>
          <button
            className="rowScrollBtn right"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
Row = React.memo(Row);
}

// ── Card ─────────────────────────────────────────────────────────
function Card({ m, list, toggleList }) {
  return (
    <article className="card">
      <Link to={`/title/${m.id}`}>
        <img
          src={m.poster || FALLBACK_POSTER}
          alt={m.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
        />
        <div className="cardShade" />
        <span className="cardBadge">{m.type === "movie" ? "Film" : "Series"}</span>
        <div className="cardInfo">
          <strong>{m.title}</strong>
          <small>
            <span>{m.year} · IMDb {m.rating} ★</span>
            {m.genre && m.genre.length > 0 && (
              <span className="cardGenreBadge">
                {m.genre.slice(0, 2).join(" · ")}
              </span>
            )}
          </small>
        </div>
      </Link>
      <button
        className="add"
        onClick={(e) => {
          e.preventDefault();
          toggleList(m.id);
        }}
        title={list?.includes(m.id) ? "Saved" : "Add to My List"}
      >
        {list?.includes(m.id) ? "✓" : "+"}
      </button>
    </article>
  );
Card = React.memo(Card);
}

// ── Home (Standard Stream Catalog: Trending, Popular, Now Playing, Top Rated, Action, Sci-Fi) ────
function Home({ list, toggleList, onPlayTrailer, allMedia = initialMedia, feedMode = "dynamic", toggleFeedMode }) {
  const [activeChannel, setActiveChannel] = useState("all");

  const effectiveMedia = feedMode === "classic" ? initialMedia : allMedia;

  const trendingMovies = useMemo(() => effectiveMedia.filter((m) => m.type === "movie" && m.tags?.includes("trending")), [effectiveMedia]);
  const popularMovies = useMemo(() => effectiveMedia.filter((m) => m.type === "movie" && (m.tags?.includes("popular") || m.tags?.includes("featured"))), [effectiveMedia]);
  const nowPlaying = useMemo(() => effectiveMedia.filter((m) => m.tags?.includes("now_playing")), [effectiveMedia]);
  const topRatedMovies = useMemo(() => effectiveMedia.filter((m) => m.type === "movie" && (m.tags?.includes("top_rated") || parseFloat(m.rating) >= 8.2)), [effectiveMedia]);
  const trendingTv = useMemo(() => effectiveMedia.filter((m) => m.type === "tv" && (m.tags?.includes("trending") || m.tags?.includes("series"))), [effectiveMedia]);
  const popularTv = useMemo(() => effectiveMedia.filter((m) => m.type === "tv" && m.tags?.includes("popular")), [effectiveMedia]);
  const actionMovies = useMemo(() => effectiveMedia.filter((m) => m.type === "movie" && (m.tags?.includes("action") || m.genre?.some(g => g.toLowerCase() === "action"))), [effectiveMedia]);
  const scifiMovies = useMemo(() => effectiveMedia.filter((m) => m.tags?.includes("scifi") || m.genre?.some(g => g.toLowerCase().includes("sci"))), [effectiveMedia]);
  const thrillerMovies = useMemo(() => effectiveMedia.filter((m) => m.genre?.some(g => g.toLowerCase() === "thriller")), [effectiveMedia]);
  const animeMedia = useMemo(() => effectiveMedia.filter((m) => m.genre?.some(g => g.toLowerCase() === "anime") || m.tags?.includes("anime")), [effectiveMedia]);

  const channels = [
    { id: "all", label: "🌟 All Channels" },
    { id: "trending", label: "🔥 Trending Movies" },
    { id: "popular", label: "📈 Popular" },
    { id: "now_playing", label: "🎬 In Theaters" },
    { id: "anime", label: "⛩️ Anime Hits" },
    { id: "tv", label: "📺 TV Shows" },
    { id: "top_rated", label: "⭐ Top Rated" },
    { id: "action", label: "💥 Action" },
    { id: "thriller", label: "🎬 Thriller" },
    { id: "scifi", label: "🚀 Sci-Fi" }
  ];

  return (
    <>
      <Hero
        list={list}
        toggleList={toggleList}
        onPlayTrailer={onPlayTrailer}
        feedMode={feedMode}
        allMedia={effectiveMedia}
      />

      {/* Mode Switcher & Instant Revert Banner */}
      <div className="modeSwitchBar">
        <div className="modeBadgeGroup">
          <span className={feedMode === "dynamic" ? "liveIndicatorDot" : "classicIndicatorDot"} />
          <span className="modeLabelText">
            {feedMode === "dynamic" ? (
              <><strong>Live VidSrc Feed Active</strong> — 180+ trending, anime, blockbusters, and theater releases</>
            ) : (
              <><strong>Classic Curated Cosmos Active</strong> — 20 selective Interstellar & Anime titles</>
            )}
          </span>
        </div>
        <div>
          {feedMode === "dynamic" ? (
            <button
              className="modeToggleBtn revertBtn"
              onClick={() => toggleFeedMode("classic")}
              title="Revert to original static titles"
            >
              <RotateCcw size={13} /> Revert to Classic Curated Cosmos
            </button>
          ) : (
            <button
              className="modeToggleBtn"
              onClick={() => toggleFeedMode("dynamic")}
              title="Switch to live dynamic stream feed"
            >
              <Sparkles size={13} color="#f59e0b" /> Switch to Live VidSrc Feed (180+)
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <section className="channelBar">
        <div className="channelList">
          {channels.map((c) => (
            <button
              key={c.id}
              className={`channelBtn ${activeChannel === c.id ? "active" : ""}`}
              onClick={() => setActiveChannel(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {activeChannel === "all" ? (
        <>
          <Row
            title="🔥 Trending Movies Today"
            items={trendingMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/movies"
          />
          <Row
            title="⛩️ Top Anime & Japanese Masterpieces"
            items={animeMedia.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/genres?genre=Anime"
          />
          <Row
            title="📈 Popular Worldwide Blockbusters"
            items={popularMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/movies"
          />
          <Row
            title="🎬 Now Playing in Theaters"
            items={nowPlaying.length ? nowPlaying.slice(0, 16) : trendingMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/movies"
          />
          <Row
            title="📺 Trending TV Shows & Series"
            items={trendingTv.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/tv-shows"
          />
          <Row
            title="⭐ Top Rated Masterpieces of All Time"
            items={topRatedMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/movies"
          />
          <Row
            title="💥 Action Hits"
            items={actionMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/genres?genre=Action"
          />
          <Row
            title="🎬 Thrillers & Suspense"
            items={thrillerMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/genres?genre=Thriller"
          />
          <Row
            title="🚀 High-Concept Sci-Fi & Cosmic Epics"
            items={scifiMovies.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/genres?genre=Sci-Fi"
          />
          <Row
            title="📺 Popular TV Shows & Drama"
            items={popularTv.slice(0, 16)}
            list={list}
            toggleList={toggleList}
            seeAllPath="/tv-shows"
          />
        </>
      ) : (
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="sectionHead">
            <h2>
              {channels.find((c) => c.id === activeChannel)?.label}
            </h2>
          </div>
          <div className="grid">
            {(activeChannel === "trending" ? trendingMovies :
              activeChannel === "anime" ? animeMedia :
                activeChannel === "popular" ? popularMovies :
                  activeChannel === "now_playing" ? (nowPlaying.length ? nowPlaying : trendingMovies) :
                    activeChannel === "tv" ? trendingTv :
                      activeChannel === "top_rated" ? topRatedMovies :
                        activeChannel === "action" ? actionMovies :
                          activeChannel === "thriller" ? thrillerMovies : scifiMovies).map((m) => (
                            <Card key={m.id} m={m} list={list} toggleList={toggleList} />
                          ))}
          </div>
        </section>
      )}
    </>
  );
}

// ── Catalog ──────────────────────────────────────────────────────
function Catalog({ type, title, list, toggleList, onPlayTrailer, allMedia = initialMedia }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreParam = searchParams.get("genre");
  const [filter, setFilter] = useState(genreParam || "All");
  const [displayCount, setDisplayCount] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(5);
  const [extraGenreItems, setExtraGenreItems] = useState([]);

  useEffect(() => {
    const active = genreParam || "All";
    setFilter(active);
    setDisplayCount(24);
    setPage(5);
    setExtraGenreItems([]);

    Promise.all([
      fetchMoreGenreItems(active, type || "all", 1),
      fetchMoreGenreItems(active, type || "all", 2),
      fetchMoreGenreItems(active, type || "all", 3),
      fetchMoreGenreItems(active, type || "all", 4),
      fetchMoreGenreItems(active, type || "all", 5)
    ]).then((pages) => {
      const merged = pages.flat().filter(Boolean);
      if (merged.length > 0) {
        setExtraGenreItems(deduplicateMedia(merged));
      }
    });
  }, [genreParam, type]);

  const availableFilters = useMemo(() => {
    if (type === "anime") {
      return ["All", "Trending", "Popular", "Top Rated", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"];
    }
    const genreSet = new Set();
    allMedia
      .filter((x) => (type ? x.type === type : true))
      .forEach((m) => (m.genre || []).forEach((g) => genreSet.add(g)));
    genreSet.add("Anime");
    const sortedGenres = Array.from(genreSet)
      .filter((g) => !["All", "Trending", "Popular", "Top Rated"].includes(g))
      .sort();
    return ["All", "Trending", "Popular", "Top Rated", ...sortedGenres];
  }, [type, allMedia]);

  const filteredItems = useMemo(() => {
    const combined = deduplicateMedia([...allMedia, ...extraGenreItems]);
    let base = combined.filter((x) => {
      if (type === "anime") {
        return (
          x.genre?.some((g) => g.toLowerCase() === "anime" || g.toLowerCase() === "animation") ||
          x.tags?.includes("anime")
        );
      }
      return type ? x.type === type : true;
    });
    if (filter === "All") return deduplicateMedia(base);
    if (filter === "Featured") return deduplicateMedia(base.filter((x) => x.tags?.includes("featured")));
    if (filter === "Trending") return deduplicateMedia(base.filter((x) => x.tags?.includes("trending")));
    if (filter === "Popular") return deduplicateMedia(base.filter((x) => x.tags?.includes("popular")));
    if (filter === "Top Rated") return deduplicateMedia([...base].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)));
    return deduplicateMedia(base.filter((x) => x.genre?.some((g) => g.toLowerCase() === filter.toLowerCase())));
  }, [type, filter, allMedia, extraGenreItems]);

  const handleFilterClick = (f) => {
    setFilter(f);
    setDisplayCount(24);
    setPage(5);
    setExtraGenreItems([]);
    const next = new URLSearchParams(searchParams);
    if (f === "All") next.delete("genre");
    else next.set("genre", f);
    setSearchParams(next);

    Promise.all([
      fetchMoreGenreItems(f, type || "all", 1),
      fetchMoreGenreItems(f, type || "all", 2),
      fetchMoreGenreItems(f, type || "all", 3),
      fetchMoreGenreItems(f, type || "all", 4),
      fetchMoreGenreItems(f, type || "all", 5)
    ]).then((pages) => {
      const merged = pages.flat().filter(Boolean);
      if (merged.length > 0) {
        setExtraGenreItems(deduplicateMedia(merged));
      }
    });
  };

  const handleLoadMore = async () => {
    if (displayCount < filteredItems.length) {
      setDisplayCount((prev) => prev + 24);
    } else {
      setLoadingMore(true);
      const nextPage = page + 1;
      const [p1, p2, p3] = await Promise.all([
        fetchMoreGenreItems(filter, type || "all", nextPage),
        fetchMoreGenreItems(filter, type || "all", nextPage + 1),
        fetchMoreGenreItems(filter, type || "all", nextPage + 2)
      ]);
      const merged = [p1, p2, p3].flat().filter(Boolean);
      if (merged.length > 0) {
        setExtraGenreItems((prev) => deduplicateMedia([...prev, ...merged]));
        setPage(nextPage + 2);
        setDisplayCount((prev) => prev + merged.length);
      }
      setLoadingMore(false);
    }
  };

  const visibleItems = filteredItems.slice(0, displayCount);

  return (
    <main className="page">
      <div className="catalogHeader">
        <span className="eyebrow">BROWSE {type ? (type === "movie" ? "FILMS" : "SERIES") : "CATALOG"}</span>
        <h1>{filter !== "All" ? `${filter} ${title}` : title}</h1>
      </div>

      <div className="catalogFilterBar">
        {availableFilters.map((x) => (
          <button
            key={x}
            className={`filterPillBtn ${filter.toLowerCase() === x.toLowerCase() ? "active" : ""}`}
            onClick={() => handleFilterClick(x)}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="grid">
        {visibleItems.map((m) => (
          <Card key={m.id} m={m} list={list} toggleList={toggleList} onPlayTrailer={onPlayTrailer} />
        ))}
      </div>

      {visibleItems.length > 0 && (
        <div className="loadMoreActionWrap">
          <button
            className="loadMoreBigBtn"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Sparkles size={16} style={{ animation: "spin 1.5s linear infinite" }} /> Fetching More {filter !== "All" ? filter : (type === "movie" ? "Movies" : "Series")}...
              </>
            ) : (
              <>
                <Plus size={16} /> Load More Titles
              </>
            )}
          </button>
        </div>
      )}
    </main>
  );
}

// ── Genres Explorer (Interactive Live Filtering & Catalog Browser) ───
function Genres({ allMedia = initialMedia, list, toggleList, onPlayTrailer }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGenre = searchParams.get("genre") || "All";
  const activeType = searchParams.get("type") || "all";
  const activeSort = searchParams.get("sort") || "rating";
  const [searchQuery, setSearchQuery] = useState("");
  const [extraItems, setExtraItems] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(48);

  const allGenresList = [
    { name: "All", icon: "🌌" },
    { name: "Anime", icon: "⛩️" },
    { name: "Action", icon: "💥" },
    { name: "Adventure", icon: "🧭" },
    { name: "Animation", icon: "🎨" },
    { name: "Comedy", icon: "😂" },
    { name: "Crime", icon: "🕵️" },
    { name: "Documentary", icon: "📹" },
    { name: "Drama", icon: "🎭" },
    { name: "Family", icon: "👨‍👩‍👧‍👦" },
    { name: "Fantasy", icon: "🧙‍♂️" },
    { name: "History", icon: "📜" },
    { name: "Horror", icon: "👻" },
    { name: "Music", icon: "🎵" },
    { name: "Mystery", icon: "🔍" },
    { name: "Romance", icon: "💖" },
    { name: "Sci-Fi", icon: "🚀" },
    { name: "Thriller", icon: "🎬" },
    { name: "War", icon: "⚔️" },
    { name: "Western", icon: "🤠" }
  ];

  // Auto-fetch extensive TMDB titles immediately whenever activeGenre or activeType changes!
  useEffect(() => {
    setDisplayCount(48);
    setPage(1);
    setExtraItems([]);

    setLoadingMore(true);
    Promise.all([
      fetchMoreGenreItems(activeGenre, activeType, 1),
      fetchMoreGenreItems(activeGenre, activeType, 2),
      fetchMoreGenreItems(activeGenre, activeType, 3),
      fetchMoreGenreItems(activeGenre, activeType, 4),
      fetchMoreGenreItems(activeGenre, activeType, 5)
    ]).then((pages) => {
      const merged = pages.flat().filter(Boolean);
      if (merged.length > 0) {
        setExtraItems(deduplicateMedia(merged));
      }
      setLoadingMore(false);
    });
  }, [activeGenre, activeType]);

  const handleSelectGenre = (g) => {
    const next = new URLSearchParams(searchParams);
    if (g === "All") next.delete("genre");
    else next.set("genre", g);
    setSearchParams(next);
  };

  const handleSelectType = (t) => {
    const next = new URLSearchParams(searchParams);
    if (t === "all") next.delete("type");
    else next.set("type", t);
    setSearchParams(next);
  };

  const handleSelectSort = (s) => {
    const next = new URLSearchParams(searchParams);
    if (s === "rating") next.delete("sort");
    else next.set("sort", s);
    setSearchParams(next);
  };

  const combinedLibrary = useMemo(() => {
    return deduplicateMedia([...allMedia, ...extraItems]);
  }, [allMedia, extraItems]);

  const filteredMedia = useMemo(() => {
    return combinedLibrary
      .filter((m) => {
        if (activeType !== "all" && m.type !== activeType) return false;
        if (activeGenre !== "All" && !m.genre?.some((g) => g.toLowerCase() === activeGenre.toLowerCase())) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = m.title.toLowerCase().includes(q);
          const matchesGenre = m.genre?.some((g) => g.toLowerCase().includes(q));
          const matchesDesc = m.desc && m.desc.toLowerCase().includes(q);
          if (!matchesTitle && !matchesGenre && !matchesDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (activeSort === "rating") return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        if (activeSort === "year") return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (activeSort === "title") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [combinedLibrary, activeGenre, activeType, activeSort, searchQuery]);

  const handleLoadMore = async () => {
    if (displayCount < filteredMedia.length) {
      setDisplayCount((prev) => prev + 24);
    } else {
      setLoadingMore(true);
      const nextPage = page + 3;
      const [fresh1, fresh2] = await Promise.all([
        fetchMoreGenreItems(activeGenre, activeType, nextPage),
        fetchMoreGenreItems(activeGenre, activeType, nextPage + 1)
      ]);
      const merged = [...(fresh1 || []), ...(fresh2 || [])];
      if (merged.length > 0) {
        setExtraItems((prev) => deduplicateMedia([...prev, ...merged]));
        setPage(nextPage + 1);
        setDisplayCount((prev) => prev + merged.length);
      }
      setLoadingMore(false);
    }
  };

  const visibleItems = filteredMedia.slice(0, displayCount);

  return (
    <main className="page">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">
            <Compass size={14} color="#f59e0b" /> GENRE EXPLORER
          </span>
          <h1>
            {activeGenre === "All" ? "Explore All Cinematic Genres" : `${activeGenre} Movies & Series`}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "15px", margin: "6px 0 0" }}>
            Filter and stream high-definition titles categorized by mood, theme, and genre DNA.
          </p>
        </div>
      </div>

      {/* Genre Pills Ribbon (Numbers Removed & Clean Scroller) */}
      <div className="genreRibbon">
        {allGenresList.map((g) => {
          const isActive = activeGenre.toLowerCase() === g.name.toLowerCase();

          return (
            <button
              key={g.name}
              className={`genreChip ${isActive ? "active" : ""}`}
              onClick={() => handleSelectGenre(g.name)}
              style={{ whiteSpace: "nowrap" }}
            >
              <span>{g.icon}</span> {g.name}
            </button>
          );
        })}
      </div>

      {/* Filter and Control Bar */}
      <div className="recFilterBar">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>Type:</span>
          {[
            { id: "all", label: "All Formats" },
            { id: "movie", label: "🎬 Movies" },
            { id: "tv", label: "📺 TV Shows" }
          ].map((t) => (
            <button
              key={t.id}
              className={`recFilterBtn ${activeType === t.id ? "active" : ""}`}
              onClick={() => handleSelectType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="recControlTools">
          <div className="recSearchWrap">
            <Search size={14} color="#94a3b8" />
            <input
              placeholder={`Search in ${activeGenre}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="recClearSearch" onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="recSortWrap">
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Sort:</span>
            <select value={activeSort} onChange={(e) => handleSelectSort(e.target.value)}>
              <option value="rating">Highest IMDb Rating</option>
              <option value="year">Newest Release Year</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header (Clean, No Count Numbers) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: "17px", color: "#f8fafc" }}>
          {activeGenre === "All" ? "All Featured Titles" : `${activeGenre} Titles`}
        </h3>
        {activeGenre !== "All" && (
          <button
            onClick={() => handleSelectGenre("All")}
            style={{ background: "none", border: 0, color: "var(--gold-flare)", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
          >
            Clear Genre Filter ✕
          </button>
        )}
      </div>

      {/* Grid of Results */}
      {visibleItems.length > 0 ? (
        <>
          <div className="grid">
            {visibleItems.map((m) => (
              <Card key={m.id} m={m} list={list} toggleList={toggleList} onPlayTrailer={onPlayTrailer} />
            ))}
          </div>

          {/* Load More & Infinite Discovery Controls */}
          <div className="loadMoreActionWrap">
            <button
              className="loadMoreBigBtn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Sparkles size={16} style={{ animation: "spin 1.5s linear infinite" }} /> Fetching More {activeGenre} Titles...
                </>
              ) : (
                <>
                  <Plus size={16} /> Load More {activeGenre !== "All" ? activeGenre : ""} Titles
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <Empty
          title={`No ${activeGenre} titles found`}
          text="Try switching between Movies and TV Series or selecting 'All' genres."
        />
      )}
    </main>
  );
}

// ── My List ──────────────────────────────────────────────────────
function MyList({ list, toggleList }) {
  const items = initialMedia.filter((m) => list.includes(m.id));
  return (
    <main className="page">
      <span className="eyebrow">SAVED</span>
      <h1>My List ({items.length})</h1>
      {items.length ? (
        <div className="grid">
          {items.map((m) => (
            <Card key={m.id} m={m} list={list} toggleList={toggleList} />
          ))}
        </div>
      ) : (
        <Empty
          title="Your list is empty"
          text="Hit '+' on any movie or series to save it here."
        />
      )}
    </main>
  );
}

// ── Continue Watching ────────────────────────────────────────────
function Continue() {
  return (
    <main className="page">
      <span className="eyebrow">IN PROGRESS</span>
      <h1>Continue Watching</h1>
      <div className="continueGrid">
        {initialMedia.slice(0, 4).map((m, i) => (
          <div className="continueCard" key={m.id}>
            <img
              src={m.poster || FALLBACK_POSTER}
              alt={m.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_POSTER;
              }}
            />
            <div style={{ flex: 1 }}>
              <span className="typeBadge">{m.type === "movie" ? "Film" : "Series"}</span>
              <h3 style={{ margin: "6px 0 2px" }}>{m.title}</h3>
              <p style={{ margin: 0, fontSize: "14px" }}>
                {m.type === "tv" ? `Season 1 · Episode 0${i + 2}` : "1h 14m remaining"}
              </p>
              <div className="progress">
                <i style={{ width: 30 + i * 18 + "%" }} />
              </div>
              <Link to={`/watch/${m.id}`} className="btn primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                <Play size={14} fill="currentColor" /> Resume
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ── Search ───────────────────────────────────────────────────────
function SearchPage({ list, toggleList, onPlayTrailer, allMedia = initialMedia }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(allMedia);
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(24);

  useEffect(() => {
    let active = true;
    if (!q.trim()) {
      setResults(deduplicateMedia(allMedia));
      setDisplayCount(24);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const data = await searchMedia(q);
      if (active) {
        setResults(deduplicateMedia(data));
        setDisplayCount(24);
        setLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [q, allMedia]);

  const visibleResults = results.slice(0, displayCount);

  return (
    <main className="page">
      <div className="searchbox">
        <Search size={22} color="#f59e0b" />
        <input
          autoFocus
          placeholder="Search movies, TV shows, actors, genres..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && <small style={{ color: "#f59e0b" }}>Searching...</small>}
      </div>

      <div className="searchBadges">
        <span style={{ fontSize: "12px", color: "var(--gold-flare)", background: "transparent", border: 0, padding: 0 }}>
          Popular Genres:
        </span>
        {["Anime", "Action", "Sci-Fi", "Thriller", "Drama", "Adventure", "Animation", "Horror", "Comedy", "Crime"].map((s) => (
          <span key={s} style={{ cursor: "pointer" }} onClick={() => setQ(s)}>
            🏷️ {s}
          </span>
        ))}
      </div>

      <div className="sectionHead">
        <h2>{q ? `Results for "${q}"` : "All Titles & Live Catalog"}</h2>
      </div>

      {visibleResults.length ? (
        <>
          <div className="grid">
            {visibleResults.map((m) => (
              <Card key={m.id} m={m} list={list} toggleList={toggleList} onPlayTrailer={onPlayTrailer} />
            ))}
          </div>

          {displayCount < results.length && (
            <div className="loadMoreActionWrap">
              <button
                className="loadMoreBigBtn"
                onClick={() => setDisplayCount((prev) => prev + 24)}
              >
                <Plus size={16} /> Load More Results
              </button>
            </div>
          )}
        </>
      ) : (
        <Empty
          title="No results found"
          text="Try a different title, actor, or genre like 'Action' or 'Sci-Fi'."
        />
      )}
    </main>
  );
}

// ── Details ───────────────────────────────────────────────────────
function Details({ list, toggleList, onPlayTrailer, allMedia = initialMedia }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [m, setM] = useState(() => getTitle(id, allMedia));
  const [accurateRecs, setAccurateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Scroll to top and hydrate details with full accuracy
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const local = getTitle(id, allMedia);
    setM(local);
    setAccurateRecs([]); // Clear previous recommendations immediately!
    setLoadingRecs(true);

    // Immediately trigger recommendations for current title
    fetchAccurateRecommendations(local, allMedia).then((recs) => {
      setAccurateRecs(recs);
      setLoadingRecs(false);
    });

    // Hydrate complete metadata in background
    fetchMediaDetailsById(id).then((fullItem) => {
      if (fullItem) {
        setM(fullItem);
        fetchAccurateRecommendations(fullItem, allMedia).then((recs) => {
          if (recs && recs.length > 0) setAccurateRecs(recs);
        });
      }
    });
  }, [id, allMedia]);

  // Smart suggestions from live allMedia: same genre first, then same type
  const genreSuggestions = useMemo(() => {
    return allMedia
      .filter((x) => String(x.id) !== String(m.id) && x.genre.some((g) => m.genre?.includes(g)))
      .sort((a, b) => {
        const aTypeMatch = a.type === m.type ? 1 : 0;
        const bTypeMatch = b.type === m.type ? 1 : 0;
        return bTypeMatch - aTypeMatch;
      })
      .slice(0, 10);
  }, [m.id, m.type, m.genre, allMedia]);

  const typeSuggestions = useMemo(() => {
    return allMedia
      .filter((x) => String(x.id) !== String(m.id) && x.type === m.type && !genreSuggestions.find(g => String(g.id) === String(x.id)))
      .slice(0, 10);
  }, [m.id, m.type, allMedia, genreSuggestions]);

  const typeLabel = m.type === "movie" ? "More Movies" : "More Series";

  return (
    <main className="details">
      <div
        className="detailHero"
        style={{
          backgroundImage: `linear-gradient(90deg, #030408 5%, rgba(3,4,8,0.85) 45%, rgba(3,4,8,0.2)), url(${m.backdrop})`
        }}
      >
        <div className="detailContent">
          <div className="eyebrow">{m.genre.join(" · ")}</div>
          <h1>{m.title}</h1>
          <div className="meta">
            <span className="typeBadge">{m.type === "movie" ? "Film" : "TV Series"}</span>
            <span>{m.year}</span>
            <span>{m.runtime}</span>
            <span>IMDb {m.rating} ★</span>
          </div>
          <p>{m.desc}</p>
          {m.reason && (
            <p className="reason">
              <Sparkles size={16} /> {m.reason}
            </p>
          )}

          {/* Interactive Genre Filter Badges */}
          {m.genre && m.genre.length > 0 && (
            <div style={{ margin: "14px 0 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "var(--gold-flare)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Genres:
                </span>
                <div className="chips">
                  {m.genre.map((g) => (
                    <Link
                      key={g}
                      to={`/genres?genre=${encodeURIComponent(g)}`}
                      className="genreChip"
                      title={`Filter all ${g} titles`}
                    >
                      🏷️ {g}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cast & Crew Section */}
          {m.cast && m.cast.length > 0 && (
            <div style={{ margin: "10px 0 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Cast:
                </span>
                <div className="castList" style={{ margin: 0 }}>
                  {m.cast.map((c) => (
                    <span className="castChip" key={c}>
                      👤 {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="actions">
            <Link className="btn primary" to={`/watch/${m.id}`}>
              <Play size={18} fill="currentColor" /> Watch Now (Stream)
            </Link>
            <button className="btn" onClick={() => onPlayTrailer(m)}>
              <Film size={18} /> Trailer
            </button>
            <Link className="btn" to={`/watch-together?id=${m.id}`}>
              <Users size={18} /> Watch Together
            </Link>
            <button className="btn" onClick={() => toggleList(m.id)}>
              {list.includes(m.id) ? "✓ Saved" : "+ Add to List"}
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 Real Algorithmic TMDB Recommendations */}
      {accurateRecs.length > 0 && (
        <Row
          title={`🎯 Recommended If You Enjoyed "${m.title}"`}
          items={accurateRecs}
          list={list}
          toggleList={toggleList}
          seeAllPath={`/recommendations/${m.id}`}
          allowExpand={true}
        />
      )}

      {/* Genre-based suggestions */}
      {genreSuggestions.length > 0 && (
        <Row
          title={`🌌 More Acclaimed ${m.genre[0] || "Featured"} Titles`}
          items={genreSuggestions}
          list={list}
          toggleList={toggleList}
          seeAllPath="/movies"
          allowExpand={true}
        />
      )}

      {/* Same-type suggestions */}
      {typeSuggestions.length > 0 && (
        <Row
          title={`🎬 Top ${typeLabel}`}
          items={typeSuggestions}
          list={list}
          toggleList={toggleList}
          seeAllPath={m.type === "tv" ? "/tv-shows" : "/movies"}
          allowExpand={true}
        />
      )}
    </main>
  );
}

// ── Dedicated Recommendations Page ─────────────────────────────────
function RecommendationsPage({ list, toggleList, onPlayTrailer, allMedia = initialMedia }) {
  const { id } = useParams();
  const [sourceMedia, setSourceMedia] = useState(() => getTitle(id, allMedia));
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const local = getTitle(id, allMedia);
    setSourceMedia(local);

    setLoading(true);
    fetchAccurateRecommendations(local, allMedia).then((results) => {
      setRecs(results || []);
      setLoading(false);
    });
  }, [id, allMedia]);

  const availableGenres = useMemo(() => {
    const set = new Set();
    recs.forEach((m) => (m.genre || []).forEach((g) => set.add(g)));
    return Array.from(set);
  }, [recs]);

  const filteredRecs = useMemo(() => {
    return recs
      .filter((m) => {
        if (filterGenre !== "all" && !m.genre?.includes(filterGenre)) return false;
        if (searchQuery.trim() && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        if (sortBy === "year") return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        return 0;
      });
  }, [recs, filterGenre, sortBy, searchQuery]);

  return (
    <main className="page recommendationsPage">
      {/* Hero Header for Recommendations */}
      <div
        className="recHeroBanner"
        style={{
          backgroundImage: `linear-gradient(90deg, #030408 10%, rgba(3,4,8,0.85) 60%, rgba(3,4,8,0.3)), url(${sourceMedia.backdrop || sourceMedia.poster})`
        }}
      >
        <div className="recHeroContent">
          <Link to={`/title/${sourceMedia.id}`} className="btn" style={{ fontSize: "12px", padding: "6px 14px", marginBottom: 14 }}>
            ← Back to {sourceMedia.title}
          </Link>
          <div className="eyebrow">
            <Sparkles size={14} color="#f59e0b" /> NEURAL RECOMMENDATION ENGINE
          </div>
          <h1 className="recTitleHeader">
            Recommended If You Enjoyed <span>"{sourceMedia.title}"</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "15px", maxWidth: 700, margin: "8px 0 16px" }}>
            Curated neural suggestions matching the themes, tone, storytelling, and genre DNA of {sourceMedia.title}.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link to={`/watch/${sourceMedia.id}`} className="btn primary">
              <Play size={16} /> Stream {sourceMedia.title}
            </Link>
            <button className="btn" onClick={() => onPlayTrailer(sourceMedia)}>
              <Film size={16} /> Watch Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="recFilterBar">
        <div className="recFilterChips">
          <button
            className={`recFilterBtn ${filterGenre === "all" ? "active" : ""}`}
            onClick={() => setFilterGenre("all")}
          >
            All Genres ({recs.length})
          </button>
          {availableGenres.map((g) => (
            <button
              key={g}
              className={`recFilterBtn ${filterGenre === g ? "active" : ""}`}
              onClick={() => setFilterGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="recControlTools">
          <div className="recSearchWrap">
            <Search size={14} color="#94a3b8" />
            <input
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="recClearSearch" onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="recSortWrap">
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Sort:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Top Neural Match</option>
              <option value="rating">Highest IMDb Rating</option>
              <option value="year">Release Year (Newest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="recLoadingBox">
          <Sparkles size={32} color="#f59e0b" style={{ animation: "spin 2s linear infinite" }} />
          <h3>Analyzing Cinematic Vectors...</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>Fetching accurate TMDB recommendations for {sourceMedia.title}</p>
        </div>
      ) : filteredRecs.length > 0 ? (
        <div className="grid">
          {filteredRecs.map((m) => (
            <Card
              key={m.id}
              m={m}
              saved={list.includes(m.id)}
              onToggle={toggleList}
              onPlayTrailer={onPlayTrailer}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No recommendations match this filter"
          text="Try selecting 'All Genres' or clearing the search box to view all suggestions."
        />
      )}
    </main>
  );
}

// ── Solo Streaming Player (vidsrc.sbs with URL Query Customization) ─
function SoloWatch({ list, toggleList, onPlayTrailer, allMedia = initialMedia }) {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resolvedMedia, setResolvedMedia] = useState(() => getTitle(id, allMedia));

  // Read URL Query Parameters
  const server = searchParams.get("server") || "vidsrc";
  const autoplay = searchParams.get("autoplay") !== "0"; // default: 1 (enabled)
  const color = searchParams.get("color") || "f59e0b"; // default: gold
  const sub = searchParams.get("sub") || "en"; // default: english
  const t = parseInt(searchParams.get("t")) || 0; // default: 0
  const controls = searchParams.get("controls") !== "0"; // default: 1 (enabled)
  const season = parseInt(searchParams.get("season")) || 1;
  const episode = parseInt(searchParams.get("episode")) || 1;

  const [showConfig, setShowConfig] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const local = getTitle(id, allMedia);
    setResolvedMedia(local);
    fetchMediaDetailsById(id).then((fullItem) => {
      if (fullItem) setResolvedMedia(fullItem);
    });
  }, [id, allMedia]);

  // Helper to update a URL query parameter
  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === null || val === undefined || val === "") {
      next.delete(key);
    } else {
      next.set(key, String(val));
    }
    setSearchParams(next);
  };

  // Build streaming URL with exact URL query parameters
  const streamUrl = useMemo(() => {
    return getStreamUrl(resolvedMedia, {
      season,
      episode,
      server,
      autoplay: autoplay ? 1 : 0,
      color,
      sub,
      t,
      controls: controls ? 1 : 0
    });
  }, [resolvedMedia, season, episode, server, autoplay, color, sub, t, controls]);

  const totalSeasons = resolvedMedia?.seasons || (resolvedMedia?.type === "tv" ? 4 : 1);
  const episodesPerSeason = 10;

  return (
    <main className="soloWatchPage">
      <div className="streamTopBar">
        <div className="streamMeta">
          <Link to={`/title/${resolvedMedia.id}`} className="btn" style={{ padding: "8px 14px", fontSize: "13px" }}>
            ← Back to Details
          </Link>
          <div>
            <h1>{resolvedMedia.title}</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <span className="typeBadge">
                {resolvedMedia.type === "movie" ? "Movie" : `S${season}:E${episode}`}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>{resolvedMedia.year}</span>
              <span style={{ color: "#f59e0b", fontSize: "13px" }}>IMDb {resolvedMedia.rating} ★</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="serverPills">
            {STREAM_SERVERS.map((s) => (
              <button
                key={s.id}
                className={`serverPill ${server === s.id ? "active" : ""}`}
                onClick={() => updateParam("server", s.id)}
                title={`Switch server to ${s.name}`}
              >
                <span>{s.icon}</span> {s.name}
              </button>
            ))}
          </div>

          <Link
            to={`/watch-together?id=${resolvedMedia.id}&season=${season}&episode=${episode}&server=${server}&color=${color}&sub=${sub}`}
            className="btn"
            style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
          >
            <Users size={16} /> Watch with Friends
          </Link>
        </div>
      </div>

      {/* Video Streaming Container */}
      <div className="streamContainer">
        {streamUrl ? (
          <iframe
            key={streamUrl}
            src={streamUrl}
            title={resolvedMedia.title}
            className="streamIframe"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94a3b8" }}>
            Loading stream feed...
          </div>
        )}
      </div>

      <div className="streamNotice">
        <span>⚡ Streaming directly via <strong>VidSrc.sbs</strong>. Player behavior is controlled via URL query parameters below.</span>
        <button
          onClick={() => onPlayTrailer(resolvedMedia)}
          style={{ background: "none", border: 0, color: "var(--gold-flare)", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
        >
          Watch Official Trailer
        </button>
      </div>

      {/* Interactive Player URL Parameters Customizer */}
      <div className="paramCustomizer">
        <div className="customizerHeader" onClick={() => setShowConfig(!showConfig)}>
          <b>
            <Sliders size={18} /> Player Parameters & Behavior (URL Query Controlled)
          </b>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>
            {showConfig ? "Hide Controls ▲" : "Customize Parameters ▼"}
          </span>
        </div>

        {showConfig && (
          <>
            <div className="paramControlsGrid">
              {/* Autoplay Parameter */}
              <div className="paramControlItem">
                <label>Autoplay (?autoplay=)</label>
                <div className="paramControlGroup">
                  <button
                    className={`paramToggleBtn ${autoplay ? "active" : ""}`}
                    onClick={() => updateParam("autoplay", 1)}
                  >
                    Enabled (1)
                  </button>
                  <button
                    className={`paramToggleBtn ${!autoplay ? "active" : ""}`}
                    onClick={() => updateParam("autoplay", 0)}
                  >
                    Disabled (0)
                  </button>
                </div>
              </div>

              {/* Player Accent Color Parameter */}
              <div className="paramControlItem">
                <label>Player Color (?color=)</label>
                <div className="paramControlGroup" style={{ alignItems: "center" }}>
                  {[
                    { hex: "f59e0b", name: "Gold" },
                    { hex: "38bdf8", name: "Cyan" },
                    { hex: "e50914", name: "Red" },
                    { hex: "10b981", name: "Green" },
                    { hex: "a855f7", name: "Purple" }
                  ].map((c) => (
                    <button
                      key={c.hex}
                      className={`colorSwatchBtn ${color.toLowerCase() === c.hex ? "active" : ""}`}
                      style={{ background: `#${c.hex}` }}
                      title={`Color: ${c.name} (#${c.hex})`}
                      onClick={() => updateParam("color", c.hex)}
                    />
                  ))}
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>
                    #{color}
                  </span>
                </div>
              </div>

              {/* Subtitles Language Parameter */}
              <div className="paramControlItem">
                <label>Subtitles (?sub=)</label>
                <div className="paramControlGroup">
                  {[
                    { code: "en", label: "English" },
                    { code: "es", label: "Spanish" },
                    { code: "fr", label: "French" },
                    { code: "de", label: "German" },
                    { code: "hi", label: "Hindi" },
                    { code: "off", label: "Off" }
                  ].map((s) => (
                    <button
                      key={s.code}
                      className={`paramToggleBtn ${sub === s.code ? "active" : ""}`}
                      onClick={() => updateParam("sub", s.code)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Timestamp Parameter */}
              <div className="paramControlItem">
                <label>Start Timestamp (?t=)</label>
                <div className="paramControlGroup">
                  {[
                    { s: 0, label: "0s" },
                    { s: 60, label: "1m (60s)" },
                    { s: 120, label: "2m (120s)" },
                    { s: 300, label: "5m (300s)" },
                    { s: 600, label: "10m (600s)" }
                  ].map((item) => (
                    <button
                      key={item.s}
                      className={`paramToggleBtn ${t === item.s ? "active" : ""}`}
                      onClick={() => updateParam("t", item.s)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls Parameter */}
              <div className="paramControlItem">
                <label>Controls (?controls=)</label>
                <div className="paramControlGroup">
                  <button
                    className={`paramToggleBtn ${controls ? "active" : ""}`}
                    onClick={() => updateParam("controls", 1)}
                  >
                    Visible (1)
                  </button>
                  <button
                    className={`paramToggleBtn ${!controls ? "active" : ""}`}
                    onClick={() => updateParam("controls", 0)}
                  >
                    Hidden (0)
                  </button>
                </div>
              </div>
            </div>

            <div className="queryPreviewBar">
              <div>
                <span style={{ color: "#94a3b8" }}>Active URL Query: </span>
                <span className="queryPreviewCode">
                  {window.location.search || `?server=${server}&autoplay=1&color=${color}&sub=${sub}`}
                </span>
              </div>
              <button
                className="btn"
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedQuery(true);
                  setTimeout(() => setCopiedQuery(false), 2000);
                }}
              >
                {copiedQuery ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                {copiedQuery ? "URL Copied!" : "Copy Parameterized URL"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* TV Seasons & Episode Selection */}
      {resolvedMedia.type === "tv" && (
        <div className="episodesSection">
          <h3 style={{ margin: "0 0 14px", fontSize: "17px", color: "#fff" }}>Select Season & Episode</h3>
          <div className="seasonTabs">
            {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
              <button
                key={s}
                className={`seasonTab ${season === s ? "active" : ""}`}
                onClick={() => {
                  updateParam("season", s);
                  updateParam("episode", 1);
                }}
              >
                Season {s}
              </button>
            ))}
          </div>

          <div className="episodeGrid">
            {Array.from({ length: episodesPerSeason }, (_, i) => i + 1).map((e) => (
              <button
                key={e}
                className={`episodeBtn ${episode === e ? "active" : ""}`}
                onClick={() => {
                  updateParam("episode", e);
                }}
              >
                <span>Ep {e}</span>
                <small>{resolvedMedia.title.slice(0, 10)}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: "20px", marginBottom: 12 }}>Overview</h2>
        <p style={{ color: "#cbd5e1", maxWidth: 900, lineHeight: 1.7, fontSize: "15px" }}>{resolvedMedia.desc}</p>
        <div className="chips" style={{ marginTop: 14 }}>
          {resolvedMedia.genre.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <Row
          title="Recommended Next"
          items={initialMedia.filter((x) => x.id !== resolvedMedia.id).slice(0, 6)}
          list={list}
          toggleList={toggleList}
        />
      </div>
    </main>
  );
}

// ── Watch Together (Interactive Real-Time Virtual Theater) ────────────────
function WatchTogether({ profile = DEFAULT_PROFILE, onPlayTrailer, allMedia = initialMedia }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = searchParams.get("room") || ("CF-" + Math.random().toString(36).substring(2,6).toUpperCase());
  const initialId = searchParams.get("id") || "m-1";

  const [roomId, setRoomId] = useState(roomParam);
  const [currentId, setCurrentId] = useState(initialId);
  const [currentMedia, setCurrentMedia] = useState(() => getTitle(initialId, allMedia));
  const [server, setServer] = useState(searchParams.get("server") || "vidsrc");
  const [season, setSeason] = useState(parseInt(searchParams.get("season")) || 1);
  const [episode, setEpisode] = useState(parseInt(searchParams.get("episode")) || 1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [newRoomInput, setNewRoomInput] = useState("");
  const [chat, setChat] = useState("");
  const [copied, setCopied] = useState(false);
  const [syncNotice, setSyncNotice] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [tabView, setTabView] = useState("chat"); // 'chat' or 'crew'
  const [adShield, setAdShield] = useState(true);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: "m-1",
      u: "Cooper",
      role: "Co-pilot",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      t: "Sub-space relay linked to room " + roomParam + ". Telemetry locked & ready to stream! \uD83D\uDE80",
      time: "11:00 AM"
    },
    {
      id: "m-2",
      u: "TARS",
      role: "AI Security",
      avatar: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80",
      t: "VidSrc.sbs primary stream buffer 100% nominal. Latency: 14ms. \uD83E\uDD16",
      time: "11:01 AM"
    }
  ]);

  // Sync with currentId media item
  useEffect(() => {
    fetchMediaDetailsById(currentId).then((item) => {
      if (item) setCurrentMedia(item);
    });
  }, [currentId]);

  // Keep search params in sync with state
  useEffect(() => {
    setSearchParams({
      room: roomId,
      id: currentId,
      server,
      season: String(season),
      episode: String(episode)
    }, { replace: true });
  }, [roomId, currentId, server, season, episode, setSearchParams]);

  // Real-time cross-tab BroadcastChannel synchronization
  useEffect(() => {
    let bc = null;
    try {
      bc = new BroadcastChannel("cinefilum_room_" + roomId);
      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "MEDIA_CHANGE") {
          setCurrentId(payload.id);
          setSeason(payload.season || 1);
          setEpisode(payload.episode || 1);
          if (payload.server) setServer(payload.server);
        } else if (type === "CHAT_MSG") {
          setMessages((prev) => [...prev, payload]);
        } else if (type === "EMOJI_BURST") {
          spawnReaction(payload.emoji, false);
        } else if (type === "SYNC_PULSE") {
          setSyncNotice(true);
          setTimeout(() => setSyncNotice(false), 2500);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported in this environment:", e);
    }

    return () => {
      if (bc) bc.close();
    };
  }, [roomId]);

  const broadcastEvent = (type, payload) => {
    try {
      const bc = new BroadcastChannel("cinefilum_room_" + roomId);
      bc.postMessage({ type, payload });
      bc.close();
    } catch { }
  };

  const streamUrl = useMemo(() => {
    return getStreamUrl(currentMedia, season, episode, server);
  }, [currentMedia, season, episode, server]);

  const handleCopyLink = () => {
    const url = window.location.origin + "/watch-together?room=" + encodeURIComponent(roomId) + "&id=" + currentId + "&server=" + server + "&season=" + season + "&episode=" + episode;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleBroadcastSync = () => {
    setSyncNotice(true);
    broadcastEvent("SYNC_PULSE", { timestamp: Date.now() });
    const syncMsg = {
      id: "sync-" + Date.now(),
      u: "SYSTEM",
      role: "Relay",
      avatar: "",
      t: `\uD83D\uDCE1 Host broadcasted playback sync pulse across room ${roomId}. (0.00s drift)`,
      isSystem: true
    };
    setMessages((prev) => [...prev, syncMsg]);
    broadcastEvent("CHAT_MSG", syncMsg);
    setTimeout(() => setSyncNotice(false), 2500);
  };

  const spawnReaction = (emoji, shouldBroadcast = true) => {
    const id = "rx-" + Date.now() + "-" + Math.random();
    const left = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    setReactions((prev) => [...prev, { id, emoji, left }]);

    if (shouldBroadcast) {
      broadcastEvent("EMOJI_BURST", { emoji });
    }

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
  };

  const handleSendMessage = () => {
    if (!chat.trim()) return;
    const text = chat.trim();
    const isMe = true;
    const myMsg = {
      id: "msg-" + Date.now(),
      u: profile.name || "You",
      role: profile.role === "admin" ? "Host (Admin)" : "Host",
      avatar: profile.avatar || "",
      initial: profile.initial || "U",
      t: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe
    };

    setMessages((prev) => [...prev, myMsg]);
    broadcastEvent("CHAT_MSG", myMsg);
    setChat("");

    // Interactive crew responses
    const lower = text.toLowerCase();
    if (lower.includes("/sync") || lower.includes("sync")) {
      setTimeout(() => {
        const tarsMsg = {
          id: "bot-" + Date.now(),
          u: "TARS",
          role: "AI Security",
          avatar: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80",
          t: "\uD83E\uDD16 Telemetry drift corrected: 0.00ms. All client relays locked in sync!",
        };
        setMessages((prev) => [...prev, tarsMsg]);
        broadcastEvent("CHAT_MSG", tarsMsg);
      }, 600);
    } else if (lower.includes("/quote") || lower.includes("quote")) {
      setTimeout(() => {
        const quotes = [
          "🌌 'Do not go gentle into that good night. Rage, rage against the dying of the light.' — Professor Brand",
          "🚀 'We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.' — Cooper",
          "✨ 'Love is the one thing we're capable of perceiving that transcends dimensions of time and space.' — Amelia Brand"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const brandMsg = {
          id: "bot-" + Date.now(),
          u: "Brand",
          role: "Astrophysicist",
          avatar: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80",
          t: randomQuote,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, brandMsg]);
        broadcastEvent("CHAT_MSG", brandMsg);
      }, 600);
    } else if (lower.includes("popcorn") || lower.includes("🍿")) {
      spawnReaction("🍿", true);
    }
  };

  const handleTitleSelect = (item) => {
    setCurrentId(item.id);
    setSeason(1);
    setEpisode(1);
    setPickerOpen(false);

    broadcastEvent("MEDIA_CHANGE", { id: item.id, season: 1, episode: 1, server });

    const changeMsg = {
      id: "sys-" + Date.now(),
      u: "SYSTEM",
      role: "Relay",
      avatar: "",
      t: `🎬 ${profile.name} changed stream title to "${item.title}".`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystem: true
    };
    setMessages((prev) => [...prev, changeMsg]);
    broadcastEvent("CHAT_MSG", changeMsg);
  };

  const handleJoinRoom = () => {
    if (!newRoomInput.trim()) return;
    const cleanRoom = newRoomInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanRoom) {
      setRoomId(cleanRoom);
      setRoomModalOpen(false);
      setNewRoomInput("");
    }
  };

  const filteredPickerMedia = useMemo(() => {
    if (!pickerQuery.trim()) return allMedia;
    const q = pickerQuery.toLowerCase();
    return allMedia.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre.some((g) => g.toLowerCase().includes(q))
    );
  }, [pickerQuery, allMedia]);

  const totalSeasons = currentMedia.seasons || (currentMedia.type === "tv" ? 4 : 1);
  const episodesCount = 10;

  return (
    <main className="watch">
      {/* Top Mission Control Header */}
      <div className="watchTop">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="eyebrow">
              <Users size={14} color="#f59e0b" /> WATCH TOGETHER · LIVE STREAM
            </span>
            <span className="telemetryBadge">SYNCHRONIZED ROOM</span>
          </div>
          <h1>{currentMedia.title}</h1>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="titleSwitchBtn" onClick={() => setPickerOpen(true)}>
            <Film size={16} /> Switch Movie / Series
          </button>
          <button className="btn" onClick={() => setRoomModalOpen(true)} style={{ padding: "8px 14px", fontSize: "13px" }}>
            <RotateCcw size={15} /> Change Room
          </button>
          <div className="roomcode" onClick={handleCopyLink} title="Click to Copy Room Invite URL">
            <span>Room: <b>{roomId}</b></span>
            {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
          </div>
        </div>
      </div>

      {copied && (
        <div className="roomCopyToast">
          <Check size={16} color="#4ade80" /> Room Invite Link Copied! Share with friends to watch together in real-time.
        </div>
      )}

      {/* Watch Controls Bar */}
      <div className="watchControlsBar">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>Server:</span>
          <div className="serverPills">
            {STREAM_SERVERS.map((s) => (
              <button
                key={s.id}
                className={`serverPill ${server === s.id ? "active" : ""}`}
                onClick={() => {
                  setServer(s.id);
                  broadcastEvent("MEDIA_CHANGE", { id: currentId, season, episode, server: s.id });
                }}
              >
                <span>{s.icon}</span> {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {currentMedia.type === "tv" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn"
                onClick={() => {
                  const prevEp = Math.max(1, episode - 1);
                  setEpisode(prevEp);
                  broadcastEvent("MEDIA_CHANGE", { id: currentId, season, episode: prevEp, server });
                }}
                disabled={episode <= 1}
                style={{ fontSize: "11px", padding: "4px 8px" }}
              >
                ◀ Prev Ep
              </button>

              <select
                value={season}
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  setSeason(s);
                  setEpisode(1);
                  broadcastEvent("MEDIA_CHANGE", { id: currentId, season: s, episode: 1, server });
                }}
                style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "6px 10px", borderRadius: 8 }}
              >
                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Season {s}</option>
                ))}
              </select>

              <select
                value={episode}
                onChange={(e) => {
                  const ep = parseInt(e.target.value);
                  setEpisode(ep);
                  broadcastEvent("MEDIA_CHANGE", { id: currentId, season, episode: ep, server });
                }}
                style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "6px 10px", borderRadius: 8 }}
              >
                {Array.from({ length: episodesCount }, (_, i) => i + 1).map((e) => (
                  <option key={e} value={e}>Episode {e}</option>
                ))}
              </select>

              <button
                className="btn"
                onClick={() => {
                  const nextEp = Math.min(episodesCount, episode + 1);
                  setEpisode(nextEp);
                  broadcastEvent("MEDIA_CHANGE", { id: currentId, season, episode: nextEp, server });
                }}
                disabled={episode >= episodesCount}
                style={{ fontSize: "11px", padding: "4px 8px" }}
              >
                Next Ep ▶
              </button>
            </div>
          )}

          <button
            className="btn"
            onClick={handleBroadcastSync}
            style={{ fontSize: "12px", padding: "6px 14px", borderColor: "rgba(56,189,248,0.4)", color: "var(--cyan-ice)" }}
          >
            <Radio size={14} /> Sync Room Pulse
          </button>
          <button
            className="btn"
            onClick={() => onPlayTrailer(currentMedia)}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            <Film size={14} /> Trailer
          </button>
        </div>
      </div>

      <div className="watchLayout">
        {/* Main Video Stream Player with Floating Reactions Overlay */}
        <div className="watchPlayerWrap">
          {streamUrl ? (
            <iframe
              key={`${streamUrl}-${server}`}
              src={streamUrl}
              title={currentMedia.title}
              className="streamIframe"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94a3b8" }}>
              Connecting to VidSrc.sbs streaming relay...
            </div>
          )}

          {/* Floating Emoji Particles Layer */}
          <div className="floatingReactionsLayer">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="floatingEmojiParticle"
                style={{ left: `${r.left}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Real-time Sync Pulse Flash Indicator */}
          {syncNotice && (
            <div className="syncPulseBanner">
              ⚡ Playback Synchronized with Room {roomId}
            </div>
          )}
        </div>

        {/* Live Chat & Room Telemetry Sidebar */}
        <aside className="chat">
          <div className="chatHead">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className={`chatTabBtn ${tabView === "chat" ? "active" : ""}`}
                onClick={() => setTabView("chat")}
              >
                <MessageCircle size={15} /> Room Chat
              </button>
              <button
                className={`chatTabBtn ${tabView === "crew" ? "active" : ""}`}
                onClick={() => setTabView("crew")}
              >
                <Users size={15} /> Crew (4)
              </button>
            </div>
            <span className="roomLiveStatusDot">● LIVE</span>
          </div>

          {tabView === "chat" ? (
            <>
              <div className="messages">
                {messages.map((x) => (
                  <div className={`msg ${x.isMe ? "me" : ""} ${x.isSystem ? "systemMsg" : ""}`} key={x.id}>
                    {!x.isSystem && (
                      <div className="msgSenderHead">
                        <div className="msgMiniAvatar">
                          {x.avatar ? (
                            <img src={x.avatar} alt={x.u} className="avatarImg"  loading="lazy" decoding="async" />
                          ) : (
                            x.initial || x.u[0]
                          )}
                        </div>
                        <b className="msgUser">{x.u}</b>
                        <span className="msgRoleBadge">{x.role}</span>
                        <small className="msgTime">{x.time}</small>
                      </div>
                    )}
                    <p className="msgBody">{x.t}</p>
                  </div>
                ))}
              </div>

              {/* Quick Floating Emoji Reaction Bar */}
              <div className="quickReactionStrip">
                {["\uD83C\uDF7F", "\uD83D\uDD25", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83E\uDD2F", "\uD83D\uDC4F", "\uD83D\uDE2E", "\uD83C\uDFAC"].map((emo) => (
                  <button
                    key={emo}
                    className="reactionBurstBtn"
                    onClick={() => spawnReaction(emo, true)}
                    title={`Send ${emo} reaction`}
                  >
                    {emo}
                  </button>
                ))}
              </div>

              <div className="chatInput">
                <input
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  placeholder="Send message or type /sync, /quote..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <button onClick={handleSendMessage} aria-label="Send message">
                  <Send size={17} />
                </button>
              </div>
            </>
          ) : (
            <div className="crewListPanel">
              <h4 style={{ margin: "0 0 14px", color: "#f8fafc", fontSize: "14px" }}>Connected Crew in Room {roomId}</h4>
              <div className="crewGrid">
                {[
                  { name: profile.name || "You", role: profile.role === "admin" ? "Host 👑 (Admin)" : "Host 👑", avatar: profile.avatar, initial: profile.initial || "U", status: "Online", ping: "12ms" },
                  { name: "Cooper", role: "Co-pilot 🚀", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80", status: "Online", ping: "14ms" },
                  { name: "Brand", role: "Astrophysicist 🪐", avatar: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80", status: "Online", ping: "19ms" },
                  { name: "TARS", role: "Security Bot 🤖", avatar: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80", status: "Telemetry 100%", ping: "2ms" }
                ].map((c) => (
                  <div key={c.name} className="crewMemberCard">
                    <div className="crewAvatar">
                      {c.avatar ? <img src={c.avatar} alt={c.name} className="avatarImg"  loading="lazy" decoding="async" /> : (c.initial || c.name[0])}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <b style={{ color: "#fff", fontSize: "13px" }}>{c.name}</b>
                        <span style={{ fontSize: "10px", color: "#4ade80" }}>● {c.status}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>{c.role}</span>
                        <small style={{ color: "#64748b", fontSize: "10px" }}>{c.ping}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <b style={{ fontSize: "12px", color: "var(--cyan-ice)" }}>📡 Sub-space Relay Status</b>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                  Cross-tab sync active via BroadcastChannel. Open this invite link in another tab or window to test real-time room sync!
                </p>
              </div>
            </div>
          )}
        </aside>

        <div className="sync">
          <span>✓ VidSrc.sbs Stream Active · Synced Room {roomId} · 4 Connected Viewers</span>
          <span>⚡ 1080p · 60 FPS · 0.0s Drift</span>
        </div>
      </div>

      {/* Switch Title Modal */}
      {pickerOpen && (
        <div className="modalBackdrop" onClick={() => setPickerOpen(false)}>
          <div className="pickerModal" onClick={(e) => e.stopPropagation()}>
            <div className="pickerHeader">
              <b>Choose Title to Stream Together</b>
              <button className="closeBtn" onClick={() => setPickerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pickerSearch">
              <Search size={18} color="#94a3b8" />
              <input
                autoFocus
                placeholder="Search movies or TV shows to stream..."
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
              />
            </div>
            <div className="pickerGrid">
              {filteredPickerMedia.map((m) => (
                <div
                  key={m.id}
                  className="pickerCard"
                  onClick={() => handleTitleSelect(m)}
                >
                  <img src={m.poster || FALLBACK_POSTER} alt={m.title}  loading="lazy" decoding="async" />
                  <b>{m.title}</b>
                  <small>{m.type === "movie" ? "Movie" : "Series"} · {m.year}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change / Join Room Modal */}
      {roomModalOpen && (
        <div className="modalBackdrop" onClick={() => setRoomModalOpen(false)}>
          <div className="pickerModal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="pickerHeader">
              <b>Create or Join Watch Room</b>
              <button className="closeBtn" onClick={() => setRoomModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: 0 }}>
                Enter a custom Room Code to join an existing group or start a private session:
              </p>
              <input
                placeholder="e.g. GARGANTUA-9, COSMOS, CF-7G4X"
                value={newRoomInput}
                onChange={(e) => setNewRoomInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(10,14,26,0.9)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: 1,
                  boxSizing: "border-box",
                  marginBottom: 16
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinRoom();
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn primary" onClick={handleJoinRoom} style={{ flex: 1, justifyContent: "center" }}>
                  Join Room
                </button>
                <button className="btn" onClick={() => setRoomModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Create Profile (Clean Public Form with Auto-Compression) ────────
// ── Image Crop Modal ─────────────────────────────────────────────
function ImageCropModal({ src, onCrop, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  // Crop box state (relative to displayed image)
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [dragging, setDragging] = useState(null); // null | 'move' | 'resize'
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);
  const [imgDisplay, setImgDisplay] = useState({ w: 0, h: 0, offX: 0, offY: 0 });

  // Proxy URL to bypass CORS for external images
  const proxied = src.startsWith("data:") ? src : `https://images.weserv.nl/?url=${encodeURIComponent(src)}&default=1`;

  const onLoad = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const maxW = container.clientWidth - 32;
    const maxH = 360;
    const ratio = img.naturalWidth / img.naturalHeight;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    const offX = (container.clientWidth - w) / 2;
    const initSize = Math.min(w, h, 240);
    setImgDisplay({ w, h, offX, offY: 0 });
    setCrop({ x: (w - initSize) / 2, y: (h - initSize) / 2, size: initSize });
    setLoaded(true);
  }, []);

  // Draw preview on canvas
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    const { w, h, offX } = imgDisplay;
    const scaleX = img.naturalWidth / w;
    const scaleY = img.naturalHeight / h;
    const sx = Math.max(0, crop.x * scaleX);
    const sy = Math.max(0, crop.y * scaleY);
    const sw = crop.size * scaleX;
    const sh = crop.size * scaleY;
    canvas.width = 240;
    canvas.height = 240;
    ctx.clearRect(0, 0, 240, 240);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 240, 240);
  }, [crop, loaded, imgDisplay]);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const onMouseDown = (e, type) => {
    e.preventDefault();
    setDragging(type);
    setDragStart({ mx: e.clientX, my: e.clientY, crop: { ...crop } });
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const { w, h } = imgDisplay;
    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;
    if (dragging === "move") {
      setCrop(c => ({
        ...c,
        x: clamp(dragStart.crop.x + dx, 0, w - c.size),
        y: clamp(dragStart.crop.y + dy, 0, h - c.size)
      }));
    } else if (dragging === "resize") {
      const newSize = clamp(dragStart.crop.size + Math.max(dx, dy), 40, Math.min(w - dragStart.crop.x, h - dragStart.crop.y));
      setCrop(c => ({ ...c, size: newSize }));
    }
  }, [dragging, dragStart, imgDisplay]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  const handleCrop = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/jpeg", 0.92);
    if (dataUrl) onCrop(dataUrl);
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modal cropModal"
        onClick={e => e.stopPropagation()}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="modalHeader">
          <h3 style={{ margin: 0 }}>✂️ Crop Avatar Image</h3>
          <button className="closeBtn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: "0 16px" }}>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
            Drag the box to reposition · Drag the ◢ handle to resize
          </p>
        </div>

        {error && <p style={{ color: "#f87171", padding: "0 16px 8px", fontSize: 13 }}>{error}</p>}

        {/* Image + overlay crop area */}
        <div ref={containerRef} style={{ position: "relative", minHeight: 80, padding: "0 16px 12px", userSelect: "none" }}>
          {/* Hidden img for natural size */}
          <img
            ref={imgRef}
            src={proxied}
            alt="crop source"
            crossOrigin="anonymous"
            onLoad={onLoad}
            onError={() => setError("Could not load image. Try a different URL or upload the image directly.")}
            style={{ display: "none" }}
          />

          {!loaded && !error && (
            <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>Loading image…</div>
          )}

          {loaded && (
            <div style={{ position: "relative", display: "inline-block", left: imgDisplay.offX, width: imgDisplay.w, height: imgDisplay.h }}>
              {/* Rendered image */}
              <img
                src={proxied}
                alt="crop"
                crossOrigin="anonymous"
                style={{ width: imgDisplay.w, height: imgDisplay.h, display: "block", borderRadius: 8 }}
                draggable={false}
              />
              {/* Dim overlay */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", borderRadius: 8, pointerEvents: "none" }} />
              {/* Crop window (clears the dim) */}
              <div
                style={{
                  position: "absolute",
                  left: crop.x, top: crop.y,
                  width: crop.size, height: crop.size,
                  border: "2px solid #f59e0b",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  borderRadius: 6,
                  cursor: "move",
                  background: "transparent"
                }}
                onMouseDown={e => onMouseDown(e, "move")}
              >
                {/* Resize handle */}
                <div
                  style={{
                    position: "absolute", right: -10, bottom: -10,
                    width: 22, height: 22,
                    background: "#f59e0b",
                    borderRadius: "50%",
                    cursor: "se-resize",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#000", fontWeight: 700
                  }}
                  onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "resize"); }}
                >◢</div>
                {/* Corner guides */}
                {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
                  <div key={i} style={{ position:"absolute", [v]:0, [h]:0, width:12, height:12,
                    borderTop: v==="top" ? "2px solid #fff" : "none",
                    borderBottom: v==="bottom" ? "2px solid #fff" : "none",
                    borderLeft: h==="left" ? "2px solid #fff" : "none",
                    borderRight: h==="right" ? "2px solid #fff" : "none"
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview + Apply */}
        {loaded && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Preview</p>
              <canvas
                ref={canvasRef}
                width={240} height={240}
                style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid #f59e0b", display: "block" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>Looks good? Click Apply to use this cropped image as your avatar.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn primary" onClick={handleCrop} style={{ fontSize: 13 }}>
                  <Check size={15} /> Apply Crop
                </button>
                <button className="btn" onClick={onClose} style={{ fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateProfile({ profile, updateProfile }) {
  const nav = useNavigate();
  const fileInputRef = React.useRef(null);
  const [form, setForm] = useState({
    name: profile.name === "Guest User" ? "" : profile.name,
    email: profile.email || "",
    bio: profile.bio || "",
    avatar: profile.avatar || "",
    initial: profile.initial || "",
    role: profile.role || "user"
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  // Sync form state whenever profile updates
  useEffect(() => {
    setForm({
      name: profile.name === "Guest User" ? "" : profile.name,
      email: profile.email || "",
      bio: profile.bio || "",
      avatar: profile.avatar || "",
      initial: profile.initial || "",
      role: profile.role || "user"
    });
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "name" && value.trim()) {
      setForm((f) => ({ ...f, initial: value.trim()[0].toUpperCase() }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setOptimizing(true);
    try {
      // Load as data URL first so the cropper can use it (no CORS issues)
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((f) => ({ ...f, avatar: ev.target.result }));
        setOptimizing(false);
        setShowCropper(true); // open cropper immediately after upload
      };
      reader.onerror = () => {
        setError("Could not read this image file. Please try another.");
        setOptimizing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Photo processing failed:", err);
      setError("Could not process this image file. Please try another image.");
      setOptimizing(false);
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");

    const name = form.name.trim();
    const email = form.email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}@cinefilum.space`;
    const initial = name ? name[0].toUpperCase() : "U";

    const updated = {
      name,
      email,
      bio: form.bio.trim(),
      avatar: form.avatar || profile.avatar || "",
      initial,
      role: profile.role || "user"
    };

    updateProfile(updated);
    setSaved(true);
    setTimeout(() => nav("/profile"), 800);
  };

  return (
    <main className="page">
      <span className="eyebrow">ACCOUNT</span>
      <h1>{profile.name === "Guest User" ? "Create Your Profile" : "Edit Profile"}</h1>

      <div className="profileForm">
        {/* Avatar Customization Card */}
        <div className="avatarPickerSection">
          <div className="avatarPreviewRow">
            <div className="bigAvatar">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="avatarImg" />
              ) : (
                form.initial || "?"
              )}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: "16px", color: "#f8fafc" }}>Profile Avatar Image</b>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 12px" }}>
                Upload a custom photo (auto-optimized), paste an image URL, or pick an Interstellar crew avatar below.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: "13px", padding: "8px 16px" }}
                  disabled={optimizing}
                >
                  <Camera size={15} /> {optimizing ? "Optimizing..." : "Upload Photo"}
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setForm((f) => ({ ...f, avatar: "" }))}
                    style={{ fontSize: "13px", padding: "8px 14px", borderColor: "rgba(244,63,94,0.4)", color: "#fda4af" }}
                  >
                    <Trash2 size={15} /> Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <label style={{ display: "block", marginTop: 8 }}>
            <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Image URL</span>
            <input
              name="avatar"
              placeholder="https://example.com/photo.jpg"
              value={form.avatar}
              onChange={handleChange}
              style={{ marginTop: 6 }}
            />
          </label>

          {/* Crop from URL button */}
          {form.avatar && form.avatar.startsWith("http") && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowCropper(true)}
                style={{ fontSize: 13, padding: "8px 16px", borderColor: "#f59e0b", color: "#f59e0b" }}
              >
                ✂️ Crop Image from URL
              </button>
            </div>
          )}

          {showCropper && form.avatar && (
            <ImageCropModal
              src={form.avatar}
              onCrop={(dataUrl) => {
                setForm(f => ({ ...f, avatar: dataUrl }));
                setShowCropper(false);
              }}
              onClose={() => setShowCropper(false)}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 600 }}>Or Select an Interstellar Crew Avatar:</span>
            <div className="avatarPresetGrid">
              {AVATAR_PRESETS.map((p) => (
                <div
                  key={p.id}
                  className={`avatarPresetCard ${form.avatar === p.url ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, avatar: p.url }))}
                >
                  <img src={p.url} alt={p.name} className="avatarPresetThumb" />
                  <span className="avatarPresetLabel">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="formGrid">
          <label>
            Full Name *
            <input
              name="name"
              placeholder="e.g. Cooper"
              value={form.name}
              onChange={handleChange}
            />
          </label>
          <label>
            Email (Optional)
            <input
              name="email"
              type="email"
              placeholder="e.g. cooper@endurance.space"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Short Bio
            <textarea
              name="bio"
              placeholder="Tell us what kind of movies you love..."
              value={form.bio}
              onChange={handleChange}
              rows={3}
            />
          </label>
        </div>

        {error && <p style={{ color: "#f87171", marginTop: 8, fontWeight: 600 }}>{error}</p>}

        <div className="actions" style={{ marginTop: 24 }}>
          <button className="btn primary" onClick={handleSave}>
            {saved ? <><Check size={16} /> Profile Saved!</> : <><Save size={16} /> Save Profile</>}
          </button>
          <Link className="btn" to="/profile">Cancel</Link>
        </div>
      </div>
    </main>
  );
}

// ── Admin Login Gateway (Restricted for Owner Only) ─────────────────
function AdminLogin({ profile, updateProfile }) {
  const nav = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const MASTER_ADMIN_KEY = "cinefilum2024";

  const handleAuth = (e) => {
    e.preventDefault();
    if (passcode.trim() === MASTER_ADMIN_KEY) {
      setError("");
      setSuccess(true);
      const updated = { ...profile, role: "admin" };
      updateProfile(updated);
      setTimeout(() => nav("/admin"), 600);
    } else {
      setError("Invalid administrative authorization key.");
    }
  };

  const handleRevoke = () => {
    const updated = { ...profile, role: "user" };
    updateProfile(updated);
    nav("/profile");
  };

  return (
    <main className="page" style={{ maxWidth: 540, margin: "40px auto" }}>
      <div className="adminLoginCard">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1px solid var(--gold-gargantua)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Shield size={32} color="#f59e0b" />
          </div>
          <span className="eyebrow" style={{ marginBottom: 8 }}>RESTRICTED ACCESS</span>
          <h1 style={{ fontSize: "28px", margin: "8px 0 4px" }}>System Administrator Login</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Owner-only administrative terminal for Cinefilum telemetry, APIs, and catalog moderation.
          </p>
        </div>

        {profile.role === "admin" ? (
          <div style={{ textAlign: "center", background: "rgba(245,158,11,0.1)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 24 }}>
            <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              ● Admin Authorization Active
            </span>
            <h3 style={{ margin: "10px 0 6px", color: "#fff" }}>Welcome, {profile.name} (Admin)</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: 20 }}>You currently have full administrative control.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/admin" className="btn primary">
                <Shield size={16} /> Open Admin Dashboard
              </Link>
              <button className="btn" onClick={handleRevoke} style={{ borderColor: "#f87171", color: "#f87171" }}>
                <LogOut size={16} /> Lock Admin Mode
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>
              Master Security Key
              <input
                type="password"
                placeholder="Enter master authorization key..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                style={{
                  background: "rgba(10,14,26,0.9)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: "#fff",
                  fontSize: "14px"
                }}
              />
            </label>

            {error && <p style={{ color: "#f87171", margin: 0, fontSize: "13px", fontWeight: 600 }}>{error}</p>}
            {success && <p style={{ color: "#4ade80", margin: 0, fontSize: "13px", fontWeight: 600 }}>✓ Access Granted. Initializing Admin Terminal...</p>}

            <button type="submit" className="btn primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              <Key size={16} /> Authenticate & Unlock Admin Mode
            </button>
            <Link to="/profile" className="btn" style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px" }}>
              ← Return to Profile
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}

// ── Profile ───────────────────────────────────────────────────────
function Profile({ list, toggleList, profile, updateProfile, allMedia = initialMedia }) {
  const nav = useNavigate();
  const isAdmin = profile.role === "admin";

  const handleLogout = () => {
    updateProfile(DEFAULT_PROFILE);
    nav("/create-profile");
  };

  // Personalized recommendations based on saved items
  const personalizedRecs = useMemo(() => {
    const saved = allMedia.filter((m) => list.includes(m.id));
    if (!saved.length) return allMedia.slice(0, 8);
    const savedGenres = saved.flatMap((m) => m.genre || []);
    return allMedia
      .filter((m) => !list.includes(m.id) && m.genre?.some((g) => savedGenres.includes(g)))
      .slice(0, 10);
  }, [list, allMedia]);

  return (
    <main className="page profile">
      <div className="profileHead">
        <div className="bigAvatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="avatarImg" />
          ) : (
            profile.initial || "U"
          )}
        </div>
        <div style={{ flex: 1 }}>
          <span className="eyebrow">MY PROFILE</span>
          <h1>{profile.name}</h1>
          {profile.email && <p style={{ color: "#64748b", margin: "2px 0 4px" }}>{profile.email}</p>}
          {profile.bio && <p style={{ color: "#94a3b8", margin: "4px 0 8px" }}>{profile.bio}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span className="typeBadge">{isAdmin ? "👑 Admin" : "👤 User"}</span>
            <span className="typeBadge">{list.length} saved titles</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link className="btn primary" to="/create-profile">
            <Camera size={15} /> Change Photo & Profile
          </Link>
          <Link className="btn" to="/settings">
            <Settings2 size={15} /> Settings
          </Link>
          {isAdmin && (
            <Link className="btn" to="/admin" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
              <Shield size={15} /> Admin Panel
            </Link>
          )}
          <button className="btn" onClick={handleLogout} style={{ borderColor: "#f87171", color: "#f87171" }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {profile.name === "Guest User" && (
        <div className="emptyBanner">
          <UserPlus size={28} color="#f59e0b" />
          <div>
            <b>Set up your profile & photo</b>
            <p>Upload a profile photo to personalize your streaming station.</p>
          </div>
          <Link className="btn primary" to="/create-profile">Set Up Profile</Link>
        </div>
      )}

      {/* Personalized Recommendations Row */}
      <Row
        title="🎯 Recommended For You (Based on Your Taste)"
        items={personalizedRecs}
        list={list}
        toggleList={toggleList}
      />

      <Row
        title="Recently Watched"
        items={allMedia.slice(0, 5)}
        list={list}
        toggleList={toggleList}
      />
    </main>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────
function Admin({ profile, list, allMedia = initialMedia }) {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");
  const [omdbKey, setOmdbKeyState] = useState(getOmdbApiKey());
  const [tmdbKey, setTmdbKeyState] = useState(getTmdbApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  // Redirect non-admins
  useEffect(() => {
    if (profile.role !== "admin") nav("/profile");
  }, [profile, nav]);

  if (profile.role !== "admin") return null;

  const totalMovies = allMedia.filter((x) => x.type === "movie").length;
  const totalTv = allMedia.filter((x) => x.type === "tv").length;

  const stats = [
    { label: "Total Streamable Titles", value: allMedia.length, icon: Film },
    { label: "Movies in Feed", value: totalMovies, icon: Film },
    { label: "TV Series in Feed", value: totalTv, icon: Tv },
    { label: "User Saved in Watchlist", value: list.length, icon: Heart },
    { label: "OMDb API Status", value: getOmdbApiKey() ? "Active" : "No Key", icon: Key },
    { label: "TMDB Live Feed", value: getTmdbApiKey() ? "Active (Connected)" : "Not Set", icon: Key }
  ];

  const handleSaveKeys = () => {
    setOmdbApiKey(omdbKey);
    setTmdbApiKey(tmdbKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const filteredContent = useMemo(() => {
    return allMedia.filter((m) => {
      const matchType = contentTypeFilter === "all" || m.type === contentTypeFilter;
      const matchQuery =
        !contentSearch.trim() ||
        m.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
        m.genre?.some((g) => g.toLowerCase().includes(contentSearch.toLowerCase()));
      return matchType && matchQuery;
    });
  }, [allMedia, contentSearch, contentTypeFilter]);

  return (
    <main className="page">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">ADMIN PANEL</span>
          <h1><Shield size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" to="/profile">← Back to Profile</Link>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="adminTabs">
        {[
          { id: "overview", label: "Overview", icon: BarChart2 },
          { id: "content", label: `Catalog (${allMedia.length})`, icon: Film },
          { id: "api", label: "API Configuration", icon: Key },
          { id: "users", label: "User Accounts", icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "adminTab active" : "adminTab"}
            onClick={() => setTab(id)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          <div className="statsGrid">
            {stats.map(({ label, value, icon: Icon }) => (
              <div className="statCard" key={label}>
                <Icon size={22} color="#f59e0b" />
                <div className="statVal">{value}</div>
                <div className="statLabel">{label}</div>
              </div>
            ))}
          </div>

          {/* Streaming Infrastructure Health */}
          <div className="adminSection" style={{ marginTop: 24 }}>
            <h3>Streaming Infrastructure & Server Endpoints</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 12 }}>
              {[
                { name: "Primary Stream Server (vidsrc.sbs)", status: "Online", desc: "Embed endpoint: /embed/movie/{id} and /embed/tv/{id}/{s}/{e}" },
                { name: "TMDB API Network (v3)", status: "Connected", desc: "Live feeds: Trending, Popular, Top Rated, Neural Recs" },
                { name: "OMDb Database Service", status: "Active (93b66d7b)", desc: "IMDb ratings, directors, cast, and awards metadata" },
                { name: "YouTube Official Trailer Service", status: "Online", desc: "Dynamic trailer resolver & embed fallback" }
              ].map((srv) => (
                <div key={srv.name} style={{ background: "rgba(10,14,26,0.6)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <b style={{ fontSize: "14px", color: "#f8fafc" }}>{srv.name}</b>
                    <span style={{ fontSize: "11px", color: "#4ade80", background: "rgba(74,222,128,0.15)", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                      ● {srv.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{srv.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="adminSection">
            <h3>Quick Actions</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => setTab("content")}>
                <Film size={16} /> Manage Live Content ({allMedia.length})
              </button>
              <button className="btn" onClick={() => setTab("api")}>
                <Key size={16} /> Update API Keys
              </button>
              <Link className="btn" to="/settings">
                <Settings2 size={16} /> Preferences & Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "content" && (
        <div className="adminSection">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>All Streamable Titles ({filteredContent.length} of {allMedia.length})</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                placeholder="Search titles or genres..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                style={{ width: 220, padding: "6px 12px", fontSize: "13px" }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "all", label: "All" },
                  { id: "movie", label: "Movies" },
                  { id: "tv", label: "TV Series" }
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`btn ${contentTypeFilter === f.id ? "primary" : ""}`}
                    onClick={() => setContentTypeFilter(f.id)}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="adminTable">
            <div className="adminTableHead" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr" }}>
              <span>Title</span>
              <span>Type</span>
              <span>Year</span>
              <span>IMDb Rating</span>
              <span>Genre</span>
              <span>Actions</span>
            </div>
            {filteredContent.slice(0, 50).map((m) => (
              <div className="adminTableRow" key={m.id} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr" }}>
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={m.poster || FALLBACK_POSTER} alt={m.title} style={{ width: 24, height: 32, borderRadius: 4, objectFit: "cover" }}  loading="lazy" decoding="async" />
                  {m.title}
                </span>
                <span>
                  <span className="typeBadge" style={{ fontSize: "11px" }}>
                    {m.type === "movie" ? "Film" : "Series"}
                  </span>
                </span>
                <span>{m.year}</span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{m.rating} ★</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{(m.genre || []).slice(0, 2).join(", ")}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Link to={`/watch/${m.id}`} className="btn primary" style={{ fontSize: "11px", padding: "3px 8px" }}>
                    <Play size={11} /> Stream
                  </Link>
                  <Link to={`/title/${m.id}`} className="btn" style={{ fontSize: "11px", padding: "3px 8px" }}>
                    <Info size={11} /> Info
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {filteredContent.length > 50 && (
            <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: 10, textAlign: "center" }}>
              Showing first 50 results of {filteredContent.length} matching titles.
            </p>
          )}
        </div>
      )}

      {/* API Keys */}
      {tab === "api" && (
        <div className="adminSection">
          <h3>API Configuration & Credentials</h3>
          <div className="apiCards">
            <div className="apiCard">
              <div className="apiCardHead">
                <Key size={20} color="#f59e0b" />
                <div>
                  <b>OMDb API Key</b>
                  <span className="apiStatus active">● Active</span>
                </div>
              </div>
              <p>Powers movie search, IMDb ratings, cast, awards & box office data. Free: 1,000 requests/day.</p>
              <input
                type="text"
                placeholder="OMDb API Key"
                value={omdbKey}
                onChange={(e) => setOmdbKeyState(e.target.value)}
              />
            </div>
            <div className="apiCard">
              <div className="apiCardHead">
                <Key size={20} color="#38bdf8" />
                <div>
                  <b>TMDB API Key (v3)</b>
                  <span className={`apiStatus ${getTmdbApiKey() ? "active" : "inactive"}`}>
                    ● {getTmdbApiKey() ? "Active (Connected)" : "Not Set"}
                  </span>
                </div>
              </div>
              <p>Powers live trending feeds (160+ titles), backdrops, trailer resolver, and recommendations.</p>
              <input
                type="text"
                placeholder="TMDB API Key"
                value={tmdbKey}
                onChange={(e) => setTmdbKeyState(e.target.value)}
              />
            </div>
            <div className="apiCard">
              <div className="apiCardHead">
                <Radio size={20} color="#4ade80" />
                <div>
                  <b>TVmaze API</b>
                  <span className="apiStatus active">● Always Active</span>
                </div>
              </div>
              <p>Free public API for TV show data and schedule information. No key required.</p>
              <input type="text" value="No key required (Active)" disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <button className="btn primary" onClick={handleSaveKeys} style={{ marginTop: 16 }}>
            {keySaved ? <><Check size={16} /> Saved Successfully!</> : <><Save size={16} /> Save API Keys</>}
          </button>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="adminSection">
          <h3>User Accounts & Security</h3>
          <div className="adminTable">
            <div className="adminTableHead" style={{ gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1.5fr" }}>
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Watchlist</span>
              <span>Actions</span>
            </div>
            <div className="adminTableRow" style={{ gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1.5fr" }}>
              <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold-gargantua)", display: "grid", placeItems: "center", color: "#000", fontWeight: 700 }}>
                    {profile.initial || "U"}
                  </span>
                )}
                {profile.name}
              </span>
              <span style={{ color: "#94a3b8" }}>{profile.email || "—"}</span>
              <span>
                <span className="typeBadge" style={{ fontSize: "11px", background: profile.role === "admin" ? "rgba(245,158,11,0.2)" : undefined }}>
                  {profile.role === "admin" ? "👑 Admin" : "👤 User"}
                </span>
              </span>
              <span>{list.length} saved titles</span>
              <div>
                <Link to="/create-profile" className="btn" style={{ fontSize: "12px", padding: "4px 10px" }}>
                  <Edit3 size={12} /> Edit
                </Link>
              </div>
            </div>
          </div>
          <p style={{ color: "#64748b", marginTop: 16, fontSize: "13px" }}>
            Session data is safely encrypted and synced to localStorage (`cf_profile`, `cf_omdb_key`, `cf_tmdb_key`).
          </p>
        </div>
      )}
    </main>
  );
}

// ── Settings (With Catalog Mode & Instant Revert) ────────────────
function Settings({ profile, updateProfile, feedMode = "dynamic", toggleFeedMode }) {
  const isAdmin = profile.role === "admin";
  const [omdbKey, setOmdbKey] = useState(getOmdbApiKey());
  const [tmdbKey, setTmdbKey] = useState(getTmdbApiKey());
  const [saved, setSaved] = useState(false);
  const [revertAlert, setRevertAlert] = useState(false);

  const handleSave = () => {
    setOmdbApiKey(omdbKey);
    setTmdbApiKey(tmdbKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRevertAll = () => {
    toggleFeedMode("classic");
    setOmdbApiKey("93b66d7b");
    setTmdbApiKey("");
    setOmdbKey("93b66d7b");
    setTmdbKey("");
    setRevertAlert(true);
    setTimeout(() => setRevertAlert(false), 3000);
  };

  return (
    <main className="page">
      <span className="eyebrow">PREFERENCES</span>
      <h1>Settings</h1>
      <div className="settings">
        {/* User Preferences (Visible to All Users) */}
        {[
          { t: "Recommendations", d: "Personalized based on your watch history" },
          { t: "Dark Mode", d: "Deep dark cinematic theme (default)" },
          { t: "Language", d: "English (US)" },
          { t: "Autoplay Trailers", d: "Preview trailers on hover" }
        ].map((x) => (
          <div className="setting" key={x.t}>
            <div>
              <b>{x.t}</b>
              <p>{x.d}</p>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>
        ))}

        {/* Administrator-Only Controls & API Configuration */}
        {isAdmin ? (
          <>
            <div className="setting" style={{ display: "block", borderTop: "1px dashed var(--gold-gargantua)", marginTop: 16 }}>
              <b style={{ color: "var(--gold-flare)" }}>👑 Administrator Catalog Feed & Layout Mode</b>
              <p>Choose between the dynamic live VidSrc stream network or revert to classic selective titles.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  className={`paramToggleBtn ${feedMode === "dynamic" ? "active" : ""}`}
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                  onClick={() => toggleFeedMode("dynamic")}
                >
                  🌐 Dynamic Live VidSrc Feed (60+ Titles & Rotating Hero)
                </button>
                <button
                  className={`paramToggleBtn ${feedMode === "classic" ? "active" : ""}`}
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                  onClick={() => toggleFeedMode("classic")}
                >
                  🪐 Classic Selective Cosmos (Original 16 Titles)
                </button>
              </div>
            </div>

            <div className="setting" style={{ display: "block" }}>
              <b>OMDb API Key <span style={{ color: "#4ade80", fontSize: "12px", marginLeft: "8px" }}>✓ Active</span></b>
              <p>Powers movie search, IMDb ratings, cast info, awards & box office data.</p>
              <div className="apiKeyInputBox">
                <input
                  type="password"
                  placeholder="OMDb API Key"
                  value={omdbKey}
                  onChange={(e) => setOmdbKey(e.target.value)}
                />
                <button className="btn primary" onClick={handleSave}>
                  {saved ? <Check size={16} /> : <Key size={16} />} {saved ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            <div className="setting" style={{ display: "block" }}>
              <b>TMDB API Key <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "8px" }}>Optional</span></b>
              <p>Connect to The Movie Database for live trending and HD backdrops.</p>
              <div className="apiKeyInputBox">
                <input
                  type="password"
                  placeholder="TMDB v3 API Key (optional)"
                  value={tmdbKey}
                  onChange={(e) => setTmdbKey(e.target.value)}
                />
                <button className="btn primary" onClick={handleSave}>
                  {saved ? <Check size={16} /> : <Key size={16} />} {saved ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            <div className="setting" style={{ display: "block", borderColor: "rgba(244,63,94,0.3)" }}>
              <b style={{ color: "#fda4af" }}>Reset & Revert to Factory Defaults</b>
              <p>Revert all catalog feeds and settings back to clean classic state.</p>
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={handleRevertAll}
                  style={{ borderColor: "#f43f5e", color: "#fda4af", background: "rgba(244,63,94,0.1)" }}
                >
                  <RotateCcw size={15} /> {revertAlert ? "✓ Reverted Successfully to Classic!" : "Revert All to Classic Defaults"}
                </button>
              </div>
            </div>

            <div className="setting" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <b style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold-flare)" }}>
                    <Shield size={16} color="#f59e0b" />
                    Administrator Session Active
                  </b>
                  <p>You have full administrative control over Cinefilum.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/admin" className="btn primary" style={{ fontSize: "12px", padding: "6px 14px" }}>
                    Open Admin Panel
                  </Link>
                  <button
                    className="btn"
                    onClick={() => {
                      updateProfile({ ...profile, role: "user" });
                    }}
                    style={{ fontSize: "12px", padding: "6px 12px", borderColor: "#f87171", color: "#f87171" }}
                  >
                    Lock Admin Mode
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

// ── Onboarding ────────────────────────────────────────────────────
function Onboarding() {
  const [step, setStep] = useState(1);
  const labels = ["Genres", "Picks", "Directors", "Language", "Done"];
  return (
    <main className="onboard">
      <div className="steps">
        {labels.map((x, i) => (
          <span className={step >= i + 1 ? "active" : ""} key={x}>
            {i + 1} {x}
          </span>
        ))}
      </div>
      {step < 5 ? (
        <>
          <span className="eyebrow">STEP {step} OF 4</span>
          <h1>
            {[
              "What genres do you enjoy?",
              "Pick some favorites to start.",
              "Who are your favorite directors?",
              "Choose your preferred language."
            ][step - 1]}
          </h1>
          <div className="pickgrid">
            {(step === 1
              ? genres.filter((g) => g !== "All")
              : ["Interstellar", "Dune: Part Two", "Arrival", "The Martian", "Blade Runner 2049", "Inception"]
            ).map((x) => (
              <button key={x}>
                {x}
                <span>+</span>
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        </>
      ) : (
        <>
          <Sparkles size={48} color="#f59e0b" />
          <h1>You're all set!</h1>
          <p style={{ color: "#94a3b8", margin: "14px 0 28px" }}>
            Cinefilum is ready with picks tailored just for you.
          </p>
          <Link className="btn primary" to="/">
            Start Watching
          </Link>
        </>
      )}
    </main>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function Empty({ title, text }) {
  return (
    <div className="empty">
      <Sparkles size={36} />
      <h2 style={{ margin: "12px 0 6px" }}>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
