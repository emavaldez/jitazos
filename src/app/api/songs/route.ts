// src/app/api/songs/route.ts
import { NextResponse } from "next/server";
import songsData from "@/data/songs.json";

export async function GET() {
  const songs = songsData as Array<{
    id: string;
    name: string;
    artist: string;
    year: number;
  }>;

  // Mezclamos al azar y devolvemos todas
  const shuffled = [...songs].sort(() => Math.random() - 0.5);

  return NextResponse.json(shuffled);
}
