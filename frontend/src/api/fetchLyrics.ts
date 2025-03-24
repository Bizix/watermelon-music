import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

// ✅ Define a type for the lyrics response
interface LyricsResponse {
  lyrics: string;
}

/**
 * Fetches lyrics for a given song.
 *
 * @param title - The title of the song.
 * @param artist - The artist of the song.
 * @param songId - The unique song ID.
 * @param existingLyrics - Optional pre-existing lyrics (if available).
 * @returns A promise that resolves to the song's lyrics.
 */
export async function fetchLyrics(
  title: string,
  artist: string,
  songId: string | number,
  existingLyrics?: string
): Promise<string> {
  // Return the provided lyrics if available.
  if (existingLyrics) {
    return existingLyrics;
  }

  try {
    const response = await axios.get<LyricsResponse>(
      `${API_BASE_URL}/api/lyrics`,
      {
        params: { title, artist, songId },
      }
    );

    if (response.data.lyrics) {
      return response.data.lyrics;
    } else {
      throw new Error("No lyrics found");
    }
  } catch (error) {
    console.error("❌ Error fetching lyrics:", error);
    throw error;
  }
}
