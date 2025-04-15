import { supabase } from "@/lib/supabaseClient";
import { toRaw } from "vue";

export async function fetchSongsByIds(ids: number[]) {
  if (!ids || ids.length === 0) return [];

  // Ensure it's a raw, plain array
  const rawIds = Array.isArray(ids) ? [...toRaw(ids)] : [];

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .in("id", rawIds);


  if (error) {
    console.error("❌ Failed to fetch songs by IDs:", error.message);
    throw new Error(error.message);
  }

  return data;
}
