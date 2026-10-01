/**
 * Cinefilum DMCA & Content Blacklist Management
 * Records copyright takedowns, blocked titles, and prevents streaming/indexing.
 */

export const DEFAULT_BLACKLIST = [
  {
    id: "1462861",
    tmdbId: "1462861",
    title: "Spider Island",
    reason: "Removed pursuant to copyright takedown notice (DMCA 512(d))",
    claimant: "Protagonist Pictures / CTW Anti-Piracy",
    date: "2026-09-30",
    refId: "0-5604000041198-2064959629"
  }
];

const STORAGE_KEY = "cinefilum_blacklist";

function normalizeId(id) {
  if (!id) return "";
  return String(id).trim().toLowerCase().replace(/^(tmdb-|m-|tv-)/, "");
}

/**
 * Gets all user-configured blacklisted items from localStorage
 */
export function getStoredBlacklist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves dynamic blacklisted items to localStorage
 */
export function saveStoredBlacklist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save blacklist to localStorage:", err);
  }
}

/**
 * Returns the combined active blacklist (default entries + custom admin entries)
 */
export function getAllBlacklisted() {
  const custom = getStoredBlacklist();
  const seenIds = new Set(DEFAULT_BLACKLIST.map(x => normalizeId(x.id)));
  const merged = [...DEFAULT_BLACKLIST];
  for (const item of custom) {
    const norm = normalizeId(item.id);
    if (!seenIds.has(norm)) {
      seenIds.add(norm);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * Checks whether an ID or Title is blacklisted
 */
export function isBlacklisted(idOrTitle) {
  if (!idOrTitle) return false;
  const targetNorm = normalizeId(idOrTitle);
  const targetTitle = String(idOrTitle).trim().toLowerCase();

  const all = getAllBlacklisted();
  return all.some((item) => {
    const normId = normalizeId(item.id || item.tmdbId);
    if (normId && (normId === targetNorm || normId === String(idOrTitle).trim())) return true;
    if (item.title && item.title.trim().toLowerCase() === targetTitle) return true;
    return false;
  });
}

/**
 * Gets the blacklist metadata for a matching ID or Title
 */
export function getBlacklistEntry(idOrTitle) {
  if (!idOrTitle) return null;
  const targetNorm = normalizeId(idOrTitle);
  const targetTitle = String(idOrTitle).trim().toLowerCase();

  const all = getAllBlacklisted();
  return (
    all.find((item) => {
      const normId = normalizeId(item.id || item.tmdbId);
      if (normId && (normId === targetNorm || normId === String(idOrTitle).trim())) return true;
      if (item.title && item.title.trim().toLowerCase() === targetTitle) return true;
      return false;
    }) || null
  );
}

/**
 * Adds an item to the blacklist (used by Admin Panel)
 */
export function addBlacklistEntry({ id, title, reason, claimant }) {
  if (!id && !title) return false;
  const custom = getStoredBlacklist();
  const norm = normalizeId(id);
  const exists = custom.some((x) => (norm && normalizeId(x.id) === norm) || (title && x.title?.toLowerCase() === title.toLowerCase()));
  if (exists) return false;

  const newEntry = {
    id: norm || `custom-${Date.now()}`,
    tmdbId: norm,
    title: title || `Title #${id}`,
    reason: reason || "Removed pursuant to copyright takedown notice",
    claimant: claimant || "Copyright Owner / Agent",
    date: new Date().toISOString().split("T")[0]
  };

  custom.push(newEntry);
  saveStoredBlacklist(custom);
  return true;
}

/**
 * Removes a custom item from the blacklist
 */
export function removeBlacklistEntry(id) {
  const norm = normalizeId(id);
  const custom = getStoredBlacklist();
  const filtered = custom.filter((x) => normalizeId(x.id) !== norm && String(x.id) !== String(id));
  saveStoredBlacklist(filtered);
}
