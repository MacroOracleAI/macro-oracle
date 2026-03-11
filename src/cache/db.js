const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../../cache.json');

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
}

function getCache(key) {
  const cache = loadCache();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expires_at) {
    delete cache[key];
    saveCache(cache);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlSeconds) {
  const cache = loadCache();
  cache[key] = {
    value,
    expires_at: Date.now() + ttlSeconds * 1000,
  };
  saveCache(cache);
}

module.exports = { getCache, setCache };
