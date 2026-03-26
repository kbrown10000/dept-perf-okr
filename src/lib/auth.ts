/**
 * auth.ts — NextAuth.js v5 configuration for USDM Microsoft Entra ID SSO
 *
 * Copy to: src/lib/auth.ts
 *
 * This file configures authentication using the USDM Azure AD app registration.
 * All USDM employees can sign in with their @usdm.com Microsoft accounts.
 *
 * Customize:
 * - Add callbacks if you need to store extra user data (e.g., roles, department)
 * - Add session.user type extensions below if you need custom fields
 * - The pages config points to the branded sign-in page — keep it or remove for default
 */

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],

  // Custom pages — points to the branded USDM sign-in page
  // Remove this block to use NextAuth's default sign-in page
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Show errors on the sign-in page
  },

  callbacks: {
    /**
     * JWT callback — runs whenever a JWT is created or updated
     * Add extra fields here to persist them in the token
     */
    async jwt({ token, account, profile }) {
      // On initial sign-in, persist the Microsoft account data
      if (account && profile) {
        token.accessToken = account.access_token;
        // Microsoft-specific fields (available from Entra ID profile)
        // token.oid = profile.oid;           // Object ID (unique per user)
        // token.tid = profile.tid;           // Tenant ID
        // token.jobTitle = profile.job_title;
        // token.department = profile.department;
      }
      return token;
    },

    /**
     * Session callback — shapes the session object exposed to the app
     * Only expose what you need — don't leak the full JWT
     */
    async session({ session, token }) {
      // Add token fields to the session if needed
      // session.user.id = token.sub as string;
      // session.accessToken = token.accessToken as string;
      return session;
    },
  },

  // Optional: enable debug logging in development
  // debug: process.env.NODE_ENV === "development",
});

/**
 * TypeScript type extensions — uncomment and customize if you add extra fields
 *
 * declare module "next-auth" {
 *   interface Session {
 *     accessToken?: string;
 *     user: {
 *       id: string;
 *       name: string;
 *       email: string;
 *       image: string;
 *       jobTitle?: string;
 *       department?: string;
 *     };
 *   }
 * }
 */
