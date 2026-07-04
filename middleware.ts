import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

// /hooks/* is intentionally excluded — that's the public ZeptoMail receiver,
// protected by its own unguessable per-domain token instead of a login.
export const config = {
  matcher: ["/((?!hooks|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
