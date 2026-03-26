/**
 * route.ts — NextAuth.js API route handler
 *
 * Copy to: src/app/api/auth/[...nextauth]/route.ts
 *
 * This file is the catch-all route that handles all NextAuth endpoints:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET/POST /api/auth/callback/microsoft-entra-id
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 *
 * No customization needed here — just copy it as-is.
 * All configuration lives in src/lib/auth.ts.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
