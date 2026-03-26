/**
 * SessionProvider.tsx — Client-side session provider
 *
 * Copy to: src/components/SessionProvider.tsx
 *
 * Wraps the app so client components can access the session via useSession().
 * Must be added to root layout (src/app/layout.tsx).
 *
 * Usage in layout.tsx:
 *   import { SessionProvider } from "@/components/SessionProvider";
 *   <SessionProvider>{children}</SessionProvider>
 *
 * No customization needed — just copy and use.
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
