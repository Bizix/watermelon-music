process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/watermelon_music";
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-key";
process.env.SPOTIFY_CLIENT_ID =
  process.env.SPOTIFY_CLIENT_ID || "spotify-client-id";
process.env.SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || "spotify-client-secret";
process.env.SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "https://example.com/callback";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const pool = require("../src/config/db");
const { supabaseAdmin } = require("../src/config/supabaseAdmin");
const cacheService = require("../src/services/cacheService");
const rankingsService = require("../src/services/rankingsService");
const chartRefreshService = require("../src/services/chartRefreshService");
const scraperService = require("../src/services/scraperService");

const modulePathsToClear = [
  "../src/app",
  "../src/routes/cronRoutes",
  "../src/routes/deletionRoutes",
  "../src/routes/lyricsRoutes",
  "../src/routes/rankingsRoutes",
  "../src/routes/scraperRoutes",
  "../src/routes/spotifyRoutes",
];

const originalGetCache = cacheService.getCache;
const originalGetRankings = rankingsService.getRankings;
const originalShouldScrapeGenre = rankingsService.shouldScrapeGenre;
const originalQueueGenreRefresh = chartRefreshService.queueGenreRefresh;
const originalGetGenreRefreshStatus = chartRefreshService.getGenreRefreshStatus;
const originalScrapeAndSaveGenre = scraperService.scrapeAndSaveGenre;
const originalSupabaseGetUser = supabaseAdmin.auth.getUser;
const originalSupabaseFrom = supabaseAdmin.from;
const originalPoolQuery = pool.query;

function clearAppModules() {
  for (const modulePath of modulePathsToClear) {
    delete require.cache[require.resolve(modulePath)];
  }
}

function clearChartRefreshModule() {
  delete require.cache[require.resolve("../src/services/chartRefreshService")];
}

function restoreMocks() {
  cacheService.getCache = originalGetCache;
  rankingsService.getRankings = originalGetRankings;
  rankingsService.shouldScrapeGenre = originalShouldScrapeGenre;
  chartRefreshService.queueGenreRefresh = originalQueueGenreRefresh;
  chartRefreshService.getGenreRefreshStatus = originalGetGenreRefreshStatus;
  scraperService.scrapeAndSaveGenre = originalScrapeAndSaveGenre;
  supabaseAdmin.auth.getUser = originalSupabaseGetUser;
  supabaseAdmin.from = originalSupabaseFrom;
  pool.query = originalPoolQuery;
  delete process.env.CHART_REFRESH_TIMEOUT_MS;
}

function loadApp() {
  clearAppModules();
  const { createApp } = require("../src/app");
  return createApp();
}

function loadChartRefreshService() {
  clearChartRefreshModule();
  return require("../src/services/chartRefreshService");
}

test.beforeEach(() => {
  restoreMocks();
  clearAppModules();
});

test.after(() => {
  restoreMocks();
  clearAppModules();
});

test("privileged routes require a bearer token", async () => {
  const app = loadApp();

  const spotifyResponse = await request(app)
    .post("/api/spotify/export-playlist")
    .send({ playlistId: 1 });

  assert.equal(spotifyResponse.status, 401);
  assert.match(spotifyResponse.body.error, /authorization/i);

  const deletionResponse = await request(app)
    .post("/api/delete-user")
    .send({ userId: "user-1" });

  assert.equal(deletionResponse.status, 401);
  assert.match(deletionResponse.body.error, /authorization/i);
});

test("rankings route returns database data without waiting for refresh completion", async () => {
  cacheService.getCache = () => null;
  chartRefreshService.queueGenreRefresh = async () => ({
    queued: true,
    alreadyRunning: false,
    status: {
      genreCode: "DM0000",
      status: "running",
      inProgress: true,
    },
    promise: new Promise(() => {}),
  });
  rankingsService.getRankings = async () => [
    {
      id: 1,
      rank: 1,
      movement: "NEW",
      title: "Song",
      artist: "Artist",
      album: "Album",
      art: "art.jpg",
      lyrics: null,
    },
  ];

  const app = loadApp();
  const startedAt = Date.now();
  const response = await request(app).get("/api/rankings?genre=DM0000");
  const elapsed = Date.now() - startedAt;

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].title, "Song");
  assert.ok(elapsed < 500, `expected non-blocking response, got ${elapsed}ms`);
});

