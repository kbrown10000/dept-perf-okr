/**
 * signin-page.tsx — Branded USDM sign-in page
 *
 * Copy to: src/app/auth/signin/page.tsx
 *
 * CUSTOMIZE:
 * - APP_NAME: Change to your app's name (shown on the sign-in card)
 * - APP_DESCRIPTION: Optional tagline shown under the title
 * - The USDM logo/branding stays consistent — don't change colors unless directed
 *
 * Colors used:
 * - Navy: #0a1628 (background, primary)
 * - Teal: #00a99d (accent, buttons)
 * - Gold: #f5a623 (highlights)
 * - White: #ffffff (text on dark)
 * - Light gray: #f0f4f8 (page background)
 */

import { signIn } from "@/lib/auth";

// CUSTOMIZE: Change these for your app
const APP_NAME = "Department Performance & OKR Platform";
const APP_DESCRIPTION = "Sign in with your USDM Microsoft account to access performance reviews, KPIs, and bonus recommendations.";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams.callbackUrl || "/";
  const error = searchParams.error;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #0a1628 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "20px",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(0, 169, 157, 0.08) 0%, transparent 50%), " +
            "radial-gradient(circle at 80% 20%, rgba(245, 166, 35, 0.05) 0%, transparent 40%)",
          pointerEvents: "none",
        }}
      />

      {/* Sign-in card */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* USDM logo area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #00a99d, #007a72)",
              borderRadius: "16px",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0, 169, 157, 0.3)",
            }}
          >
            {/* USDM "U" monogram */}
            <span
              style={{
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "-1px",
              }}
            >
              U
            </span>
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              letterSpacing: "-0.3px",
            }}
          >
            {APP_NAME}
          </h1>

          <p
            style={{
              color: "rgba(255, 255, 255, 0.55)",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {APP_DESCRIPTION}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#fca5a5",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {error === "OAuthSignin" && "Failed to start sign-in. Please try again."}
            {error === "OAuthCallback" && "Sign-in was cancelled or failed."}
            {error === "Configuration" && "Auth configuration error. Contact your admin."}
            {!["OAuthSignin", "OAuthCallback", "Configuration"].includes(error) &&
              "An error occurred during sign-in. Please try again."}
          </div>
        )}

        {/* Microsoft sign-in form */}
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              background: "linear-gradient(135deg, #00a99d 0%, #007a72 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              letterSpacing: "-0.1px",
              boxShadow: "0 4px 16px rgba(0, 169, 157, 0.35)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
          >
            {/* Microsoft logo SVG */}
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: "12px",
            lineHeight: "1.6",
          }}
        >
          <span>USDM Life Sciences employees only</span>
          <br />
          <span>
            Issues? Contact{" "}
            <a
              href="mailto:cwaltrip@usdm.com"
              style={{ color: "rgba(0, 169, 157, 0.7)", textDecoration: "none" }}
            >
              cwaltrip@usdm.com
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
