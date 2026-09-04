import { initialMedia } from "../data/moviesData";

// ──────────────────────────────────────────────
// API Config
// ──────────────────────────────────────────────
const OMDB_BASE_URL = "https://www.omdbapi.com";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TVMAZE_BASE_URL = "https://api.tvmaze.com";
const DEFAULT_TMDB_KEY = "4152ea09a44140809f82d68a9b2b0024";

export const getOmdbApiKey = () =>
  (typeof window !== "undefined" && localStorage.getItem("omdb_api_key")) ||
  import.meta.env.VITE_OMDB_API_KEY ||
  "93b66d7b";

export const setOmdbApiKey = (key) => {
  if (typeof window !== "undefined") {
    key ? localStorage.setItem("omdb_api_key", key.trim())
      : localStorage.removeItem("omdb_api_key");
  }
};

export const getTmdbApiKey = () =>
  (typeof window !== "undefined" && localStorage.getItem("tmdb_api_key")) ||
  import.meta.env.VITE_TMDB_API_KEY ||
  DEFAULT_TMDB_KEY;

export const setTmdbApiKey = (key) => {
  if (typeof window !== "undefined") {
    key ? localStorage.setItem("tmdb_api_key", key.trim())
      : localStorage.removeItem("tmdb_api_key");
  }
};

// ──────────────────────────────────────────────
// Streaming Servers (vidsrc.sbs primary)
// ──────────────────────────────────────────────
export const STREAM_SERVERS = [
  { id: "vidsrc", name: "VidSrc.sbs (Primary)", icon: "⚡" },
  { id: "videasy", name: "Videasy (4K Fast)", icon: "🚀" },
  { id: "cinesrc", name: "CineSrc (Multi-Sub)", icon: "💎" },
  { id: "vidsrcpm", name: "VidSrc PM (Backup)", icon: "🛡️" }
];

/**
 * Builds the streaming player URL based on media item, server, and custom URL query parameters.
 * Directly integrates https://vidsrc.sbs/ with query customization:
 * ?autoplay=1 | ?color=f59e0b | ?sub=en | ?t=120 | ?controls=0
 */
export function getStreamUrl(media, optionsOrSeason = 1, maybeEpisode = 1, maybeServer = "vidsrc") {
  if (!media) return "";
  const tmdbId = media.tmdbId || String(media.id).replace("tmdb-", "").replace("m-", "").replace("tv-", "");
  if (!tmdbId || isNaN(Number(tmdbId))) {
    if (media.tmdbId) return "";
  }

  let season = 1;
  let episode = 1;
  let server = "vidsrc";
  let autoplay = 1;
  let color = "f59e0b";
  let sub = "en";
  let t = 0;
  let controls = 1;

  if (typeof optionsOrSeason === "object" && optionsOrSeason !== null) {
    season = optionsOrSeason.season ?? 1;
    episode = optionsOrSeason.episode ?? 1;
    server = optionsOrSeason.server || "vidsrc";
    autoplay = optionsOrSeason.autoplay !== undefined ? optionsOrSeason.autoplay : 1;
    color = optionsOrSeason.color ? String(optionsOrSeason.color).replace("#", "") : "f59e0b";
    sub = optionsOrSeason.sub || "en";
    t = optionsOrSeason.t ?? 0;
    controls = optionsOrSeason.controls !== undefined ? optionsOrSeason.controls : 1;
  } else {
    season = optionsOrSeason;
    episode = maybeEpisode;
    server = maybeServer;
  }

  const isMovie = media.type === "movie";
  const cleanColor = color ? color.replace("#", "") : "f59e0b";

  // Build query string for vidsrc.sbs
  const params = new URLSearchParams();
  if (autoplay !== undefined && autoplay !== null) params.set("autoplay", String(autoplay));
  if (cleanColor) params.set("color", cleanColor);
  if (sub && sub !== "off") params.set("sub", sub);
  if (t && Number(t) > 0) params.set("t", String(t));
  if (controls !== undefined && controls !== null) params.set("controls", String(controls));

  const queryStr = params.toString() ? `?${params.toString()}` : "";

  switch (server) {
    case "videasy":
      return isMovie
        ? `https://player.videasy.net/movie/${tmdbId}${queryStr}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}${queryStr}`;
    case "cinesrc":
      return isMovie
        ? `https://cinesrc.st/embed/movie/${tmdbId}`
        : `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}&color=${cleanColor}&autoplay=${autoplay ? "true" : "false"}`;
    case "vidsrcpm":
      return isMovie
        ? `https://vidsrc.pm/embed/movie/${tmdbId}`
        : `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`;
    case "vidsrc":
    default:
      // Primary server: https://vidsrc.sbs/
      return isMovie
        ? `https://vidsrc.sbs/embed/movie/${tmdbId}${queryStr}`
        : `https://vidsrc.sbs/embed/tv/${tmdbId}/${season}/${episode}${queryStr}`;
  }
}