test("scrape-status route returns durable refresh fields", async () => {
  chartRefreshService.getGenreRefreshStatus = async () => ({
    genreCode: "DM0000",
    status: "success",
    reason: "cron_refresh",
    error: null,
    startedAt: "2026-04-15T00:00:00.000Z",
    finishedAt: "2026-04-15T00:01:00.000Z",
    lastSuccessAt: "2026-04-15T00:01:00.000Z",
    inProgress: false,
  });

  const app = loadApp();
  const response = await request(app).get("/api/scrape-status?genre=DM0000");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    genreCode: "DM0000",
    status: "success",
    reason: "cron_refresh",
    error: null,
    startedAt: "2026-04-15T00:00:00.000Z",
    finishedAt: "2026-04-15T00:01:00.000Z",
    lastSuccessAt: "2026-04-15T00:01:00.000Z",
    inProgress: false,
  });
});

test("scrape-status returns an idle payload for unknown genres", async () => {
  pool.query = async (sql, params) => {
    if (sql.includes("SELECT genre_code") && params[0] === "UNKNOWN") {
      return { rows: [] };
    }

    throw new Error(`Unexpected query: ${sql}`);
  };

  const app = loadApp();
  const response = await request(app).get("/api/scrape-status?genre=UNKNOWN");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    genreCode: "UNKNOWN",
    status: "idle",
    reason: null,
    error: null,
    startedAt: null,
    finishedAt: null,
    lastSuccessAt: null,
    inProgress: false,
  });
});

test("in-flight refreshes share the timeout-bounded promise", async () => {
  process.env.CHART_REFRESH_TIMEOUT_MS = "20";
  rankingsService.shouldScrapeGenre = async () => true;
  rankingsService.getRankings = async () => [];
  scraperService.scrapeAndSaveGenre = async () => new Promise(() => {});

  pool.query = async (sql, params) => {
    if (sql.includes("SELECT genre_code")) {
      return {
        rows: [
          {
            genre_code: params[0],
            status: "running",
            reason: "request",
            last_started_at: "2026-04-15T00:00:00.000Z",
            last_finished_at: null,
            last_success_at: null,
            last_error: null,
          },
        ],
      };
    }

    return { rows: [] };
  };

  const isolatedChartRefreshService = loadChartRefreshService();
  const first = await isolatedChartRefreshService.queueGenreRefresh("DM0000");
  const second = await isolatedChartRefreshService.queueGenreRefresh("DM0000");

  assert.equal(second.alreadyRunning, true);
  assert.strictEqual(second.promise, first.promise);
  await assert.rejects(second.promise, /timed out/i);
  clearChartRefreshModule();
});

test("spotify export returns 401 when the user has no stored Spotify tokens", async () => {
  supabaseAdmin.auth.getUser = async () => ({
    data: { user: { id: "user-1" } },
    error: null,
  });
  supabaseAdmin.from = () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: null,
          error: null,
        }),
      }),
    }),
  });

  const app = loadApp();
  const response = await request(app)
    .post("/api/spotify/export-playlist")
    .set("Authorization", "Bearer test-token")
    .send({ playlistId: 99 });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "User or token not found");
});

test("delete-user rejects requests that target a different user id", async () => {
  supabaseAdmin.auth.getUser = async () => ({
    data: { user: { id: "user-1" } },
    error: null,
  });

  const app = loadApp();
  const response = await request(app)
    .post("/api/delete-user")
    .set("Authorization", "Bearer test-token")
    .send({ userId: "user-2" });

  assert.equal(response.status, 403);
  assert.equal(response.body.error, "You can only delete your own account");
});
