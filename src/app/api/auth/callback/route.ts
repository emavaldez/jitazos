// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?auth=error", request.url));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  // Intercambiar code por access_token
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/?auth=error", request.url));
  }

  // Guardar token en cookie (httpOnly para seguridad, pero el SDK lo necesita en cliente)
  // Usamos una cookie legible por JS para que el cliente pueda accederla
  const response = NextResponse.redirect(new URL("/?auth=ok", request.url));

  response.cookies.set("spotify_token", tokenData.access_token, {
    httpOnly: false, // necesario para que el SDK lo lea desde el cliente
      secure: true, // 👈 CLAVE EN VERCEL
    maxAge: tokenData.expires_in, // ~3600 segundos
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
    httpOnly: true,
      secure: true, // 👈 CLAVE EN VERCEL
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
    sameSite: "lax",
  });

  return response;
}
