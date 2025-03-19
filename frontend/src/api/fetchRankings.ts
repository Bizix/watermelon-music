import axios from "axios";
import { API_BASE_URL } from "../config";


interface Song {
  id: number;
  melon_song_id: number;
  movement: string;
  rank: number;
  title: string;
  artist: string;
  album: string;
  art: string;
  lyrics: string,
  youtube_url?: string;
  spotify_url?: string;
  genius_url?: string;
}

export async function fetchRankings(genreCode: string): Promise<Song[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rankings?genre=${genreCode}`);

    return response.data
      .map((song: Song) => ({
        ...song,
        rank: isNaN(Number(song.rank)) ? NaN : Number(song.rank),
      }))
      .filter((song: Song) => !isNaN(song.rank)) // ✅ Remove NaN-ranked songs immediately
      .sort((a: Song, b: Song) => a.rank - b.rank);
  } catch (error) {
    console.error("Error fetching rankings:", error);
    return [];
  }
}
