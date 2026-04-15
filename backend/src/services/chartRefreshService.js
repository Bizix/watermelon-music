const pool = require("../config/db");
const { getRankings, shouldScrapeGenre } = require("./rankingsService");
const { scrapeAndSaveGenre } = require("./scraperService");

const refreshLocks = new Map();
const CHART_REFRESH_TIMEOUT_MS = Number(
  process.env.CHART_REFRESH_TIMEOUT_MS || 5 * 60 * 1000
);

function emptyState(genreCode) {
  return {
    genreCode,
    status: "idle",
    reason: null,
    error: null,
    startedAt: null,
    finishedAt: null,
    lastSuccessAt: null,
    inProgress: false,
  };
}

async function ensureRefreshStateRow(genreCode) {
  await pool.query(
    `INSERT INTO chart_refresh_state (genre_code)
     VALUES ($1)
     ON CONFLICT (genre_code) DO NOTHING`,
    [genreCode]
  );
}

async function upsertRefreshState(
  genreCode,
  { status, reason, lastStartedAt, lastFinishedAt, lastSuccessAt, lastError }
) {
  await ensureRefreshStateRow(genreCode);
  await pool.query(
    `UPDATE chart_refresh_state
     SET status = COALESCE($2, status),
         reason = $3,
         last_started_at = $4,
         last_finished_at = $5,
         last_success_at = $6,
         last_error = $7,
         updated_at = NOW()
     WHERE genre_code = $1`,
    [
      genreCode,
      status,
      reason ?? null,
      lastStartedAt ?? null,
      lastFinishedAt ?? null,
      lastSuccessAt ?? null,
      lastError ?? null,
    ]
  );
}

async function getPersistedState(genreCode) {
  const result = await pool.query(
    `SELECT genre_code,
            status,
            reason,
            last_started_at,
            last_finished_at,
            last_success_at,
            last_error
     FROM chart_refresh_state
     WHERE genre_code = $1`,
    [genreCode]
  );

  return result.rows[0] || null;
}

function serializeState(state, genreCode) {
  return {
    genreCode,
    status: state?.status || "idle",
    reason: state?.reason || null,
    error: state?.last_error || null,
    startedAt: state?.last_started_at || null,
    finishedAt: state?.last_finished_at || null,
    lastSuccessAt: state?.last_success_at || null,
    inProgress: refreshLocks.has(genreCode),
  };
}

function serializeLockState(genreCode, lock) {
  return {
    ...emptyState(genreCode),
    status: "running",
    reason: lock.reason ?? null,
    startedAt: lock.startedAt ?? null,
    inProgress: true,
  };
}

function runRefresh(genreCode, reason) {
  const startedAt = new Date().toISOString();
  let timeoutId;
  let timedOut = false;

  const executionPromise = (async () => {
    await upsertRefreshState(genreCode, {
      status: "running",
      reason,
      lastStartedAt: startedAt,
      lastFinishedAt: null,
      lastError: null,
    });

    try {
      await scrapeAndSaveGenre(genreCode);
      await getRankings(genreCode);
      const finishedAt = new Date().toISOString();
      await upsertRefreshState(genreCode, {
        status: "success",
        reason,
        lastStartedAt: startedAt,
        lastFinishedAt: finishedAt,
        lastSuccessAt: finishedAt,
        lastError: null,
      });
    } catch (error) {
      const finishedAt = new Date().toISOString();
      await upsertRefreshState(genreCode, {
        status: "error",
        reason,
        lastStartedAt: startedAt,
        lastFinishedAt: finishedAt,
        lastError: error.message,
      });
      throw error;
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(async () => {
      timedOut = true;
      const finishedAt = new Date().toISOString();
      const timeoutError = new Error(
        `Chart refresh timed out after ${CHART_REFRESH_TIMEOUT_MS}ms`
      );

      try {
        await upsertRefreshState(genreCode, {
          status: "error",
          reason,
          lastStartedAt: startedAt,
          lastFinishedAt: finishedAt,
          lastError: timeoutError.message,
        });
      } catch (error) {
        console.error("❌ Failed to persist chart refresh timeout:", error.message);
      }

      reject(timeoutError);
    }, CHART_REFRESH_TIMEOUT_MS);
  });

  const exposedPromise = Promise.race([executionPromise, timeoutPromise]).finally(
    () => {
      clearTimeout(timeoutId);
    }
  );

  exposedPromise.catch((error) => {
    if (timedOut) {
      console.error(`❌ Chart refresh timed out for ${genreCode}:`, error.message);
    }
  });

  refreshLocks.set(genreCode, {
    promise: exposedPromise,
    startedAt,
    reason,
    get timedOut() {
      return timedOut;
    },
  });

  executionPromise.catch((error) => {
    console.error(`❌ Background chart refresh failed for ${genreCode}:`, error.message);
  }).finally(() => {
    refreshLocks.delete(genreCode);
  });

  return exposedPromise;
}

async function queueGenreRefresh(
  genreCode,
  { force = false, reason = "request" } = {}
) {
  const lock = refreshLocks.get(genreCode);

  if (lock) {
    return {
      queued: false,
      alreadyRunning: true,
      status: await getGenreRefreshStatus(genreCode),
      promise: lock.promise,
    };
  }

  const needsRefresh = force || (await shouldScrapeGenre(genreCode));

  if (!needsRefresh) {
    return {
      queued: false,
      alreadyRunning: false,
      status: await getGenreRefreshStatus(genreCode),
      promise: null,
    };
  }

  const promise = runRefresh(genreCode, reason);

  return {
    queued: true,
    alreadyRunning: false,
    status: await getGenreRefreshStatus(genreCode),
    promise,
  };
}

async function getGenreRefreshStatus(genreCode) {
  const state = await getPersistedState(genreCode);
  if (!state) {
    const lock = refreshLocks.get(genreCode);
    return lock ? serializeLockState(genreCode, lock) : emptyState(genreCode);
  }

  return serializeState(state, genreCode);
}

module.exports = {
  queueGenreRefresh,
  getGenreRefreshStatus,
};
