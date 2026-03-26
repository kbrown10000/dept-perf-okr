import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // If not authenticated, redirect to sign-in
  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|auth/error|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