// ──────────────────────────────────────────────
// TMDB Genre Map
// ──────────────────────────────────────────────
const TMDB_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10765: "Sci-Fi"
};

/** Convert TMDB item into rich Cinefilum media model */
export function normalizeTmdbItem(item, customTags = []) {
  const isMovie = item.media_type === "movie" || item.title !== undefined;
  const title = item.title || item.name;
  const year = isMovie
    ? item.release_date ? new Date(item.release_date).getFullYear() : 2024
    : item.first_air_date ? new Date(item.first_air_date).getFullYear() : 2024;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "7.8";
  const score = Math.round((item.vote_average || 7.8) * 10);
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
    : poster;

  const genresList = (item.genre_ids || (item.genres || []).map(g => g.id))
    .map((gid) => TMDB_GENRES[gid])
    .filter(Boolean);

  const isAnime =
    (item.original_language === "ja" && (genresList.includes("Animation") || (item.genre_ids && item.genre_ids.includes(16)))) ||
    customTags.some(t => String(t).toLowerCase() === "anime");

  if (isAnime && !genresList.includes("Anime")) {
    genresList.unshift("Anime");
  }

  // Ensure any customTags genre name is represented in genresList
  customTags.forEach(t => {
    if (t && typeof t === "string") {
      const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      if (["Action", "Adventure", "Animation", "Anime", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"].includes(cap)) {
        if (!genresList.includes(cap)) genresList.push(cap);
      }
    }
  });

  const finalGenres = genresList.length > 0
    ? genresList
    : (isMovie ? ["Action", "Drama"] : ["Drama", "Series"]);

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    type: isMovie ? "movie" : "tv",
    title,
    year,
    score,
    rating,
    runtime: isMovie ? (item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : "Film") : (item.number_of_seasons ? `${item.number_of_seasons} Seasons` : "Series"),
    seasons: item.number_of_seasons || (isMovie ? 1 : 4),
    trailerId: item.videos?.results?.find(
      (v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube"
    )?.key || item.videos?.results?.[0]?.key || item.trailerId || null,
    poster,
    backdrop,
    desc: item.overview || "High-definition streaming transmission available via VidSrc.sbs.",
    reason: `Popular stream on VidSrc.sbs (${rating} rating)`,
    genre: finalGenres,
    tags: Array.from(new Set([
      ...customTags,
      isMovie ? "movie" : "series",
      finalGenres.includes("Sci-Fi") ? "scifi" : "",
      item.vote_average >= 8.0 ? "top_rated" : "",
      item.popularity > 50 ? "popular" : ""
    ])).filter(Boolean),
    cast: (item.credits?.cast || []).slice(0, 4).map(c => c.name)
  };
}

// ──────────────────────────────────────────────
// In-Memory Media Cache for 100% Accurate Lookup
// ──────────────────────────────────────────────
const mediaCache = new Map();

// Preload initialMedia into cache
initialMedia.forEach((m) => {
  mediaCache.set(String(m.id), m);
  if (m.tmdbId) mediaCache.set(`tmdb-${m.tmdbId}`, m);
});

export function getCachedMedia(id) {
  return mediaCache.get(String(id));
}

export function saveCachedMedia(m) {
  if (!m || !m.id) return;
  mediaCache.set(String(m.id), m);
  if (m.tmdbId) mediaCache.set(`tmdb-${m.tmdbId}`, m);
}

/**
 * Resolves TMDB ID for any media item
 */
export async function resolveTmdbId(media) {
  if (!media) return null;
  if (media.tmdbId) return media.tmdbId;

  const key = getTmdbApiKey();
  if (!key) return null;

  if (media.imdbID) {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/find/${media.imdbID}?api_key=${key}&external_source=imdb_id`);
      if (res.ok) {
        const d = await res.json();
        const found = d.movie_results?.[0] || d.tv_results?.[0];
        if (found?.id) return found.id;
      }
    } catch (e) {
      console.warn("Could not find TMDB ID by IMDb ID:", e);
    }
  }

  try {
    const endpoint = media.type === "tv" ? "tv" : "movie";
    const res = await fetch(`${TMDB_BASE_URL}/search/${endpoint}?api_key=${key}&query=${encodeURIComponent(media.title)}`);
    if (res.ok) {
      const d = await res.json();
      const match = d.results?.[0];
      if (match?.id) return match.id;
    }
  } catch (e) {
    console.warn("Could not find TMDB ID by title search:", e);
  }

  return null;
}

/**
 * Pick the highest quality official trailer from TMDB video list
 */
function pickBestTrailer(results) {
  if (!results || !results.length) return null;
  const youtubeVideos = results.filter(v => v.site === "YouTube" && v.key);
  if (!youtubeVideos.length) return null;

  const scored = youtubeVideos.map(v => {
    let score = 0;
    const name = (v.name || "").toLowerCase();
    const type = (v.type || "").toLowerCase();

    // High priority official title matches
    if (name.includes("official trailer")) score += 100;
    else if (name.includes("main trailer") || name.includes("theatrical trailer")) score += 80;
    else if (name.includes("final trailer")) score += 70;
    else if (name.includes("trailer")) score += 50;
    else if (name.includes("teaser")) score += 30;

    // Type weight
    if (type === "trailer") score += 40;
    else if (type === "teaser") score += 20;
    else if (type === "clip") score += 10;

    // Official flag bonus
    if (v.official) score += 15;

    // Filter out non-trailers (reviews, speeches, behind the scenes, interviews)
    if (name.includes("review") || name.includes("interview") || name.includes("speech") || name.includes("press") || name.includes("b-roll")) {
      score -= 80;
    }

    return { ...v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/**
 * Fetches the exact YouTube trailer ID for any movie or TV series
 */
export async function fetchTrailerKey(media) {
  if (!media) return null;
  const key = getTmdbApiKey();

  // If already resolved with a valid ID
  if (media.trailerId && media.trailerId !== "zSWdZVtXT7E" && media.id !== "m-1") {
    return media.trailerId;
  }
  if (media.id === "m-1") return "zSWdZVtXT7E"; // Interstellar official trailer

  let tmdbId = media.tmdbId;
  if (!tmdbId) {
    const rawNumeric = String(media.id).replace("tmdb-", "").replace("m-", "").replace("tv-", "");
    if (!isNaN(Number(rawNumeric)) && Number(rawNumeric) > 0) {
      tmdbId = Number(rawNumeric);
    } else {
      tmdbId = await resolveTmdbId(media);
    }
  }

  const isTv = media.type === "tv" || String(media.id).startsWith("tv-");
  const endpoint = isTv ? "tv" : "movie";

  if (key && tmdbId) {
    try {
      const [resEn, resAll] = await Promise.allSettled([
        fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/videos?api_key=${key}&include_video_language=en,null`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/videos?api_key=${key}`).then(r => r.json())
      ]);

      const list = [
        ...(resEn.status === "fulfilled" && resEn.value?.results ? resEn.value.results : []),
        ...(resAll.status === "fulfilled" && resAll.value?.results ? resAll.value.results : [])
      ];

      const best = pickBestTrailer(list);
      if (best?.key) {
        media.trailerId = best.key;
        saveCachedMedia(media);
        return best.key;
      }
    } catch (e) {
      console.warn("Could not fetch trailer video key from TMDB:", e);
    }
  }

  return null;
}

/**
 * Universal TMDB ID extractor for any media object or ID string
 */
export function getMediaTmdbId(mediaOrId) {
  if (!mediaOrId) return null;
  if (typeof mediaOrId === "object") {
    if (mediaOrId.tmdbId) return Number(mediaOrId.tmdbId);
    return getMediaTmdbId(mediaOrId.id);
  }

  const idStr = String(mediaOrId);
  const cached = getCachedMedia(idStr);
  if (cached?.tmdbId) return Number(cached.tmdbId);

  // Check initialMedia
  const init = initialMedia.find((m) => String(m.id) === idStr || String(m.tmdbId) === idStr);
  if (init?.tmdbId) return Number(init.tmdbId);

  if (idStr.startsWith("tmdb-")) {
    const parsed = Number(idStr.replace("tmdb-", ""));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (idStr.startsWith("tv-")) {
    const parsed = Number(idStr.replace("tv-", ""));
    if (!isNaN(parsed) && parsed > 100) return parsed;
  }

  if (!isNaN(Number(idStr)) && Number(idStr) > 0) {
    return Number(idStr);
  }

  return null;
}

/**
 * Fetches complete details for any title by ID (supports tmdb-*, m-*, tv-*, omdb-*)
 */
export async function fetchMediaDetailsById(id) {
  if (!id) return null;
  const inCache = getCachedMedia(id);
  if (inCache && inCache.cast && inCache.cast.length > 0 && inCache.trailerId) return inCache;

  const key = getTmdbApiKey();
  const tmdbId = getMediaTmdbId(id);

  // If TMDB id or numeric
  if (tmdbId && key) {
    const isTv = String(id).startsWith("tv-") || inCache?.type === "tv";
    const endpoint = isTv ? "tv" : "movie";
    try {
      const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${key}&append_to_response=credits,recommendations,videos`);
      if (res.ok) {
        const d = await res.json();
        const normalized = normalizeTmdbItem(d);
        if (inCache) {
          normalized.id = inCache.id;
        } else {
          normalized.id = String(id);
        }
        saveCachedMedia(normalized);
        return normalized;
      }
    } catch (e) {
      console.warn("Could not fetch TMDB details:", e);
    }
  }

  // Fallback to initialMedia
  return inCache || initialMedia.find((m) => String(m.id) === String(id)) || initialMedia[0];
}

