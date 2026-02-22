// src/lib/spotify.ts

export async function getPlaylistTracks(category: string, limit = 20) {
  const clientID = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const auth = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${clientID}:${clientSecret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const { access_token } = await auth.json();

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(category)}%20year:1960-2025&type=track&limit=${Math.min(limit, 50)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const data = await res.json();

  if (!data.tracks) {
    console.error("Error en búsqueda:", data);
    return [];
  }

  return data.tracks.items
    .map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      year: new Date(track.album.release_date).getFullYear(),
      popularity: track.popularity,
      uri: track.uri,
    }))
    .filter((t: any) => t.year > 0);
}
