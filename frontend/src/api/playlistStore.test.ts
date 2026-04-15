import { beforeEach, describe, expect, it, vi } from "vitest";

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: supabaseMock,
}));

import {
  createPlaylistRecord,
  deletePlaylistRecord,
  fetchPlaylistSummaries,
  reorderPlaylistSongRecords,
} from "@/api/playlistStore";

function createSelectEqOrderResult(data: unknown, error: unknown = null) {
  return {
    eq: vi.fn(() => ({
      order: vi.fn(async () => ({ data, error })),
    })),
  };
}

function createSelectInOrderResult(data: unknown, error: unknown = null) {
  return {
    in: vi.fn(() => ({
      order: vi.fn(async () => ({ data, error })),
    })),
  };
}

describe("playlistStore", () => {
  beforeEach(() => {
    supabaseMock.auth.getSession.mockReset();
    supabaseMock.from.mockReset();
  });

  it("fetchPlaylistSummaries returns ordered song ids grouped by playlist", async () => {
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    supabaseMock.from
      .mockImplementationOnce(() => ({
        select: vi.fn(() =>
          createSelectEqOrderResult([
            {
              id: 12,
              user_id: "user-1",
              name: "Morning",
              created_at: "2026-04-15T00:00:00.000Z",
            },
            {
              id: 11,
              user_id: "user-1",
              name: "Evening",
              created_at: "2026-04-14T00:00:00.000Z",
            },
          ])
        ),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn(() =>
          createSelectInOrderResult([
            { playlist_id: 12, song_id: 3, position: 0 },
            { playlist_id: 12, song_id: 7, position: 1 },
            { playlist_id: 11, song_id: 4, position: 0 },
          ])
        ),
      }));

    const playlists = await fetchPlaylistSummaries();

    expect(playlists).toEqual([
      {
        id: 12,
        userId: "user-1",
        name: "Morning",
        created_at: "2026-04-15T00:00:00.000Z",
        songs: [3, 7],
      },
      {
        id: 11,
        userId: "user-1",
        name: "Evening",
        created_at: "2026-04-14T00:00:00.000Z",
        songs: [4],
      },
    ]);
  });

  it("createPlaylistRecord deduplicates names before insert", async () => {
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    supabaseMock.from
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: [{ name: "Roadtrip" }, { name: "Roadtrip (1)" }],
            error: null,
          })),
        })),
      }))
      .mockImplementationOnce(() => ({
        insert: vi.fn((rows) => {
          expect(rows).toEqual([{ user_id: "user-1", name: "Roadtrip (2)" }]);

          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: 55,
                  user_id: "user-1",
                  name: "Roadtrip (2)",
                  created_at: "2026-04-15T01:00:00.000Z",
                },
                error: null,
              })),
            })),
          };
        }),
      }));

    const playlist = await createPlaylistRecord("Roadtrip");

    expect(playlist).toEqual({
      id: 55,
      userId: "user-1",
      name: "Roadtrip (2)",
      created_at: "2026-04-15T01:00:00.000Z",
      songs: [],
    });
  });

  it("reorder and delete playlist operations write the expected Supabase mutations", async () => {
    const upsertSpy = vi.fn(async () => ({ error: null }));
    const eqSpy = vi.fn(async () => ({ error: null }));

    supabaseMock.from
      .mockImplementationOnce(() => ({
        upsert: upsertSpy,
      }))
      .mockImplementationOnce(() => ({
        delete: vi.fn(() => ({
          eq: eqSpy,
        })),
      }));

    await reorderPlaylistSongRecords(42, [9, 4, 7]);
    await deletePlaylistRecord(42);

    expect(upsertSpy).toHaveBeenCalledWith(
      [
        { playlist_id: 42, song_id: 9, position: 0 },
        { playlist_id: 42, song_id: 4, position: 1 },
        { playlist_id: 42, song_id: 7, position: 2 },
      ],
      { onConflict: "playlist_id,song_id" }
    );
    expect(eqSpy).toHaveBeenCalledWith("id", 42);
  });
});
