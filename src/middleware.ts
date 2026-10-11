import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/tutor",
    "/summarizer",
    "/quizzes",
    "/flashcards",
    "/planner",
    "/library",
    "/progress",
    "/settings",
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get("studymate_session");
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tutor/:path*",
    "/summarizer/:path*",
    "/quizzes/:path*",
    "/flashcards/:path*",
    "/planner/:path*",
    "/library/:path*",
    "/progress/:path*",
    "/settings/:path*",
  ],
};