/**
 * Fetches Live Feed from https://vidsrc.sbs/ TMDB API:
 * Trending, Popular, Top Rated, Now Playing, and Popular TV
 */
export async function fetchLiveVidsrcCatalog() {
  const key = getTmdbApiKey();
  if (!key) return initialMedia;

  try {
    const pages = [1, 2, 3, 4];
    const fetchPromises = [
      // Trending Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/trending/movie/day?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["trending", "featured", "movie"] }))),
      // Popular Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["popular", "movie"] }))),
      // Top Rated Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["top_rated", "movie"] }))),
      // Trending TV Series
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/trending/tv/day?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["trending", "series", "tv"] }))),
      // Popular TV Series
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["popular", "series", "tv"] }))),
      // Top Rated TV Series
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${key}&page=${p}`).then(r => r.json()).then(d => ({ results: d.results, tags: ["top_rated", "series", "tv"] }))),
      // Anime Movies (4 pages)
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=16&with_original_language=ja&page=${p}&sort_by=popularity.desc`).then(r => r.json()).then(d => ({ results: d.results, tags: ["anime", "popular", "movie"] }))),
      // Anime TV Series (4 pages)
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${key}&with_genres=16&with_original_language=ja&page=${p}&sort_by=popularity.desc`).then(r => r.json()).then(d => ({ results: d.results, tags: ["anime", "trending", "series", "tv"] }))),
      // Sci-Fi Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=878&page=${p}&sort_by=popularity.desc`).then(r => r.json()).then(d => ({ results: d.results, tags: ["scifi", "sci-fi", "movie"] }))),
      // Action Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=28&page=${p}&sort_by=popularity.desc`).then(r => r.json()).then(d => ({ results: d.results, tags: ["action", "movie"] }))),
      // Animation Movies
      ...pages.map(p => fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=16&page=${p}&sort_by=popularity.desc`).then(r => r.json()).then(d => ({ results: d.results, tags: ["animation", "movie"] })))
    ];

    const responses = await Promise.allSettled(fetchPromises);
    const liveItems = [];
    const seen = new Set(initialMedia.map(m => (m.tmdbId ? String(m.tmdbId) : m.title.toLowerCase())));

    responses.forEach(res => {
      if (res.status === "fulfilled" && res.value?.results) {
        const { results, tags } = res.value;
        (results || []).forEach(m => {
          if (m.poster_path && !seen.has(String(m.id))) {
            seen.add(String(m.id));
            const norm = normalizeTmdbItem(m, tags);
            liveItems.push(norm);
            saveCachedMedia(norm);
          }
        });
      }
    });

    return deduplicateMedia([...initialMedia, ...liveItems]);
  } catch (err) {
    console.warn("Could not fetch live vidsrc catalog, using curated library:", err);
    return initialMedia;
  }
}

/** Convert OMDb search result */
function normalizeOmdbSearchItem(item) {
  if (!item || !item.Poster || item.Poster === "N/A" || !item.Poster.startsWith("http")) {
    return null;
  }
  const year = parseInt(item.Year) || 2024;
  const poster = item.Poster;

  return {
    id: `omdb-${item.imdbID}`,
    imdbID: item.imdbID,
    type: item.Type === "series" ? "tv" : "movie",
    title: item.Title,
    year,
    score: 85,
    genre: ["Popular"],
    rating: "8.0",
    runtime: item.Type === "series" ? "Series" : "Film",
    poster,
    backdrop: poster,
    desc: "Stream available directly via VidSrc.sbs.",
    reason: "Found via OMDb search.",
    cast: [],
    _needsDetail: true
  };
}

export function normalizeOmdbDetail(d) {
  const score = d.imdbRating && d.imdbRating !== "N/A"
    ? Math.min(99, Math.round(parseFloat(d.imdbRating) * 10))
    : 82;

  const poster =
    d.Poster && d.Poster !== "N/A" && d.Poster.startsWith("http")
      ? d.Poster
      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";

  const genres = d.Genre && d.Genre !== "N/A"
    ? d.Genre.split(", ")
    : ["Drama"];

  const cast = [d.Director, ...(d.Actors?.split(", ") || [])]
    .filter((c) => c && c !== "N/A");

  return {
    id: `omdb-${d.imdbID}`,
    imdbID: d.imdbID,
    type: d.Type === "series" ? "tv" : "movie",
    title: d.Title,
    year: parseInt(d.Year) || 2024,
    score,
    genre: genres,
    rating: d.Rated && d.Rated !== "N/A" ? d.Rated : d.imdbRating || "8.0",
    imdbRating: d.imdbRating !== "N/A" ? d.imdbRating : null,
    runtime: d.Runtime && d.Runtime !== "N/A" ? d.Runtime : (d.Type === "series" ? "Series" : "Film"),
    poster,
    backdrop: poster,
    desc: d.Plot && d.Plot !== "N/A" ? d.Plot : "An acclaimed cinematic experience.",
    reason: `IMDb Rating: ${d.imdbRating || "N/A"} · ${d.Awards !== "N/A" ? d.Awards : "Critically acclaimed"}`,
    cast,
    director: d.Director !== "N/A" ? d.Director : null,
    country: d.Country !== "N/A" ? d.Country : null,
    language: d.Language !== "N/A" ? d.Language : null,
    awards: d.Awards !== "N/A" ? d.Awards : null,
    boxOffice: d.BoxOffice !== "N/A" ? d.BoxOffice : null
  };
}

export function deduplicateMedia(items) {
  if (!items || !items.length) return [];
  const seenIds = new Set();
  const seenTitles = new Set();
  const result = [];

  for (const m of items) {
    if (!m) continue;
    // Filter out items with placeholder clapperboards or missing posters
    if (m.poster && (m.poster.includes("photo-1594909122845") || m.poster.includes("photo-1536440136628"))) {
      continue;
    }
    const titleKey = (m.title || "").toLowerCase().trim();
    const idKey = m.tmdbId ? `tmdb-${m.tmdbId}` : String(m.id || titleKey);

    if (seenIds.has(idKey) || seenTitles.has(titleKey)) continue;

    seenIds.add(idKey);
    seenTitles.add(titleKey);
    result.push(m);
  }

  return result;
}

const GENRE_NAME_MAP = {
  "sci-fi": 878,
  "scifi": 878,
  "sci fi": 878,
  "science fiction": 878,
  "action": 28,
  "adventure": 12,
  "animation": 16,
  "anime": 16,
  "comedy": 35,
  "crime": 80,
  "documentary": 99,
  "drama": 18,
  "family": 10751,
  "fantasy": 14,
  "history": 36,
  "horror": 27,
  "music": 10402,
  "mystery": 9648,
  "romance": 10749,
  "thriller": 53,
  "war": 10752,
  "western": 37
};

/** Search across TMDB, OMDb, and TVmaze with intelligent genre discovery */
export async function searchMedia(query) {
  if (!query || !query.trim()) return deduplicateMedia(initialMedia);
  const q = query.trim().toLowerCase();

  const seenIds = new Set();
  const seenTitles = new Set();
  const localMatches = [];

  for (const m of mediaCache.values()) {
    if (!m) continue;
    if (m.poster && (m.poster.includes("photo-1594909122845") || m.poster.includes("photo-1536440136628"))) {
      continue;
    }
    const titleKey = (m.title || "").toLowerCase().trim();
    const idKey = m.tmdbId ? `tmdb-${m.tmdbId}` : String(m.id || titleKey);

    if (seenIds.has(idKey) || seenTitles.has(titleKey)) continue;

    const matchesTitle = titleKey.includes(q);
    const matchesGenre = m.genre && m.genre.some((g) => g.toLowerCase().includes(q));
    const matchesDesc = m.desc && m.desc.toLowerCase().includes(q);

    if (matchesTitle || matchesGenre || matchesDesc) {
      seenIds.add(idKey);
      seenTitles.add(titleKey);
      localMatches.push(m);
    }
  }

  const omdbKey = getOmdbApiKey();
  const tmdbKey = getTmdbApiKey();
  const combined = [...localMatches];

  const addUnique = (items) => {
    for (const item of items) {
      if (!item || !item.poster || item.poster.includes("photo-1594909122845") || item.poster.includes("photo-1536440136628")) continue;
      const titleKey = (item.title || "").toLowerCase().trim();
      const idKey = item.tmdbId ? `tmdb-${item.tmdbId}` : String(item.id || titleKey);
      if (!seenIds.has(idKey) && !seenTitles.has(titleKey)) {
        seenIds.add(idKey);
        seenTitles.add(titleKey);
        combined.push(item);
        saveCachedMedia(item);
      }
    }
  };

  const isAnimeSearch = q === "anime" || q === "animes" || q === "anime series" || q === "anime movies";
  const genreId = GENRE_NAME_MAP[q];

  const [tmdbSearchRes, tmdbGenreRes, omdbResults] = await Promise.allSettled([
    tmdbKey
      ? fetch(`${TMDB_BASE_URL}/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(q)}&include_adult=false`)
        .then((r) => r.json())
        .then((d) =>
          (d.results || [])
            .filter((x) => x.poster_path && (x.media_type === "movie" || x.media_type === "tv"))
            .map(x => normalizeTmdbItem(x, ["search"]))
        )
      : Promise.resolve([]),
    tmdbKey && (genreId || isAnimeSearch)
      ? Promise.all([
        fetch(isAnimeSearch
          ? `${TMDB_BASE_URL}/discover/movie?api_key=${tmdbKey}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`
          : `${TMDB_BASE_URL}/discover/movie?api_key=${tmdbKey}&with_genres=${genreId}&sort_by=popularity.desc`
        ).then(r => r.json()),
        fetch(isAnimeSearch
          ? `${TMDB_BASE_URL}/discover/tv?api_key=${tmdbKey}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`
          : `${TMDB_BASE_URL}/discover/tv?api_key=${tmdbKey}&with_genres=${genreId}&sort_by=popularity.desc`
        ).then(r => r.json())
      ]).then(([m, tv]) => {
        const mList = (m.results || []).filter(x => x.poster_path).map(x => normalizeTmdbItem({ ...x, media_type: "movie" }, ["anime", "genre_match"]));
        const tvList = (tv.results || []).filter(x => x.poster_path).map(x => normalizeTmdbItem({ ...x, media_type: "tv" }, ["anime", "genre_match"]));
        return [...mList, ...tvList];
      })
      : Promise.resolve([]),
    omdbKey && !genreId && !isAnimeSearch // Skip OMDb literal text search if searching for a genre/anime
      ? fetch(`${OMDB_BASE_URL}/?apikey=${omdbKey}&s=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => (d.Response === "True" ? (d.Search || []).map(normalizeOmdbSearchItem).filter(Boolean) : []))
      : Promise.resolve([])
  ]);

  if (tmdbGenreRes.status === "fulfilled" && tmdbGenreRes.value?.length) {
    addUnique(tmdbGenreRes.value);
  }
  if (tmdbSearchRes.status === "fulfilled" && tmdbSearchRes.value?.length) {
    addUnique(tmdbSearchRes.value);
  }
  if (omdbResults.status === "fulfilled" && omdbResults.value?.length) {
    addUnique(omdbResults.value);
  }

  return deduplicateMedia(combined);
}

