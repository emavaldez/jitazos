// src/lib/spotify.ts

export async function getPlaylistTracks(category: string) {
  const clientID = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // 1. Obtener Token (Client Credentials es suficiente para Search)
  const auth = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${clientID}:${clientSecret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });
  
  const { access_token } = await auth.json();

  // 2. Usar el endpoint de Search que probamos en Postman
  // Agregamos %20year:1970-2023 para que traiga hits con años variados
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(category)}%20year:1970-2025&type=track&limit=10`, 
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  
  const data = await res.json();

  if (!data.tracks) {
    console.error("Error en la respuesta de búsqueda:", data);
    return [];
  }

  // 3. Mapear los resultados (fíjate que ahora cuelgan de data.tracks.items)
  return data.tracks.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    year: new Date(track.album.release_date).getFullYear(),
    popularity: track.popularity,
    uri: track.uri,
  })).filter((t: any) => t.year > 0); // Limpiamos tracks sin fecha válida
}