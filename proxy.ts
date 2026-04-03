import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://vouchapi.com",
  "https://www.vouchapi.com",
  "https://app.vouchapi.com",
  "https://pillrcare.com",
  "https://www.pillrcare.com",
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
];

export async function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isPasskeyRoute = request.nextUrl.pathname.startsWith("/api/passkey/");
  const isAllowedOrigin = origin !== null && ALLOWED_ORIGINS.includes(origin);

  // Handle CORS preflight for passkey routes
  if (isPasskeyRoute && isAllowedOrigin && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = await updateSession(request);

  if (isPasskeyRoute && isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