/**
 * Fetch dynamically more items for a genre from TMDB with pagination support
 */
export async function fetchMoreGenreItems(genreName, type = "all", page = 1) {
  const key = getTmdbApiKey();
  if (!key) return [];

  const GENRE_TO_TMDB = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "anime": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "sci-fi": 878,
    "scifi": 878,
    "thriller": 53,
    "war": 10752,
    "western": 37
  };

  const gName = (genreName || "all").toLowerCase().trim();
  const isAnimeType = type === "anime";
  const isAnime = gName === "anime" || isAnimeType;
  const isTrending = gName === "trending";
  const isPopular = gName === "popular";
  const isTopRated = gName === "top rated" || gName === "top_rated";
  const isFeatured = gName === "featured" || gName === "now playing" || gName === "now_playing";
  const isAll = gName === "all";

  const gid = (!isAnime && !isTrending && !isPopular && !isTopRated && !isFeatured && !isAll)
    ? GENRE_TO_TMDB[gName]
    : null;

  // For anime type, fetch both TV anime and anime movies
  const endpoints = (type === "all" || type === "anime") ? ["tv", "movie"] : [type === "tv" ? "tv" : "movie"];
  const results = [];

  await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        let url;
        if (isAnimeType) {
          // Anime catalog page: always fetch Japanese animation, with optional sub-genre filter
          if (gid) {
            url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=16,${gid}&with_original_language=ja&page=${page}&sort_by=popularity.desc`;
          } else if (isTopRated) {
            url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=16&with_original_language=ja&page=${page}&sort_by=vote_average.desc&vote_count.gte=20`;
          } else if (isTrending) {
            url = `${TMDB_BASE_URL}/trending/${ep}/day?api_key=${key}&page=${page}`;
          } else if (isPopular) {
            url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=16&with_original_language=ja&page=${page}&sort_by=popularity.desc`;
          } else {
            url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=16&with_original_language=ja&page=${page}&sort_by=popularity.desc`;
          }
        } else if (isAnime) {
          url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=16&with_original_language=ja&page=${page}&sort_by=popularity.desc`;
        } else if (isTrending || isFeatured) {
          url = `${TMDB_BASE_URL}/trending/${ep}/day?api_key=${key}&page=${page}`;
        } else if (isPopular) {
          url = `${TMDB_BASE_URL}/${ep}/popular?api_key=${key}&page=${page}`;
        } else if (isTopRated) {
          url = `${TMDB_BASE_URL}/${ep}/top_rated?api_key=${key}&page=${page}`;
        } else if (gid) {
          url = `${TMDB_BASE_URL}/discover/${ep}?api_key=${key}&with_genres=${gid}&page=${page}&sort_by=popularity.desc`;
        } else {
          url = `${TMDB_BASE_URL}/${ep}/popular?api_key=${key}&page=${page}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const d = await res.json();
          (d.results || []).forEach((m) => {
            if (m.poster_path) {
              const tags = [gName, ep === "tv" ? "series" : "movie"];
              if (isAnime || isAnimeType) tags.push("anime");
              const norm = normalizeTmdbItem(m, tags);
              if ((isAnime || isAnimeType) && !norm.genre.includes("Anime")) {
                norm.genre.unshift("Anime");
              }
              results.push(norm);
              saveCachedMedia(norm);
            }
          });
        }
      } catch (e) {
        console.warn("Could not fetch more genre items:", e);
      }
    })
  );

  return deduplicateMedia(results);
}

