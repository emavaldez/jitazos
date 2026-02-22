// src/app/api/auth/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('spotify_token')?.value;
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

  if (!token) {
    // Intentamos refrescar si hay refresh_token
    if (refreshToken) {
      const clientId = process.env.SPOTIFY_CLIENT_ID!;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await res.json();

      if (data.access_token) {
        const response = NextResponse.json({ access_token: data.access_token });
        response.cookies.set('spotify_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600,
          path: '/',
          sameSite: 'lax',
        });
        return response;
      }
    }
    return NextResponse.json({ access_token: null });
  }

  return NextResponse.json({ access_token: token });
}
