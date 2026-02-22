// src/app/api/songs/route.ts
import { getPlaylistTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // Definimos las búsquedas (queries) según la categoría
  const queries: Record<string, string> = {
    rock_arg: "rock argentino classics",
    rock_int: "classic rock 80s 90s",
    pop: "pop hits 2000s",
    punk: "punk rock essentials",
  };

  // Obtenemos la query correspondiente o una por defecto
  const searchQuery = queries[category || "rock_int"];

  try {
    // IMPORTANTE: Ahora pasamos la palabra clave, no un ID de playlist
    const tracks = await getPlaylistTracks(searchQuery);
    
    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ error: "No se encontraron canciones" }, { status: 404 });
    }

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error en la ruta API:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}