// ──────────────────────────────────────────────
// Avatar Presets for Interstellar & Cinefilum
// ──────────────────────────────────────────────
export const AVATAR_PRESETS = [
  { id: "cooper", name: "Cooper (Pilot)", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" },
  { id: "gargantua", name: "Gargantua Void", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80" },
  { id: "nebula", name: "Deep Nebula", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80" },
  { id: "pilot", name: "Endurance Crew", url: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80" },
  { id: "starfield", name: "Cosmic Horizon", url: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=200&auto=format&fit=crop&q=80" },
  { id: "cinema", name: "Film Director", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80" }
];

// ──────────────────────────────────────────────
// Avatar Image Compression Utility
// ──────────────────────────────────────────────
export function compressAvatarImage(file, maxWidth = 240, maxHeight = 240, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(width, 32);
          canvas.height = Math.max(height, 32);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } else {
            resolve(e.target.result);
          }
        } catch (err) {
          console.warn("Canvas compression fallback:", err);
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Ultra-Accurate Recommendation Engine:
 * 1. Queries TMDB's neural recommendation endpoint (/movie/{id}/recommendations, /tv/{id}/recommendations)
 * 2. Queries TMDB's thematic similarity endpoint (/movie/{id}/similar)
 * 3. Falls back to multi-factor weighted scoring (genre correlation, director, rating)
 */
export async function fetchAccurateRecommendations(media, allMedia = initialMedia, limit = 28) {
  if (!media) return [];
  const key = getTmdbApiKey();
  const tmdbId = getMediaTmdbId(media);
  const isMovie = media.type === "movie";
  const endpoint = isMovie ? "movie" : "tv";

  const seen = new Set([
    String(media.id),
    String(media.tmdbId),
    String(tmdbId),
    (media.title || "").toLowerCase()
  ]);
  const results = [];

  const addItems = (list, tag) => {
    if (!list) return;
    for (const item of list) {
      const itemKey = item.title ? item.title.toLowerCase() : (item.name ? item.name.toLowerCase() : "");
      if (
        item.poster_path &&
        !seen.has(String(item.id)) &&
        !seen.has(`tmdb-${item.id}`) &&
        !seen.has(itemKey)
      ) {
        seen.add(String(item.id));
        seen.add(`tmdb-${item.id}`);
        if (itemKey) seen.add(itemKey);
        const norm = normalizeTmdbItem(item, [tag]);
        results.push(norm);
        saveCachedMedia(norm);
      }
    }
  };

  if (tmdbId && key) {
    try {
      const [recRes, simRes, recPage2] = await Promise.allSettled([
        fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/recommendations?api_key=${key}&page=1`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/similar?api_key=${key}&page=1`).then(r => r.json()),
        limit > 16 ? fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/recommendations?api_key=${key}&page=2`).then(r => r.json()) : Promise.resolve(null)
      ]);

      if (recRes.status === "fulfilled" && recRes.value?.results) {
        addItems(recRes.value.results, "recommended");
      }
      if (simRes.status === "fulfilled" && simRes.value?.results) {
        addItems(simRes.value.results, "similar");
      }
      if (recPage2.status === "fulfilled" && recPage2.value?.results) {
        addItems(recPage2.value.results, "recommended");
      }

      if (results.length >= limit) {
        return results.slice(0, limit);
      }
    } catch (e) {
      console.warn("Could not fetch TMDB recommendations:", e);
    }
  }

  // Complement or Fallback: Multi-factor weighted similarity scoring over allMedia
  const catalogScored = allMedia
    .filter((x) => !seen.has(String(x.id)) && !seen.has(String(x.tmdbId)) && !seen.has((x.title || "").toLowerCase()))
    .map((item) => {
      let score = 0;
      // Overlapping genres
      const sharedGenres = (item.genre || []).filter((g) => (media.genre || []).includes(g));
      score += sharedGenres.length * 4.0;

      // Same type match
      if (item.type === media.type) score += 2;

      // Rating quality boost
      const ratingNum = parseFloat(item.rating) || 7.0;
      score += (ratingNum - 6.0);

      // Director match
      if (media.director && item.director && media.director.toLowerCase() === item.director.toLowerCase()) {
        score += 6;
      }

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);

  for (const item of catalogScored) {
    if (results.length >= limit) break;
    results.push(item);
  }

  return results.slice(0, limit);
}

