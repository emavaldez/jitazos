// src/app/api/songs/route.ts
import { getPlaylistTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Puede venir una lista separada por coma: "rock_int,pop"
  const categoriesParam = searchParams.get("category") || "rock_int";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const queries: Record<string, string> = {
    rock_arg: "rock argentino classics",
    rock_int: "classic rock 80s 90s",
    pop: "pop hits 2000s",
    punk: "punk rock essentials",
  };

  const categories = categoriesParam.split(",").filter(Boolean);

  try {
    // Fetch de cada género seleccionado en paralelo
    const allTracksNested = await Promise.all(
      categories.map((cat) => {
        const q = queries[cat.trim()] || queries.rock_int;
        return getPlaylistTracks(q, Math.ceil(limit / categories.length) + 5);
      })
    );

    // Combinar, deduplicar por id y mezclar
    const seen = new Set<string>();
    const merged = allTracksNested.flat().filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    const shuffled = merged.sort(() => Math.random() - 0.5).slice(0, limit + 5);

    if (shuffled.length === 0) {
      return NextResponse.json({ error: "No se encontraron canciones" }, { status: 404 });
    }

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error("Error en la ruta API:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
