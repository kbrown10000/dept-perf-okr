"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/signin");
  }, [router]);
  return (
    <div className="min-h-screen bg-[#0a101e] flex items-center justify-center text-white">
      <p>Redirecting to sign in...</p>
    </div>
  );
}
