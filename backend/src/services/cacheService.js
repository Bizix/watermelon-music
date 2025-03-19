const cache = new Map(); // ✅ In-memory cache

// ✅ Retrieve Cached Data
function getCache(key) {
    if (!cache.has(key)) return null;

    const { data, timestamp } = cache.get(key);
    const hoursSinceLastUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);

    if (hoursSinceLastUpdate > 24) {
        cache.delete(key); // ❌ Expire old cache
        return null;
    }

    console.log(`✅ Using cached data for ${key} (updated ${hoursSinceLastUpdate.toFixed(1)} hours ago). Skipping database call.`);
    return data;
}

// ✅ Store Data in Cache
function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

module.exports = { getCache, setCache };
