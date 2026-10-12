import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Saat build di Docker (NEXT_OUTPUT_STANDALONE=1) hasil build dibuat
  // "standalone" agar image produksi kecil. Di Vercel/tanpa flag ini,
  // konfigurasi tetap default.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1"
    ? { output: "standalone" as const }
    : {}),
};

export default nextConfig;
