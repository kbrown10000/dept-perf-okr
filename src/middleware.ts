/**
 * middleware.ts — Route protection middleware
 *
 * Copy to: src/middleware.ts (project root, next to src/)
 *
 * Intercepts requests and redirects unauthenticated users to the sign-in page.
 * Edit the `matcher` array to control which routes are protected.
 *
 * CUSTOMIZE: Update the matcher array for your app's route structure.
 */

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    /**
     * OPTION 1: Protect everything except auth routes and Next.js internals
     * This is the most common pattern — locks down the whole app.
     * Remove from the exclusion list any public routes your app needs.
     */
    "/((?!api/auth|auth/signin|auth/error|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",

    /**
     * OPTION 2: Protect specific route prefixes only
     * Uncomment and use this instead of Option 1 if you have public pages.
     */
    // "/dashboard/:path*",
    // "/admin/:path*",
    // "/api/protected/:path*",
    // "/settings/:path*",

    /**
     * OPTION 3: Protect API routes only (SPA with client-side auth checks)
     */
    // "/api/:path*",
  ],
};

/**
 * How redirection works:
 * - Unauthenticated requests → redirected to /auth/signin (or NextAuth default)
 * - After sign-in, NextAuth redirects back to the original URL
 * - If you're getting redirect loops, check that NEXTAUTH_URL matches your deployment URL
 */
